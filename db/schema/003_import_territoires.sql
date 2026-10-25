-- Migration 003 : tables d'import idempotentes pour l'enrichissement territorial.
-- Doctrine : toute donnée tierce entre par table d'import (jamais d'écriture
-- directe dans territoires), puis consolidation SQL. Aucune donnée nominative
-- n'est stockée (DVF : agrégats €/m² uniquement).

-- 1. Géo / découpage administratif (geo.api.gouv.fr, EPCI, contour)
--    idempotent par code_insee
CREATE TABLE import_geo_communes (
  code_insee     text PRIMARY KEY,
  nom            text NOT NULL,
  code_epci      text,
  nom_epci       text,
  population     int,
  contour_geojson jsonb,          -- contour communal, nourrit PostGIS
  fetched_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. Géorisques : rapport de risques naturels par commune (JSON brut conservé
--    pour re-consolidation sans re-fetch ; la page n'expose que la synthèse)
CREATE TABLE import_georisk (
  code_insee     text PRIMARY KEY,
  rapport        jsonb NOT NULL,  -- réponse /api/v1/georisques/report
  fetched_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. DVF : mutations foncières agrégées — JAMAIS de ligne brute nominative.
--    idempotent par (code_insee, annee, type_local) : l'agrégat seulement.
CREATE TABLE import_dvf (
  code_insee     text NOT NULL,
  annee          int NOT NULL,
  type_local     text NOT NULL CHECK (type_local IN ('Maison','Appartement')),
  prix_m2_median numeric,          -- médiane €/m² de l'année
  nb_mutations   int,
  fetched_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (code_insee, annee, type_local)
);

-- Accès : service applicatif uniquement, jamais anon
REVOKE ALL ON import_geo_communes, import_georisk, import_dvf FROM anon;
