import type { Annonce, Source, Transaction } from "./annonces";

// Annonces déposées localement (démo) — miroir front des tables du back :
// dépôt direct de particulier, statut de publication, suppression = exclusion.
// En prod : auth + API ; ici localStorage, aucune donnée identifiante
// (l'e-mail du formulaire ne quitte jamais l'étape de validation demo).

export type StatutAnnonce = "publiee" | "depubliee";

export interface AnnonceLocale {
  id: string;
  titre: string;
  lieu: string;
  prix: number;
  surface?: number;
  pieces?: number;
  dpe?: string;
  description: string;
  datePublication: string;
  source: Source;
  statut: StatutAnnonce;
  transaction: Transaction;
  photos?: string[];
}

const CLE = "manahome-annonces-demo";

export function lireAnnoncesLocales(): AnnonceLocale[] {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as AnnonceLocale[]) : [];
  } catch {
    return [];
  }
}

function ecrire(annonces: AnnonceLocale[]) {
  localStorage.setItem(CLE, JSON.stringify(annonces));
}

export function annoncesPublieesLocales(): AnnonceLocale[] {
  return lireAnnoncesLocales().filter((a) => a.statut === "publiee");
}

export function annonceLocaleParId(id: string | null): AnnonceLocale | null {
  if (!id) return null;
  return lireAnnoncesLocales().find((a) => a.id === id) ?? null;
}

export function enregistrerAnnonceLocale(
  data: Omit<AnnonceLocale, "id" | "datePublication" | "source" | "statut">
): AnnonceLocale {
  const annonces = lireAnnoncesLocales();
  const annonce: AnnonceLocale = {
    ...data,
    id: `local-${Date.now()}`,
    datePublication: new Date().toISOString().slice(0, 10),
    source: "directe_particulier",
    statut: "publiee",
    transaction: data.transaction,
  };
  annonces.push(annonce);
  ecrire(annonces);
  return annonce;
}

export function changerStatut(id: string, statut: StatutAnnonce) {
  const annonces = lireAnnoncesLocales();
  const annonce = annonces.find((a) => a.id === id);
  if (!annonce) return;
  annonce.statut = statut;
  ecrire(annonces);
}

export function supprimerAnnonceLocale(id: string) {
  ecrire(lireAnnoncesLocales().filter((a) => a.id !== id));
}

export function enAnnonce(a: AnnonceLocale): Annonce {
  return {
    id: a.id,
    titre: a.titre,
    lieu: a.lieu,
    prix: a.prix,
    surface: a.surface,
    pieces: a.pieces,
    dpe: a.dpe,
    description: a.description,
    datePublication: a.datePublication,
    source: a.source,
    transaction: a.transaction,
  };
}
