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
 * ⛔ GEO MONITORING NE SE VEND PAS SEUL — arbitrage d'Aurélien, 13/11/2026.
 *    La carte l'affichait en offre autonome à 99 €/mois alors que la fabrique
 *    l'a TOUJOURS refusé : `geo_abonnements_monitoring.audit_prolonge` est
 *    `not null`, et le composeur lève « un suivi sans panel de départ ne
 *    compare rien ». ⭐ Un client aurait pu l'acheter sans qu'on puisse le
 *    livrer — la vitrine vendait ce que l'usine ne sait pas produire.
 * ⭐ Et ce n'est pas une limite technique qu'on pourrait lever : la valeur
 *    d'un suivi est la COMPARAISON, et une comparaison n'existe qu'à partir
 *    du deuxième point. Vendre un suivi seul, c'est vendre un graphique à un
 *    point.
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
 * ⚠️ MANA GEO China : 490 € → 290 € → **590 €**, trois décisions le même
 *    jour (13/11/2026), toutes d'Aurélien, la dernière sur la grille v1.1.
 *    ⭐ Les 290 € suivaient le VOLUME (135 interrogations contre 180 pour
 *    l'Expert à 390 € : moins de travail, moins cher). Les 590 € suivent la
 *    RARETÉ — accès aux moteurs chinois, conformité, qualification.
 * ⚠️ L'argument du volume a été posé et écarté en connaissance de cause. Il
 *    reste vrai, et il demande donc une justification ÉCRITE sur la carte :
 *    un client qui lit « Chine 590 € » et « Expert 390 € » côte à côte verra
 *    l'écart, et sans motif affiché il le lira comme une erreur.
 * ⛔ Et c'est 590 € FIXE, pas « à partir de » : le site promet des prix
 *    publics sans devis, et la grille v1.1 écrivait « à partir de ».
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

/**
 * ⭐ POURQUOI LE MONTANT AFFICHÉ EST LE MONTANT PAYÉ — et pourquoi ça dépend
 *    de QUI FACTURE. Alliance MANA ne collecte AUCUNE TVA (association loi
 *    1901, franchise de l'art. 261, 7-1°-b du CGI) : rien ne s'ajoute à ces
 *    nombres. C'est pourquoi le balisage machine portait
 *    `valueAddedTaxIncluded: true` — il ne dit pas « TVA comprise », il dit
 *    « rien ne s'ajoute », ce qui était exactement vrai.
 * 🔴 Ce raisonnement vivait dans `vite.config.ts`, dans une fonction retirée
 *    le 13/11/2026 avec le bloc `makesOffer`. Il est déplacé ici, à côté des
 *    montants, parce qu'il les CONCERNE.
 * ⛔ SI LA FACTURATION PASSE À LA SOCIÉTÉ, CES NOMBRES CHANGENT DE SENS :
 *    la TVA devient applicable, donc soit le client paie 20 % de plus, soit
 *    la recette baisse d'autant. Aucun des deux n'est chiffré à ce jour, et
 *    aucun test ne le verra — c'est un arbitrage, pas un détail.
 */
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
    nom: "GEO Europe", montant: 199, option: true, periode: "unique",
    unite: "option sur GEO Expert", famille: "ponctuel",
    depend: "Option sur GEO Expert",
    pour: "Pour mesurer sa visibilité sur les marchés britannique, allemand et espagnol.",
    points: [
      "Trois marchés : Royaume-Uni, Allemagne, Espagne",
      "Dix questions par marché, posées dans la langue du pays",
      "Réponses analysées dans la langue d'origine, jamais traduites d'abord",
      "Comparaison des concurrents locaux",
      "Identification des sources et informations manquantes",
    ] },
  {
    nom: "GEO Amérique du Nord", montant: 199, option: true, periode: "unique",
    unite: "option sur GEO Expert", famille: "ponctuel",
    depend: "Option sur GEO Expert",
    pour: "Pour mesurer sa visibilité sur les marchés nord-américains.",
    points: [
      "Trois marchés : États-Unis, Canada anglophone, Canada francophone",
      "Dix questions par marché, posées dans la langue du pays",
      "Réponses analysées dans la langue d'origine, jamais traduites d'abord",
      "Comparaison des concurrents locaux",
      "Identification des sources et informations manquantes",
    ] },
  {
    nom: "GEO Amérique latine", montant: 199, option: true, periode: "unique",
    unite: "option sur GEO Expert", famille: "ponctuel",
    depend: "Option sur GEO Expert",
    pour: "Pour mesurer sa visibilité sur les grands marchés hispanophones.",
    points: [
      "Trois marchés : Mexique, Colombie, Argentine",
      "Dix questions par marché, posées dans la langue du pays",
      "Réponses analysées dans la langue d'origine, jamais traduites d'abord",
      "Comparaison des concurrents locaux",
      "Identification des sources et informations manquantes",
      "Nous interrogeons les quatre assistants occidentaux. Des assistants locaux peuvent compter autant dans cette zone : nous ne les mesurons pas, et nous l'écrivons.",
    ] },
  {
    nom: "GEO Maghreb", montant: 199, option: true, periode: "unique",
    unite: "option sur GEO Expert", famille: "ponctuel",
    depend: "Option sur GEO Expert",
    pour: "Pour mesurer sa visibilité au Maroc, en Algérie et en Tunisie.",
    points: [
      "Trois marchés : Maroc, Algérie, Tunisie — en français, langue des affaires",
      "Dix questions par marché, posées dans la langue du pays",
      "Réponses analysées dans la langue d'origine, jamais traduites d'abord",
      "Comparaison des concurrents locaux",
      "Identification des sources et informations manquantes",
      "Nous interrogeons les quatre assistants occidentaux. Des assistants locaux peuvent compter autant dans cette zone : nous ne les mesurons pas, et nous l'écrivons.",
    ] },
  {
    nom: "GEO Asie du Sud", montant: 199, option: true, periode: "unique",
    unite: "option sur GEO Expert", famille: "ponctuel",
    depend: "Option sur GEO Expert",
    pour: "Pour mesurer sa visibilité en Inde, au Pakistan et au Sri Lanka.",
    points: [
      "Trois marchés : Inde, Pakistan, Sri Lanka — en anglais",
      "Dix questions par marché, posées dans la langue du pays",
      "Réponses analysées dans la langue d'origine, jamais traduites d'abord",
      "Comparaison des concurrents locaux",
      "Identification des sources et informations manquantes",
      "Nous interrogeons les quatre assistants occidentaux. Des assistants locaux peuvent compter autant dans cette zone : nous ne les mesurons pas, et nous l'écrivons.",
    ] },
  {
    nom: "MANA GEO China", montant: 590, option: true, periode: "unique",
    unite: "audit complémentaire ponctuel", famille: "ponctuel",
    depend: "Audit complémentaire — se commande seul ou après un GEO Expert",
    pour: "Pour savoir ce que les IA chinoises disent de vous.",
    points: [
      "Trois moteurs chinois : DeepSeek, Qwen (Alibaba) et Kimi (Moonshot)",
      "Accès, conformité et qualification des fournisseurs chinois compris — c'est ce que couvre l'écart de prix avec le Diagnostic",
      "Doubao et ERNIE ne sont pas mesurés : leurs API exigent une entité en Chine. Doubao étant le plus utilisé là-bas, nous l'écrivons plutôt que de le taire.",
      "Questions posées EN chinois simplifié, pas traduites du français",
      "Réponses analysées en chinois avant d'être restituées en français",
      "Concurrents chinois et internationaux cités",
      "Sources locales identifiées",
      "Recommandations pour améliorer sa visibilité en Chine",
    ] },
  {
    nom: "GEO Monitoring", montant: 99, option: true, periode: "mois",
    unite: "par mois · option sur un audit", famille: "recurrent",
    depend: "Option sur GEO Express ou GEO Expert",
    pour: "Pour suivre son évolution, mois après mois.",
    points: [
      "Prolonge un audit déjà réalisé : il ne le remplace pas",
      "Le même panel de questions rejoué chaque mois, aux formulations exactes de votre audit",
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

/**
 * LES PORTES D'ENTRÉE — posées le 13/11/2026 (document tarifaire v1.1, §8).
 *
 * ⭐ LA PAGE NE DOIT PAS PRÉSENTER TOUTES LES RÉFÉRENCES EN MÊME TEMPS. Elle
 * en affichait DIX d'un coup, rangées en deux familles : un mur de cartes où
 * le visiteur doit comparer avant d'avoir compris. Les portes nomment un
 * BESOIN et désignent une offre ; le catalogue complet reste dessous.
 *
 * ⛔ TROIS PORTES, PAS QUATRE. Le document en prévoit une quatrième,
 * « Améliorer », qui pointe sur un pack GEO Croissance dont deux composants
 * (Fondations, Présence) n'ont pas de prix arrêté. ⭐ « Jamais un bouton
 * vide » : une porte qui mène à une offre non commandable coûte plus cher que
 * son absence. Elle s'ajoutera quand les prix seront posés — la structure
 * l'attend.
 *
 * ⚠️ UNE PORTE DÉSIGNE UNE OFFRE PAR SON NOM, elle ne recopie NI son prix NI
 * son contenu : `OFFRES_GEO` reste la source unique, et une porte qui
 * désignerait une offre disparue est attrapée par `porteIntrouvable()`
 * plutôt que de s'afficher vide.
 */
export type Porte = { besoin: string; offre: string; accroche: string };

export const PORTES: Porte[] = [
  { besoin: "Comprendre", offre: "GEO Expert",
    accroche: "Ce que les assistants répondent vraiment sur vous, avec leurs sources et les organisations citées à votre place." },
  { besoin: "Suivre", offre: "GEO Monitoring",
    accroche: "Le même panel rejoué chaque mois, aux formulations exactes de votre audit — pour voir ce qui bouge." },
  { besoin: "Aller à l'international", offre: "GEO Europe",
    accroche: "Trois marchés étrangers, dix questions chacun, posées dans la langue du pays." },
];

/**
 * ⭐ Le garde qui rend « jamais un bouton vide » exécutable : il rend les noms
 * de portes qui ne correspondent à aucune offre. Un renommage d'offre casse
 * alors bruyamment, au lieu d'afficher une carte sans prix.
 */
export function porteIntrouvable(): string[] {
  const noms = new Set(OFFRES_GEO.map((o) => o.nom));
  return PORTES.filter((p) => !noms.has(p.offre)).map((p) => p.offre);
}
