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
import { trierNuits, delta } from "./indispos.mjs";
import { validerDemande, traduireErreurSejour, traduireTransition } from "./sejours.mjs";
import { plageValide as plageValideRequete } from "./requetes.mjs";

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

// ⚠️ V1 ASSUMÉE : le rôle de la DATABASE_URL est le superuser du conteneur —
// la RLS ne s'applique pas au superuser, elle est donc EN VEILLE. Deux garde-
// fous en attendant le rôle non-privilégié qui l'armera (suivi dans le cahier
// des charges) : (1) chaque requête authentifiée porte la propriété DANS LE
// SQL (proprietaire = auth.uid(), posé par transaction) — l'application ne
// décide rien, elle déclare qui parle ; (2) aucun endpoint ne lit jamais une
// table sans condition de propriété ou de vue publique.
async function transactionAuth(uid) {
  const client = await (await db()).connect();
  await client.query("BEGIN");
  // t = true : la variable vit et meurt avec CETTE transaction — jamais
  // une session qui fuite vers la requête suivante du pool
  await client.query("SELECT set_config('app.utilisateur', $1, true)", [uid]);
  return client;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

      // ===== Annonce : disponibilité publique et indisponibilités du propriétaire =====

      // Disponibilité d'une annonce PUBLIÉE : information publique, vue/fonction
      // de la 007 — réponde false pour une annonce non publiée, anon ne peut pas
      // sonder les brouillons.
      const mDispo = url.pathname.match(/^\/api\/annonces\/([\w-]+)\/disponibilite$/);
      if (req.method === "GET" && mDispo) {
        const arr = url.searchParams.get("arr");
        const dep = url.searchParams.get("dep");
        if (!plageValideRequete({ arr, dep })) {
          return json(res, 400, { erreur: "plage invalide" });
        }
        const c = await (await db()).connect();
        try {
          const r = await c.query(
            "SELECT est_disponible($1::uuid, $2::date, $3::date) AS disponible",
            [mDispo[1], arr, dep]
          );
          return json(res, 200, { disponible: r.rows[0].disponible });
        } finally {
          c.release();
        }
      }

      // Les nuitées bloquées de SON annonce : propriété vérifiée DANS LE SQL.
      const mIndispos = url.pathname.match(/^\/api\/annonces\/([\w-]+)\/indisponibilites$/);
      if (mIndispos && !UUID.test(mIndispos[1])) {
        return json(res, 404, { erreur: "route inconnue" });
      }
      if (mIndispos) {
        const uid = uidCourant(req);
        if (!uid) return json(res, 401, { erreur: "non connecté" });

        if (req.method === "GET") {
          const c = await transactionAuth(uid);
          try {
            // la propriété vit dans la requête, pas dans un if applicatif :
            // l'annonce d'un autre ne renvoie pas 403, elle n'EXISTE pas ici
            const r = await c.query(
              `SELECT i.nuit FROM annonces_indisponibilites i
               JOIN annonces a ON a.id = i.annonce_id
               WHERE i.annonce_id = $1 AND a.proprietaire = auth.uid()
               ORDER BY i.nuit`,
              [mIndispos[1]]
            );
            await c.query("COMMIT");
            return json(res, 200, { nuits: r.rows.map((l) => l.nuit.toISOString().slice(0, 10)) });
          } catch (e) {
            await c.query("ROLLBACK").catch(() => {});
            throw e;
          } finally {
            c.release();
          }
        }

        if (req.method === "PUT") {
          const corpsRequ = await corps(req);
          const { valides, invalides } = trierNuits(corpsRequ.nuits);
          if (invalides.length > 0) {
            // refuser sans enregistrer : un calendrier qui accepterait en
            // partie mentirait sur ce qu'il a retenu
            return json(res, 400, { erreur: "nuitées invalides", invalides });
          }
          const c = await transactionAuth(uid);
          try {
            const enPlace = (await c.query(
              `SELECT i.nuit FROM annonces_indisponibilites i
               JOIN annonces a ON a.id = i.annonce_id
               WHERE i.annonce_id = $1 AND a.proprietaire = auth.uid()`,
              [mIndispos[1]]
            )).rows.map((l) => l.nuit.toISOString().slice(0, 10));
            // l'ensemble n'existe que si l'annonce appartient à l'appelant :
            // sinon on lirait TOUTES ses nuits comme ensemble courant
            const possede = (await c.query(
              "SELECT 1 FROM annonces WHERE id = $1 AND proprietaire = auth.uid()",
              [mIndispos[1]]
            )).rows.length > 0;
            if (!possede) {
              await c.query("ROLLBACK");
              return json(res, 404, { erreur: "annonce inconnue" });
            }
            const { aPoser, aRetirer } = delta(enPlace, valides);
            for (const n of aRetirer) {
              await c.query("DELETE FROM annonces_indisponibilites WHERE annonce_id = $1 AND nuit = $2::date", [mIndispos[1], n]);
            }
            for (const n of aPoser) {
              await c.query(
                "INSERT INTO annonces_indisponibilites (annonce_id, nuit) VALUES ($1, $2::date) ON CONFLICT DO NOTHING",
                [mIndispos[1], n]
              );
            }
            await c.query("COMMIT");
            return json(res, 200, { nuits: valides, posees: aPoser.length, retirees: aRetirer.length });
          } catch (e) {
            await c.query("ROLLBACK").catch(() => {});
            throw e;
          } finally {
            c.release();
          }
        }

        return json(res, 405, { erreur: "méthode non permise" });
      }

      // ===== Le cycle du séjour (chantier 4) =====
      // ⭐ LA BASE DÉCIDE, L'API TRADUIT : le trigger de la 007 bloque les
      // nuitées à la confirmation (et refuse la double réservation), les
      // UPDATE ... WHERE statut = verrouillent les transitions. Aucun
      // montant n'est écrit : le paiement vit chez le PSP de l'hôte.
      if (url.pathname === "/api/sejours" && req.method === "POST") {
        const uid = uidCourant(req);
        if (!uid) return json(res, 401, { erreur: "non connecté" });
        const corpsRequ = await corps(req);
        const v = validerDemande({
          annonceId: corpsRequ.annonceId,
          arrivee: corpsRequ.arrivee,
          depart: corpsRequ.depart,
          voyageursNb: Number(corpsRequ.voyageursNb),
        });
        if (!v.ok) return json(res, 400, { erreur: v.erreur });
        const c = await transactionAuth(uid);
        try {
          // l'annonce doit être PUBLIÉE et de l'offre location — une demande
          // sur un brouillon ou une vente n'a pas de sens, la requête le dit
          const dispo = await c.query(
            `SELECT 1 FROM annonces a
             WHERE a.id = $1 AND a.statut = 'publiee'
               AND a.offre = 'location_courte_duree'
               AND est_disponible(a.id, $2::date, $3::date)`,
            [corpsRequ.annonceId, corpsRequ.arrivee, corpsRequ.depart]
          );
          if (dispo.rows.length === 0) {
            await c.query("ROLLBACK");
            // indisponible ou inconnue : le même 409 — jamais d'annuaire
            return json(res, 409, { erreur: "ces dates ne sont pas disponibles" });
          }
          const r = await c.query(
            `INSERT INTO sejours (annonce_id, voyageur, arrivee, depart, voyageurs_nb, mode, conditions)
             VALUES ($1, auth.uid()::uuid, $2::date, $3::date, $4, 'demande',
                     jsonb_build_object('paiement', 'direct_hote'))
             RETURNING id, arrivee, depart, voyageurs_nb, statut`,
            [corpsRequ.annonceId, corpsRequ.arrivee, corpsRequ.depart, Number(corpsRequ.voyageursNb)]
          );
          await c.query("COMMIT");
          return json(res, 201, r.rows[0]);
        } catch (e) {
          await c.query("ROLLBACK").catch(() => {});
          const traduit = traduireErreurSejour(e);
          if (traduit) return json(res, traduit.statut, { erreur: traduit.erreur });
          throw e;
        } finally {
          c.release();
        }
      }

      if (url.pathname === "/api/sejours" && req.method === "GET") {
        const uid = uidCourant(req);
        if (!uid) return json(res, 401, { erreur: "non connecté" });
        const c = await transactionAuth(uid);
        try {
          // les séjours où je suis voyageur OU hôte : deux rôles, une liste,
          // la propriété dans le SQL — jamais les séjours des autres
          const r = await c.query(
            `SELECT s.id, s.annonce_id, s.arrivee, s.depart, s.voyageurs_nb,
                    s.mode, s.statut, s.conditions, a.titre
             FROM sejours s JOIN annonces a ON a.id = s.annonce_id
             WHERE s.voyageur = auth.uid()
                OR a.proprietaire = auth.uid()
             ORDER BY s.created_at DESC`
          );
          await c.query("COMMIT");
          return json(res, 200, { sejours: r.rows });
        } catch (e) {
          await c.query("ROLLBACK").catch(() => {});
          throw e;
        } finally {
          c.release();
        }
      }

      const mSejour = url.pathname.match(/^\/api\/sejours\/([\w-]+)\/([\w-]+)$/);
      if (mSejour) {
        const [, sejourId, geste] = mSejour;
        if (!UUID.test(sejourId)) return json(res, 404, { erreur: "route inconnue" });
        const gestes = new Set(["accepter", "confirmer", "annuler", "cloturer"]);
        if (req.method !== "POST" || !gestes.has(geste)) {
          return json(res, 404, { erreur: "route inconnue" });
        }
        const uid = uidCourant(req);
        if (!uid) return json(res, 401, { erreur: "non connecté" });
        const c = await transactionAuth(uid);
        try {
          // chaque geste est UN UPDATE verrouillé par le statut courant et
          // par la propriété (hôte pour accepter/confirmer/clôturer, l'une ou
          // l'autre partie pour annuler) : zéro ligne affectée = 409
          let sql;
          if (geste === "accepter") {
            sql = `UPDATE sejours SET statut = 'acceptee'
                   RETURNING statut
                   WHERE id = $1 AND statut = 'demande_envoyee'
                     AND EXISTS (SELECT 1 FROM annonces a
                                 WHERE a.id = sejours.annonce_id
                                   AND a.proprietaire = auth.uid())`;
          } else if (geste === "confirmer") {
            // le trigger de la 007 bloque les nuitées ici — ou refuse :
            // c'est LUI le garant anti-double-réservation
            sql = `UPDATE sejours SET statut = 'confirmee',
                      conditions = conditions || jsonb_build_object('confirme_le', now()::text)
                   RETURNING statut
                   WHERE id = $1 AND statut IN ('acceptee', 'paiement_attendu')
                     AND EXISTS (SELECT 1 FROM annonces a
                                 WHERE a.id = sejours.annonce_id
                                   AND a.proprietaire = auth.uid())`;
          } else if (geste === "annuler") {
            // le trigger libère les nuitées posées par ce séjour (cause
            // ciblée) — les blocages manuels de l'hôte restent
            sql = `UPDATE sejours SET statut = 'annulee'
                   RETURNING statut
                   WHERE id = $1 AND statut NOT IN ('annulee', 'cloturee')
                     AND (voyageur = auth.uid()
                          OR EXISTS (SELECT 1 FROM annonces a
                                     WHERE a.id = sejours.annonce_id
                                       AND a.proprietaire = auth.uid()))`;
          } else {
            sql = `UPDATE sejours SET statut = 'cloturee'
                   RETURNING statut
                   WHERE id = $1 AND statut = 'confirmee'
                     AND EXISTS (SELECT 1 FROM annonces a
                                 WHERE a.id = sejours.annonce_id
                                   AND a.proprietaire = auth.uid())`;
          }
          const r = await c.query(sql, [sejourId]);
          const transition = traduireTransition(r.rowCount);
          if (transition) {
            await c.query("ROLLBACK");
            return json(res, transition.statut, { erreur: transition.erreur });
          }
          await c.query("COMMIT");
          return json(res, 200, { statut: r.rows[0].statut });
        } catch (e) {
          await c.query("ROLLBACK").catch(() => {});
          const traduit = traduireErreurSejour(e);
          if (traduit) return json(res, traduit.statut, { erreur: traduit.erreur });
          throw e;
        } finally {
          c.release();
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
