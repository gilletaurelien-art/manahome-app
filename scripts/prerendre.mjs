#!/usr/bin/env node
// Remplit les coquilles React avec leur contenu, pour que les robots le lisent.
//
//     node scripts/prerendre.mjs      # après « npm run build », avant l'envoi
//
// 🔴 LE DÉFAUT QU'IL CORRIGE, MESURÉ LE 13/11/2026 :
//
//     manahome.org/fr/approche          2 910 o,  0 caractère de texte
//     manahome.org/fr/mentions-legales  2 905 o,  0 caractère, pas de JSON-LD
//     manahome.org/                     2 988 o,  0 caractère
//
//    Le build écrivait une coquille par route — titre, canonique, hreflang — et
//    le CONTENU n'existait qu'après exécution du JavaScript. ⭐ Or GPTBot,
//    ClaudeBot et PerplexityBot, que ce site NOMME dans son propre argumentaire,
//    n'exécutent pas JavaScript. Le site qui vend la lisibilité par les machines
//    ne leur montrait rien.
//
// ⭐ IL NE TOUCHE QUE CE QUI EST UNE COQUILLE, et il le reconnaît à sa forme :
//    `<div id="root"></div>` VIDE. Les pages « pays » (écrites par
//    fabriquer-pays.mjs) portent déjà leur texte et n'ont pas ce motif : elles
//    sont ignorées sans qu'aucune liste n'ait à être tenue à jour. Une liste
//    aurait vieilli ; une forme, non.
//
// ⚠️ LE CLIENT NE S'HYDRATE PAS, IL REMPLACE. `src/main.tsx` appelle
//    `createRoot().render()`, pas `hydrateRoot()` : au montage, React vide le
//    conteneur et refait le rendu. C'est délibéré — l'hydratation exigerait que
//    serveur et client rendent l'IDENTIQUE, ce qui n'est pas vrai ici (dates,
//    données chargées en effet). Le coût est un clignement imperceptible pour
//    un humain ; le bénéfice est tout le contenu, pour une machine.
//
// ⚠️ `renderToString` n'exécute AUCUN `useEffect` : rien ne part en réseau, et
//    les blocs qui attendent une donnée distante sortent dans leur état
//    d'attente. C'est exact — c'est ce que la page AFFIRME avant d'interroger
//    qui que ce soit.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, statSync, rmSync } from "node:fs";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const SITE = resolve(RACINE, "site");
const SSR = resolve(RACINE, ".ssr");

/** Une coquille se reconnaît à son conteneur VIDE — pas à son nom. */
const COQUILLE = '<div id="root"></div>';

console.log("→ construction du bundle de rendu …");
execFileSync("npx", ["vite", "build", "--ssr", "src/entree-serveur.tsx",
  "--outDir", ".ssr", "--logLevel", "error"],
  { cwd: RACINE, stdio: "inherit" });

const { rendre } = await import(pathToFileURL(resolve(SSR, "entree-serveur.js")).href);

/** Tous les index.html du site, récursivement. */
function* pages(dossier) {
  for (const e of readdirSync(dossier)) {
    const p = resolve(dossier, e);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (e === "index.html") yield p;
  }
}

let remplies = 0, ignorees = 0, redirections = 0;
const vides = [];

for (const fichier of pages(SITE)) {
  const html = readFileSync(fichier, "utf8");
  if (!html.includes(COQUILLE)) { ignorees++; continue; }

  // Le chemin que le routeur doit croire : « site/fr/approche/index.html »
  // → « /fr/approche ». La racine « site/index.html » → « / ».
  const rel = relative(SITE, dirname(fichier)).split(sep).filter(Boolean);
  const chemin = "/" + (rel.length ? rel.join("/") : "");

  let corps;
  try {
    corps = rendre(chemin === "/" ? "/" : chemin);
  } catch (e) {
    // ⛔ On ne rattrape PAS en laissant la coquille : ce serait rétablir en
    //    silence le défaut qu'on corrige. Une route qui ne sait pas se rendre
    //    doit arrêter le déploiement.
    console.error(`🔴 ${chemin} : le rendu a échoué — ${e.message}`);
    process.exit(1);
  }

  // ⭐ `null` = la route redirige. Sa coquille reste une coquille, et c'est la
  //    bonne réponse : elle n'a pas de contenu, elle a une destination.
  if (corps === null) {
    console.log(`· ${chemin.padEnd(26)} redirige — coquille laissée telle quelle`);
    redirections++;
    continue;
  }

  const texte = corps.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (texte.length < 200) { vides.push([chemin, texte.length]); }

  writeFileSync(fichier, html.replace(COQUILLE, `<div id="root">${corps}</div>`), "utf8");
  console.log(`✓ ${chemin.padEnd(26)} ${String(texte.length).padStart(5)} car. de texte servi`);
  remplies++;
}

rmSync(SSR, { recursive: true, force: true });

// ⭐ LE GARDE QUI COMPTE : une page qui se rend SANS ÉCHOUER mais sans texte est
//    le défaut d'origine, revenu sous une autre forme — et elle a l'air
//    réparée. Les écrans d'application (messagerie, mes-annonces) sont
//    légitimement pauvres : le seuil est bas, il attrape le vide, pas la
//    sobriété.
if (vides.length) {
  console.error(`\n🔴 ${vides.length} page(s) rendue(s) quasi vides :`);
  for (const [c, n] of vides) console.error(`   ${c} — ${n} caractères`);
  process.exit(1);
}
if (!remplies) { console.error("🔴 aucune coquille trouvée — le build a-t-il tourné ?"); process.exit(1); }
console.log(`\n${remplies} coquille(s) remplie(s), ${redirections} redirection(s) laissée(s) vide(s), `
  + `${ignorees} page(s) déjà pleine(s) ignorée(s).`);
