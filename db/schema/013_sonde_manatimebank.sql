-- Migration 013 : la sonde MANAtimebank.
--
-- Source qui fait foi : docs/cahier-sonde-manatimebank.md (v0.3), dans
-- gilletaurelien-art/manatimebank. Brique hébergée ICI par décision
-- d'Aurélien du 14/11/2026 : pas de dépôt dédié, le service KS-5 de
-- manahome-app porte la sonde ; le site statique manatimebank n'héberge
-- rien.
--
-- ⚠️ À NE JOUER QU'APRÈS RELECTURE (« jamais jouée à l'aveugle », cahier
-- §8.1). Ce fichier est écrit, pas exécuté, par cette session.
--
-- LE CANON (cahier §1, aucune négociation) :
-- - 1 MANA = 1 seconde. Aucune colonne de solde, nulle part (I1).
-- - Frappe double : un geste de don crée DEUX lignes dans la même
--   transaction (face 'don' chez le donneur, face 'reception' créditée
--   au receveur), jamais une seule, jamais un UPDATE qui débite. Les deux
--   portent la même empreinte_fait (sha256).
-- - Accumulation à vie : aucun DELETE métier hors l'auteur (règle du
--   Carnet) ; aucune colonne ne peut baisser.
-- - La dotation (86 400 MANA/jour, affichage) N'EXISTE PAS ICI — I3
--   l'exige : c'est un calcul pur côté module JS (app/sondeMint.mjs),
--   jamais une lecture de base.

-- ===== 1. Le fait consigné =====

CREATE TABLE temoins_temps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empreinte_fait text NOT NULL,
  face           text NOT NULL CHECK (face IN ('don', 'reception')),
  a_donne        uuid NOT NULL REFERENCES utilisateurs(id),
  a_recu         uuid REFERENCES utilisateurs(id), -- NULL = le commun
  duree_s        integer NOT NULL CHECK (duree_s > 0 AND duree_s % 60 = 0),
  jour           date NOT NULL,
  dimension      text CHECK (dimension IN (
                    'temps_humain', 'solidarite', 'ecologie',
                    'regeneration', 'equite_temporelle', 'durabilite'
                  )), -- I6 : facultative, jamais NOT NULL
  mot_libre      text CHECK (char_length(mot_libre) <= 2000), -- reste au cercle, ne monte jamais
  code_insee     text, -- facultatif : grain territorial de v_agregats_territoire
  declare_par    uuid NOT NULL REFERENCES utilisateurs(id),
  cree_le        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_temoins_temps_empreinte ON temoins_temps (empreinte_fait);
CREATE INDEX idx_temoins_temps_donne ON temoins_temps (a_donne);
CREATE INDEX idx_temoins_temps_recu ON temoins_temps (a_recu) WHERE a_recu IS NOT NULL;

ALTER TABLE temoins_temps ENABLE ROW LEVEL SECURITY;

-- I1 tient aussi par absence : aucune policy UPDATE n'est posée ci-dessous,
-- et aucun GRANT UPDATE n'est accordé en fin de fichier — une trace créée
-- ne se modifie plus, structurellement, pas seulement par convention.
CREATE POLICY p_donneur_temoin_insert ON temoins_temps
  FOR INSERT WITH CHECK (declare_par = auth.uid());

-- Porte donneur : je lis ce que j'ai donné.
CREATE POLICY p_donneur_temoin_lecture ON temoins_temps
  FOR SELECT USING (face = 'don' AND a_donne = auth.uid());

-- Porte receveur : je lis ce que j'ai reçu — jamais visible au donneur (I8).
CREATE POLICY p_receveur_temoin_lecture ON temoins_temps
  FOR SELECT USING (face = 'reception' AND a_recu = auth.uid());

-- Règle du Carnet (cahier §5) : seul l'auteur de la déclaration supprime,
-- définitivement. Les agrégats déjà publiés deviennent des « faits sans
-- source » si cités — ce fichier ne traite pas cette ré-écriture, c'est
-- une politique applicative en aval.
CREATE POLICY p_auteur_temoin_delete ON temoins_temps
  FOR DELETE USING (declare_par = auth.uid());


-- ===== 2. La veille (le care en période) =====

CREATE TABLE veilles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur     uuid NOT NULL REFERENCES utilisateurs(id),
  ouverte_le timestamptz NOT NULL DEFAULT now(),
  fermee_le  timestamptz,
  dimension  text CHECK (dimension IN (
               'temps_humain', 'solidarite', 'ecologie',
               'regeneration', 'equite_temporelle', 'durabilite'
             )),
  mot_libre  text CHECK (char_length(mot_libre) <= 2000),
  code_insee text,
  temoin_id  uuid REFERENCES temoins_temps(id) -- posé à la fermeture, une fois
);

ALTER TABLE veilles ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_auteur_veille_insert ON veilles
  FOR INSERT WITH CHECK (auteur = auth.uid());
CREATE POLICY p_auteur_veille_lecture ON veilles
  FOR SELECT USING (auteur = auth.uid());

-- Le SEUL UPDATE que cette migration autorise, sur cette table : fermer
-- une veille encore ouverte. temoins_temps, lui, n'a AUCUNE policy UPDATE.
CREATE POLICY p_auteur_veille_fermeture ON veilles
  FOR UPDATE USING (auteur = auth.uid() AND fermee_le IS NULL)
  WITH CHECK (auteur = auth.uid());


-- ===== 3. Le merci libre (jamais compté — I2) =====

CREATE TABLE merci (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur       uuid NOT NULL REFERENCES utilisateurs(id),
  destinataire uuid NOT NULL REFERENCES utilisateurs(id),
  texte        text NOT NULL CHECK (char_length(texte) BETWEEN 1 AND 2000),
  cree_le      timestamptz NOT NULL DEFAULT now()
);
-- I2 tient par absence : aucune vue, aucun index agrégé, aucune fonction
-- de comptage ne référence cette table ailleurs dans ce fichier ni dans
-- app/*.mjs — vérifié par un test (app/sondeDedup.test.mjs).

ALTER TABLE merci ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_auteur_merci_insert ON merci
  FOR INSERT WITH CHECK (auteur = auth.uid());
CREATE POLICY p_parties_merci_lecture ON merci
  FOR SELECT USING (auteur = auth.uid() OR destinataire = auth.uid());


-- ===== 4. La réserve hebdomadaire de l'aidant =====

CREATE TABLE reserve_hebdo (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membre  uuid NOT NULL REFERENCES utilisateurs(id),
  semaine text NOT NULL, -- ISO, ex. '2026-W47'
  reponse text NOT NULL CHECK (char_length(reponse) <= 500),
  cree_le timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membre, semaine)
);
-- Immuable comme le reste du registre : une semaine, une réponse. Pas de
-- policy UPDATE — l'API fait un INSERT ... ON CONFLICT DO NOTHING.

ALTER TABLE reserve_hebdo ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_membre_reserve_insert ON reserve_hebdo
  FOR INSERT WITH CHECK (membre = auth.uid());
CREATE POLICY p_membre_reserve_lecture ON reserve_hebdo
  FOR SELECT USING (membre = auth.uid());


-- ===== 5. L'invariant public et les agrégats =====
--
-- Ces deux vues/fonctions tournent avec les privilèges de LEUR PROPRIÉTAIRE
-- (comportement par défaut d'une vue Postgres, hors security_invoker) —
-- donc au-dessus des policies p_donneur_*/p_receveur_* qui, elles,
-- cloisonnent la lecture directe de la table par membre. C'est voulu :
-- l'invariant et les agrégats ne nomment jamais personne, donc leur
-- diffusion large ne contredit pas I8/I5 — mais ce fichier doit être joué
-- par le même rôle superuser que les migrations précédentes pour que ce
-- contournement RLS reste celui du propriétaire, jamais de manahome_app.

CREATE VIEW v_invariant_public AS
SELECT
  empreinte_fait,
  coalesce(sum(duree_s) FILTER (WHERE face = 'don'), 0)       AS emis_s,
  coalesce(sum(duree_s) FILTER (WHERE face = 'reception'), 0) AS recu_s
FROM temoins_temps
GROUP BY empreinte_fait;

-- Agrégat territorial brut (interne) — le seuil n≥5 (I7) est appliqué par
-- la fonction ci-dessous, jamais par la vue elle-même, pour qu'aucun appel
-- direct à la vue ne puisse contourner le plancher.
CREATE VIEW v_agregats_territoire_brut AS
SELECT
  code_insee,
  jour,
  dimension,
  count(DISTINCT empreinte_fait)                   AS evenements,
  coalesce(sum(duree_s) FILTER (WHERE face = 'don'), 0) AS secondes_donnees
FROM temoins_temps
WHERE code_insee IS NOT NULL
GROUP BY code_insee, jour, dimension;

CREATE FUNCTION v_agregats_territoire()
RETURNS TABLE (
  code_insee text, jour date, dimension text,
  evenements bigint, secondes_donnees bigint
) LANGUAGE sql STABLE AS $$
  -- I7 : une cellule de moins de 5 événements distincts ne sort jamais.
  SELECT code_insee, jour, dimension, evenements, secondes_donnees
  FROM v_agregats_territoire_brut
  WHERE evenements >= 5;
$$;

-- export_integral : la mortalité assumée (cahier §1 « registre véridique »)
-- — tout le registre, sans filtre n<5 : aucune colonne nominative n'y
-- figure, donc aucun contournement d'I5/I8 à exposer tout, à la différence
-- des agrégats territoriaux qui, eux, restent sous le plancher.
CREATE FUNCTION export_integral()
RETURNS TABLE (
  empreinte_fait text, face text, duree_s integer, jour date,
  dimension text, code_insee text
) LANGUAGE sql STABLE AS $$
  SELECT empreinte_fait, face, duree_s, jour, dimension, code_insee
  FROM temoins_temps;
$$;


-- ===== 6. Rôle manahome_app : les octrois de cette migration =====
-- Table par table, comme la 010 — pas de GRANT ALL à l'aveugle. Notez
-- l'ABSENCE de GRANT UPDATE sur temoins_temps et merci : I1 et l'immuabilité
-- du merci tiennent aussi au niveau du rôle, pas seulement des policies.

GRANT SELECT, INSERT, DELETE ON temoins_temps TO manahome_app;
GRANT SELECT, INSERT, UPDATE ON veilles TO manahome_app;
GRANT SELECT, INSERT ON merci TO manahome_app;
GRANT SELECT, INSERT ON reserve_hebdo TO manahome_app;
GRANT SELECT ON v_invariant_public TO manahome_app;
GRANT EXECUTE ON FUNCTION v_agregats_territoire() TO manahome_app;
GRANT EXECUTE ON FUNCTION export_integral() TO manahome_app;
