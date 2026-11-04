import { describe, it, expect } from "vitest";
import { nuiteesDepuisIcs, nuiteesDe, urlValide, telechargerIcs, deltaImport } from "./ical.mjs";

const ICS = [
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

describe("le parseur miroir : occupé devient bloqué, bord exclu", () => {
  it("les évènements deviennent des nuitées, bord de départ exclu", () => {
    const { nuits, ignores } = nuiteesDepuisIcs(ICS);
    expect(ignores).toBe(0);
    expect(nuits).toEqual(["2026-12-18", "2026-12-19", "2026-12-20", "2026-12-21", "2026-12-28", "2026-12-29"]);
  });

  it("sans DTEND : une nuitée unique", () => {
    expect(nuiteesDepuisIcs("BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270102\r\nEND:VEVENT").nuits)
      .toEqual(["2027-01-02"]);
  });

  it("un évènement sans dates est compté ignoré — jamais silencieux", () => {
    const { nuits, ignores } = nuiteesDepuisIcs("BEGIN:VEVENT\r\nSUMMARY:x\r\nEND:VEVENT\r\n" + ICS);
    expect(ignores).toBe(1);
    expect(nuits.length).toBe(6);
  });

  it("une date impossible (30 février) est ignorée, pas corrigée", () => {
    expect(nuiteesDepuisIcs("BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260230\r\nDTEND;VALUE=DATE:20260302\r\nEND:VEVENT").nuits)
      .toEqual([]);
  });

  it("sans VEVENT : rien ne se passe", () => {
    expect(nuiteesDepuisIcs("BEGIN:VCALENDAR\r\nEND:VCALENDAR")).toEqual({ nuits: [], ignores: 0 });
  });

  it("nuiteesDe exclut le bord de départ — la sémantique du cycle", () => {
    expect(nuiteesDe("2026-11-04", "2026-11-07")).toEqual(["2026-11-04", "2026-11-05", "2026-11-06"]);
    expect(nuiteesDe("x", "2026-11-07")).toEqual([]);
  });
});

describe("une URL iCal acceptée : https, jamais le réseau interne", () => {
  it("https passe ; http, file, localhost, .local refusés", () => {
    expect(urlValide("https://www.airbnb.com/calendar/xxx.ics")).toBe(true);
    expect(urlValide("http://www.airbnb.com/calendar.ics")).toBe(false);
    expect(urlValide("file:///etc/passwd")).toBe(false);
    expect(urlValide("https://localhost/cal.ics")).toBe(false);
    expect(urlValide("https://127.0.0.1/cal.ics")).toBe(false);
    expect(urlValide("https://box.local/cal.ics")).toBe(false);
    expect(urlValide("pas une url")).toBe(false);
    expect(urlValide(undefined)).toBe(false);
  });
});

describe("le téléchargement échoue proprement, sans jamais lever", () => {
  it("inaccessible → ok false avec message, pas d'exception", async () => {
    const fauxFetch = async () => { throw new Error("network"); };
    expect(await telechargerIcs("https://x.ics", { fetchImpl: fauxFetch }))
      .toEqual({ ok: false, erreur: "calendrier inaccessible" });
  });

  it("statut non-200 → refus", async () => {
    const fauxFetch = async () => ({ ok: false, status: 404, text: async () => "" });
    expect((await telechargerIcs("https://x.ics", { fetchImpl: fauxFetch })).ok).toBe(false);
  });

  it("calendrier trop volumineux → refus (un ics honnête est petit)", async () => {
    const fauxFetch = async () => ({ ok: true, status: 200, text: async () => "x".repeat(100) });
    expect((await telechargerIcs("https://x.ics", { fetchImpl: fauxFetch, maxOctets: 10 })).erreur)
      .toBe("calendrier trop volumineux");
  });
});

describe("le ré-import remplace SA trace, rien d'autre", () => {
  it("retirer l'ancien, poser le neuf, garder le stable", () => {
    expect(deltaImport(["2026-12-18", "2026-12-19"], ["2026-12-19", "2026-12-20"]))
      .toEqual({ aPoser: ["2026-12-20"], aRetirer: ["2026-12-18"], stables: ["2026-12-19"] });
  });

  it("identique = delta vide", () => {
    expect(deltaImport(["2026-12-18"], ["2026-12-18"]))
      .toEqual({ aPoser: [], aRetirer: [], stables: ["2026-12-18"] });
  });
});
