-- Couchages et équipements (04/11/2026) — le nombre de personnes que le
-- logement peut COUCHER (distinct de `capacite`, la limite de voyageurs
-- posée sur une réservation précise, migration 007), et quatre équipements
-- déclarés un par un, PAS un formulaire « tout ou rien ».
--
-- ⚠️ Chaque équipement est un booléen NOT NULL DEFAULT false — un
-- équipement non coché est un FAIT (« pas de piscine »), pas une case
-- restée vide. C'est différent de `couchages`, qui reste NULL tant que
-- le propriétaire ne l'a pas renseigné (on ne devine pas un nombre).

ALTER TABLE annonces
  ADD COLUMN couchages integer CHECK (couchages >= 0),
  ADD COLUMN parking boolean NOT NULL DEFAULT false,
  ADD COLUMN piscine boolean NOT NULL DEFAULT false,
  ADD COLUMN jardin boolean NOT NULL DEFAULT false,
  ADD COLUMN balcon boolean NOT NULL DEFAULT false;

-- annonces_publiques s'étend aux cinq nouveaux champs (recréation + reg sub,
-- même geste que 007 et 011 : une vue ne s'ALTER pas, elle se redéfinit).
DROP VIEW annonces_publiques;
CREATE VIEW annonces_publiques AS
SELECT a.id, a.type_bien, a.surface_m2, a.pieces, a.prix_eur, a.dpe,
       a.description, a.geoloc, a.source, a.source_id, a.created_at,
       a.offre, a.tarif_nuit, a.tarif_semaine, a.tarif_mois, a.capacite,
       a.couchages, a.parking, a.piscine, a.jardin, a.balcon,
       a.code_insee
FROM annonces a
WHERE a.statut = 'publiee';
-- zéro champ privé, zéro coordonnée, zéro justificatif

GRANT SELECT ON annonces_publiques TO anon;
