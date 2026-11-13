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

// ═══════════════════════════════════════════════════════════════════════════
// LES TYPOLOGIES — normalisées, puis traduites.
//
// 🔴 LE DÉFAUT N'ÉTAIT PAS LA TRADUCTION, C'ÉTAIT LA DUPLICATION. Huit sources
//    alimentent la moisson et chacune apporte son vocabulaire : `hotel` (OSM),
//    `Hotel` (schema.org/DATAtourisme), `Albergo` et `Alberghi` (registres
//    italiens) sont LA MÊME CHOSE. Sans normalisation, la page italienne
//    afficherait quatre lignes pour un seul concept, chacune avec un compte
//    partiel — quatre nombres justes qui mentent ensemble.
//
// ⭐ ON NE FUSIONNE QUE DES SYNONYMES. « Agriturismo » rejoint « Farm » parce que
//    c'est le même objet ; « motel » ne rejoint PAS « hotel », et les refuges de
//    montagne ne rejoignent pas les campings. Fusionner des catégories
//    distinctes ferait disparaître l'information qu'on prétend publier.
//
// ⚠️ UNE CLÉ INCONNUE S'AFFICHE TELLE QUELLE, et il n'y a PAS de case « autres ».
//    Une case fourre-tout cacherait exactement ce qu'on n'a pas encore traduit —
//    et personne ne corrige ce qu'il ne voit pas. Au 13/11/2026 cette table
//    couvre 56 des 57 clés rencontrées ; la 57ᵉ pèse deux hébergements et
//    s'affiche en italien, visible, donc corrigible.
const CONCEPTS = {
  hotel:      ["Hôtels", "Hotels"],
  motel:      ["Motels", "Motels"],
  auberge:    ["Auberges de jeunesse", "Hostels"],
  chambre:    ["Chambres d'hôtes", "Guest houses"],
  camping:    ["Campings", "Campsites"],
  camping_car:["Aires de camping-car", "Motorhome sites"],
  refuge:     ["Refuges", "Mountain huts"],
  ferme:      ["Fermes et agritourisme", "Farm stays"],
  meuble:     ["Meublés et résidences", "Self-catering and residences"],
  village:    ["Villages vacances", "Holiday villages"],
  collectif:  ["Hébergements collectifs", "Group accommodation"],
};

/** Clé de source → concept. Les clés sont écrites EXACTEMENT comme la moisson
 *  les porte, accents manquants compris : ce sont des chaînes reçues, pas des
 *  chaînes choisies. */
const NORMALISER = {
  hotel: "hotel", Hotel: "hotel", Albergo: "hotel", Alberghi: "hotel",
  HotelTrade: "hotel", HotelRestaurant: "hotel", HotelPension: "hotel",
  "Residenze turistico alberghiere": "hotel",
  "Residenza Turistico Alberghiera (R.T.A.)": "hotel",
  "Villaggio-Albergo": "hotel", "Albergo diffuso": "hotel", "Albergo Rurale": "hotel",
  "Residenza d'epoca": "hotel",

  motel: "motel",

  hostel: "auberge", Hostels: "auberge", Youth: "auberge",
  YouthHostelAndInternationalCenter: "auberge", Jeugdverblijven: "auberge",
  "Ostello della gioventu": "auberge",

  guest_house: "chambre",

  camp_site: "camping", Camping: "camping", CampingAndCaravanning: "camping",
  Campeggi: "camping", Campeggio: "camping", "Camping village": "camping",
  "Terreingebonden logies": "camping",

  caravan_site: "camping_car", Camperterrein: "camping_car",

  wilderness_hut: "refuge", alpine_hut: "refuge", Mountain: "refuge",
  "Rifugio escursionistico": "refuge",

  Farm: "ferme", Agriturismo: "ferme", "Alloggi agrituristici": "ferme",
  "Country house": "ferme", "Fattoria didattica con pernottamento": "ferme",

  chalet: "meuble", apartment: "meuble", Residence: "meuble",
  "CAV imprenditoriale": "meuble",

  HolidayResort: "village", ClubOrHolidayVillage: "village", HolidayCentre: "village",
  "Villaggi turistici": "village", "Villaggio turistico": "village",
  Vakantiepark: "village",

  StopOverOrGroupLodge: "collectif", CollectiveAccommodation: "collectif",
  GroupLodging: "collectif", "Case per ferie": "collectif",
  "Casa per ferie": "collectif", "Casa per ferie e ospitalit religiosa": "collectif",
  "Casa religiosa di ospitalita": "collectif", "Centro soggiorno studi": "collectif",
  "Alloggio del Pellegrino": "collectif", Kinderheim: "collectif",
};

/** Regroupe les typologies d'un pays par concept et SOMME. ⭐ C'est ici que les
 *  quatre « hôtels » redeviennent un seul nombre. */
function typologies(p, lg) {
  const par = new Map();
  for (const t of p.typologies) {
    const c = NORMALISER[t.cle] ?? null;
    const lib = c ? CONCEPTS[c][lg === "fr" ? 0 : 1] : t.cle;
    par.set(lib, (par.get(lib) ?? 0) + t.n);
  }
  return [...par.entries()].sort((a, b) => b[1] - a[1]).map(([lib, n]) => ({ lib, n }));
}

const M = {
  fr: {
    lang: "fr", autre: "en", autreNom: "English",
    // 🔴 AUCUN ARTICLE DEVANT LE NOM DE PAYS, ET C'EST UNE RÈGLE, PAS UN STYLE.
    //    La première version écrivait « Les hébergements des ${n} » — juste pour
    //    « États-Unis », faux pour « Italie », « Japon », « Tchad ». Le français
    //    n'a pas d'article régulier pour les pays : le Japon, l'Italie, les
    //    États-Unis, Cuba, Madagascar. L'anglais non plus (« in the Italy »).
    //    ⭐ Même piège que les gabarits de questions, résolu de la même façon :
    //    l'accord se pose sur ce qu'on maîtrise, jamais sur ce qu'on reçoit. Ici
    //    on n'en pose aucun — le nom suit un tiret ou ouvre la phrase.
    titre: (n) => `${n} — hébergements`,
    h1: (n) => `Hébergements — ${n}`,
    desc: (n, p, d) =>
      `${n} : ${p} hébergements touristiques recensés et lisibles par les machines — `
      + `hôtels, campings, motels, refuges. Relevé du ${d}, source OpenStreetMap.`,
    chapo: (p, m) =>
      `<strong>${p}</strong> hébergements publiables, sur ${m} recensés. Chaque ligne porte `
      + `sa position, son type et sa source. Cette page existe pour être lue — par une personne, `
      + `et par les assistants qui répondront à sa place.`,
    hTypes: "Par type", hLieux: "Les lieux que l'on peut nommer",
    hLimites: "Ce que ce relevé ne dit pas",
    thType: "Type", thN: "Recensés", thLieu: "Lieu",
    introLieux: (surs, sous, seuil) =>
      `Un nom de lieu n'est pas un identifiant. <strong>${surs}</strong> noms d'ici `
      + `désignent un seul endroit — tous leurs points tiennent dans ${seuil}° — et portent `
      + `${sous} hébergements. Les voici, les vingt premiers.`,
    retour: "← Tous les pays", mesure: (d) => `Relevé du ${d}`,
    source: "Source", moisson: "Moisson",
  },
  en: {
    lang: "en", autre: "fr", autreNom: "Français",
    titre: (n) => `${n} — accommodation`,
    h1: (n) => `Accommodation — ${n}`,
    desc: (n, p, d) =>
      `${n}: ${p} tourist accommodations recorded and readable by machines — `
      + `hotels, campsites, motels, huts. Survey of ${d}, source OpenStreetMap.`,
    chapo: (p, m) =>
      `<strong>${p}</strong> publishable accommodations, out of ${m} recorded. Every row carries `
      + `its position, its type and its source. This page exists to be read — by a person, and `
      + `by the assistants that will answer in their place.`,
    hTypes: "By type", hLieux: "The places we can name",
    hLimites: "What this survey does not say",
    thType: "Type", thN: "Recorded", thLieu: "Place",
    introLieux: (surs, sous, seuil) =>
      `A place name is not an identifier. <strong>${surs}</strong> local names designate a `
      + `single place — all their points fit within ${seuil}° — and carry ${sous} `
      + `accommodations. Here are the first twenty.`,
    retour: "← All countries", mesure: (d) => `Survey of ${d}`,
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
  const part = Math.round(100 * p.sous_nom_ambigu / Math.max(p.geolocalises, 1));
  const pire = p.pire_nom;
  // ⭐ L'exemple vient du PAYS, jamais d'un autre. Un « Jefferson County »
  //    recopié sur 173 pages serait faux sur 172.
  const exemple = pire
    ? (lg === "fr"
      ? ` Ici, « ${esc(pire.nom)} » rassemble ${n(pire.n, lg)} hébergements répartis sur `
        + `${String(pire.degres).replace(".", ",")} degrés — plusieurs endroits distincts sous un seul nom.`
      : ` Here, "${esc(pire.nom)}" gathers ${n(pire.n, lg)} accommodations spread over `
        + `${pire.degres} degrees — several distinct places under one name.`)
    : "";
  const L = [];
  if (p.sous_nom_ambigu > 0) L.push(lg === "fr"
    ? `<strong>${n(p.sous_nom_ambigu, lg)} hébergements — ${part} % — ne sont pas listés par nom.</strong> `
      + `${n(p.noms_ambigus, lg)} noms désignent plusieurs endroits distincts : leurs points ne tiennent `
      + `pas dans ${seuil}°.${exemple} Les additionner fabriquerait un chiffre faux. Ils sont comptés `
      + `dans le total, jamais nommés.`
    : `<strong>${n(p.sous_nom_ambigu, lg)} accommodations — ${part}% — are not listed by name.</strong> `
      + `${n(p.noms_ambigus, lg)} names designate several distinct places: their points do not fit `
      + `within ${seuil}°.${exemple} Adding them up would manufacture a false figure. They are counted `
      + `in the total, never named.`);
  L.push(lg === "fr"
    ? `<strong>Un même endroit peut apparaître deux fois.</strong> Une localité est parfois enregistrée `
      + `sous son nom de ville ET sous celui de sa division administrative. Ce n'est pas corrigé : il `
      + `faudrait inventer une hiérarchie que la donnée ne porte pas.`
    : `<strong>One place can appear twice.</strong> A locality is sometimes recorded under its town name `
      + `AND under that of its administrative division. This is not corrected: doing so would invent a `
      + `hierarchy the data does not carry.`);
  if (p.prives > 0) L.push(lg === "fr"
    ? `<strong>${n(p.prives, lg)} hébergements sont écartés comme privés</strong> et ne figurent nulle part `
      + `sur cette page. Un logement de particulier n'est pas un établissement : son adresse est un domicile.`
    : `<strong>${n(p.prives, lg)} accommodations are set aside as private</strong> and appear nowhere on this `
      + `page. A private home is not an establishment: its address is a residence.`);
  L.push(lg === "fr"
    ? `<strong>Aucun prix, aucune disponibilité, aucun avis.</strong> Ce relevé dit ce qui existe et où. `
      + `Il ne dit pas ce que ça vaut, ni si c'est ouvert.`
    : `<strong>No prices, no availability, no reviews.</strong> This survey says what exists and where. `
      + `It does not say what it is worth, or whether it is open.`);
  return L;
}

function page(p, lg) {
  const w = M[lg];
  const nom = p.nom[lg];
  const url = `${SITE}/${lg}/pays/${p.slug}`;
  const desc = w.desc(nom, n(p.publiables, lg), p.moisson.jusqu_a);
  const typos = typologies(p, lg)
    .map((t) => `<tr><td>${esc(t.lib)}</td><td class="n">${n(t.n, lg)}</td></tr>`).join("");
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
    // ⭐ Les mêmes nombres que le tableau affiché — jamais une seconde saisie.
    variableMeasured: typologies(p, lg).map((t) => ({
      "@type": "PropertyValue", name: t.lib, value: t.n,
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
  <a href="${SITE}/${lg}/pays">${w.retour}</a>
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
    // ⭐ LE GARDE QUI MANQUAIT : un article devant un nom de pays ne casse rien,
    //    il publie une faute — sur 173 pages à la fois.
    // 🔴 ET SA PREMIÈRE VERSION ÉTAIT INERTE. Elle portait `${"[A-ZÀ-Þ]"}` dans
    //    un LITTÉRAL de regex, où rien ne s'interpole : elle cherchait la chaîne
    //    `${…}` elle-même, donc jamais rien. Éprouvée par mutation, elle a laissé
    //    passer « Les hébergements des Italie » en rendant 0.
    //    ⭐ Un garde qu'on n'a jamais vu REFUSER n'a jamais été vu. Celui-ci a
    //    été remis à l'épreuve après correction, et il refuse.
    const nu = html.replace(/<[^>]+>/g, " ");
    const nomEchappe = p.nom[lg].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b(?:des|du|de\\s+la|aux|au|the)\\s+${nomEchappe}\\b`, "i").test(nu)) {
      console.error(`🔴 ${lg}/${p.slug} : un article précède « ${p.nom[lg]} ». `
        + `Ni le français ni l'anglais n'en ont de régulier pour les pays `
        + `(le Japon, l'Italie, les États-Unis, Cuba) : n'en poser aucun.`);
      process.exit(1);
    }
    if (texte.length < 1200) {
      console.error(`🔴 ${lg}/${p.slug} : ${texte.length} caractères de texte — c'est une coquille.`);
      process.exit(1);
    }
    console.log(`✓ site/${lg}/pays/${p.slug}/index.html — ${texte.length} car. de texte servi`);
    ecrites++;
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// L'INDEX — 346 pages existaient, et aucune page n'y menait.
//
// ⭐ Elles étaient au plan de site, donc trouvables par un moteur ; mais un
//    visiteur arrivé sur l'accueil n'avait aucun chemin vers elles, et un
//    assistant qui lit le site de haut en bas non plus. Un plan de site est une
//    déclaration aux machines, pas une navigation.
const IDX = {
  fr: {
    titre: "Les hébergements du monde",
    h1: "Les hébergements du monde",
    desc: (n, p, d) => `${p} hébergements touristiques recensés dans ${n} pays et lisibles par `
      + `les machines : hôtels, campings, motels, refuges, fermes. Relevé du ${d}.`,
    chapo: (n, p) => `<strong>${p}</strong> hébergements publiables, dans <strong>${n}</strong> pays. `
      + `Une page par pays, chacune avec ses types, ses lieux nommables, et ce qu'elle ne dit pas.`,
    hPays: "Les pays", hLimites: "Ce que ce relevé ne dit pas",
    retour: "← MANAhome", sous: "Par ordre alphabétique. Le nombre est celui des hébergements publiables.",
  },
  en: {
    titre: "Accommodation worldwide",
    h1: "Accommodation worldwide",
    desc: (n, p, d) => `${p} tourist accommodations recorded across ${n} countries and readable by `
      + `machines: hotels, campsites, motels, huts, farm stays. Survey of ${d}.`,
    chapo: (n, p) => `<strong>${p}</strong> publishable accommodations, across <strong>${n}</strong> `
      + `countries. One page per country, each with its types, its nameable places, and what it does not say.`,
    hPays: "The countries", hLimites: "What this survey does not say",
    retour: "← MANAhome", sous: "In alphabetical order. The figure is the publishable count.",
  },
};

function indexPage(lg) {
  const w = IDX[lg];
  const ps = donnees.pays;
  const somme = ps.reduce((s, p) => s + p.publiables, 0);
  const prives = ps.reduce((s, p) => s + p.prives, 0);
  const ambigus = ps.reduce((s, p) => s + p.sous_nom_ambigu, 0);
  const geoloc = ps.reduce((s, p) => s + p.geolocalises, 0);
  const jusqu = ps.map((p) => p.moisson.jusqu_a).sort().at(-1);
  const url = `${SITE}/${lg}/pays`;
  const desc = w.desc(ps.length, n(somme, lg), jusqu);

  // ⭐ Tri par la LANGUE de la page : « Égypte » se range à E en français, et
  //    un tri d'octets la mettrait après Z. `localeCompare` le sait, pas nous.
  const tries = [...ps].sort((a, b) => a.nom[lg].localeCompare(b.nom[lg], lg));
  const lignes = tries.map((p) =>
    `<li><a href="${SITE}/${lg}/pays/${p.slug}">${esc(p.nom[lg])}</a>`
    + `<span class="n">${n(p.publiables, lg)}</span></li>`).join("");

  const lim = lg === "fr" ? [
    `<strong>${n(prives, lg)} hébergements sont écartés comme privés</strong> et ne figurent sur `
    + `aucune de ces pages. Un logement de particulier n'est pas un établissement : son adresse est `
    + `un domicile.`,
    `<strong>${n(ambigus, lg)} hébergements — ${Math.round(100 * ambigus / geoloc)} % — ne sont pas `
    + `listés par nom de lieu.</strong> Hors de France, un nom de commune n'est pas un identifiant : `
    + `il désigne souvent plusieurs endroits distincts, parfois à des milliers de kilomètres. Un nom `
    + `n'est retenu que si tous ses points tiennent dans un demi-degré. Les autres sont comptés dans `
    + `les totaux, jamais nommés.`,
    `<strong>${213 - ps.length} pays n'ont pas de page</strong>, faute d'un relevé assez fourni pour `
    + `en porter une. Ils ne sont pas oubliés : ils reviendront quand la moisson les fournira.`,
    `<strong>Aucun prix, aucune disponibilité, aucun avis.</strong> Ce relevé dit ce qui existe et où. `
    + `Il ne dit pas ce que ça vaut, ni si c'est ouvert.`,
  ] : [
    `<strong>${n(prives, lg)} accommodations are set aside as private</strong> and appear on none of `
    + `these pages. A private home is not an establishment: its address is a residence.`,
    `<strong>${n(ambigus, lg)} accommodations — ${Math.round(100 * ambigus / geoloc)}% — are not `
    + `listed by place name.</strong> Outside France a town name is not an identifier: it often `
    + `designates several distinct places, sometimes thousands of kilometres apart. A name is kept `
    + `only if all its points fit within half a degree. The rest are counted in the totals, never named.`,
    `<strong>${213 - ps.length} countries have no page</strong>, for want of a survey rich enough to `
    + `carry one. They are not forgotten: they return when the harvest provides them.`,
    `<strong>No prices, no availability, no reviews.</strong> This survey says what exists and where. `
    + `It does not say what it is worth, or whether it is open.`,
  ];

  const jsonld = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: w.titre, description: desc, url, inLanguage: lg,
    isPartOf: { "@type": "WebSite", name: "MANAhome", url: SITE + "/" },
    hasPart: tries.map((p) => ({
      "@type": "Dataset", name: p.nom[lg],
      url: `${SITE}/${lg}/pays/${p.slug}`,
      spatialCoverage: { "@type": "Place", name: p.nom[lg] },
    })),
  };

  return `<!DOCTYPE html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(w.titre)} — MANAhome</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fr" href="${SITE}/fr/pays">
<link rel="alternate" hreflang="en" href="${SITE}/en/pays">
<link rel="alternate" hreflang="x-default" href="${SITE}/fr/pays">
<meta property="og:title" content="${esc(w.titre)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
<style>
:root{--ink:#1d1d1f;--doux:#6e6e73;--ecume:#e3e3e6;--rayon:6px;
  --sys:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:16px/1.65 var(--sys);-webkit-font-smoothing:antialiased}
.wrap{max-width:980px;margin:0 auto;padding:0 24px}
header.bar{border-bottom:1px solid var(--ecume);padding:14px 0;font-size:14px}
header.bar a{color:var(--ink);text-decoration:none;font-weight:600}
header.bar .lang{float:right;color:var(--doux);font-weight:400}
h1{font-size:2.1rem;line-height:1.15;margin:40px 0 .3em;letter-spacing:-.02em}
.lead{font-size:1.125rem;max-width:62ch;margin:0 0 6px}
.date{font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;
  text-transform:uppercase;color:var(--doux);margin:0 0 34px}
h2{font-size:1.3rem;margin:44px 0 .2em}
.sous{font-size:14px;color:var(--doux);max-width:62ch;margin:.4em 0 0}
ul.pays{list-style:none;margin:18px 0 0;padding:0;
  columns:3 220px;column-gap:40px}
ul.pays li{break-inside:avoid;display:flex;justify-content:space-between;gap:10px;
  padding:7px 0;border-bottom:1px solid var(--ecume);font-size:15px}
ul.pays a{color:var(--ink);text-decoration:none}
ul.pays a:hover{text-decoration:underline}
ul.pays .n{color:var(--doux);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:14px}
.limites{border:1px solid var(--ink);border-radius:var(--rayon);box-shadow:3px 3px 0 0 var(--ink);
  padding:22px 24px;margin:40px 0 0;background:#fff}
.limites h2{margin-top:0}
.limites ul{margin:0;padding-left:20px}
.limites li{font-size:14px;line-height:1.7;margin:.65em 0}
footer{border-top:1px solid var(--ecume);margin-top:56px;padding:20px 0 48px;font-size:13px;color:var(--doux)}
footer a{color:var(--doux)}
@media(max-width:620px){h1{font-size:1.7rem}}
</style>
</head>
<body>
<header class="bar"><div class="wrap">
  <a href="${SITE}/${lg}/">${w.retour}</a>
  <span class="lang"><a href="${SITE}/${lg === "fr" ? "en" : "fr"}/pays">${lg === "fr" ? "English" : "Français"}</a></span>
</div></header>

<main class="wrap">
<h1>${esc(w.h1)}</h1>
<p class="lead">${w.chapo(ps.length, n(somme, lg))}</p>
<p class="date">${lg === "fr" ? "Relevé du" : "Survey of"} ${jusqu} · ${lg === "fr" ? "Source" : "Source"} : OpenStreetMap, ODbL</p>

<h2>${w.hPays}</h2>
<p class="sous">${w.sous}</p>
<ul class="pays">${lignes}</ul>

<div class="limites">
<h2>${w.hLimites}</h2>
<ul>${lim.map((x) => `<li>${x}</li>`).join("")}</ul>
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

for (const lg of ["fr", "en"]) {
  const dossier = resolve(RACINE, "site", lg, "pays");
  mkdirSync(dossier, { recursive: true });
  const html = indexPage(lg);
  writeFileSync(resolve(dossier, "index.html"), html, "utf8");
  const texte = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim();
  // ⭐ Le même garde que les pages pays : un index vide serait pire qu'absent.
  if (texte.length < 1200) {
    console.error(`🔴 index ${lg} : ${texte.length} caractères — c'est une coquille.`);
    process.exit(1);
  }
  // ⚠️ Et un garde propre à l'index : il doit porter TOUS les pays. Un index
  //    amputé ne se voit pas — il a l'air complet.
  // ⚠️ Compter les occurrences donnait 346 pour 173 pays : chaque slug paraît
  //    DEUX fois, dans la liste et dans le JSON-LD. Le garde a refusé à son
  //    premier passage — c'est exactement ce qu'on lui demande. On compte donc
  //    les slugs DISTINCTS, qui est la question qu'on voulait poser.
  const liens = new Set(html.match(/\/pays\/[a-z0-9-]+"/g) ?? []).size;
  if (liens !== donnees.pays.length) {
    console.error(`🔴 index ${lg} : ${liens} pays liés pour ${donnees.pays.length} mesurés.`);
    process.exit(1);
  }
  console.log(`✓ site/${lg}/pays/index.html — ${donnees.pays.length} pays, ${texte.length} car.`);
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
for (const lg of ["fr", "en"]) entrees.unshift(
  `  <url><loc>${SITE}/${lg}/pays</loc>`
  + `<xhtml:link rel="alternate" hreflang="fr" href="${SITE}/fr/pays" />`
  + `<xhtml:link rel="alternate" hreflang="en" href="${SITE}/en/pays" />`
  + `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/fr/pays" />`
  + `<lastmod>${jour}</lastmod><priority>0.9</priority></url>`);
plan = plan.replace("</urlset>", entrees.join("\n") + "\n</urlset>");
writeFileSync(PLAN, plan, "utf8");
console.log(`✓ plan de site — ${entrees.length} URL de pays ajoutées`);

console.log(`${ecrites} page(s) écrite(s). ⚠️ À lancer APRÈS « npm run build », sinon le build les efface.`);
