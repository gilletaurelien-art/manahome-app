#!/usr/bin/env node
// Fabrique les pages « pays » de MANAhome, en français ET en anglais.
//
//     node scripts/fabriquer-pays.mjs          # tous les pays mesurés
//
// 🔴 POURQUOI CE GÉNÉRATEUR N'EST PAS UN COMPOSANT REACT, ET C'EST LE CŒUR.
//    MANAhome est une application React qui sert des COQUILLES : mesuré le
//    13/11/2026, `/fr/approche` rend 2 910 octets et **zéro caractère de texte**
//    dans le corps ; `/fr/mentions-legales` n'a même pas de JSON-LD. Le contenu
//    n'existe qu'après exécution du JavaScript.
//    ⭐ Or un robot qui n'exécute pas JS — GPTBot, ClaudeBot, PerplexityBot, ceux
//    que ce site NOMME lui-même — n'y lit rien. Poser 213 pages pays sur cette
//    architecture donnerait 213 coquilles vides, sur le site dont le métier est
//    d'être lu par les machines. Ces pages portent donc leur texte dans le HTML,
//    comme temposystem.fr (6 304 caractères servis sur /geo.html contre 0 ici).
//
// ⚠️ ELLES NE PASSENT PAS PAR `ROUTES_PLATES`. La canonique de `src/canonique.ts`
//    n'accepte qu'un segment (`^/([\w-]+)$`) et la coquille y est la même pour
//    toutes les routes. Ces pages sont écrites APRÈS `vite build`, directement
//    dans `site/`, et Caddy les sert avant le repli SPA parce qu'elles existent
//    en tant que fichiers. ⛔ Donc : lancer ce script APRÈS `npm run build` et
//    AVANT `npm run deploy`, sinon le build les efface.
//
// ⚠️ Les nombres viennent de `src/donnees-pays.json`, écrit par
//    `scripts/mesurer-pays.mjs`. La page affiche la DATE de la mesure : un
//    chiffre sans sa date est un chiffre qu'on citera l'an prochain.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
// ⚠️ La même variable que `scripts/deployer.sh` exporte. Sans elle, ces pages
// se déclareraient sur un domaine et le reste du site sur un autre — et le
// garde « aucune URL de GitHub Pages » ne les verrait pas, puisqu'elles ne
// passent pas par vite.
const SITE = (process.env.SITE_URL ?? "https://manahome.org").replace(/\/$/, "");

const donnees = JSON.parse(readFileSync(resolve(RACINE, "src", "donnees-pays.json"), "utf8"));

// Les étiquettes OSM rencontrées. ⚠️ Une typologie INCONNUE s'affiche telle
// quelle plutôt que d'être rangée dans « autres » : 92 typologies existent dans
// la moisson mondiale, et une case « autres » masquerait précisément ce qu'on
// n'a pas encore traduit.
const TYPO = {
  hotel: ["Hôtels", "Hotels"],
  motel: ["Motels", "Motels"],
  hostel: ["Auberges de jeunesse", "Hostels"],
  guest_house: ["Chambres d'hôtes", "Guest houses"],
  camp_site: ["Campings", "Campsites"],
  caravan_site: ["Aires de camping-car", "Caravan sites"],
  chalet: ["Chalets et gîtes", "Chalets"],
  apartment: ["Appartements", "Apartments"],
  wilderness_hut: ["Refuges non gardés", "Wilderness huts"],
  alpine_hut: ["Refuges de montagne", "Alpine huts"],
};

const M = {
  fr: {
    lang: "fr", autre: "en", autreNom: "English",
    titre: (n) => `Hébergements aux ${n}`,
    h1: (n) => `Les hébergements des ${n}`,
    desc: (n, p, d) =>
      `${p} hébergements touristiques recensés aux ${n} et lisibles par les machines : `
      + `hôtels, campings, motels, refuges. Relevé du ${d}, source OpenStreetMap.`,
    chapo: (p, m) =>
      `<strong>${p}</strong> hébergements publiables, sur ${m} recensés. Chaque ligne porte `
      + `sa position, son type et sa source. Cette page existe pour être lue — par une personne, `
      + `et par les assistants qui répondront à sa place.`,
    hTypes: "Par type", hLieux: "Les lieux que l'on peut nommer",
    hLimites: "Ce que ce relevé ne dit pas",
    thType: "Type", thN: "Recensés", thLieu: "Lieu",
    introLieux: (surs, sous, seuil) =>
      `Un nom de lieu n'est pas un identifiant. <strong>${surs}</strong> noms américains `
      + `désignent un seul endroit — tous leurs points tiennent dans ${seuil}° — et portent `
      + `${sous} hébergements. Les voici, les vingt premiers.`,
    retour: "← MANAhome", mesure: (d) => `Relevé du ${d}`,
    source: "Source", moisson: "Moisson",
  },
  en: {
    lang: "en", autre: "fr", autreNom: "Français",
    titre: (n) => `Accommodation in the ${n}`,
    h1: (n) => `Accommodation across the ${n}`,
    desc: (n, p, d) =>
      `${p} tourist accommodations recorded in the ${n} and readable by machines: `
      + `hotels, campsites, motels, huts. Survey of ${d}, source OpenStreetMap.`,
    chapo: (p, m) =>
      `<strong>${p}</strong> publishable accommodations, out of ${m} recorded. Every row carries `
      + `its position, its type and its source. This page exists to be read — by a person, and `
      + `by the assistants that will answer in their place.`,
    hTypes: "By type", hLieux: "The places we can name",
    hLimites: "What this survey does not say",
    thType: "Type", thN: "Recorded", thLieu: "Place",
    introLieux: (surs, sous, seuil) =>
      `A place name is not an identifier. <strong>${surs}</strong> American names designate a `
      + `single place — all their points fit within ${seuil}° — and carry ${sous} `
      + `accommodations. Here are the first twenty.`,
    retour: "← MANAhome", mesure: (d) => `Survey of ${d}`,
    source: "Source", moisson: "Harvest",
  },
};

const n = (x, lg) => x.toLocaleString(lg === "fr" ? "fr-FR" : "en-US");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

/** ⭐ Les limites sont DANS la page, pas en annexe : ce sont elles qui rendent
 *  les chiffres utilisables. Une organisation qui lit « 90 867 » sans savoir ce
 *  qui a été écarté ne sait pas ce qu'elle lit. */
function limites(p, lg) {
  const seuil = String(p.seuil_degres).replace(".", lg === "fr" ? "," : ".");
  return lg === "fr" ? [
    `<strong>${n(p.sous_nom_ambigu, lg)} hébergements — ${Math.round(100 * p.sous_nom_ambigu / p.geolocalises)} % — ne sont pas listés par nom.</strong> `
    + `${n(p.noms_ambigus, lg)} noms désignent plusieurs endroits distincts : « Jefferson County » `
    + `s'étend sur ${seuil === "0,5" ? "48 degrés" : "plusieurs degrés"} de longitude, d'un océan à l'autre. `
    + `Les additionner sous un seul nom fabriquerait un chiffre faux. Ils sont comptés dans le total, jamais nommés.`,
    `<strong>Un même endroit peut apparaître deux fois.</strong> « New York » et « New York County », `
    + `« Fort Worth » et « Tarrant County » sont le même lieu sous deux résolutions administratives `
    + `d'OpenStreetMap. Ce n'est pas corrigé : il faudrait inventer une hiérarchie que la donnée ne porte pas.`,
    `<strong>${n(p.prives, lg)} hébergements sont écartés comme privés</strong> et ne figurent nulle part `
    + `sur cette page. Un logement de particulier n'est pas un établissement : son adresse est un domicile.`,
    `<strong>Aucun prix, aucune disponibilité, aucun avis.</strong> Ce relevé dit ce qui existe et où. `
    + `Il ne dit pas ce que ça vaut, ni si c'est ouvert.`,
  ] : [
    `<strong>${n(p.sous_nom_ambigu, lg)} accommodations — ${Math.round(100 * p.sous_nom_ambigu / p.geolocalises)}% — are not listed by name.</strong> `
    + `${n(p.noms_ambigus, lg)} names designate several distinct places: "Jefferson County" spans `
    + `48 degrees of longitude, from one ocean to the other. Adding them under one name would `
    + `manufacture a false figure. They are counted in the total, never named.`,
    `<strong>One place can appear twice.</strong> "New York" and "New York County", "Fort Worth" `
    + `and "Tarrant County" are the same place under two OpenStreetMap administrative resolutions. `
    + `This is not corrected: doing so would invent a hierarchy the data does not carry.`,
    `<strong>${n(p.prives, lg)} accommodations are set aside as private</strong> and appear nowhere on `
    + `this page. A private home is not an establishment: its address is a residence.`,
    `<strong>No prices, no availability, no reviews.</strong> This survey says what exists and where. `
    + `It does not say what it is worth, or whether it is open.`,
  ];
}

function page(p, lg) {
  const w = M[lg];
  const nom = p.nom[lg];
  const url = `${SITE}/${lg}/pays/${p.slug}`;
  const desc = w.desc(nom, n(p.publiables, lg), p.moisson.jusqu_a);
  const typos = p.typologies.map((t) => {
    const lib = TYPO[t.cle] ? TYPO[t.cle][lg === "fr" ? 0 : 1] : t.cle;
    return `<tr><td>${esc(lib)}</td><td class="n">${n(t.n, lg)}</td></tr>`;
  }).join("");
  const lieux = p.lieux.map((l) =>
    `<tr><td>${esc(l.nom)}</td><td class="n">${n(l.n, lg)}</td></tr>`).join("");

  // ⭐ JSON-LD : le même nombre que le tableau, jamais une seconde saisie.
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: w.titre(nom),
    description: desc,
    url,
    inLanguage: lg,
    license: "https://opendatacommons.org/licenses/odbl/1-0/",
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "MANAhome", url: SITE + "/" },
    spatialCoverage: { "@type": "Place", name: nom },
    temporalCoverage: `${p.moisson.depuis}/${p.moisson.jusqu_a}`,
    variableMeasured: p.typologies.map((t) => ({
      "@type": "PropertyValue",
      name: TYPO[t.cle] ? TYPO[t.cle][lg === "fr" ? 0 : 1] : t.cle,
      value: t.n,
    })),
  };

  return `<!DOCTYPE html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(w.titre(nom))} — MANAhome</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fr" href="${SITE}/fr/pays/${p.slug}">
<link rel="alternate" hreflang="en" href="${SITE}/en/pays/${p.slug}">
<link rel="alternate" hreflang="x-default" href="${SITE}/fr/pays/${p.slug}">
<meta property="og:title" content="${esc(w.titre(nom))}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
<style>
:root{--ink:#1d1d1f;--doux:#6e6e73;--ecume:#e3e3e6;--alerte:#b0413e;--rayon:6px;
  --sys:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:16px/1.65 var(--sys);
  -webkit-font-smoothing:antialiased}
.wrap{max-width:860px;margin:0 auto;padding:0 24px}
header.bar{border-bottom:1px solid var(--ecume);padding:14px 0;font-size:14px}
header.bar a{color:var(--ink);text-decoration:none;font-weight:600}
header.bar .lang{float:right;color:var(--doux);font-weight:400}
h1{font-size:2.1rem;line-height:1.15;margin:40px 0 .3em;letter-spacing:-.02em}
.lead{font-size:1.125rem;color:var(--ink);max-width:62ch;margin:0 0 6px}
.date{font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;
  text-transform:uppercase;color:var(--doux);margin:0 0 30px}
h2{font-size:1.3rem;margin:44px 0 .2em}
table{width:100%;border-collapse:collapse;margin:14px 0 0;font-size:15px}
th{text-align:left;font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
  letter-spacing:.09em;text-transform:uppercase;color:var(--doux);
  padding:8px 12px 8px 0;border-bottom:1px solid var(--ecume)}
td{padding:10px 12px 10px 0;border-bottom:1px solid var(--ecume)}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
th.n{text-align:right}
.sous{font-size:14px;color:var(--doux);max-width:62ch;margin:.4em 0 0}
.limites{border:1px solid var(--ink);border-radius:var(--rayon);
  box-shadow:3px 3px 0 0 var(--ink);padding:22px 24px;margin:18px 0 0;background:#fff}
.limites h2{margin-top:0}
.limites li{font-size:14px;line-height:1.7;margin:.65em 0;color:var(--ink)}
.limites ul{margin:0;padding-left:20px}
footer{border-top:1px solid var(--ecume);margin-top:56px;padding:20px 0 48px;
  font-size:13px;color:var(--doux)}
footer a{color:var(--doux)}
.grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:0 44px}
@media(max-width:620px){h1{font-size:1.7rem}}
</style>
</head>
<body>
<header class="bar"><div class="wrap">
  <a href="${SITE}/${lg}/">${w.retour}</a>
  <span class="lang"><a href="${SITE}/${w.autre}/pays/${p.slug}" hreflang="${w.autre}">${w.autreNom}</a></span>
</div></header>

<main class="wrap">
<h1>${esc(w.h1(nom))}</h1>
<p class="lead">${w.chapo(n(p.publiables, lg), n(p.moissonnes, lg))}</p>
<p class="date">${w.mesure(p.moisson.jusqu_a)} · ${w.source} : ${p.sources.map((s) => esc(s.cle)).join(", ")}</p>

<div class="grille">
<section>
<h2>${w.hTypes}</h2>
<table><thead><tr><th>${w.thType}</th><th class="n">${w.thN}</th></tr></thead>
<tbody>${typos}</tbody></table>
</section>

<section>
<h2>${w.hLieux}</h2>
<p class="sous">${w.introLieux(n(p.noms_surs, lg), n(p.sous_nom_sur, lg),
  String(p.seuil_degres).replace(".", lg === "fr" ? "," : "."))}</p>
<table><thead><tr><th>${w.thLieu}</th><th class="n">${w.thN}</th></tr></thead>
<tbody>${lieux}</tbody></table>
</section>
</div>

<div class="limites">
<h2>${w.hLimites}</h2>
<ul>${limites(p, lg).map((x) => `<li>${x}</li>`).join("")}</ul>
</div>
</main>

<footer><div class="wrap">
<a href="${SITE}/${lg}/">MANAhome</a> ·
<a href="${SITE}/${lg}/mentions-legales">${lg === "fr" ? "Mentions légales" : "Legal notice"}</a> ·
OpenStreetMap, ODbL
</div></footer>
</body>
</html>
`;
}

let ecrites = 0;
for (const p of donnees.pays) {
  for (const lg of ["fr", "en"]) {
    const dossier = resolve(RACINE, "site", lg, "pays", p.slug);
    mkdirSync(dossier, { recursive: true });
    const html = page(p, lg);
    writeFileSync(resolve(dossier, "index.html"), html, "utf8");
    const texte = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ")
      .replace(/\s+/g, " ").trim();
    // ⭐ LE GARDE QUI COMPTE : la page doit PORTER son texte. C'est toute la
    //    raison d'être de ce générateur — une coquille passerait inaperçue.
    if (texte.length < 1200) {
      console.error(`🔴 ${lg}/${p.slug} : ${texte.length} caractères de texte — c'est une coquille.`);
      process.exit(1);
    }
    console.log(`✓ site/${lg}/pays/${p.slug}/index.html — ${texte.length} car. de texte servi`);
    ecrites++;
  }
}
// ⭐ LE PLAN DE SITE, SANS QUOI PERSONNE NE LES TROUVE. `construireSitemap` ne
//    connaît que ROUTES_PLATES ; ces pages y sont ajoutées ici, par celui qui
//    sait qu'elles existent. Une page hors plan de site est une page qu'aucun
//    moteur n'ira chercher — et c'est exactement le défaut qu'on vient de
//    corriger ailleurs.
const PLAN = resolve(RACINE, "site", "sitemap.xml");
let plan = readFileSync(PLAN, "utf8");
const jour = new Date().toISOString().slice(0, 10);
const entrees = donnees.pays.flatMap((p) => ["fr", "en"].map((lg) =>
  `  <url><loc>${SITE}/${lg}/pays/${p.slug}</loc>`
  + `<xhtml:link rel="alternate" hreflang="fr" href="${SITE}/fr/pays/${p.slug}" />`
  + `<xhtml:link rel="alternate" hreflang="en" href="${SITE}/en/pays/${p.slug}" />`
  + `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/fr/pays/${p.slug}" />`
  + `<lastmod>${jour}</lastmod><priority>0.7</priority></url>`));
// Relançable : on retire d'abord toute entrée « /pays/ » déjà présente.
plan = plan.split("\n").filter((l) => !l.includes("/pays/")).join("\n");
plan = plan.replace("</urlset>", entrees.join("\n") + "\n</urlset>");
writeFileSync(PLAN, plan, "utf8");
console.log(`✓ plan de site — ${entrees.length} URL de pays ajoutées`);

console.log(`${ecrites} page(s) écrite(s). ⚠️ À lancer APRÈS « npm run build », sinon le build les efface.`);
