export type Source = "directe_particulier" | "import_pro";

export interface Annonce {
  id: string;
  titre: string;
  lieu: string;
  prix: number;
  surface?: number;
  pieces?: number;
  dpe?: string;
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
    source: "directe_particulier",
  },
  {
    id: "demo-crozon-terrain-1",
    titre: "Terrain viabilisé au calme, en lisière",
    lieu: "Crozon · hameau de Kerloc'h",
    prix: 89000,
    surface: 720,
    dpe: undefined,
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
    source: "import_pro",
  },
];
