import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  construireSitemap,
  ROUTES_PLATES,
  canonique,
  titreDeLaRoute,
  DESCRIPTION_GENERIQUE,
  DESCRIPTION_GENERIQUE_EN,
} from "./src/canonique";
import { LOCALES } from "./src/i18n";
// ⛔ OFFRES_MANA retiré : ces trois prix ne sont plus AFFICHÉS sur la page.
//    Les laisser dans le JSON-LD déclarerait aux machines un catalogue que
//    l'humain ne voit pas — exactement le défaut que MANA GEO facture pour le
//    détecter chez ses clients.

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
 * ⛔ CETTE CONSIGNE DISAIT « la description n'est PAS touchée : il n'en existe
 *    aucune par page, en écrire serait inventer » — juste, et dépassée le
 *    13/11/2026. Elle parlait des descriptions PAR PAGE ; il en existe
 *    désormais une PAR LANGUE, et /en/ servait la française sous un titre
 *    anglais. ⭐ Une consigne juste peut couvrir un cas qu'elle n'a pas prévu.
 *    Il n'y a toujours AUCUNE description par page, et en écrire serait
 *    toujours inventer : seule la langue est traitée.
 */
function injecterTitre(html: string, titre: string, langue: string): string {
  const description =
    langue === "en" ? DESCRIPTION_GENERIQUE_EN : DESCRIPTION_GENERIQUE;
  const motifs: [RegExp, string][] = [
    [/<title>[^<]*<\/title>/, `<title>${titre}</title>`],
    [
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${titre}" />`,
    ],
    [
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${description}" />`,
    ],
    [
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${description}" />`,
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
function injecterCanonique(html: string, url: string, hreflangDe: string = ""): string {
  if (!MOTIF_CANONIQUE.test(html)) {
    throw new Error('aucune <link rel="canonical"> à réécrire dans la coquille');
  }
  return html.replace(
    MOTIF_CANONIQUE,
    `<link rel="canonical" href="${url}" />${hreflangDe}\n    <meta property="og:url" content="${url}" />`,
  );
}

/** Le href de chaque version linguistique d'une coquille, avec x-default. */
function hreflangDe(racine: string, chemin: string): string {
  const url = (l: string) => racine + l + (chemin === "/" ? "/" : chemin);
  return `\n    <link rel="alternate" hreflang="fr" href="${url("fr")}" />\n    <link rel="alternate" hreflang="en" href="${url("en")}" />\n    <link rel="alternate" hreflang="x-default" href="${url("fr")}" />`;
}

/**
 * Les données structurées de l'accueil (§12).
 *
 * ⛔ UNIQUEMENT SUR L'ACCUEIL, et uniquement ce qui y est VISIBLE. Poser le
 *    catalogue d'offres sur /mentions-legales déclarerait aux machines des
 *    prix que la page n'affiche pas — c'est exactement le défaut que MANA GEO
 *    facture pour le détecter chez ses clients.
 * ⭐ Les montants viennent de src/offres.ts, la même source que l'écran. Un
 *    prix affiché 390 € et déclaré 490 € aux machines serait un mensonge
 *    qu'aucun test d'affichage ne verrait.
 */
function donneesStructurees(langue: string, urlAccueil: string): string {
  const donnees = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MANAhome",
    url: urlAccueil,
    inLanguage: langue,
    description: langue === "en"
      ? "GEO expertise by TEMPOsystem: being found by AI assistants — machine-readable infrastructure, audits, and the fixed offers of the MANA ecosystem."
      : "L'expertise GEO par TEMPOsystem : être trouvé par les assistants IA — infrastructure machine-readable, audits, et les offres arrêtées de l'écosystème MANA.",
    // 🔴 « TEMPOsystem » A VÉCU ICI JUSQU'AU 12/11/2026, APRÈS AVOIR ÉTÉ
    //    RETIRÉ DU TEXTE VISIBLE LE 11. Décision d'Aurélien : « ne cite pas
    //    TEMPOsystem — la facturation, c'est Alliance MANA ». Le texte lu par
    //    les humains a été corrigé ce jour-là ; CETTE COUCHE-CI ne l'a pas été,
    //    et elle est restée en ligne vingt-quatre heures de plus.
    //
    // ⭐ C'EST LE DÉFAUT LE PLUS EMBARRASSANT QU'ON POUVAIT AVOIR : nous vendons
    //    une prestation qui mesure ce que les assistants racontent sur nos
    //    clients, et notre propre site racontait aux assistants que MANAhome
    //    appartient à TEMPOsystem. Un `grep TEMPOsystem src/` ne trouvait rien :
    //    la contradiction vivait ICI, hors du dossier où l'on cherche le contenu.
    //
    // ⚠️ LA LEÇON VAUT POUR TOUTES LES VITRINES : corriger un texte ne corrige
    //    pas ce que les machines lisent. Le JSON-LD est une SECONDE RÉDACTION du
    //    site, écrite ailleurs, et c'est celle que notre propre produit irait
    //    chercher. Un arbitrage d'identité se vérifie SUR LA PAGE SERVIE :
    //        curl -sS https://manahome.org/ | grep -o '"parentOrganization".*'
    // 🔴 BASCULÉ LE 13/11/2026 : l'éditeur de MANAhome est l'entreprise, plus
    //    l'association (arbitrage « l'asso prouve, la société encaisse »). La
    //    leçon d'il y a deux jours vaut dans l'autre sens : le 11/11 le texte
    //    visible avait changé et CETTE couche était restée 24 h en arrière.
    parentOrganization: { "@type": "Organization", name: "TEMPOsystem" },
    // 🔴 `makesOffer` A ÉTÉ RETIRÉ LE 13/11/2026 — DEMANDE D'AURÉLIEN.
    //    Il déclarait HUIT OFFRES TARIFÉES (149, 390, 199 ×5, 99/mois…) au nom
    //    d'Alliance MANA, dans la couche que lisent les moteurs et les
    //    assistants — c'est-à-dire l'endroit le plus public possible.
    //
    // ⭐ LA RAISON N'EST PAS TECHNIQUE, ELLE EST FISCALE. L'association
    //    s'apprête à déposer un rescrit mécénat : il se juge sur l'activité
    //    RÉELLE ET DÉCLARÉE, pas sur l'intention. Une offre commerciale
    //    tarifée publiée au nom de l'association, avant le dépôt, est une
    //    pièce contre le dossier — et les paiements coupés n'y changent rien,
    //    puisque c'est le PRIX qui était affiché, pas l'encaissement.
    //
    // ⚠️ LE COÛT EST RÉEL ET ASSUMÉ : nous vendons d'être lu par les
    //    assistants, et `makesOffer` est précisément ce par quoi un assistant
    //    apprend ce qui est vendu. On perd donc de la lisibilité machine sur
    //    nos propres offres. L'arbitrage dit que le rescrit vaut plus que
    //    cette lisibilité-là, tant que l'entité qui facture n'est pas tranchée.
    //
    // ⛔ NE PAS LE REMETTRE SANS LA DÉCISION « QUI FACTURE ». S'il revient, il
    //    revient sous le nom de la SOCIÉTÉ, pas de l'association — et alors la
    //    TVA change de régime (voir le commentaire de `offre()` ci-dessus :
    //    `valueAddedTaxIncluded: true` n'est vrai que parce que l'éditeur ne
    //    collecte aucune TVA — désormais par la franchise en base, art. 293 B,
    //    et non plus par l'art. 261-7 propre aux associations). Un garde le tient : `structure.test.ts`.
  };
  return `\n    <script type="application/ld+json">${JSON.stringify(donnees)}</script>`;
}

function cible(): Plugin {
  let coquille = "";
  // Vrai pendant `vite build --ssr` : le greffon ne doit alors rien écrire.
  let estSSR = false;
  return {
    name: "valeurs-de-la-cible",
    // ⛔ CE GREFFON ÉCRIT LES COQUILLES HTML : il n'a rien à faire dans un build
    //    SSR, qui ne produit aucune page. Sans ce garde, `vite build --ssr`
    //    échoue sur « coquille HTML jamais capturée » — un message exact, mais
    //    qui accuse la cible au lieu du greffon. Le rendu serveur
    //    (scripts/prerendre.mjs) en a besoin pour construire son bundle.
    configResolved(c) { estSSR = !!c.build.ssr; },
    transformIndexHtml(html) {
      // ⚠️ La coquille RACINE est l'accueil réellement servi sur https://…/
      // (Caddy y sert site/index.html). Elle porte donc le JSON-LD, comme
      // /fr/ et /en/ — sans lui, un robot qui lit « / » ne voit rien, même si
      // la canonique renvoie vers /fr/.
      // ⭐ Mais `coquille` — réemployée pour TOUTES les autres routes plates —
      // est gardée SANS : /mentions-legales ne doit pas déclarer aux machines
      // un catalogue de prix qu'elle n'affiche pas.
      coquille = injecterCanonique(html, `${racine}fr/`, hreflangDe(racine, "/"));
      return injecterCanonique(
        html,
        `${racine}fr/`,
        hreflangDe(racine, "/") + donneesStructurees("fr", `${racine}fr/`),
      );
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
        // ⛔ Un build SSR ne produit aucune page : sortir AVANT le contrôle de
        //    la coquille, sinon il accuse la cible d'un défaut qui n'existe pas.
        if (estSSR) return;
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
        // ⭐ BILINGUE : une coquille par route × langue, chacune avec SA
        // canonique, ses hreflang et son attribut lang. Les coquilles NUES
        // restent émises (alias français des URLs indexées avant le
        // bilingue) et portent la canonique /fr/… : Google consolide, aucun
        // lien partagé ne devient orphelin.
        for (const l of LOCALES) {
          const coquilleLangue =
            l === "fr" ? coquille : coquille.replace("<html lang=\"fr\">", `<html lang=\"${l}\">`);
          for (const slug of ROUTES_PLATES) {
            const url = canonique(`/${slug}`, siteUrl, base, l);
            if (!url) throw new Error(`route ${slug}/${l} : aucune canonique calculable`);
            const titre = titreDeLaRoute(`/${slug}`, l);
            if (!titre) throw new Error(`route ${slug}/${l} : aucun titre`);
            await mkdir(`${dir}/${l}/${slug}`, { recursive: true });
            await writeFile(
              `${dir}/${l}/${slug}/index.html`,
              injecterTitre(
                injecterCanonique(coquilleLangue, url, hreflangDe(racine, `/${slug}`)),
                titre,
                l,
              ),
            );
          }
          // L'accueil de chaque langue, canonique sur lui-même.
          await mkdir(`${dir}/${l}`, { recursive: true });
          await writeFile(
            `${dir}/${l}/index.html`,
            injecterTitre(
              injecterCanonique(
                coquilleLangue,
                `${racine}${l}/`,
                hreflangDe(racine, "/") + donneesStructurees(l, `${racine}${l}/`),
              ),
              titreDeLaRoute("/", l)!,
              l,
            ),
          );
        }
        for (const slug of ROUTES_PLATES) {
          await mkdir(`${dir}/${slug}`, { recursive: true });
          await writeFile(
            `${dir}/${slug}/index.html`,
            injecterTitre(
              injecterCanonique(coquille, canonique(`/${slug}`, siteUrl, base, "fr")!),
              titreDeLaRoute(`/${slug}`, "fr")!,
              "fr",
            ),
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
        for (const l of LOCALES) {
          for (const slug of ROUTES_PLATES) {
            const h = await readFile(`${dir}/${l}/${slug}/index.html`, "utf8");
            const pose = h.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
            const attendu = canonique(`/${slug}`, siteUrl, base, l);
            if (pose !== attendu) throw new Error(`/${l}/${slug} : canonique ${pose}, attendu ${attendu}`);
            const titreAttendu = titreDeLaRoute(`/${slug}`, l);
            const titrePose = h.match(/<title>([^<]*)<\/title>/)?.[1];
            const ogPose = h.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
            if (titrePose !== titreAttendu || ogPose !== titreAttendu) {
              throw new Error(
                `/${l}/${slug} : titre « ${titrePose} », og:title « ${ogPose} », attendu « ${titreAttendu} »`,
              );
            }
            // ⭐ Une coquille EN qui déclarerait lang="fr" ment aux moteurs
            // comme aux lecteurs d'écran : on relit l'attribut posé.
            const langPose = h.match(/<html lang="([^"]*)"/)?.[1];
            if (langPose !== l) throw new Error(`/${l}/${slug} : lang="${langPose}", attendu "${l}"`);
          }
        }
      },
    },
  };
}

// ⭐ FEATURE_BACK : la bascule API réelle, côté front (docs/branchement-back.md).
// Comme BASE_PATH et SITE_URL : quand une valeur dépend de la cible, elle en
// dépend partout — substituée au build par define. ÉTEINTE PAR DÉFAUT : la
// démo localStorage reste serviable ; un flag éteint n'affiche rien, ne
// casse rien (doctrine de déploiement du repo : la fonction AVANT l'app,
// le branchement AVANT la bascule).
const FEATURE_BACK = process.env.FEATURE_BACK === "true";

export default defineConfig({
  plugins: [react(), cible()],
  base,
  define: {
    __SITE_URL__: JSON.stringify(siteUrl),
    __FEATURE_BACK__: JSON.stringify(FEATURE_BACK),
  },
  build: { outDir },
});
