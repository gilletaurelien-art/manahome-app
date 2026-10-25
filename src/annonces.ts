export type Source = "directe_particulier" | "import_pro";

export interface Annonce {
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
}

// Fixtures de démonstration (is_demo=true en base) — jamais de donnée réelle.
export const ANNONCES_DEMO: Annonce[] = [
  {
    id: "demo-crozon-maison-1",
    titre: "Maison de ville lumineuse, jardin clos",
    lieu: "Crozon · à deux pas du port",
    prix: 245000,
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
    surface: 145,
    pieces: 5,
    dpe: "B",
    description:
      "[DÉMO] Longère rénovée avec dépendance, panorama mer, à 10 min des plages.",
    datePublication: "2026-10-24",
    source: "import_pro",
  },
];
