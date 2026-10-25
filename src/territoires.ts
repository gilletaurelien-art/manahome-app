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
  },
];

export function territoireParSlug(slug: string | null): Territoire | null {
  if (!slug) return null;
  return TERRITOIRES.find((t) => t.slug === slug) ?? null;
}
