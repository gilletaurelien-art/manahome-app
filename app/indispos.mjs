// Nuitées d'indisponibilité — validation et remplacement d'ensemble.
//
// ⭐ LE REPLACEMENT EST ATOMIQUE ET COMPLET : le PUT remplace L'ENSEMBLE des
// nuitées bloquées (pas un patch partiel) — c'est le contrat le plus sûr
// pour un calendrier : le client envoie ce qu'il voit, la base reflète ce
// qui est envoyé. Un delta mal calculé côté client transformerait un
// déblocage oublié en nuitée fantôme.
//
// Les dates sont validées avec LA MÊME règle que le front
// (src/calendrierDonnees.ts : ISO, date réelle, jamais une heure locale).
// Le service n'importe pas le module TS (runtime Node) : la règle est
// redéclarée ici, testée des deux côtés — quand l'une change, l'autre
// doit suivre, les deux suites l'exigent.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Une nuitée ISO existe-t-elle vraiment (30 février = non) ? */
export function estNuitValide(n) {
  if (typeof n !== "string" || !ISO.test(n)) return false;
  const [a, m, j] = n.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j;
}

/**
 * Trie les nuitées reçues en { valides, invalides }.
 * ⚠️ le refus n'est JAMAIS silencieux côté appelant : des invalides sans
 * erreur 400 = un calendrier qui ment sur ce qu'il a enregistré.
 */
export function trierNuits(liste) {
  const valides = new Set();
  const invalides = [];
  for (const n of Array.isArray(liste) ? liste : []) {
    if (estNuitValide(n)) valides.add(n);
    else invalides.push(n);
  }
  return { valides: [...valides].sort(), invalides };
}

/**
 * Le delta entre l'ensemble en place et l'ensemble voulu :
 * { aPoser, aRetirer } — ce que la transaction insère et supprime.
 * Pure, testée : c'est ici que se joue « débloquer une nuit oubliée ».
 */
export function delta(enPlace, voulues) {
  const ancien = new Set(enPlace);
  const neuf = new Set(voulues);
  const aPoser = [...neuf].filter((n) => !ancien.has(n));
  const aRetirer = [...ancien].filter((n) => !neuf.has(n));
  return { aPoser, aRetirer };
}
