-- Migration 008 : authentification locale + auth.uid() réel.
-- Doctrine : RLS fermée par défaut, coordonnées jamais exposées, et le
-- mur d'autorisation VIT EN BASE — le service app ne décide rien, il
-- déclare QUI parle (SET LOCAL app.utilisateur) et la base tranche.

-- ===== 1. auth.uid() : la fonction que la 002 référençait sans la définir =====
-- ⚠️ DÉFAUT RÉEL CORRIGÉ ICI : les policies de la 002 appellent auth.uid(),
-- une fonction GoTrue/Supabase qui n'existait pas sur ce Postgres vanilla —
-- le docker-entrypoint-initdb.d aurait avorté sur la 002. La voici : elle lit
-- la variable de transaction posée par le service app (t = true : disparaît
-- à la fin de la transaction, jamais une session qui fuit entre requêtes).
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.utilisateur', true), '')::uuid
$$;

-- ===== 2. Les identifiants vivent À PART des coordonnées =====
-- La table utilisateurs (001) porte des données personnelles et n'a jamais
-- eu — pour cause — de colonne mot de passe. Les identifiants restent dans
-- une table dédiée, révoquée à anon, jamais jointe dans une vue publique.
-- Les mots de passe ne sont stockés que HACHÉS (scrypt côté service).
CREATE TABLE auth_local (
  utilisateur_id    uuid PRIMARY KEY REFERENCES utilisateurs(id) ON DELETE CASCADE,
  mot_de_passe_hash text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE auth_local ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON auth_local FROM anon;

-- seul le compte concerné lit sa ligne d'identifiants — jamais le hachage
-- d'un autre, même par erreur de code côté service
CREATE POLICY p_self_auth ON auth_local
  USING (utilisateur_id = auth.uid());

-- ===== 3. L'accès aux tables personnelles passe par auth.uid() =====
-- Le service app, qui vérifie le mot de passe, pose la variable de
-- transaction AVANT chaque écriture personnelle : la RLS de la 002 devient
-- effective sur ce Postgres vanilla, l'isolation est réelle et par requête.
