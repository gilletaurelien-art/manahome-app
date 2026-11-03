// Construction de la requête de recherche publique — pure, testée.
//
// ⭐ LA SÉCURITÉ ICI N'EST PAS L'ÉCHAPEMENT : elle est structurelle. Les
// valeurs ne sont JAMAIS concaténées dans le SQL — chaque filtre ajoute un
// paramètre positionnel ($1, $2…) et la liste des colonnes est en dur.
// Les champs acceptés sont une LISTE BLANCHE : tout paramètre inconnu est
// ignoré, jamais répercuté. (Même doctrine que le catalogue create-checkout
// de l'écosystème : ce qui n'est pas livré n'entre pas.)

export const LIMIT_MAX = 60;

const OFFRES = new Set(["vente", "location_courte_duree"]);
const TYPES = new Set(["maison", "appartement", "terrain", "autre"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Une plage posée et cohérente (deux ISO, départ > arrivée) — miroir front. */
export function plageValide({ arr, dep }) {
  return (
    ISO_DATE.test(arr ?? "") && ISO_DATE.test(dep ?? "") && dep > arr
  );
}

/**
 * Le SQL et ses paramètres pour une recherche publique.
 * Miroir des sémantiques front (disponibilite.ts) :
 * - plage invalide = PAS de filtre de dates (le vide n'est pas une date) ;
 * - le tri vient du SQL (une importée derrière une directe), jamais du client.
 */
export function requeteAnnonces(filtres) {
  const clauses = [];
  const params = [];

  if (filtres.offre && OFFRES.has(filtres.offre)) {
    params.push(filtres.offre);
    clauses.push(`offre = $${params.length}`);
  }
  if (filtres.type_bien && TYPES.has(filtres.type_bien)) {
    params.push(filtres.type_bien);
    clauses.push(`type_bien = $${params.length}`);
  }
  const budget = Number(filtres.prix_max);
  if (filtres.prix_max && Number.isFinite(budget) && budget > 0) {
    // location : le prix affiché est le loyer mensuel ; vente : le prix
    params.push(budget);
    clauses.push(`prix_eur <= $${params.length}`);
  }
  if (filtres.q) {
    // ⚠️ la vue n'expose pas de lieu en texte libre : la recherche texte
    // filtre sur la description — jamais sur des colonnes privées.
    params.push(`%${filtres.q}%`);
    clauses.push(`description ILIKE $${params.length}`);
  }
  if (plageValide(filtres)) {
    // bord de départ exclu : sémantique de est_disponible() en base,
    // la même que disponibilite.ts côté front — sinon la fiche dirait
    // « disponible » là où l'hôte lit « bloquée ».
    params.push(filtres.arr, filtres.dep);
    clauses.push(
      `est_disponible(id, $${params.length - 1}::date, $${params.length}::date)`
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.min(Math.max(Number(filtres.limit) || 24, 1), LIMIT_MAX);
  const sql = `
    SELECT id, type_bien, surface_m2, pieces, prix_eur, dpe,
           description, offre, tarif_nuit, capacite, code_insee,
           source, source_id, created_at
    FROM annonces_publiques
    ${where}
    ORDER BY source, created_at DESC
    LIMIT ${limit}
  `;
  return { sql, params };
}
