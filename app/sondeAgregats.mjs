// La sonde MANAtimebank — les agrégats publics.
//
// I7 : publication d'agrégats n<5 interdite. Le plancher est appliqué ICI,
// en pur, à l'image de `v_agregats_territoire()` en SQL — la fonction SQL
// et cette fonction DOIVENT produire le même résultat (règle des miroirs,
// docs/branchement-back.md).
//
// I5 : aucune fonction de ce fichier ne trie, ne compare ni ne classe des
// PERSONNES — seulement des cellules (territoire, jour, dimension), qui ne
// nomment jamais personne.

const SEUIL_MIN = 5;

/** Filtre les cellules dont le nombre d'événements distincts est < 5. */
export function filtrerAgregats(cellules, seuil = SEUIL_MIN) {
  return cellules.filter((c) => c.evenements >= seuil);
}
