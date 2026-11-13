/**
 * LA SOURCE UNIQUE DES PRIX — posée le 11/11/2026.
 *
 * ⛔ Les prix vivaient dans App.tsx. Le JSON-LD du §12 en a besoin AUSSI, et
 *    il est fabriqué au build par vite.config.ts : deux lecteurs, donc deux
 *    copies, donc une divergence au premier changement — et la divergence la
 *    plus coûteuse qui soit, puisqu'un prix affiché 390 € et déclaré 490 € aux
 *    machines est un mensonge qu'aucun test d'affichage ne voit.
 * ⭐ Le montant est un NOMBRE, jamais une chaîne. L'affichage « +199 € » se
 *    DÉRIVE de `montant` et de `option` : un libellé ne peut plus contredire
 *    la valeur déclarée, parce qu'il n'y a plus qu'une valeur.
 *
 * ⛔ NE PAS GRAVER UN PRIX DANS UNE IMAGE. Six illustrations portaient
 *    « 149 € HT · paiement unique » dessiné dedans ; elles sont supprimées le
 *    13/11/2026, deux jours après leur arrivée. ⭐ Le jour où la mention de TVA
 *    a changé, le texte a suivi partout — la FAQ, les libellés, les mentions
 *    légales, les deux balises meta, le JSON-LD — et les images sont restées
 *    fausses, sans qu'aucun test puisse le voir : personne ne lit un prix dans
 *    une image en intégration continue. Le module qui les portait l'avait
 *    d'ailleurs ANNONCÉ (« si un prix change, les six images sont à refaire »),
 *    ce qui n'a rien empêché : une description fidèle occupe la place d'un
 *    garde sans en faire le travail.
 * ⚠️ Illustrer reste possible — mais alors sans prix, sans nom d'offre et sans
 *    aucune valeur qui vive aussi dans ce fichier.
 *
 * ⚠️ MANA GEO China est passée de 490 € à 290 € le 13/11/2026, sur
 *    autorisation explicite d'Aurélien, après la redéfinition de l'offre sur
 *    TROIS moteurs atteignables au lieu de sept annoncés. ⭐ Le prix suit le
 *    périmètre : il avait été arrêté pour une couverture qu'on ne pouvait pas
 *    livrer.
 *
 * ⚠️ Ces prix sont ARRÊTÉS (décision d'Aurélien, 11/11/2026). Aucun ne se
 *    change sans son autorisation explicite.
 *
 * 🔴 ILS NE SONT PLUS ANNONCÉS « HT » — corrigé le 13/11/2026. Alliance MANA
 *    est une association loi 1901 (RNA W292008256) à gestion désintéressée
 *    dont les activités lucratives restent accessoires : elle relève de la
 *    franchise de l'**article 261, 7-1°-b du CGI**, pas de la franchise en
 *    base de l'article 293 B, et ne collecte aucune TVA.
 * ⭐ « 149 € HT » annonçait donc 178,80 € à payer alors que le prix réel est
 *    149 €. Un prix affiché hors taxes par une structure qui ne facture pas de
 *    taxe n'est pas une précaution : c'est une majoration fictive de 20 %
 *    devant l'acheteur, et une mention inexacte sur la facture.
 * ⚠️ Le seuil est de **81 051 €** de recettes lucratives encaissées en 2026,
 *    et les activités non lucratives doivent rester significativement
 *    prépondérantes. ⛔ Au-delà, ce n'est plus un libellé à changer mais une
 *    sectorisation à décider.
 */

export type Periode = "unique" | "mois";

export type Offre = {
  nom: string;
  montant: number;
  /** true : le prix s'ajoute à une autre offre — l'affichage porte un « + ». */
  option: boolean;
  periode: Periode;
  unite: string;
  famille: "ponctuel" | "recurrent";
  /** Une seule offre la porte : la carte mise en avant. */
  recommande?: boolean;
  depend?: string;
  pour: string;
  points: string[];
};

/** « 149 € » ou « +199 € » — dérivé, jamais saisi. */
export function prixAffiche(o: { montant: number; option: boolean }): string {
  return `${o.option ? "+" : ""}${o.montant} €`;
}

export const OFFRES_GEO: Offre[] = [
  {
    nom: "GEO Express", montant: 149, option: false, periode: "unique",
    unite: "paiement unique", famille: "ponctuel",
    pour: "Pour une photographie rapide de sa présence dans les IA.",
    points: [
      "Exploration automatisée du site",
      "Identification de l'entreprise et de ses activités",
      "Panel de questions commerciales",
      "Vérification de la présence et de l'exactitude des réponses",
      "Rapport synthétique et premières recommandations",
    ] },
  {
    nom: "GEO Expert", montant: 390, option: false, periode: "unique",
    unite: "paiement unique", famille: "ponctuel", recommande: true,
    pour: "Pour comprendre sa position réelle sur son marché.",
    points: [
      "Exploration technique et sémantique approfondie",
      "Panel correspondant aux intentions réelles des acheteurs",
      "Comparaison avec les concurrents",
      "Analyse des sources citées par les assistants",
      "Détection des informations absentes, erronées ou contradictoires",
      "Analyse des données structurées et de la lisibilité machine",
      "Plan d'amélioration hiérarchisé",
    ] },
  {
    nom: "GEO International", montant: 199, option: true, periode: "unique",
    unite: "option sur GEO Expert", famille: "ponctuel",
    depend: "Option sur GEO Expert",
    pour: "Pour mesurer sa visibilité sur un marché étranger.",
    points: [
      "Audit complémentaire sur un marché étranger",
      "Analyse dans une autre langue",
      "Comparaison des concurrents locaux",
      "Identification des sources et informations manquantes",
    ] },
  {
    nom: "MANA GEO China", montant: 290, option: true, periode: "unique",
    unite: "audit complémentaire ponctuel", famille: "ponctuel",
    depend: "Audit complémentaire — se commande seul ou après un GEO Expert",
    pour: "Pour savoir ce que les IA chinoises disent de vous.",
    points: [
      "Trois moteurs chinois : DeepSeek, Qwen (Alibaba) et Kimi (Moonshot)",
      "Doubao et ERNIE ne sont pas mesurés : leurs API exigent une entité en Chine. Doubao étant le plus utilisé là-bas, nous l'écrivons plutôt que de le taire.",
      "Questions posées EN chinois simplifié, pas traduites du français",
      "Réponses analysées en chinois avant d'être restituées en français",
      "Concurrents chinois et internationaux cités",
      "Sources locales identifiées",
      "Recommandations pour améliorer sa visibilité en Chine",
    ] },
  {
    nom: "GEO Monitoring", montant: 99, option: false, periode: "mois",
    unite: "par mois · abonnement", famille: "recurrent",
    pour: "Pour suivre son évolution, mois après mois.",
    points: [
      "Le même panel de questions rejoué chaque mois",
      "Suivi des concurrents et des changements de position",
      "Repérage des nouvelles sources citées",
      "Détection des réponses erronées ou des disparitions",
      "Rapport comparatif mensuel et historique conservé",
    ] },
  {
    nom: "GEO China Monitoring", montant: 149, option: true, periode: "mois",
    unite: "par mois · complément de GEO Monitoring", famille: "recurrent",
    depend: "Complément de GEO Monitoring",
    pour: "Pour suivre la visibilité chinoise dans le temps.",
    points: [
      "Les mêmes sept moteurs, les mêmes questions, chaque mois",
      "Évolution de la visibilité chinoise",
      "Nouveaux concurrents et nouvelles sources",
    ] },
];

/** Les prix déjà arrêtés de l'écosystème, inchangés. */
export const OFFRES_MANA = [
  { nom: "L'assistant", montant: 9, option: false, periode: "mois" as Periode,
    unite: "par mois et PAR HUMAIN, jamais par structure" },
  { nom: "La fiche pro", montant: 9, option: false, periode: "unique" as Periode, unite: "prix net" },
  { nom: "L'antenne", montant: 9, option: false, periode: "unique" as Periode, unite: "prix net" },
];

export const FAMILLES = [
  { cle: "ponctuel", titre: "Les audits — une commande, un livrable" },
  { cle: "recurrent", titre: "La surveillance — chaque mois, le même protocole" },
] as const;
