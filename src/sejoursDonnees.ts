// Séjours démo (localStorage) — miroir front de la table `sejours`
// (migration 007) et de son trigger `verrouille_nuitees_sejour`.
//
// ⭐ TROIS GARDES REPRISSES TELLES QUELLES DE LA BASE.
// 1. LE CYCLE SEULEMENT : demande_envoyee → acceptee → paiement_attendu →
//    confirmee → cloturee (ou annulee). Aucun statut inventé, aucun
//    raccourci : le voyageur voit où en est son séjour, l'hôte voit ce
//    qu'il lui reste à faire.
// 2. LA CONFIRMATION BLOQUE, L'ANNULATION LIBÈRE — ET SEULEMENT CE QUE LE
//    SÉJOUR A BLOQUÉ : on mémorise les nuitées posées par CE séjour ; les
//    libérer ne doit jamais toucher un blocage manuel de l'hôte. Miroir
//    de la cause 'reservation_confirmee' en base.
// 3. ANTI-DOUBLE-RÉSERVATION : une confirmation sur des nuitées déjà
//    bloquées est REFUSÉE — miroir de la contrainte d'exclusion GiST.
//    Le garant est dans la donnée, pas dans l'interface.
// 4. (et la règle du produit) CE CYCLE N'ENCAISSE RIEN : aucun montant
//    n'est stocké comme un flux à nous, le paiement vit chez le PSP de
//    l'hôte. Le champ conditions fige le devis, c'est une information,
//    jamais une créance.

import {
  bloquerPlage,
  lireIndispos,
  nuiteesDe,
  estNuitValide,
} from "./calendrierDonnees";
import { estDisponible } from "./disponibilite";

const CLE = "manahome-sejours-demo";

export type StatutSejour =
  | "demande_envoyee"
  | "acceptee"
  | "paiement_attendu"
  | "confirmee"
  | "annulee"
  | "cloturee";

export interface Sejour {
  id: string;
  annonceId: string;
  annonceTitre: string;
  arrivee: string;
  depart: string;
  voyageursNb: number;
  mode: "demande" | "immediate";
  statut: StatutSejour;
  // le devis figé à la confirmation — une information, jamais une créance
  conditions: Record<string, unknown>;
  // les nuitées bloquées PAR CE séjour : l'annulation ne libère que celles-là
  nuitsBloquees: string[];
  createdAt: string;
}

function lireStock(): Sejour[] {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return [];
    const parse = JSON.parse(brut);
    return Array.isArray(parse) ? (parse as Sejour[]) : [];
  } catch {
    return [];
  }
}

function ecrireStock(sejours: Sejour[]): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(sejours));
  } catch {
    // même doctrine que le reste : la démo continue en lecture
  }
}

export function lireSejours(): Sejour[] {
  return lireStock().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function sejourSurAnnonce(annonceId: string): Sejour | undefined {
  // miroir de l'index unique (annonce, voyageur, arrivée) : ici, un seul
  // séjour actif par annonce — une nouvelle demande n'écrase pas l'historique
  return lireStock().find(
    (s) => s.annonceId === annonceId && s.statut !== "annulee" && s.statut !== "cloturee"
  );
}

export interface ResultatDemande {
  ok: boolean;
  sejour?: Sejour;
  erreur?: string;
}

/** Le voyageur demande un séjour — refuse dates invalides ou nuitées bloquées. */
export function demanderSejour(entree: {
  annonceId: string;
  annonceTitre: string;
  arrivee: string;
  depart: string;
  voyageursNb: number;
  tarifNuit?: number;
}): ResultatDemande {
  const { annonceId, annonceTitre, arrivee, depart, voyageursNb } = entree;
  if (!estNuitValide(arrivee) || !estNuitValide(depart) || depart <= arrivee) {
    return { ok: false, erreur: "dates invalides" };
  }
  if (voyageursNb < 1) return { ok: false, erreur: "voyageurs invalides" };
  const nuits = nuiteesDe(arrivee, depart);
  if (!estDisponible(lireIndispos(annonceId), { arrivee, depart })) {
    return { ok: false, erreur: "nuitées bloquées" };
  }
  if (sejourSurAnnonce(annonceId)) {
    // miroir de l'unicité : une demande à la fois par annonce
    return { ok: false, erreur: "demande déjà en cours" };
  }
  const nbNuits = nuits.length;
  const sejour: Sejour = {
    id: `sejour-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    annonceId,
    annonceTitre,
    arrivee,
    depart,
    voyageursNb,
    mode: "demande",
    statut: "demande_envoyee",
    conditions: {
      nbNuits,
      ...(entree.tarifNuit
        ? { tarifNuit: entree.tarifNuit, total: entree.tarifNuit * nbNuits }
        : {}),
      // le paiement vit chez le PSP de l'hôte — ici, rien à encaisser
      paiement: "direct_hote",
    },
    nuitsBloquees: [],
    createdAt: new Date().toISOString(),
  };
  const stock = lireStock();
  stock.push(sejour);
  ecrireStock(stock);
  return { ok: true, sejour };
}

/** L'hôte accepte puis attend le paiement — rien ne se bloque encore. */
export function accepterSejour(id: string): Sejour | undefined {
  const stock = lireStock();
  const s = stock.find((x) => x.id === id);
  if (!s || s.statut !== "demande_envoyee") return undefined;
  s.statut = "acceptee";
  ecrireStock(stock);
  return s;
}

/**
 * La confirmation : conditions figées + blocage des nuitées.
 * Miroir du trigger et de la contrainte d'exclusion — refuse si une
 * nuitée de la plage est déjà bloquée. Nuit de départ exclue.
 */
export function confirmerSejour(id: string): { ok: boolean; sejour?: Sejour; erreur?: string } {
  const stock = lireStock();
  const s = stock.find((x) => x.id === id);
  if (!s || (s.statut !== "acceptee" && s.statut !== "paiement_attendu")) {
    return { ok: false, erreur: "statut non confirmable" };
  }
  const nuits = nuiteesDe(s.arrivee, s.depart);
  const dejaBloquees = lireIndispos(s.annonceId);
  if (!estDisponible(dejaBloquees, { arrivee: s.arrivee, depart: s.depart })) {
    return { ok: false, erreur: "double réservation refusée" };
  }
  // FIGER les conditions avant de bloquer : ce que la confirmation
  // accepte doit être ce que la demande a dit — pas l'état du jour.
  s.conditions = { ...s.conditions, confirmeLe: new Date().toISOString() };
  s.statut = "confirmee";
  bloquerPlage(s.annonceId, nuits);
  s.nuitsBloquees = nuits;
  ecrireStock(stock);
  return { ok: true, sejour: s };
}

/** L'annulation libère UNIQUEMENT les nuitées posées par ce séjour. */
export function annulerSejour(id: string): Sejour | undefined {
  const stock = lireStock();
  const s = stock.find((x) => x.id === id);
  if (!s || s.statut === "annulee" || s.statut === "cloturee") return undefined;
  if (s.statut === "confirmee" && s.nuitsBloquees.length > 0) {
    // libérer SEULEMENT les nuitées posées par ce séjour : les blocages
    // manuels de l'hôte restent — retrait ciblé, jamais un vidage.
    reecrireIndispos(
      s.annonceId,
      lireIndispos(s.annonceId).filter((n) => !s.nuitsBloquees.includes(n))
    );
  }
  s.statut = "annulee";
  ecrireStock(stock);
  return s;
}

/** Clôturer un séjour confirmé (départ passé) — les blocages restent (passé). */
export function cloreSejour(id: string): Sejour | undefined {
  const stock = lireStock();
  const s = stock.find((x) => x.id === id);
  if (!s || s.statut !== "confirmee") return undefined;
  s.statut = "cloturee";
  ecrireStock(stock);
  return s;
}

// réécriture bas niveau : la seule façon sûre de RETIRER des nuitées sans
// toucher aux autres. Copie locale du geste d'écriture (même clé, même
// format) — jamais de second format de stockage.
function reecrireIndispos(id: string, nuits: string[]): void {
  try {
    const brut = localStorage.getItem("manahome-indispos-demo");
    const tout = brut ? (JSON.parse(brut) as Record<string, string[]>) : {};
    if (nuits.length === 0) delete tout[id];
    else tout[id] = [...nuits].sort();
    localStorage.setItem("manahome-indispos-demo", JSON.stringify(tout));
  } catch {
    // même doctrine : la démo continue en lecture
  }
}
