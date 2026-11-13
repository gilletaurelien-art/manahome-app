#!/usr/bin/env node
// Mesure un pays dans la moisson d'hébergements, et écrit le résultat en JSON.
//
//     node scripts/mesurer-pays.mjs US etats-unis "États-Unis" "United States"
//
// ⭐ POURQUOI UNE RECETTE ET PAS DES NOMBRES ÉCRITS À LA MAIN. La moisson bouge :
//    1 109 098 hébergements au 13/11/2026, moissonnés les 9-11 novembre. Un
//    chiffre recopié dans une page serait juste le jour de sa pose et faux la
//    semaine suivante, sans que rien ne le signale. Ce script se relance ; la
//    page porte la DATE de sa mesure, et le JSON la transporte.
//
// 🔴 LA DÉCOUVERTE QUI COMMANDE TOUT CE FICHIER : hors de France, un NOM DE
//    COMMUNE N'EST PAS UN IDENTIFIANT. Mesuré sur les États-Unis le 13/11/2026 :
//    « Jefferson County » s'étend de -124,6° à -75,8° de longitude — une
//    vingtaine de comtés distincts, d'un océan à l'autre, empilés sous un seul
//    nom. « Houston » mélange le Texas et un homonyme de l'Est.
//    ⭐ La parade ne se devine pas, elle se MESURE : un nom n'est retenu comme
//    étiquette que si TOUS ses points tiennent dans une boîte de moins d'un
//    demi-degré. 6 768 noms américains passent (79 % des noms), mais ils ne
//    portent que 37 050 hébergements sur 90 867 — 41 %. La majorité vit sous un
//    nom ambigu, et la page doit le DIRE au lieu de l'additionner.
//
// ⚠️ ET MÊME PARMI LES NOMS SÛRS, UN LIEU PEUT APPARAÎTRE DEUX FOIS : « New
//    York » (335) et « New York County » (135) sont le même endroit sous deux
//    résolutions administratives d'OSM, comme « Fort Worth » et « Tarrant
//    County ». Ce n'est pas corrigé ici — ce serait inventer une hiérarchie que
//    la donnée ne porte pas. C'est écrit sur la page.
//
// ⚠️ La base n'est pas joignable depuis ce poste autrement que par le KS-5 :
//    le script passe donc par `ssh` + `psql` dans le conteneur. C'est la même
//    voie que tout le reste de l'écosystème, pas un contournement.

import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const SORTIE = resolve(ICI, "..", "src", "donnees-pays.json");
const HOTE = process.env.MANA_HOTE_DEPLOIEMENT ?? "debian@147.135.254.25";

// ⭐ Le seuil qui fait la différence entre une étiquette et une addition fausse.
//    Un demi-degré ≈ 55 km : au-delà, deux points sous le même nom ne sont pas
//    le même endroit. Écrit ici, cité sur la page : le lecteur doit pouvoir
//    savoir ce qui a été écarté et pourquoi.
const SEUIL_DEGRES = 0.5;
const MAX_LIEUX = 20;

const [code, slug, nomFr, nomEn] = process.argv.slice(2);
if (!code || !slug || !nomFr || !nomEn) {
  console.error("usage : node scripts/mesurer-pays.mjs <ISO2> <slug> <nom fr> <nom en>");
  process.exit(2);
}

/** Une requête, une sortie tabulée. On ne mélange JAMAIS plusieurs requêtes dans
 *  un même appel : le mode d'affichage de psql a corrompu un ORDER BY le
 *  13/11/2026 — le classement rendu était alphabétique sur du texte, et la
 *  première ville avait disparu du haut du tableau sans que rien ne le dise. */
function demander(sql) {
  const payload = `\\pset format unaligned\n\\pset tuples_only on\n\\pset fieldsep '\\t'\n${sql}\n`;
  const out = execFileSync(
    "ssh",
    ["-o", "ConnectTimeout=25", HOTE, "sudo docker exec -i pg-repetition psql -U postgres -d postgres"],
    { input: payload, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("Output format") && !l.startsWith("Tuples only")
      && !l.startsWith("Field separator"))
    .map((l) => l.split("\t"));
}

const P = `pays='${code.replace(/'/g, "''")}'`;

const [t] = demander(`
SELECT count(*), count(*) FILTER (WHERE NOT prive), count(*) FILTER (WHERE prive),
       count(*) FILTER (WHERE NOT prive AND geom IS NOT NULL),
       count(DISTINCT commune) FILTER (WHERE NOT prive),
       min(cree_le)::date, max(vu_le)::date
FROM public.hebergements_moisson WHERE ${P};`);

const sources = demander(
  `SELECT source_cle, count(*) FROM public.hebergements_moisson
    WHERE ${P} AND NOT prive GROUP BY 1 ORDER BY 2 DESC;`,
).map(([cle, n]) => ({ cle, n: Number(n) }));

const typologies = demander(
  `SELECT typologie, count(*) FROM public.hebergements_moisson
    WHERE ${P} AND NOT prive AND typologie IS NOT NULL
    GROUP BY 1 ORDER BY count(*) DESC;`,
).map(([cle, n]) => ({ cle, n: Number(n) }));

const ETENDUE = `
WITH e AS (
  SELECT commune, count(*) AS n,
         ST_XMax(ST_Extent(geom))-ST_XMin(ST_Extent(geom)) AS dlon,
         ST_YMax(ST_Extent(geom))-ST_YMin(ST_Extent(geom)) AS dlat
  FROM public.hebergements_moisson
  WHERE ${P} AND NOT prive AND commune IS NOT NULL AND geom IS NOT NULL
  GROUP BY 1)`;

const [bilan] = demander(`${ETENDUE}
SELECT count(*) FILTER (WHERE dlon < ${SEUIL_DEGRES} AND dlat < ${SEUIL_DEGRES}),
       count(*) FILTER (WHERE dlon >= ${SEUIL_DEGRES} OR dlat >= ${SEUIL_DEGRES}),
       coalesce(sum(n) FILTER (WHERE dlon < ${SEUIL_DEGRES} AND dlat < ${SEUIL_DEGRES}), 0),
       coalesce(sum(n) FILTER (WHERE dlon >= ${SEUIL_DEGRES} OR dlat >= ${SEUIL_DEGRES}), 0)
FROM e;`);

const lieux = demander(`${ETENDUE}
SELECT commune, n FROM e
 WHERE dlon < ${SEUIL_DEGRES} AND dlat < ${SEUIL_DEGRES}
 ORDER BY n DESC, commune LIMIT ${MAX_LIEUX};`).map(([nom, n]) => ({ nom, n: Number(n) }));

const pays = {
  code, slug, nom: { fr: nomFr, en: nomEn },
  moissonnes: Number(t[0]), publiables: Number(t[1]), prives: Number(t[2]),
  geolocalises: Number(t[3]), noms_distincts: Number(t[4]),
  moisson: { depuis: t[5], jusqu_a: t[6] },
  seuil_degres: SEUIL_DEGRES,
  noms_surs: Number(bilan[0]), noms_ambigus: Number(bilan[1]),
  sous_nom_sur: Number(bilan[2]), sous_nom_ambigu: Number(bilan[3]),
  sources, typologies, lieux,
};

// ⚠️ Un garde, parce qu'une mesure vide s'écrit aussi bien qu'une mesure pleine.
if (!pays.publiables) {
  console.error(`🔴 ${code} : zéro hébergement publiable — rien n'est écrit.`);
  process.exit(1);
}
if (pays.sous_nom_sur + pays.sous_nom_ambigu !== pays.geolocalises) {
  console.error(`🔴 ${code} : les noms sûrs (${pays.sous_nom_sur}) et ambigus `
    + `(${pays.sous_nom_ambigu}) ne totalisent pas les géolocalisés (${pays.geolocalises}). `
    + `Une ligne échappe au classement : ne pas publier un compte qu'on ne sait pas refaire.`);
  process.exit(1);
}

mkdirSync(dirname(SORTIE), { recursive: true });
const tout = existsSync(SORTIE) ? JSON.parse(readFileSync(SORTIE, "utf8")) : { pays: [] };
tout.mesure_le = new Date().toISOString().slice(0, 10);
tout.pays = [...tout.pays.filter((p) => p.code !== code), pays].sort((a, b) =>
  b.publiables - a.publiables);
writeFileSync(SORTIE, JSON.stringify(tout, null, 2) + "\n", "utf8");

console.log(`✓ ${nomFr} (${code}) — ${pays.publiables.toLocaleString("fr-FR")} publiables `
  + `sur ${pays.moissonnes.toLocaleString("fr-FR")} moissonnés`);
console.log(`  noms sûrs ${pays.noms_surs} (${pays.sous_nom_sur} hébergements) · `
  + `ambigus ${pays.noms_ambigus} (${pays.sous_nom_ambigu})`);
console.log(`  → ${SORTIE}`);
