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
// 12/11/2026 : la position « maison des IA » remplace l'ancien hero et la
// section 03 — les clés suivent, l'ancien libellé disparaît proprement.

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
  // ── Grille tarifaire GEO (11/11/2026) ── ⚠️ Les NOMS de produits et les
  // PRIX ne sont pas ici : une marque ne se traduit pas, un montant non plus.
  // `t()` rend la clé quand elle manque — c'est le comportement voulu.
  "HT · paiement unique": "excl. VAT · one-off payment",
  "HT · option sur GEO Expert": "excl. VAT · add-on to GEO Expert",
  "HT par mois · abonnement": "excl. VAT per month · subscription",
  "HT · audit complémentaire ponctuel": "excl. VAT · one-off add-on audit",
  "HT par mois · complément de GEO Monitoring": "excl. VAT per month · add-on to GEO Monitoring",
  "HT par mois et PAR HUMAIN, jamais par structure": "excl. VAT per month and PER HUMAN, never per organisation",
  "HT": "excl. VAT",
  "Pour une photographie rapide de sa présence dans les IA.":
    "For a quick snapshot of your presence inside AI assistants.",
  "Pour comprendre sa position réelle sur son marché.":
    "To understand your real position in your market.",
  "Pour mesurer sa visibilité sur un marché étranger.":
    "To measure your visibility in a foreign market.",
  "Pour suivre son évolution, mois après mois.": "To track your progress, month after month.",
  "Pour savoir ce que les IA chinoises disent de vous.":
    "To find out what Chinese AIs say about you.",
  "Pour suivre la visibilité chinoise dans le temps.":
    "To track Chinese visibility over time.",
  "Exploration automatisée du site": "Automated crawl of your site",
  "Identification de l'entreprise et de ses activités": "Identification of the company and its activities",
  "Panel de questions commerciales": "A panel of commercial questions",
  "Vérification de la présence et de l'exactitude des réponses":
    "Check of presence and accuracy of the answers",
  "Rapport synthétique et premières recommandations": "Summary report and first recommendations",
  "Exploration technique et sémantique approfondie": "In-depth technical and semantic crawl",
  "Panel correspondant aux intentions réelles des acheteurs":
    "A panel matching what buyers actually ask",
  "Comparaison avec les concurrents": "Comparison against competitors",
  "Analyse des sources citées par les assistants": "Analysis of the sources assistants cite",
  "Détection des informations absentes, erronées ou contradictoires":
    "Detection of missing, wrong or contradictory information",
  "Analyse des données structurées et de la lisibilité machine":
    "Analysis of structured data and machine readability",
  "Plan d'amélioration hiérarchisé": "A prioritised improvement plan",
  "Audit complémentaire sur un marché étranger": "Additional audit on a foreign market",
  "Analyse dans une autre langue": "Analysis in another language",
  "Comparaison des concurrents locaux": "Comparison of local competitors",
  "Identification des sources et informations manquantes":
    "Identification of missing sources and information",
  "Le même panel de questions rejoué chaque mois": "The same question panel replayed every month",
  "Suivi des concurrents et des changements de position":
    "Tracking of competitors and position changes",
  "Repérage des nouvelles sources citées": "Spotting of newly cited sources",
  "Détection des réponses erronées ou des disparitions":
    "Detection of wrong answers or disappearances",
  "Rapport comparatif mensuel et historique conservé":
    "Monthly comparative report, with history kept",
  "Sept moteurs chinois : DeepSeek, Doubao, Qwen, Kimi, Yuanbao, ERNIE, GLM":
    "Seven Chinese engines: DeepSeek, Doubao, Qwen, Kimi, Yuanbao, ERNIE, GLM",
  "Questions posées EN chinois simplifié, pas traduites du français":
    "Questions asked IN simplified Chinese, not translated from French",
  "Réponses analysées en chinois avant d'être restituées en français":
    "Answers analysed in Chinese before being reported back",
  "Concurrents chinois et internationaux cités": "Chinese and international competitors cited",
  "Sources locales identifiées": "Local sources identified",
  "Recommandations pour améliorer sa visibilité en Chine":
    "Recommendations to improve your visibility in China",
  "Les mêmes sept moteurs, les mêmes questions, chaque mois":
    "The same seven engines, the same questions, every month",
  "Évolution de la visibilité chinoise": "Change in Chinese visibility",
  "Nouveaux concurrents et nouvelles sources": "New competitors and new sources",
  "L'assistant": "The assistant",
  "La fiche pro": "The pro page",
  "L'antenne": "The antenna",
  "Offre recommandée": "Recommended",
  "Les autres prix arrêtés": "The other fixed prices",
  "Commander un audit": "Order an audit",
  "Quatre assistants occidentaux sont interrogés : ChatGPT, Gemini, Claude et Perplexity. Microsoft Copilot et Google AI Overviews n'exposent aucun accès permettant de les mesurer honnêtement : ils sont déclarés « non testés », jamais comptés comme une absence.":
    "Four Western assistants are queried: ChatGPT, Gemini, Claude and Perplexity. Microsoft Copilot and Google AI Overviews expose no access that would let us measure them honestly: they are reported as \u00ab not tested \u00bb, never counted as an absence.",
  "MANA GEO ne garantit jamais une recommandation par une IA, et ne la vend pas. Il mesure, documente et explique ce que les assistants répondent réellement — et aucune prestation d'optimisation ne peut en modifier les conclusions.":
    "MANA GEO never guarantees a recommendation by an AI, and does not sell one. It measures, documents and explains what the assistants actually answer — and no optimisation service can change its conclusions.",
  "Où en êtes-vous dans les assistants ? Qu'est-ce qui vous empêche d'être compris, trouvé, cité ? L'audit interroge quatre assistants — ChatGPT, Gemini, Claude et Perplexity — avec un panel de questions que vos acheteurs poseraient vraiment, et vous rend leurs réponses intégrales, leurs sources, et les concurrents cités à votre place.":
    "Where do you stand inside AI assistants? What stops you from being understood, found, cited? The audit queries four assistants — ChatGPT, Gemini, Claude and Perplexity — with a panel of questions your buyers would really ask, and hands you their full answers, their sources, and the competitors named in your place.",
  "Tout ce qui est affiché ici est arrêté. Ce qui ne l'est pas n'apparaît pas : le site n'invente aucune grille, et ne vous laisse pas découvrir le prix après le devis.":
    "Everything shown here is settled. What is not, does not appear: the site invents no price list, and does not leave you to discover the price after the quote.",

  // ── Vitrine GEO (11/11/2026) ── ⚠️ « Notre approche » existe DÉJÀ plus bas
  // dans ce dictionnaire : le redéclarer ici fait refuser tsc (TS1117).
  "Offres & tarifs": "Offers & pricing",
  "Demander un audit": "Request an audit",
  "Voir les offres": "See the offers",
  "Contact": "Contact",
  "Le GEO, par TEMPOsystem": "GEO, by TEMPOsystem",
  "Être trouvé par les assistants IA : l'infrastructure machine-readable, les audits, et les offres arrêtées de l'écosystème MANA.":
    "Be found by AI assistants: machine-readable infrastructure, audits, and the fixed offers of the MANA ecosystem.",
  "Être trouvé par les IA": "Be found by AIs",
  "Le GEO : la visibilité qui se construit, pas celle qui s'achète.":
    "GEO: visibility you build, not visibility you buy.",
  "llms.txt, Model Context Protocol, données structurées : TEMPOsystem vend l'infrastructure machine-readable elle-même — ce que ni les agences de contenu, ni les tableaux de bord de mesure ne proposent. La preuve vivante : manafrance.org, plus de 4,3 millions de visites d'agents IA mesurées.":
    "llms.txt, Model Context Protocol, structured data: TEMPOsystem sells the machine-readable infrastructure itself — what neither content agencies nor measurement dashboards offer. The living proof: manafrance.org, over 4.3 million measured AI-agent visits.",
  "L'audit GEO de votre structure": "The GEO audit of your organisation",
  "Mairies, associations, offices de tourisme, entreprises.":
    "Town halls, associations, tourist offices, businesses.",
  "Où en êtes-vous dans les assistants ? Qu'est-ce qui vous empêche d'être compris, trouvé, cité ? L'audit mesure l'état réel, puis la mise en œuvre suit : structuration, exposition, interrogeabilité. Sur devis — aucun prix n'est arrêté à ce jour, et nous n'en affichons pas.":
    "Where do you stand in AI assistants? What stops you from being understood, found, cited? The audit measures the real state, then implementation follows: structuring, exposure, queryability. On quote — no price has been fixed to this day, and we display none.",
  "Les offres arrêtées": "The fixed offers",
  "Les prix tranchés, rien d'autre.": "Decided prices, nothing else.",
  "L'assistant : 9 €/mois par humain, jamais par structure. La fiche pro : 9 €. L'antenne : 9 €. Ces prix sont arrêtés — tout ce qui ne l'est pas reste sur devis, et le site ne l'invente pas.":
    "The assistant: €9/month per human, never per organisation. The pro page: €9. The antenna: €9. These prices are fixed — everything that is not remains on quote, and the site invents none.",
  "Les machines interrogent. MANA tient le registre honnête.":
    "Machines ask questions. MANA keeps the honest registry.",
  "Caractéristiques organisées, données structurées, page publique en accès libre : le registre territorial est non marchand — aucune mise en avant payante, aucun ordre achetable. La structuration améliore les chances d'être compris et trouvé ; elle ne garantit pas qu'un assistant indexera ou citera une page.":
    "Organised characteristics, structured data, public free-access pages: the territorial registry is non-commercial — no paid placement, no purchasable ranking. Structuring improves the odds of being understood and found; it guarantees no assistant will index or cite a page.",
  "Vitrine du GEO et des offres de l'écosystème MANA, opérée par TEMPOsystem. Prix affichés : uniquement les prix arrêtés — tout le reste est sur devis. Le GEO améliore les chances d'être compris et trouvé par les assistants IA ; il ne garantit ni indexation, ni citation, ni recommandation.":
    "Showcase of the GEO and the offers of the MANA ecosystem, operated by TEMPOsystem. Prices shown: fixed prices only — everything else is on quote. GEO improves the odds of being understood and found by AI assistants; it guarantees neither indexing, nor citation, nor recommendation.",

  // ── Barre de navigation ──
  "Vacances": "Stays",
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

  // ── Hero (repositionné 12/11/2026 : la maison des IA) ──
  "La maison des IA": "The house of AIs",

  // ── Sections de l'accueil ──
  "Découvrez les séjours": "Explore the stays",
  "Des locations de vacances, près de chez vous": "Holiday rentals, near you",
  "Un accès direct aux annonces, sans compte à créer. Le catalogue est volontairement restreint et soigné — chaque fiche est structurée, sourcée, honnête.":
    "Direct access to listings, no account needed. The catalogue is deliberately small and carefully kept — every listing is structured, sourced, honest.",
  "Parcourir le catalogue": "Browse the catalogue",
  "Louez votre logement avec MANA": "List your property with MANA",
  "Vous gardez la main. MANA vous accompagne.": "You stay in charge. MANA supports you.",
  "Préparation de l'annonce, documents à prévoir (déclaration de meublé touristique, attestation d'assurance), calendrier de réservation : le propriétaire reste maître de son bien.":
    "Listing preparation, documents to plan (short-term rental declaration, insurance certificate), booking calendar: the owner stays in charge of their property.",
  "Publier mon annonce": "Publish my listing",
  "Les machines interrogent. MANAhome tient le registre honnête.":
    "The machines ask. MANAhome keeps the honest registry.",
  "Caractéristiques organisées, données structurées, page publique en accès libre : ce registre territorial est non marchand — aucune mise en avant payante, aucun ordre achetable, une annonce importée ne passe jamais devant une directe à adéquation égale. La structuration améliore les chances d'être compris et trouvé ; elle ne garantit pas qu'un assistant indexera ou citera une annonce.":
    "Organised characteristics, structured data, a public page in open access: this territorial registry is non-commercial — no paid placement, no purchasable ranking, an imported listing never ranks above a direct one at equal match. Structuring improves the chances of being understood and found; it does not guarantee that an assistant will index or cite a listing.",
  "Comprendre notre approche": "Understand our approach",
  "L'index des communes": "The index of towns",
  "Un lieu, une fiche : la vie autour du séjour.":
    "One place, one page: life around the stay.",
  "Transports, commerces, écoles, services, nature : chaque commune du territoire présentée honnêtement, avec des informations vérifiées lorsque c'est possible.":
    "Transport, shops, schools, services, nature: every town of the territory presented honestly, with verified information wherever possible.",
  "Découvrir le territoire": "Discover the territory",

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
  "La maison des IA : un registre territorial non marchand, lisible par toutes les familles d'assistants. Portail de locations de vacances, entre propriétaires et vacanciers. Gratuit, accompagné, lisible par les IA. La structuration améliore les chances de compréhension et de découverte ; elle ne garantit pas qu'un assistant IA indexera, recommandera ou citera une annonce.":
    "The house of AIs: a non-commercial territorial registry, readable by every family of assistants. A holiday rental portal, between owners and guests. Free, supported, AI-readable. Structuring improves the chances of understanding and discovery; it does not guarantee that an AI assistant will index, recommend or cite a listing.",

  // ── Traduction des 7 pages restantes (04/11/2026) : Approche, Publier,
  // MentionsLegales, AnnoncesListe, TerritoireDetail, Messagerie,
  // MesAnnonces. Jusqu'ici elles servaient le français brut sous /en/. ──

  // Approche — titres de pilier (les p.titre sont passés en variable à
  // t(L, …) : invisibles à un audit par grep sur chaîne littérale)
  "Gratuit, vraiment": "Genuinely free",
  "Aucun acte réglementé": "No regulated act",
  "Vos données restent à vous": "Your data stays yours",
  "Une annonce structurée": "A structured listing",
  "L'honnêteté comme règle": "Honesty as a rule",
  "Le territoire au centre": "The territory at the centre",

  // AnnoncesListe — labels des filtres de type (opt.l, même angle mort)
  "Tous les biens": "All properties",
  "Maisons": "Houses",
  "Appartements": "Flats",
  "Terrains": "Land",

  "Des locations de vacances honnêtes, structurées, territoriales":
    "Honest, structured, local holiday rentals",
  "MANAhome est un portail de location de vacances, entre propriétaires et vacanciers. Voici, noir sur blanc, ce que nous faisons — et ce que nous ne ferons jamais.":
    "MANAhome is a holiday rental portal, between owners and guests. Here, in black and white, is what we do — and what we will never do.",
  "Publier une annonce ne coûte rien et ne rapporte rien à MANAhome sur votre location : aucune commission, aucun frais caché, aucun payant déguisé en option.":
    "Publishing a listing costs nothing and earns MANAhome nothing on your rental: no commission, no hidden fee, nothing paid disguised as an option.",
  "MANAhome n'est pas une agence de location et n'en fait pas le métier : pas de mandat, pas d'encaissement, pas d'intermédiaire financier. Vous restez l'unique décisionnaire.":
    "MANAhome is not a letting agency and does not act as one: no mandate, no collecting payments, no financial intermediary. You stay the sole decision-maker.",
  "Aucune revente de données ni de leads. Les coordonnées ne sont jamais publiques : les échanges entre propriétaire et voyageur passent par une messagerie interne.":
    "No reselling of data or leads. Contact details are never public: exchanges between owner and guest go through an internal messaging system.",
  "Surface, pièces, capacité, DPE, localisation : chaque fiche est organisée pour être lisible par les humains — et par les outils compatibles IA.":
    "Floor area, rooms, capacity, energy rating, location: every listing is organised to be readable by humans — and by AI-compatible tools.",
  "Badge obligatoire sur les annonces importées, tarifs affichés sourcés et datés : nous préférons un catalogue restreint et vrai.":
    "Mandatory badge on imported listings, rates shown sourced and dated: we prefer a small, honest catalogue.",
  "Un séjour se choisit aussi pour sa vie autour : transports, services, nature, risques connus — présentés sans enjolivement.":
    "A stay is also chosen for the life around it: transport, services, nature, known risks — presented without embellishment.",
  "MANAhome fait partie de l'écosystème MANA (mana.bzh, mana.love, manafrance.org).":
    "MANAhome is part of the MANA ecosystem (mana.bzh, mana.love, manafrance.org).",
  "Voir les annonces": "View listings",

  // MentionsLegales
  "Informations légales": "Legal information",
  "Éditeur": "Publisher",
  "MANAhome est édité par l'écosystème MANA (mana.bzh, mana.love, manafrance.org). Les coordonnées complètes de l'éditeur seront publiées avec la structure juridique définitive du projet.":
    "MANAhome is published by the MANA ecosystem (mana.bzh, mana.love, manafrance.org). The publisher's full details will be published once the project's legal structure is finalised.",
  "Hébergement": "Hosting",
  "Site statique hébergé sur GitHub Pages (GitHub, Inc.). Aucune donnée personnelle n'est collectée par le site en l'état : les fonctionnalités de démonstration (annonces, messagerie) restent locales à votre navigateur.":
    "Static site hosted on GitHub Pages (GitHub, Inc.). No personal data is collected by the site as it stands: the demo features (listings, messaging) stay local to your browser.",
  "Nature du service": "Nature of the service",
  "MANAhome est une plateforme de mise en relation pour la location de vacances, entre propriétaires et vacanciers. Elle ne réalise aucun acte réglementé par la loi Hoguet (n° 70-9) : pas de mandat, pas de négociation, pas d'encaissement pour compte de tiers. Les paiements se font directement entre le propriétaire et le vacancier, par leur propre moyen.":
    "MANAhome is a matchmaking platform for holiday rentals, between owners and guests. It performs no act regulated by the Hoguet law (no. 70-9): no mandate, no negotiation, no collecting payments on behalf of others. Payments are made directly between the owner and the guest, by their own means.",
  "Données personnelles": "Personal data",
  "Aucune donnée ni lead n'est revendu. Les coordonnées ne sont jamais publiées : la mise en relation se fait par messagerie interne. Vous pouvez demander la suppression de vos données à tout moment — la suppression est une exclusion définitive.":
    "No data or lead is ever resold. Contact details are never published: matchmaking happens through internal messaging. You can request deletion of your data at any time — deletion is final.",
  "Retour à l'accueil": "Back to home",

  // AnnoncesListe
  "Annonces": "Listings",
  "Les annonces": "Listings",
  "Les annonces à": "Listings in",
  "Un catalogue volontairement restreint et soigné. Chaque annonce est structurée pour être comprise, y compris par les outils compatibles IA.":
    "A deliberately small, carefully kept catalogue. Every listing is structured to be understood, including by AI-compatible tools.",
  "Recherche": "Search",
  "Commune ou secteur": "Town or area",
  "Ex : nom de la commune, quartier, port…": "E.g.: town name, neighbourhood, harbour…",
  "Ex : 100": "E.g.: 100",
  "Filtrer par type": "Filter by type",
  "Catalogue de démarrage : il est volontairement restreint. Revenez bientôt, ou explorez le territoire pendant ce temps.":
    "Starting catalogue: it is deliberately small. Come back soon, or explore the territory in the meantime.",
  "Annonces de démonstration — les annonces réelles arriveront avec les premiers propriétaires. Les annonces professionnelles importées sont toujours affichées après les dépôts directs, à qualité égale.":
    "Demo listings — real listings will arrive with the first owners. Imported professional listings are always shown after direct listings, at equal match.",

  // TerritoireDetail
  "Prix moyen au mètre carré sur les dix dernières années": "Average price per square metre over the last ten years",
  "Accueil": "Home",
  "Choisir un lieu, pas seulement un logement": "Choose a place, not just a home",
  "Habitants": "Residents",
  "Commerces": "Shops",
  "Associations": "Associations",
  "Environnement": "Environment",
  "Nature, littoral, paysages": "Nature, coastline, landscapes",
  "Transports": "Transport",
  "Se déplacer au quotidien": "Getting around day to day",
  "Services": "Services",
  "Commerces, écoles, santé": "Shops, schools, healthcare",
  "Vie locale": "Local life",
  "Communauté, culture, loisirs": "Community, culture, leisure",
  "Parcs naturels": "Nature parks",
  "Espaces protégés": "Protected areas",
  "Services publics": "Public services",
  "Administrations": "Administrations",
  "Intercommunalité": "Intermunicipal body",
  "Communauté de communes": "Association of municipalities",
  "Prix de l'immobilier": "Property prices",
  "Moyenne indicative au m² (maisons), 10 dernières années": "Indicative average per m² (houses), last 10 years",
  "Données de démonstration — le jour venu, la source sera un flux contractualisé (DVF ou partenaire), jamais du scraping.":
    "Demo data — in time, the source will be a contracted feed (DVF or partner), never scraping.",
  "Risques naturels": "Natural hazards",
  "Synthèse Géorisques — vérifiez chaque adresse": "Géorisques summary — check each address",
  "Consulter Géorisques pour {lieu}": "Check Géorisques for {lieu}",
  "Informations présentées avec honnêteté : elles sont enrichies et vérifiées lorsque c'est possible, et mises à jour à mesure que le territoire s'enrichit.":
    "Information presented honestly: it is enriched and verified where possible, and updated as the territory's coverage grows.",

  // Messagerie
  "Mise en relation protégée": "Protected matchmaking",
  "Les échanges entre voyageurs et propriétaires passent par la messagerie interne : aucune coordonnée n'est exposée, rien n'est revendu.":
    "Exchanges between guests and owners go through internal messaging: no contact details are exposed, nothing is resold.",
  "Aucune conversation pour l'instant. Contactez un propriétaire depuis une fiche d'annonce pour ouvrir la messagerie.":
    "No conversation yet. Contact an owner from a listing page to open messaging.",
  "Conversations": "Conversations",
  "Choisissez une conversation à gauche.": "Choose a conversation on the left.",
  "Votre message": "Your message",
  "Votre message…": "Your message…",
  "Démo : stockage local, aucune donnée transmise. En production, chaque message passe par le serveur, chiffré en transit, visible uniquement des participants (RLS).":
    "Demo: local storage, no data transmitted. In production, every message goes through the server, encrypted in transit, visible only to participants (RLS).",

  // MesAnnonces
  "Espace vendeur — démo locale": "Owner area — local demo",
  "Vos annonces déposées depuis ce navigateur. Démo locale : en production, elles vivront derrière votre compte, avec la même liberté — dépublier, remettre en ligne, supprimer définitivement.":
    "Your listings posted from this browser. Local demo: in production, they will live behind your account, with the same freedom — unpublish, republish, delete for good.",
  "Annonce publiée. Elle apparaît dès maintenant dans le catalogue, derrière le badge « Annonce directe de particulier ».":
    "Listing published. It now appears in the catalogue, behind the \"Direct listing from an individual\" badge.",
  "Voir ma fiche publique": "View my public listing",
  "Voir le catalogue": "View the catalogue",
  "Aucune annonce pour l'instant. La publication est gratuite, sans commission — trois étapes suffisent.":
    "No listing yet. Publishing is free, with no commission — three steps are enough.",
  "{n} pièces": "{n} rooms",
  "Voir": "View",
  "Dépublier": "Unpublish",
  "Remettre en ligne": "Republish",
  "Supprimer": "Delete",
  "Aucune donnée identifiante n'est stockée : l'e-mail saisi au dépôt n'est pas conservé, la mise en relation se fait par messagerie interne. Suppression = exclusion définitive.":
    "No identifying data is stored: the email entered at posting is not kept, matchmaking happens through internal messaging. Deletion means final exclusion.",
  "En ligne": "Live",
  "Dépubliée": "Unpublished",

  // Publier
  "Gratuit, sans commission": "Free, no commission",
  "Trois étapes, aucun engagement. Vous gardez la main à tout moment : votre annonce n'est publiée que lorsque vous la validez.":
    "Three steps, no commitment. You stay in control at every moment: your listing is published only once you confirm it.",
  "Le bien": "The property",
  "La description": "The description",
  "Validation": "Confirmation",
  "Type de bien *": "Property type *",
  "Rechercher : maison, appartement, terrain…": "Search: house, flat, land…",
  "Sélection :": "Selected:",
  "Maison": "House",
  "Appartement": "Flat",
  "Terrain": "Land",
  "Autre": "Other",
  "Commune ou secteur *": "Town or area *",
  "Ex : nom de la commune ou du secteur": "E.g.: town or area name",
  "Vos tarifs — au moins un des trois *": "Your rates — at least one of the three *",
  "Libre à vous de ne proposer qu'un seul palier, ou les trois. Les montants n'ont pas besoin d'être proportionnels entre eux.":
    "You're free to offer just one tier, or all three. The amounts don't need to be proportional to each other.",
  "Par nuit (€)": "Per night (€)",
  "Par semaine (€)": "Per week (€)",
  "Par mois (€)": "Per month (€)",
  "Surface (m²)": "Floor area (m²)",
  "Pièces": "Rooms",
  "Couchages": "Sleeping places",
  "Ex : 4": "E.g.: 4",
  "Équipements": "Amenities",
  "Cochez uniquement ce qui est réellement présent — un équipement non coché n'est pas affiché comme absent, il n'est juste pas annoncé.":
    "Only tick what is actually there — an unticked amenity is not shown as absent, it simply isn't announced.",
  "Parking": "Parking",
  "Piscine": "Pool",
  "Jardin": "Garden",
  "Balcon": "Balcony",
  "DPE (diagnostic de performance énergétique)": "Energy rating",
  "Continuer": "Continue",
  "Les photos de votre bien": "Photos of your property",
  "Jusqu'à {n} photos, compressées dans votre navigateur avant tout envoi. La première fera la vitrine de l'annonce. (Démo locale : rien ne quitte votre appareil.)":
    "Up to {n} photos, compressed in your browser before any upload. The first one becomes the listing's cover. (Local demo: nothing leaves your device.)",
  "Jusqu'à {n} photos par annonce.": "Up to {n} photos per listing.",
  "Certaines photos n'ont pas pu être lues. Réessayez.": "Some photos could not be read. Please try again.",
  "Vitrine": "Cover",
  "Retirer la photo {n}": "Remove photo {n}",
  "Décrivez votre bien, comme vous le raconteriez": "Describe your property, the way you'd tell it",
  "Maison lumineuse à deux pas du port, jardin clos, cuisine ouverte…": "Bright house a stone's throw from the harbour, enclosed garden, open kitchen…",
  "Pas inspiré ? La rédaction assistée arrive avec votre compte : elle transforme vos mots en annonce chaleureuse et factuelle.":
    "Not feeling inspired? Assisted writing arrives with your account: it turns your words into a warm, factual listing.",
  "Retour": "Back",
  "Aperçu de votre annonce": "Preview of your listing",
  "Photo principale": "Main photo",
  "Tarif / {unite}": "Rate / {unite}",
  "nuit": "night",
  "semaine": "week",
  "mois": "month",
  "Tarif": "Rate",
  "À définir": "To be set",
  "Surface": "Floor area",
  "Votre e-mail (pour retrouver votre brouillon) *": "Your email (to find your draft again) *",
  "Jamais publié, jamais revendu. La mise en relation avec les voyageurs se fera par messagerie interne.":
    "Never published, never resold. Matchmaking with guests will happen through internal messaging.",
  "Numéro de déclaration de meublé touristique": "Short-term rental declaration number",
  "Référence de l'attestation d'assurance": "Insurance certificate reference",
  "Ex : 29160 123456 2026 1 1": "E.g.: 29160 123456 2026 1 1",
  "Ex : ATL-2026-12345": "E.g.: ATL-2026-12345",
  "Validité de l'assurance (date)": "Insurance validity (date)",
  "Déposer mes justificatifs et publier": "Submit my documents and publish",
  "Votre annonce est enregistrée en brouillon — gratuite, sans condition. Elle passera en ligne dès que le serveur aura vérifié la présence des justificatifs.":
    "Your listing is saved as a draft — free, no conditions. It will go live once the server has verified the documents are present.",
  "Aucune carte bancaire, aucune commission : la publication est gratuite pour les particuliers. MANA ne réalise aucun acte réglementé — vous restez maître de votre location.":
    "No bank card, no commission: publishing is free for individuals. MANA performs no regulated act — you stay in charge of your rental.",

  // Clés utilisées en plusieurs endroits, ou découvertes en second passage.
  "Envoyer": "Send",
  "Annonce directe de particulier": "Direct listing from an individual",
  "Annonce directe de particulier, gratuite, sur le portail MANAhome.": "Direct listing from an individual, free, on the MANAhome portal.",
  "Annonce professionnelle": "Professional listing",
  "Annonce professionnelle — importée": "Professional listing — imported",
  "Bonjour, votre bien m'intéresse, serait-il possible de visiter ?": "Hello, I'm interested in your property, would it be possible to visit?",
  "Location": "Rental",
  "Toutes les annonces": "All listings",
  "photo du bien": "property photo",
  "{n} couchages": "{n} sleeping places",
  "Votre annonce": "Your listing",
  "DPE": "Energy rating",
  "Budget max (€/nuit)": "Max budget (€/night)",
  "Publier mon annonce — gratuit": "Publish my listing — free",
  "MANAhome — La maison des IA. Gratuit. Accompagné. Lisible par les IA.": "MANAhome — The house of AIs. Free. Supported. AI-readable.",
  "Aucune annonce de ce type pour l'instant sur ce territoire.": "No listing of this type yet in this territory.",
};
