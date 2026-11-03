// Authentification locale — inscription, connexion, vérification.
//
// ⭐ AUCUNE DÉPENDANCE CRYPTO : scrypt est dans node:crypto, standard du
// secteur, et le sel est propre à chaque utilisateur. timingSafeEqual
// partout : une comparaison de hachage qui court-circuite fuie le temps
// de calcul — un canal annexe, invisible et réel.
//
// GARDES :
// - le mot de passe ne transite JAMAIS en clair hors de la requête, n'est
//   jamais journalisé, et seul son haché scrypt touche la base ;
// - un compte supprimé (soft-delete, suppression = exclusion) ne se
//   reconnecte pas ;
// - la correspondance haché <-> utilisateur vit dans auth_local (008),
//   révoquée à anon, jamais dans une vue publique.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hacherMotDePasse(motDePasse) {
  const sel = randomBytes(16);
  const hache = scryptSync(motDePasse, sel, 64);
  return `${sel.toString("hex")}:${hache.toString("hex")}`;
}

export function verifierMotDePasse(motDePasse, stocke) {
  const [selHex, hacheHex] = String(stocke).split(":");
  if (!selHex || !hacheHex) return false;
  const attendu = Buffer.from(hacheHex, "hex");
  const calcule = scryptSync(motDePasse, Buffer.from(selHex, "hex"), attendu.length);
  return timingSafeEqual(calcule, attendu);
}

/** Le email doit ressembler à un email, le mot de passe faire 10+ caractères. */
export function validerIdentifiants(email, motDePasse) {
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return "email invalide";
  }
  if (typeof motDePasse !== "string" || motDePasse.length < 10) {
    return "mot de passe trop court (10 caractères minimum)";
  }
  return null;
}

/**
 * Inscrit un utilisateur : une transaction, deux tables (utilisateurs puis
 * auth_local) — jamais d'utilisateur sans identifiants, jamais d'identifiants
 * orphelins.
 */
export async function inscrire(db, email, motDePasse) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const u = await client.query(
      "INSERT INTO utilisateurs (email) VALUES ($1) RETURNING id, email",
      [email.trim().toLowerCase()]
    );
    await client.query(
      "INSERT INTO auth_local (utilisateur_id, mot_de_passe_hash) VALUES ($1, $2)",
      [u.rows[0].id, hacherMotDePasse(motDePasse)]
    );
    await client.query("COMMIT");
    return { ok: true, utilisateur: u.rows[0] };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    // email déjà pris : la contrainte UNIQUE parle, on la traduit sans rien
    // révéler d'autre (jamais « ce compte existe » à un inconnu qui sonde)
    if (e?.code === "23505") return { ok: false, erreur: "inscription impossible" };
    throw e;
  } finally {
    client.release();
  }
}

/** Vérifie les identifiants ; un compte supprimé ne se reconnecte pas. */
export async function connecter(db, email, motDePasse) {
  const client = await db.connect();
  try {
    const r = await client.query(
      `SELECT u.id, u.email, a.mot_de_passe_hash
       FROM utilisateurs u JOIN auth_local a ON a.utilisateur_id = u.id
       WHERE lower(u.email) = $1 AND u.deleted_at IS NULL`,
      [email.trim().toLowerCase()]
    );
    const ligne = r.rows[0];
    if (!ligne || !verifierMotDePasse(motDePasse, ligne.mot_de_passe_hash)) {
      // un seul message pour l'email inconnu et le mot de passe faux :
      // les distinguer offrirait un annuaire à qui sonde
      return { ok: false, erreur: "identifiants invalides" };
    }
    return { ok: true, utilisateur: { id: ligne.id, email: ligne.email } };
  } finally {
    client.release();
  }
}
