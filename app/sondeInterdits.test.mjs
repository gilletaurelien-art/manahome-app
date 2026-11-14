// Les interdits qui ne se vérifient qu'en lisant la migration elle-même —
// un test par interdit de la section 4 du cahier, là où un module JS pur
// ne peut rien affirmer sur ce que la base autorise.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ici = path.dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(
  path.join(ici, "..", "db", "schema", "013_sonde_manatimebank.sql"),
  "utf8"
);
// Les commentaires SQL PARLENT des interdits (c'est le style du dépôt) —
// un test qui les lit confondrait la prose avec le code qu'elle décrit.
// Toute assertion structurelle lit la version SANS commentaires.
const sansCommentaires = migration.replace(/--.*$/gm, "");

describe("I1 — aucune mécanique qui déplace des unités entre deux personnes", () => {
  it("ne contient aucun UPDATE sur temoins_temps", () => {
    expect(/UPDATE\s+temoins_temps/i.test(sansCommentaires)).toBe(false);
  });

  it("n'accorde jamais UPDATE sur temoins_temps au rôle applicatif", () => {
    const octroi = sansCommentaires.match(/^GRANT[^;]*\bON\s+temoins_temps\s+TO\s+manahome_app/im)?.[0] ?? "";
    expect(octroi).not.toBe("");
    expect(/UPDATE/i.test(octroi)).toBe(false);
  });

  it("ne définit aucune fonction/policy nommée « transferer »", () => {
    expect(/transferer/i.test(sansCommentaires)).toBe(false);
  });
});

describe("I2 — aucune mécanique qui compte les merci", () => {
  it("la table merci n'apparaît dans aucun CREATE VIEW", () => {
    const vues = [...sansCommentaires.matchAll(/CREATE (?:OR REPLACE )?VIEW[^;]*;/gis)];
    expect(vues.some((v) => /\bmerci\b/i.test(v[0]))).toBe(false);
  });

  it("la table merci n'apparaît dans aucune fonction d'agrégat", () => {
    const fonctions = [...sansCommentaires.matchAll(/CREATE (?:OR REPLACE )?FUNCTION[\s\S]*?\$\$\s*;/gi)];
    expect(fonctions.length).toBeGreaterThan(0); // le test ne doit rien manquer en silence
    expect(fonctions.some((f) => /\bmerci\b/i.test(f[0]))).toBe(false);
  });
});

describe("I4 — aucun comptage ambiant", () => {
  it("aucune table d'événements comportementaux hors les faits déclarés", () => {
    const tables = [...sansCommentaires.matchAll(/CREATE TABLE (\w+)/gi)].map((m) => m[1]);
    expect(tables).toEqual(["temoins_temps", "veilles", "merci", "reserve_hebdo"]);
  });
});

describe("I8 — l'affichage du statut d'attestation au donneur", () => {
  it("la policy de lecture donneur ne lit jamais la face reception", () => {
    const policyDonneur = sansCommentaires.match(/CREATE POLICY p_donneur_temoin_lecture[^;]*;/i)?.[0] ?? "";
    expect(policyDonneur).toMatch(/face\s*=\s*'don'/);
    expect(policyDonneur).not.toMatch(/reception/);
  });

  it("la policy de lecture receveur ne lit jamais la face don", () => {
    const policyReceveur = sansCommentaires.match(/CREATE POLICY p_receveur_temoin_lecture[^;]*;/i)?.[0] ?? "";
    expect(policyReceveur).toMatch(/face\s*=\s*'reception'/);
    expect(policyReceveur).not.toMatch(/'don'/);
  });
});

describe("I9 — toute conversion monétaire", () => {
  it("aucune mention d'euro/argent/prix dans la migration", () => {
    expect(/\beuro|\bargent\b|\bprix\b/i.test(sansCommentaires)).toBe(false);
  });
});
