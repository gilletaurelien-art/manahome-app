// Services à l'habitat — l'autre jambe du portail : trouver qui prend
// soin du bien. Fixtures de démonstration marquées ; les vrais pros
// arriveront via le référentiel (migration 005) et l'espace pro.
// Règle inchangée : jamais de recommandation, référencement factuel,
// état « référencé » par défaut, « vérifié » = preuve documentaire.

export type CategorieService =
  | "reparation"
  | "menage"
  | "jardinage"
  | "garde"
  | "diagnostic"
  | "autonomie";

export interface ServiceHabitat {
  id: string;
  nom: string;
  categorie: CategorieService;
  commune: string;
  resume: string;
  demo: true; // fixtures uniquement pour l'instant
}

export const CATEGORIES_SERVICE: {
  v: CategorieService;
  l: string;
  description: string;
}[] = [
  {
    v: "reparation",
    l: "Réparation & travaux",
    description:
      "Plomberie, électricité, chauffage, petits travaux : dépanner et entretenir le logement.",
  },
  {
    v: "menage",
    l: "Ménage & nettoyage",
    description:
      "Ménage régulier ou ponctuel, nettoyage fin, remise en état après travaux ou location.",
  },
  {
    v: "jardinage",
    l: "Jardin & extérieur",
    description:
      "Taille, tonte, entretien de haies et abords : le territoire reste soigné.",
  },
  {
    v: "garde",
    l: "Garde de logement",
    description:
      "Garde pendant absence, relevés, arrosage : le bien reste vivant et surveillé.",
  },
  {
    v: "diagnostic",
    l: "Diagnostics & expertise",
    description:
      "DPE, constats, expertise avant achat ou bail : décider en connaissance de cause.",
  },
  {
    v: "autonomie",
    l: "Autonomie & adaptation",
    description:
      "Aide à domicile, adaptation du logement au vieillissement : rester chez soi, dignement.",
  },
];

// [DEMO] — aucun nom réel, aucun SIREN : formes plausibles clairement
// marquées. La version réelle viendra de pros.ts / référentiel.
export const SERVICES_DEMO: ServiceHabitat[] = [
  {
    id: "demo-svc-plombier",
    nom: "[Démo] Plombier de la presqu'île",
    categorie: "reparation",
    commune: "Crozon",
    resume: "Dépannage plomberie et chauffage, intervention rapide sur la presqu'île.",
    demo: true,
  },
  {
    id: "demo-svc-electricien",
    nom: "[Démo] Électricien du port",
    categorie: "reparation",
    commune: "Crozon",
    resume: "Mise aux normes, dépannage, tableaux et circuits.",
    demo: true,
  },
  {
    id: "demo-svc-menage",
    nom: "[Démo] Maisonnée de la rade",
    categorie: "menage",
    commune: "Crozon",
    resume: "Ménage régulier et nettoyage de fin de bail pour particuliers.",
    demo: true,
  },
  {
    id: "demo-svc-jardin",
    nom: "[Démo] Jardins de la presqu'île",
    categorie: "jardinage",
    commune: "Lanvéoc",
    resume: "Taille de haies, tonte, entretien d'abords de maison.",
    demo: true,
  },
  {
    id: "demo-svc-garde",
    nom: "[Démo] Garde-logement de la baie",
    categorie: "garde",
    commune: "Camaret-sur-Mer",
    resume: "Garde de résidences secondaires, relevés, arrosage.",
    demo: true,
  },
  {
    id: "demo-svc-diag",
    nom: "[Démo] Diagnostiqueur du Finistère sud",
    categorie: "diagnostic",
    commune: "Châteaulin",
    resume: "DPE, amiante, termites, constats de vente et de location.",
    demo: true,
  },
  {
    id: "demo-svc-aide",
    nom: "[Démo] Autonomie Crozon",
    categorie: "autonomie",
    commune: "Crozon",
    resume: "Aide à domicile et adaptation du logement, pour rester chez soi.",
    demo: true,
  },
];
