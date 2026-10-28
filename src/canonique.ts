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

/** Les pages publiques, indexables. Elles seules entrent au plan de site. */
export const PAGES_PUBLIQUES = ["approche", "pros", "publier", "estimation", "mentions-legales"] as const;

/**
 * Les écrans d'application : une coquille leur est servie (pour ne pas répondre
 * 404 à un utilisateur connecté qui recharge), mais ils ne sont PAS au plan de
 * site et robots.txt les écarte. Ils n'ont rien à offrir à un moteur.
 */
export const PAGES_PRIVEES = ["messagerie", "espace-pro", "mes-annonces"] as const;

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

/** Pose (ou retire) la canonique et og:url du document selon le chemin courant. */
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
