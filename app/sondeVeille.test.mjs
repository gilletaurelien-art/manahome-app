import { describe, it, expect } from "vitest";
import { dureeVeilleS } from "./sondeVeille.mjs";

describe("dureeVeilleS", () => {
  it("arrondit à la minute EN DESSOUS — jamais une minute offerte", () => {
    const debut = "2026-11-14T10:00:00.000Z";
    const fin = "2026-11-14T10:29:59.000Z"; // 29 min 59 s
    expect(dureeVeilleS(debut, fin)).toBe(29 * 60);
  });

  it("une veille de moins d'une minute ne mint rien (0, jamais négatif)", () => {
    expect(dureeVeilleS("2026-11-14T10:00:00.000Z", "2026-11-14T10:00:30.000Z")).toBe(0);
  });

  it("une fermeture avant l'ouverture ne produit jamais une durée négative", () => {
    expect(dureeVeilleS("2026-11-14T10:00:00.000Z", "2026-11-14T09:00:00.000Z")).toBe(0);
  });
});
