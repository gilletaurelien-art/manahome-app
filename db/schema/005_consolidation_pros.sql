-- Migration 005 : consolidation du référentiel pros.
-- Doctrine identique à 004 : l'import (import_sirene) est la seule écriture
-- source, ce job SQL consolide vers pros_referentiel, idempotent par siren.
-- Statut : tout pro importé démarre « référencé » — jamais « vérifié »
-- (qui exige une preuve documentaire fournie par le pro lui-même).
-- Garde anti-domicile : seules les personnes morales (nature juridique
-- distincte d'un entrepreneur individuel : 1000) reçoivent l'adresse de
-- leur établissement ; un mandataire EI reste sans adresse publique.

-- Unicity par siren pour l'idempotence de la consolidation (NULL siren =
-- inscription manuelle, autorisée plusieurs fois)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pros_siren
  ON pros_referentiel (siren) WHERE siren IS NOT NULL;

CREATE OR REPLACE FUNCTION consolide_pros()
RETURNS void LANGUAGE sql AS $$
  INSERT INTO pros_referentiel
    (raison_sociale, siren, statut_pro, adresse_publique, is_personne_physique)
  SELECT
    payload->>'nom',
    siren,
    'referencé',
    CASE
      WHEN payload->>'nature_juridique' = '1000' THEN NULL
      ELSE (payload->'etablissements'->0->>'adresse')
    END,
    (payload->>'nature_juridique') = '1000'
  FROM import_sirene
  WHERE payload->>'activite' IN ('68.31Z', '69.10Z')
  ON CONFLICT (siren) WHERE siren IS NOT NULL DO NOTHING;
$$;
