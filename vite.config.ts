import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  construireSitemap,
  ROUTES_PLATES,
  canonique,
  titreDeLaRoute,
} from "./src/canonique";

// La cible décide du chemin de base ET de l'hôte — pas le code.
//   • GitHub Pages sert sous /manahome-app/ → sans base, les bundles 404, page blanche.
//   • Un domaine propre (manahome.org) sert à la RACINE → le base de Pages y 404 pareil.
// Les défauts ci-dessous sont ceux de Pages : la CI n'a rien à changer.
// Pour un domaine : BASE_PATH=/ OUT_DIR=dist SITE_URL=https://manahome.org npm run build
//
// 🔴 SITE_URL ajouté le 28/10/2026, après DEUX défauts trouvés en production le
// jour même : neuf routes sur dix répondaient 404 (dont les cinq pages
// publiques), et aucune page ne portait de canonique alors que deux noms
// servaient le même contenu à l'octet.
// ⭐ QUAND UNE VALEUR DÉPEND DE LA CIBLE, ELLE EN DÉPEND PARTOUT : le chemin des
// bundles, l'hôte de la canonique, le `Sitemap:` des robots, les `<loc>` du plan
// de site. En corriger une seule laisse le défaut vivant — et invisible.
const HOTE_PAGES = "https://gilletaurelien-art.github.io";
const base = process.env.BASE_PATH ?? "/manahome-app/";
const outDir = process.env.OUT_DIR ?? "site";
const siteUrl = (process.env.SITE_URL ?? HOTE_PAGES).replace(/\/$/, "");
const racine = siteUrl + base;

// ⚠️ Le motif est nommé pour pouvoir être TESTÉ, et pas seulement appliqué :
// « le remplacement n'a rien changé » n'est pas « il n'y avait rien à
// remplacer ». La première version de ce greffon confondait les deux et
// refusait de construire quand la valeur en place était DÉJÀ la bonne — un
// garde qui criait au loup. Mesuré le 28/10/2026.
const MOTIF_CANONIQUE =
  /<link rel="canonical" href="[^"]*"\s*\/?>(\s*<meta property="og:url"[^>]*>)?/;

/**
 * Remplace le titre et l'og:title d'une coquille HTML.
 *
 * 🔴 POURQUOI L'og:title COMPTE PLUS QUE LE <title>. Les titres étaient posés
 * en JS par chaque page : Google les voit (il exécute le JS), mais les APERÇUS
 * DE LIEN non — Slack, WhatsApp, LinkedIn, iMessage, Signal lisent l'og:title
 * du HTML livré et n'exécutent rien. Chaque lien partagé affichait donc la
 * vignette de l'ACCUEIL, et ça se constate sans outil : on colle un lien dans
 * une conversation.
 * ⚠️ Chaque motif est TESTÉ avant d'être appliqué : « le remplacement n'a rien
 * changé » n'est pas « il n'y avait rien à remplacer ».
 * ⛔ La `description` n'est PAS touchée : il n'en existe aucune par page dans
 * ce dépôt, pas même en JS. En écrire serait inventer.
 */
function injecterTitre(html: string, titre: string): string {
  const motifs: [RegExp, string][] = [
    [/<title>[^<]*<\/title>/, `<title>${titre}</title>`],
    [
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${titre}" />`,
    ],
  ];
  let sortie = html;
  for (const [motif, remplacement] of motifs) {
    if (!motif.test(sortie)) throw new Error(`coquille : rien à remplacer pour ${motif}`);
    sortie = sortie.replace(motif, remplacement);
  }
  return sortie;
}

/** Remplace la canonique d'une coquille HTML, et y ajoute og:url. */
function injecterCanonique(html: string, url: string): string {
  if (!MOTIF_CANONIQUE.test(html)) {
    throw new Error('aucune <link rel="canonical"> à réécrire dans la coquille');
  }
  return html.replace(
    MOTIF_CANONIQUE,
    `<link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />`,
  );
}

function cible(): Plugin {
  let coquille = "";
  return {
    name: "valeurs-de-la-cible",
    transformIndexHtml(html) {
      const sortie = injecterCanonique(html, racine);
      coquille = sortie;
      return sortie;
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: construireSitemap(siteUrl, base),
      });
    },
    writeBundle: {
      sequential: true,
      async handler(options) {
        const { readFile, writeFile, mkdir, readdir, stat } = await import("node:fs/promises");
        const dir = options.dir!;

        // 1. UNE COQUILLE HTML PAR ROUTE PLATE, chacune avec SA canonique.
        //
        // 🔴 C'est le correctif du défaut majeur du 28/10 : /approche, /pros,
        // /publier, /estimation et /mentions-legales répondaient 404 en
        // production. Caddy sert la coquille AVEC le statut 404 et le JS route
        // correctement — le visiteur voyait la bonne page, Google voyait une
        // erreur sur chacune. ⭐ Un site qui s'affiche parfaitement peut être
        // intégralement désindexé : on teste le STATUT, jamais l'affichage.
        if (!coquille) throw new Error("coquille HTML jamais capturée");
        for (const slug of ROUTES_PLATES) {
          const url = canonique(`/${slug}`, siteUrl, base);
          if (!url) throw new Error(`route ${slug} : aucune canonique calculable`);
          const titre = titreDeLaRoute(`/${slug}`);
          if (!titre) throw new Error(`route ${slug} : aucun titre`);
          await mkdir(`${dir}/${slug}`, { recursive: true });
          await writeFile(
            `${dir}/${slug}/index.html`,
            injecterTitre(injecterCanonique(coquille, url), titre),
          );
        }

        // 2. 404.html — la page d'erreur que réclame le `handle_errors` du
        // Caddyfile. Elle existait en production, copiée À LA MAIN depuis
        // index.html ; un `rsync --delete` l'a emportée le 28/10 et les URL
        // fautives ont répondu 404 avec un corps VIDE. ⭐ Une étape manuelle
        // dans un déploiement n'est pas une étape : elle est émise ici.
        // ⚠️ Sans canonique : une page d'erreur ne se canonicalise sur rien.
        await writeFile(
          `${dir}/404.html`,
          coquille.replace(MOTIF_CANONIQUE, "").replace(/\n\s*\n/, "\n"),
        );

        // 3. robots.txt : l'hôte de la cible à la place du marqueur.
        const chemin = `${dir}/robots.txt`;
        const texte = await readFile(chemin, "utf8");
        if (!texte.includes("__SITE_URL__")) {
          throw new Error("robots.txt : marqueur __SITE_URL__ absent");
        }
        await writeFile(chemin, texte.replaceAll("__SITE_URL__", racine.replace(/\/$/, "")));

        // 4. ⛔ Quand on construit pour un domaine, aucune URL de Pages ne survit.
        if (siteUrl !== HOTE_PAGES) {
          const restes: string[] = [];
          const parcourir = async (d: string): Promise<void> => {
            for (const e of await readdir(d)) {
              const chem = `${d}/${e}`;
              if ((await stat(chem)).isDirectory()) await parcourir(chem);
              else if (/\.(html|txt|xml|js|css|json)$/.test(e)) {
                if ((await readFile(chem, "utf8")).includes("gilletaurelien-art.github.io")) {
                  restes.push(chem);
                }
              }
            }
          };
          await parcourir(dir);
          if (restes.length) {
            throw new Error(`URL de GitHub Pages encore présentes dans :\n  ${restes.join("\n  ")}`);
          }
        }

        // 5. Le contrôle qui vaut les autres : chaque route livrée porte-t-elle
        // BIEN sa canonique ? Relu sur le fichier écrit, pas supposé.
        for (const slug of ROUTES_PLATES) {
          const h = await readFile(`${dir}/${slug}/index.html`, "utf8");
          const pose = h.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
          const attendu = canonique(`/${slug}`, siteUrl, base);
          if (pose !== attendu) throw new Error(`/${slug} : canonique ${pose}, attendu ${attendu}`);
          const titreAttendu = titreDeLaRoute(`/${slug}`);
          const titrePose = h.match(/<title>([^<]*)<\/title>/)?.[1];
          const ogPose = h.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
          if (titrePose !== titreAttendu || ogPose !== titreAttendu) {
            throw new Error(
              `/${slug} : titre « ${titrePose} », og:title « ${ogPose} », attendu « ${titreAttendu} »`,
            );
          }
        }
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), cible()],
  base,
  define: { __SITE_URL__: JSON.stringify(siteUrl) },
  build: { outDir },
});
