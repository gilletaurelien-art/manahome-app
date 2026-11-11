# MANAhome (manahome.org)

La maison des IA — registre territorial non marchand, lisible par les assistants IA. Portail de location de vacances entre propriétaires et vacanciers — pilote Crozon (Finistère, Bretagne).

**Gratuit. Accompagné. Lisible par les IA.**

Partie de l'écosystème MANA (mana.bzh, mana.love, manafrance.org).

## Position

MANAhome est la maison des IA : un registre territorial non marchand, que toutes les familles d'assistants — américaines, européennes, chinoises — peuvent interroger librement. MANA ne rivalise pas avec les IA ; elle tient le registre honnête de son territoire de pilote. L'ordre du catalogue n'est pas à vendre : aucune mise en avant payante, aucune commission, les annonces importées passent derrière les directes à adéquation égale.

## Règles non négociables

- Gratuité intégrale du parcours particulier ; aucune monétisation du dépôt d'annonce.
- Jamais de revente de données ni de leads ; coordonnées jamais publiques (messagerie interne).
- Aucun acte réglementé (loi Hoguet) : pas de mandat, pas de négociation, pas de transaction, aucun encaissement — les paiements sont directs entre propriétaire et vacancier.
- Référentiel pros à 3 états (referencé / actif / verifié) — « vérifié » exige une preuve.
- Garde anti-domicile : jamais l'adresse domicile d'une personne physique sur une fiche publique (contrainte SQL + vue de publication).
- Pas de scraping ; toute donnée tierce entre par API/flux contractualisé.
- Badge de source obligatoire sur toute annonce importée ; une importée ne passe jamais devant une directe à adéquation égale (règle de tri SQL).
- Suppression = exclusion : les sauvegardes respectent des listes d'exclusion.
- Toute nouvelle table SQL = REVOKE ... FROM anon ; la lecture publique passe uniquement par les vues de publication.
- Jamais de photo dans ce repo — les médias vivent dans l'Object Storage S3.
- Vidéos / visites 3D : URL uniquement (contrainte CHECK en base).

## Stack

| Brique | Décision |
|---|---|
| Base de données | Postgres auto-hébergé + RLS + Auth (jamais Supabase cloud) |
| Photos | Object Storage S3 (compat OVHcloud / RustFS) ; pipeline WebP 1600px + thumbs, originaux éphémères |
| Front | React/TS + pré-rendu statique (Vite), servi par Caddy — zéro runtime Node en prod |
| LLM | API Mistral — rédaction assistée d'annonce uniquement |
| Déploiement | Docker Compose + Caddy, infra-agnostique |

## Démarrage local

\`\`\`bash
cp .env.example .env   # remplir les secrets (jamais commité)
docker compose up -d
\`\`\`

## Ordre de construction (séquence fixe)

1. ✅ Socle : repo, Docker Compose, pipeline de compression d'images.
2. Schéma SQL + RLS + vues de publication (validé le 25/10/2026 par Aurélien).
3. Pages publiques + pilier IA : fiche annonce, page territoire, JSON-LD, llms.txt.
4. Parcours propriétaire : dépôt gratuit, rédaction assistée, calendrier de réservation.
5. Importeur Gédéon : derrière feature flag (convention non signée).
6. Parcours voyageur + mise en relation : structure construite, activation à 30-50 annonces.
7. Espace pros / abonnements : NE PAS construire.

## Ton

Chaleureux, complice, factuel. Français par défaut, code en anglais. Chaque choix non trivial = un commentaire de code expliquant le POURQUOI en une ligne.
