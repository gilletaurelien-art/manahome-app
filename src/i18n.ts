// La couche bilingue — 04/11/2026. Le site sert /fr/… et /en/… : la langue est
// un préfixe d'URL, jamais une préférence stockée (doctrine du mémo de famille :
// ce qui peut ne pas être demandé ne s'écrit pas).
//
// ⭐ TROIS CHOIX QUI NE SONT PAS DES GOÛTS.
// 1. LE DICTIONNAIRE A POUR CLÉ LE TEXTE FRANÇAIS. Le français est la source,
//    l'anglais est la traduction — pas deux sources à maintenir en parallèle.
//    Une clé absente affiche le français : le pire cas est un repli lisible,
//    jamais un trou.
// 2. LES CHEMINS NUS RESTENT SERVIS EN FRANÇAIS. Les URLs indexées avant le
//    bilingue (canoniques posées le 28/10) continuent d'afficher ET d'être
//    canonicalisées vers /fr/… : aucun lien partagé ne casse, Google consolide.
// 3. /fr EST EXPLICITE, MÊME PAR DÉFAUT. Deux langues à parité, aucune
//    « langue invisible » : le hreflang se pose sur les deux.
// 12/11/2026 : la position « maison des IA » remplace l'ancien hero et la
// section 03 — les clés suivent, l'ancien libellé disparaît proprement.

export const LOCALES = ["fr", "en"] as const;
export type Langue = (typeof LOCALES)[number];

/** Le français est la langue de la maison ; l'anglais, son miroir. */
export const LANGUE_PAR_DEFAUT: Langue = "fr";

/** Extrait la langue et le chemin nu d'un chemin d'URL (préfixe de base ôté). */
export function langueEtChemin(path: string): { langue: Langue; chemin: string } {
  const m = path.match(/^\/(fr|en)(\/|$)/);
  if (m) {
    return { langue: m[1] as Langue, chemin: path.slice(3) || "/" };
  }
  return { langue: LANGUE_PAR_DEFAUT, chemin: path || "/" };
}

/** Le préfixe d'URL d'une langue — vide pour aucune. */
export const prefixeDe = (l: Langue): string => `/${l}`;

/**
 * La traduction anglaise d'un texte français, ou le texte lui-même en repli.
 * Le repli EST le comportement voulu pour les pages pas encore traduites :
 * l'anglais partiel est plus honnête qu'un site moitié vide.
 */
export function t(langue: Langue, texte: string): string {
  return langue === "en" ? DICO_EN[texte] ?? texte : texte;
}

/**
 * Les traductions des surfaces traduites à ce jour : le chrome partagé (nav,
 * pied de page) et la page d'accueil. Les autres pages (publier, estimation,
 * pros, approche, messagerie, espace-pro, mes-annonces, mentions) servent le
 * français sous /en/ jusqu'à traduction — elles s'ajoutent ICI, clé par clé,
 * sans toucher au reste de l'app.
 */
const DICO_EN: Record<string, string> = {
  // ── Grille tarifaire GEO (11/11/2026) ── ⚠️ Les NOMS de produits et les
  // PRIX ne sont pas ici : une marque ne se traduit pas, un montant non plus.
  // `t()` rend la clé quand elle manque — c'est le comportement voulu.
  "HT · paiement unique": "excl. VAT · one-off payment",
  "HT · option sur GEO Expert": "excl. VAT · add-on to GEO Expert",
  "HT par mois · abonnement": "excl. VAT per month · subscription",
  "HT · audit complémentaire ponctuel": "excl. VAT · one-off add-on audit",
  "HT par mois · complément de GEO Monitoring": "excl. VAT per month · add-on to GEO Monitoring",
  "HT par mois et PAR HUMAIN, jamais par structure": "excl. VAT per month and PER HUMAN, never per organisation",
  "HT": "excl. VAT",
  "Pour une photographie rapide de sa présence dans les IA.":
    "For a quick snapshot of your presence inside AI assistants.",
  "Pour comprendre sa position réelle sur son marché.":
    "To understand your real position in your market.",
  "Pour mesurer sa visibilité sur un marché étranger.":
    "To measure your visibility in a foreign market.",
  "Pour suivre son évolution, mois après mois.": "To track your progress, month after month.",
  "Pour savoir ce que les IA chinoises disent de vous.":
    "To find out what Chinese AIs say about you.",
  "Pour suivre la visibilité chinoise dans le temps.":
    "To track Chinese visibility over time.",
  "Exploration automatisée du site": "Automated crawl of your site",
  "Identification de l'entreprise et de ses activités": "Identification of the company and its activities",
  "Panel de questions commerciales": "A panel of commercial questions",
  "Vérification de la présence et de l'exactitude des réponses":
    "Check of presence and accuracy of the answers",
  "Rapport synthétique et premières recommandations": "Summary report and first recommendations",
  "Exploration technique et sémantique approfondie": "In-depth technical and semantic crawl",
  "Panel correspondant aux intentions réelles des acheteurs":
    "A panel matching what buyers actually ask",
  "Comparaison avec les concurrents": "Comparison against competitors",
  "Analyse des sources citées par les assistants": "Analysis of the sources assistants cite",
  "Détection des informations absentes, erronées ou contradictoires":
    "Detection of missing, wrong or contradictory information",
  "Analyse des données structurées et de la lisibilité machine":
    "Analysis of structured data and machine readability",
  "Plan d'amélioration hiérarchisé": "A prioritised improvement plan",
  "Audit complémentaire sur un marché étranger": "Additional audit on a foreign market",
  "Analyse dans une autre langue": "Analysis in another language",
  "Comparaison des concurrents locaux": "Comparison of local competitors",
  "Identification des sources et informations manquantes":
    "Identification of missing sources and information",
  "Le même panel de questions rejoué chaque mois": "The same question panel replayed every month",
  "Suivi des concurrents et des changements de position":
    "Tracking of competitors and position changes",
  "Repérage des nouvelles sources citées": "Spotting of newly cited sources",
  "Détection des réponses erronées ou des disparitions":
    "Detection of wrong answers or disappearances",
  "Rapport comparatif mensuel et historique conservé":
    "Monthly comparative report, with history kept",
  "Sept moteurs chinois : DeepSeek, Doubao, Qwen, Kimi, Yuanbao, ERNIE, GLM":
    "Seven Chinese engines: DeepSeek, Doubao, Qwen, Kimi, Yuanbao, ERNIE, GLM",
  "Questions posées EN chinois simplifié, pas traduites du français":
    "Questions asked IN simplified Chinese, not translated from French",
  "Réponses analysées en chinois avant d'être restituées en français":
    "Answers analysed in Chinese before being reported back",
  "Concurrents chinois et internationaux cités": "Chinese and international competitors cited",
  "Sources locales identifiées": "Local sources identified",
  "Recommandations pour améliorer sa visibilité en Chine":
    "Recommendations to improve your visibility in China",
  "Les mêmes sept moteurs, les mêmes questions, chaque mois":
    "The same seven engines, the same questions, every month",
  "Évolution de la visibilité chinoise": "Change in Chinese visibility",
  "Nouveaux concurrents et nouvelles sources": "New competitors and new sources",
  "L'assistant": "The assistant",
  "La fiche pro": "The pro page",
  "L'antenne": "The antenna",
  "Offre recommandée": "Recommended",
  "Les autres prix arrêtés": "The other fixed prices",
  // ── Corrections de défendabilité + comparaison (12/11/2026) ──
  "Express ou Expert : ce qui change":
    "Express or Expert: what changes",
  "Critère":
    "Criterion",
  "Assistants interrogés":
    "Assistants queried",
  "Questions commerciales":
    "Commercial questions",
  "Panel standard":
    "Standard panel",
  "Panel personnalisé":
    "Custom panel",
  "Identification sommaire":
    "Basic identification",
  "Analyse détaillée":
    "Detailed analysis",
  "Principales":
    "Main ones",
  "Analyse approfondie":
    "In-depth analysis",
  "Technique du site":
    "Site technicals",
  "Contrôle initial":
    "Initial check",
  "Audit complet":
    "Full audit",
  "Plan d'action":
    "Action plan",
  "Premières pistes":
    "First leads",
  "Priorisé et détaillé":
    "Prioritised and detailed",
  "agents IA distincts identifiés":
    "distinct AI agents identified",
  "Applebot, ClaudeBot, GPTBot et dix autres, reconnus à leur signature dans nos journaux. Chacun lit des pages ; ce qu'il en retient nourrira ses réponses.":
    "Applebot, ClaudeBot, GPTBot and ten others, recognised by their signature in our logs. Each one reads pages; what it retains will feed its answers.",
  "visites automatisées identifiées comme provenant d'agents IA":
    "automated visits identified as coming from AI agents",
  "Ces chiffres mesurent l'activité des robots sur notre infrastructure, pas le nombre de questions posées par les utilisateurs aux assistants.":
    "These figures measure robot activity on our infrastructure, not the number of questions users ask the assistants.",
  "Les traitements internes, le stockage de vos rapports et leur analyse sont réalisés sur notre infrastructure française. Les questions de mesure, elles, sont transmises aux assistants interrogés — ChatGPT, Gemini, Claude, Perplexity — dont les services sont opérés par des entreprises étrangères : c'est leur réponse que vous achetez, et il n'y a pas d'autre moyen de l'obtenir. Aucune donnée confidentielle n'est jamais communiquée volontairement dans ces requêtes.":
    "Internal processing, the storage of your reports and their analysis all run on our French infrastructure. The measurement questions, however, are sent to the assistants we query — ChatGPT, Gemini, Claude, Perplexity — whose services are operated by foreign companies: their answer is what you are buying, and there is no other way to obtain it. No confidential data is ever knowingly included in those requests.",
  "Des délais constatés, pas promis":
    "Timelines observed, not promised",
  "Sur ce que nous avons observé, un contenu nouveau met quatre à douze semaines à être pris en compte, et un site déjà bien référencé voit ses premières citations plus tôt. Ce sont des tendances constatées, pas une règle : les rythmes d'indexation et d'actualisation varient d'un système à l'autre, et aucun éditeur ne les publie. Nous vous dirons où vous en êtes, avec les chiffres — jamais une date de citation garantie.":
    "From what we have observed, new content takes four to twelve weeks to be taken into account, and an already well-ranked site sees its first citations sooner. These are observed tendencies, not a rule: indexing and refresh rhythms vary from one system to another, and no provider publishes them. We will tell you where you stand, with the numbers — never a guaranteed citation date.",
  "La surveillance IA très peu chère":
    "Very cheap AI monitoring",
  "Elle existe, et elle peut très bien convenir. Nous n'avons pas d'étude comparative à vous opposer, donc nous ne dirons pas ce qu'elle vaut. Regardez vous-même la chaîne avant de signer, chez nous comme ailleurs : où les données sont-elles hébergées, quels sous-traitants interviennent, comment les réponses sont-elles collectées, et quelle part du rapport est écrite par un humain. Quatre questions, quatre réponses vérifiables.":
    "It exists, and it may suit you perfectly well. We have no comparative study to set against it, so we will not tell you what it is worth. Look at the chain yourself before signing, with us as with anyone else: where is the data hosted, which subcontractors are involved, how are the answers collected, and how much of the report is written by a human. Four questions, four verifiable answers.",
  // ── Repris de GEO Expert (11/11/2026) ──
  "Ce que nous faisons autrement":
    "What we do differently",
  "Ce qu'on ne vous dira pas ailleurs":
    "What nobody else will tell you",
  "Questions fréquentes":
    "Frequently asked questions",
  "Une chaîne souveraine, et ce qui ne l'est pas":
    "A sovereign chain — and what isn't",
  "Nos audits, notre surveillance et nos rapports tournent sur une infrastructure française, avec des modèles d'analyse hébergés en France. Aucun contenu client ne part vers un outil de mesure américain. En revanche, les assistants que nous interrogeons — ChatGPT, Gemini, Claude, Perplexity — sont américains : c'est leur réponse que vous achetez, et nous ne pouvons pas l'obtenir autrement qu'en les interrogeant.":
    "Our audits, our monitoring and our reports run on French infrastructure, with analysis models hosted in France. No client content is ever sent to an American measurement tool. The assistants we query — ChatGPT, Gemini, Claude, Perplexity — are American, however: their answer is what you are buying, and there is no way to obtain it other than by asking them.",
  "Un écosystème de sources, pas un site isolé":
    "An ecosystem of sources, not an isolated site",
  "Les IA citent les organisations qu'elles rencontrent plusieurs fois, sur des sources indépendantes. Nous exploitons les nôtres — un annuaire national, des plateformes de données, des sites thématiques — que les modèles ont appris à consulter. Y rendre votre information présente et vérifiable est le cœur du travail.":
    "AIs cite organisations they meet repeatedly, across independent sources. We run our own — a national directory, data platforms, thematic sites — which the models have learned to consult. Making your information present and verifiable there is the heart of the work.",
  "Une surveillance qui ne s'arrête pas au rapport":
    "Monitoring that does not stop at the report",
  "La plupart des missions se terminent avec le document. L'abonnement de surveillance rejoue chaque mois le même panel de questions, suit vos concurrents, et vous alerte quand une réponse devient fausse ou qu'un nouveau nom apparaît à votre place.":
    "Most engagements end with the document. The monitoring subscription replays the same question panel every month, tracks your competitors, and alerts you when an answer turns wrong or a new name appears in your place.",
  "Des délais annoncés, pas promis":
    "Timelines stated, not promised",
  "Les moteurs absorbent un contenu nouveau sur quatre à douze semaines. Un site déjà bien référencé voit ses premières citations en trois à huit semaines ; un site récent doit d'abord construire ses fondations. Nous vous dirons dans quel cas vous êtes, avec les chiffres — jamais une date de citation garantie, parce que personne ne peut honnêtement en donner une.":
    "Engines absorb new content over four to twelve weeks. An already well-ranked site sees its first citations within three to eight weeks; a recent site must build foundations first. We will tell you which case is yours, with the numbers — never a guaranteed citation date, because nobody can honestly give one.",
  "« Recommandé par ChatGPT en 30 jours »":
    "\u201cRecommended by ChatGPT in 30 days\u201d",
  "Vous croiserez cette promesse, parfois avec un remboursement à la clé sur le même délai. Elle ne peut pas être tenue de bonne foi : les modèles absorbent les contenus sur des cycles de quatre à douze semaines. Nous préférons vous montrer des courbes mesurées, des captures datées et des délais réels. C'est plus lent à vendre, et c'est la seule chose qui tienne.":
    "You will meet this promise, sometimes with a money-back guarantee on the same timeframe. It cannot be honoured in good faith: models absorb content over four-to-twelve-week cycles. We would rather show you measured curves, dated captures and real timelines. It is slower to sell, and it is the only thing that holds.",
  "La surveillance IA à moins de 100 € par mois":
    "AI monitoring for under €100 a month",
  "Elle existe. Regardez la chaîne avant de signer : dans la plupart des cas, votre contenu et les réponses transitent par un outil américain, et le « rapport » est un document produit sans aucune intervention humaine. Posez toujours deux questions — où sont hébergées les données, et qui écrit le rapport.":
    "It exists. Look at the chain before signing: in most cases your content and the answers travel through an American tool, and the \u201creport\u201d is a document produced with no human involvement at all. Always ask two questions — where the data is hosted, and who writes the report.",
  "Sous combien de temps verrai-je un résultat ?":
    "How soon will I see a result?",
  "Quatre à douze semaines selon l'état de départ : trois à huit semaines pour un site déjà bien référencé, davantage pour un site récent qui doit d'abord construire ses fondations. L'audit vous dit dans quel cas vous êtes, avec les chiffres.":
    "Four to twelve weeks depending on your starting point: three to eight weeks for an already well-ranked site, longer for a recent one that must build foundations first. The audit tells you which case is yours, with the numbers.",
  "Le GEO remplace-t-il le référencement classique ?":
    "Does GEO replace traditional SEO?",
  "Non. Un site invisible pour Google l'est aussi pour les assistants, qui s'appuient largement sur le web indexé. Le GEO s'ajoute : il travaille la compréhension par les machines là où le SEO travaille le classement.":
    "No. A site invisible to Google is invisible to the assistants too, since they lean heavily on the indexed web. GEO is additive: it works on machine understanding where SEO works on ranking.",
  "Où sont hébergées mes données ?":
    "Where is my data hosted?",
  "En France, sur un serveur dédié chez OVH, à Roubaix. Le site, les analyses et les rapports tiennent sur une seule machine. Les assistants interrogés, eux, sont américains : c'est leur réponse que nous mesurons, nous ne pouvons pas l'obtenir ailleurs.":
    "In France, on a dedicated server at OVH in Roubaix. The site, the analyses and the reports all run on one machine. The assistants we query are American: their answer is what we measure, and it cannot be obtained anywhere else.",
  "Nous sommes une petite structure — est-ce pour nous ?":
    "We are a small organisation — is this for us?",
  "Oui, et c'est là que l'écart se creuse le plus vite. Commencez par l'Express à 149 € : vous saurez si vous existez pour les assistants avant d'engager quoi que ce soit de plus.":
    "Yes, and this is where the gap widens fastest. Start with Express at €149: you will know whether you exist for the assistants before committing to anything more.",
  "Que se passe-t-il si une IA raconte quelque chose de faux sur nous ?":
    "What if an AI says something false about us?",
  "Nous le documentons avec la réponse brute et sa date, puis nous remontons à la source que le modèle a utilisée. Corriger la source est le seul levier réel : personne ne peut éditer la réponse d'un assistant.":
    "We document it with the raw answer and its date, then trace back to the source the model used. Correcting the source is the only real lever: nobody can edit an assistant's answer.",
  "Puis-je arrêter la surveillance ?":
    "Can I stop the monitoring?",
  "Oui, sans préavis ni engagement de durée. L'historique de vos mesures vous reste.":
    "Yes, with no notice period and no minimum term. The history of your measurements stays yours.",
  "Qui êtes-vous ?":
    "Who are you?",
  "Alliance MANA, association déclarée loi 1901 (RNA W292008256), dont l'objet est de rendre les territoires et leurs acteurs lisibles par tout moyen numérique, y compris l'intelligence artificielle. Nous mesurons d'abord sur nos propres sites.":
    "Alliance MANA, a declared French association under the 1901 law (register number W292008256), whose object is to make territories and their actors legible by any digital means, including artificial intelligence. We measure on our own sites first.",
  "Facturation et TVA ?":
    "Invoicing and VAT?",
  "Tous les prix affichés sont hors taxes. La facture est émise par Alliance MANA, et vous l'acceptez avant tout travail.":
    "All prices shown exclude tax. The invoice is issued by Alliance MANA, and you accept it before any work begins.",
  // ── Relecture commerciale du 11/11/2026 ──
  "MANAhome mesure ce que les assistants IA répondent sur les organisations : audits ponctuels, surveillance mensuelle, infrastructure lisible par les machines. Édité par Alliance MANA, association loi 1901. Être mieux compris améliore vos chances d'être cité ; aucune IA ne peut être obligée de le faire.":
    "MANAhome measures what AI assistants answer about organisations: one-off audits, monthly monitoring, machine-readable infrastructure. Published by Alliance MANA, a French non-profit association. Being better understood improves your odds of being cited; no AI can be made to cite you.",
  "Vous repartez avec une mesure que vous pouvez défendre : les réponses brutes, leurs sources, la date et le protocole. Personne ne peut l'acheter — ni vous, ni vos concurrents : le registre territorial de l'écosystème est non marchand, sans mise en avant payante ni ordre négociable. C'est ce qui rend le résultat opposable le jour où votre conseil, votre direction ou votre financeur vous demandera d'où il sort.":
    "You leave with a measurement you can defend: the raw answers, their sources, the date and the protocol. Nobody can buy it — neither you nor your competitors: the ecosystem's territorial registry is non-commercial, with no paid placement and no negotiable ranking. That is what makes the result hold up the day your board, your management or your funder asks where it came from.",
  "Ce que les IA disent de vous, mesuré et documenté.": "What AIs say about you, measured and documented.",
  "Vous saurez où vous en êtes, vraiment": "You will know where you really stand",
  "Vous verrez, noir sur blanc, ce que ChatGPT, Gemini, Claude et Perplexity répondent quand on leur demande un professionnel comme vous — et pourquoi ils citent qui ils citent. Aucune agence ne peut garantir une recommandation ; nous, nous pouvons vous montrer la réalité.":
    "You will see, in black and white, what ChatGPT, Gemini, Claude and Perplexity answer when someone asks for a professional like you — and why they cite whom they cite. No agency can guarantee a recommendation; we can show you the reality.",
  "Un résultat que personne ne peut acheter": "A result nobody can buy",
  "Ni vous ni vos concurrents ne pouvez infléchir un audit en achetant quoi que ce soit. C'est ce qui vous permet de le poser sur la table d'un conseil d'administration ou d'un financeur sans qu'on vous demande qui l'a payé.":
    "Neither you nor your competitors can sway an audit by buying anything. That is what lets you put it on the table of a board or a funder without being asked who paid for it.",
  "Un audit que vous pouvez rejouer": "An audit you can replay",
  "Vous saurez ce qui a été mesuré": "You will know what was measured",
  "Chaque réponse du rapport porte son moteur, sa date et son mode de collecte. Copilot et Google AI Overviews n'offrent aucun accès mesurable : ils apparaissent en « non testé », et ne pèsent jamais contre vous dans le résultat.":
    "Every answer in the report carries its engine, its date and its collection mode. Copilot and Google AI Overviews offer no measurable access: they appear as not tested, and never count against you in the result.",
  "Une méthode déjà éprouvée en vrai": "A method already proven in the field",
  "Les prix affichés sont des prix publics, hors taxes. Une demande envoyée depuis ce site est enregistrée sur nos serveurs, et vous en recevez confirmation par courriel. Elle ne vaut pas commande : toute prestation fait l'objet d'un devis ou d'une facture émise par Alliance MANA, que vous acceptez avant tout travail.":
    "The prices shown are public prices, excluding tax. A request sent from this site is recorded on our servers, and you receive an email confirmation. It is not an order: every service is covered by a quote or an invoice issued by Alliance MANA, which you accept before any work begins.",
  "Le test gratuit": "The free test",
  "L'adresse que vous saisissez dans le test de lisibilité est envoyée à notre serveur, qui consulte la page publique correspondante comme le ferait un moteur de recherche. Aucun compte, aucune adresse de courriel, aucun suivi : le test ne conserve rien de vous.":
    "The address you type into the readability test is sent to our server, which fetches the matching public page the way a search engine would. No account, no email address, no tracking: the test keeps nothing about you.",
  "Ce site ne dépose aucun traceur et n'a pas de compte utilisateur. Les informations que vous saisissez dans le formulaire ne quittent votre navigateur qu'au moment où vous cliquez sur « Envoyer » : elles sont alors enregistrées sur nos serveurs, en France, pour traiter votre demande et vous répondre. Aucune donnée, aucun contact n'est revendu, et vous pouvez en demander la suppression à tout moment.":
    "This site sets no tracker and has no user account. What you type into the form leaves your browser only when you click Send: it is then recorded on our servers, in France, to handle your request and reply to you. No data and no contact is ever resold, and you can ask for deletion at any time.",
  // ── Compteur vivant, objet statutaire, formulaire branché (11/11/2026) ──
  "sur l'ensemble de l'écosystème MANA, depuis": "across the whole MANA ecosystem, for the past",
  "jours": "days",
  "Ils passent, qu'on le sache ou non.": "They come through, whether you know it or not.",
  "Alliance MANA poursuit un but non lucratif et d'intérêt général. Elle a pour objet : rendre, depuis la Bretagne, les territoires et leurs acteurs lisibles et accessibles par tout moyen numérique, y compris l'intelligence artificielle ; concevoir, développer et exploiter tout outil, média, service ou assistant numérique, notamment conversationnel, au service des personnes, des familles et des territoires ; promouvoir une doctrine éthique du numérique et des données personnelles ; valoriser l'économie sociale et solidaire et la vie associative ; exercer, à titre accessoire, toute activité destinée à assurer son financement, en France et à l'international.":
    "Alliance MANA pursues a non-profit purpose in the general interest. Its object is: to make, from Brittany, territories and their actors legible and accessible by any digital means, including artificial intelligence; to design, develop and operate any digital tool, medium, service or assistant, in particular conversational ones, serving people, families and territories; to promote an ethical doctrine of digital technology and personal data; to champion the social and solidarity economy and associative life; and, on an ancillary basis, to carry out any activity intended to secure its funding, in France and internationally.",
  "Objet statutaire — association loi du 1er juillet 1901, RNA W292008256":
    "Statutory object — association under the French law of 1 July 1901, register number W292008256",
  "Votre nom": "Your name",
  "Votre fonction": "Your role",
  "Code postal": "Postal code",
  "En une phrase : ce que vous aimeriez que les IA répondent à votre sujet":
    "In one sentence: what you would like the AIs to answer about you",
  "Ne pas remplir ce champ": "Do not fill this field",
  "Envoyer ma demande": "Send my request",
  "Envoi…": "Sending…",
  "Votre demande est enregistrée. Vous recevez une confirmation par courriel, et une réponse sous deux jours ouvrés.":
    "Your request is recorded. You will receive an email confirmation, and a reply within two business days.",
  "Cette adresse de courriel ne semble pas valide.": "That email address does not look valid.",
  "La demande n'a pas pu être envoyée. Réessayez dans un instant, ou écrivez-nous directement.":
    "The request could not be sent. Try again in a moment, or write to us directly.",
  "Réponse sous deux jours ouvrés. Vos données ne sont jamais revendues.":
    "Reply within two business days. Your data is never resold.",
  // ── La sonde GEO du header (11/11/2026) ──
  "Testez la lisibilité machine de votre site": "Test how machine-readable your site is",
  "Tester — gratuit, 30 s": "Test it — free, 30 s",
  "Analyse…": "Analysing…",
  "Les dix critères de lisibilité machine sont satisfaits.":
    "All ten machine-readability criteria are met.",
  "Le test n'a pas abouti. Cela peut venir de la sonde ou de l'adresse saisie — pas forcément de votre site. Réessayez dans un instant.":
    "The test did not complete. That may come from the probe or from the address entered — not necessarily from your site. Try again in a moment.",
  "Ce test lit votre page : llms.txt, robots.txt, données structurées, canonique, langue, fraîcheur. Il n'interroge aucun assistant et ne dit rien de ce que ChatGPT ou Gemini répondent à votre sujet — c'est l'objet de l'audit.":
    "This test reads your page: llms.txt, robots.txt, structured data, canonical, language, freshness. It queries no assistant and says nothing about what ChatGPT or Gemini answer about you — that is what the audit is for.",
  // ── /approche et /mentions-legales, refaites pour le GEO (11/11/2026) ──
  "Mesurer ce que les IA répondent. Rien de plus, rien de moins.":
    "Measuring what AIs answer. Nothing more, nothing less.",
  "L'expertise GEO, par Alliance MANA — pour les pros et les structures.":
    "GEO expertise, by Alliance MANA — for professionals and organisations.",
  "Voici, noir sur blanc, ce que nous faisons et ce que nous ne ferons jamais. Si un point vous paraît trop prudent, c'est voulu : une promesse qu'on ne peut pas tenir se paie au premier client.":
    "Here, in black and white, is what we do and what we will never do. If a point reads as over-cautious, that is deliberate: a promise you cannot keep is paid for with the first client.",
  "Voir les offres et les prix": "See the offers and prices",
  "Dites-nous qui vous êtes et ce que vous cherchez. Nous répondons avec un devis ou une commande, jamais avec une relance automatique.":
    "Tell us who you are and what you are looking for. We reply with a quote or an order, never with an automated follow-up.",
  "Nous mesurons, nous ne promettons pas": "We measure, we do not promise",
  "Aucune agence ne peut garantir qu'un assistant IA vous recommandera : personne ne contrôle ce que répond ChatGPT. Nous mesurons ce qu'ils répondent vraiment, nous le documentons, et nous expliquons pourquoi.":
    "No agency can guarantee that an AI assistant will recommend you: nobody controls what ChatGPT answers. We measure what they actually answer, we document it, and we explain why.",
  "L'audit ne se vend pas lui-même": "The audit does not sell itself",
  "Nous ne vendons pas ce que nous mesurons. Aucune prestation d'optimisation ne peut modifier les conclusions d'un audit — c'est la seule façon qu'un audit vaille quelque chose.":
    "We do not sell what we measure. No optimisation service can change an audit's conclusions — that is the only way an audit is worth anything.",
  "Vous recevez les réponses, pas un score": "You receive the answers, not a score",
  "Les questions exactes, les réponses intégrales des assistants, les sources citées, les concurrents nommés à votre place. Un indice qu'on ne peut pas vérifier ne vaut rien ; une réponse qu'on peut relire se discute.":
    "The exact questions, the assistants' full answers, the sources cited, the competitors named in your place. An index you cannot check is worth nothing; an answer you can re-read can be discussed.",
  "Reproductible, ou ce n'est pas une mesure": "Reproducible, or it is not a measurement",
  "Date, heure, langue, localisation, environnement de collecte, version du modèle, nombre de répétitions. Une réponse d'IA varie d'un essai à l'autre : sans protocole, une variation du hasard se vend comme un progrès.":
    "Date, time, language, location, collection environment, model version, number of repetitions. An AI answer varies from one run to the next: without a protocol, random variation gets sold as progress.",
  "Ce que nous ne savons pas faire, nous le disons": "What we cannot do, we say so",
  "Microsoft Copilot et Google AI Overviews n'exposent aucun accès permettant de les mesurer sans gratter leur interface. Ils sont déclarés « non testés » dans nos rapports — jamais comptés comme une absence de votre entreprise.":
    "Microsoft Copilot and Google AI Overviews expose no access that would let us measure them without scraping their interface. They are reported as not tested — never counted as your company being absent.",
  "Nous mesurons d'abord chez nous": "We measure on our own sites first",
  "Du 20 septembre au 11 novembre 2026 — 52 jours — nos journaux ont compté 14 853 183 requêtes d'agents IA sur mana.bzh et manafrance.org. Nous ne vous proposons rien que nous n'ayons posé sur nos propres sites d'abord.":
    "Between 20 September and 11 November 2026 — 52 days — our logs counted 14,853,183 AI-agent requests on mana.bzh and manafrance.org. We offer you nothing we have not put on our own sites first.",
  // « Informations légales » existe déjà plus haut — ne pas la redéclarer (TS1117).
  // « Mentions légales » existe déjà plus haut — ne pas la redéclarer (TS1117).
  // « Éditeur » existe déjà plus haut — ne pas la redéclarer (TS1117).
  "Numéro RNA": "French association register number",
  "Siège social": "Registered office",
  "Directeur de la publication": "Publication director",
  // « Hébergement » existe déjà plus haut — ne pas la redéclarer (TS1117).
  // « Nature du service » existe déjà plus haut — ne pas la redéclarer (TS1117).
  "Prix et commandes": "Prices and orders",
  // « Données personnelles » existe déjà plus haut — ne pas la redéclarer (TS1117).
  // « Retour à l'accueil » existe déjà plus haut — ne pas la redéclarer (TS1117).
  "Association déclarée, régie par la loi du 1er juillet 1901 et le décret du 16 août 1901":
    "Declared association, governed by the French law of 1 July 1901 and the decree of 16 August 1901",
  "Déclarée le 10 août 2026 auprès de la Sous-préfecture de Brest":
    "Declared on 10 August 2026 with the Sub-prefecture of Brest",
  "Serveur dédié situé en France. Le site, les interfaces et les données tiennent sur une seule machine.":
    "Dedicated server located in France. The site, the interfaces and the data all run on one machine.",
  "MANAhome est la vitrine du GEO et des offres de l'écosystème MANA, éditée par Alliance MANA. Le GEO consiste à mesurer ce que les assistants IA répondent au sujet d'une organisation, et à rendre cette organisation compréhensible par ces machines.":
    "MANAhome is the showcase of the GEO and the offers of the MANA ecosystem, published by Alliance MANA. GEO means measuring what AI assistants answer about an organisation, and making that organisation understandable to those machines.",
  "MANAhome ne garantit ni indexation, ni citation, ni recommandation par un assistant IA : personne ne contrôle ce que répond un modèle. L'audit mesure et documente — il ne vend aucune position. Il reste indépendant de toute prestation d'optimisation.":
    "MANAhome guarantees neither indexing, nor citation, nor recommendation by an AI assistant: nobody controls what a model answers. The audit measures and documents — it sells no position. It stays independent of any optimisation service.",
  "Les prix affichés sont des prix arrêtés, hors taxes. Aucune commande n'est enregistrée depuis ce site : une demande ouvre votre logiciel de courriel, et rien n'est transmis avant que vous ne l'envoyiez vous-même. Toute prestation fait l'objet d'un devis ou d'une facture émise par la structure qui la réalise.":
    "The prices shown are fixed prices, excluding tax. No order is recorded from this site: a request opens your email client, and nothing is sent until you send it yourself. Every service is covered by a quote or an invoice issued by the organisation that performs it.",
  "Ce site ne dépose aucun traceur et ne collecte aucune donnée personnelle par lui-même : il n'a ni compte, ni formulaire enregistré côté serveur. Les informations que vous saisissez dans le formulaire de demande restent dans votre navigateur jusqu'à ce que vous les envoyiez par votre propre messagerie. Aucune donnée ni aucun contact n'est revendu.":
    "This site sets no tracker and collects no personal data by itself: it has no account and no server-side form. What you type into the request form stays in your browser until you send it from your own email client. No data and no contact is ever resold.",
  "Pour exercer vos droits d'accès, de rectification ou de suppression sur un échange déjà engagé, écrivez à":
    "To exercise your rights of access, correction or deletion on an exchange already under way, write to",
  // ── §6 : les trois environnements de collecte ──
  "Trois environnements de collecte, jamais confondus": "Three collection environments, never conflated",
  "L'API du modèle": "The model's API",
  "On interroge le modèle directement. Reproductible, horodaté, rejouable — mais ce n'est pas l'écran que voit un utilisateur.":
    "The model is queried directly. Reproducible, timestamped, replayable — but it is not the screen a user sees.",
  "L'assistant public": "The public assistant",
  "Le produit tel qu'il est réellement utilisé, avec sa recherche et ses réglages. Plus proche du vrai, moins facile à rejouer à l'identique.":
    "The product as it is actually used, with its search and its settings. Closer to reality, harder to replay identically.",
  "La recherche locale": "Local search",
  "Baidu et les plateformes éditoriales chinoises, selon le secteur : ce que l'écosystème rend accessible aux moteurs.":
    "Baidu and Chinese editorial platforms, depending on the sector: what the ecosystem makes accessible to engines.",
  "Chaque réponse du rapport indique l'environnement qui l'a produite. Les sept moteurs chinois ne sont pas accessibles par une API identique, et ne sont donc pas testés dans les mêmes conditions : un moteur dont la collecte n'a pas fonctionné est déclaré « non testé », jamais présenté comme testé.":
    "Every answer in the report states the environment that produced it. The seven Chinese engines are not reachable through one identical API, and are therefore not tested under the same conditions: an engine whose collection did not work is reported as not tested, never presented as tested.",
  // ── Formulaire de demande (§8, 11/11/2026) ──
  "Demander un audit, ou poser une question": "Request an audit, or ask a question",
  "Organisation": "Organisation",
  "Site web": "Website",
  "Courriel": "Email",
  "Offre souhaitée": "Offer wanted",
  "— choisir —": "— choose —",
  "Je ne sais pas encore": "I don't know yet",
  "Secteur d'activité": "Sector",
  "Territoire ou marché visé": "Territory or market",
  "Votre message": "Your message",
  "Préparer ma demande": "Prepare my request",
  "Demande": "Request",
  "Le bouton ouvre votre logiciel de courriel avec la demande déjà rédigée. Rien n'est transmis avant que vous l'envoyiez vous-même.":
    "The button opens your email client with the request already written. Nothing is sent until you send it yourself.",
  "Votre logiciel de courriel vient de s'ouvrir avec votre demande. Elle ne part que lorsque vous cliquez sur « Envoyer » chez vous — rien n'a encore été transmis.":
    "Your email client has just opened with your request. It is only sent when you click Send on your side — nothing has been transmitted yet.",
  "Rien ne s'est ouvert ? Écrivez-nous directement à": "Nothing opened? Write to us directly at",
  "en recopiant ce texte :": "copying this text:",
  "Copier le texte": "Copy the text",
  "Texte copié": "Text copied",
  "Faire une autre demande": "Make another request",
  // ── §3 : le constat, en faits mesurés ──
  "requêtes d'agents IA": "AI-agent requests",
  "sur mana.bzh et manafrance.org, du 20 septembre au 11 novembre 2026 — 52 jours. Ils passent, qu'on le sache ou non.":
    "on mana.bzh and manafrance.org, from 20 September to 11 November 2026 — 52 days. They come through, whether you know it or not.",
  "agents IA distincts": "distinct AI agents",
  "Applebot 4 096 023 · ClaudeBot 3 768 383 · GPTBot 3 091 026, et dix autres — chacun lit, retient, et répondra avec ce qu'il a retenu.":
    "Applebot 4,096,023 · ClaudeBot 3,768,383 · GPTBot 3,091,026, and ten others — each one reads, retains, and will answer with what it retained.",
  "démarche à faire pour qu'ils viennent": "steps needed to make them come",
  "Ils sont déjà là. La seule question est ce qu'ils comprennent de vous.":
    "They are already here. The only question is what they understand about you.",
  "Pourquoi nous croire ? Parce que nous ne vendons pas ce que nous mesurons. Le registre territorial de l'écosystème est non marchand : aucune mise en avant payante, aucun ordre achetable. L'audit reste indépendant de toute prestation d'optimisation — aucun achat ne peut en modifier les conclusions. Nous mesurons d'abord sur nos propres sites avant de le proposer aux vôtres. Et nous disons ce que nous ne savons pas faire : la structuration améliore les chances d'être compris et trouvé, elle ne garantit pas qu'un assistant indexera ou citera une page.":
    "Why trust us? Because we do not sell what we measure. The ecosystem's territorial registry is non-commercial: no paid placement, no purchasable ranking. The audit stays independent of any optimisation service — no purchase can change its conclusions. We measure on our own sites first, before offering it for yours. And we say what we cannot do: structuring improves the odds of being understood and found, it does not guarantee that an assistant will index or cite a page.",
  // ── Maquette de rapport GEO (11/11/2026) ──
  "Exemple illustratif — aucune entreprise réelle, aucun résultat réel. Cette maquette montre la forme du livrable.":
    "Illustrative example — no real company, no real results. This mock-up shows the shape of the deliverable.",
  "La question posée": "The question asked",
  "Quels hébergements recommandez-vous pour un week-end en presqu'île de Crozon ?":
    "Which places to stay would you recommend for a weekend on the Crozon peninsula?",
  "Assistant": "Assistant",
  "Ce qu'il a répondu": "What it answered",
  "Concurrents": "Competitors",
  "Sources citées": "Sources cited",
  "Citée en 3ᵉ position. Activité correctement décrite, horaires absents.":
    "Cited in 3rd place. Activity correctly described, opening hours missing.",
  "2 cités avant": "2 cited before",
  "site officiel, office de tourisme": "official site, tourist office",
  "Citée, mais confondue avec un établissement du même nom à 40 km.":
    "Cited, but confused with a same-named business 40 km away.",
  "4 cités avant": "4 cited before",
  "annuaire tiers, avis": "third-party directory, reviews",
  "Non citée. Aucune source la concernant n'apparaît dans la réponse.":
    "Not cited. No source about it appears in the answer.",
  "5 cités": "5 cited",
  "guides régionaux": "regional guides",
  "Citée en 1ʳᵉ position, avec un lien direct vers le site.":
    "Cited in 1st place, with a direct link to the site.",
  "3 cités après": "3 cited after",
  "site officiel, presse locale": "official site, local press",
  "Non testé : aucun accès ne permet de le mesurer sans gratter son interface.":
    "Not tested: no access allows measuring it without scraping its interface.",
  "Non testé, même raison. Une absence de test n'est jamais comptée comme une absence de l'entreprise.":
    "Not tested, same reason. A missing test is never counted as the company being missing.",
  "Vous recevez la réponse intégrale de chaque assistant, pas ce résumé — et avec elle, tout ce qui permet de la rejouer :":
    "You receive each assistant's full answer, not this summary — and with it, everything needed to replay it:",
  "Date et heure exactes du test": "Exact date and time of the test",
  "Langue et localisation de la question": "Language and location of the question",
  "Environnement : API du modèle, ou assistant public":
    "Environment: the model's API, or the public assistant",
  "Recherche web activée ou non": "Web search on or off",
  "Version du modèle lorsqu'elle est exposée": "Model version when it is exposed",
  "Nombre de répétitions, car une réponse varie d'un essai à l'autre":
    "Number of repetitions, because an answer varies from one run to the next",
  "C'est ce qui sépare une mesure d'une impression : un audit qu'on ne peut pas rejouer ne prouve rien, et un score seul ne se vérifie pas.":
    "This is what separates a measurement from an impression: an audit you cannot replay proves nothing, and a score on its own cannot be checked.",
  "Les audits — une commande, un livrable": "The audits — one order, one deliverable",
  "La surveillance — chaque mois, le même protocole": "The monitoring — the same protocol, every month",
  "Option sur GEO Expert": "Add-on to GEO Expert",
  "Audit complémentaire — se commande seul ou après un GEO Expert":
    "Additional audit — ordered on its own or after a GEO Expert",
  "Complément de GEO Monitoring": "Add-on to GEO Monitoring",
  "Commander un audit": "Order an audit",
  "Nous interrogeons les quatre assistants que vos clients utilisent vraiment : ChatGPT, Gemini, Claude et Perplexity. Copilot et Google AI Overviews n'offrent aucun accès mesurable — nous l'écrivons dans le rapport plutôt que d'inventer un chiffre. Vous saurez toujours ce qui a été mesuré, et ce qui ne l'a pas été.":
    "We query the four assistants your customers actually use: ChatGPT, Gemini, Claude and Perplexity. Copilot and Google AI Overviews offer no measurable access — we write that in the report rather than invent a figure. You will always know what was measured, and what was not.",
  "Personne ne peut garantir qu'une IA vous recommandera. Nous vendons la mesure, pas la promesse : vous recevez ce que les assistants répondent vraiment, avec leurs sources. Et aucun achat ne peut modifier les conclusions d'un audit — c'est précisément ce qui les rend utilisables face à votre direction ou à votre conseil.":
    "Nobody can guarantee an AI will recommend you. We sell the measurement, not the promise: you receive what the assistants actually answer, with their sources. And no purchase can change an audit's conclusions — which is exactly what makes them usable in front of your board.",
  "Où en êtes-vous dans les assistants ? Qu'est-ce qui vous empêche d'être compris, trouvé, cité ? L'audit interroge quatre assistants — ChatGPT, Gemini, Claude et Perplexity — avec un panel de questions que vos acheteurs poseraient vraiment, et vous rend leurs réponses intégrales, leurs sources, et les concurrents cités à votre place.":
    "Where do you stand inside AI assistants? What stops you from being understood, found, cited? The audit queries four assistants — ChatGPT, Gemini, Claude and Perplexity — with a panel of questions your buyers would really ask, and hands you their full answers, their sources, and the competitors named in your place.",
  "Commencez par l'Express à 149 € pour voir où vous en êtes. Passez à l'Expert à 390 € quand vous voulez savoir qui est cité à votre place, et pourquoi. Chaque audit se commande seul : pas d'abonnement imposé, pas d'engagement, et vous connaissez le prix avant de nous écrire. Vous recevez un rapport, les réponses intégrales des assistants, et un plan d'action hiérarchisé.":
    "Start with Express at €149 to see where you stand. Move to Expert at €390 when you want to know who is cited in your place, and why. Each audit is ordered on its own: no forced subscription, no commitment, and you know the price before writing to us. You receive a report, the assistants' full answers, and a prioritised action plan.",

  // ── Vitrine GEO (11/11/2026) ── ⚠️ « Notre approche » existe DÉJÀ plus bas
  // dans ce dictionnaire : le redéclarer ici fait refuser tsc (TS1117).
  "Offres & tarifs": "Offers & pricing",
  "Demander un audit": "Request an audit",
  "Voir les offres": "See the offers",
  "Contact": "Contact",
  "L'expertise GEO, par Alliance MANA": "GEO expertise, by Alliance MANA",
  "Vos clients demandent à ChatGPT. Savez-vous ce qu'il répond sur vous ? Testez votre site en 30 secondes, gratuitement — puis mesurez votre visibilité réelle à partir de 149 €.":
    "Your customers ask ChatGPT. Do you know what it answers about you? Test your site in 30 seconds, free — then measure your real visibility from €149.",
  "Être trouvé par les IA": "Be found by AIs",
  "Vos clients ne cherchent plus seulement. Ils demandent.":
    "Your customers no longer just search. They ask.",
  "Quand quelqu'un demande à ChatGPT ou à Gemini un professionnel comme vous, l'assistant répond avec ce qu'il a lu et retenu du web. S'il ne vous a pas compris, il cite quelqu'un d'autre — et vous ne le saurez jamais : il n'y a ni classement à consulter, ni compte à ouvrir. Le GEO, c'est rendre une organisation compréhensible par ces machines : llms.txt, Model Context Protocol, données structurées. Alliance MANA produit cette infrastructure elle-même — ce que ni les agences de contenu, ni les tableaux de bord de mesure ne proposent.":
    "When someone asks ChatGPT or Gemini for a professional like you, the assistant answers with what it has read and retained from the web. If it has not understood you, it cites someone else — and you will never know: there is no ranking to consult, no account to open. GEO means making an organisation understandable to these machines: llms.txt, Model Context Protocol, structured data. Alliance MANA builds that infrastructure itself — what neither content agencies nor measurement dashboards offer.",
  "L'audit GEO de votre structure": "The GEO audit of your organisation",
  "Mairies, associations, offices de tourisme, entreprises.":
    "Town halls, associations, tourist offices, businesses.",
  "Où en êtes-vous dans les assistants ? Qu'est-ce qui vous empêche d'être compris, trouvé, cité ? L'audit mesure l'état réel, puis la mise en œuvre suit : structuration, exposition, interrogeabilité. Sur devis — aucun prix n'est arrêté à ce jour, et nous n'en affichons pas.":
    "Where do you stand in AI assistants? What stops you from being understood, found, cited? The audit measures the real state, then implementation follows: structuring, exposure, queryability. On quote — no price has been fixed to this day, and we display none.",
  "Combien ça coûte, et ce que vous recevez": "What it costs, and what you get",
  "Des prix publics, un livrable daté, aucun devis à attendre.":
    "Public prices, a dated deliverable, no quote to wait for.",
  "L'assistant : 9 €/mois par humain, jamais par structure. La fiche pro : 9 €. L'antenne : 9 €. Ces prix sont arrêtés — tout ce qui ne l'est pas reste sur devis, et le site ne l'invente pas.":
    "The assistant: €9/month per human, never per organisation. The pro page: €9. The antenna: €9. These prices are fixed — everything that is not remains on quote, and the site invents none.",
  "Les machines interrogent. MANA tient le registre honnête.":
    "Machines ask questions. MANA keeps the honest registry.",
  "Vitrine du GEO et des offres de l'écosystème MANA, éditée par Alliance MANA. Prix affichés : uniquement les prix arrêtés — tout le reste est sur devis. Le GEO améliore les chances d'être compris et trouvé par les assistants IA ; il ne garantit ni indexation, ni citation, ni recommandation.":
    "Showcase of the GEO and the offers of the MANA ecosystem, published by Alliance MANA. Prices shown: fixed prices only — everything else is on quote. GEO improves the odds of being understood and found by AI assistants; it guarantees neither indexing, nor citation, nor recommendation.",

  // ── Barre de navigation ──
  "Vacances": "Stays",
  "Territoire": "Territory",
  "Publier": "Publish",
  "Changer de langue": "Switch language",

  // ── Moteur de recherche de l'accueil (repositionné 04/11/2026 : location
  // de vacances uniquement, plus de choix acheter/vendre/services) ──
  "Je cherche": "I'm looking for",
  "Trouver un séjour": "Find a stay",
  "Louer mon bien": "List my property",
  "Commune ou code postal": "Town or postcode",
  "Rechercher": "Search",

  // ── Hero (repositionné 12/11/2026 : la maison des IA) ──
  "La maison des IA": "The house of AIs",

  // ── Sections de l'accueil ──
  "Découvrez les séjours": "Explore the stays",
  "Des locations de vacances, près de chez vous": "Holiday rentals, near you",
  "Un accès direct aux annonces, sans compte à créer. Le catalogue est volontairement restreint et soigné — chaque fiche est structurée, sourcée, honnête.":
    "Direct access to listings, no account needed. The catalogue is deliberately small and carefully kept — every listing is structured, sourced, honest.",
  "Parcourir le catalogue": "Browse the catalogue",
  "Louez votre logement avec MANA": "List your property with MANA",
  "Vous gardez la main. MANA vous accompagne.": "You stay in charge. MANA supports you.",
  "Préparation de l'annonce, documents à prévoir (déclaration de meublé touristique, attestation d'assurance), calendrier de réservation : le propriétaire reste maître de son bien.":
    "Listing preparation, documents to plan (short-term rental declaration, insurance certificate), booking calendar: the owner stays in charge of their property.",
  "Publier mon annonce": "Publish my listing",
  "Les machines interrogent. MANAhome tient le registre honnête.":
    "The machines ask. MANAhome keeps the honest registry.",
  "Caractéristiques organisées, données structurées, page publique en accès libre : ce registre territorial est non marchand — aucune mise en avant payante, aucun ordre achetable, une annonce importée ne passe jamais devant une directe à adéquation égale. La structuration améliore les chances d'être compris et trouvé ; elle ne garantit pas qu'un assistant indexera ou citera une annonce.":
    "Organised characteristics, structured data, a public page in open access: this territorial registry is non-commercial — no paid placement, no purchasable ranking, an imported listing never ranks above a direct one at equal match. Structuring improves the chances of being understood and found; it does not guarantee that an assistant will index or cite a listing.",
  "Comprendre notre approche": "Understand our approach",
  "L'index des communes": "The index of towns",
  "Un lieu, une fiche : la vie autour du séjour.":
    "One place, one page: life around the stay.",
  "Transports, commerces, écoles, services, nature : chaque commune du territoire présentée honnêtement, avec des informations vérifiées lorsque c'est possible.":
    "Transport, shops, schools, services, nature: every town of the territory presented honestly, with verified information wherever possible.",
  "Découvrir le territoire": "Discover the territory",

  // ── Le séjour (cycle de vie) ──
  "Voyageurs": "Guests",
  "Demander une réservation": "Request a booking",
  // « Envoyer ma demande » existe déjà plus haut — ne pas la redéclarer (TS1117).
  "La demande n'est pas un paiement : vous réglerez l'hôte directement, via son propre moyen de paiement. Aucun encaissement ne passe par MANAhome.":
    "A request is not a payment: you will pay the host directly, via their own payment method. No money ever goes through MANAhome.",
  "Vérifiez vos dates : arrivée avant départ, dates réelles.":
    "Check your dates: arrival before departure, real dates.",
  "Indiquez au moins un voyageur.": "At least one guest, please.",
  "Ces dates ne sont pas disponibles pour ce logement.":
    "These dates are not available for this listing.",
  "Vous avez déjà une demande en cours pour ce logement.":
    "You already have a pending request for this listing.",
  "Demande envoyée — l'hôte vous répond prochainement.":
    "Request sent — the host will reply shortly.",
  "Demande acceptée — l'hôte attend votre paiement (directement auprès de lui).":
    "Request accepted — the host awaits your payment (directly to them).",
  "Paiement attendu — directement auprès de l'hôte.":
    "Payment expected — directly to the host.",
  "Séjour confirmé. Les nuitées sont bloquées.":
    "Stay confirmed. The nights are blocked.",
  "Séjour annulé.": "Stay cancelled.",
  "Séjour terminé.": "Stay completed.",
  "Mes séjours": "My stays",
  "Démo locale : ce navigateur joue les deux rôles — vous voyez la demande du voyageur ET les commandes de l'hôte. En production, chaque côté ne voit que le sien, et aucun paiement ne transite ici.":
    "Local demo: this browser plays both roles — you see the guest's request AND the host's controls. In production each side sees only its own, and no payment ever transits here.",
  "voyageur(s)": "guest(s)",
  "Accepter": "Accept",
  "Confirmer le séjour": "Confirm the stay",
  "Clôturer": "Close out",
  "Annuler": "Cancel",
  "demande envoyée": "request sent",
  "acceptée": "accepted",
  "paiement attendu": "payment expected",
  "confirmé — nuitées bloquées": "confirmed — nights blocked",
  "annulé": "cancelled",
  "terminé": "completed",

  // ── Bascule FEATURE_BACK (module séjours) ──
  "Ces dates viennent d'être réservées ailleurs.":
    "These dates have just been booked elsewhere.",
  "Ce séjour n'est plus dans l'état attendu pour ce geste.":
    "This stay is no longer in the state expected for this action.",
  "Une erreur est survenue.": "Something went wrong.",

  // ── Bascule FEATURE_BACK (session + calendrier) ──
  "Mon compte": "My account",
  "Se déconnecter": "Sign out",
  "Se connecter": "Sign in",
  "Créer mon compte": "Create my account",
  "Email": "Email",
  "Mot de passe": "Password",
  "…": "…",
  "Identifiants invalides.": "Invalid credentials.",
  "Inscription impossible — vérifiez votre email et un mot de passe de 10 caractères minimum.":
    "Sign-up unavailable — check your email and a password of at least 10 characters.",
  "Les nuitées de vos annonces réelles se gèrent avec votre compte ; sans compte, le calendrier de démonstration reste actif.":
    "The nights of your real listings are managed with your account; without an account, the demonstration calendar stays active.",

  // ── Bascule FEATURE_BACK (module annonces) ──
  "Le service des annonces est momentanément indisponible — le catalogue de démonstration s'affiche.":
    "The listings service is temporarily unavailable — the demonstration catalogue is shown.",

  // ── Recherche par dates (voyageur) ──
  "Arrivée": "Arrival", "Départ": "Departure",
  "Séjour du {plage} — seules les annonces disponibles sur ces dates sont affichées.":
    "Stay from {plage} — only listings available on these dates are shown.",

  // ── Calendrier de l'extranet propriétaire ──
  "lun": "Mon", "mar": "Tue", "mer": "Wed", "jeu": "Thu",
  "ven": "Fri", "sam": "Sat", "dim": "Sun",
  "janvier": "January", "février": "February", "mars": "March",
  "avril": "April", "mai": "May", "juin": "June",
  "juillet": "July", "août": "August", "septembre": "September",
  "octobre": "October", "novembre": "November", "décembre": "December",
  "bloquée": "blocked", "disponible": "available",
  "Mois précédent": "Previous month", "Mois suivant": "Next month",
  "Bloquer une plage": "Block a range",
  "Cliquez la nuit de fin…": "Click the end night…",
  "Libérer ce mois": "Release this month",
  "Importer un calendrier externe (iCal)": "Import an external calendar (iCal)",
  "Collez le contenu de votre fichier .ics (Airbnb, Booking…)":
    "Paste the contents of your .ics file (Airbnb, Booking…)",
  "Importer les nuitées occupées": "Import busy nights",
  "Aucune nuitée lisible dans ce calendrier.": "No readable nights in this calendar.",
  "{n} nuitées bloquées, {i} évènement(s) illisible(s) ignoré(s).":
    "{n} nights blocked, {i} unreadable event(s) skipped.",
  "{n} nuitées bloquées.": "{n} nights blocked.",
  "Calendrier de mes nuitées": "My nights calendar",
  "Cliquez une nuitée pour la bloquer ou la libérer. Bloquer n'est pas réserver : MANAhome n'encaisse aucun paiement, et une nuitée non bloquée reste disponible partout où vous diffusez.":
    "Click a night to block or release it. Blocking is not booking: MANAhome never takes a payment, and a night that isn't blocked stays available wherever you list.",

  // ── Carte OSM de la fiche ──
  "Carte du quartier": "Area map",
  "Voir sur OpenStreetMap": "View on OpenStreetMap",
  "Localisation approximative au quartier, posée sur OpenStreetMap — la carte ne désigne jamais l'adresse précise du bien.":
    "Approximate neighbourhood location, served by OpenStreetMap — the map never points at the property's exact address.",

  // ── Pied de page ──
  "Publier — gratuit": "Publish — free",
  "Notre approche": "Our approach",
  "Ma messagerie": "My inbox",
  "Mes annonces": "My listings",
  "À propos": "About",
  "Mentions légales": "Legal notice",
  "Pied de page": "Footer",
  "La maison des IA : un registre territorial non marchand, lisible par toutes les familles d'assistants. Portail de locations de vacances, entre propriétaires et vacanciers. Gratuit, accompagné, lisible par les IA. La structuration améliore les chances de compréhension et de découverte ; elle ne garantit pas qu'un assistant IA indexera, recommandera ou citera une annonce.":
    "The house of AIs: a non-commercial territorial registry, readable by every family of assistants. A holiday rental portal, between owners and guests. Free, supported, AI-readable. Structuring improves the chances of understanding and discovery; it does not guarantee that an AI assistant will index, recommend or cite a listing.",

  // ── Traduction des 7 pages restantes (04/11/2026) : Approche, Publier,
  // MentionsLegales, AnnoncesListe, TerritoireDetail, Messagerie,
  // MesAnnonces. Jusqu'ici elles servaient le français brut sous /en/. ──

  // Approche — titres de pilier (les p.titre sont passés en variable à
  // t(L, …) : invisibles à un audit par grep sur chaîne littérale)
  "Gratuit, vraiment": "Genuinely free",
  "Aucun acte réglementé": "No regulated act",
  "Vos données restent à vous": "Your data stays yours",
  "Une annonce structurée": "A structured listing",
  "L'honnêteté comme règle": "Honesty as a rule",
  "Le territoire au centre": "The territory at the centre",

  // AnnoncesListe — labels des filtres de type (opt.l, même angle mort)
  "Tous les biens": "All properties",
  "Maisons": "Houses",
  "Appartements": "Flats",
  "Terrains": "Land",

  "Des locations de vacances honnêtes, structurées, territoriales":
    "Honest, structured, local holiday rentals",
  "MANAhome est un portail de location de vacances, entre propriétaires et vacanciers. Voici, noir sur blanc, ce que nous faisons — et ce que nous ne ferons jamais.":
    "MANAhome is a holiday rental portal, between owners and guests. Here, in black and white, is what we do — and what we will never do.",
  "Publier une annonce ne coûte rien et ne rapporte rien à MANAhome sur votre location : aucune commission, aucun frais caché, aucun payant déguisé en option.":
    "Publishing a listing costs nothing and earns MANAhome nothing on your rental: no commission, no hidden fee, nothing paid disguised as an option.",
  "MANAhome n'est pas une agence de location et n'en fait pas le métier : pas de mandat, pas d'encaissement, pas d'intermédiaire financier. Vous restez l'unique décisionnaire.":
    "MANAhome is not a letting agency and does not act as one: no mandate, no collecting payments, no financial intermediary. You stay the sole decision-maker.",
  "Aucune revente de données ni de leads. Les coordonnées ne sont jamais publiques : les échanges entre propriétaire et voyageur passent par une messagerie interne.":
    "No reselling of data or leads. Contact details are never public: exchanges between owner and guest go through an internal messaging system.",
  "Surface, pièces, capacité, DPE, localisation : chaque fiche est organisée pour être lisible par les humains — et par les outils compatibles IA.":
    "Floor area, rooms, capacity, energy rating, location: every listing is organised to be readable by humans — and by AI-compatible tools.",
  "Badge obligatoire sur les annonces importées, tarifs affichés sourcés et datés : nous préférons un catalogue restreint et vrai.":
    "Mandatory badge on imported listings, rates shown sourced and dated: we prefer a small, honest catalogue.",
  "Un séjour se choisit aussi pour sa vie autour : transports, services, nature, risques connus — présentés sans enjolivement.":
    "A stay is also chosen for the life around it: transport, services, nature, known risks — presented without embellishment.",
  "MANAhome fait partie de l'écosystème MANA (mana.bzh, mana.love, manafrance.org).":
    "MANAhome is part of the MANA ecosystem (mana.bzh, mana.love, manafrance.org).",
  "Voir les annonces": "View listings",

  // MentionsLegales
  "Informations légales": "Legal information",
  "Éditeur": "Publisher",
  "MANAhome est édité par l'écosystème MANA (mana.bzh, mana.love, manafrance.org). Les coordonnées complètes de l'éditeur seront publiées avec la structure juridique définitive du projet.":
    "MANAhome is published by the MANA ecosystem (mana.bzh, mana.love, manafrance.org). The publisher's full details will be published once the project's legal structure is finalised.",
  "Hébergement": "Hosting",
  "Site statique hébergé sur GitHub Pages (GitHub, Inc.). Aucune donnée personnelle n'est collectée par le site en l'état : les fonctionnalités de démonstration (annonces, messagerie) restent locales à votre navigateur.":
    "Static site hosted on GitHub Pages (GitHub, Inc.). No personal data is collected by the site as it stands: the demo features (listings, messaging) stay local to your browser.",
  "Nature du service": "Nature of the service",
  "MANAhome est une plateforme de mise en relation pour la location de vacances, entre propriétaires et vacanciers. Elle ne réalise aucun acte réglementé par la loi Hoguet (n° 70-9) : pas de mandat, pas de négociation, pas d'encaissement pour compte de tiers. Les paiements se font directement entre le propriétaire et le vacancier, par leur propre moyen.":
    "MANAhome is a matchmaking platform for holiday rentals, between owners and guests. It performs no act regulated by the Hoguet law (no. 70-9): no mandate, no negotiation, no collecting payments on behalf of others. Payments are made directly between the owner and the guest, by their own means.",
  "Données personnelles": "Personal data",
  "Aucune donnée ni lead n'est revendu. Les coordonnées ne sont jamais publiées : la mise en relation se fait par messagerie interne. Vous pouvez demander la suppression de vos données à tout moment — la suppression est une exclusion définitive.":
    "No data or lead is ever resold. Contact details are never published: matchmaking happens through internal messaging. You can request deletion of your data at any time — deletion is final.",
  "Retour à l'accueil": "Back to home",

  // AnnoncesListe
  "Annonces": "Listings",
  "Les annonces": "Listings",
  "Les annonces à": "Listings in",
  "Un catalogue volontairement restreint et soigné. Chaque annonce est structurée pour être comprise, y compris par les outils compatibles IA.":
    "A deliberately small, carefully kept catalogue. Every listing is structured to be understood, including by AI-compatible tools.",
  "Recherche": "Search",
  "Commune ou secteur": "Town or area",
  "Ex : nom de la commune, quartier, port…": "E.g.: town name, neighbourhood, harbour…",
  "Ex : 100": "E.g.: 100",
  "Filtrer par type": "Filter by type",
  "Catalogue de démarrage : il est volontairement restreint. Revenez bientôt, ou explorez le territoire pendant ce temps.":
    "Starting catalogue: it is deliberately small. Come back soon, or explore the territory in the meantime.",
  "Annonces de démonstration — les annonces réelles arriveront avec les premiers propriétaires. Les annonces professionnelles importées sont toujours affichées après les dépôts directs, à qualité égale.":
    "Demo listings — real listings will arrive with the first owners. Imported professional listings are always shown after direct listings, at equal match.",

  // TerritoireDetail
  "Prix moyen au mètre carré sur les dix dernières années": "Average price per square metre over the last ten years",
  "Accueil": "Home",
  "Choisir un lieu, pas seulement un logement": "Choose a place, not just a home",
  "Habitants": "Residents",
  "Commerces": "Shops",
  "Associations": "Associations",
  "Environnement": "Environment",
  "Nature, littoral, paysages": "Nature, coastline, landscapes",
  "Transports": "Transport",
  "Se déplacer au quotidien": "Getting around day to day",
  "Services": "Services",
  "Commerces, écoles, santé": "Shops, schools, healthcare",
  "Vie locale": "Local life",
  "Communauté, culture, loisirs": "Community, culture, leisure",
  "Parcs naturels": "Nature parks",
  "Espaces protégés": "Protected areas",
  "Services publics": "Public services",
  "Administrations": "Administrations",
  "Intercommunalité": "Intermunicipal body",
  "Communauté de communes": "Association of municipalities",
  "Prix de l'immobilier": "Property prices",
  "Moyenne indicative au m² (maisons), 10 dernières années": "Indicative average per m² (houses), last 10 years",
  "Données de démonstration — le jour venu, la source sera un flux contractualisé (DVF ou partenaire), jamais du scraping.":
    "Demo data — in time, the source will be a contracted feed (DVF or partner), never scraping.",
  "Risques naturels": "Natural hazards",
  "Synthèse Géorisques — vérifiez chaque adresse": "Géorisques summary — check each address",
  "Consulter Géorisques pour {lieu}": "Check Géorisques for {lieu}",
  "Informations présentées avec honnêteté : elles sont enrichies et vérifiées lorsque c'est possible, et mises à jour à mesure que le territoire s'enrichit.":
    "Information presented honestly: it is enriched and verified where possible, and updated as the territory's coverage grows.",

  // Messagerie
  "Mise en relation protégée": "Protected matchmaking",
  "Les échanges entre voyageurs et propriétaires passent par la messagerie interne : aucune coordonnée n'est exposée, rien n'est revendu.":
    "Exchanges between guests and owners go through internal messaging: no contact details are exposed, nothing is resold.",
  "Aucune conversation pour l'instant. Contactez un propriétaire depuis une fiche d'annonce pour ouvrir la messagerie.":
    "No conversation yet. Contact an owner from a listing page to open messaging.",
  "Conversations": "Conversations",
  "Choisissez une conversation à gauche.": "Choose a conversation on the left.",
  // « Votre message » existe déjà plus haut — ne pas la redéclarer (TS1117).
  "Votre message…": "Your message…",
  "Démo : stockage local, aucune donnée transmise. En production, chaque message passe par le serveur, chiffré en transit, visible uniquement des participants (RLS).":
    "Demo: local storage, no data transmitted. In production, every message goes through the server, encrypted in transit, visible only to participants (RLS).",

  // MesAnnonces
  "Espace vendeur — démo locale": "Owner area — local demo",
  "Vos annonces déposées depuis ce navigateur. Démo locale : en production, elles vivront derrière votre compte, avec la même liberté — dépublier, remettre en ligne, supprimer définitivement.":
    "Your listings posted from this browser. Local demo: in production, they will live behind your account, with the same freedom — unpublish, republish, delete for good.",
  "Annonce publiée. Elle apparaît dès maintenant dans le catalogue, derrière le badge « Annonce directe de particulier ».":
    "Listing published. It now appears in the catalogue, behind the \"Direct listing from an individual\" badge.",
  "Voir ma fiche publique": "View my public listing",
  "Voir le catalogue": "View the catalogue",
  "Aucune annonce pour l'instant. La publication est gratuite, sans commission — trois étapes suffisent.":
    "No listing yet. Publishing is free, with no commission — three steps are enough.",
  "{n} pièces": "{n} rooms",
  "Voir": "View",
  "Dépublier": "Unpublish",
  "Remettre en ligne": "Republish",
  "Supprimer": "Delete",
  "Aucune donnée identifiante n'est stockée : l'e-mail saisi au dépôt n'est pas conservé, la mise en relation se fait par messagerie interne. Suppression = exclusion définitive.":
    "No identifying data is stored: the email entered at posting is not kept, matchmaking happens through internal messaging. Deletion means final exclusion.",
  "En ligne": "Live",
  "Dépubliée": "Unpublished",

  // Publier
  "Gratuit, sans commission": "Free, no commission",
  "Trois étapes, aucun engagement. Vous gardez la main à tout moment : votre annonce n'est publiée que lorsque vous la validez.":
    "Three steps, no commitment. You stay in control at every moment: your listing is published only once you confirm it.",
  "Le bien": "The property",
  "La description": "The description",
  "Validation": "Confirmation",
  "Type de bien *": "Property type *",
  "Rechercher : maison, appartement, terrain…": "Search: house, flat, land…",
  "Sélection :": "Selected:",
  "Maison": "House",
  "Appartement": "Flat",
  "Terrain": "Land",
  "Autre": "Other",
  "Commune ou secteur *": "Town or area *",
  "Ex : nom de la commune ou du secteur": "E.g.: town or area name",
  "Vos tarifs — au moins un des trois *": "Your rates — at least one of the three *",
  "Libre à vous de ne proposer qu'un seul palier, ou les trois. Les montants n'ont pas besoin d'être proportionnels entre eux.":
    "You're free to offer just one tier, or all three. The amounts don't need to be proportional to each other.",
  "Par nuit (€)": "Per night (€)",
  "Par semaine (€)": "Per week (€)",
  "Par mois (€)": "Per month (€)",
  "Surface (m²)": "Floor area (m²)",
  "Pièces": "Rooms",
  "Couchages": "Sleeping places",
  "Ex : 4": "E.g.: 4",
  "Équipements": "Amenities",
  "Cochez uniquement ce qui est réellement présent — un équipement non coché n'est pas affiché comme absent, il n'est juste pas annoncé.":
    "Only tick what is actually there — an unticked amenity is not shown as absent, it simply isn't announced.",
  "Parking": "Parking",
  "Piscine": "Pool",
  "Jardin": "Garden",
  "Balcon": "Balcony",
  "DPE (diagnostic de performance énergétique)": "Energy rating",
  "Continuer": "Continue",
  "Les photos de votre bien": "Photos of your property",
  "Jusqu'à {n} photos, compressées dans votre navigateur avant tout envoi. La première fera la vitrine de l'annonce. (Démo locale : rien ne quitte votre appareil.)":
    "Up to {n} photos, compressed in your browser before any upload. The first one becomes the listing's cover. (Local demo: nothing leaves your device.)",
  "Jusqu'à {n} photos par annonce.": "Up to {n} photos per listing.",
  "Certaines photos n'ont pas pu être lues. Réessayez.": "Some photos could not be read. Please try again.",
  "Vitrine": "Cover",
  "Retirer la photo {n}": "Remove photo {n}",
  "Décrivez votre bien, comme vous le raconteriez": "Describe your property, the way you'd tell it",
  "Maison lumineuse à deux pas du port, jardin clos, cuisine ouverte…": "Bright house a stone's throw from the harbour, enclosed garden, open kitchen…",
  "Pas inspiré ? La rédaction assistée arrive avec votre compte : elle transforme vos mots en annonce chaleureuse et factuelle.":
    "Not feeling inspired? Assisted writing arrives with your account: it turns your words into a warm, factual listing.",
  "Retour": "Back",
  "Aperçu de votre annonce": "Preview of your listing",
  "Photo principale": "Main photo",
  "Tarif / {unite}": "Rate / {unite}",
  "nuit": "night",
  "semaine": "week",
  "mois": "month",
  "Tarif": "Rate",
  "À définir": "To be set",
  "Surface": "Floor area",
  "Votre e-mail (pour retrouver votre brouillon) *": "Your email (to find your draft again) *",
  "Jamais publié, jamais revendu. La mise en relation avec les voyageurs se fera par messagerie interne.":
    "Never published, never resold. Matchmaking with guests will happen through internal messaging.",
  "Numéro de déclaration de meublé touristique": "Short-term rental declaration number",
  "Référence de l'attestation d'assurance": "Insurance certificate reference",
  "Ex : 29160 123456 2026 1 1": "E.g.: 29160 123456 2026 1 1",
  "Ex : ATL-2026-12345": "E.g.: ATL-2026-12345",
  "Validité de l'assurance (date)": "Insurance validity (date)",
  "Déposer mes justificatifs et publier": "Submit my documents and publish",
  "Votre annonce est enregistrée en brouillon — gratuite, sans condition. Elle passera en ligne dès que le serveur aura vérifié la présence des justificatifs.":
    "Your listing is saved as a draft — free, no conditions. It will go live once the server has verified the documents are present.",
  "Aucune carte bancaire, aucune commission : la publication est gratuite pour les particuliers. MANA ne réalise aucun acte réglementé — vous restez maître de votre location.":
    "No bank card, no commission: publishing is free for individuals. MANA performs no regulated act — you stay in charge of your rental.",

  // Clés utilisées en plusieurs endroits, ou découvertes en second passage.
  "Envoyer": "Send",
  "Annonce directe de particulier": "Direct listing from an individual",
  "Annonce directe de particulier, gratuite, sur le portail MANAhome.": "Direct listing from an individual, free, on the MANAhome portal.",
  "Annonce professionnelle": "Professional listing",
  "Annonce professionnelle — importée": "Professional listing — imported",
  "Bonjour, votre bien m'intéresse, serait-il possible de visiter ?": "Hello, I'm interested in your property, would it be possible to visit?",
  "Location": "Rental",
  "Toutes les annonces": "All listings",
  "photo du bien": "property photo",
  "{n} couchages": "{n} sleeping places",
  "Votre annonce": "Your listing",
  "DPE": "Energy rating",
  "Budget max (€/nuit)": "Max budget (€/night)",
  "Publier mon annonce — gratuit": "Publish my listing — free",
  "MANAhome — La maison des IA. Gratuit. Accompagné. Lisible par les IA.": "MANAhome — The house of AIs. Free. Supported. AI-readable.",
  "Aucune annonce de ce type pour l'instant sur ce territoire.": "No listing of this type yet in this territory.",
};
