// Disponibilité d'une annonce sur une plage de dates — miroir front de la
// fonction SQL `est_disponible(annonce, arrivee, depart)` (migration 007).
//
// ⭐ TROIS RÈGLES QUI SONT LA MÊME QU'EN BASE.
// 1. LE BORD DE DÉPART EST EXCLU : du 4 au 7 = les nuits 4, 5, 6. Un séjour
//    qui arrive le 7 ne demande pas la nuit du 6 — la sémantique de
//    `est_disponible` (nuit >= arrivee AND nuit < depart) et celle du
//    calendrier propriétaire doivent raconter LA MÊME HISTOIRE, sinon une
//    nuitée apparaît disponible chez le voyageur et bloquée chez l'hôte.
// 2. PAS DE DATES = PAS DE FILTRE : une recherche sans plage ne doit pas
//    exclure une annonce pour indisponibilité. Le vide n'est pas une date.
// 3. UNE DATE INVALIDE N'EST PAS « INDISPONIBLE » : filtrer sur un non-sens
//    cacherait des annonces pour une faute de frappe. On refuse de filtrer.

import { estNuitValide, nuiteesDe } from "./calendrierDonnees";

export interface Plage {
  arrivee: string;
  depart: string;
}

/** La plage est-elle posée et cohérente (deux dates valides, départ > arrivée) ? */
export function plageValide({ arrivee, depart }: Plage): boolean {
  return (
    arrivee !== "" &&
    depart !== "" &&
    estNuitValide(arrivee) &&
    estNuitValide(depart) &&
    depart > arrivee
  );
}

/** L'annonce est-elle disponible sur la plage ? Vrai quand la plage est vide. */
export function estDisponible(
  nuitsBloquees: readonly string[],
  plage: Plage
): boolean {
  if (!plageValide(plage)) return true;
  const bloquees = new Set(nuitsBloquees);
  return nuiteesDe(plage.arrivee, plage.depart).every((n) => !bloquees.has(n));
}

/** Le libellé lisible de la plage : « du 4 nov. au 7 nov. 2026 » (ou null). */
export function libellePlage(
  { arrivee, depart }: Plage,
  moisCourts: readonly string[]
): string | null {
  if (!plageValide({ arrivee, depart })) return null;
  const f = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return `${d.getDate()} ${moisCourts[d.getMonth()]}`;
  };
  return `${f(arrivee)} → ${f(depart)}`;
}
