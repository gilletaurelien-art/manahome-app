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
  "Estimation": "Valuation",
  "Territoire": "Territory",
  "Pros": "Pros",
  "Publier": "Publish",
  "Changer de langue": "Switch language",

  // ── Moteur de recherche de l'accueil ──
  "Je cherche": "I'm looking for",
  "Acheter": "Buy",
  "Vendre": "Sell",
  "Louer": "Rent",
  "Services": "Services",
  "Agence immobilière / mandataire": "Estate agency / agent",
  "Notaire": "Notary",
  "Réparation & travaux": "Repair & works",
  "Ménage & nettoyage": "Housekeeping & cleaning",
  "Jardin & extérieur": "Garden & outdoors",
  "Garde de logement": "Home watching",
  "Diagnostics & expertise": "Surveys & expertise",
  "Autonomie & adaptation": "Independence & home adaptation",
  "Commune ou code postal": "Town or postcode",
  "Commune, métier ou besoin": "Town, trade or need",
  "Rechercher": "Search",

  // ── Hero ──
  "L'immobilier, autrement": "Property, differently",

  // ── Sections de l'accueil ──
  "Découvrez les biens": "Explore the listings",
  "Vente et location, près de chez vous": "For sale and to rent, near you",
  "Un accès direct aux biens, sans compte à créer. En pilote, le catalogue est volontairement restreint et soigné — chaque fiche est structurée, sourcée, honnête.":
    "Direct access to properties, no account needed. As a pilot, the catalogue is deliberately small and carefully kept — every listing is structured, sourced, honest.",
  "Parcourir le catalogue du pilote": "Browse the pilot catalogue",
  "Vendre ou louer avec MANA": "Sell or rent with MANA",
  "Vous gardez la main. MANA vous accompagne.": "You stay in charge. MANA supports you.",
  "Estimation indicative, préparation de l'annonce, documents à prévoir, compréhension du prix ou du loyer : le particulier reste maître de son projet.":
    "Indicative valuation, listing preparation, documents to plan, understanding the price or the rent: the individual stays in charge of their project.",
  "Publier mon annonce": "Publish my listing",
  "Estimer mon bien": "Value my property",
  "Annonces pour les IA": "Listings for AIs",
  "Votre bien mérite d'être trouvé, pas noyé.":
    "Your property deserves to be found, not drowned.",
  "Caractéristiques organisées, informations utiles, page publique accessible aux moteurs et assistants compatibles.":
    "Organised characteristics, useful information, a public page accessible to search engines and compatible assistants.",
  "Comprendre notre approche": "Understand our approach",
  "L'index des communes": "The index of towns",
  "Un lieu, une fiche : la vie autour du bien.":
    "One place, one page: life around the property.",
  "Transports, commerces, écoles, services, nature : chaque commune du territoire présentée honnêtement, avec des informations vérifiées lorsque c'est possible.":
    "Transport, shops, schools, services, nature: every town of the territory presented honestly, with verified information wherever possible.",
  "Découvrir le territoire de Crozon": "Discover the Crozon territory",
  "Professionnels & services de l'habitat": "Housing professionals & services",
  "Ceux qui vendent, louent… et ceux qui soignent les logements.":
    "Those who sell and rent… and those who care for homes.",
  "Agences, notaires, réparateurs, diagnostics : un seul référentiel, factuel, sans recommandation.":
    "Agencies, notaries, repairers, surveys: one directory, factual, no endorsement.",
  "Découvrir les pros & services du territoire": "Discover the area's pros & services",

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
  "Estimation indicative": "Indicative valuation",
  "Publier — gratuit": "Publish — free",
  "Notre approche": "Our approach",
  "Rejoindre le référentiel": "Join the directory",
  "Ma messagerie": "My inbox",
  "Mes annonces": "My listings",
  "À propos": "About",
  "Mentions légales": "Legal notice",
  "Pied de page": "Footer",
  "Portail immobilier territorial — pilote Crozon, presqu'île du Finistère. Gratuit, accompagné, lisible par les IA. La structuration améliore les chances de compréhension et de découverte ; elle ne garantit pas qu'un assistant IA indexera, recommandera ou citera une annonce.":
    "Territorial property portal — Crozon pilot, Finistère peninsula. Free, supported, AI-readable. Structuring improves the chances of understanding and discovery; it does not guarantee that an AI assistant will index, recommend or cite a listing.",
};
