// La carte des routes, la canonique et le plan de site — 28/10/2026.
//
// 🔴 DEUX DÉFAUTS RÉELS, TROUVÉS EN PRODUCTION LE 28/10, ONT MOTIVÉ CE FICHIER.
//
// 1. NEUF ROUTES SUR DIX RÉPONDAIENT 404 — dont les cinq pages publiques
//    (/approche, /pros, /publier, /estimation, /mentions-legales). Le visiteur
//    voyait pourtant la bonne page : Caddy sert la coquille AVEC le statut 404,
//    et le JS route correctement. ⭐ Rien ne se voyait à l'écran, et Google
//    désindexait tout. C'est pourquoi on teste le STATUT, pas l'affichage.
//
// 2. AUCUNE CANONIQUE, sur aucune page, et deux noms (manahome.org et
//    www.manahome.org) servaient un contenu identique à l'octet. Le site voisin
//    manatimebank.org, configuré le même matin sur le même serveur, le faisait
//    correctement — c'était une divergence, pas un choix.
//
// Le correctif : une coquille HTML par route, chacune portant SA canonique,
// émise par le build (voir vite.config.ts). Cette table en est la source unique :
// le plan de site et les tests y lisent, ils ne recopient rien.

export interface Page {
  slug: string;
  titre: string;
}

/**
 * Les pages avec LEUR TITRE. Ordre du sitemap pour les publiques.
 *
 * 🔴 POURQUOI LE TITRE VIT ICI (28/10/2026). Il était posé en JS, par un
 * `document.title` dans chaque composant — donc ABSENT du HTML livré, où les
 * dix routes portaient le `<title>` et l'`og:title` de l'accueil.
 * ⭐ ET LE COÛT N'EST PAS L'INDEXATION. Un titre posé en JS répare ce que
 * Google voit ; il ne répare PAS ce que les gens voient en PARTAGEANT un lien.
 * Les aperçus de Slack, WhatsApp, LinkedIn, iMessage et Signal lisent
 * l'`og:title` du HTML et n'exécutent aucun JS : chaque lien partagé affichait
 * la vignette de l'accueil. Ça se constate sans outil — on colle un lien dans
 * une conversation.
 *
 * ⚠️ Les textes sont ceux DÉJÀ ÉCRITS dans l'app, aucun inventé. Celui de
 * `publier` vient de son `<h1>` (« Publier mon annonce ») : la seule page dont
 * le titre n'était pas déjà posé en JS.
 * ⛔ Et AUCUNE `description` par page : contrairement à manatimebank, il n'en
 * existe nulle part ici, pas même en JS. En écrire serait inventer — la
 * générique reste en place, c'est un arbitrage d'Aurélien.
 */
export const PAGES_PUBLIQUES_T: readonly Page[] = [
  { slug: "approche", titre: "Notre approche" },
  { slug: "pros", titre: "Professionnels & services de l'habitat" },
  { slug: "publier", titre: "Publier mon annonce" },
  { slug: "estimation", titre: "Estimer mon bien" },
  { slug: "mentions-legales", titre: "Mentions légales" },
];

export const PAGES_PRIVEES_T: readonly Page[] = [
  { slug: "messagerie", titre: "Ma messagerie" },
  { slug: "espace-pro", titre: "Espace professionnels" },
  { slug: "mes-annonces", titre: "Mes annonces" },
];

/** Le titre générique : l'accueil, et les pages d'erreur. */
export const TITRE_GENERIQUE = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";

/** Les pages publiques, indexables. Elles seules entrent au plan de site. */
export const PAGES_PUBLIQUES: readonly string[] = PAGES_PUBLIQUES_T.map((p) => p.slug);

/**
 * Les écrans d'application : une coquille leur est servie (pour ne pas répondre
 * 404 à un utilisateur connecté qui recharge), mais ils ne sont PAS au plan de
 * site et robots.txt les écarte. Ils n'ont rien à offrir à un moteur.
 */
export const PAGES_PRIVEES: readonly string[] = PAGES_PRIVEES_T.map((p) => p.slug);

/** Anciennes routes : elles redirigent, et se canonicalisent vers leur DESTINATION. */
export const REDIRIGEES: Record<string, string> = { services: "pros" };

/**
 * Les familles de pages dynamiques (fiches annonce, listes, territoires). Elles
 * sont servies par le motif `@spa` du Caddyfile et portent la canonique posée à
 * l'exécution. ⚠️ Elles ne sont PAS au plan de site : leurs données sont
 * aujourd'hui des FIXTURES de démonstration (voir src/territoires.ts,
 * src/annonces.ts). Annoncer de la démonstration comme contenu canonique
 * tromperait à la fois les moteurs et les visiteurs.
 */
export const FAMILLES_DYNAMIQUES = ["annonce", "annonces", "territoire"] as const;

/** Toutes les routes plates qui méritent une coquille livrée. */
export const ROUTES_PLATES: readonly string[] = [
  ...PAGES_PUBLIQUES,
  ...PAGES_PRIVEES,
  ...Object.keys(REDIRIGEES),
];

/**
 * L'adresse publique du site, substituée au build par `define`.
 * ⚠️ PAS via `import.meta.env` : ce module est aussi importé par vite.config.ts,
 * où `import.meta.env` n'existe pas — et une lecture défensive ne se fait pas
 * substituer, car `define` remplace un TEXTE exact. Le repli passerait alors
 * pour la vraie valeur.
 */
declare const __SITE_URL__: string | undefined;
export const SITE_URL: string =
  typeof __SITE_URL__ !== "undefined" ? __SITE_URL__ : "https://gilletaurelien-art.github.io";

/** L'URL canonique d'un chemin, ou `null` si la route n'en mérite pas. */
export function canonique(path: string, siteUrl = SITE_URL, base = "/"): string | null {
  const prefixe =
    (siteUrl.replace(/\/$/, "") + "/" + base.replace(/^\/|\/$/g, "")).replace(/\/$/, "") + "/";
  const nu = path.replace(/\/$/, "") || "/";
  if (nu === "/") return prefixe;

  const plat = nu.match(/^\/([\w-]+)$/)?.[1];
  if (plat) {
    const cible = REDIRIGEES[plat] ?? plat;
    return ROUTES_PLATES.includes(cible) ? prefixe + cible : null;
  }
  // Fiche dynamique : elle se canonicalise sur elle-même.
  const dyn = nu.match(/^\/([\w-]+)\/([\w-]+)$/);
  if (dyn && (FAMILLES_DYNAMIQUES as readonly string[]).includes(dyn[1])) {
    return prefixe + dyn[1] + "/" + dyn[2];
  }
  return null;
}

/** Toutes les pages titrées, publiques et privées. */
export const TOUTES_LES_PAGES: readonly Page[] = [...PAGES_PUBLIQUES_T, ...PAGES_PRIVEES_T];

/**
 * Le titre complet d'un chemin, ou `null` pour une route inconnue — une page
 * d'erreur porte le générique, comme elle ne porte pas de canonique.
 * ⚠️ Une route qui REDIRIGE porte le titre de sa destination, exactement comme
 * elle en porte la canonique : les deux doivent raconter la même chose.
 */
export function titreDeLaRoute(path: string): string | null {
  const nu = path.replace(/\/$/, "") || "/";
  if (nu === "/") return TITRE_GENERIQUE;
  const slug = nu.match(/^\/([\w-]+)$/)?.[1];
  if (!slug) return null;
  const cible = REDIRIGEES[slug] ?? slug;
  const page = TOUTES_LES_PAGES.find((p) => p.slug === cible);
  return page ? `${page.titre} — MANAhome` : null;
}

function poserMeta(cle: "name" | "property", nom: string, valeur: string): void {
  let m = document.querySelector<HTMLMetaElement>(`meta[${cle}="${nom}"]`);
  if (!m) {
    m = document.createElement("meta");
    m.setAttribute(cle, nom);
    document.head.appendChild(m);
  }
  m.content = valeur;
}

/**
 * Pose titre, canonique, og:url et og:title selon le chemin courant.
 * ⚠️ `og:title` AUTANT que `<title>` : c'est l'og qui décide de l'aperçu d'un
 * lien partagé. Le HTML livré les porte déjà (vite.config.ts) ; ceci tient la
 * navigation côté client.
 */
export function poserCanonique(path: string): void {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  const url = canonique(path, SITE_URL, base);
  let lien = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!url) {
    lien?.remove();
    return;
  }
  if (!lien) {
    lien = document.createElement("link");
    lien.rel = "canonical";
    document.head.appendChild(lien);
  }
  lien.href = url;
  let og = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (!og) {
    og = document.createElement("meta");
    og.setAttribute("property", "og:url");
    document.head.appendChild(og);
  }
  og.content = url;

  const titre = titreDeLaRoute(path) ?? TITRE_GENERIQUE;
  document.title = titre;
  poserMeta("property", "og:title", titre);
}

/**
 * Le plan de site : les pages PUBLIQUES et la racine, rien d'autre.
 * ⚠️ Ni les écrans d'application, ni les fiches de démonstration.
 */
export function construireSitemap(siteUrl: string, base: string): string {
  const racine =
    (siteUrl.replace(/\/$/, "") + "/" + base.replace(/^\/|\/$/g, "")).replace(/\/$/, "") + "/";
  const prio = (s: string) => (s === "mentions-legales" ? "0.3" : "0.8");
  const lignes = [
    `  <url><loc>${racine}</loc><priority>1.0</priority></url>`,
    ...PAGES_PUBLIQUES.map(
      (s) => `  <url><loc>${racine}${s}</loc><priority>${prio(s)}</priority></url>`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lignes.join(
    "\n",
  )}\n</urlset>\n`;
}
