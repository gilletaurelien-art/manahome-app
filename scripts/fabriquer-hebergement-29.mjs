#!/usr/bin/env node
// Fabrique les pages du pilote « où dormir en Finistère » (hébergement
// touristique, moisson DATAtourisme) — APRÈS `npm run build`, AVANT le rsync,
// exactement comme scripts/fabriquer-pays.mjs : `vite build` réécrit `site/`
// en entier, ces pages n'existent que si on les écrit après.
//
//     node scripts/fabriquer-hebergement-29.mjs                          # fetch live via la RPC publique
//     node scripts/fabriquer-hebergement-29.mjs --fixture <fichier.json> # depuis un fichier (local, tests, PR)
//
// ⚠️ EN DÉPLOIEMENT (scripts/deployer.sh), AUCUN --fixture : les pages sont
//    reconstituées depuis la base à chaque envoi. Si la RPC est injoignable,
//    le script sort en erreur et le déploiement REFUSE — un déploiement
//    tronqué est pire qu'un déploiement refusé.
//
// Données : UNIQUEMENT la RPC publique chercher_le_pays (clé anon, lecture
// seule). Jamais d'accès direct à la table ressources.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chargerPerimetre,
  estDansLePerimetre,
  aDuContenuReel,
  pageFiche,
  pageIndex,
  slugPour,
  urlFiche,
  lignesSitemap,
  patchSitemap,
  texteSansBalises,
  SEUIL_TEXTE,
  PREFIXE_ROUTE,
} from "./hebergement-29.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const SITE = (process.env.SITE_URL ?? "https://manahome.org").replace(/\/$/, "");
const BASE = process.env.BASE_PATH ?? "/";
const SORTIE = process.env.SORTIE ?? resolve(RACINE, "site");
const AUJOURDHUI = (process.env.DATE_RELEVE ?? new Date().toISOString()).slice(0, 10);

function arg(nom) {
  const i = process.argv.indexOf(nom);
  return i >= 0 ? process.argv[i + 1] : null;
}
const FIXTURE = arg("--fixture");

let rows;
let stats = { brutes: 0, requetes: 0, tuiles: 0, subdivisions: 0 };
if (FIXTURE) {
  rows = JSON.parse(readFileSync(resolve(FIXTURE), "utf8"));
  if (!Array.isArray(rows)) throw new Error(`--fixture : ${FIXTURE} n'est pas un tableau`);
  rows = rows.filter(estDansLePerimetre);
  stats.brutes = rows.length;
  console.log(`→ ${rows.length} fiches lues dans ${FIXTURE} (périmètre appliqué)`);
} else {
  console.log("→ parcours de la RPC chercher_le_pays (tuiles Finistère, famille hebergement)…");
  const res = await chargerPerimetre();
  rows = res.rows;
  stats = res.stats;
  console.log(
    `→ ${stats.brutes} fiches lues (${stats.tuiles} tuiles, ${stats.requetes} requêtes, ${stats.subdivisions} subdivisions), ${rows.length} dans le périmètre 29 / DATAtourisme`,
  );
}

const publiables = rows.filter(aDuContenuReel);
const creuses = rows.length - publiables.length;

// ⚠️ Un slug dupliqué = deux fiches servies sous la même URL : on refuse.
const vus = new Map();
const doublons = [];
for (const f of publiables) {
  const s = slugPour(f);
  if (vus.has(s)) doublons.push([s, vus.get(s), f.titre]);
  else vus.set(s, f.titre);
}
if (doublons.length) {
  console.error(`🔴 ${doublons.length} slug(s) en double :`);
  for (const [s, a, b] of doublons.slice(0, 10)) console.error(`   ${s} : « ${a} » et « ${b} »`);
  process.exit(1);
}

const dossier = resolve(SORTIE, "fr", PREFIXE_ROUTE);
mkdirSync(dossier, { recursive: true });
let ecrites = 0;
const tropVides = [];
for (const f of publiables) {
  const html = pageFiche(f, { site: SITE, base: BASE, date: AUJOURDHUI });
  // ⛔ LE GARDE QUI COMPTE : la page doit PORTER son texte — une coquille
  //    passerait inaperçue (c'est toute la raison d'être de ces pages).
  const texte = texteSansBalises(html);
  if (texte.length < SEUIL_TEXTE) {
    tropVides.push(`${slugPour(f)} : ${texte.length} car.`);
    continue;
  }
  mkdirSync(resolve(dossier, slugPour(f)), { recursive: true });
  writeFileSync(resolve(dossier, slugPour(f), "index.html"), html, "utf8");
  ecrites++;
}
if (tropVides.length) {
  console.error(`🔴 ${tropVides.length} page(s) sous le seuil de ${SEUIL_TEXTE} caractères de texte — PAS publiées :`);
  for (const t of tropVides.slice(0, 10)) console.error(`   ${t}`);
  process.exit(1);
}
console.log(`✓ ${ecrites} page(s) de fiches écrites dans site/fr/${PREFIXE_ROUTE}/`);

const index = pageIndex(publiables, {
  site: SITE,
  date: AUJOURDHUI,
  stats: { brutes: stats.brutes, creuses },
});
writeFileSync(resolve(dossier, "index.html"), index, "utf8");
console.log(`✓ index écrit — ${publiables.length} fiches, ${new Set(publiables.map((f) => f.publisher).filter(Boolean)).size} éditeurs distincts`);

const plan = resolve(SORTIE, "sitemap.xml");
if (existsSync(plan)) {
  const entrees = lignesSitemap(publiables, SITE, AUJOURDHUI);
  writeFileSync(plan, patchSitemap(readFileSync(plan, "utf8"), entrees), "utf8");
  console.log(`✓ plan de site — ${entrees.length} URL ajoutées (relev du ${AUJOURDHUI})`);
} else {
  console.log(`⚠ ${plan} absent (build non lancé ?) — plan de site non patché.`);
}

console.log(`→ résumé : ${stats.brutes} lues · ${rows.length} périmètre · ${publiables.length} publiées · ${creuses} écartées (creuses) · ${ecrites} pages`);
console.log(`⚠️  À lancer APRÈS « npm run build », sinon le build efface ces pages.`);
