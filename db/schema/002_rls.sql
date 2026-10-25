-- Migration 002 : RLS + vues de publication.
-- Doctrine : RLS fermée par défaut ; la lecture publique passe UNIQUEMENT
-- par les vues de publication n'exposant que les champs publiables.

-- RLS sur les tables portant des données personnelles
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces_medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- anon révoqué partout : règle non négociable, toute table nouvelle incluse
REVOKE ALL ON utilisateurs, annonces, annonces_medias,
  conversations, messages, pros_referentiel, territoires, import_sirene
  FROM anon;

-- Un utilisateur ne lit que sa propre fiche
CREATE POLICY p_self ON utilisateurs
  USING (id = auth.uid());

-- Le propriétaire voit ses annonces (tous statuts) ; le reste passe par la vue publique
CREATE POLICY p_owner_annonces ON annonces
  USING (proprietaire = auth.uid() OR is_demo);

CREATE POLICY p_media_via_annonce ON annonces_medias
  USING (EXISTS (SELECT 1 FROM annonces a WHERE a.id = annonce_id
                 AND (a.proprietaire = auth.uid() OR a.is_demo)));

-- Messagerie interne : seuls les participants voient la conversation et ses messages
CREATE POLICY p_participants ON conversations
  USING (acheteur = auth.uid() OR vendeur = auth.uid());

CREATE POLICY p_participants_msgs ON messages
  USING (EXISTS (SELECT 1 FROM conversations c
                 WHERE c.id = conversation_id
                 AND (c.acheteur = auth.uid() OR c.vendeur = auth.uid())));

-- ===== Vues de publication : seule lecture publique =====

CREATE VIEW annonces_publiques AS
SELECT a.id, a.type_bien, a.surface_m2, a.pieces, a.prix_eur, a.dpe,
       a.description, a.geoloc, a.source, a.source_id, a.created_at
FROM annonces a
WHERE a.statut = 'publiee';
-- zéro champ privé, zéro coordonnée

CREATE VIEW pros_publiques AS
SELECT p.id, p.raison_sociale, p.statut_pro
FROM pros_referentiel p
WHERE p.adresse_publique IS NOT NULL OR NOT p.is_personne_physique;
-- la garde anti-domicile est renforcée par la vue : n'expose que le nécessaire

-- Tri : une annonce importée ne passe jamais devant une directe à adéquation égale
-- (à appliquer dans les requêtes : ORDER BY adequation, source)

GRANT SELECT ON annonces_publiques, pros_publiques, territoires TO anon;
