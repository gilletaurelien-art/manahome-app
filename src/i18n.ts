// La couche bilingue — 04/11/2026. Le site sert /fr/… et /en/… : la langue est
// un préfixe d'URL, jamais une préférence stockée (doctrine du mémo de famille :
// ce qui peut ne pas être demandé ne s'écrit pas).
//
// ⭐ TROIS CHOIX QUI NE SONT PAS DES GOÛTS.
// 1. LE DICTIONNAIRE A POUR CLÉ LE TEXTE FRANÇAIS. Le français est la source,
//    l'anglais est la traduction — pas deux sources à maintenir en parallèle.
//    Une clé absente affiche le français : le pire cas est un repli lisible,
//    jamais un trou.
// 2. LES CHEMINS NUS RESTENT SERVIS EN FRANÇAIS. Les URLs indexées avant le
//    bilingue (canoniques posées le 28/10) continuent d'afficher ET d'être
//    canonicalisées vers /fr/… : aucun lien partagé ne casse, Google consolide.
// 3. /fr EST EXPLICITE, MÊME PAR DÉFAUT. Deux langues à parité, aucune
//    « langue invisible » : le hreflang se pose sur les deux.

export const LOCALES = ["fr", "en"] as const;
export type Langue = (typeof LOCALES)[number];

/** Le français est la langue de la maison ; l'anglais, son miroir. */
export const LANGUE_PAR_DEFAUT: Langue = "fr";

/** Extrait la langue et le chemin nu d'un chemin d'URL (préfixe de base ôté). */
export function langueEtChemin(path: string): { langue: Langue; chemin: string } {
  const m = path.match(/^\/(fr|en)(\/|$)/);
  if (m) {
    return { langue: m[1] as Langue, chemin: path.slice(3) || "/" };
  }
  return { langue: LANGUE_PAR_DEFAUT, chemin: path || "/" };
}

/** Le préfixe d'URL d'une langue — vide pour aucune. */
export const prefixeDe = (l: Langue): string => `/${l}`;

/**
 * La traduction anglaise d'un texte français, ou le texte lui-même en repli.
 * Le repli EST le comportement voulu pour les pages pas encore traduites :
 * l'anglais partiel est plus honnête qu'un site moitié vide.
 */
export function t(langue: Langue, texte: string): string {
  return langue === "en" ? DICO_EN[texte] ?? texte : texte;
}

/**
 * Les traductions des surfaces traduites à ce jour : le chrome partagé (nav,
 * pied de page) et la page d'accueil. Les autres pages (publier, estimation,
 * pros, approche, messagerie, espace-pro, mes-annonces, mentions) servent le
 * français sous /en/ jusqu'à traduction — elles s'ajoutent ICI, clé par clé,
 * sans toucher au reste de l'app.
 */
const DICO_EN: Record<string, string> = {
  // ── Barre de navigation ──
  "Annonces": "Listings",
  "Territoire": "Territory",
  "Publier": "Publish",
  "Changer de langue": "Switch language",

  // ── Moteur de recherche de l'accueil (repositionné 04/11/2026 : location
  // de vacances uniquement, plus de choix acheter/vendre/services) ──
  "Je cherche": "I'm looking for",
  "Trouver un séjour": "Find a stay",
  "Louer mon bien": "List my property",
  "Commune ou code postal": "Town or postcode",
  "Rechercher": "Search",

  // ── Hero ──
  "Les vacances, autrement": "Holidays, differently",

  // ── Sections de l'accueil ──
  "Découvrez les séjours": "Explore the stays",
  "Des locations de vacances, près de chez vous": "Holiday rentals, near you",
  "Un accès direct aux annonces, sans compte à créer. En pilote, le catalogue est volontairement restreint et soigné — chaque fiche est structurée, sourcée, honnête.":
    "Direct access to listings, no account needed. As a pilot, the catalogue is deliberately small and carefully kept — every listing is structured, sourced, honest.",
  "Parcourir le catalogue du pilote": "Browse the pilot catalogue",
  "Louez votre logement avec MANA": "List your property with MANA",
  "Vous gardez la main. MANA vous accompagne.": "You stay in charge. MANA supports you.",
  "Préparation de l'annonce, documents à prévoir (déclaration de meublé touristique, attestation d'assurance), calendrier de réservation : le propriétaire reste maître de son bien.":
    "Listing preparation, documents to plan (short-term rental declaration, insurance certificate), booking calendar: the owner stays in charge of their property.",
  "Publier mon annonce": "Publish my listing",
  "Annonces pour les IA": "Listings for AIs",
  "Votre logement mérite d'être trouvé, pas noyé.":
    "Your property deserves to be found, not drowned.",
  "Caractéristiques organisées, informations utiles, page publique accessible aux moteurs et assistants compatibles.":
    "Organised characteristics, useful information, a public page accessible to search engines and compatible assistants.",
  "Comprendre notre approche": "Understand our approach",
  "L'index des communes": "The index of towns",
  "Un lieu, une fiche : la vie autour du séjour.":
    "One place, one page: life around the stay.",
  "Transports, commerces, écoles, services, nature : chaque commune du territoire présentée honnêtement, avec des informations vérifiées lorsque c'est possible.":
    "Transport, shops, schools, services, nature: every town of the territory presented honestly, with verified information wherever possible.",
  "Découvrir le territoire de Crozon": "Discover the Crozon territory",

  // ── Le séjour (cycle de vie) ──
  "Voyageurs": "Guests",
  "Demander une réservation": "Request a booking",
  "Envoyer ma demande": "Send my request",
  "La demande n'est pas un paiement : vous réglerez l'hôte directement, via son propre moyen de paiement. Aucun encaissement ne passe par MANAhome.":
    "A request is not a payment: you will pay the host directly, via their own payment method. No money ever goes through MANAhome.",
  "Vérifiez vos dates : arrivée avant départ, dates réelles.":
    "Check your dates: arrival before departure, real dates.",
  "Indiquez au moins un voyageur.": "At least one guest, please.",
  "Ces dates ne sont pas disponibles pour ce logement.":
    "These dates are not available for this listing.",
  "Vous avez déjà une demande en cours pour ce logement.":
    "You already have a pending request for this listing.",
  "Demande envoyée — l'hôte vous répond prochainement.":
    "Request sent — the host will reply shortly.",
  "Demande acceptée — l'hôte attend votre paiement (directement auprès de lui).":
    "Request accepted — the host awaits your payment (directly to them).",
  "Paiement attendu — directement auprès de l'hôte.":
    "Payment expected — directly to the host.",
  "Séjour confirmé. Les nuitées sont bloquées.":
    "Stay confirmed. The nights are blocked.",
  "Séjour annulé.": "Stay cancelled.",
  "Séjour terminé.": "Stay completed.",
  "Mes séjours": "My stays",
  "Démo locale : ce navigateur joue les deux rôles — vous voyez la demande du voyageur ET les commandes de l'hôte. En production, chaque côté ne voit que le sien, et aucun paiement ne transite ici.":
    "Local demo: this browser plays both roles — you see the guest's request AND the host's controls. In production each side sees only its own, and no payment ever transits here.",
  "voyageur(s)": "guest(s)",
  "Accepter": "Accept",
  "Confirmer le séjour": "Confirm the stay",
  "Clôturer": "Close out",
  "Annuler": "Cancel",
  "demande envoyée": "request sent",
  "acceptée": "accepted",
  "paiement attendu": "payment expected",
  "confirmé — nuitées bloquées": "confirmed — nights blocked",
  "annulé": "cancelled",
  "terminé": "completed",

  // ── Bascule FEATURE_BACK (module séjours) ──
  "Ces dates viennent d'être réservées ailleurs.":
    "These dates have just been booked elsewhere.",
  "Ce séjour n'est plus dans l'état attendu pour ce geste.":
    "This stay is no longer in the state expected for this action.",
  "Une erreur est survenue.": "Something went wrong.",

  // ── Bascule FEATURE_BACK (session + calendrier) ──
  "Mon compte": "My account",
  "Se déconnecter": "Sign out",
  "Se connecter": "Sign in",
  "Créer mon compte": "Create my account",
  "Email": "Email",
  "Mot de passe": "Password",
  "…": "…",
  "Identifiants invalides.": "Invalid credentials.",
  "Inscription impossible — vérifiez votre email et un mot de passe de 10 caractères minimum.":
    "Sign-up unavailable — check your email and a password of at least 10 characters.",
  "Les nuitées de vos annonces réelles se gèrent avec votre compte ; sans compte, le calendrier de démonstration reste actif.":
    "The nights of your real listings are managed with your account; without an account, the demonstration calendar stays active.",

  // ── Bascule FEATURE_BACK (module annonces) ──
  "Le service des annonces est momentanément indisponible — le catalogue de démonstration s'affiche.":
    "The listings service is temporarily unavailable — the demonstration catalogue is shown.",

  // ── Recherche par dates (voyageur) ──
  "Arrivée": "Arrival", "Départ": "Departure",
  "Séjour du {plage} — seules les annonces disponibles sur ces dates sont affichées.":
    "Stay from {plage} — only listings available on these dates are shown.",

  // ── Calendrier de l'extranet propriétaire ──
  "lun": "Mon", "mar": "Tue", "mer": "Wed", "jeu": "Thu",
  "ven": "Fri", "sam": "Sat", "dim": "Sun",
  "janvier": "January", "février": "February", "mars": "March",
  "avril": "April", "mai": "May", "juin": "June",
  "juillet": "July", "août": "August", "septembre": "September",
  "octobre": "October", "novembre": "November", "décembre": "December",
  "bloquée": "blocked", "disponible": "available",
  "Mois précédent": "Previous month", "Mois suivant": "Next month",
  "Bloquer une plage": "Block a range",
  "Cliquez la nuit de fin…": "Click the end night…",
  "Libérer ce mois": "Release this month",
  "Importer un calendrier externe (iCal)": "Import an external calendar (iCal)",
  "Collez le contenu de votre fichier .ics (Airbnb, Booking…)":
    "Paste the contents of your .ics file (Airbnb, Booking…)",
  "Importer les nuitées occupées": "Import busy nights",
  "Aucune nuitée lisible dans ce calendrier.": "No readable nights in this calendar.",
  "{n} nuitées bloquées, {i} évènement(s) illisible(s) ignoré(s).":
    "{n} nights blocked, {i} unreadable event(s) skipped.",
  "{n} nuitées bloquées.": "{n} nights blocked.",
  "Calendrier de mes nuitées": "My nights calendar",
  "Cliquez une nuitée pour la bloquer ou la libérer. Bloquer n'est pas réserver : MANAhome n'encaisse aucun paiement, et une nuitée non bloquée reste disponible partout où vous diffusez.":
    "Click a night to block or release it. Blocking is not booking: MANAhome never takes a payment, and a night that isn't blocked stays available wherever you list.",

  // ── Carte OSM de la fiche ──
  "Carte du quartier": "Area map",
  "Voir sur OpenStreetMap": "View on OpenStreetMap",
  "Localisation approximative au quartier, posée sur OpenStreetMap — la carte ne désigne jamais l'adresse précise du bien.":
    "Approximate neighbourhood location, served by OpenStreetMap — the map never points at the property's exact address.",

  // ── Pied de page ──
  "Publier — gratuit": "Publish — free",
  "Notre approche": "Our approach",
  "Ma messagerie": "My inbox",
  "Mes annonces": "My listings",
  "À propos": "About",
  "Mentions légales": "Legal notice",
  "Pied de page": "Footer",
  "Portail de locations de vacances, entre propriétaires et vacanciers — pilote Crozon, presqu'île du Finistère. Gratuit, accompagné, lisible par les IA. La structuration améliore les chances de compréhension et de découverte ; elle ne garantit pas qu'un assistant IA indexera, recommandera ou citera une annonce.":
    "A holiday rental portal, between owners and guests — Crozon pilot, Finistère peninsula. Free, supported, AI-readable. Structuring improves the chances of understanding and discovery; it does not guarantee that an AI assistant will index, recommend or cite a listing.",
};
