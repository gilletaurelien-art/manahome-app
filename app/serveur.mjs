// Service `app` (docker-compose, port 3000, Caddy /api/*) — chantiers 1 et 2
// du cahier des charges (docs/branchement-back.md) : socle + santé + lecture
// publique des annonces.
//
// ⭐ ZÉRO FRAMEWORK : node:http natif, comme le routeur front. Le seul ajout
// légitime du service est le pilote Postgres (pg) — il est importé en DYNAMIQUE
// pour que la sonde de santé réponde même sans base joignable : un conteneur
// qui démarre doit pouvoir dire « je suis vivant, la base ne l'est pas »,
// sinon l'orchestrateur tue le conteneur au lieu de révéler la panne.
//
// GARDES (toutes héritées, aucune inventée) :
// - lecture publique UNIQUEMENT par la vue annonces_publiques (002/007) :
//   zéro coordonnée, zéro colonne privée ;
// - anon n'existe pas ici : ce service parle avec le propriétaire de la base
//   (DATABASE_URL), les requêtes publiques ne lisent que les vues ;
// - aucun endpoint de paiement, aucun montant n'est écrit.

import http from "node:http";
import {
  creerSession,
  uidDepuisRequete,
  NOM_COOKIE,
  TTL_SESSION_MS,
} from "./session.mjs";
import { inscrire, connecter, validerIdentifiants } from "./auth.mjs";

const PORT = Number(process.env.PORT ?? 3000);
const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

async function corps(req) {
  let brut = "";
  for await (const morceau of req) brut += morceau;
  return brut ? JSON.parse(brut) : {};
}

function json(res, statut, donnees) {
  const texte = JSON.stringify(donnees);
  res.writeHead(statut, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(texte),
    "Cache-Control": "no-store",
  });
  res.end(texte);
}

let pool = null;
async function db() {
  if (!pool) {
    const { default: pg } = await import("pg");
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return pool;
}

/** L'uid de la requête, ou null — le secret absent refuse tout (fail closed). */
function uidCourant(req) {
  if (!AUTH_SECRET) return null;
  return uidDepuisRequete(req.headers.cookie, AUTH_SECRET);
}

/** Le Set-Cookie de session, HttpOnly + SameSite=Lax — jamais Secure=false en dur. */
function enteteSession(uid) {
  return `${NOM_COOKIE}=${creerSession(uid, AUTH_SECRET)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(TTL_SESSION_MS / 1000)}`;
}

function effaceSession() {
  return `${NOM_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function reponseAvecCookie(res, statut, donnees, cookie) {
  const texte = JSON.stringify(donnees);
  const entetes = {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(texte),
    "Cache-Control": "no-store",
  };
  if (cookie) entetes["Set-Cookie"] = cookie;
  res.writeHead(statut, entetes);
  res.end(texte);
}

export function creerServeur() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    try {
      if (req.method === "GET" && url.pathname === "/api/sante") {
        // le conteneur doit vivre même si la base ne répond pas : la santé
        // est du service, pas de la base — sinon plus rien ne distingue
        // « app morte » de « db en panne », et l'orchestrateur masque la panne.
        return json(res, 200, { service: "manahome-app", etat: "vivant" });
      }

      if (req.method === "GET" && url.pathname === "/api/annonces") {
        const { requeteAnnonces } = await import("./requetes.mjs");
        const f = url.searchParams;
        const { sql, params } = requeteAnnonces({
          offre: f.get("offre") ?? undefined,
          type_bien: f.get("type_bien") ?? undefined,
          prix_max: f.get("prix_max") ?? undefined,
          q: f.get("q") ?? undefined,
          arr: f.get("arr") ?? undefined,
          dep: f.get("dep") ?? undefined,
          limit: f.get("limit") ?? undefined,
        });
        const client = await (await db()).connect();
        try {
          const resultat = await client.query(sql, params);
          // source d'abord 'directe_particulier' (tri SQL doctrine) :
          // une importée ne passe jamais devant une directe à adéquation égale.
          return json(res, 200, { annonces: resultat.rows, total: resultat.rows.length });
        } finally {
          client.release();
        }
      }

      // ===== Authentification =====
      // ⚠️ Sans AUTH_SECRET, le service REFUSE toute auth : fail closed —
      // un secret vide qui accepterait des sessions signerait avec rien.
      if (url.pathname.startsWith("/api/auth/")) {
        if (!AUTH_SECRET) return json(res, 503, { erreur: "authentification non configurée" });

        if (req.method === "POST" && url.pathname === "/api/auth/inscription") {
          const corpsRequ = await corps(req);
          const email = String(corpsRequ.email ?? "");
          const mdp = String(corpsRequ.mot_de_passe ?? "");
          const invalide = validerIdentifiants(email, mdp);
          if (invalide) return json(res, 400, { erreur: invalide });
          const r = await inscrire(await db(), email, mdp);
          if (!r.ok) return json(res, 409, { erreur: r.erreur });
          return reponseAvecCookie(res, 201, { email: r.utilisateur.email }, enteteSession(r.utilisateur.id));
        }

        if (req.method === "POST" && url.pathname === "/api/auth/connexion") {
          const corpsRequ = await corps(req);
          const r = await connecter(await db(), String(corpsRequ.email ?? ""), String(corpsRequ.mot_de_passe ?? ""));
          if (!r.ok) return json(res, 401, { erreur: r.erreur });
          return reponseAvecCookie(res, 200, { email: r.utilisateur.email }, enteteSession(r.utilisateur.id));
        }

        if (req.method === "POST" && url.pathname === "/api/auth/deconnexion") {
          return reponseAvecCookie(res, 200, { deconnecte: true }, effaceSession());
        }

        if (req.method === "GET" && url.pathname === "/api/auth/moi") {
          const uid = uidCourant(req);
          if (!uid) return json(res, 401, { erreur: "non connecté" });
          // la session EST la preuve : on renvoie l'email pour l'UI, et
          // rien d'autre — jamais le téléphone, jamais les identifiants
          const c = await (await db()).connect();
          try {
            const r = await c.query(
              "SELECT email FROM utilisateurs WHERE id = $1 AND deleted_at IS NULL",
              [uid]
            );
            if (!r.rows[0]) return json(res, 401, { erreur: "non connecté" });
            return json(res, 200, { email: r.rows[0].email });
          } finally {
            c.release();
          }
        }

        return json(res, 404, { erreur: "route inconnue" });
      }

      return json(res, 404, { erreur: "route inconnue" });
    } catch (e) {
      // la base absente n'est pas un crash du service : 503, pas 500 —
      // un monitoring honnête sépare « je suis mort » de « ma base dort ».
      if (e?.code === "ECONNREFUSED" || e?.message?.includes("database")) {
        return json(res, 503, { erreur: "base indisponible" });
      }
      return json(res, 500, { erreur: "erreur interne" });
    }
  });
}

const demarrer = process.argv[1]?.endsWith("serveur.mjs");
if (demarrer) {
  creerServeur().listen(PORT, () => {
    console.log(`manahome-app :${PORT} — santé /api/sante, annonces /api/annonces`);
  });
}
