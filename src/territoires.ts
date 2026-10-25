// Données territoriales — miroir de la table `territoires` (couche
// d'enrichissement). En prod : servies par l'API depuis la base ; ici fixtures.

export interface Territoire {
  codeInsee: string;
  slug: string;
  nom: string;
  description: string;
  enrichissement: {
    environnement: string;
    transports: string;
    services: string;
    vieLocale: string;
  };
  // Historique indicatif du prix moyen au m² (maisons) — données de
  // démonstration, à remplacer par une source contractualisée le jour venu.
  prixHistorique: { annee: number; prixM2: number }[];
  georisk: {
    synthese: string;
    url: string;
  };
  // Chiffres-clés : bandeau sous le titre, sources officielles quand réel
  chiffres: { habitants: string; commerces: string; associations: string };
  parcsNaturels: string;
  servicesPublics: string;
  communauteCommunes: string;
}

export const TERRITOIRES: Territoire[] = [
  {
    codeInsee: "29042",
    slug: "crozon",
    nom: "Crozon",
    description:
      "Entre rade de Brest et océan Atlantique, la presqu'île de Crozon vit au rythme des marées : ports de pêche, criée, plages et sentiers des douaniers — un territoire qui se traverse à pied comme on le parcourt en famille.",
    enrichissement: {
      environnement:
        "Presqu'île entre rade de Brest et côte sauvage, falaises, dunes, forêts de pins et heath land — 60 km de littoral à portée de vélo.",
      transports:
        "Gare TER de Landévennec (navette fluviale), bus Brest–Crozon (lignes 15/16), réseau de navettes de plage l'été.",
      services:
        "Commerces de proximité, marché couvert, écoles et collège, centre culturel, hôpital de proximité, maisons de santé pluridisciplinaires.",
      vieLocale:
        "Port de pêche et criée, clubs nautiques, sentiers GR34, dynamisme associatif dense, festivals d'été — une vraie communauté vivante à l'année.",
    },
    prixHistorique: [
      { annee: 2016, prixM2: 1450 },
      { annee: 2017, prixM2: 1500 },
      { annee: 2018, prixM2: 1560 },
      { annee: 2019, prixM2: 1620 },
      { annee: 2020, prixM2: 1750 },
      { annee: 2021, prixM2: 1980 },
      { annee: 2022, prixM2: 2260 },
      { annee: 2023, prixM2: 2380 },
      { annee: 2024, prixM2: 2450 },
      { annee: 2025, prixM2: 2490 },
    ],
    georisk: {
      synthese:
        "Presqu'île exposée : submersion marine et débordement de ruées sur les secteurs littoraux (Camaret, Morgat), retrait-gonflement des argiles à l'intérieur des terres. Les zones bleues du PPRN restent constructibles sous conditions ; vérifiez chaque adresse.",
      url: "https://www.georisques.gouv.fr/mes-risques/connaitre-mes-risques/commune/29160",
    },
    chiffres: {
      habitants: "7 900",
      commerces: "180+",
      associations: "120+",
    },
    parcsNaturels:
      "Au cœur du Parc naturel régional d'Armorique (PNRA) : le cap de la Chèvre et la pointe de Pen-Hir classés en espace remarquable, les dunes de Camaret et l'anse de Dinan protégées par le Conservatoire du littoral.",
    servicesPublics:
      "Mairie, pôle emploi, CAF, trésorerie, poste, médiathèque, gendarmerie, centre de secours — la plupart des services publics de première nécessité présents sur place.",
    communauteCommunes:
      "Communauté de communes de la Presqu'île de Crozon (CCPC) : Crozon et ses 6 communes voisines mutualisent transports, déchets, tourisme et développement économique.",
  },
];

export function territoireParSlug(slug: string | null): Territoire | null {
  if (!slug) return null;
  return TERRITOIRES.find((t) => t.slug === slug) ?? null;
}
