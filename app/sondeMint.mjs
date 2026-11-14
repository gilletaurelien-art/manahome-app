// La sonde MANAtimebank — le mint (frappe double) et la dotation.
//
// ⚠️ LA DOTATION N'EXISTE PAS EN BASE (I3). Les trois fonctions
// descriptives ci-dessous sont un calcul pur à partir d'une date : aucune
// ne lit quoi que ce soit, aucune n'est appelée par le service pour
// décider d'un accès, d'un droit ou d'un affichage conditionnel. Une
// table serait une tentation de solde (cahier §1 « la dotation »).

import { empreinteFait } from "./sondeEmpreinte.mjs";

export const DOTATION_PAR_JOUR_S = 86_400; // 1 MANA = 1 seconde, 24h/jour
const DIMENSIONS = Object.freeze([
  "temps_humain", "solidarite", "ecologie",
  "regeneration", "equite_temporelle", "durabilite",
]);

/** Le rendement quotidien affiché — jamais une lecture de base (I3). */
export function dotationDuJour() {
  return DOTATION_PAR_JOUR_S;
}

/** Dénominateur descriptif : secondes écoulées depuis une date, pur. */
export function secondesDepuis(dateIso, maintenant = new Date()) {
  const depart = new Date(dateIso).getTime();
  const s = Math.floor((maintenant.getTime() - depart) / 1000);
  return Math.max(0, s);
}

/** Horizon des agrégats : population × dotation/jour — purement descriptif. */
export function horizonAgregats(population) {
  return Math.max(0, Math.floor(population)) * DOTATION_PAR_JOUR_S;
}

/**
 * Valide un geste de don avant frappe. Le motif (I6) n'est JAMAIS
 * obligatoire : une consignation sans dimension ni texte doit réussir.
 */
export function validerGeste({ dureeS, dimension, motLibre }) {
  const duree = Number(dureeS);
  if (!Number.isInteger(duree) || duree <= 0) {
    return { ok: false, erreur: "durée invalide" };
  }
  if (duree % 60 !== 0) {
    return { ok: false, erreur: "la durée s'arrondit à la minute — pas de fausse précision" };
  }
  if (dimension != null && !DIMENSIONS.includes(dimension)) {
    return { ok: false, erreur: "dimension inconnue" };
  }
  if (motLibre != null && String(motLibre).length > 2000) {
    return { ok: false, erreur: "mot libre trop long" };
  }
  return { ok: true, valeurs: { dureeS: duree, dimension: dimension ?? null, motLibre: motLibre ?? null } };
}

/**
 * La frappe double elle-même (I1) : DEUX lignes, une seule transaction,
 * aucune ne circule. Retourne les deux jeux de paramètres prêts pour deux
 * INSERT — jamais un UPDATE qui débite. Aucune fonction de ce fichier ne
 * s'appelle "transferer" : déplacer du MANA entre deux personnes est un
 * bug, pas une feature (I1, cahier « le transfert »).
 */
export function frapperDon({ aDonne, aRecu, dureeS, jour, dimension, motLibre, declarePar }) {
  const empreinte = empreinteFait({ aDonne, aRecu, dureeS, jour });
  const commun = { empreinteFait: empreinte, aDonne, aRecu: aRecu ?? null, dureeS, jour, dimension: dimension ?? null, motLibre: motLibre ?? null, declarePar };
  return {
    empreinteFait: empreinte,
    faceDon: { ...commun, face: "don" },
    faceReception: { ...commun, face: "reception" },
  };
}
