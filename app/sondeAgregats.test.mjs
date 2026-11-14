import { describe, it, expect } from "vitest";
import { filtrerAgregats } from "./sondeAgregats.mjs";

describe("I7 — publication d'agrégats n<5", () => {
  it("une cellule de 3 événements ne sort pas", () => {
    const cellules = [
      { code_insee: "29041", jour: "2026-11-14", dimension: null, evenements: 3 },
    ];
    expect(filtrerAgregats(cellules)).toEqual([]);
  });

  it("une cellule de 5 événements sort — le seuil est inclusif", () => {
    const cellules = [
      { code_insee: "29041", jour: "2026-11-14", dimension: null, evenements: 5 },
    ];
    expect(filtrerAgregats(cellules)).toHaveLength(1);
  });

  it("filtre mixte : seules les cellules ≥5 survivent, les autres disparaissent sans trace partielle", () => {
    const cellules = [
      { code_insee: "29041", evenements: 2 },
      { code_insee: "29075", evenements: 12 },
      { code_insee: "29155", evenements: 4 },
    ];
    expect(filtrerAgregats(cellules).map((c) => c.code_insee)).toEqual(["29075"]);
  });
});

describe("I5 — toute comparaison/classement des personnes", () => {
  it("les cellules filtrées ne portent aucun champ nominatif, et la fonction ne trie personne", () => {
    const cellules = [{ code_insee: "29041", evenements: 9 }];
    const resultat = filtrerAgregats(cellules);
    expect(resultat[0]).not.toHaveProperty("nom");
    expect(resultat[0]).not.toHaveProperty("personne");
    expect(resultat[0]).not.toHaveProperty("membre");
    // ordre d'entrée préservé : aucun tri par volume n'est appliqué ici
    expect(resultat).toEqual(cellules);
  });
});
