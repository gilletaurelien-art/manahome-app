import { describe, it, expect } from "vitest";
import { validerDepot, validerJustificatif, empreinteDepot, phraseRefusPublication } from "./depot.mjs";

const DEPOT_VENTE = {
  type_bien: "maison", offre: "vente", prix_eur: 245000,
  surface_m2: 98, pieces: 4, dpe: "C", description: "Maison lumineuse.",
  code_insee: "29042",
};

describe("le dépôt est validé avant de toucher la base", () => {
  it("une vente valide passe, avec son empreinte", () => {
    const r = validerDepot(DEPOT_VENTE);
    expect(r.ok).toBe(true);
    expect(r.valeurs.prix_eur).toBe(245000);
    expect(r.valeurs.tarif_nuit).toBeNull();
    expect(r.empreinte).toMatch(/^[0-9a-f]{64}$/);
  });

  it("une location exige le tarif/nuit — le prix de vente reste null", () => {
    const r = validerDepot({ ...DEPOT_VENTE, offre: "location_courte_duree", prix_eur: 245000 });
    expect(r.ok).toBe(false);
    expect(r.erreur).toBe("tarif par nuit requis");
    const ok = validerDepot({ ...DEPOT_VENTE, offre: "location_courte_duree", prix_eur: null, tarif_nuit: 85 });
    expect(ok.ok).toBe(true);
    expect(ok.valeurs.tarif_nuit).toBe(85);
    expect(ok.valeurs.prix_eur).toBeNull();
  });

  it("type, prix, description : chaque refus a sa phrase", () => {
    expect(validerDepot({ ...DEPOT_VENTE, type_bien: "château" }).erreur).toBe("type de bien invalide");
    expect(validerDepot({ ...DEPOT_VENTE, prix_eur: "gratuit" }).erreur).toBe("prix de vente requis");
    expect(validerDepot({ ...DEPOT_VENTE, description: "  " }).erreur).toBe("description requise");
  });

  it("l'empreinte est stable pour un même bien, distincte pour un autre", () => {
    const a = empreinteDepot({ type_bien: "maison", offre: "vente", prix_eur: 1, surface_m2: 2, pieces: 3, code_insee: "29042", description: "x" });
    const b = empreinteDepot({ type_bien: "maison", offre: "vente", prix_eur: 1, surface_m2: 2, pieces: 3, code_insee: "29042", description: "x" });
    const c = empreinteDepot({ type_bien: "maison", offre: "vente", prix_eur: 2, surface_m2: 2, pieces: 3, code_insee: "29042", description: "x" });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("le justificatif : type documenté, référence posée, dates réelles", () => {
  it("valide passe, chaque champ manquant a sa phrase", () => {
    expect(validerJustificatif({ type_document: "declaration_meuble", reference: "29160-1234-5678" }).ok).toBe(true);
    expect(validerJustificatif({ type_document: "inconnu", reference: "x" }).ok).toBe(false);
    expect(validerJustificatif({ type_document: "dpe" }).erreur).toBe("référence requise");
    expect(validerJustificatif({ type_document: "dpe", reference: "abc", expire_le: "2027-13-01" }).erreur).toBe("date invalide");
  });
});

describe("le refus du verrou 007 se traduit, jamais en code brut", () => {
  it("déclaration, assurance, DPE : chacune sa phrase", () => {
    expect(phraseRefusPublication("publication refusee : declaration meuble requise"))
      .toContain("meublé touristique");
    expect(phraseRefusPublication("publication refusee : assurance valide requise"))
      .toContain("assurance");
    expect(phraseRefusPublication("publication refusee : DPE requis"))
      .toContain("DPE");
    expect(phraseRefusPublication("autre chose")).toContain("Publication refusée");
  });
});
