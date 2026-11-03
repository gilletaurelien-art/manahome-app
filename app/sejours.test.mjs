import { describe, it, expect } from "vitest";
import { validerDemande, traduireErreurSejour, traduireTransition } from "./sejours.mjs";

const UUID = "12345678-1234-1234-1234-123456789abc";

describe("la demande est validée avant de toucher la base", () => {
  it("une demande valide passe", () => {
    expect(validerDemande({ annonceId: UUID, arrivee: "2026-11-04", depart: "2026-11-07", voyageursNb: 2 }).ok).toBe(true);
  });

  it("uuid absent ou malformé, dates irréelles, voyageurs nuls : refus", () => {
    expect(validerDemande({ annonceId: "pas-uuid", arrivee: "2026-11-04", depart: "2026-11-07", voyageursNb: 2 }).ok).toBe(false);
    expect(validerDemande({ annonceId: UUID, arrivee: "2026-13-01", depart: "2026-11-07", voyageursNb: 2 }).ok).toBe(false);
    expect(validerDemande({ annonceId: UUID, arrivee: "2026-11-07", depart: "2026-11-04", voyageursNb: 2 }).ok).toBe(false);
    expect(validerDemande({ annonceId: UUID, arrivee: "2026-11-04", depart: "2026-11-07", voyageursNb: 0 }).ok).toBe(false);
    expect(validerDemande({ annonceId: UUID, arrivee: "2026-11-04", depart: "2026-11-07", voyageursNb: 1.5 }).ok).toBe(false);
  });
});

describe("la base décide, l'API traduit — chaque erreur a sa phrase", () => {
  it("l'unicité violée devient 409 « demande déjà en cours »", () => {
    expect(traduireErreurSejour({ code: "23505" })).toEqual({ statut: 409, erreur: "demande déjà en cours" });
  });

  it("le refus du trigger (nuitées bloquées) devient 409 double réservation", () => {
    const e = { message: "confirmation refusee : nuitees deja bloquees" };
    expect(traduireErreurSejour(e)).toEqual({ statut: 409, erreur: "double réservation refusée" });
  });

  it("une erreur inconnue n'est pas traduite en mensonge : null remonte", () => {
    expect(traduireErreurSejour({ code: "42P01" })).toBeNull();
    expect(traduireErreurSejour(null)).toBeNull();
  });

  it("zéro ligne affectée = transition interdite, 409 — jamais 200 silencieux", () => {
    expect(traduireTransition(0)).toEqual({ statut: 409, erreur: "transition non permise" });
    expect(traduireTransition(1)).toBeNull();
  });
});
