# Modèle économique MANAhome

Validé par Aurélien le 04/11/2026. Décision : **tout le parcours particulier reste
gratuit ; le financement vient des pros de la gestion locative (conciergeries) et
des conventions territoriales.** Jamais de frais de dossier, jamais de commission
sur les réservations, jamais de frais voyageur.

## Ce qui ne changera jamais (règles non négociables, inchangées)

- Gratuité intégrale du parcours particulier : dépôt d'annonce, visibilité,
  mise en relation, messagerie — 0 €, définitivement.
- Aucune commission sur les réservations : MANAhome ne touche jamais l'argent
  d'un séjour. Pas de paiement, pas de garantie, pas de litige à gérer.
- Aucun frais de dossier ou d'abonnement pour un particulier hôte.
- Aucune monétisation du tri : la place d'une annonce dans les résultats
  n'est jamais achetable (règle de tri SQL existante, inchangée).
- La présence sur le portail n'est jamais conditionnée à un paiement.

## Les trois jambes de financement

### 1. Offre gestionnaire / conciergerie (TEMPOsystem)

Cible : les gestionnaires locaux de meublés touristiques (souvent 10 à 50
biens chacun sur le pilote Crozon). Ils ont un modèle économique (commission
de gestion) et des besoins d'outils réels.

| Formule | Contenu | Prix indicatif |
|---|---|---|
| Gestionnaire | Tableau de bord multi-biens, conformité (n° de déclaration, DPE, taxe de séjour), rédaction assistée multi-annonces, présence portail de tous leurs biens | 49 €/mois ou 5 €/mois/bien géré |

Important : le gestionnaire achète un **outil de gestion**, pas un droit
d'exister sur le portail. Un gestionnaire non-abonné peut publier ses biens
gratuitement comme n'importe qui ; il paie pour les outils, pas pour la place.

### 2. Assistant individuel (TEMPOsystem)

Pour l'hôte particulier qui veut de l'aide : rédaction assistée, mise en
conformité, calendrier de réservation directe pour son propre site.
9 €/mois par personne — modèle déjà éprouvé dans l'écosystème MANA.

### 3. Conventions territoriales (Alliance MANA)

Office de tourisme, commune, communauté de communes : visibilité sur les
meublés du territoire, canal vers les loueurs, alternative souveraine aux
OTA étrangers. 500 à 2 000 €/an par convention. C'est une mission d'intérêt
collectif, pas de la publicité.

## Périmètre légal (loi Hoguet) — à vérifier avant tout encaissement

- Ce qui est vendu : des outils logiciels de gestion et de conformité.
  Aucune activité de négociation, de mandat, de transaction au nom du
  propriétaire.
- Ce qui n'existera jamais : la prise de mandat, la perception de fonds,
  la mise en relation rémunérée au succès (réussite = commission = acte
  réglementé).
- Un gestionnaire client reste responsable de ses mandats propres ;
  MANAhome ne fait qu'héberger ses outils.

## Scénarios de revenus (pilote Crozon)

| Scénario | Hypothèses | Revenu annuel |
|---|---|---|
| Amorçage | 0 conciergerie, 0 convention | 0 € — coût portail ~300-500 €/an, absorbé par l'écosystème |
| Point mort | 2 conciergeries OU 1 convention office de tourisme | ~2 400 à 4 000 € |
| Croisière | 3 conciergeries + 1 convention + 20 assistants individuels | ~8 000 à 10 000 € |

Le point mort est atteint à **deux conciergeries partenaires** — et chacune
amène ses 10-50 biens en un seul déploiement : c'est aussi la solution au
problème d'approvisionnement de l'offre, sans flux externe et sans toucher
au particulier.

## Évolutions induites dans le plan de construction

L'ordre de construction du README mentionnait « Espace pros / abonnements :
NE PAS construire ». Cette décision le remplace : l'espace pros visé n'est
plus l'agence de vente immobilière mais le gestionnaire de locations
courtes durée — à construire après la brique location (calendrier,
champs légaux meublé de tourisme) et seulement après validation du
pivot location par Aurélien.
