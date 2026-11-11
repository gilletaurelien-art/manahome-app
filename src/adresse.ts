/**
 * L'adresse d'un hébergement importé — et l'ORDRE de ses parties.
 *
 * 🔴 POURQUOI CE MODULE EXISTE. Une adresse n'a pas le même ordre selon le
 * pays : « 12 rue de la Paix » en France, « Hauptstraße 12 » en Allemagne, aux
 * Pays-Bas, en Suède. La moisson stocke donc les PARTIES séparées — voie,
 * numéro, code postal — et refuse de les coller, parce que coller est
 * irréversible : on ne resépare pas un numéro d'une voie, sur un million de
 * fiches. La mise en forme est une affaire d'AFFICHAGE, et c'est ici.
 *
 * ⭐ ET L'ORDRE PAR DÉFAUT N'EST PAS UNE PRÉFÉRENCE, C'EST UNE MESURE. Les pays
 * où OpenStreetMap porte réellement des adresses d'hébergement sont, dans
 * l'ordre (relevé du 11/11/2026 sur 623 915 établissements) : Autriche 73,8 %,
 * Allemagne 71,1 %, Royaume-Uni 68,3 %, Slovénie 69,2 %, Pays-Bas 61,3 %,
 * Suisse 57,1 %, Pologne 57,0 %. Six de ces sept écrivent la VOIE PUIS LE
 * NUMÉRO. C'est donc l'ordre par défaut — pas parce qu'il serait universel,
 * mais parce qu'il est juste là où la donnée existe.
 *
 * ⚠️ ET QUAND LA SOURCE DONNE DÉJÀ UNE CHAÎNE FORMÉE, ON NE LA RECOMPOSE PAS.
 * DATAtourisme écrit `Adresse_postale` à la française, la Sardaigne et
 * l'Ombrie leur `INDIRIZZO` : ces sources MAÎTRISENT leur format, et le
 * reformater depuis des parties qu'on n'a pas serait une invention.
 */

export interface AdresseParts {
  /** La chaîne déjà formée par la source, quand elle en donne une. */
  entiere?: string | null;
  voie?: string | null;
  numero?: string | null;
  codePostal?: string | null;
}

/**
 * Les pays qui écrivent le NUMÉRO avant la voie.
 *
 * 🔴 ET MA PREMIÈRE VERSION INDEXAIT SUR LA SOURCE, PAS SUR LE PAYS. C'était
 * faux, et ça se voyait au premier écran : `osm-monde` couvre 211 pays, dont
 * la France — « Camping de l'Aber, Route de l'Aber 50 » à Crozon, au lieu de
 * « 50 Route de l'Aber ». J'avais justifié l'ordre par une mesure juste
 * (Autriche, Allemagne, Pays-Bas, Suisse écrivent voie puis numéro) en
 * oubliant que la même source sert aussi les pays de l'autre convention.
 * ⭐ L'ordre est une propriété du PAYS de la fiche, jamais de la source.
 */
const NUMERO_DEVANT: ReadonlySet<string> = new Set([
  "FR", "GB", "IE", "ES", "PT", "US", "CA", "AU", "NZ", "IN", "JP", "TH", "SG",
]);

/**
 * `true` si ce pays écrit le numéro avant la voie.
 *
 * ⚠️ PAR DÉFAUT, LA VOIE D'ABORD — et ce n'est pas une préférence. Mesuré le
 * 11/11/2026 sur 623 915 établissements : les pays où OpenStreetMap porte
 * vraiment des adresses sont l'Autriche (73,8 %), l'Allemagne (71,1 %), la
 * Slovénie (69,2 %), les Pays-Bas (61,3 %), la Suisse (57,1 %), la Pologne
 * (57,0 %) — tous « voie puis numéro ». Le défaut sert donc le cas majoritaire
 * là où la donnée existe, et la liste ci-dessus corrige les autres.
 */
export function numeroAvantVoie(pays?: string | null): boolean {
  return pays != null && NUMERO_DEVANT.has(pays.toUpperCase());
}

/**
 * L'adresse en une ligne lisible, ou `null` s'il n'y a rien à montrer.
 *
 * ⛔ NE REND JAMAIS UNE CHAÎNE VIDE NI UN RÉSIDU DE PONCTUATION : une adresse
 * à moitié absente doit disparaître, pas s'afficher comme « , 29000 ». Un
 * affichage bancal se lit comme une donnée fausse.
 */
export function adresseLisible(
  a: AdresseParts | null | undefined,
  pays?: string | null,
): string | null {
  if (!a) return null;
  const propre = (v?: string | null) => (typeof v === "string" ? v.trim() : "");
  const entiere = propre(a.entiere);
  const voie = propre(a.voie);
  const numero = propre(a.numero);
  const cp = propre(a.codePostal);

  // La source maîtrise son format : on le sert tel quel, avec le code postal
  // seulement s'il n'y est pas déjà.
  if (entiere) {
    return cp && !entiere.includes(cp) ? `${entiere}, ${cp}` : entiere;
  }

  const rue = voie
    ? numero
      ? numeroAvantVoie(pays)
        ? `${numero} ${voie}`
        : `${voie} ${numero}`
      : voie
    : numero
      // ⚠️ Un numéro SANS voie ne veut rien dire tout seul — mesuré au
      // Luxembourg : 8 fiches sur 197 portent un numéro ou un code postal
      // sans nom de rue, des hameaux sans voirie nommée. On ne l'affiche pas.
      ? ""
      : "";

  const morceaux = [rue, cp].filter(Boolean);
  return morceaux.length ? morceaux.join(", ") : null;
}
