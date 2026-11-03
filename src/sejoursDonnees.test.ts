import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  demanderSejour,
  accepterSejour,
  confirmerSejour,
  annulerSejour,
  cloreSejour,
  sejourSurAnnonce,
  lireSejours,
} from "./sejoursDonnees";
import { lireIndispos, basculerNuit } from "./calendrierDonnees";

// localStorage n'existe pas sous Node : le même doublage minimal que
// calendrierDonnees.test.ts — on teste la LOGIQUE du cycle, pas le navigateur.
const stock = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => stock.get(k) ?? null,
  setItem: (k: string, v: string) => stock.set(k, v),
  removeItem: (k: string) => stock.delete(k),
});

const DEMANDE = {
  annonceId: "a1",
  annonceTitre: "Maison de ville lumineuse",
  arrivee: "2026-11-04",
  depart: "2026-11-07",
  voyageursNb: 2,
  tarifNuit: 85,
};

describe("la demande de séjour", () => {
  beforeEach(() => stock.clear());

  it("une demande valide démarre au statut demande_envoyee, devis figé", () => {
    const r = demanderSejour(DEMANDE);
    expect(r.ok).toBe(true);
    expect(r.sejour?.statut).toBe("demande_envoyee");
    expect(r.sejour?.conditions.nbNuits).toBe(3);
    expect(r.sejour?.conditions.total).toBe(255);
    expect(r.sejour?.conditions.paiement).toBe("direct_hote");
  });

  it("dates invalides ou voyageurs nuls : refus, rien n'est écrit", () => {
    expect(demanderSejour({ ...DEMANDE, arrivee: "2026-13-40" }).ok).toBe(false);
    expect(demanderSejour({ ...DEMANDE, depart: "2026-11-04" }).ok).toBe(false);
    expect(demanderSejour({ ...DEMANDE, voyageursNb: 0 }).ok).toBe(false);
    expect(lireSejours()).toEqual([]);
  });

  it("une plage aux nuitées bloquées est refusée avant toute écriture", () => {
    basculerNuit("a1", "2026-11-05");
    expect(demanderSejour(DEMANDE).ok).toBe(false);
  });

  it("une seule demande active par annonce (miroir de l'unicité)", () => {
    demanderSejour(DEMANDE);
    const deuxieme = demanderSejour({ ...DEMANDE, arrivee: "2026-12-01", depart: "2026-12-03" });
    expect(deuxieme.ok).toBe(false);
    expect(deuxieme.erreur).toBe("demande déjà en cours");
  });
});

describe("confirmation : bloquer, jamais encaisser", () => {
  beforeEach(() => stock.clear());

  it("la confirmation bloque exactement les nuitées du séjour, bord exclu", () => {
    const { sejour } = demanderSejour(DEMANDE);
    accepterSejour(sejour!.id);
    expect(confirmerSejour(sejour!.id).ok).toBe(true);
    expect(lireIndispos("a1")).toEqual(["2026-11-04", "2026-11-05", "2026-11-06"]);
    expect(sejourSurAnnonce("a1")?.statut).toBe("confirmee");
  });

  it("sans acceptation préalable, pas de confirmation", () => {
    const { sejour } = demanderSejour(DEMANDE);
    expect(confirmerSejour(sejour!.id).ok).toBe(false);
    expect(lireIndispos("a1")).toEqual([]);
  });

  it("double réservation refusée : blocage posé ENTRE la demande et la confirmation", () => {
    // une nuitée déjà bloquée AVANT la demande est refusée dès la demande —
    // le double-booking, lui, survient quand l'hôte bloque (ou confirme un
    // autre séjour) APRÈS réception de la demande. C'est ce cas qu'on fige.
    const { sejour } = demanderSejour(DEMANDE);
    accepterSejour(sejour!.id);
    basculerNuit("a1", "2026-11-06"); // blocage manuel concurrent
    expect(confirmerSejour(sejour!.id).ok).toBe(false);
    expect(confirmerSejour(sejour!.id).erreur).toBe("double réservation refusée");
    expect(lireIndispos("a1")).toEqual(["2026-11-06"]); // le blocage manuel reste
  });
});

describe("annulation : libérer seulement ce que le séjour a bloqué", () => {
  beforeEach(() => stock.clear());

  it("l'annulation libère les nuitées du séjour, jamais les blocages manuels", () => {
    basculerNuit("a1", "2026-11-06"); // blocage manuel AVANT la demande ?
    // la plage chevauche → la demande elle-même serait refusée : on teste
    // l'inverse — blocage manuel HORS de la plage du séjour.
    stock.clear();
    const { sejour } = demanderSejour(DEMANDE);
    accepterSejour(sejour!.id);
    confirmerSejour(sejour!.id);
    basculerNuit("a1", "2026-12-25"); // blocage manuel indépendant
    annulerSejour(sejour!.id);
    expect(lireIndispos("a1")).toEqual(["2026-12-25"]);
    expect(sejourSurAnnonce("a1")).toBeUndefined();
  });

  it("une demande (non confirmée) s'annule sans toucher aux nuitées", () => {
    const { sejour } = demanderSejour(DEMANDE);
    annulerSejour(sejour!.id);
    expect(lireIndispos("a1")).toEqual([]);
    // annulée, une nouvelle demande redevient possible
    expect(demanderSejour(DEMANDE).ok).toBe(true);
  });
});

describe("clôture : le passé reste bloqué, l'historique reste lisible", () => {
  beforeEach(() => stock.clear());

  it("clore un séjour confirmé fige l'historique sans libérer les nuitées passées", () => {
    const { sejour } = demanderSejour(DEMANDE);
    accepterSejour(sejour!.id);
    confirmerSejour(sejour!.id);
    cloreSejour(sejour!.id);
    expect(lireSejours()[0].statut).toBe("cloturee");
    expect(lireIndispos("a1")).toEqual(["2026-11-04", "2026-11-05", "2026-11-06"]);
  });

  it("clore une demande non confirmée ne fait rien", () => {
    const { sejour } = demanderSejour(DEMANDE);
    expect(cloreSejour(sejour!.id)).toBeUndefined();
  });
});
