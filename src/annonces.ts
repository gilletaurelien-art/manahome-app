export type Source = "directe_particulier" | "import_pro";
// MANAhome est un portail de LOCATION DE VACANCES, entre propriétaires et
// vacanciers — la vente a quitté le produit le 04/11/2026 (repositionnement).
export type Transaction = "location";

export interface Annonce {
  id: string;
  titre: string;
  lieu: string;
  // Tarif à la nuitée, en euros — jamais un prix de vente ou un loyer mensuel.
  prix: number;
  transaction: Transaction;
  surface?: number;
  pieces?: number;
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

// Fixtures de démonstration (is_demo=true en base) — jamais de donnée réelle.
// Tarifs à la nuitée, cohérents avec une location de vacances à Crozon.
export const ANNONCES_DEMO: Annonce[] = [
  {
    id: "demo-crozon-maison-1",
    geoloc: { lat: 48.247, lon: -4.423 },
    titre: "Maison de ville lumineuse, jardin clos",
    lieu: "Crozon · à deux pas du port",
    prix: 95,
    transaction: "location",
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
    geoloc: { lat: 48.236, lon: -4.456 },
    titre: "Dernier étage, balcon plein sud",
    lieu: "Crozon · proche plage de Pen-Hat",
    prix: 65,
    transaction: "location",
    surface: 62,
    pieces: 3,
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
    prix: 48,
    transaction: "location",
    surface: 18,
    pieces: 1,
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
    prix: 140,
    transaction: "location",
    surface: 145,
    pieces: 5,
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
    prix: 72,
    transaction: "location",
    surface: 64,
    pieces: 3,
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
    prix: 110,
    transaction: "location",
    surface: 92,
    pieces: 4,
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
    prix: 48,
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
