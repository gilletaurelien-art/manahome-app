// Dépôt d'annonce réel — validation pure et empreinte, testées.
//
// ⭐ L'EMPREINTE (001) : « champs à figer avec Aurélien avant activation
// import ». L'import est éteint ; pour les dépôts DIRECTS, la voici, V1 :
// sha256 des champs normalisés (type, offre, prix, surface, pièces, commune,
// description trimée). Toute évolution AVANT l'activation de l'import devra
// figer cette liste avec Aurélien — le commentaire de la 001 l'exige.
//
// 🛑 AUCUN MONTANT DE RÉSERVATION : prix_eur est le prix de vente ou le loyer
// mensuel, tarif_nuit le tarif affiché — des informations d'annonce, jamais
// des flux (doctrine : le paiement vit chez le PSP de l'hôte).

import { createHash } from "node:crypto";

const TYPES = new Set(["maison", "appartement", "terrain", "autre"]);
const OFFRES = new Set(["vente", "location_courte_duree"]);
const DPE = new Set(["A", "B", "C", "D", "E", "F", "G", "NC"]);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const CHAMPS_EMPREINTE = [
  "type_bien", "offre", "prix_eur", "tarif_nuit",
  "surface_m2", "pieces", "code_insee", "description",
];

/** L'empreinte V1 des dépôts directs — normalisée puis hachée. */
export function empreinteDepot(valeurs) {
  const normalise = CHAMPS_EMPREINTE.map((c) => {
    const v = valeurs[c];
    if (v == null) return "";
    return String(v).trim().toLowerCase().replace(/\s+/g, " ");
  });
  return createHash("sha256").update(normalise.join("\x1f")).digest("hex");
}

/**
 * Valide le corps d'un dépôt. Refus en PHRASES, chaque cas tranché :
 * une annonce est une information publique, elle ne se pose pas à moitié.
 */
export function validerDepot(c) {
  if (!c || typeof c !== "object") return { ok: false, erreur: "annonce invalide" };
  if (!TYPES.has(c.type_bien)) return { ok: false, erreur: "type de bien invalide" };
  if (!OFFRES.has(c.offre)) return { ok: false, erreur: "offre invalide" };

  const valeurs = {
    type_bien: c.type_bien,
    offre: c.offre,
    // location courte durée : le prix affiché est le tarif/nuit
    prix_eur: c.offre === "vente" ? posOuNull(c.prix_eur) : null,
    tarif_nuit: c.offre === "location_courte_duree" ? posOuNull(c.tarif_nuit) : null,
    surface_m2: posOuNull(c.surface_m2),
    pieces: c.pieces == null ? null : Number(c.pieces),
    dpe: c.dpe && DPE.has(c.dpe) ? c.dpe : null,
    description: typeof c.description === "string" ? c.description.slice(0, 5000) : "",
    capacite: posOuNull(c.capacite),
    code_insee: typeof c.code_insee === "string" && /^\d{5}$/.test(c.code_insee) ? c.code_insee : null,
  };

  if (c.offre === "vente" && valeurs.prix_eur == null) {
    return { ok: false, erreur: "prix de vente requis" };
  }
  if (c.offre === "location_courte_duree" && valeurs.tarif_nuit == null) {
    return { ok: false, erreur: "tarif par nuit requis" };
  }
  if (valeurs.pieces != null && (!Number.isInteger(valeurs.pieces) || valeurs.pieces < 0)) {
    return { ok: false, erreur: "nombre de pièces invalide" };
  }
  if (valeurs.description.trim().length === 0) {
    return { ok: false, erreur: "description requise" };
  }
  return { ok: true, valeurs, empreinte: empreinteDepot(valeurs) };
}

function posOuNull(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Une date ISO existe-t-elle vraiment (le 13e mois n'en est pas une) ? */
export function dateReelle(iso) {
  if (!ISO.test(iso)) return false;
  const [a, m, j] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j;
}

/** Valide un justificatif (007 : type documenté, référence posée). */
const TYPES_JUSTIFICATIF = new Set(["attestation_assurance", "dpe", "declaration_meuble"]);
export function validerJustificatif(c) {
  if (!c || typeof c !== "object" || !TYPES_JUSTIFICATIF.has(c.type_document)) {
    return { ok: false, erreur: "type de justificatif invalide" };
  }
  if (typeof c.reference !== "string" || c.reference.trim().length < 3) {
    return { ok: false, erreur: "référence requise" };
  }
  for (const d of [c.delivre_le, c.expire_le]) {
    if (d != null && !(typeof d === "string" && dateReelle(d))) {
      return { ok: false, erreur: "date invalide" };
    }
  }
  return {
    ok: true,
    valeurs: {
      type_document: c.type_document,
      reference: c.reference.trim().slice(0, 200),
      delivre_le: c.delivre_le || null,
      expire_le: c.expire_le || null,
    },
  };
}

/** Traduit un refus du verrou de publication (trigger 007) en phrase. */
export function phraseRefusPublication(message) {
  if (message.includes("declaration meuble")) {
    return "Numéro de déclaration de meublé touristique requis pour publier.";
  }
  if (message.includes("assurance")) {
    return "Attestation d'assurance valide requise pour publier.";
  }
  if (message.includes("DPE")) {
    return "DPE requis pour publier.";
  }
  return "Publication refusée — des éléments manquent.";
}
