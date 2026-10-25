import { ANNONCES_DEMO } from "./annonces";

// Routeur minimal maison : zéro dépendance (doctrine vitesse).
// GitHub Pages sert index.html pour / et 404.html (copie d'index) pour les
// liens profonds — le JS lit l'URL et rend la bonne page.

export function usePath(): string {
  const p = window.location.pathname;
  // base Pages : /manahome-app/
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return p.startsWith(base) ? p.slice(base.length) || "/" : p;
}

export function routeAnnonce(path: string): string | null {
  const m = path.match(/^\/annonce\/([\w-]+)\/?$/);
  return m ? m[1] : null;
}

export function annonceParId(id: string | null) {
  if (!id) return null;
  return ANNONCES_DEMO.find((a) => a.id === id) ?? null;
}

export function baseUrl(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}
