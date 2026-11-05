export type Source = "directe_particulier" | "import_pro";
// MANAhome est un portail de LOCATION DE VACANCES, entre propriétaires et
// vacanciers — la vente a quitté le produit le 04/11/2026 (repositionnement).
export type Transaction = "location";

/**
 * Les tarifs d'une annonce — TROIS PALIERS INDÉPENDANTS (04/11/2026).
 * Le propriétaire est LIBRE de ne proposer que ce qu'il veut : un seul
 * palier suffit, les trois sont possibles, et les montants n'ont PAS à
 * respecter un rapport de proportion entre eux (une semaine n'est pas
 * 7 nuits au même tarif — elle peut être moins chère à la nuitée, ou plus).
 * ⚠️ Ne JAMAIS déduire un palier manquant d'un autre par un calcul : un
 * prix absent reste absent, il ne se complète pas.
 */
export interface Tarifs {
  nuit?: number;
  semaine?: number;
  mois?: number;
}

export type UniteTarif = "nuit" | "semaine" | "mois";

/**
 * Les équipements d'une annonce (04/11/2026) — une LISTE de ce qui est
 * PRÉSENT, jamais un objet à quatre booléens. Un équipement absent de la
 * liste n'est pas « faux », il est simplement non déclaré : on n'affirme
 * jamais l'absence d'une piscine qu'on n'a pas vérifiée.
 */
export type Equipement = "parking" | "piscine" | "jardin" | "balcon";

export const EQUIPEMENTS: readonly Equipement[] = ["parking", "piscine", "jardin", "balcon"];

export const LIBELLE_EQUIPEMENT: Record<Equipement, string> = {
  parking: "Parking",
  piscine: "Piscine",
  jardin: "Jardin",
  balcon: "Balcon",
};

export interface Annonce {
  id: string;
  titre: string;
  lieu: string;
  tarifs: Tarifs;
  transaction: Transaction;
  surface?: number;
  pieces?: number;
  // Couchages : le nombre de personnes que le logement peut coucher —
  // distinct de la capacité d'accueil du séjour (sejoursDonnees), qui
  // compte les voyageurs d'une réservation précise.
  couchages?: number;
  equipements?: Equipement[];
  dpe?: string;
  description: string;
  datePublication: string;
  source: Source;
  // Géoloc large (doctrine 001_init.sql : JAMAIS l'adresse précise d'un
  // particulier). Un point approximatif au quartier — la carte dézoome
  // d'office et ne pose aucun marqueur.
  geoloc?: { lat: number; lon: number };
  // Démo locale : photos compressées côté client (dataURL). En prod : objets
  // S3 (OVH/RustFS) + clés serveur, jamais de binaire en base.
  photos?: string[];
}

/** Tous les paliers renseignés, dans l'ordre nuit → semaine → mois. */
export function tarifsListe(t: Tarifs): { montant: number; unite: UniteTarif }[] {
  const liste: { montant: number; unite: UniteTarif }[] = [];
  if (t.nuit != null) liste.push({ montant: t.nuit, unite: "nuit" });
  if (t.semaine != null) liste.push({ montant: t.semaine, unite: "semaine" });
  if (t.mois != null) liste.push({ montant: t.mois, unite: "mois" });
  return liste;
}

/**
 * Le tarif à mettre en avant quand il n'y a de la place que pour UN
 * nombre (carte, fil JSON-LD) : le palier le plus fin disponible — jamais
 * un calcul, jamais une moyenne, juste le premier palier RENSEIGNÉ.
 */
export function tarifAffiche(t: Tarifs): { montant: number; unite: UniteTarif } | null {
  return tarifsListe(t)[0] ?? null;
}

export const LIBELLE_UNITE: Record<UniteTarif, string> = {
  nuit: "nuit",
  semaine: "semaine",
  mois: "mois",
};

/** "50 €/nuit", pour un seul palier. */
export function libelleTarif(montant: number, unite: UniteTarif): string {
  return `${montant.toLocaleString("fr-FR")} €/${LIBELLE_UNITE[unite]}`;
}

// Fixtures de démonstration (is_demo=true en base) — jamais de donnée réelle.
// ⭐ Chaque annonce choisit LIBREMENT ses paliers — certaines n'en ont qu'un,
// d'autres les trois, et les montants ne sont JAMAIS de simples multiples
// les uns des autres (cohérent avec la doctrine : pas de prix déduit).
export const ANNONCES_DEMO: Annonce[] = [
  {
    id: "demo-crozon-maison-1",
    geoloc: { lat: 48.247, lon: -4.423 },
    titre: "Maison de ville lumineuse, jardin clos",
    lieu: "Crozon · à deux pas du port",
    tarifs: { nuit: 95, semaine: 560, mois: 1650 },
    transaction: "location",
    surface: 98,
    pieces: 4,
    couchages: 7,
    equipements: ["jardin", "parking"],
    dpe: "C",
    description:
      "Maison de ville lumineuse à deux pas du port, jardin clos, cuisine ouverte. Coup de cœur assuré pour la vue sur la rade depuis le séjour.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
  {
    id: "demo-crozon-appt-1",
    geoloc: { lat: 48.236, lon: -4.456 },
    titre: "Dernier étage, balcon plein sud",
    lieu: "Crozon · proche plage de Pen-Hat",
    tarifs: { nuit: 65, semaine: 390 },
    transaction: "location",
    surface: 62,
    pieces: 3,
    couchages: 5,
    equipements: ["balcon"],
    dpe: "D",
    description:
      "Appartement en dernier étage avec balcon plein sud, proche des commerces et de la plage de Pen-Hat.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
  {
    id: "demo-crozon-studio-vue",
    geoloc: { lat: 48.262, lon: -4.463 },
    titre: "Chambre d'hôtes au calme, vue sur la lande",
    lieu: "Crozon · hameau de Kerloc'h",
    // Un seul palier — le propriétaire ne propose que la nuitée.
    tarifs: { nuit: 48 },
    transaction: "location",
    surface: 18,
    pieces: 1,
    couchages: 2,
    // Aucun équipement déclaré ici — honnête : on n'invente pas un parking
    // ou un jardin que le propriétaire n'a pas renseigné.
    dpe: undefined,
    description:
      "Chambre d'hôtes indépendante au calme, en lisière du hameau. Petit-déjeuner compris, accès direct aux sentiers.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
  {
    id: "demo-crozon-maison-2",
    geoloc: { lat: 48.244, lon: -4.434 },
    titre: "Longère rénovée avec dépendance, panorama mer",
    lieu: "Crozon · 10 min des plages",
    tarifs: { nuit: 140, semaine: 850, mois: 2400 },
    transaction: "location",
    surface: 145,
    pieces: 5,
    couchages: 10,
    equipements: ["jardin", "parking", "piscine"],
    dpe: "B",
    description:
      "[DÉMO] Longère rénovée avec dépendance, panorama mer, à 10 min des plages. Idéale pour un séjour en famille.",
    datePublication: "2026-10-24",
    source: "import_pro",
  },
  {
    id: "demo-crozon-location-1",
    geoloc: { lat: 48.24, lon: -4.429 },
    titre: "T3 lumineux avec vue sur la rade",
    lieu: "Crozon · centre",
    tarifs: { nuit: 72, mois: 1450 },
    transaction: "location",
    surface: 64,
    pieces: 3,
    couchages: 5,
    equipements: ["parking"],
    dpe: "D",
    description:
      "[DEMO] T3 lumineux au calme, vue sur la rade, cave et garage. Idéal pour un séjour au centre de Crozon.",
    datePublication: "2026-10-25",
    source: "import_pro",
  },
  {
    id: "demo-crozon-location-2",
    geoloc: { lat: 48.229, lon: -4.467 },
    titre: "Maison neuve F4 avec jardin",
    lieu: "Crozon · Kerloc'h",
    tarifs: { nuit: 110, semaine: 650 },
    transaction: "location",
    surface: 92,
    pieces: 4,
    couchages: 6,
    equipements: ["jardin", "parking"],
    dpe: "A",
    description:
      "[DEMO] Maison neuve F4, jardin clos, garage double. Proche écoles et plage — parfaite pour des vacances au calme.",
    datePublication: "2026-10-25",
    source: "import_pro",
  },
  {
    id: "demo-crozon-location-3",
    geoloc: { lat: 48.257, lon: -4.481 },
    titre: "Studio meublé, proximité port",
    lieu: "Crozon · port",
    // Trois paliers, exemple-type (celui donné en consigne) : 50/nuit,
    // 250/semaine, 750/mois — aucun n'est un multiple de l'autre.
    tarifs: { nuit: 50, semaine: 250, mois: 750 },
    transaction: "location",
    surface: 28,
    pieces: 1,
    couchages: 2,
    dpe: "C",
    description:
      "[DEMO] Studio meublé entièrement équipé, à deux pas du port. Charges comprises.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
];
