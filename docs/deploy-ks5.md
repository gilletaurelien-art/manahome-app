# Mise en place MANAhome sur le KS-5 — runbook complet

Document de passation, écrit pour être exécuté tel quel par un assistant (Claude)
sur le VPS. Chaque étape porte ses **sondes de vérification** : on ne croit jamais
le registre des migrations, on vérifie l'effet réel dans la base.

## 0. Contexte et doctrines à respecter pendant TOUTE la mise en place

- **Le registre des migrations ment dans les deux sens** : des versions inscrites
  jamais jouées, et l'inverse. Toute vérification passe par `to_regclass`,
  `to_regproc`, `information_schema` — jamais par une table de registre.
- **`.env` jamais commité** : il vit sur le VPS, `chmod 600`, rempli à la main.
- **Plusieurs sessions peuvent travailler en parallèle sur ce VPS** : avant
  chaque déploiement, vérifier qu'aucune autre branche n'est en avance
  (`git log`, `docker compose ps`) et prévenir avant de toucher la base.
- **La fonction AVANT l'app, le branchement AVANT la bascule** : le service
  `app` et les migrations sont en place AVANT que `FEATURE_BACK=true`
  n'entre dans le build du front.
- **Zéro secret dans ce document, comme dans le repo** : les mots de passe
  vivent dans le `.env`, générés sur place (`openssl rand -hex 32`).

## 1. Prérequis KS-5

- Debian 12, accès root par SSH, 8 Go de RAM (KS-5), 1 disque de données.
- DNS : `manahome.org` et `www.manahome.org` → IP du KS-5 (A/AAAA), TTL bas
  pendant la mise en place (300 s), remonté après (3600 s).
- Pare-feu : 80, 443 ouverts ; **22 filtré** ; rien d'autre exposé —
  Postgres (5432) et le service app (3000) ne sortent JAMAIS du réseau
  interne Docker.
- Docker Engine + compose plugin :
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- Code :
  ```bash
  git clone https://github.com/gilletaurelien-art/manahome-app.git /opt/manahome
  cd /opt/manahome
  ```

## 2. Le `.env` (sur le VPS uniquement)

```bash
cp .env.example .env && chmod 600 .env
```

Remplir :
- `POSTGRES_PASSWORD` : `openssl rand -hex 24` ;
- `DATABASE_URL` : **d'abord le superuser** (`postgres://manahome:…@db:5432/manahome`)
  pour le premier démarrage — l'étape 5 le basculera sur `manahome_app` ;
- `AUTH_SECRET` : `openssl rand -hex 32` — **sans lui, tout `/api/auth/*`
  répond 503** (fail closed : c'est voulu, ne jamais le laisser vide) ;
- S3 (OVHcloud Object Storage ou RustFS) : `S3_ENDPOINT`, `S3_ACCESS_KEY`,
  `S3_SECRET_KEY`, `S3_BUCKET=manahome-medias` — requis pour le pipeline
  photos (pas encore branché au dépôt, mais le conteneur le lit) ;
- `MISTRAL_API_KEY` : optionnel à ce stade (rédaction assistée) ;
- `FEATURE_GEDEON=false` : **reste à false** — aucun flux, aucune convention.

## 3. La base : premier démarrage (base vierge)

Sur une base **vierge**, le `docker-entrypoint-initdb.d` joue les migrations
001 → 010 automatiquement **au premier boot** :

```bash
docker compose up -d db
docker compose ps db          # attendre "healthy"
```

**Sonder — jamais croire l'init** :

```bash
docker compose exec db psql -U manahome -d manahome -c "
  SELECT to_regclass('annonces') AS t_annonces,
         to_regclass('sejours') AS t_sejours,
         to_regclass('annonces_ical') AS t_ical,
         to_regclass('auth_local') AS t_auth,
         to_regproc('auth.uid') AS f_uid,
         to_regproc('auth.identifiants') AS f_identifiants;"
```

Attendu : six valeurs non nulles. **Si l'une est NULL, STOP** — diagnostiquer
avant tout le reste (le conteneur peut avoir booté sur un volume préexistant :
voir §4).

Colonnes des migrations récentes :

```bash
docker compose exec db psql -U manahome -d manahome -c "
  SELECT column_name FROM information_schema.columns
  WHERE table_name='annonces_ical' AND column_name='nuits_importees';"
```

Attendu : une ligne (`nuits_importees`, migration 009).

## 4. La base : cas d'une base existante (le VPS a déjà un manahome)

⚠️ **Toujours vérifier l'état réel AVANT de jouer quoi que ce soit** :

```bash
docker compose exec db psql -U manahome -d manahome -c "
  SELECT to_regclass('sejours'), to_regclass('auth_local');"
```

- Les deux NULL → jouer **dans l'ordre, dans une transaction, avec rollback** :
  ```bash
  cd /opt/manahome
  for m in 007_location_courte_duree 008_auth 009_ical_nuits 010_role_app; do
    docker compose exec -T db psql -U manahome -d manahome -v ON_ERROR_STOP=1 \
      -f - < db/schema/$m.sql || { echo "ÉCHEC $m — STOP"; break; }
  done
  ```
  Puis re-sonder comme au §3.
- Une des deux existe → **ne rien rejouer**, diagnostiquer l'état table par
  table et reprendre à la migration manquante uniquement.
- Les deux existent → §5.

## 5. Le rôle non-privilégié `manahome_app` (arme la RLS)

La 010 crée le rôle **NOLOGIN** (aucun secret en base versionnée). Sur le VPS :

```bash
MDP_APP=$(openssl rand -hex 24)
docker compose exec db psql -U manahome -d manahome -c \
  "ALTER ROLE manahome_app LOGIN PASSWORD '$MDP_APP';"
```

Puis dans le `.env`, basculer `DATABASE_URL` :

```
DATABASE_URL=postgres://manahome_app:<MDP_APP>@db:5432/manahome
```

Sonder :

```bash
docker compose exec db psql "postgres://manahome_app:$MDP_APP@localhost:5432/manahome" \
  -c "SELECT count(*) FROM annonces_publiques;"
```

Attendu : ça répond (le rôle lit la vue). Et `SELECT * FROM utilisateurs`
doit renvoyer **zéro ligne sans erreur** (la RLS est armée : le rôle ne voit
que ce que les policies lui permettent).

## 6. Le service `app` et Caddy

```bash
docker compose build app
docker compose up -d
docker compose ps        # db, app, caddy : tous "running"/"healthy"
```

Vérifications de santé **depuis l'intérieur du VPS** (boucle locale uniquement,
rien n'est exposé en direct) :

```bash
docker compose exec caddy wget -qO- http://app:3000/api/sante
# attendu : {"service":"manahome-app","etat":"vivant"}
```

Puis depuis l'extérieur, une fois le DNS actif : `https://manahome.org/api/sante`
doit répondre 200 avec un certificat Let's Encrypt posé par Caddy, et
`https://manahome.org/fr/` doit servir la page d'accueil française.

## 7. Le front avec la bascule `FEATURE_BACK`

Le `site/` du dépôt est le build **flag OFF** (démo). Pour passer en réel :

```bash
cd /opt/manahome
FEATURE_BACK=true npm run build
```

Puisque Caddy sert `./site` monté en lecture seule : `docker compose restart caddy`
n'est pas nécessaire (le volume suit le répertoire), mais vérifier :

```bash
docker compose exec caddy ls /srv/site/fr
curl -s https://manahome.org/fr/annonces/crozon | head -c 200
```

**Ordre impératif** : les étapes 3→6 AVANT ce build. Un front flag ON contre
un back absent affiche la note honnête « service momentanément indisponible »
et sert la démo — mais ce n'est pas l'état voulu.

## 8. Vérification de bout en bout (la vraie recette)

À faire sur `https://manahome.org/fr/` dans un navigateur, dans l'ordre :

1. **Inscription** (extranet `/fr/mes-annonces`, panneau Mon compte) → l'email
   s'affiche, la session tient au rechargement ;
2. **Dépôt** d'une annonce de location courte durée (`/fr/publier`) → le
   brouillon se crée, la publication est **refusée avec la phrase du verrou**
   (justificatifs manquants) ;
3. **Justificatifs** (n° de déclaration + référence d'assurance avec date) →
   dépôt puis publication → l'annonce apparaît dans `/fr/annonces/crozon` ;
4. **Calendrier** (`/fr/mes-annonces`) → bloquer une nuit, la voir sur le
   calendrier, la libérer ;
5. **Recherche par dates** → l'annonce avec nuitée bloquée ne sort pas sur
   la plage bloquée, sort sur une plage libre ;
6. **Séjour** → demander depuis la fiche, accepter puis confirmer dans la
   messagerie → les nuitées se bloquent ; annuler → elles se libèrent ;
7. **Messagerie** → le fil affiche les messages du serveur, aucun message
   simulé ;
8. **Bilingue** → le sélecteur EN garde la page courante, `/en/annonces/crozon`
   sert les coquilles EN (`lang="en"` dans le HTML).

Chaque échec a une cause probable désignée : 401 partout → `AUTH_SECRET` ou
cookie ; 503 sur tout `/api` → `DATABASE_URL` ou rôle manquant ; page blanche
fr → build sans `FEATURE_BACK`.

## 9. Retour arrière

- **Front** : `git checkout <tag précédent> && npm run build` (flag OFF si
  besoin de repli démo immédiat) ;
- **Service** : `docker compose up -d --no-deps app` sur l'image précédente
  (`docker image ls`) ;
- **Base** : les migrations 007-010 sont additives (tables, rôle, policies) —
  le repli fonctionnel se fait par le flag, **pas** par un drop. Ne jamais
  supprimer une table en production sans sauvegarde vérifiée.

## 10. Maintenance continue

- **Sauvegardes** : `pg_dump` quotidien + **listes d'exclusion** (doctrine :
  suppression = exclusion — les comptes supprimés ne reviennent pas avec les
  sauvegardes). Vérifier une restauration à blanc une fois.
- **Moisson territoriale** (mensuelle, profil compose) :
  `docker compose --profile moisson run --rm moisson-territoires`
- **iCal planifié** : l'import serveur est **manuel** à ce stade
  (`POST /api/annonces/:id/ical/importer`) — le cron n'existe pas encore,
  c'est une dette documentée, pas un oubli de configuration.
- **Montées de version** : `git pull` → jouer les migrations nouvelles avec
  `ON_ERROR_STOP` → **sonder** → `docker compose build app && docker compose
  up -d` → rebuild front. Toujours vérifier qu'aucune autre session n'est en
  avance sur le VPS avant de toucher la base.

## 11. Ce qui n'est PAS encore branché (dettes assumées, documentées au code)

- **Les photos du dépôt** : le formulaire envoie du texte ; les médias
  passeront par le pipeline S3 (`pipeline/process.py`) et `annonces_medias` ;
- **L'empreinte V1** des dépôts directs : à figer avec Aurélien avant toute
  activation d'import (commentaire de la 001) ;
- **La validation juridique** du « aucun acte réglementé » avant tout
  encaissement de l'offre gestionnaire ;
- **L'import iCal planifié** (voir §10).

## 12. Résumé en une page (à garder sous les yeux)

| Étape | Commande clé | Sonde de réussite |
|---|---|---|
| Base vierge | `docker compose up -d db` | 6 objets non NULL (§3) |
| Base existante | jouer 007→010 avec `ON_ERROR_STOP` | mêmes sondes |
| Rôle | `ALTER ROLE manahome_app LOGIN PASSWORD …` | RLS : 0 ligne lue sur `utilisateurs` |
| Service | `docker compose build app && up -d` | `/api/sante` 200 |
| Front réel | `FEATURE_BACK=true npm run build` | `/fr/annonces/crozon` sert l'API |
| Recette | §8, dans l'ordre | chaque point vérifié |
