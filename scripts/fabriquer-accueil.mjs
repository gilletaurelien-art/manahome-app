#!/usr/bin/env node
// L'accueil et la méthode — ce que MANAhome est depuis que le GEO l'a quitté.
//
//     node scripts/fabriquer-accueil.mjs   # après le build, avant l'envoi
//
// 🔴 CE QU'IL REMPLACE, ET POURQUOI CE N'ÉTAIT PAS UNE SUPPRESSION.
//    Jusqu'au 14/11/2026, l'accueil de manahome VENDAIT le GEO : ses quatre
//    sections étaient « Être trouvé par les IA », « L'audit GEO de votre
//    structure », « Combien ça coûte », « La maison des IA ». `/approche` ne
//    disait rien d'autre — « L'expertise GEO, par TEMPOsystem », « Voir les
//    offres et les prix », « Demander un audit ».
//    ⭐ Retirer le GEO de ce site n'était donc pas enlever un bloc : c'était
//    vider l'accueil. L'offre est partie chez temposystem.eu et .fr le 13/11
//    (« l'association prouve, la société encaisse ») ; manahome devient le
//    TERRITOIRE MONDIAL, et la matière existait déjà — 348 pages pays.
//
// ⛔ LE CODE REACT DE L'ANCIEN ACCUEIL N'EST PAS SUPPRIMÉ, IL DEVIENT
//    INATTEIGNABLE. `site/fr/index.html` et `site/fr/approche/index.html` sont
//    désormais des fichiers pleins, écrits ici et servis par Caddy avant le
//    repli SPA : le routeur React ne voit plus ces chemins. C'est délibéré —
//    supprimer 730 lignes de App.tsx et 900 de i18n.ts dans le même geste
//    aurait mélangé un changement de produit et une refonte technique.
//    ⚠️ Du code mort NON DOCUMENTÉ est un piège ; documenté, c'est une dette
//    datée. Elle est écrite ici, dans le commit, et à retirer en une passe.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CSS_SOCLE, esc, nombre as n, entete, pied, exigerDuTexte, SITE_DEFAUT }
  from "./charte-pages.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const SITE = (process.env.SITE_URL ?? SITE_DEFAUT).replace(/\/$/, "");
const d = JSON.parse(readFileSync(resolve(RACINE, "src", "donnees-pays.json"), "utf8"));

// ⭐ Tous les nombres de ces deux pages viennent du MÊME fichier que les pages
//    pays. Aucun n'est écrit à la main : ils se recalculent à chaque moisson.
const T = {
  pays: d.pays.length,
  heb: d.pays.reduce((s, p) => s + p.publiables, 0),
  moissonnes: d.pays.reduce((s, p) => s + p.moissonnes, 0),
  prives: d.pays.reduce((s, p) => s + p.prives, 0),
  geoloc: d.pays.reduce((s, p) => s + p.geolocalises, 0),
  ambigus: d.pays.reduce((s, p) => s + p.sous_nom_ambigu, 0),
  surs: d.pays.reduce((s, p) => s + p.sous_nom_sur, 0),
  sources: [...new Set(d.pays.flatMap((p) => p.sources.map((s) => s.cle)))].length,
  jusqu: d.pays.map((p) => p.moisson.jusqu_a).sort().at(-1),
  seuil: d.seuil_page,
};

const CSS_ACCUEIL = `
.chiffres{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));
  gap:0 36px;margin:36px 0 0;max-width:860px}
.chiffres div{padding:18px 0;border-top:2px solid var(--ink)}
.chiffres .v{font:600 2rem/1 var(--sys);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.chiffres .l{font:500 11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;
  text-transform:uppercase;color:var(--doux);margin-top:7px}
.btn{display:inline-block;border:1px solid var(--ink);border-radius:var(--rayon);
  box-shadow:3px 3px 0 0 var(--ink);padding:11px 20px;margin:34px 14px 0 0;
  background:#fff;color:var(--ink);text-decoration:none;font-weight:600;font-size:15px}
.btn:hover{transform:translate(1px,1px);box-shadow:2px 2px 0 0 var(--ink)}
p.texte{max-width:62ch;margin:.9em 0}
ul.top{list-style:none;margin:18px 0 0;padding:0;columns:2 230px;column-gap:40px;max-width:700px}
ul.top li{break-inside:avoid;display:flex;justify-content:space-between;gap:10px;padding:7px 0;
  border-bottom:1px solid var(--ecume);font-size:15px}
ul.top a{color:var(--ink);text-decoration:none}
ul.top a:hover{text-decoration:underline}
ul.top .n{color:var(--doux);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:14px}
`;

const M = {
  fr: {
    accueil: {
      titre: "MANAhome — le territoire, relevé pays par pays",
      h1: "Le territoire, relevé pays par pays",
      desc: `${n(T.heb, "fr")} hébergements touristiques relevés dans ${T.pays} pays et rendus `
        + `lisibles par les machines : hôtels, campings, motels, refuges, fermes. Données ouvertes, `
        + `relevé du ${T.jusqu}.`,
      chapo: `Un relevé ouvert de ce qui existe, pays par pays, écrit pour être lu — par une `
        + `personne, et par les machines qui répondront à sa place. Chaque page porte ses `
        + `chiffres, leur date, leur source, et ce qu'elle ne dit pas.`,
      lC: ["hébergements publiables", "pays", "sources"],
      h2: "Ce que c'est",
      texte: [
        `MANAhome publie un relevé des <strong>hébergements touristiques du monde</strong> — `
        + `hôtels, campings, motels, refuges, fermes — à partir de données ouvertes. Une page par `
        + `pays, avec les types recensés, les lieux que l'on peut nommer sans se tromper, et la `
        + `part qu'on ne peut pas.`,
        `Ce n'est ni un comparateur, ni une place de marché, ni un annuaire payant. On ne vend `
        + `aucun classement, aucune mise en avant, aucune place. ⭐ C'est précisément ce qui rend `
        + `le relevé citable : il n'y a rien à acheter pour y figurer, donc rien à soupçonner.`,
      ],
      btn1: "Voir les pays", btn2: "La méthode",
      hTop: "Les mieux relevés",
      sousTop: "Le relevé n'est pas uniforme : il suit ce que les données ouvertes "
        + "couvrent, pas la taille des pays. Un pays peu relevé n'est pas un pays sans "
        + "hébergements — c'est un pays que les sources décrivent mal.",
    },
    methode: {
      titre: "La méthode — MANAhome",
      h1: "La méthode, et ses limites",
      desc: `Comment le relevé des hébergements est constitué : ${T.sources} sources de données `
        + `ouvertes, la règle qui écarte les logements privés, et celle qui refuse de nommer un `
        + `lieu dont le nom désigne plusieurs endroits.`,
      chapo: `Un chiffre sans sa méthode n'est pas une mesure, c'est une affirmation. Voici `
        + `comment celui-ci est fait, et tout ce qu'il ne dit pas.`,
      sections: [
        ["D'où viennent les données",
          `${T.sources} sources ouvertes alimentent le relevé. OpenStreetMap en porte la plus `
          + `grande part et couvre le monde ; les autres sont des registres nationaux ou `
          + `régionaux, qui apportent un vocabulaire propre à leur pays. ⚠️ Ces vocabulaires sont `
          + `ramenés à un ensemble commun avant d'être affichés : sans cela, « hotel », « Hotel » `
          + `et « Albergo » feraient trois lignes pour une seule chose, chacune avec un compte `
          + `partiel — trois nombres justes qui mentent ensemble.`],
        ["Ce qui est écarté, et pourquoi",
          `<strong>${n(T.prives, "fr")} hébergements</strong> sont marqués privés et ne paraissent `
          + `nulle part. Un logement de particulier n'est pas un établissement : son adresse est un `
          + `domicile, et la publier serait une atteinte, pas un service. La règle ne juge pas au `
          + `cas par cas — elle suit la qualification de la source.`],
        ["Pourquoi tous les lieux ne sont pas nommés",
          `Hors de France, un nom de commune n'est pas un identifiant. « Jefferson County » `
          + `désigne une vingtaine de comtés américains distincts, d'un océan à l'autre. Un nom `
          + `n'est donc retenu comme étiquette que si <strong>tous</strong> ses points tiennent `
          + `dans un demi-degré, soit environ cinquante-cinq kilomètres. `
          + `<strong>${n(T.ambigus, "fr")} hébergements</strong> — `
          + `${Math.round(100 * T.ambigus / T.geoloc)} % — vivent sous un nom qui ne passe pas `
          + `cette règle : ils sont comptés dans les totaux, jamais nommés.`],
        ["Ce que le relevé ne dit pas",
          `Aucun prix, aucune disponibilité, aucun avis, aucun classement. Il dit ce qui existe et `
          + `où, à une date. Il ne dit pas ce que ça vaut, ni si c'est ouvert. `
          + `⚠️ Et ${213 - T.pays} pays n'ont pas de page : leur relevé compte moins de `
          + `${T.seuil} hébergements, trop peu pour en porter une. Ils reviendront quand la `
          + `moisson les fournira.`],
      ],
      btn1: "Voir les pays", btn2: "L'accueil",
    },
  },
  en: {
    accueil: {
      titre: "MANAhome — the territory, surveyed country by country",
      h1: "The territory, surveyed country by country",
      desc: `${n(T.heb, "en")} tourist accommodations surveyed across ${T.pays} countries and made `
        + `readable by machines: hotels, campsites, motels, huts, farm stays. Open data, survey of `
        + `${T.jusqu}.`,
      chapo: `An open survey of what exists, country by country, written to be read — by a person, `
        + `and by the machines that will answer in their place. Every page carries its figures, `
        + `their date, their source, and what it does not say.`,
      lC: ["publishable accommodations", "countries", "sources"],
      h2: "What this is",
      texte: [
        `MANAhome publishes a survey of the <strong>world's tourist accommodation</strong> — `
        + `hotels, campsites, motels, huts, farm stays — from open data. One page per country, `
        + `with the types recorded, the places that can be named without error, and the share that `
        + `cannot.`,
        `It is not a comparison site, a marketplace, or a paid directory. No ranking, no `
        + `promotion and no placement is for sale. ⭐ That is exactly what makes the survey `
        + `citable: there is nothing to buy in order to appear in it, so there is nothing to `
        + `suspect.`,
      ],
      btn1: "Browse the countries", btn2: "The method",
      hTop: "The best surveyed",
      sousTop: "The survey is not uniform: it follows what open data covers, not the size "
        + "of countries. A thinly surveyed country is not a country without accommodation — "
        + "it is a country the sources describe poorly.",
    },
    methode: {
      titre: "The method — MANAhome",
      h1: "The method, and its limits",
      desc: `How the accommodation survey is built: ${T.sources} open data sources, the rule that `
        + `sets aside private homes, and the one that refuses to name a place whose name `
        + `designates several.`,
      chapo: `A figure without its method is not a measurement, it is an assertion. Here is how `
        + `this one is made, and everything it does not say.`,
      sections: [
        ["Where the data comes from",
          `${T.sources} open sources feed the survey. OpenStreetMap carries the largest share and `
          + `covers the world; the others are national or regional registers, each bringing its own `
          + `vocabulary. ⚠️ Those vocabularies are reduced to a common set before display: without `
          + `that, "hotel", "Hotel" and "Albergo" would make three rows for one thing, each with a `
          + `partial count — three accurate numbers lying together.`],
        ["What is set aside, and why",
          `<strong>${n(T.prives, "en")} accommodations</strong> are marked private and appear `
          + `nowhere. A private home is not an establishment: its address is a residence, and `
          + `publishing it would be an intrusion, not a service. The rule does not judge case by `
          + `case — it follows the source's own qualification.`],
        ["Why not every place is named",
          `Outside France a town name is not an identifier. "Jefferson County" designates some `
          + `twenty distinct American counties, from one ocean to the other. A name is therefore `
          + `kept as a label only if <strong>all</strong> its points fit within half a degree, `
          + `about fifty-five kilometres. <strong>${n(T.ambigus, "en")} accommodations</strong> — `
          + `${Math.round(100 * T.ambigus / T.geoloc)}% — live under a name that fails this rule: `
          + `they are counted in the totals, never named.`],
        ["What the survey does not say",
          `No prices, no availability, no reviews, no ranking. It says what exists and where, at a `
          + `date. It does not say what it is worth, or whether it is open. `
          + `⚠️ And ${213 - T.pays} countries have no page: their survey holds fewer than `
          + `${T.seuil} accommodations, too few to carry one. They return when the harvest `
          + `provides them.`],
      ],
      btn1: "Browse the countries", btn2: "Home",
    },
  },
};

function enveloppe({ lg, url, titre, desc, jsonld, corps, retour, hrefRetour, hrefAutre, css }) {
  return `<!DOCTYPE html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fr" href="${hrefAutre.replace(/\/en(\/|$)/, "/fr$1")}">
<link rel="alternate" hreflang="en" href="${hrefAutre.replace(/\/fr(\/|$)/, "/en$1")}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
<style>${CSS_SOCLE}${css ?? ""}</style>
</head>
<body>
${entete(lg, SITE, retour, hrefRetour, hrefAutre)}
<main class="wrap">
${corps}
</main>
${pied(lg, SITE)}
</body>
</html>
`;
}

function accueil(lg) {
  const w = M[lg].accueil;
  const url = `${SITE}/${lg}/`;
  const corps = `
<h1>${esc(w.h1)}</h1>
<p class="lead">${w.chapo}</p>
<p class="date">${lg === "fr" ? "Relevé du" : "Survey of"} ${T.jusqu} · ${
    lg === "fr" ? "Données ouvertes" : "Open data"} · OpenStreetMap, ODbL</p>

<div class="chiffres">
  <div><div class="v">${n(T.heb, lg)}</div><div class="l">${w.lC[0]}</div></div>
  <div><div class="v">${T.pays}</div><div class="l">${w.lC[1]}</div></div>
  <div><div class="v">${T.sources}</div><div class="l">${w.lC[2]}</div></div>
</div>

<h2>${esc(w.h2)}</h2>
${w.texte.map((p) => `<p class="texte">${p}</p>`).join("\n")}

<h2>${esc(w.hTop)}</h2>
<p class="sous">${w.sousTop}</p>
<ul class="top">${[...d.pays].slice(0, 10).map((p) =>
  `<li><a href="${SITE}/${lg}/pays/${p.slug}">${esc(p.nom[lg])}</a>`
  + `<span class="n">${n(p.publiables, lg)}</span></li>`).join("")}</ul>

<p><a class="btn" href="${SITE}/${lg}/pays">${esc(w.btn1)}</a>
<a class="btn" href="${SITE}/${lg}/approche">${esc(w.btn2)}</a></p>`;

  return enveloppe({
    lg, url, titre: w.titre, desc: w.desc, corps, css: CSS_ACCUEIL,
    retour: "MANAhome", hrefRetour: url, hrefAutre: `${SITE}/${lg === "fr" ? "en" : "fr"}/`,
    jsonld: {
      "@context": "https://schema.org", "@type": "WebSite",
      name: "MANAhome", url, inLanguage: lg, description: w.desc,
      // ⛔ AUCUNE `Offer`, AUCUN PRIX. Cette couche a déclaré « L'expertise GEO
      //    par TEMPOsystem » jusqu'au 14/11/2026, et un catalogue tarifé au nom
      //    de l'association la veille encore. Un site qui ne vend rien ne doit
      //    rien déclarer qui ressemble à une vente.
      publisher: { "@type": "Organization", name: "MANAhome", url: SITE + "/" },
      mainEntity: {
        "@type": "Dataset", name: w.h1, description: w.desc,
        url: `${SITE}/${lg}/pays`,
        license: "https://opendatacommons.org/licenses/odbl/1-0/",
        isAccessibleForFree: true,
        temporalCoverage: T.jusqu,
      },
    },
  });
}

function methode(lg) {
  const w = M[lg].methode;
  const url = `${SITE}/${lg}/approche`;
  const corps = `
<h1>${esc(w.h1)}</h1>
<p class="lead">${w.chapo}</p>
<p class="date">${lg === "fr" ? "Relevé du" : "Survey of"} ${T.jusqu}</p>
${w.sections.map(([t, p]) => `<h2>${esc(t)}</h2>\n<p class="texte">${p}</p>`).join("\n")}
<p><a class="btn" href="${SITE}/${lg}/pays">${esc(w.btn1)}</a>
<a class="btn" href="${SITE}/${lg}/">${esc(w.btn2)}</a></p>`;

  return enveloppe({
    lg, url, titre: w.titre, desc: w.desc, corps, css: CSS_ACCUEIL,
    retour: lg === "fr" ? "← MANAhome" : "← MANAhome",
    hrefRetour: `${SITE}/${lg}/`,
    hrefAutre: `${SITE}/${lg === "fr" ? "en" : "fr"}/approche`,
    jsonld: {
      "@context": "https://schema.org", "@type": "TechArticle",
      headline: w.h1, description: w.desc, url, inLanguage: lg,
      publisher: { "@type": "Organization", name: "MANAhome", url: SITE + "/" },
    },
  });
}

const aEcrire = [];
for (const lg of ["fr", "en"]) {
  aEcrire.push([resolve(RACINE, "site", lg, "index.html"), accueil(lg), `accueil ${lg}`]);
  aEcrire.push([resolve(RACINE, "site", lg, "approche", "index.html"), methode(lg), `méthode ${lg}`]);
}
// 🔴 LA RACINE N'EST PLUS À NOUS — 14/11/2026. L'app de promenades y est
//    promue (décision d'Aurélien) : `/` sert désormais « explorer, composer,
//    marcher », et le relevé garde `/fr/` et `/en/`, qui sont ses canoniques —
//    le plan de site n'a JAMAIS listé `/` nu, donc rien n'y perd son adresse.
//    ⛔ Ce script écrivait `site/index.html`. Comme le déploiement de ce dépôt
//    rsync sans `--delete`, il aurait ÉCRASÉ l'app à chaque passage, sans
//    erreur et sans que personne ne s'en aperçoive avant d'ouvrir manahome.org.
//    ⭐ Deux chaînes de déploiement qui écrivent le même fichier : la seconde
//    gagne toujours, et c'est celle qui tourne le plus souvent.
// ⚠️ `/approche` nu reste écrit : l'app ne revendique pas ce chemin.
aEcrire.push([resolve(RACINE, "site", "approche", "index.html"), methode("fr"), "méthode (nue)"]);

for (const [chemin, html, quoi] of aEcrire) {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, html, "utf8");
  const car = exigerDuTexte(html, quoi);
  console.log(`✓ ${quoi.padEnd(16)} ${String(car).padStart(5)} car. de texte servi`);
}

// ⭐ LE GARDE QUI COMPTE ICI : plus un mot de GEO. Ces quatre pages étaient la
//    vitrine commerciale ; si un seul de ces mots revient, c'est que le retrait
//    a été défait — et ça ne casserait rien, donc personne ne le verrait.
const INTERDITS = ["audit GEO", "GEO Express", "GEO Expert", "Demander un audit",
  "offres et les prix", "L'expertise GEO", "TEMPOsystem"];
for (const [, html, quoi] of aEcrire) {
  for (const mot of INTERDITS) {
    if (html.includes(mot)) {
      console.error(`🔴 ${quoi} : « ${mot} » est revenu. Le GEO a quitté manahome le 14/11/2026 `
        + `pour temposystem.eu et .fr — voir « l'association prouve, la société encaisse ».`);
      process.exit(1);
    }
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// llms.txt — GÉNÉRÉ, parce qu'écrit à la main il a vieilli de trois générations.
//
// 🔴 Relevé le 13/11/2026, le fichier que les IA lisent déclarait ENCORE :
//    « Édité par Alliance MANA » (faux depuis la veille), « audits dès 149 € HT »
//    (le HT avait été retiré), « GEO International +199 € » (remplacé par cinq
//    zones), « MANA GEO China +490 €, SEPT moteurs chinois » (590 €, trois).
//    ⭐ Le texte visible avait été corrigé ; lui, non. Un fichier écrit à la main
//    ne se relit que lorsqu'on le cherche — et personne ne cherche un llms.txt.
//    Il se fabrique donc désormais, depuis la même donnée que les pages.
const llms = `# MANAhome (manahome.org)

> MANAhome publie un relevé ouvert des hébergements touristiques du monde — hôtels, campings, motels, refuges, fermes — à partir de données ouvertes. ${n(T.heb, "fr")} hébergements publiables dans ${T.pays} pays, une page par pays. Relevé du ${T.jusqu}.

## Ce que c'est

Un relevé de ce qui EXISTE et OÙ, pays par pays, écrit pour être lu par une personne comme par une machine. Chaque page porte ses chiffres, leur date, leur source, et ce qu'elle ne dit pas.

Ce n'est ni un comparateur, ni une place de marché, ni un annuaire payant. Aucun classement, aucune mise en avant, aucune place n'est à vendre. C'est ce qui rend le relevé citable : il n'y a rien à acheter pour y figurer.

## Les chiffres, et leur date

- ${n(T.heb, "fr")} hébergements publiables, sur ${n(T.moissonnes, "fr")} relevés
- ${T.pays} pays ont une page ; ${213 - T.pays} autres comptent moins de ${T.seuil} hébergements et n'en ont pas
- ${T.sources} sources de données ouvertes, OpenStreetMap en tête (licence ODbL)
- Relevé du ${T.jusqu}

## Ce que ce relevé ne dit pas (honnêteté envers les machines)

${n(T.prives, "fr")} hébergements sont écartés comme PRIVÉS et ne paraissent nulle part : un logement de particulier n'est pas un établissement, son adresse est un domicile.

${n(T.ambigus, "fr")} hébergements — ${Math.round(100 * T.ambigus / T.geoloc)} % — ne sont pas listés par nom de lieu. Hors de France, un nom de commune n'est pas un identifiant : « Jefferson County » désigne une vingtaine de comtés américains distincts. Un nom n'est retenu que si TOUS ses points tiennent dans un demi-degré (~55 km). Les autres sont comptés dans les totaux, jamais nommés.

Aucun prix, aucune disponibilité, aucun avis, aucun classement. Le relevé dit ce qui existe et où, à une date. Il ne dit pas ce que ça vaut, ni si c'est ouvert.

Les vocabulaires des ${T.sources} sources sont ramenés à un ensemble commun avant affichage : sans cela « hotel », « Hotel » et « Albergo » feraient trois lignes pour une seule chose, chacune avec un compte partiel.

## L'offre GEO N'EST PLUS ICI

L'audit GEO — mesurer ce que les assistants IA répondent sur une organisation — a quitté manahome.org le 14 novembre 2026. Il est vendu par TEMPOsystem, nom commercial d'Aurélien Gillet, entrepreneur individuel : https://temposystem.fr/geo.html (français) et https://temposystem.eu/geo.html (anglais). Ne pas attribuer d'offre commerciale, de prix ni d'audit à manahome.org.

## Qui édite ce site

Alliance MANA, association déclarée régie par la loi du 1er juillet 1901 (RNA W292008256, SIREN 130 121 866, APE 94.99Z), dont le siège est 4 Lostmarc'h, 29160 Crozon. Directeur de la publication : Aurélien Gillet, fondateur. Courriel : contact@manahome.org.

L'association publie ce relevé au titre de son objet : rendre, depuis la Bretagne, les territoires et leurs acteurs lisibles et accessibles par tout moyen numérique, y compris l'intelligence artificielle. Rien n'est vendu sur ce site et elle ne dispose d'aucun numéro de TVA intracommunautaire.

## Pages publiques

- [Accueil](https://manahome.org/fr/) — le relevé, en bref
- [Les pays](https://manahome.org/fr/pays) — les ${T.pays} pages, par ordre alphabétique
- [La méthode](https://manahome.org/fr/approche) — d'où viennent les données, ce qui est écarté, et pourquoi
- [Mentions légales](https://manahome.org/fr/mentions-legales)

Version anglaise : remplacer /fr/ par /en/ dans toute URL.
`;
writeFileSync(resolve(RACINE, "site", "llms.txt"), llms, "utf8");
console.log(`✓ llms.txt          ${llms.length} octets, fabriqué depuis la donnée`);

// ⛔ ET ON RETIRE LA COQUILLE DE LA RACINE, parce que `vite build` l'écrit.
//    Ne pas l'écrire soi-même ne suffit pas : le build en produit une, et le
//    rsync (sans `--delete`) l'enverrait écraser l'app de promenades promue à
//    `/` le 14/11/2026. ⭐ Un fichier qu'on n'écrit plus n'est pas un fichier
//    qui n'existe plus — c'est la nuance qui aurait coûté une page d'accueil.
const racineHtml = resolve(RACINE, "site", "index.html");
if (existsSync(racineHtml)) {
  rmSync(racineHtml);
  console.log("✓ site/index.html retiré — la racine appartient à l'app de promenades");
}

console.log(`\n${aEcrire.length} page(s) écrite(s), aucune mention du GEO.`);
