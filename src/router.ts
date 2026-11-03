import { ANNONCES_DEMO } from "./annonces";
import { TERRITOIRES } from "./territoires";
import { LANGUE_PAR_DEFAUT, langueEtChemin, prefixeDe, type Langue } from "./i18n";

// Routeur minimal maison : zéro dépendance (doctrine vitesse).
// GitHub Pages sert index.html pour / et 404.html (copie d'index) pour les
// liens profonds — le JS lit l'URL et rend la bonne page.
//
// ⭐ BILINGUE (04/11/2026) : la langue est un PRÉFIXE d'URL (/fr/…, /en/…).
// usePath() renvoie le chemin SANS préfixe : les composants et les tests
// continuent de matcher sur des chemins nus, la langue ne fuit nulle part.
// Les chemins NUS restent servis en français (compat des URLs indexées) et
// se canonicalisent vers /fr/… (canonique.ts) — aucun lien partagé ne casse.

export function usePath(): string {
  const p = window.location.pathname;
  // base Pages : /manahome-app/
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const nu = p.startsWith(base) ? p.slice(base.length) || "/" : p;
  return langueEtChemin(nu).chemin;
}

/** La langue du chemin courant — fr par défaut sur les chemins nus. */
export function langueCourante(): Langue {
  const p = window.location.pathname;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const nu = p.startsWith(base) ? p.slice(base.length) || "/" : p;
  return langueEtChemin(nu).langue;
}

/**
 * Le href d'un chemin interne, préfixé de la langue courante. Tous les liens
 * internes passent par ici : perdre la langue au clic serait le défaut le
 * plus visible du bilingue.
 */
export function lien(chemin: string, langue: Langue = langueCourante()): string {
  return baseUrl() + prefixeDe(langue) + (chemin === "/" ? "/" : chemin);
}

/** Le href du même chemin dans l'autre langue — le sélecteur de la nav. */
export function lienAutreLangue(langue: Langue, chemin: string): string {
  const autre: Langue = langue === "fr" ? "en" : LANGUE_PAR_DEFAUT;
  return lien(chemin, autre);
}

export function routeAnnonce(path: string): string | null {
  const m = path.match(/^\/annonce\/([\w-]+)\/?$/);
  return m ? m[1] : null;
}

export function annonceParId(id: string | null) {
  if (!id) return null;
  return ANNONCES_DEMO.find((a) => a.id === id) ?? null;
}

export function routeTerritoire(path: string): string | null {
  const m = path.match(/^\/territoire\/([\w-]+)\/?$/);
  return m ? m[1] : null;
}

export function territoireParSlug(slug: string | null) {
  if (!slug) return null;
  return TERRITOIRES.find((t) => t.slug === slug) ?? null;
}

export function baseUrl(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

export function routeAnnonces(path: string): string | null {
  const m = path.match(/^\/annonces\/([\w-]+)\/?$/);
  return m ? m[1] : null;
}
