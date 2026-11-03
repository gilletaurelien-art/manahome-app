// Le cycle du séjour côté serveur — chantier 4.
//
// ⭐ LA BASE DÉCIDE, L'API TRADUIT. Le refus de double réservation vit dans
// la contrainte d'exclusion GiST et le trigger de la 007 ; le verrou de
// statut vit dans les UPDATE ... WHERE statut = '...' (zéro ligne affectée
// = transition interdite). Ce module ne RE-teste RIEN que la base garantit
// déjà : deux garants, c'est un garant de trop. Il traduit les exceptions
// PostgreSQL en statuts HTTP.
//
// Garde produit : aucun montant n'est écrit ni lu comme un flux — le devis
// (sejours.conditions) est une information figée, le paiement vit chez le
// PSP de l'hôte.

import { estNuitValide } from "./indispos.mjs";

/** Une demande de séjour est-elle posée et cohérente ? */
export function validerDemande({ annonceId, arrivee, depart, voyageursNb }) {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof annonceId !== "string" || !UUID.test(annonceId)) {
    return { ok: false, erreur: "annonce invalide" };
  }
  if (!estNuitValide(arrivee) || !estNuitValide(depart) || depart <= arrivee) {
    return { ok: false, erreur: "dates invalides" };
  }
  if (!Number.isInteger(voyageursNb) || voyageursNb < 1) {
    return { ok: false, erreur: "voyageurs invalides" };
  }
  return { ok: true };
}

/**
 * Le statut HTTP et le message d'une erreur PostgreSQL de séjour.
 * Chaque erreur brute qui atteindrait l'écran serait un défaut : ici,
 * chaque cas a sa phrase.
 */
export function traduireErreurSejour(e) {
  // index unique (annonce, voyageur, arrivée) hors annulées : la base
  // parle la première, on traduit sans rien révéler d'autre
  if (e?.code === "23505") {
    return { statut: 409, erreur: "demande déjà en cours" };
  }
  // le trigger de la 007 refuse la confirmation sur des nuitées bloquées :
  // c'est LUI le garant anti-double-réservation, pas l'API
  if (String(e?.message ?? "").includes("nuitees deja bloquees")) {
    return { statut: 409, erreur: "double réservation refusée" };
  }
  return null;
}

/** La mutation a-t-elle réellement eu lieu ? Zéro ligne = transition interdite. */
export function traduireTransition(rowCount) {
  if (rowCount === 0) {
    return { statut: 409, erreur: "transition non permise" };
  }
  return null;
}
