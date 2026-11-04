-- Tarifs multiples (04/11/2026) — le propriétaire choisit LIBREMENT quels
-- paliers il propose (nuit, semaine, mois), et les prix peuvent différer
-- sans aucun rapport de proportion entre eux (une semaine n'est pas 7 nuits
-- au même tarif). `tarif_nuit` existe déjà (migration 007) ; on lui ajoute
-- deux colonnes sœurs, chacune NULLABLE et indépendante — AU MOINS une des
-- trois doit être renseignée, jamais aucune (une annonce sans prix n'a rien
-- à vendre).

ALTER TABLE annonces
  ADD COLUMN tarif_semaine numeric CHECK (tarif_semaine >= 0),
  ADD COLUMN tarif_mois numeric CHECK (tarif_mois >= 0);

ALTER TABLE annonces
  ADD CONSTRAINT au_moins_un_tarif
    CHECK (tarif_nuit IS NOT NULL OR tarif_semaine IS NOT NULL OR tarif_mois IS NOT NULL);

-- annonces_publiques s'étend aux deux nouveaux tarifs (recréation + reg sub,
-- même geste que 007 : une vue ne s'ALTER pas, elle se redéfinit).
DROP VIEW annonces_publiques;
CREATE VIEW annonces_publiques AS
SELECT a.id, a.type_bien, a.surface_m2, a.pieces, a.prix_eur, a.dpe,
       a.description, a.geoloc, a.source, a.source_id, a.created_at,
       a.offre, a.tarif_nuit, a.tarif_semaine, a.tarif_mois, a.capacite,
       a.code_insee
FROM annonces a
WHERE a.statut = 'publiee';
-- zéro champ privé, zéro coordonnée, zéro justificatif

GRANT SELECT ON annonces_publiques TO anon;
