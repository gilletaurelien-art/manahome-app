// Messagerie côté serveur — chantier 6.
//
// ⭐ RÈGLE GRAVÉE (001 + 002) : les coordonnées ne sont JAMAIS publiées, la
// mise en relation passe UNIQUEMENT par ici. Deux conséquences directes :
// 1. L'ACHETEUR s'identifie par sa session ; le VENDEUR est dérivé de
//    l'annonce DANS LE SQL — un client ne choisit jamais son interlocuteur,
//    sinon il pourrait ouvrir une conversation avec n'importe qui en se
//    déclarant vendeur.
// 2. Les participants sont vérifiés DANS LE SQL (JOIN conversations +
//    auth.uid()) : la conversation d'un autre n'existe pas ici.
//
// Aucune réponse simulée côté serveur : le front démo simulait l'hôte, le
// service ne ment jamais.

export const CORPS_MAX = 2000;

/** Le message est-il posable ? (non vide, longueur bornée) */
export function validerMessage(corps) {
  if (typeof corps !== "string") return { ok: false, erreur: "message invalide" };
  const nu = corps.trim();
  if (nu.length === 0) return { ok: false, erreur: "message vide" };
  if (nu.length > CORPS_MAX) {
    return { ok: false, erreur: `message trop long (${CORPS_MAX} caractères maximum)` };
  }
  return { ok: true, corps: nu };
}

/**
 * Le SQL d'ouverture d'une conversation — le vendeur dérivé de l'annonce,
 * l'annonce publique : on ne peut écrire qu'à une annonce publiée.
 */
export function sqlOuvrirConversation() {
  return `INSERT INTO conversations (annonce_id, acheteur, vendeur)
          SELECT $1, auth.uid()::uuid, a.proprietaire
          FROM annonces a
          WHERE a.id = $1 AND a.statut = 'publiee'
          RETURNING id, annonce_id, vendeur`;
}

/** Le SQL des conversations de l'appelant (acheteur ou vendeur). */
export function sqlListeConversations() {
  return `SELECT c.id, c.annonce_id, c.acheteur, c.vendeur, c.created_at,
                 a.titre, s.statut AS statut_sejour
          FROM conversations c
          JOIN annonces a ON a.id = c.annonce_id
          LEFT JOIN sejours s ON s.annonce_id = c.annonce_id
               AND s.voyageur = auth.uid()
          WHERE c.acheteur = auth.uid() OR c.vendeur = auth.uid()
          ORDER BY c.created_at DESC`;
}
