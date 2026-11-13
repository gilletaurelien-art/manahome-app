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

  it("garde l'organisation et son rattachement — ce n'est pas eux qu'on retire", () => {
    /* ⭐ Le retrait porte sur les PRIX, pas sur l'identité. Si un jour c'est
       l'identité qu'on veut changer, ce sera une autre décision, et elle devra
       être prise — pas obtenue par effet de bord d'un nettoyage de prix. */
    expect(config).toMatch(/"@type":\s*"Organization"/);
    expect(config).toMatch(/parentOrganization/);
  });
});
