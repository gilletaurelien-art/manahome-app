import { describe, it, expect } from "vitest";
import { requeteAnnonces, plageValide, LIMIT_MAX } from "./requetes.mjs";

// Ces tests protègent les SÉMANTIQUES partagées avec le front (disponibilite.ts)
// et la règle structurelle de sécurité : aucune valeur ne touche jamais le SQL.

describe("la sécurité est structurelle : les valeurs ne touchent jamais le SQL", () => {
  it("aucune valeur ne figure en clair dans le SQL, tout passe par $n", () => {
    const { sql, params } = requeteAnnonces({ q: "Crozon", offre: "vente" });
    expect(sql).not.toContain("Crozon");
    // ordre des filtres du bâtisseur : offre d'abord, puis texte
    expect(params).toEqual(["vente", "%Crozon%"]);
    expect(sql).toContain("$1");
    expect(sql).toContain("$2");
  });

  it("un paramètre inconnu est ignoré, jamais répercuté", () => {
    const { sql, params } = requeteAnnonces({ DROP: 1, sql: "; DROP TABLE annonces; --" });
    expect(sql).not.toContain("DROP");
    expect(params).toEqual([]);
  });

  it("la limite est plafonnée, jamais prise telle quelle", () => {
    const { sql } = requeteAnnonces({ limit: "100000" });
    expect(sql).toContain(`LIMIT ${LIMIT_MAX}`);
    expect(requeteAnnonces({ limit: "-5" }).sql).toContain("LIMIT 1");
  });
});

describe("la plage de dates suit la même sémantique que le front", () => {
  it("plage valide → est_disponible avec le bord exclu, deux paramètres datés", () => {
    const { sql, params } = requeteAnnonces({ arr: "2026-11-04", dep: "2026-11-07" });
    expect(sql).toContain("est_disponible(id, $1::date, $2::date)");
    expect(params).toEqual(["2026-11-04", "2026-11-07"]);
  });

  it("plage invalide ou absente → AUCUN filtre de dates", () => {
    for (const f of [
      {},
      { arr: "2026-11-04" },
      { arr: "2026-11-07", dep: "2026-11-04" },
      { arr: "2026-11-07", dep: "2026-11-07" },
      { arr: "nimporte", dep: "2026-11-07" },
    ]) {
      const { sql, params } = requeteAnnonces(f);
      expect(sql).not.toContain("est_disponible");
      expect(params).toEqual([]);
    }
  });

  it("plageValide est le miroir exact du front", () => {
    expect(plageValide({ arr: "2026-11-04", dep: "2026-11-07" })).toBe(true);
    expect(plageValide({ arr: "2026-11-07", dep: "2026-11-04" })).toBe(false);
    expect(plageValide({})).toBe(false);
  });
});

describe("la doctrine du tri vit dans le SQL, pas dans le client", () => {
  it("le tri par source place les annonces directes devant les importées", () => {
    const { sql } = requeteAnnonces({});
    expect(sql).toContain("ORDER BY source, created_at DESC");
  });

  it("la lecture passe par la vue de publication, jamais par la table", () => {
    const { sql } = requeteAnnonces({});
    expect(sql).toContain("FROM annonces_publiques");
    expect(sql).not.toContain("FROM annonces ");
  });

  it("aucune colonne privée n'est sélectionnée", () => {
    const { sql } = requeteAnnonces({});
    for (const interdit of ["proprietaire", "empreinte", "email", "telephone"]) {
      expect(sql).not.toContain(interdit);
    }
  });
});
