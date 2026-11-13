// Les événements de preuve du séjour — chantier 4, « contrat et documents
// horodatés » (docs/pivot-location.md).
//
// ⭐ LA PREUVE REMPLACE LE SÉQUESTRE : la confiance de la location ne demande
// pas de garder l'argent, elle demande des faits vérifiables et horodatés.
// Ce module pose ces faits. Deux garants vivent en base et nullement ici :
// le trigger fige_evenement (007) interdit TOUTE réécriture d'un événement,
// et son horodatage est un DEFAULT now() — l'horodatage appartient à la
// preuve, le client n'en fournit JAMAIS un. Ce module ne fait que traduire
// et refuser l'invraisemblable avant d'atteindre la base.
//
// Garde produit : 'contrat_signe' est l'unique type posable par l'API libre.
// Les états des lieux existent en base pour l'offre gestionnaire (Sérénité,
// docs/modele-economique.md) — ils ne se donnent pas ici, et aucun verrou
// de ce module ne lira jamais une donnée d'abonnement.

/** Le miroir exact du CHECK de la 007 — la base parle la dernière. */
export const TYPES_EVENEMENT = [
  "contrat_signe",
  "etat_des_lieux_entree",
  "etat_des_lieux_sortie",
];

/** L'unique type que l'API libre accepte de poser (voir garde produit). */
export const TYPE_POSABLE_API = "contrat_signe";

/** Taille maximum du payload sérialisé : une preuve est un fait, pas un dossier. */
const TAILLE_MAX_PAYLOAD = 8000;

/**
 * Un événement est-il posable ? Validation pure, avant tout contact base :
 * le CHECK de la 007 tranchera de toute façon — deux garants, c'est un
 * garant de trop pour la règle, mais ici on refuse AUSSI ce que la base
 * accepterait et que le produit ne veut pas (états des lieux = Sérénité).
 */
export function validerEvenement({ type, payload }) {
  if (typeof type !== "string" || !TYPES_EVENEMENT.includes(type)) {
    return { ok: false, erreur: "type d'événement inconnu" };
  }
  if (type !== TYPE_POSABLE_API) {
    return { ok: false, erreur: "ce type d'événement n'est pas posable ici" };
  }
  if (payload === undefined || payload === null) {
    return { ok: true, payload: {} };
  }
  // un payload est un objet de faits, jamais une liste ni une valeur nue
  if (typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, erreur: "payload invalide" };
  }
  // l'horodatage client serait une preuve fabriquée : refusée d'entrée
  if (Object.prototype.hasOwnProperty.call(payload, "horodatage")) {
    return { ok: false, erreur: "l'horodatage n'appartient pas au client" };
  }
  let serie;
  try {
    serie = JSON.stringify(payload);
  } catch {
    return { ok: false, erreur: "payload invalide" };
  }
  if (serie.length > TAILLE_MAX_PAYLOAD) {
    return { ok: false, erreur: "payload trop volumineux" };
  }
  return { ok: true, payload };
}

/**
 * Le SQL de la pose. La propriété vit dans la requête, pas dans un if
 * applicatif : le séjour d'un autre n'existe pas ici (zéro ligne = 404),
 * la policy p_owner_evenements_insert (010) reste le dernier garant.
 */
export function sqlInsererEvenement() {
  return `INSERT INTO evenements_sejour (annonce_id, type_evenement, payload)
          SELECT s.annonce_id, $2, $3::jsonb
          FROM sejours s
          JOIN annonces a ON a.id = s.annonce_id
          WHERE s.id = $1 AND a.proprietaire = auth.uid()
          RETURNING id, type_evenement, horodatage, payload`;
}

/** Le fil de preuve d'un séjour, côté hôte — l'ordre chronologique fait le dossier. */
export function sqlListerEvenements() {
  return `SELECT e.id, e.type_evenement, e.horodatage, e.payload
          FROM evenements_sejour e
          JOIN sejours s ON s.annonce_id = e.annonce_id
          JOIN annonces a ON a.id = e.annonce_id
          WHERE s.id = $1 AND a.proprietaire = auth.uid()
          ORDER BY e.horodatage`;
}

/**
 * L'insertion a-t-elle eu lieu ? Zéro ligne = le séjour n'existe pas ou
 * n'est pas à l'appelant — 404, jamais 403 : on ne révèle pas le séjour
 * d'un autre.
 */
export function traduireInsertionEvenement(rowCount) {
  if (rowCount === 0) {
    return { statut: 404, erreur: "séjour inconnu" };
  }
  return null;
}

/**
 * Le statut HTTP et la phrase d'une erreur PostgreSQL de preuve. Le CHECK
 * de la 007 est le garant dernier du type ; s'il parle, la validation
 * applicative a été contournée — on traduit sans rien révéler d'autre.
 */
export function traduireErreurEvenement(e) {
  if (e?.code === "23514") {
    return { statut: 400, erreur: "type d'événement inconnu" };
  }
  if (e?.code === "22P02") {
    return { statut: 400, erreur: "requête invalide" };
  }
  return null;
}
