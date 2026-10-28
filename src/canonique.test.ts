import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  PAGES_PUBLIQUES,
  PAGES_PRIVEES,
  REDIRIGEES,
  ROUTES_PLATES,
  canonique,
  construireSitemap,
} from "./canonique";

const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");

// Ces tests LISENT les fichiers plutôt que de recopier une liste : c'est la
// seule forme qui échoue quand une route est ajoutée, renommée ou retirée.
describe("la carte des routes est la source unique", () => {
  it("toute route plate déclarée est servie par App.tsx", () => {
    const manquantes = ROUTES_PLATES.filter(
      (s) => !new RegExp(`path === "/${s}"`).test(app),
    );
    expect(manquantes).toEqual([]);
  });

  it("toute route plate servie par App.tsx est déclarée", () => {
    const servies = [...app.matchAll(/path === "\/([\w-]+)"/g)].map((m) => m[1]);
    expect(servies.filter((s) => !ROUTES_PLATES.includes(s))).toEqual([]);
  });

  // Le défaut du 28/10 : neuf routes sur dix répondaient 404 en production,
  // la page s'affichant pourtant correctement.
  it("chaque route plate a une canonique calculable — sans quoi le build refuse", () => {
    for (const s of ROUTES_PLATES) {
      expect(canonique(`/${s}`, "https://manahome.org", "/")).not.toBeNull();
    }
  });

  it("une redirection se canonicalise vers sa DESTINATION, jamais elle-même", () => {
    for (const [ancienne, cible] of Object.entries(REDIRIGEES)) {
      expect(canonique(`/${ancienne}`, "https://manahome.org", "/")).toBe(
        `https://manahome.org/${cible}`,
      );
    }
  });

  it("une route inconnue n'a PAS de canonique", () => {
    expect(canonique("/inexistant-xyz", "https://manahome.org", "/")).toBeNull();
  });

  it("la canonique suit la cible, elle ne cite jamais Pages en dur", () => {
    expect(canonique("/approche", "https://manahome.org", "/")).not.toContain("github.io");
  });

  it("une fiche dynamique se canonicalise sur elle-même", () => {
    expect(canonique("/territoire/crozon", "https://manahome.org", "/")).toBe(
      "https://manahome.org/territoire/crozon",
    );
  });

  // Les écrans d'application n'ont rien à offrir à un moteur : ni au plan de
  // site, ni ouverts dans robots.txt.
  it("le plan de site n'annonce que les pages publiques, et la racine", () => {
    const xml = construireSitemap("https://manahome.org", "/");
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([
      "https://manahome.org/",
      ...PAGES_PUBLIQUES.map((s) => `https://manahome.org/${s}`),
    ]);
  });

  it("aucun écran d'application au plan de site", () => {
    const xml = construireSitemap("https://manahome.org", "/");
    for (const p of PAGES_PRIVEES) expect(xml).not.toContain(`/${p}<`);
  });

  it("robots.txt écarte chaque écran d'application", () => {
    for (const p of PAGES_PRIVEES) expect(robots).toContain(`Disallow: /${p}`);
  });

  it("aucune redirection au plan de site", () => {
    const xml = construireSitemap("https://manahome.org", "/");
    for (const a of Object.keys(REDIRIGEES)) expect(xml).not.toContain(`/${a}<`);
  });
});
