import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  PAGES_PUBLIQUES,
  PAGES_PRIVEES,
  REDIRIGEES,
  ROUTES_PLATES,
  TOUTES_LES_PAGES,
  TITRE_GENERIQUE,
  canonique,
  construireSitemap,
  titreDeLaRoute,
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

  // ── LES TITRES ──────────────────────────────────────────────────────────
  // Le défaut du 28/10 : les titres étaient posés en JS, donc absents du HTML
  // livré. Les aperçus de lien (Slack, WhatsApp, LinkedIn…) n'exécutent pas le
  // JS : chaque lien partagé montrait la vignette de l'accueil.
  it("chaque route plate a un titre, aucune n'est oubliée", () => {
    const sans = ROUTES_PLATES.filter((s) => !titreDeLaRoute(`/${s}`));
    expect(sans).toEqual([]);
  });

  it("aucun titre vide dans la table", () => {
    expect(TOUTES_LES_PAGES.filter((p) => !p.titre.trim()).map((p) => p.slug)).toEqual([]);
  });

  it("deux pages ne partagent JAMAIS le même titre", () => {
    const vus = new Map<string, string[]>();
    for (const p of TOUTES_LES_PAGES) {
      vus.set(p.titre, [...(vus.get(p.titre) ?? []), p.slug]);
    }
    expect([...vus.entries()].filter(([, s]) => s.length > 1)).toEqual([]);
  });

  it("chaque titre est suffixé par la marque, et diffère du générique", () => {
    for (const p of TOUTES_LES_PAGES) {
      const t = titreDeLaRoute(`/${p.slug}`);
      expect(t).toMatch(/ — MANAhome$/);
      expect(t).not.toBe(TITRE_GENERIQUE);
    }
    expect(titreDeLaRoute("/")).toBe(TITRE_GENERIQUE);
  });

  // ⚠️ Une redirection porte le titre de sa destination, comme sa canonique.
  it("une redirection porte le titre de sa DESTINATION", () => {
    for (const [ancienne, cible] of Object.entries(REDIRIGEES)) {
      expect(titreDeLaRoute(`/${ancienne}`)).toBe(titreDeLaRoute(`/${cible}`));
    }
  });

  it("une route inconnue n'a pas de titre de page", () => {
    expect(titreDeLaRoute("/inexistant-xyz")).toBeNull();
  });

  // ⛔ Aucune description par page dans ce dépôt : en écrire serait inventer.
  it("aucun composant ne pose plus de titre fixe — une seule source", () => {
    const fixes = ["Approche", "Pros", "Estimation", "MentionsLegales", "Messagerie", "EspacePro", "MesAnnonces"]
      .map((n) => [n, readFileSync(new URL(`./${n}.tsx`, import.meta.url), "utf8")] as const)
      .filter(([, src]) => /document\.title = "/.test(src))
      .map(([n]) => n);
    expect(fixes).toEqual([]);
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
