-- Migration 010 : le rôle non-privilégié qui ARME la RLS.
--
-- ⭐ LA DERNIÈRE GARDE DU SERVICE APP. Jusqu'ici, DATABASE_URL parlait au
-- superuser du conteneur : la RLS ne s'applique pas au superuser — elle
-- était EN VEILLE, compensée par la propriété posée dans le SQL par le
-- service. Désormais, le service se connecte en manahome_app : les
-- policies de la 002/007/008 décident TOUT, et un bug du service ne peut
-- plus lire ou écrire chez un autre.
--
-- 🔴 SECRET JAMAIS EN BASE VERSIONNÉE : le rôle est créé NOLOGIN. Au
-- déploiement, l'opérateur lui donne son mot de passe (issu du .env) :
--   ALTER ROLE manahome_app LOGIN PASSWORD '<mot de passe du .env>';
-- et DATABASE_URL pointe sur manahome_app. Écrire le mot de passe ici
-- serait commettre un secret — doctrine du repo.

-- ===== 1. Le rôle =====
CREATE ROLE manahome_app NOLOGIN;

GRANT USAGE ON SCHEMA public, auth TO manahome_app;

-- Lecture publique : uniquement par les vues et fonctions — jamais les tables
GRANT SELECT ON annonces_publiques, pros_publiques, territoires TO manahome_app;
GRANT EXECUTE ON FUNCTION est_disponible(uuid, date, date) TO manahome_app;
GRANT EXECUTE ON FUNCTION statut_justificatif(uuid, text) TO manahome_app;
GRANT EXECUTE ON FUNCTION exigences_publication(text) TO manahome_app;

-- Écritures du service, table par table — pas de GRANT ALL à l'aveugle
GRANT SELECT, INSERT, UPDATE, DELETE ON utilisateurs, auth_local,
  annonces, annonces_medias, annonces_indisponibilites, annonces_ical,
  sejours, conversations, messages, justificatifs,
  evenements_sejour, regles_publication
TO manahome_app;
-- verrou du compte système : le service ne POSE jamais de vérification
GRANT SELECT ON justificatif_verifications TO manahome_app;
-- lecture du référentiel pour les écrans pros (la policy p_self reste)
GRANT SELECT ON pros_referentiel TO manahome_app;

-- ===== 2. Les policies d'ÉCRITURE que la 002 n'avait pas =====
-- La 002 a posé les policies de LECTURE (p_owner_*) ; sans policies
-- d'écriture, armer la RLS casserait chaque INSERT/UPDATE du service.

-- Utilisateurs : inscription en autonomie — l'app génère l'uuid AVANT
-- d'insérer et pose app.utilisateur : le compte se crée soi-même, et ne
-- peut créer QUE soi-même (un service piraté ne fabrique pas des comptes).
CREATE POLICY p_self_insert ON utilisateurs
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY p_self_update ON utilisateurs
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY p_self_auth_insert ON auth_local
  FOR INSERT WITH CHECK (utilisateur_id = auth.uid());

-- Annonces : le propriétaire écrit les siennes, jamais celles d'un autre
CREATE POLICY p_owner_annonces_insert ON annonces
  FOR INSERT WITH CHECK (proprietaire = auth.uid());
CREATE POLICY p_owner_annonces_update ON annonces
  FOR UPDATE USING (proprietaire = auth.uid())
  WITH CHECK (proprietaire = auth.uid());
CREATE POLICY p_owner_annonces_delete ON annonces
  FOR DELETE USING (proprietaire = auth.uid());

CREATE POLICY p_owner_medias_insert ON annonces_medias
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()));

CREATE POLICY p_owner_indispo_write ON annonces_indisponibilites
  FOR ALL USING (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()));

CREATE POLICY p_owner_ical_write ON annonces_ical
  FOR ALL USING (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()));

-- Séjours : le voyageur insère SA demande ; l'écriture ultérieure est
-- réservée au voyageur ou à l'hôte — les verrous de statut du service
-- restent dans le SQL des UPDATE, les policies n'ajoutent rien d'autre
CREATE POLICY p_voyageur_sejours_insert ON sejours
  FOR INSERT WITH CHECK (voyageur = auth.uid()
    AND EXISTS (SELECT 1 FROM annonces a
                WHERE a.id = annonce_id AND a.statut = 'publiee'));
CREATE POLICY p_parties_sejours_update ON sejours
  FOR UPDATE USING (voyageur = auth.uid()
    OR EXISTS (SELECT 1 FROM annonces a
               WHERE a.id = sejours.annonce_id
                 AND a.proprietaire = auth.uid()));

-- Conversations : l'acheteur ouvre, le vendeur ne peut PAS ouvrir chez lui
CREATE POLICY p_acheteur_conv_insert ON conversations
  FOR INSERT WITH CHECK (acheteur = auth.uid()
    AND EXISTS (SELECT 1 FROM annonces a
                WHERE a.id = annonce_id
                  AND a.proprietaire = vendeur
                  AND a.statut = 'publiee'));

-- Messages : un participant écrit, la participation est vérifiée à l'écrit
-- (le WITH CHECK protège le cas où la conversation changerait de main)
CREATE POLICY p_participants_msg_insert ON messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
      AND (c.acheteur = auth.uid() OR c.vendeur = auth.uid())));

-- Justificatifs et événements : le propriétaire de l'annonce dépose
CREATE POLICY p_owner_justificatifs_insert ON justificatifs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()));
CREATE POLICY p_owner_justificatifs_delete ON justificatifs
  FOR DELETE USING (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()));

CREATE POLICY p_owner_evenements_insert ON evenements_sejour
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM annonces a
    WHERE a.id = annonce_id AND a.proprietaire = auth.uid()));

-- ===== 3. Les deux adaptations qu'un service sous RLS exige =====

-- Le service lit le TITRE des annonces publiées (liste des séjours,
-- conversations) : la vue annonces_publiques ne joint pas. Une policy de
-- lecture des lignes publiées — pas des brouillons, jamais des retirées.
-- Le service n'est pas le public : les colonnes techniques qu'il voit ne
-- sortent jamais d'un endpoint (aucune vue ne les expose).
CREATE POLICY p_lire_publiees ON annonces
  FOR SELECT USING (statut = 'publiee');

-- La connexion lit un compte AVANT de savoir qui appelle : la RLS
-- bloquerait. Cette fonction dédiée est le SEUL chemin hors-RLS de
-- l'authentification — SECURITY DEFINER, search_path figé, révoquée au
-- public, exécutable par le seul service. Elle rend le haché pour que la
-- vérification scrypt reste dans le service (le sel vit côté Node).
CREATE OR REPLACE FUNCTION auth.identifiants(p_email text)
RETURNS TABLE (id uuid, email text, mot_de_passe_hash text)
LANGUAGE sql SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT u.id, u.email, a.mot_de_passe_hash
  FROM utilisateurs u
  JOIN auth_local a ON a.utilisateur_id = u.id
  WHERE lower(u.email) = lower(p_email) AND u.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION auth.identifiants(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth.identifiants(text) TO manahome_app;
