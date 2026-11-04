// Sessions par cookie signé — HMAC-SHA256, zéro stockage serveur.
//
// ⭐ POURQUOI SANS TABLE DE SESSIONS (V1) : le cookie porte uid + expiration,
// signés avec AUTH_SECRET (déjà passé par docker-compose). Rien n'est
// révocable côté serveur avant l'ajout d'une table de révocation — assumé :
// TTL court (7 jours), HttpOnly + SameSite=Lax, et la comparaison est à
// temps constant (un cookie forgé ne se distingue pas par le timing).
//
// ⚠️ LE MOT DE PASSE ET LE SECRET NE SE JOURNALISENT JAMAIS — pas ici, pas
// dans les logs du serveur HTTP : une erreur de debug qui imprime l'en-tête
// Cookie imprime la session.

import { createHmac, timingSafeEqual } from "node:crypto";

export const TTL_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
export const NOM_COOKIE = "manahome_session";

function signer(charge, secret) {
  return createHmac("sha256", secret).update(charge).digest("hex");
}

/** La valeur du cookie pour un uid : "uid.expiration.signature". */
export function creerSession(uid, secret, maintenant = Date.now()) {
  const expiration = maintenant + TTL_SESSION_MS;
  const charge = `${uid}.${expiration}`;
  return `${charge}.${signer(charge, secret)}`;
}

/** Le uid d'un cookie valide, ou null — expiration et signature comprises. */
export function lireSession(valeur, secret, maintenant = Date.now()) {
  if (typeof valeur !== "string") return null;
  const morceaux = valeur.split(".");
  if (morceaux.length !== 3) return null;
  const [uid, expiration, signature] = morceaux;
  const charge = `${uid}.${expiration}`;
  // signer renvoie de l'hex : le buffer doit être DÉCODÉ, pas pris comme
  // UTF-8 — sinon 64 octets contre 32 et TOUT cookie serait refusé
  const attendue = Buffer.from(signer(charge, secret), "hex");
  let posee;
  try {
    posee = Buffer.from(signature, "hex");
  } catch {
    return null;
  }
  if (posee.length !== attendue.length || !timingSafeEqual(posee, attendue)) {
    return null;
  }
  if (Number(expiration) < maintenant) return null;
  // un uid de session est un uuid : tout autre format est un cookie mal formé
  if (!/^[0-9a-f-]{36}$/i.test(uid)) return null;
  return uid;
}

/** L'uid du cookie de session dans l'en-tête Cookie, ou null. */
export function uidDepuisRequete(enTeteCookie, secret, maintenant = Date.now()) {
  if (!enTeteCookie) return null;
  const cherche = enTeteCookie.split(/;\s*/).find((c) => c.startsWith(`${NOM_COOKIE}=`));
  if (!cherche) return null;
  return lireSession(cherche.slice(NOM_COOKIE.length + 1), secret, maintenant);
}
