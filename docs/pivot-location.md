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
- `empreinte` (dédup) : recalcul incluant les nouveaux champs, à figer.
- RLS + `REVOKE ... FROM anon` + vues de publication : règles inchangées.

## Explicitement hors périmètre

- Paiement, caution, garantie, remboursement — jamais.
- Channel manager vers Airbnb/Booking (API partenaires = convention commerciale ;
  l'export **iCal** standard pourra venir plus tard, sans convention).
- Mandat, négociation, transaction — loi Hoguet, inchangé.
- Réservation bloquante côté voyageur : le voyageur demande, le propriétaire
  confirme ; le calendrier n'est pas un système d'encaissement.

## Ordre de construction (V1)

1. Migration 007 (schéma + RLS + vues).
2. Extranet propriétaire : dépôt court terme + calendrier.
3. Recherche par dates + nouvelle landing voyageur.
4. Activation locale Crozon (offrir l'accompagnement gratuit aux premiers hôtes).
5. Logiciel gestionnaire (conciergeries) — après la brique location, sur
   abonnement TEMPOsystem.
