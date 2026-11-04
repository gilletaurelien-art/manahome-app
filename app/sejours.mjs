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

/**
 * Le SQL d'un geste du cycle. Pure et testée : l'ordre WHERE puis RETURNING
 * est une contrainte de grammaire PostgreSQL — la première version de ces
 * UPDATE plaçait RETURNING AVANT le WHERE, syntaxe invalide que la fumée
 * sans base ne voyait pas. Depuis, le test garantit l'ordre.
 */
export function sqlDuGeste(geste) {
  const PROPRIETAIRE = `EXISTS (SELECT 1 FROM annonces a
                                 WHERE a.id = sejours.annonce_id
                                   AND a.proprietaire = auth.uid())`;
  if (geste === "accepter") {
    return {
      sql: `UPDATE sejours SET statut = 'acceptee'
            WHERE id = $1 AND statut = 'demande_envoyee'
              AND ${PROPRIETAIRE}
            RETURNING statut`,
    };
  }
  if (geste === "confirmer") {
    // le trigger de la 007 bloque les nuitées ici — ou refuse :
    // c'est LUI le garant anti-double-réservation
    return {
      sql: `UPDATE sejours SET statut = 'confirmee',
                 conditions = conditions || jsonb_build_object('confirme_le', now()::text)
            WHERE id = $1 AND statut IN ('acceptee', 'paiement_attendu')
              AND ${PROPRIETAIRE}
            RETURNING statut`,
    };
  }
  if (geste === "annuler") {
    // le trigger libère les nuitées posées par ce séjour (cause ciblée) —
    // les blocages manuels de l'hôte restent
    return {
      sql: `UPDATE sejours SET statut = 'annulee'
            WHERE id = $1 AND statut NOT IN ('annulee', 'cloturee')
              AND (voyageur = auth.uid() OR ${PROPRIETAIRE})
            RETURNING statut`,
    };
  }
  if (geste === "cloturer") {
    return {
      sql: `UPDATE sejours SET statut = 'cloturee'
            WHERE id = $1 AND statut = 'confirmee'
              AND ${PROPRIETAIRE}
            RETURNING statut`,
    };
  }
  return null;
}
