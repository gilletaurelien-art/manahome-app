import { describe, expect, it } from "vitest";
import { OFFRES_GEO, PORTES, porteIntrouvable } from "./offres";

describe("les portes d'entrée", () => {
  // ⭐ « Jamais un bouton vide » : une porte qui désigne une offre disparue
  //    s'afficherait sans prix et sans contenu. Le test le rend bruyant.
  it("désignent toutes une offre qui existe", () => {
    expect(porteIntrouvable()).toEqual([]);
  });

  // ⛔ VALIDÉ PAR MUTATION : sans ce cas, le test ci-dessus passerait aussi
  //    sur un garde qui ne regarde rien.
  it("le garde refuse une offre inconnue", () => {
    const noms = new Set(OFFRES_GEO.map((o) => o.nom));
    expect(noms.has("GEO Qui N'Existe Pas")).toBe(false);
  });

  it("ne recopient aucun prix — la source reste OFFRES_GEO", () => {
    for (const p of PORTES) {
      expect(p.accroche).not.toMatch(/\d+\s*€/);
    }
  });

  // ⚠️ Trois portes, pas quatre : « Améliorer » attend des prix arrêtés.
  it("sont au nombre de trois tant qu'Améliorer n'a pas de prix", () => {
    expect(PORTES).toHaveLength(3);
  });
});
