import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  nuitIso,
  estNuitValide,
  lireIndispos,
  basculerNuit,
  nuiteesDe,
} from "./calendrierDonnees";

// localStorage n'existe pas sous Node : un doublon minimal, fidèle au
// contrat ( getItem/setItem ), pour tester la logique — pas le navigateur.
const stock = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => stock.get(k) ?? null,
  setItem: (k: string, v: string) => stock.set(k, v),
  removeItem: (k: string) => stock.delete(k),
};
vi.stubGlobal("localStorage", localStorageMock);


describe("une nuitée est une DATE, jamais un timestamp", () => {
  it("nuitIso formate en YYYY-MM-DD, sans effet de fuseau", () => {
    expect(nuitIso(new Date(2026, 10, 4))).toBe("2026-11-04");
    expect(nuitIso(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("estNuitValide refuse les dates inexistantes et les formats lâches", () => {
    expect(estNuitValide("2026-11-04")).toBe(true);
    expect(estNuitValide("2026-02-30")).toBe(false);
    expect(estNuitValide("2026-11-4")).toBe(false);
    expect(estNuitValide("04/11/2026")).toBe(false);
  });
});

describe("on ne stocke que les blocages", () => {
  beforeEach(() => stock.clear());

  it("une nuit non listée est disponible — jamais l'inverse", () => {
    expect(lireIndispos("a1")).toEqual([]);
  });

  it("basculer bloque puis libère, sans doublon, trié", () => {
    expect(basculerNuit("a1", "2026-11-04")).toEqual(["2026-11-04"]);
    expect(basculerNuit("a1", "2026-11-02")).toEqual(["2026-11-02", "2026-11-04"]);
    expect(basculerNuit("a1", "2026-11-04")).toEqual(["2026-11-02"]);
    expect(basculerNuit("a1", "2026-11-02")).toEqual([]);
    // tout est libéré : plus rien n'est stocké pour cette annonce
    expect(lireIndispos("a1")).toEqual([]);
  });

  it("une nuitée invalide ne s'écrit jamais", () => {
    expect(basculerNuit("a1", "n'importe quoi")).toEqual([]);
    expect(lireIndispos("a1")).toEqual([]);
  });

  it("deux annonces ne partagent pas leurs blocages", () => {
    basculerNuit("a1", "2026-11-04");
    basculerNuit("a2", "2026-12-24");
    expect(lireIndispos("a1")).toEqual(["2026-11-04"]);
    expect(lireIndispos("a2")).toEqual(["2026-12-24"]);
  });

  it("un JSON corrompu repart de zéro au lieu de briser la page", () => {
    stock.set("manahome-indispos-demo", "{pas du json");
    expect(lireIndispos("a1")).toEqual([]);
  });
});

describe("la plage de nuitées exclut le départ", () => {
  it("trois nuits du 4 au 7 : 4, 5, 6 — jamais le 7", () => {
    expect(nuiteesDe("2026-11-04", "2026-11-07")).toEqual([
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
    ]);
  });

  it("bornes invalides : aucune nuitée", () => {
    expect(nuiteesDe("x", "2026-11-07")).toEqual([]);
    expect(nuiteesDe("2026-11-04", "2026-11-04")).toEqual([]);
  });
});
