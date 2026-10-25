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
        'commerces', (
          SELECT c.commerces::text FROM import_comptages c
          WHERE c.code_insee = g.code_insee
        ),
        'associations', (
          SELECT c.associations::text FROM import_comptages c
          WHERE c.code_insee = g.code_insee
        )
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

-- Comptages commerces/associations : branchés sur import_comptages
-- (migration 006, alimentée par moissons/pros.py).
