import type { Annonce, Equipement, Tarifs, Transaction } from "./annonces";
import { EQUIPEMENTS } from "./annonces";

// Client du module annonces — le premier maillon de la bascule FEATURE_BACK
// (docs/branchement-back.md). ⭐ QUATRE RÈGLES :
// 1. LA SÉCURITÉ DU REPLI : si l'API échoue, le front sert la démo — jamais
//    un écran vide là où la veille il y avait un catalogue. Un back absent
//    doit coûter zéro affichage.
// 2. LE FILTRE DE DATES SE FAIT CÔTÉ SERVEUR (est_disponible) : le front ne
//    RE-filtre pas ce que le serveur a déjà filtré — deux filtres des mêmes
//    dates, c'est deux occasions de diverger.
// 3. LE MAPPING EST PUR ET TESTÉ : la vue publique n'expose pas de titre,
//    la fiche en synthétise un honnête (type · pièces · surface) — jamais
//    un titre inventé qui ressemblerait à du marketing.
// 4. MANAhome N'EST PLUS QU'UN PORTAIL DE LOCATION DE VACANCES (04/11/2026) :
//    `offre: "vente"` reste dans le contrat de la vue (schéma non modifié
//    par ce chantier), mais toute ligne de vente est ÉCARTÉE avant mapping —
//    jamais affichée, jamais convertie. Le produit n'a plus de notion de
//    vente ; une ligne qui en porte une est une donnée héritée, pas un cas
//    d'affichage.

export interface LigneAnnonce {
  id: string;
  type_bien: "maison" | "appartement" | "terrain" | "autre";
  surface_m2: number | null;
  pieces: number | null;
  prix_eur: number | null;
  dpe: string | null;
  description: string | null;
  offre: "vente" | "location_courte_duree";
  // Trois paliers indépendants (migration 011) : le propriétaire en choisit
  // au moins un, jamais déduit l'un de l'autre.
  tarif_nuit: number | null;
  tarif_semaine: number | null;
  tarif_mois: number | null;
  capacite: number | null;
  // Couchages et équipements (migration 012). Les quatre équipements sont
  // des booléens NOT NULL en base : « non coché » EST un fait (pas de
  // piscine), contrairement à `couchages`, qui reste NULL tant que le
  // propriétaire ne l'a pas renseigné.
  couchages: number | null;
  parking: boolean;
  piscine: boolean;
  jardin: boolean;
  balcon: boolean;
  code_insee: string | null;
  source: "directe_particulier" | "import_pro";
  source_id: string | null;
  created_at: string;
}

const TYPES: Record<LigneAnnonce["type_bien"], string> = {
  maison: "Maison",
  appartement: "Appartement",
  terrain: "Terrain",
  autre: "Bien",
};

/** Le titre honnête d'une ligne publique — descriptif, jamais inventé. */
export function titreDeLigne(l: LigneAnnonce): string {
  const morceaux = [TYPES[l.type_bien]];
  if (l.pieces) morceaux.push(`${l.pieces} pièces`);
  if (l.surface_m2) morceaux.push(`${l.surface_m2} m²`);
  return morceaux.join(" · ");
}

/** Le lieu lisible : une location de vacances, à la nuitée. */
export function lieuDeLigne(l: LigneAnnonce): string {
  return `Location courte durée${l.capacite ? ` · ${l.capacite} voyageurs` : ""}`;
}

/**
 * Une ligne de la vue annonces_publiques → une Annonce du front.
 * ⚠️ Ne mappe que des lignes de location : appeler cette fonction sur une
 * ligne `offre: "vente"` est une erreur d'appelant — filtrer AVANT
 * (voir `chargerAnnonces`), jamais ici.
 */
/** Les équipements PRÉSENTS — un booléen false n'entre jamais dans la liste. */
function equipementsDeLigne(l: LigneAnnonce): Equipement[] {
  const presents: Record<Equipement, boolean> = {
    parking: l.parking,
    piscine: l.piscine,
    jardin: l.jardin,
    balcon: l.balcon,
  };
  return EQUIPEMENTS.filter((e) => presents[e]);
}

export function versAnnonce(l: LigneAnnonce): Annonce {
  const tarifs: Tarifs = {
    ...(l.tarif_nuit != null ? { nuit: l.tarif_nuit } : {}),
    ...(l.tarif_semaine != null ? { semaine: l.tarif_semaine } : {}),
    ...(l.tarif_mois != null ? { mois: l.tarif_mois } : {}),
  };
  const equipements = equipementsDeLigne(l);
  return {
    id: l.id,
    titre: titreDeLigne(l),
    lieu: lieuDeLigne(l),
    tarifs,
    transaction: "location",
    surface: l.surface_m2 ?? undefined,
    pieces: l.pieces ?? undefined,
    couchages: l.couchages ?? undefined,
    ...(equipements.length > 0 ? { equipements } : {}),
    dpe: l.dpe ?? undefined,
    description: l.description ?? "",
    datePublication: l.created_at.slice(0, 10),
    source: l.source,
  };
}

export interface FiltresRecherche {
  // Transaction n'a plus qu'une valeur ("location") : le champ reste
  // optionnel pour la compat de l'URL, mais ne sert plus à distinguer.
  offre?: Transaction;
  type_bien?: string;
  prix_max?: number;
  q?: string;
  arrivee?: string;
  depart?: string;
}

/** La query string de recherche — les dates ne partent QUE si la plage est valide. */
export function requeteRecherche(f: FiltresRecherche): string {
  const p = new URLSearchParams();
  if (f.offre) p.set("offre", "location_courte_duree");
  if (f.type_bien) p.set("type_bien", f.type_bien);
  if (f.prix_max && f.prix_max > 0) p.set("prix_max", String(f.prix_max));
  if (f.q?.trim()) p.set("q", f.q.trim());
  // miroir de disponibilite.ts : une plage invalide ne filtre PAS —
  // le serveur appliquerait la même règle, autant ne pas l'appeler pour rien
  const plageValide =
    /^\d{4}-\d{2}-\d{2}$/.test(f.arrivee ?? "") &&
    /^\d{4}-\d{2}-\d{2}$/.test(f.depart ?? "") &&
    (f.depart ?? "") > (f.arrivee ?? "");
  if (plageValide) {
    p.set("arr", f.arrivee!);
    p.set("dep", f.depart!);
  }
  return p.toString();
}

export interface ResultatAnnonces {
  ok: boolean;
  annonces?: Annonce[];
}

/** Recherche auprès du service app — jamais de throw, le repli décide ici. */
export async function chargerAnnonces(f: FiltresRecherche): Promise<ResultatAnnonces> {
  try {
    const reponse = await fetch(`/api/annonces?${requeteRecherche(f)}`, {
      credentials: "same-origin",
    });
    if (!reponse.ok) return { ok: false };
    const corps = (await reponse.json()) as { annonces: LigneAnnonce[] };
    // Une ligne héritée `offre: "vente"` n'a plus sa place au catalogue —
    // voir la règle 4 en tête de fichier : écartée, jamais mappée.
    return {
      ok: true,
      annonces: corps.annonces.filter((l) => l.offre !== "vente").map(versAnnonce),
    };
  } catch {
    // back absent, réseau coupé : le repli démo prend le relais — la page
    // ne doit pas être plus vide qu'avant la bascule
    return { ok: false };
  }
}
