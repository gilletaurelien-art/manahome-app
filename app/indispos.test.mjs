import { describe, it, expect } from "vitest";
import { estNuitValide, trierNuits, delta } from "./indispos.mjs";

describe("une nuitée est une DATE réelle — la même règle que le front", () => {
  it("ISO valide et date réelle passent, le reste non", () => {
    expect(estNuitValide("2026-11-04")).toBe(true);
    expect(estNuitValide("2026-02-30")).toBe(false);
    expect(estNuitValide("2026-11-4")).toBe(false);
    expect(estNuitValide(20261104)).toBe(false);
    expect(estNuitValide("04/11/2026")).toBe(false);
  });
});

describe("le tri ne ment jamais : les invalides sont comptés, pas gobés", () => {
  it("valide + invalide = l'un enregistré, l'autre signalé", () => {
    const { valides, invalides } = trierNuits(["2026-11-04", "nimporte"]);
    expect(valides).toEqual(["2026-11-04"]);
    expect(invalides).toEqual(["nimporte"]);
  });

  it("les doublons sont dédupliqués, la liste est triée", () => {
    const { valides } = trierNuits(["2026-11-06", "2026-11-04", "2026-11-04"]);
    expect(valides).toEqual(["2026-11-04", "2026-11-06"]);
  });

  it("pas de liste = rien de valide, rien d'invalide", () => {
    expect(trierNuits(null)).toEqual({ valides: [], invalides: [] });
  });
});

describe("le delta remplace l'ensemble : poser, retirer, jamais de fantôme", () => {
  it("ajout et retrait dans un seul delta", () => {
    expect(delta(["2026-11-04", "2026-11-05"], ["2026-11-05", "2026-11-06"]))
      .toEqual({ aPoser: ["2026-11-06"], aRetirer: ["2026-11-04"] });
  });

  it("ensemble identique = delta vide", () => {
    expect(delta(["2026-11-04"], ["2026-11-04"]))
      .toEqual({ aPoser: [], aRetirer: [] });
  });

  it("vider tout = tout retirer", () => {
    expect(delta(["2026-11-04", "2026-11-05"], []))
      .toEqual({ aPoser: [], aRetirer: ["2026-11-04", "2026-11-05"] });
  });
});
