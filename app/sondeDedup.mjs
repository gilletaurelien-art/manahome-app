// La sonde MANAtimebank — dédup et registre véridique.
//
// L'agrégat du territoire compte l'ÉVÉNEMENT, pas la frappe (cahier §1,
// règle arithmétique v0.3) : 1 h donnée = 3 600 s dans « temps donné du
// territoire », pas 7 200 — les deux faces sont deux vues du même
// passage. Ce module fait ce calcul en pur, à l'image de la vue SQL
// `v_invariant_public`, pour qu'il soit testable sans base.

/**
 * Regroupe des lignes {empreinteFait, face, dureeS} par empreinte et
 * calcule Σ émis / Σ reçu — l'invariant public (cahier §1, « Σ émis = Σ
 * reçu »).
 */
export function invariantParEmpreinte(lignes) {
  const parEmpreinte = new Map();
  for (const l of lignes) {
    const courant = parEmpreinte.get(l.empreinteFait) ?? { emisS: 0, recuS: 0 };
    if (l.face === "don") courant.emisS += l.dureeS;
    if (l.face === "reception") courant.recuS += l.dureeS;
    parEmpreinte.set(l.empreinteFait, courant);
  }
  return parEmpreinte;
}

/** Vrai si CHAQUE empreinte vérifie Σ émis = Σ reçu — l'audit en un mot. */
export function invariantTient(lignes) {
  const parEmpreinte = invariantParEmpreinte(lignes);
  for (const { emisS, recuS } of parEmpreinte.values()) {
    if (emisS !== recuS) return false;
  }
  return true;
}

/**
 * Un seul fait = une seule entrée dans l'agrégat du territoire, quel que
 * soit le nombre de témoignages (deux faces d'un même geste, ou deux
 * témoignages indépendants du même fait — même empreinte).
 */
export function evenementsDistincts(lignes) {
  return new Set(lignes.map((l) => l.empreinteFait)).size;
}
