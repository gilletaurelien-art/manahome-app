#!/usr/bin/env node
// Mesure les pays de la moisson d'hébergements, et écrit le résultat en JSON.
//
//     node scripts/mesurer-pays.mjs            # TOUS les pays au-dessus du seuil
//     node scripts/mesurer-pays.mjs US IT      # ceux-là seulement
//
// ⭐ POURQUOI UNE RECETTE ET PAS DES NOMBRES ÉCRITS À LA MAIN. La moisson bouge :
//    1 109 098 hébergements sur 213 pays au 13/11/2026, moissonnés les 9-11
//    novembre. Un chiffre recopié dans une page serait juste le jour de sa pose
//    et faux la semaine suivante, sans que rien ne le signale. Ce script se
//    relance ; la page porte la DATE de sa mesure, et le JSON la transporte.
//
// 🔴 LA DÉCOUVERTE QUI COMMANDE TOUT CE FICHIER : hors de France, un NOM DE
//    COMMUNE N'EST PAS UN IDENTIFIANT. Mesuré sur les États-Unis le 13/11/2026 :
//    « Jefferson County » s'étend de -124,6° à -75,8° de longitude — une
//    vingtaine de comtés distincts, d'un océan à l'autre, empilés sous un seul
//    nom. « Houston » mélange le Texas et un homonyme de l'Est.
//    ⭐ La parade ne se devine pas, elle se MESURE : un nom n'est retenu comme
//    étiquette que si TOUS ses points tiennent dans une boîte de moins d'un
//    demi-degré. Aux États-Unis, 6 768 noms passent (79 % des noms) mais ne
//    portent que 41 % des hébergements. La page le DIT au lieu de l'additionner.
//
// ⭐ QUATRE REQUÊTES POUR TOUS LES PAYS, PAS QUATRE PAR PAYS. La première
//    version interrogeait un pays à la fois : 213 pays auraient fait plus de
//    800 allers-retours SSH. Le travail est le même, le temps ne l'est pas.
//
// ⚠️ LE SEUIL EST UN CHOIX, ET IL EST ÉCRIT ICI POUR POUVOIR ÊTRE DISCUTÉ.
//    213 pays ont au moins un hébergement, mais 39 en ont moins de cinquante :
//    leur page porterait plus de mises en garde que de contenu. La doctrine de
//    la maison est « SEO = qualité plutôt que quantité ». Un pays sous le seuil
//    n'est pas perdu — il est compté dans les totaux, et il remonte dès que la
//    moisson le fournit.
//
// ⚠️ Les noms de pays viennent d'`Intl.DisplayNames`, livré avec Node : pas de
//    table recopiée, donc pas de table à vieillir. ⛔ Un code inconnu de la
//    plateforme rend le code lui-même ; on refuse alors d'écrire la page plutôt
//    que de publier « XZ » comme nom de pays.

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const SORTIE = resolve(ICI, "..", "src", "donnees-pays.json");
// ⛔ AUCUNE VALEUR PAR DÉFAUT : ce dépôt est public, et une adresse de
//    serveur avec son compte distant n'a rien à y faire. Voir
//    scripts/cible.local.exemple.sh — le `??` qui vivait ici la publiait.
const HOTE = process.env.MANA_HOTE_DEPLOIEMENT ?? process.env.MANA_HOTE;
if (!HOTE) {
  console.error("🔴 MANA_HOTE_DEPLOIEMENT (ou MANA_HOTE) est absente.");
  console.error("   Voir scripts/cible.local.exemple.sh ; ce script lit la base par SSH.");
  process.exit(1);
}

/** Un demi-degré ≈ 55 km : au-delà, deux points sous le même nom ne sont pas le
 *  même endroit. Cité sur la page — le lecteur doit savoir ce qui a été écarté. */
const SEUIL_DEGRES = 0.5;
/** En deçà, pas de page : voir l'avertissement en tête de fichier. */
const SEUIL_PAGE = Number(process.env.SEUIL_PAGE ?? 50);
const MAX_LIEUX = 20;

const demandes = process.argv.slice(2).map((c) => c.toUpperCase());

function demander(sql) {
  const payload = `\\pset format unaligned\n\\pset tuples_only on\n\\pset fieldsep '\\t'\n${sql}\n`;
  const out = execFileSync(
    "ssh",
    ["-o", "ConnectTimeout=25", HOTE,
     "sudo docker exec -i pg-repetition psql -U postgres -d postgres"],
    { input: payload, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return out.split("\n").map((l) => l.trimEnd())
    .filter((l) => l.trim() && !/^(Output format|Tuples only|Field separator)/.test(l))
    .map((l) => l.split("\t"));
}

const filtre = demandes.length
  ? `AND pays IN (${demandes.map((c) => `'${c.replace(/'/g, "''")}'`).join(",")})`
  : "";
const BASE = `FROM public.hebergements_moisson WHERE pays IS NOT NULL ${filtre}`;

console.log("→ totaux par pays …");
const totaux = demander(`
SELECT pays, count(*), count(*) FILTER (WHERE NOT prive), count(*) FILTER (WHERE prive),
       count(*) FILTER (WHERE NOT prive AND geom IS NOT NULL),
       count(DISTINCT commune) FILTER (WHERE NOT prive),
       min(cree_le)::date, max(vu_le)::date
${BASE} GROUP BY 1 ORDER BY 1;`);

console.log("→ typologies …");
const typos = demander(`
SELECT pays, typologie, count(*) ${BASE} AND NOT prive AND typologie IS NOT NULL
GROUP BY 1,2 ORDER BY 1, count(*) DESC;`);

console.log("→ sources …");
const srcs = demander(`
SELECT pays, source_cle, count(*) ${BASE} AND NOT prive
GROUP BY 1,2 ORDER BY 1, count(*) DESC;`);

// ⭐ L'étendue de CHAQUE nom, dans tous les pays d'un coup.
const ETENDUE = `
WITH e AS (
  SELECT pays, commune, count(*) AS n,
         ST_XMax(ST_Extent(geom))-ST_XMin(ST_Extent(geom)) AS dlon,
         ST_YMax(ST_Extent(geom))-ST_YMin(ST_Extent(geom)) AS dlat
  ${BASE} AND NOT prive AND commune IS NOT NULL AND geom IS NOT NULL
  GROUP BY 1,2),
 s AS (SELECT *, (dlon < ${SEUIL_DEGRES} AND dlat < ${SEUIL_DEGRES}) AS sur FROM e)`;

console.log("→ noms sûrs et ambigus …");
const bilans = demander(`${ETENDUE}
SELECT pays, count(*) FILTER (WHERE sur), count(*) FILTER (WHERE NOT sur),
       coalesce(sum(n) FILTER (WHERE sur),0), coalesce(sum(n) FILTER (WHERE NOT sur),0)
FROM s GROUP BY 1 ORDER BY 1;`);

// ⭐ LE PIRE NOM AMBIGU DE CHAQUE PAYS, parce qu'une page doit porter SA preuve.
//    La première version citait « Jefferson County » sur toutes les pages — un
//    exemple américain qui aurait été faux sur 172 d'entre elles. Un exemple
//    recopié d'un pays à l'autre est un faux témoin à l'échelle d'un site.
console.log("→ le pire nom ambigu de chaque pays …");
const pires = new Map(demander(`${ETENDUE}, r AS (
  SELECT pays, commune, n, dlon, dlat,
         row_number() OVER (PARTITION BY pays ORDER BY greatest(dlon,dlat) DESC) AS rg
  FROM s WHERE NOT sur)
SELECT pays, commune, n, round(greatest(dlon,dlat)::numeric,1) FROM r WHERE rg = 1;`)
  .map((l) => [l[0], { nom: l[1], n: +l[2], degres: Number(l[3]) }]));

console.log("→ lieux nommables …");
const lieux = demander(`${ETENDUE}, r AS (
  SELECT pays, commune, n, row_number() OVER (PARTITION BY pays ORDER BY n DESC, commune) AS rg
  FROM s WHERE sur)
SELECT pays, commune, n FROM r WHERE rg <= ${MAX_LIEUX} ORDER BY pays, rg;`);

// ── assemblage ───────────────────────────────────────────────────────────────
const nomFr = new Intl.DisplayNames(["fr"], { type: "region" });
const nomEn = new Intl.DisplayNames(["en"], { type: "region" });

/** ⚠️ Le slug se dérive du nom FRANÇAIS et doit rester stable : une URL publiée
 *  est un engagement. D'où la normalisation Unicode plutôt qu'une table. */
const slugifier = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const grouper = (lignes) => {
  const m = new Map();
  for (const l of lignes) {
    if (!m.has(l[0])) m.set(l[0], []);
    m.get(l[0]).push(l.slice(1));
  }
  return m;
};
const mTypos = grouper(typos), mSrcs = grouper(srcs), mLieux = grouper(lieux);
const mBilans = new Map(bilans.map((b) => [b[0], b.slice(1)]));

const pays = [];
const ecartes = [];
const slugs = new Map();

for (const t of totaux) {
  const [code, moissonnes, publiables, prives, geoloc, noms, depuis, jusqu] = t;
  if (Number(publiables) < SEUIL_PAGE) { ecartes.push([code, Number(publiables)]); continue; }

  const fr = nomFr.of(code), en = nomEn.of(code);
  // ⛔ `Intl` rend le CODE quand il ne connaît pas la région. Publier « XZ »
  //    comme nom de pays serait pire qu'une page absente.
  if (fr === code || en === code) {
    console.error(`🔴 ${code} : nom de pays inconnu d'Intl — pays écarté, pas inventé.`);
    continue;
  }
  const slug = slugifier(fr);
  if (slugs.has(slug)) {
    console.error(`🔴 collision de slug « ${slug} » : ${slugs.get(slug)} et ${code}.`);
    process.exit(1);
  }
  slugs.set(slug, code);

  const b = mBilans.get(code) ?? ["0", "0", "0", "0"];
  const p = {
    code, slug, nom: { fr, en },
    moissonnes: +moissonnes, publiables: +publiables, prives: +prives,
    geolocalises: +geoloc, noms_distincts: +noms,
    moisson: { depuis, jusqu_a: jusqu }, seuil_degres: SEUIL_DEGRES,
    noms_surs: +b[0], noms_ambigus: +b[1], sous_nom_sur: +b[2], sous_nom_ambigu: +b[3],
    sources: (mSrcs.get(code) ?? []).map(([cle, n]) => ({ cle, n: +n })),
    typologies: (mTypos.get(code) ?? []).map(([cle, n]) => ({ cle, n: +n })),
    lieux: (mLieux.get(code) ?? []).map(([nom, n]) => ({ nom, n: +n })),
    pire_nom: pires.get(code) ?? null,
  };

  // ⚠️ Un garde par pays, parce qu'un total faux sur UN pays se noie dans 174.
  if (p.sous_nom_sur + p.sous_nom_ambigu !== p.geolocalises) {
    console.error(`🔴 ${code} : noms sûrs (${p.sous_nom_sur}) + ambigus (${p.sous_nom_ambigu}) `
      + `≠ géolocalisés (${p.geolocalises}). Une ligne échappe au classement.`);
    process.exit(1);
  }
  pays.push(p);
}

if (!pays.length) { console.error("🔴 aucun pays au-dessus du seuil — rien n'est écrit."); process.exit(1); }

pays.sort((a, b) => b.publiables - a.publiables);
mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, JSON.stringify(
  { mesure_le: new Date().toISOString().slice(0, 10), seuil_page: SEUIL_PAGE, pays },
  null, 2) + "\n", "utf8");

const somme = pays.reduce((s, p) => s + p.publiables, 0);
console.log(`\n✓ ${pays.length} pays retenus · ${somme.toLocaleString("fr-FR")} hébergements publiables`);
console.log(`  ${ecartes.length} pays sous le seuil de ${SEUIL_PAGE} `
  + `(${ecartes.reduce((s, [, n]) => s + n, 0)} hébergements, comptés nulle part sur le site)`);
console.log(`  → ${SORTIE}`);
