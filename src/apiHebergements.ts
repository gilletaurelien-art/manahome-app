import type { Annonce } from "./annonces";
import type { AdresseParts } from "./adresse";

/**
 * Le catalogue MOISSONNÉ — les établissements importés, `source: "import_pro"`.
 *
 * ⭐ CE QUE C'EST, ET CE QUE CE N'EST PAS. 1 108 926 hébergements collectés
 * auprès de sources publiques — OpenStreetMap pour le monde, DATAtourisme pour
 * la France, les registres régionaux pour l'Italie et la Flandre. Ce ne sont
 * PAS des annonces : personne ne les a déposées, personne n'en a fixé le prix.
 * Ce sont des établissements qui existent, et que le visiteur peut contacter
 * par le registre public de leur source.
 *
 * ⛔ DONC ILS NE PORTENT NI TARIF, NI SURFACE, NI DPE, NI PHOTO — et l'écran
 * doit le DIRE plutôt que d'afficher un bloc prix vide. Un champ manquant qui
 * s'affiche en blanc se lit comme un défaut du site ; un champ manquant qui
 * s'annonce se lit comme une honnêteté.
 *
 * ⚠️ ET ILS PASSENT APRÈS LES DÉPÔTS DIRECTS, toujours. Règle du produit déjà
 * en place dans `AnnoncesListe` : « les annonces professionnelles importées
 * sont toujours affichées après les dépôts directs, à qualité égale ».
 *
 * 🔴 AUCUNE FICHE DE PARTICULIER N'EN SORT. Le catalogue classe chaque fiche
 * en `prive` (une chambre chez l'habitant) ou professionnelle ; les 441 397
 * privées n'ont NI adresse NI position, refusées à l'écriture par deux
 * contraintes de base. La porte publique ne peut donc pas en servir une avec
 * une adresse, même si ce code se trompait.
 */

/** La base publique souveraine — même clé anonyme que le reste de l'écosystème. */
const RACINE = "https://db.temposystem.fr/rest/v1";

/**
 * La clé anonyme du catalogue, lue dans l'environnement de build.
 *
 * ⭐ ELLE EST PUBLIQUE PAR CONSTRUCTION — c'est la même que tout navigateur
 * reçoit sur mana.bzh et manafrance.org, et elle n'ouvre que des fonctions de
 * LECTURE passées par la liste blanche. La mettre en `VITE_` est donc exact,
 * pas un compromis.
 * ⛔ MAIS ON NE LA CODE PAS EN DUR POUR AUTANT : une clé en dur se retrouve
 * dans l'historique git, survit à sa rotation, et personne ne sait plus
 * laquelle fait foi. Sans variable, `chercherDesHebergements` rend `[]` et
 * l'écran garde son catalogue de démarrage — un oubli de configuration ne
 * casse rien, il se voit.
 */
export const CLE_CATALOGUE: string =
  (import.meta.env?.VITE_CLE_CATALOGUE as string | undefined) ?? "";

/**
 * ⚠️ PostgREST résout une RPC par NOMS d'arguments, jamais par position :
 * `p_lieu`, `p_famille`, `p_personnes`, `p_limite`, `p_depuis`. Trois 404 ont
 * été servis le 10/11/2026 pour avoir deviné ces noms.
 */
export interface LigneHebergement {
  rang: number;
  pertinence: number | null;
  titre: string;
  commune: string;
  famille: string | null;
  typologie: string | null;
  couchages: number | null;
  chambres: number | null;
  capacite_connue: boolean;
  lat: number | null;
  lng: number | null;
  adresse: string | null;
  adresse_voie: string | null;
  adresse_numero: string | null;
  adresse_code_postal: string | null;
  source: string;
  attribution: string | null;
  registre_public: string | null;
}

export interface HebergementImporte extends Annonce {
  source: "import_pro";
  /** Les parties de l'adresse, jamais collées à la récolte. */
  adresseParts?: AdresseParts;
  /** La clé de source, qui dit le pays donc l'ordre de l'adresse. */
  sourceCle?: string;
  attribution?: string | null;
  registrePublic?: string | null;
}

/**
 * ⭐ LE MAPPING EST PUR ET TESTÉ, comme celui d'`apiAnnonces` : il ne doit rien
 * inventer. Un titre moissonné est le NOM PROPRE de l'établissement, pas une
 * accroche — on le sert tel quel.
 */
export function enHebergementImporte(l: LigneHebergement): HebergementImporte {
  return {
    id: `import-${l.source}-${slug(l.titre)}-${slug(l.commune)}`,
    titre: l.titre,
    lieu: l.commune,
    // ⛔ AUCUN TARIF, et c'est un fait, pas un oubli : la moisson ne collecte
    // aucun prix. `tarifsListe` rendra une liste vide, et la carte doit
    // l'annoncer au lieu de laisser un blanc.
    tarifs: {},
    transaction: "location",
    couchages: l.couchages ?? undefined,
    description: "",
    datePublication: "",
    source: "import_pro",
    sourceCle: l.source,
    attribution: l.attribution,
    registrePublic: l.registre_public,
    adresseParts: {
      entiere: l.adresse,
      voie: l.adresse_voie,
      numero: l.adresse_numero,
      codePostal: l.adresse_code_postal,
    },
    geoloc: l.lat != null && l.lng != null ? { lat: l.lat, lon: l.lng } : undefined,
  };
}

const slug = (s: string): string =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

/**
 * Cherche les établissements d'une commune.
 *
 * ⭐ REND `[]` — JAMAIS UNE EXCEPTION. Même règle que `chercherUneLocalite` de
 * mana.love : un écran de recherche qui lève laisse une page blanche, un écran
 * qui reçoit `[]` affiche « aucun établissement », ce qui est vrai du point de
 * vue de la personne dans tous ces cas — réseau coupé, droit refusé, commune
 * inconnue.
 * ⚠️ Et le minimum de trois caractères est tenu DES DEUX CÔTÉS : la porte rend
 * zéro en dessous, délibérément. Poster quand même, c'est demander à la base un
 * balayage de 1,1 million de lignes pour rien — ce qui l'a mise en HTTP 500 le
 * 10/11/2026.
 */
export const SAISIE_MINIMUM = 3;

/**
 * Le pays des fiches affichées — « FR » tant que MANAhome ne sert que des
 * territoires français.
 *
 * ⛔ C'EST UNE LIMITE ASSUMÉE, PAS UNE VÉRITÉ. Les trois territoires du site
 * sont identifiés par un `codeInsee`, donc français ; le catalogue, lui, porte
 * 211 pays. Le jour où une page servira un territoire étranger, cette
 * constante deviendra FAUSSE EN SILENCE — une adresse allemande s'afficherait
 * « 12 Hauptstraße ».
 * ⭐ LE VRAI CORRECTIF EST EN AMONT : `hebergements_moisson` ne stocke aucun
 * pays, alors que la moisson l'interroge pays par pays et le connaît au moment
 * d'écrire. Tant que cette colonne n'existe pas, aucun affichage ne peut faire
 * mieux que deviner — et deviner par la SOURCE était pire, parce que
 * `osm-monde` couvre les deux conventions à lui seul.
 */
export const PAYS_DU_CATALOGUE = "FR";

export async function chercherDesHebergements(
  lieu: string,
  cle: string,
  options: { personnes?: number; limite?: number; depuis?: number } = {},
): Promise<HebergementImporte[]> {
  const propre = (lieu || "").trim();
  if (propre.length < SAISIE_MINIMUM || !cle) return [];
  try {
    const r = await fetch(`${RACINE}/rpc/chercher_un_hebergement`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: cle, Authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        p_lieu: propre,
        p_famille: null,
        p_personnes: options.personnes ?? null,
        p_limite: options.limite ?? 24,
        p_depuis: options.depuis ?? 0,
      }),
    });
    if (!r.ok) return [];
    const lignes: unknown = await r.json();
    if (!Array.isArray(lignes)) return [];
    return (lignes as LigneHebergement[]).map(enHebergementImporte);
  } catch {
    return [];
  }
}
