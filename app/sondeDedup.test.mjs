import { describe, it, expect } from "vitest";
import * as sondeDedup from "./sondeDedup.mjs";
import { invariantParEmpreinte, invariantTient, evenementsDistincts } from "./sondeDedup.mjs";

describe("I1 (audit) — l'invariant public Σ émis = Σ reçu", () => {
  it("tient pour une frappe double normale", () => {
    const lignes = [
      { empreinteFait: "e1", face: "don", dureeS: 3600 },
      { empreinteFait: "e1", face: "reception", dureeS: 3600 },
    ];
    expect(invariantTient(lignes)).toBe(true);
    expect(invariantParEmpreinte(lignes).get("e1")).toEqual({ emisS: 3600, recuS: 3600 });
  });

  it("casse si une face manque — ce que le registre véridique appelle « seulement déclaré »", () => {
    const lignes = [{ empreinteFait: "e2", face: "don", dureeS: 600 }];
    expect(invariantTient(lignes)).toBe(false);
  });
});

describe("Règle arithmétique v0.3 — l'agrégat compte l'événement, pas la frappe", () => {
  it("1 h donnée (deux faces, une empreinte) compte pour UN événement, pas deux", () => {
    const lignes = [
      { empreinteFait: "e1", face: "don", dureeS: 3600 },
      { empreinteFait: "e1", face: "reception", dureeS: 3600 },
    ];
    expect(evenementsDistincts(lignes)).toBe(1);
  });

  it("deux gestes distincts comptent pour deux événements", () => {
    const lignes = [
      { empreinteFait: "e1", face: "don", dureeS: 3600 },
      { empreinteFait: "e1", face: "reception", dureeS: 3600 },
      { empreinteFait: "e2", face: "don", dureeS: 1800 },
      { empreinteFait: "e2", face: "reception", dureeS: 1800 },
    ];
    expect(evenementsDistincts(lignes)).toBe(2);
  });
});

describe("I2 — toute mécanique qui compte les merci", () => {
  it("aucune fonction exportée par ce module ne porte « merci » dans son nom", () => {
    const noms = Object.keys(sondeDedup).map((n) => n.toLowerCase());
    expect(noms.some((n) => n.includes("merci"))).toBe(false);
  });
});
