import { describe, it, expect } from "vitest";
import * as sondeMint from "./sondeMint.mjs";
import { frapperDon, validerGeste, dotationDuJour, horizonAgregats, secondesDepuis } from "./sondeMint.mjs";

describe("I1 — toute mécanique qui déplace des unités entre deux personnes", () => {
  it("n'existe aucune fonction exportée nommée transferer/transferMana", () => {
    const noms = Object.keys(sondeMint).map((n) => n.toLowerCase());
    expect(noms.some((n) => n.includes("transf"))).toBe(false);
  });

  it("frapperDon produit deux FACES à créer (don + reception), jamais un débit", () => {
    const { faceDon, faceReception, empreinteFait } = frapperDon({
      aDonne: "u1", aRecu: "u2", dureeS: 3600, jour: "2026-11-14",
      declarePar: "u1",
    });
    expect(faceDon.face).toBe("don");
    expect(faceReception.face).toBe("reception");
    expect(faceDon.empreinteFait).toBe(empreinteFait);
    expect(faceReception.empreinteFait).toBe(empreinteFait);
    // aucune des deux faces ne porte de solde, de débit ou de delta —
    // seulement des champs INSERT
    for (const face of [faceDon, faceReception]) {
      expect(face).not.toHaveProperty("solde");
      expect(face).not.toHaveProperty("delta");
    }
  });
});

describe("I3 — toute mécanique qui lit la dotation pour décider", () => {
  it("dotationDuJour ne prend aucun argument de base/compte : c'est une constante pure", () => {
    expect(dotationDuJour.length).toBe(0);
    expect(dotationDuJour()).toBe(86_400);
  });

  it("horizonAgregats et secondesDepuis sont de purs calculs, pas des requêtes", () => {
    expect(horizonAgregats(100)).toBe(8_640_000);
    expect(secondesDepuis(new Date(Date.now() - 120_000).toISOString())).toBeGreaterThanOrEqual(119);
  });
});

describe("I6 — le motif obligatoire", () => {
  it("une consignation SANS dimension ni mot libre réussit", () => {
    const r = validerGeste({ dureeS: 60 });
    expect(r.ok).toBe(true);
    expect(r.valeurs.dimension).toBeNull();
    expect(r.valeurs.motLibre).toBeNull();
  });

  it("refuse une dimension inconnue (le CHECK SQL est un filet, pas le seul garde)", () => {
    const r = validerGeste({ dureeS: 60, dimension: "mérite" });
    expect(r.ok).toBe(false);
  });

  it("refuse une durée qui n'est pas un multiple de la minute (pas de fausse précision)", () => {
    const r = validerGeste({ dureeS: 90 });
    expect(r.ok).toBe(false);
  });
});

describe("I9 — toute conversion monétaire", () => {
  it("n'existe aucune fonction exportée qui convertit en euros/argent", () => {
    const noms = Object.keys(sondeMint).map((n) => n.toLowerCase());
    expect(noms.some((n) => n.includes("euro") || n.includes("argent") || n.includes("prix"))).toBe(false);
  });
});
