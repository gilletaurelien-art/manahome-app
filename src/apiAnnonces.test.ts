import { describe, it, expect } from "vitest";
import { versAnnonce, requeteRecherche, transactionDe, titreDeLigne, type LigneAnnonce } from "./apiAnnonces";

const LIGNE_LOCATION: LigneAnnonce = {
  id: "11111111-1111-1111-1111-111111111111",
  type_bien: "maison",
  surface_m2: 98,
  pieces: 4,
  prix_eur: null,
  dpe: "C",
  description: "Maison de ville lumineuse.",
  offre: "location_courte_duree",
  tarif_nuit: 85,
  capacite: 6,
  code_insee: "29042",
  source: "directe_particulier",
  source_id: null,
  created_at: "2026-11-04T10:00:00Z",
};

const LIGNE_VENTE: LigneAnnonce = {
  ...LIGNE_LOCATION,
  id: "22222222-2222-2222-2222-222222222222",
  prix_eur: 245000,
  tarif_nuit: null,
  offre: "vente",
};

describe("le mapping ligne publique → Annonce est honnête", () => {
  it("une location courte durée devient une location au tarif/nuit", () => {
    const a = versAnnonce(LIGNE_LOCATION);
    expect(a.transaction).toBe("location");
    expect(a.prix).toBe(85);
    expect(a.lieu).toContain("6 voyageurs");
  });

  it("une vente garde son prix de vente", () => {
    const a = versAnnonce(LIGNE_VENTE);
    expect(a.transaction).toBe("vente");
    expect(a.prix).toBe(245000);
  });

  it("le titre est descriptif, jamais inventé", () => {
    expect(titreDeLigne(LIGNE_LOCATION)).toBe("Maison · 4 pièces · 98 m²");
    expect(transactionDe("location_courte_duree")).toBe("location");
  });

  it("les valeurs absentes deviennent undefined, pas 0 ni chaîne vide", () => {
    const a = versAnnonce({ ...LIGNE_VENTE, surface_m2: null, pieces: null, dpe: null });
    expect(a.surface).toBeUndefined();
    expect(a.pieces).toBeUndefined();
    expect(a.dpe).toBeUndefined();
  });
});

describe("la query de recherche suit la sémantique du serveur", () => {
  it("location (front) devient location_courte_duree (base)", () => {
    expect(requeteRecherche({ offre: "location" })).toBe("offre=location_courte_duree");
    expect(requeteRecherche({ offre: "vente" })).toBe("offre=vente");
  });

  it("plage valide : arr et dep partent — plage invalide : AUCUN paramètre de dates", () => {
    expect(requeteRecherche({ arrivee: "2026-11-04", depart: "2026-11-07" }))
      .toBe("arr=2026-11-04&dep=2026-11-07");
    for (const f of [
      { arrivee: "2026-11-04", depart: undefined },
      { arrivee: "2026-11-07", depart: "2026-11-04" },
      { arrivee: "x", depart: "2026-11-07" },
    ]) {
      expect(requeteRecherche(f)).not.toContain("arr=");
    }
  });

  it("prix nul ou texte vide : aucun paramètre parti", () => {
    expect(requeteRecherche({ prix_max: 0 })).toBe("");
    expect(requeteRecherche({ q: "   " })).toBe("");
    expect(requeteRecherche({ q: " Crozon " })).toBe("q=Crozon");
  });
});
