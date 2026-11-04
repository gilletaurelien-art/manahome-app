# Branchement back : de la démo localStorage à la migration 007

Cahier des charges du service `app` (docker-compose, `app:3000`, servi par
Caddy sous `/api/*`). Le service n'existe pas encore — ce document fixe ce
qu'il doit exposer pour que les quatre modules front de la démo passent sur
la vraie base **sans changer une seule sémantique**.

## Principe directeur

**La démo a déjà les bonnes sémantiques ; le back les hérite, il ne les
réinvente pas.** Bord de départ exclu, statuts du séjour exacts, statut
dérivé jamais stocké, vérification réservée au compte système : tout est
déjà écrit, testé côté front (56 tests) et en base (migration 007). Le
branchement est un travail de transport, pas de refonte.

## Le mapping modules front → base

| Module front (démo) | Devient | Table/vue/fonction SQL (007) |
|---|---|---|
| `annoncesLocales.ts` | CRUD annonces du compte | `annonces` + vues de publication |
| `calendrierDonnees.ts` | blocage des nuitées | `annonces_indisponibilites` |
| (import iCal collé) | import serveur planifié | `annonces_ical` + blocages cause `blocage` |
| `disponibilite.ts` | la même sémantique, côté serveur | `est_disponible(uuid, date, date)` |
| `sejoursDonnees.ts` | le cycle du séjour | `sejours` + trigger `verrouille_nuitees_sejour` |
| `messagerieDonnees.ts` | conversations et messages | `conversations`, `messages` |

⭐ RÈGLE DES MIROIRS : chaque module front garde SES fonctions pures comme
source de vérité des sémantiques (bord exclu, plage invalide = pas de filtre).
Le back est tenu de produire les mêmes résultats — le test de non-régression
est de faire tourner la suite existante contre les deux implémentations.

## L'API proposée (v1)

Auth : sessions du service `app` (cookie SameSite) ; le service traduit la
session en `auth.uid()`-équivalent pour la RLS. **Jamais d'écriture pour
anon** — la lecture publique passe uniquement par les vues de publication
déjà en place (`annonces_publiques`).

| Endpoint | Rôle | Miroir de |
|---|---|---|
| `GET /api/annonces?arr&dep&q…` | recherche publique, dates incluses | vue + `est_disponible()` |
| `GET /api/annonces/:id` | fiche publique | vue de publication |
| `POST /api/annonces` | dépôt (brouillon) — gratuit, sans condition | INSERT `annonces` |
| `POST /api/annonces/:id/publier` | passage en `publiee` — le verrou 007 tranche | trigger `verifie_publication` |
| `GET/PUT /api/annonces/:id/indisponibilites` | blocage/libération des nuitées | `annonces_indisponibilites` |
| `POST /api/annonces/:id/ical` | import d'une URL iCal (serveur, planifié) | `annonces_ical` |
| `POST /api/sejours` | demande de séjour | INSERT `sejours` (index unique) |
| `POST /api/sejours/:id/accepter` | hôte accepte | statut `acceptee` |
| `POST /api/sejours/:id/confirmer` | hôte confirme — le trigger bloque | trigger + contrainte d'exclusion |
| `POST /api/sejours/:id/annuler` | annulation — libération ciblée | trigger (cause ciblée) |
| `POST /api/sejours/:id/cloturer` | clôture | statut `cloturee` |
| `GET/POST /api/conversations…` | messagerie interne | `conversations`, `messages` |

Gardes d'implémentation :
- **Le refus de double réservation vient de la base** (contrainte d'exclusion
  GiST) : l'API traduit l'exception SQL en 409, elle ne re-teste rien côté
  Node — deux garants, c'est un garant de trop.
- **Aucun endpoint de paiement.** Le devis vit dans `sejours.conditions` ;
  le PSP de l'hôte ne nous regarde pas.
- **La vérification des justificatifs reste au compte système** (trigger
  007) : l'API n'atteste jamais de soi.

## Feature flags et bascule

`FEATURE_BACK=false` par défaut : le front continue en démo localStorage.
Bascule par module (annonces réelles d'abord, séjours ensuite), selon le
précédent `FEATURE_GEDEON` : **un flag éteint n'affiche rien, ne casse rien,
et le site reste serviable en démo** — c'est la doctrine de déploiement du
repo (fonction AVANT l'app).

## Ce qui ne bougera jamais

- Gratuité du dépôt et de la mise en relation ; aucun montant de réservation
  ne transite par le back.
- Coordonnées jamais publiques : la mise en relation passe par la messagerie.
- La publication ne dépend d'aucune donnée d'abonnement (garde-fou 3).
- Lecture publique UNIQUEMENT par les vues de publication ; `anon` révoqué
  partout.

## Ordre de construction

1. Service `app` : socle Express/Fastify, sessions, RLS, health check.
2. `GET /api/annonces` (lecture publique derrière les vues) + bascule
   `FEATURE_BACK` sur `annoncesLocales`.
3. Indisponibilités + `est_disponible` (lecture publique) + bascule sur
   `calendrierDonnees`/`disponibilite`.
4. Séjours (le cycle complet) + bascule sur `sejoursDonnees`.
5. Import iCal serveur (URL planifiée) — remplace le collage manuel.
6. Messagerie.
