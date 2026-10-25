-- Migration 006 : compteurs agrégés de vie locale (commerces, associations).
-- Doctrine 003 : table d'import idempotente, agrégats uniquement — aucune
-- fiche individuelle n'est stockée, seulement des effectifs par commune.
-- Source : recherche-entreprises.api.gouv.fr (annuaire officiel entreprises).

CREATE TABLE IF NOT EXISTS import_comptages (
  code_insee  text PRIMARY KEY,
  commerces   int,            -- unités actives NAF 47.x/55.x/56.x
  associations int,           -- unités actives est_association=true
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON import_comptages FROM anon;
