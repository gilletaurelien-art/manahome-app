import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  nuitIso,
  estNuitValide,
  lireIndispos,
  basculerNuit,
  nuiteesDe,
  nuiteesDepuisIcs,
  bloquerPlage,
  libererMois,
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

describe("l'import iCal : occupé devient bloqué, jamais réservé", () => {
  beforeEach(() => stock.clear());

  const ics = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Airbnb//EN",
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20261218",
    "DTEND;VALUE=DATE:20261222",
    "SUMMARY:Reserved",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "DTSTART:20261228T170000Z",
    "DTEND:20261230T100000Z",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  it("les évènements deviennent des nuitées bloquées, bord de départ exclu", () => {
    const { nuits, ignores } = nuiteesDepuisIcs(ics);
    expect(ignores).toBe(0);
    expect(nuits).toEqual(["2026-12-18", "2026-12-19", "2026-12-20", "2026-12-21",
                           "2026-12-28", "2026-12-29"]);
  });

  it("un évènement sans DTEND bloque sa nuitée unique", () => {
    const uneNuit = "BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270102\r\nEND:VEVENT";
    expect(nuiteesDepuisIcs(uneNuit).nuits).toEqual(["2027-01-02"]);
  });

  it("un évènement illisible est compté ignoré — jamais silencieux", () => {
    const buggue = "BEGIN:VEVENT\r\nSUMMARY:pas de dates\r\nEND:VEVENT\r\n" + ics;
    const { nuits, ignores } = nuiteesDepuisIcs(buggue);
    expect(ignores).toBe(1);
    expect(nuits.length).toBe(6);
  });

  it("sans aucun VEVENT, rien ne se passe", () => {
    expect(nuiteesDepuisIcs("BEGIN:VCALENDAR\r\nEND:VCALENDAR")).toEqual({ nuits: [], ignores: 0 });
  });

  it("bloquerPlage additionne sans dupliquer, libererMois ne touche qu'au mois affiché", () => {
    bloquerPlage("a1", nuiteesDe("2026-12-18", "2026-12-22"));
    bloquerPlage("a1", nuiteesDe("2026-12-20", "2026-12-24"));
    expect(lireIndispos("a1")).toEqual(nuiteesDe("2026-12-18", "2026-12-24"));
    bloquerPlage("a1", ["2027-01-05"]);
    const restantes = libererMois("a1", "2026-12");
    expect(restantes).toEqual(["2027-01-05"]);
    expect(lireIndispos("a1")).toEqual(["2027-01-05"]);
  });
});
