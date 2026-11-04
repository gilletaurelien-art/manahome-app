# Pivot MANAhome : locations de courte durée

Cahier des charges produit. Vision validée : **« un Airbnb léger »** — un outil de
recherche de locations de courte durée côté voyageur, un extranet avec calendrier
côté propriétaire, **sans paiement en ligne**.

## Le produit en trois phrases

1. Le voyageur cherche un hébergement de court séjour sur le territoire
   (dates, lieu, capacité) et contacte le propriétaire par messagerie interne.
2. Le propriétaire gère son annonce et son calendrier de disponibilités depuis
   un extranet.
3. Personne ne paie jamais un séjour via MANAhome : la mise en relation est
   gratuite, l'hôte encaisse ses réservations lui-même, hors plateforme.

## Ce que « léger » veut dire (et garantit)

| Airbnb | MANAhome | Conséquence |
|---|---|---|
| Paiement + garantie plateforme | 0 €, encaissement par l'hôte | Aucun fonds de tiers, aucune conformité PSP, aucun litige à gérer |
| Commission ~15-18 % | 0 % | Argument concurrentiel central |
| Monétisation du classement | Tri SQL à adéquation, jamais achetable | Règle de tri existante, inchangée |
| Coordonnées exposées | Messagerie interne | Anti-spam, anti-arnaque, déjà construit |
| Généraliste mondial | Territorial (pilote Crozon) | Fiches enrichies de données de territoire |

## Parcours voyageur (remplace la landing actuelle)

- Recherche par **dates** (arrivée/départ), commune/zone, capacité, budget, type de bien.
- Résultats avec disponibilité réelle : une annonce sans créneau libre sur les
  dates demandées ne sort pas.
- Fiche annonce : photos (pipeline WebP existant), tarifs et frais détaillés
  (nuit, week-end, ménage, suppléments), capacité, conditions d'annulation,
  champs légaux (n° de déclaration meublé touristique, DPE), données de territoire.
- **Deux modes de réservation** : `immediate` (l'hôte a activé la confirmation
  automatique et renseigné toutes ses conditions) ou `demande` (l'hôte valide
  chaque séjour). Statut visible en continu des deux côtés : demande envoyée,
  acceptée, paiement attendu, séjour confirmé, clôturé.
- Paiement direct auprès de l'hôte (son PSP, échéancier éventuel) — jamais
  via MANAhome.
- Préparation : contrat et documents horodatés, adresse exacte et consignes
  communiquées à la confirmation uniquement (jamais publiques).
- Clôture : état des lieux, restitution de caution (préautorisation PSP hôte),
  avis — module avis en V2 après le pilote.

## Le cycle de vie d'un séjour (objet central du produit)

1. **Disponibilité** — le logement est ouvert à la réservation.
2. **Demande** — le voyageur choisit ses dates, voit le devis détaillé.
3. **Confirmation** — l'hôte accepte (ou l'auto-confirmation s'applique) ;
   les conditions sont figées ; les nuitées sont bloquées.
4. **Paiement** — le voyageur paie directement l'hôte via son PSP.
5. **Préparation** — contrat, accès, consignes, rappels avant arrivée.
6. **Séjour** — arrivée, nuitées, échanges, incidents tracés.
7. **Clôture** — départ, état des lieux, caution, avis.

Le statut est visible des deux côtés, à chaque étape. Le garant
anti-double-réservation est **en base** (contrainte d'exclusion + blocage
des nuitées à la confirmation), pas côté client.

## Parcours propriétaire (extranet)

- Dépôt d'annonce gratuit, avec champs spécifiques court terme :
  tarif par nuit, tarifs saisonniers (min.), capacité, règles du logement.
- **Calendrier de disponibilités** : blocage/ouverture des nuitées, la brique
  spécifique du pivot — sans elle, pas de recherche par dates.
- **Synchronisation iCal** (import/export, format standard sans convention
  commerciale) : l'hôte garde ses autres canaux sans double réservation ;
  les nuitées importées apparaissent comme blocages.
- Tarification : nuit, week-end, saison, durée min./max., ménage et
  suppléments, conditions d'annulation et délais de paiement.
- Gestion des demandes : historique, réponse, devis détaillé, documents
  contractuels générés automatiquement, rappels avant arrivée/départ.
- Champs légaux obligatoires pour publication : n° de déclaration (meublé
  touristique), classe DPE.
- Messagerie (existante), états des lieux et comptes-rendus réservés à
  l'offre gestionnaire (voir `docs/modele-economique.md`).

## Évolutions de schéma (migration 007 — figée)

- `annonces.offre` (`vente` | `location_courte_duree`) — l'offre se
  distingue du bien ; la vente existante reste possible.
- Tarifs court terme : `tarif_nuit`, `capacite` ; `code_insee` sur l'annonce
  (porte les règles de publication territoriales et les facettes de recherche).
- Table `annonces_indisponibilites` (nuitées bloquées) — le calendrier se
  stocke par exceptions sur blocage, pas par état par nuitée.
- **Garde-fou 1 — déclaration obligatoire pour publier, brouillon toujours
  possible** : un location_courte_duree ne passe en `publiee` QUE si les
  justificatifs requis existent ; un propriétaire sans numéro prépare son
  annonce en brouillon sans limite de temps. La territorialité des règles
  est portée par une table `regles_publication` (portée globale ou par
  commune) — jamais codée en dur.
- **Garde-fou 2 — quatre objets distincts, jamais confondus** :
  1. le document fourni (`justificatifs` : type, référence, délivré le,
     expire le) ;
  2. la vérification documentaire (`justificatif_verifications` : présence,
     validité apparente — une vérification ne se pose pas soi-même) ;
  3. le statut dérivé (`statut_justificatif()` : à jour / expiré / à
     vérifier — **jamais stocké**, recalculé à la lecture) ;
  4. l'événement horodaté (`evenements_sejour` : contrat, états des lieux,
     horodatage + charge utile).
  Cette séparation permet de faire évoluer les règles sans réécrire les
  preuves historiques.
- **Garde-fou 3 — publication indépendante de Sérénité** : la conformité de
  base (dépôt des justificatifs, vérification, publication) est gratuite.
  Sérénité vend le suivi des échéances et les alertes, jamais le droit
  d'être publié ; aucun verrou de publication ne lit de donnée
  d'abonnement.
- Paiement facilité : `lien_paiement` par hôte (PSP de l'hôte, jamais de montant
  de réservation stocké comme un flux nous appartenant) ; tables d'objets de
  preuve ci-dessus.
- `empreinte` (dédup) : recalcul incluant les nouveaux champs, à figer.

Validation juridique en parallèle : aucun encaissement ni lancement
commercial avant son résultat ; le schéma technique n'attend pas.
- RLS + `REVOKE ... FROM anon` + vues de publication : règles inchangées.

## Paiement facilité — « jamais dépositaire, toujours garant de preuve »

La confiance ne demande pas de garder l'argent, elle demande de rendre les
faits vérifiables. La preuve remplace le séquestre.

Séquencement :

1. **V1 — le protocole (aucun enjei financier)** : contrat type de location
   saisonnière horodaté, échéancier standard (acompte/solde) suivi dans la
   messagerie, checklist anti-arnaque avant paiement.
2. **V2 — le lien de paiement propriétaire** : l'hôte connecte **son propre
   PSP** (Stripe et équivalents) ; la conversation génère un bouton « payer
   [nom de l'hôte] ». Le marchand est l'hôte : MANAhome ne détient jamais de
   fonds, n'a pas de licence PSP à détenir, et ne prend jamais de commission
   (0 % définitif — bouclier juridique et commercial).
3. **V3 — le paiement en plusieurs fois (BNPL)** : Klarna est disponible comme
   moyen de paiement côté PSP de l'hôte. Le voyageur paie en plusieurs fois,
   l'hôte est payé intégral d'avance, le risque de crédit est entre Klarna et
   le voyageur — MANAhome reste hors du circuit. Garde éthique : l'option
   s'affiche neutre, elle ne se pousse jamais (le BNPL est du crédit à la
   consommation ; aucun encouragement).
4. **V4 (à étudier) — caution par préautorisation** : uniquement sur le PSP
   de l'hôte (le marchand capture, jamais nous). Une caution **détenue par
   MANAhome** reste interdite dans tous les scénarios ; l'option n'existe
   qu'entre l'hôte, son PSP et le voyageur, avec les objets de preuve comme
   dossier de contestation.

Objets de preuve (archivage horodaté, exploitables en litige ou par une
assurance) : contrat signé, états des lieux d'entrée/sortie photo-datés
(pipeline WebP existant), fil de messagerie. En cas de contestation PSP ou
BNPL, ces objets forment le dossier de défense de l'hôte.

Deux contrats distincts, jamais confondus : le contrat de location (hôte ↔
voyageur, archivé par MANAhome) et le contrat de crédit (voyageur ↔ PSP).
Aucun prestataire de paiement ne « récupère » le contrat de location.

Porte de sortie documentée, jamais planifiée : un séquestre chez un PSP
français agréé, en marque blanche, si un séjour haut de gamme l'exige —
le PSP est dépositaire, MANAhome est interface, 0 % toujours.

Répartition des pôles : la **mise en relation** (présence, publication,
messagerie) appartient à l'Alliance MANA, gratuite ; les **outils payants**
(lien de paiement, accompagnement BNPL, abonnements, distribution
d'assurance) appartiennent à TEMPOsystem. L'Alliance ne perçoit jamais de
revenu conditionné par une transaction — garde contre la requalification
de lucrativité (voir `docs/modele-economique.md`).

## Explicitement hors périmètre

- Caution **détenue par MANAhome**, garantie, remboursement — jamais :
  l'hôte encaisse chez son PSP, les litiges se règlent avec les objets de
  preuve, pas avec nos fonds (préautorisation chez le PSP de l'hôte : V4,
  affaire de l'hôte).
- Marketplace de services (ménage, linge, diagnostics, activités) : pas de
  rémunération partenaire, pas d'apport d'affaires — annuaire local gratuit,
  sans commission, sans mise en avant achetable.
- Vente de données territoriales, même agrégées : règle « jamais de revente
  de données » inchangée — les indicateurs vivent dans les conventions
  institutionnelles, sous seuil d'anonymisation.
- Channel manager vers Airbnb/Booking (API partenaires = convention commerciale ;
  l'export **iCal** standard pourra venir plus tard, sans convention).
- Mandat, négociation, transaction — loi Hoguet, inchangé.
- Encaissement côté plateforme : jamais — la réservation confirmée bloque
  bien les nuitées (l'objet `sejours`, garant en base), mais le calendrier
  n'est pas un système de paiement.
- Fonds de tiers sur un compte MANAhome — jamais, dans aucun scénario.

## Ordre de construction (pilote Crozon)

1. Migration 007 (schéma + RLS + vues) — inclut le séjour.
2. Recherche par dates et disponibilités fiables.
3. Demande de réservation avec réponse de l'hôte + calendrier propriétaire
   avec synchronisation iCal.
4. Devis détaillé, conditions figées, contrat et documents horodatés,
   paiement direct via le PSP de l'hôte, messages automatiques avant
   arrivée/départ.
5. Activation locale Crozon (accompagnement gratuit des premiers hôtes).
6. Logiciel gestionnaire (conciergeries) — après la brique location, sur
   abonnement TEMPOsystem.

Ensuite seulement : réservation instantanée généralisée, cautions par
préautorisation, module avis, intégrations avancées.
