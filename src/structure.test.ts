import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { OFFRES_GEO } from "./offres";

/* ⚠️ LES COMMENTAIRES SONT RETIRÉS AVANT TOUTE LECTURE DE RÈGLE. Le bloc qui
   explique le retrait de `makesOffer` CITE le mot pour dire pourquoi on ne
   l'emploie plus : un garde posé sur le texte brut s'accuserait lui-même, et
   un `grep` validerait une consigne fausse. */
const config = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

/* ⚠️ Et le commentaire HTML aussi : celui qui explique le retrait des prix de
   l'en-tête vit DANS le fichier gardé. Sans ce nettoyage, le garde lirait sa
   propre justification et accuserait la réparation. */
const entete = readFileSync(new URL("../index.html", import.meta.url), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "");

/* ⭐ LA TROISIÈME RÉDACTION : les titres de /fr/ et /en/ ne viennent pas de la
   coquille mais de deux constantes — et l'anglaise échappait aux deux premiers
   nettoyages. Le garde lit donc les TROIS fichiers. */
const titres = readFileSync(new URL("./canonique.ts", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("les données structurées ne déclarent aucun prix", () => {
  /* 🔴 POURQUOI CE GARDE EXISTE — 13/11/2026. Le JSON-LD de l'accueil
     déclarait huit offres tarifées au nom d'Alliance MANA, dans la couche que
     lisent les moteurs et les assistants. L'association dépose un rescrit
     mécénat, qui se juge sur l'activité réelle et DÉCLARÉE : une offre
     commerciale publiée à son nom est une pièce contre son propre dossier.
     ⭐ Et ce défaut-là avait déjà prouvé qu'il savait survivre : « TEMPOsystem »
        est resté dans cette même couche VINGT-QUATRE HEURES après avoir été
        retiré du texte visible, parce que corriger un texte ne corrige pas ce
        que les machines lisent. Un commentaire ne l'aurait pas tenu. */

  it("ne pose pas de bloc makesOffer", () => {
    expect(config, "makesOffer est revenu dans le JSON-LD")
      .not.toMatch(/makesOffer/);
  });

  it("ne lit plus le catalogue des offres", () => {
    expect(config, "vite.config.ts lit de nouveau OFFRES_GEO")
      .not.toMatch(/OFFRES_GEO/);
    expect(config, "un import du catalogue est revenu")
      .not.toMatch(/from\s+"\.\/src\/offres"/);
  });

  it("ne recopie aucun montant du catalogue", () => {
    /* ⛔ Le garde ne cherche pas le mot « price » mais les VALEURS : un
       balisage réécrit à la main, sous un autre nom de champ, déclarerait les
       mêmes prix sans jamais employer le mot. */
    const montants = [...new Set(OFFRES_GEO.map((o) => o.montant))];
    expect(montants.length, "catalogue vide : le garde a raté sa cible")
      .toBeGreaterThan(2);
    for (const m of montants) {
      expect(config, `le montant ${m} est écrit dans la couche machine`)
        .not.toMatch(new RegExp(`['"\`]${m}['"\`]|\\b${m}\\b\\s*,?\\s*priceCurrency`));
    }
  });

  it("ne laisse aucun montant dans l'en-tête de la coquille", () => {
    /* 🔴 POSÉ APRÈS COUP, ET C'EST LA LEÇON. Le 13/11 à 15 h 45 les prix ont
       été retirés du JSON-LD ; une heure plus tard « Audits dès <prix> € »
       était toujours dans le <title>, la description et les deux balises
       og: — QUATRE fois, dans le fichier d'à côté.
       ⭐ Il y a plusieurs RÉDACTIONS du même site, et corriger l'une ne corrige
          pas les autres. Le garde couvre donc les deux fichiers, pas un. */
    const montants = [...new Set(OFFRES_GEO.map((o) => o.montant))];
    for (const m of montants) {
      expect(entete, `le montant ${m} est revenu dans l'en-tête`)
        .not.toMatch(new RegExp(`\\b${m}\\b`));
    }
    expect(entete, "l'en-tête n'a plus de titre : la mesure a raté sa cible")
      .toMatch(/<title>/);
  });

  it("ne laisse aucun montant dans les titres par langue", () => {
    const montants = [...new Set(OFFRES_GEO.map((o) => o.montant))];
    for (const m of montants) {
      expect(titres, `le montant ${m} est revenu dans un titre de langue`)
        .not.toMatch(new RegExp(`\\b${m}\\b`));
    }
    /* ⛔ Et les deux langues existent toujours : un garde qui verdit parce que
       la constante anglaise a disparu ne garde plus rien. */
    expect(titres).toMatch(/TITRE_GENERIQUE\s*=/);
    expect(titres).toMatch(/TITRE_GENERIQUE_EN\s*=/);
  });

  it("garde l'organisation et son rattachement — ce n'est pas eux qu'on retire", () => {
    /* ⭐ Le retrait porte sur les PRIX, pas sur l'identité. Si un jour c'est
       l'identité qu'on veut changer, ce sera une autre décision, et elle devra
       être prise — pas obtenue par effet de bord d'un nettoyage de prix. */
    expect(config).toMatch(/"@type":\s*"Organization"/);
    expect(config).toMatch(/parentOrganization/);
  });
});
