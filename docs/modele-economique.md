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
| Gestionnaire (≤ 15 biens) | Tableau de bord multi-biens, conformité (n° de déclaration, DPE, assurance), rédaction assistée multi-annonces, contrats et états des lieux horodatés, comptes-rendus propriétaires, présence portail de tous leurs biens | 49 €/mois |
| Gestionnaire (≤ 50 biens) | Idem, volume étendu | 99 €/mois |
| Structure importante | Idem, volume supérieur | 199 €/mois |

À 50 biens, le coût passe sous 1 €/logement/mois : l'objection prix
disparaît. Important : le gestionnaire achète un **outil de gestion**, pas un
droit d'exister sur le portail. Un gestionnaire non-abonné peut publier ses
biens gratuitement comme n'importe qui ; il paie pour les outils, pas pour
la place.

### 1bis. Conformité récurrente « Sérénité » (TEMPOsystem)

29 €/an par logement : dossier documentaire centralisé, alertes sur les
justificatifs qui expirent (attestation d'assurance, DPE, déclaration),
historique des contrats et états des lieux, préparation des éléments de
déclaration de taxe de séjour.

Ce levier colle à la doctrine des preuves datées : un justificatif n'est
pas un statut, c'est une pièce avec une date de validité — l'outil suit les
échéances, il ne « coche » rien. Garde : Sérénité atteste la présence et la
validité **apparente** des documents ; il ne garantit jamais la conformité
réelle du logement.

Services ponctuels complémentaires : constitution du dossier réglementaire
du meublé (29-99 €), signature électronique à valeur probante renforcée
(2-5 €/dossier). Les objets de preuve de base (contrat horodaté, état des
lieux) restent **gratuits** : ils sont l'infrastructure de confiance, pas
un produit.

### 2. Assistant individuel (TEMPOsystem)

Pour l'hôte particulier qui veut de l'aide : rédaction assistée, mise en
conformité, calendrier de réservation directe pour son propre site.
9 €/mois par personne — modèle déjà éprouvé dans l'écosystème MANA.

### 3. Conventions territoriales (Alliance MANA)

Office de tourisme, commune, communauté de communes : visibilité sur les
meublés du territoire, canal vers les loueurs, alternative souveraine aux
OTA étrangers. C'est une mission d'intérêt collectif, pas de la publicité.

| Niveau | Contenu | Prix annuel |
|---|---|---|
| Territoire partenaire | Référencement, canal vers les loueurs, visibilité sur l'offre déclarée | 500 € |
| Territoire accompagné | Idem + accompagnement des propriétaires dans leurs obligations | 1 000 € |
| Territoire équipé | Idem + tableau de bord territorial et suivi (offre déclarée, saisonnalité, préparation des déclarations de taxe de séjour) | 2 000 € |

Garde sur la taxe de séjour : MANAhome ne collecte pas la taxe (la
collecte obligatoire s'impose aux plateformes qui encaissent — précisément
pas nous) et ne se présente jamais comme collecteur ou déclarant officiel ;
l'outil produit des relevés que les hôtes et la commune exploitent sous
leur responsabilité.

### 4. Assurance (TEMPOsystem, mandataire ORIAS)

Distribution d'assurance villégiature (voyageur) et responsabilité
civile locative (propriétaire) via un partenaire assureur, en qualité de
mandataire d'assurance immatriculé ORIAS. Rémunération légale,
transparente, **déconnectée du prix du séjour**. Garde éthique : l'assurance
est recommandée et facilitée, jamais obligatoire par nous (vente liée) ;
les justificatifs sont vérifiés côté publication, pas imposés à l'achat
chez nous.

## Leviers écartés ou encadrés (décisions explicites)

- **Vente de données territoriales, même agrégées** : heurte la règle
  « jamais de revente de données ni de leads ». Les indicateurs agrégés
  sont inclus dans la convention « Territoire équipé » (service
d'observation financé par convention, pas un produit de données) et
  seulement au-dessus d'un seuil d'anonymisation (k-anonymité) — à la
  granularité d'une presqu'île, des séries trop fines re-identifient des
  logements individuels. Toute exception à la règle relève d'une décision
  explicite d'Aurélien, pas du modèle.
- **Marketplace de services** (ménage, linge, vélos, diagnostics, photos) :
  pas de rémunération partenaire, pas d'apport d'affaires — la dérive
  « expériences » d'Airbnb et la frontière Hoguet de l'entremise. La version
  propre : **annuaire de partenaires locaux, gratuit, sans commission, sans
  mise en avant achetable**.

## Marché adressable (repères)

- **Offices de tourisme** : ~1 200 organismes de tourisme en France (photographie
  du réseau ADN Tourisme), mais le nombre d'OT juridiquement distincts
  acheteurs est plus petit — viser les structures intercommunales capables de
  porter une convention pour plusieurs communes.
- **Conciergeries** : 5 000 à 9 000 entreprises identifiables selon les
  recensements (Majordia 8 872, Classement Conciergeries 5 645, MyHostKit
  5 232) ; marché très fragmenté, structures jeunes, souvent sans salarié.
- **Cible de lancement** : les conciergeries gérant plusieurs dizaines de
  logements et les OT intercommunaux — chaque conciergerie amène son
  portefeuille entier d'un coup.

| Objectif | Revenu annuel récurrent |
|---|---|
| 2 conciergeries + 1 convention | point mort (~4 000 €) |
| 50 conciergeries + 20 conventions | ~44 400 € |
| 100 conciergeries + 100 conventions | ~160 000 € |

Lecture : une petite part du marché français suffit largement — la
rentabilité ne dépend pas d'une conquête massive, mais d'une densité
territoriale réelle (le modèle ne se réplique que territoire par territoire).

## Périmètre légal (loi Hoguet) — à vérifier avant tout encaissement

- Ce qui est vendu : des outils logiciels de gestion et de conformité, de la
  distribution d'assurance (ORIAS), des conventions d'intérêt collectif.
  Aucune activité de négociation, de mandat, de transaction au nom du
  propriétaire.
- Ce qui n'existera jamais : la prise de mandat, la perception de fonds,
  la mise en relation rémunérée au succès (réussite = commission = acte
  réglementé).
- Un gestionnaire client reste responsable de ses mandats propres ;
  MANAhome ne fait qu'héberger ses outils.
- **Validation juridique préalable obligatoire** : l'affirmation « aucun
  acte réglementé » doit être vérifiée par un professionnel du droit sur le
  fonctionnement réel de la plateforme (mise en relation, rémunération des
  partenaires, services d'assistance) avant le premier encaissement.

## Scénarios de revenus (pilote Crozon)

| Scénario | Hypothèses | Revenu annuel |
|---|---|---|
| Amorçage | 0 conciergerie, 0 convention | 0 € — coût portail ~300-500 €/an, absorbé par l'écosystème |
| Point mort | 2 conciergeries OU 1 convention office de tourisme | ~2 400 à 4 000 € |
| Croisière | 3 conciergeries + 1 convention « équipée » + Sérénité + assistants individuels | ~10 000 à 15 000 € |

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
