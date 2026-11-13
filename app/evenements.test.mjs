import { describe, it, expect } from "vitest";
import {
  TYPES_EVENEMENT,
  TYPE_POSABLE_API,
  validerEvenement,
  sqlInsererEvenement,
  sqlListerEvenements,
  traduireInsertionEvenement,
  traduireErreurEvenement,
} from "./evenements.mjs";

describe("la validation refuse avant que la base n'ait à parler", () => {
  it("le type posable passe, avec ou sans payload", () => {
    expect(validerEvenement({ type: "contrat_signe" })).toEqual({ ok: true, payload: {} });
    expect(validerEvenement({ type: "contrat_signe", payload: { reference: "CT-2026-011" } }).ok).toBe(true);
  });

  it("un type hors du CHECK de la 007 est refusé", () => {
    expect(validerEvenement({ type: "avenant" }).erreur).toBe("type d'événement inconnu");
    expect(validerEvenement({}).erreur).toBe("type d'événement inconnu");
  });

  it("les états des lieux appartiennent à l'offre gestionnaire, pas à l'API libre", () => {
    expect(TYPES_EVENEMENT).toContain("etat_des_lieux_entree");
    expect(validerEvenement({ type: "etat_des_lieux_entree" }).erreur).toBe(
      "ce type d'événement n'est pas posable ici"
    );
    expect(validerEvenement({ type: "etat_des_lieux_sortie" }).ok).toBe(false);
  });

  it("l'horodatage client est une preuve fabriquée : refusée", () => {
    const v = validerEvenement({ type: "contrat_signe", payload: { horodatage: "2026-11-13T10:00:00Z" } });
    expect(v.ok).toBe(false);
    expect(v.erreur).toBe("l'horodatage n'appartient pas au client");
  });

  it("le payload est un objet de faits, jamais une liste ni une valeur nue", () => {
    expect(validerEvenement({ type: "contrat_signe", payload: ["un"] }).ok).toBe(false);
    expect(validerEvenement({ type: "contrat_signe", payload: "texte" }).ok).toBe(false);
    expect(validerEvenement({ type: "contrat_signe", payload: 3 }).ok).toBe(false);
  });

  it("un payload démesuré est refusé : une preuve est un fait, pas un dossier", () => {
    const gros = { texte: "x".repeat(9000) };
    expect(validerEvenement({ type: "contrat_signe", payload: gros }).erreur).toBe(
      "payload trop volumineux"
    );
  });
});

describe("la base décide, l'API traduit — la grammaire SQL est une contrainte de test", () => {
  it("l'insertion porte la propriété dans le SQL : jamais de if applicatif", () => {
    const sql = sqlInsererEvenement();
    expect(sql).toContain("a.proprietaire = auth.uid()");
    expect(sql).toContain("FROM sejours s");
    expect(sql).toContain("RETURNING");
  });

  it("le fil se lit dans l'ordre chronologique — c'est lui qui fait le dossier", () => {
    const sql = sqlListerEvenements();
    expect(sql).toContain("a.proprietaire = auth.uid()");
    expect(sql.endsWith("ORDER BY e.horodatage")).toBe(true);
  });

  it("zéro ligne = séjour inconnu, 404 — jamais 403, jamais 200 silencieux", () => {
    expect(traduireInsertionEvenement(0)).toEqual({ statut: 404, erreur: "séjour inconnu" });
    expect(traduireInsertionEvenement(1)).toBeNull();
  });

  it("le CHECK de la 007 parle en dernier : sa violation devient 400", () => {
    expect(traduireErreurEvenement({ code: "23514" })).toEqual({ statut: 400, erreur: "type d'événement inconnu" });
    expect(traduireErreurEvenement({ code: "22P02" })).toEqual({ statut: 400, erreur: "requête invalide" });
    expect(traduireErreurEvenement({ code: "42P01" })).toBeNull();
    expect(traduireErreurEvenement(null)).toBeNull();
  });
});
