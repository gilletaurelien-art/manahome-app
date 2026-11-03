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

- Recherche par **dates** (arrivée/départ), commune/zone, capacité, type de bien.
- Résultats avec disponibilité réelle : une annonce sans créneau libre sur les
  dates demandées ne sort pas.
- Fiche annonce : photos (pipeline WebP existant), tarif par nuit, champs légaux
  (n° de déclaration meublé touristique, DPE), données de territoire.
- Contact = message interne ; jamais de coordonnée publique, jamais de
  bouton « réserver et payer ».

## Parcours propriétaire (extranet)

- Dépôt d'annonce gratuit, avec champs spécifiques court terme :
  tarif par nuit, tarifs saisonniers (min.), capacité, règles du logement.
- **Calendrier de disponibilités** : blocage/ouverture des nuitées, la brique
  spécifique du pivot — sans elle, pas de recherche par dates.
- Champs légaux obligatoires pour publication : n° de déclaration (meublé
  touristique), classe DPE.
- Messagerie (existante), états des lieux et comptes-rendus réservés à
  l'offre gestionnaire (voir `docs/modele-economique.md`).

## Évolutions de schéma (migration 007 — à figer avant codage)

- `annonces.transaction` (`vente` | `location_courte_duree`) — l'offre se
  distingue du bien ; la vente existante reste possible.
- Tarifs court terme : `tarif_nuit`, saisonnalité.
- Table `annonces_disponibilites` (créneaux bloqués par nuitée) — le calendrier
  se stocke par exceptions sur blocage, pas par état par nuitée.
- Champs légaux : `numero_declaration_meuble`, contrainte de publication.
- Paiement facilité : `lien_paiement` par hôte (PSP de l'hôte, jamais de montant
  de réservation stocké comme un flux nous appartenant) ; tables d'objets de
  preuve (contrat horodaté, états des lieux) — en V2, le champ est prévu dès
  la 007 pour éviter toute refonte.
- `empreinte` (dédup) : recalcul incluant les nouveaux champs, à figer.
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
- Réservation bloquante côté voyageur : le voyageur demande, le propriétaire
  confirme ; le calendrier n'est pas un système d'encaissement.
- Fonds de tiers sur un compte MANAhome — jamais, dans aucun scénario.

## Ordre de construction (V1)

1. Migration 007 (schéma + RLS + vues).
2. Extranet propriétaire : dépôt court terme + calendrier.
3. Recherche par dates + nouvelle landing voyageur.
4. Activation locale Crozon (offrir l'accompagnement gratuit aux premiers hôtes).
5. Logiciel gestionnaire (conciergeries) — après la brique location, sur
   abonnement TEMPOsystem.
