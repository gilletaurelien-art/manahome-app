import { describe, it, expect } from "vitest";
import { plageValide, estDisponible, libellePlage } from "./disponibilite";

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc."];

describe("la plage se lit comme en base : bord de départ exclu", () => {
  it("du 4 au 7 : trois nuitées — 4, 5, 6", () => {
    expect(plageValide({ arrivee: "2026-11-04", depart: "2026-11-07" })).toBe(true);
  });

  it("départ <= arrivée : plage refusée", () => {
    expect(plageValide({ arrivee: "2026-11-07", depart: "2026-11-07" })).toBe(false);
    expect(plageValide({ arrivee: "2026-11-07", depart: "2026-11-04" })).toBe(false);
  });

  it("dates invalides ou vides : plage refusée", () => {
    expect(plageValide({ arrivee: "", depart: "2026-11-07" })).toBe(false);
    expect(plageValide({ arrivee: "nimporte", depart: "2026-11-07" })).toBe(false);
    // 30 février n'existe pas : la plage est refusée, pas corrigée en silence
    expect(plageValide({ arrivee: "2026-02-30", depart: "2026-03-01" })).toBe(false);
  });
});

describe("disponibilité : le vide n'est pas une date, l'invalide n'exclut pas", () => {
  const bloquees = ["2026-11-05", "2026-12-24"];

  it("sans plage posée, tout est disponible", () => {
    expect(estDisponible(bloquees, { arrivee: "", depart: "" })).toBe(true);
  });

  it("plage invalide = pas de filtre, jamais d'exclusion", () => {
    expect(estDisponible(bloquees, { arrivee: "x", depart: "y" })).toBe(true);
    expect(estDisponible(bloquees, { arrivee: "2026-11-08", depart: "2026-11-08" })).toBe(true);
  });

  it("une nuitée bloquée dans la plage rend l'annonce indisponible", () => {
    expect(estDisponible(bloquees, { arrivee: "2026-11-04", depart: "2026-11-07" })).toBe(false);
    expect(estDisponible(bloquees, { arrivee: "2026-12-20", depart: "2026-12-26" })).toBe(false);
  });

  it("la nuit de départ du séjour suivant reste libre (bord exclu)", () => {
    expect(estDisponible(bloquees, { arrivee: "2026-12-26", depart: "2026-12-28" })).toBe(true);
  });
});

describe("le libellé de plage", () => {
  it("du 4 nov. → 7 nov.", () => {
    expect(libellePlage({ arrivee: "2026-11-04", depart: "2026-11-07" }, MOIS_COURTS))
      .toBe("4 nov. → 7 nov.");
  });

  it("plage invalide : aucun libellé", () => {
    expect(libellePlage({ arrivee: "", depart: "" }, MOIS_COURTS)).toBeNull();
  });
});
