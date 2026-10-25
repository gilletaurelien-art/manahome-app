// Référentiel pros — miroir de `pros_referentiel` + vues de publication.
// En prod : servies par l'API depuis la base (consolidées depuis import_sirene) ;
// ici, données réelles issues de recherche-entreprises.api.gouv.fr
// (annuaire officiel, vérifiées le 25/10/2026), statut « référencé » :
// identité administrative vérifiée côté annuaire, pas de preuve documentaire.
// Garde anti-domicile : seules des adresses d'établissement professionnel
// (personne morale) sont publiées ; aucun mandataire personne physique.

export interface Pro {
  raisonSociale: string;
  siren: string;
  statut: "referencé" | "actif" | "vérifié";
  categorie: "agence" | "notaire";
  commune: string;
  adressePublique?: string;
}

export const PROS: Pro[] = [
  {
    raisonSociale: "HUMAN IMMOBILIER",
    siren: "414854216",
    statut: "referencé",
    categorie: "agence",
    commune: "Crozon",
    adressePublique: "26 rue Alsace-Lorraine, 29160 Crozon",
  },
  {
    raisonSociale: "AGENCE DE LA PRESQU'ÎLE - SEVELLEC",
    siren: "801092883",
    statut: "referencé",
    categorie: "agence",
    commune: "Crozon",
    adressePublique: "48 boulevard de la France Libre, 29160 Crozon",
  },
  {
    raisonSociale:
      "SELARL Mtre Hélène Pouillas & Mtre Edouard Lavergne, notaires associés",
    siren: "878236538",
    statut: "referencé",
    categorie: "notaire",
    commune: "Crozon",
    adressePublique: "4 rue Jules Simon, 29160 Crozon",
  },
  {
    raisonSociale: "Mtre Pierre-Yves Le Roy, notaire",
    siren: "838732360",
    statut: "referencé",
    categorie: "notaire",
    commune: "Crozon",
    adressePublique: "2 rue de Verdun, 29160 Crozon",
  },
];

export function prosParCommune(commune: string): Pro[] {
  return PROS.filter((p) => p.commune === commune);
}
