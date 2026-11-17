import { describe, it, expect } from "vitest";
import { empreinteFait } from "./sondeEmpreinte.mjs";

describe("empreinteFait", () => {
  it("produit la même empreinte pour le même fait, peu importe qui décrit", () => {
    const fait = { aDonne: "u1", aRecu: "u2", dureeS: 3600, jour: "2026-11-14" };
    expect(empreinteFait(fait)).toBe(empreinteFait({ ...fait }));
  });

  it("distingue deux faits différents", () => {
    const a = empreinteFait({ aDonne: "u1", aRecu: "u2", dureeS: 3600, jour: "2026-11-14" });
    const b = empreinteFait({ aDonne: "u1", aRecu: "u2", dureeS: 1800, jour: "2026-11-14" });
    expect(a).not.toBe(b);
  });

  it("traite aRecu absent comme « le commun », de façon stable", () => {
    const sansRecu = empreinteFait({ aDonne: "u1", aRecu: null, dureeS: 60, jour: "2026-11-14" });
    const sansRecuEncore = empreinteFait({ aDonne: "u1", aRecu: undefined, dureeS: 60, jour: "2026-11-14" });
    expect(sansRecu).toBe(sansRecuEncore);
  });
});
