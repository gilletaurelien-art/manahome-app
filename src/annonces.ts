export type Source = "directe_particulier" | "import_pro";
// Vente OU location — MANAhome couvre l'habitat, pas que la vente.
export type Transaction = "vente" | "location";

export interface Annonce {
  id: string;
  titre: string;
  lieu: string;
  prix: number;
  transaction: Transaction;
  surface?: number;
  pieces?: number;
  dpe?: string;
  description: string;
  datePublication: string;
  source: Source;
  // Démo locale : photos compressées côté client (dataURL). En prod : objets
  // S3 (OVH/RustFS) + clés serveur, jamais de binaire en base.
  photos?: string[];
}

// Fixtures de démonstration (is_demo=true en base) — jamais de donnée réelle.
export const ANNONCES_DEMO: Annonce[] = [
  {
    id: "demo-crozon-maison-1",
    titre: "Maison de ville lumineuse, jardin clos",
    lieu: "Crozon · à deux pas du port",
    prix: 245000,
    transaction: "vente",
    surface: 98,
    pieces: 4,
    dpe: "C",
    description:
      "Maison de ville lumineuse à deux pas du port, jardin clos, cuisine ouverte. Coup de cœur assuré pour la vue sur la rade depuis le séjour.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
  {
    id: "demo-crozon-appt-1",
    titre: "Dernier étage, balcon plein sud",
    lieu: "Crozon · proche plage de Pen-Hat",
    prix: 168000,
    transaction: "vente",
    surface: 62,
    pieces: 3,
    dpe: "D",
    description:
      "Appartement en dernier étage avec balcon plein sud, proche des commerces et de la plage de Pen-Hat.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
  {
    id: "demo-crozon-terrain-1",
    titre: "Terrain viabilisé au calme, en lisière",
    lieu: "Crozon · hameau de Kerloc'h",
    prix: 89000,
    transaction: "vente",
    surface: 720,
    dpe: undefined,
    description:
      "Terrain viabilisé au calme, en lisière du hameau, idéal maison de famille. Bornage à jour.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
  {
    id: "demo-crozon-maison-2",
    titre: "Longère rénovée avec dépendance, panorama mer",
    lieu: "Crozon · 10 min des plages",
    prix: 410000,
    transaction: "vente",
    surface: 145,
    pieces: 5,
    dpe: "B",
    description:
      "[DÉMO] Longère rénovée avec dépendance, panorama mer, à 10 min des plages.",
    datePublication: "2026-10-24",
    source: "import_pro",
  },
  {
    id: "demo-crozon-location-1",
    titre: "T3 lumineux avec vue sur la rade",
    lieu: "Crozon · centre",
    prix: 780,
    transaction: "location",
    surface: 64,
    pieces: 3,
    dpe: "D",
    description:
      "[DEMO] T3 lumineux au calme, vue sur la rade, cave et garage. Disponible immédiatement.",
    datePublication: "2026-10-25",
    source: "import_pro",
  },
  {
    id: "demo-crozon-location-2",
    titre: "Maison neuve F4 avec jardin",
    lieu: "Crozon · Kerloc'h",
    prix: 1150,
    transaction: "location",
    surface: 92,
    pieces: 4,
    dpe: "A",
    description:
      "[DEMO] Maison neuve F4, jardin clos, garage double. Proche écoles et plage.",
    datePublication: "2026-10-25",
    source: "import_pro",
  },
  {
    id: "demo-crozon-location-3",
    titre: "Studio meublé, proximité port",
    lieu: "Crozon · port",
    prix: 520,
    transaction: "location",
    surface: 28,
    pieces: 1,
    dpe: "C",
    description:
      "[DEMO] Studio meublé entièrement équipé, à deux pas du port. Charges comprises.",
    datePublication: "2026-10-25",
    source: "directe_particulier",
  },
];
