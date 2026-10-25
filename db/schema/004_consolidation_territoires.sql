-- Migration 004 : consolidation — les imports deviennent l'enrichissement.
-- La page front lit territoires.enrichissement : ce job SQL est la seule
-- écriture, les sources sont datées pour l'honnêteté d'affichage.

CREATE OR REPLACE FUNCTION consolide_territoire(p_code_insee text)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO territoires (code_insee, nom, enrichissement)
  SELECT
    g.code_insee,
    g.nom,
    jsonb_build_object(
      'chiffres', jsonb_build_object(
        'habitants', g.population::text,
        'commerces', NULL,
        'associations', NULL
      ),
      'intercommunalite', g.nom_epci,
      'georisk', (
        SELECT jsonb_build_object(
          'synthese', r.rapport->>'synthese',
          'url', 'https://www.georisques.gouv.fr/mes-risques/connaitre-mes-risques/commune/' || g.code_insee
        ) FROM import_georisk r WHERE r.code_insee = g.code_insee
      ),
      'prix10ans', (
        SELECT jsonb_agg(
          jsonb_build_object('annee', d.annee, 'prixM2', d.prix_m2_median)
          ORDER BY d.annee
        ) FROM import_dvf d
        WHERE d.code_insee = g.code_insee AND d.type_local = 'Maison'
      ),
      'sources', jsonb_build_object(
        'geo', 'geo.api.gouv.fr',
        'georisk', 'georisques.gouv.fr',
        'dvf', 'data.gouv.fr (DVF)',
        'date_consolidation', now()::text
      )
    )
  FROM import_geo_communes g
  WHERE g.code_insee = p_code_insee
  ON CONFLICT (code_insee) DO UPDATE
    SET enrichissement = EXCLUDED.enrichissement,
        nom = EXCLUDED.nom;
$$;

-- Le comptage commerces/associations viendra de la consolidation SIRENE
-- (catégories NAF 47.x/55.x/56.x pour commerces, association=true pour
-- assos) — branchée quand l'import SIRENE du référentiel pros tournera.
