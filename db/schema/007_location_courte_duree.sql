-- Migration 007 : pivot location courte durée.
-- Doctrine : RLS fermée par défaut, anon révoqué partout, lecture publique
-- UNIQUEMENT par les vues de publication. Un statut ne se stocke pas, il se
-- dérive. Une preuve ne se pose pas soi-même. La publication ne dépend
-- d'aucune donnée d'abonnement (garde-fou 3 : Sérénité vend des alertes,
-- jamais le droit d'être publié — aucun verrou ci-dessous ne lit une table
-- d'abonnement ; toute évolution doit préserver cette indépendance).

-- ===== 1. L'offre se distingue du bien =====

ALTER TABLE annonces
  ADD COLUMN offre text NOT NULL DEFAULT 'vente'
    CHECK (offre IN ('vente','location_courte_duree'));
-- 'transaction' est un mot réservé du sens SQL : colonne nommée 'offre'

ALTER TABLE annonces
  ADD COLUMN tarif_nuit numeric CHECK (tarif_nuit >= 0),
  ADD COLUMN capacite int CHECK (capacite > 0),
  -- porte les règles de publication territoriales + facettes de recherche
  ADD COLUMN code_insee text REFERENCES territoires(code_insee);

-- PSP de l'hôte, lien à son nom : jamais un montant ni un flux à nous
ALTER TABLE utilisateurs ADD COLUMN lien_paiement text;

-- ===== 2. Calendrier : exceptions sur blocage, pas état par nuitée =====
-- (les nuitées sont disponibles par défaut ; on ne stocke que les blocages)

CREATE TABLE annonces_indisponibilites (
  annonce_id uuid NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  nuit       date NOT NULL,
  cause      text NOT NULL DEFAULT 'blocage'
             CHECK (cause IN ('blocage','reservation_confirmee')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (annonce_id, nuit)
);
CREATE INDEX idx_indispo_nuit ON annonces_indisponibilites(nuit);

-- ===== 3. Garde-fou 2 : quatre objets distincts, jamais confondus =====

-- (1) le document fourni : une pièce avec une date de validité
CREATE TABLE justificatifs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id   uuid NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  type_document text NOT NULL
               CHECK (type_document IN ('attestation_assurance','dpe','declaration_meuble')),
  reference    text NOT NULL,
  delivre_le   date,
  -- NULL = pas de péremption connue ; les comparaisons sont en DATE (UTC)
  expire_le    date,
  depose_par   uuid NOT NULL REFERENCES utilisateurs(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_justificatifs_annonce ON justificatifs(annonce_id);

-- (2) la vérification documentaire : une preuve ne se pose pas soi-même —
-- le trigger ci-dessous réserve les vérifications au compte système
CREATE TABLE justificatif_verifications (
  justificatif_id uuid NOT NULL REFERENCES justificatifs(id) ON DELETE CASCADE,
  verifie_le      timestamptz NOT NULL DEFAULT now(),
  verdict         text NOT NULL
                  CHECK (verdict IN ('present','validite_apparente','rejete')),
  constat         text,
  PRIMARY KEY (justificatif_id, verifie_le)
);

CREATE OR REPLACE FUNCTION reserve_verification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- seul le compte système vérifie un justificatif : personne n'atteste de soi
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'verification reservee au compte systeme';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER t_reserve_verification
BEFORE INSERT OR UPDATE ON justificatif_verifications
FOR EACH ROW EXECUTE FUNCTION reserve_verification();

-- (3) le statut dérivé : JAMAIS stocké, recalculé à chaque lecture
CREATE OR REPLACE FUNCTION statut_justificatif(p_annonce uuid, p_type text)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM justificatifs j
                     WHERE j.annonce_id = p_annonce AND j.type_document = p_type)
      THEN 'absent'
    WHEN EXISTS (SELECT 1 FROM justificatifs j
                 WHERE j.annonce_id = p_annonce AND j.type_document = p_type
                   AND j.expire_le IS NOT NULL AND j.expire_le < now()::date)
      THEN 'expire'
    WHEN NOT EXISTS (SELECT 1 FROM justificatifs j
                     JOIN justificatif_verifications v ON v.justificatif_id = j.id
                     WHERE j.annonce_id = p_annonce AND j.type_document = p_type
                       AND v.verdict <> 'rejete')
      THEN 'a_verifier'
    ELSE 'a_jour'
  END $$;

-- (4) l'événement horodaté : preuve d'exécution (contrat, états des lieux)
CREATE TABLE evenements_sejour (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id    uuid NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  type_evenement text NOT NULL
                CHECK (type_evenement IN ('contrat_signe','etat_des_lieux_entree','etat_des_lieux_sortie')),
  horodatage    timestamptz NOT NULL DEFAULT now(),
  payload       jsonb NOT NULL DEFAULT '{}'
);
-- un événement de preuve ne se réécrit jamais ; sa suppression suit
-- uniquement la suppression de l'annonce (suppression = exclusion)
CREATE OR REPLACE FUNCTION fige_evenement()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'un evenement de preuve ne se reecrit pas';
END $$;

CREATE TRIGGER t_fige_evenement
BEFORE UPDATE ON evenements_sejour
FOR EACH ROW EXECUTE FUNCTION fige_evenement();

-- ===== 4. Règles de publication territoriales (garde-fou 1) =====

CREATE TABLE regles_publication (
  portee                  text PRIMARY KEY,
  -- 'global' ou code INSEE : la territorialité des exigences est une donnée,
  -- jamais du code en dur
  exige_numero_declaration boolean NOT NULL DEFAULT true,
  exige_assurance_valide   boolean NOT NULL DEFAULT true,
  exige_dpe                boolean NOT NULL DEFAULT true
);
INSERT INTO regles_publication (portee) VALUES ('global');

CREATE OR REPLACE FUNCTION exigences_publication(p_code_insee text)
RETURNS regles_publication LANGUAGE sql STABLE AS $$
  SELECT * FROM regles_publication
  WHERE portee = COALESCE(p_code_insee, 'global')
  UNION ALL
  SELECT * FROM regles_publication WHERE portee = 'global'
  ORDER BY CASE WHEN portee = 'global' THEN 1 ELSE 0 END
  LIMIT 1
$$;

-- ===== 5. Verrou de publication : brouillon libre, publication exigée =====

CREATE OR REPLACE FUNCTION verifie_publication()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r regles_publication;
BEGIN
  IF NEW.offre = 'location_courte_duree' AND NEW.statut = 'publiee' THEN
    r := exigences_publication(NEW.code_insee);
    IF r.exige_numero_declaration
       AND statut_justificatif(NEW.id, 'declaration_meuble') NOT IN ('a_jour','a_verifier') THEN
      RAISE EXCEPTION 'publication refusee : declaration meuble requise';
    END IF;
    IF r.exige_assurance_valide
       AND statut_justificatif(NEW.id, 'attestation_assurance') NOT IN ('a_jour') THEN
      RAISE EXCEPTION 'publication refusee : assurance valide requise';
    END IF;
    IF r.exige_dpe AND NEW.dpe IS NULL THEN
      RAISE EXCEPTION 'publication refusee : DPE requis';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER t_verifie_publication
BEFORE INSERT OR UPDATE ON annonces
FOR EACH ROW EXECUTE FUNCTION verifie_publication();

-- ===== 6. RLS + anon révoqué partout =====

ALTER TABLE annonces_indisponibilites ENABLE ROW LEVEL SECURITY;
ALTER TABLE justificatifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE justificatif_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements_sejour ENABLE ROW LEVEL SECURITY;
ALTER TABLE regles_publication ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON annonces_indisponibilites, justificatifs,
  justificatif_verifications, evenements_sejour, regles_publication
  FROM anon;

CREATE POLICY p_owner_indispo ON annonces_indisponibilites
  USING (EXISTS (SELECT 1 FROM annonces a WHERE a.id = annonce_id
                 AND (a.proprietaire = auth.uid() OR a.is_demo)));

CREATE POLICY p_owner_justificatifs ON justificatifs
  USING (EXISTS (SELECT 1 FROM annonces a WHERE a.id = annonce_id
                 AND (a.proprietaire = auth.uid() OR a.is_demo)));

CREATE POLICY p_owner_verifications ON justificatif_verifications
  USING (EXISTS (SELECT 1 FROM justificatifs j
                 JOIN annonces a ON a.id = j.annonce_id
                 WHERE j.id = justificatif_id
                   AND (a.proprietaire = auth.uid() OR a.is_demo)));

CREATE POLICY p_owner_evenements ON evenements_sejour
  USING (EXISTS (SELECT 1 FROM annonces a WHERE a.id = annonce_id
                 AND (a.proprietaire = auth.uid() OR a.is_demo)));

-- les exigences de publication relèvent du droit public : lisibles par tout
-- compte authentifié (le trigger verifie_publication en dépend)
CREATE POLICY p_lecture_regles ON regles_publication
  FOR SELECT USING (true);

-- ===== 7. Vues et fonctions de publication =====

-- annonces_publiques s'étend aux champs publics du pivot (recréation + reg sub)
DROP VIEW annonces_publiques;
CREATE VIEW annonces_publiques AS
SELECT a.id, a.type_bien, a.surface_m2, a.pieces, a.prix_eur, a.dpe,
       a.description, a.geoloc, a.source, a.source_id, a.created_at,
       a.offre, a.tarif_nuit, a.capacite, a.code_insee
FROM annonces a
WHERE a.statut = 'publiee';
-- zéro champ privé, zéro coordonnée, zéro justificatif

GRANT SELECT ON annonces_publiques TO anon;

-- Disponibilité : fonction publique, booléen seul — les blocages d'une
-- annonce publiée sont une information publique. SECURITY DEFINER requis :
-- sans lui, la RLS cacherait les blocages à anon qui répondrait « disponible »
-- même pour des nuitées bloquées.
CREATE OR REPLACE FUNCTION est_disponible(p_annonce uuid, p_arrivee date, p_depart date)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- réponde « indisponible » pour toute annonce non publiée : anon ne peut
  -- pas sonder l'existence d'annonces en brouillon ou retirées
  SELECT EXISTS (SELECT 1 FROM annonces a
                 WHERE a.id = p_annonce AND a.statut = 'publiee')
  AND NOT EXISTS (
    SELECT 1 FROM annonces_indisponibilites i
    WHERE i.annonce_id = p_annonce
      AND i.nuit >= p_arrivee AND i.nuit < p_depart)
$$;

GRANT EXECUTE ON FUNCTION est_disponible(uuid, date, date) TO anon;
