-- Migration 001 : schéma cœur MANAhome.
-- Validé par Aurélien le 25/10/2026. Aucune donnée réelle avant validation du schéma.
-- Doctrine : lecture publique UNIQUEMENT via vues de publication ; anon révoqué partout (voir 002).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE utilisateurs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  -- coordonnées jamais exposées : aucun rôle ni vue publique ne les lit
  telephone     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- suppression = exclusion : soft-delete puis purge, sauvegardes avec listes d'exclusion
  deleted_at    timestamptz
);

CREATE TABLE annonces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire  uuid NOT NULL REFERENCES utilisateurs(id),
  type_bien     text NOT NULL CHECK (type_bien IN ('maison','appartement','terrain','autre')),
  surface_m2    numeric CHECK (surface_m2 > 0),
  pieces        int CHECK (pieces >= 0),
  prix_eur      numeric CHECK (prix_eur >= 0),
  dpe           text CHECK (dpe IN ('A','B','C','D','E','F','G','NC')),
  description   text,
  -- géoloc large, JAMAIS l'adresse précise d'un particulier
  geoloc        point,
  statut        text NOT NULL DEFAULT 'brouillon'
                CHECK (statut IN ('brouillon','publiee','retiree')),
  source        text NOT NULL
                CHECK (source IN ('directe_particulier','import_pro')),
  -- attribution : badge de source obligatoire sur toute annonce importée
  source_id     text,
  -- dédup : hash normalisé (champs à figer avec Aurélien avant activation import)
  empreinte    text NOT NULL,
  is_demo       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_annonces_statut ON annonces(statut);
CREATE INDEX idx_annonces_empreinte ON annonces(empreinte);

CREATE TABLE annonces_medias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id    uuid NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  url_master    text NOT NULL,
  url_thumb     text NOT NULL,
  -- vidéos/visites 3D : URL uniquement — un fichier vidéo est inexprimable en base
  media_type    text NOT NULL DEFAULT 'photo'
                CHECK (media_type = 'photo'
                   OR (media_type IN ('visite_3d','video') AND url_master ~ '^https?://')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_medias_annonce ON annonces_medias(annonce_id);

CREATE TABLE pros_referentiel (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raison_sociale text NOT NULL,
  siren         text,
  -- justificatif (carte pro, SIREN…) : jamais exposé publiquement
  carte_pro     text,
  -- 3 états ; « vérifié » exige une preuve, contrainte ci-dessous
  statut_pro    text NOT NULL DEFAULT 'referencé'
                CHECK (statut_pro IN ('referencé','actif','verifié')
                AND (statut_pro <> 'verifié' OR carte_pro IS NOT NULL)),
  -- garde anti-domicile : une fiche pro publique ne peut pas porter
  -- l'adresse domicile d'une personne physique
  adresse_publique     text,
  is_personne_physique boolean NOT NULL DEFAULT false,
  CHECK (NOT is_personne_physique OR adresse_publique IS NULL)
);

CREATE TABLE conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id    uuid NOT NULL REFERENCES annonces(id),
  acheteur      uuid NOT NULL REFERENCES utilisateurs(id),
  vendeur       uuid NOT NULL REFERENCES utilisateurs(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (annonce_id, acheteur)
);

CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  auteur          uuid NOT NULL REFERENCES utilisateurs(id),
  corps           text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE territoires (
  code_insee     text PRIMARY KEY,
  nom            text NOT NULL,
  geom           geography(MultiPolygon, 4326),
  -- couche d'enrichissement : environnement, transports, services, vie locale (pilier IA)
  enrichissement jsonb
);

-- Import SIRENE idempotent : le référentiel pros se construit à neuf, rien à hériter
CREATE TABLE import_sirene (
  siren       text PRIMARY KEY,
  payload     jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);
