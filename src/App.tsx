import { useEffect } from "react";
import { poserCanonique } from "./canonique";
import { annonceLocaleParId, enAnnonce } from "./annoncesLocales";
// ⛔ 11/11/2026 — les imports de ./Glyphs et ./NavGlyphs sont retirés.
// Le header porte désormais les icônes pixel (voir IconePixel) ; et le champ
// `glyphe:` des SECTIONS était déclaré sur les quatre sections sans être
// AFFICHÉ nulle part — de la donnée morte qui avait l'air vivante, et quatre
// composants SVG embarqués dans le bundle pour rien. Les deux fichiers
// restent : d'autres pages s'en servent.
import {
  usePath,
  routeAnnonce,
  annonceParId,
  routeTerritoire,
  territoireParSlug,
  routeAnnonces,
  baseUrl, lien, langueCourante, lienAutreLangue} from "./router";
import { t } from "./i18n";
import { AnnonceDetail } from "./AnnonceDetail";
import { TerritoireDetail } from "./TerritoireDetail";
import { Publier } from "./Publier";
import { AnnoncesListe } from "./AnnoncesListe";
import { Approche } from "./Approche";
// ⚠️ `messagerie.ts` a été RENOMMÉ en `messagerieDonnees.ts` le 28/10/2026 —
// voir ce fichier pour la raison (collision de casse avec `Messagerie.tsx`
// sur un système de fichiers insensible à la casse).
import { Messagerie } from "./Messagerie";
import { MesAnnonces } from "./MesAnnonces";
import { MentionsLegales } from "./MentionsLegales";
import { ContactForm } from "./ContactForm";
import { IconePixel } from "./IconePixel";
import { SondeGeo } from "./SondeGeo";
import { CompteurAgentsIa } from "./CompteurAgentsIa";
// Le logo du hero. Importé, pas écrit en CSS : il PORTE le nom de la marque,
// donc c'est une image de contenu, et Vite lui donne son empreinte.
import logo from "./assets/logo.webp";
// ⭐ Les prix ne vivent plus ici : ils sont dans src/offres.ts, lu AUSSI par
//    vite.config.ts pour le JSON-LD. Deux lecteurs, une seule source.
// ⛔ 11/11/2026 — OFFRES_MANA n'est plus importé ici : la section « Les autres
//    prix arrêtés » (assistant, fiche pro, antenne) a été retirée de la page à
//    la demande d'Aurélien. manahome.org ne porte plus que le GEO.
import { OFFRES_GEO, FAMILLES, prixAffiche } from "./offres";
import { ILLUSTRATIONS } from "./illustrations";

// Tri SQL reflété côté front : une annonce importée ne passe jamais
// devant une directe à adéquation égale.

// Repositionné le 04/11/2026 : MANAhome n'est plus un portail immobilier
// généraliste (vente/achat/pros de l'habitat) — c'est un portail de
// LOCATION DE VACANCES, entre propriétaires et vacanciers.
// Repositionné le 12/11/2026 : MANAhome est LA MAISON DES IA — un registre
// territorial non marchand que toutes les familles d'assistants peuvent
// interroger.
// ⭐ Repositionné le 11/11/2026 (décision d'Aurélien) : MANAhome devient la
//    VITRINE B2B du GEO et des offres de l'écosystème, pour les PROS &
//    STRUCTURES. Ce n'est plus une plateforme de location saisonnière : le
//    moteur de recherche disparaît de l'accueil, les sections vendent le
//    GEO (l'infrastructure machine-readable, par TEMPOsystem) et les offres
//    ARRÊTÉES uniquement — la grille de référence de l'écosystème fait foi ;
//    le GEO n'y a AUCUN prix, donc il s'affiche « sur devis », sans inventer
//    de grille.
//    Les routes du pilote location (/annonces, /publier, /territoire…)
//    restent SERVIES — leur retrait est un chantier séparé qui dépend de
//    l'arbitrage « faut-il jamais déployer la stack applicative sur le
//    KS-5 ». Elles ne sont simplement plus LIÉES depuis la vitrine.
// ⭐ §3 — la page répondait à une question qu'elle ne posait jamais. Elle
//    ouvrait sur « l'infrastructure machine-readable » : la solution, en
//    jargon, avant que le lecteur sache de quel problème on parle.
// ⛔ AUCUNE STATISTIQUE DE MARCHÉ ICI. La tentation était d'écrire « X % des
//    recherches passent désormais par une IA » — un chiffre qu'on ne peut ni
//    mesurer ni sourcer honnêtement, sur le site d'une entreprise qui facture
//    la mesure honnête. Les trois constats sortent de NOS journaux, sur NOS
//    sites, et la fenêtre de mesure est écrite.
const CONSTATS = [
  { chiffre: "13", unite: "agents IA distincts identifiés",
    quoi: "Applebot, ClaudeBot, GPTBot et dix autres, reconnus à leur signature dans nos journaux. Chacun lit des pages ; ce qu'il en retient nourrira ses réponses." },
  { chiffre: "0", unite: "démarche à faire pour qu'ils viennent",
    quoi: "Ils sont déjà là. La seule question est ce qu'ils comprennent de vous." },
];

// §6 — les trois environnements de collecte. ⛔ Ils ne se valent PAS, et le
//    rapport doit dire lequel a produit chaque réponse : un résultat obtenu
//    par API n'est pas ce que voit l'utilisateur de l'application publique.
//    Les confondre serait vendre sept moteurs « testés dans les mêmes
//    conditions » alors que les conditions diffèrent par nature.
const COLLECTES = [
  { cle: "A", titre: "L'API du modèle",
    quoi: "On interroge le modèle directement. Reproductible, horodaté, rejouable — mais ce n'est pas l'écran que voit un utilisateur." },
  { cle: "B", titre: "L'assistant public",
    quoi: "Le produit tel qu'il est réellement utilisé, avec sa recherche et ses réglages. Plus proche du vrai, moins facile à rejouer à l'identique." },
  { cle: "C", titre: "La recherche locale",
    quoi: "Baidu et les plateformes éditoriales chinoises, selon le secteur : ce que l'écosystème rend accessible aux moteurs." },
];

const EXEMPLE_QUESTION = "Quels hébergements recommandez-vous pour un week-end en presqu'île de Crozon ?";
const EXEMPLE_LIGNES = [
  { moteur: "ChatGPT", etat: "cite",
    constat: "Citée en 3ᵉ position. Activité correctement décrite, horaires absents.",
    concurrents: "2 cités avant", sources: "site officiel, office de tourisme" },
  { moteur: "Gemini", etat: "partiel",
    constat: "Citée, mais confondue avec un établissement du même nom à 40 km.",
    concurrents: "4 cités avant", sources: "annuaire tiers, avis" },
  { moteur: "Claude", etat: "absent",
    constat: "Non citée. Aucune source la concernant n'apparaît dans la réponse.",
    concurrents: "5 cités", sources: "guides régionaux" },
  { moteur: "Perplexity", etat: "cite",
    constat: "Citée en 1ʳᵉ position, avec un lien direct vers le site.",
    concurrents: "3 cités après", sources: "site officiel, presse locale" },
  { moteur: "Microsoft Copilot", etat: "non-teste",
    constat: "Non testé : aucun accès ne permet de le mesurer sans gratter son interface.",
    concurrents: "—", sources: "—" },
  { moteur: "Google AI Overviews", etat: "non-teste",
    constat: "Non testé, même raison. Une absence de test n'est jamais comptée comme une absence de l'entreprise.",
    concurrents: "—", sources: "—" },
];
const EXEMPLE_PROTOCOLE = [
  "Date et heure exactes du test",
  "Langue et localisation de la question",
  "Environnement : API du modèle, ou assistant public",
  "Recherche web activée ou non",
  "Version du modèle lorsqu'elle est exposée",
  "Nombre de répétitions, car une réponse varie d'un essai à l'autre",
];

// ── Repris de GEO Expert (alliancemana.com), le 11/11/2026 ─────────────────
// ⛔ REPRIS, PAS RECOPIÉ. Trois choses y ont été changées, et chacune pour une
//    raison qui se défend devant un client :
//    1. Les PRIX sont ceux de manahome.org (149/390/99…), pas ceux de
//       alliancemana.com (1 990/299…). Décision d'Aurélien.
//    2. QUATRE moteurs, pas cinq. GEO Expert annonçait Copilot parmi les
//       assistants interrogés ; ici il est « non testé », faute d'accès
//       mesurable. Deux sites du même écosystème ne peuvent pas se
//       contredire là-dessus devant le même client.
//    3. « IA hébergée en France » est PRÉCISÉ. L'ANALYSE tourne sur nos
//       modèles, en France — mais les assistants INTERROGÉS sont américains
//       par nature, et c'est justement leur réponse qu'on achète. Laisser
//       croire l'inverse serait le raccourci que notre propre audit détecte.
const DIFFERENCES = [
  {
    titre: "Une chaîne souveraine, et ce qui ne l'est pas",
    texte:
      "Les traitements internes, le stockage de vos rapports et leur analyse sont réalisés sur notre infrastructure française. Les questions de mesure, elles, sont transmises aux assistants interrogés — ChatGPT, Gemini, Claude, Perplexity — dont les services sont opérés par des entreprises étrangères : c'est leur réponse que vous achetez, et il n'y a pas d'autre moyen de l'obtenir. Aucune donnée confidentielle n'est jamais communiquée volontairement dans ces requêtes.",
  },
  {
    titre: "Un écosystème de sources, pas un site isolé",
    texte:
      "Les IA citent les organisations qu'elles rencontrent plusieurs fois, sur des sources indépendantes. Nous exploitons les nôtres — un annuaire national, des plateformes de données, des sites thématiques — que les modèles ont appris à consulter. Y rendre votre information présente et vérifiable est le cœur du travail.",
  },
  {
    titre: "Une surveillance qui ne s'arrête pas au rapport",
    texte:
      "La plupart des missions se terminent avec le document. L'abonnement de surveillance rejoue chaque mois le même panel de questions, suit vos concurrents, et vous alerte quand une réponse devient fausse ou qu'un nouveau nom apparaît à votre place.",
  },
  {
    titre: "Des délais constatés, pas promis",
    texte:
      "Sur ce que nous avons observé, un contenu nouveau met quatre à douze semaines à être pris en compte, et un site déjà bien référencé voit ses premières citations plus tôt. Ce sont des tendances constatées, pas une règle : les rythmes d'indexation et d'actualisation varient d'un système à l'autre, et aucun éditeur ne les publie. Nous vous dirons où vous en êtes, avec les chiffres — jamais une date de citation garantie.",
  },
];

// ⭐ « Ce qu'on ne vous dira pas ailleurs » — la section la plus commerciale
//    du lot : elle arme le lecteur contre les offres concurrentes sans jamais
//    les nommer, et lui laisse deux questions à poser. Un client qui repart
//    avec une question à poser revient.
const FRANCHISE = [
  {
    titre: "« Recommandé par ChatGPT en 30 jours »",
    texte:
      "Vous croiserez cette promesse, parfois avec un remboursement à la clé sur le même délai. Elle ne peut pas être tenue de bonne foi : les modèles absorbent les contenus sur des cycles de quatre à douze semaines. Nous préférons vous montrer des courbes mesurées, des captures datées et des délais réels. C'est plus lent à vendre, et c'est la seule chose qui tienne.",
  },
  {
    titre: "La surveillance IA très peu chère",
    texte:
      "Elle existe, et elle peut très bien convenir. Nous n'avons pas d'étude comparative à vous opposer, donc nous ne dirons pas ce qu'elle vaut. Regardez vous-même la chaîne avant de signer, chez nous comme ailleurs : où les données sont-elles hébergées, quels sous-traitants interviennent, comment les réponses sont-elles collectées, et quelle part du rapport est écrite par un humain. Quatre questions, quatre réponses vérifiables.",
  },
];

// ⚠️ LA COMPARAISON EXPRESS / EXPERT — posée le 12/11/2026.
//    À 149 €, l'Express annonçait déjà « exploration, panel de questions,
//    vérification des réponses » : lu seul, il semble contenir l'essentiel de
//    l'Expert à 390 €. Un écart qui ne se quantifie pas ne se vend pas — le
//    client prend le moins cher en se disant qu'il verra plus tard.
// ⛔ ET IL MANQUE DEUX NOMBRES, VOLONTAIREMENT LAISSÉS VIDES : combien de
//    questions, et combien de répétitions par question, pour chacune des deux
//    offres. Ce sont des décisions de PRODUCTION — elles fixent la charge
//    réelle d'un audit à 149 €. Les inventer ici reviendrait à décider du
//    coût de revient depuis une feuille de style. Demandé à Aurélien.
const COMPARAISON = {
  colonnes: ["GEO Express", "GEO Expert"],
  lignes: [
    { critere: "Assistants interrogés", express: "4", expert: "4" },
    // ⭐ LES DEUX NOMBRES QUI MANQUAIENT, ARRÊTÉS LE 12/11/2026 PAR AURÉLIEN.
    //    Ils ne sont pas décoratifs : ils FIXENT ce qu'on doit livrer, et la
    //    durée du travail s'en déduit. Mesuré sur le KS-5 : 24 s pour
    //    interroger un assistant, 150 s pour faire analyser sa réponse par
    //    notre modèle — soit 174 s par interrogation.
    //      Express : 5 × 4 assistants × 3 répétitions =  60  ≈ 2 h 54
    //      Expert  : 15 × 4 assistants × 3 répétitions = 180 ≈ 8 h 42
    //    L'Expert tient donc dans une nuit, et c'était la contrainte : l'usine
    //    d'analyse sature les quatre cœurs de la machine et fait expirer les
    //    requêtes du site quand elle tourne en journée (constaté le 12/11).
    { critere: "Questions posées", express: "5", expert: "15" },
    // ⚠️ LA RÉPÉTITION EST CE QUI FAIT LA MESURE, et elle doit être affichée.
    //    Une réponse d'assistant varie d'un appel à l'autre : interroger une
    //    fois donne une anecdote, interroger trois fois donne une fréquence
    //    (« cité 2 fois sur 3 »). C'est la différence entre « on a regardé » et
    //    « on a mesuré », et c'est elle qu'un concurrent instantané n'a pas.
    { critere: "Répétitions par question", express: "3", expert: "3" },
    { critere: "Questions commerciales", express: "Panel standard", expert: "Panel personnalisé" },
    { critere: "Concurrents", express: "Identification sommaire", expert: "Analyse détaillée" },
    { critere: "Sources citées", express: "Principales", expert: "Analyse approfondie" },
    { critere: "Technique du site", express: "Contrôle initial", expert: "Audit complet" },
    { critere: "Plan d'action", express: "Premières pistes", expert: "Priorisé et détaillé" },
  ],
};

const FAQ = [
  { q: "Sous combien de temps verrai-je un résultat ?",
    r: "Quatre à douze semaines selon l'état de départ : trois à huit semaines pour un site déjà bien référencé, davantage pour un site récent qui doit d'abord construire ses fondations. L'audit vous dit dans quel cas vous êtes, avec les chiffres." },
  { q: "Le GEO remplace-t-il le référencement classique ?",
    r: "Non. Un site invisible pour Google l'est aussi pour les assistants, qui s'appuient largement sur le web indexé. Le GEO s'ajoute : il travaille la compréhension par les machines là où le SEO travaille le classement." },
  { q: "Où sont hébergées mes données ?",
    r: "En France, sur un serveur dédié OVH au centre de Gravelines, dans le Nord. Le site, les analyses, les rapports et nos propres modèles d'analyse tiennent sur cette seule machine. Les assistants que nous interrogeons, eux, sont opérés par leurs éditeurs : américains pour trois d'entre eux, français pour Mistral — qui ne garantit toutefois pas le lieu où il traite les requêtes. C'est leur réponse que nous mesurons, nous ne pouvons pas l'obtenir ailleurs." },
  { q: "Nous sommes une petite structure — est-ce pour nous ?",
    r: "Oui, et c'est là que l'écart se creuse le plus vite. Commencez par l'Express à 149 € : vous saurez si vous existez pour les assistants avant d'engager quoi que ce soit de plus." },
  { q: "Que se passe-t-il si une IA raconte quelque chose de faux sur nous ?",
    r: "Nous le documentons avec la réponse brute et sa date, puis nous remontons à la source que le modèle a utilisée. Corriger la source est le seul levier réel : personne ne peut éditer la réponse d'un assistant." },
  { q: "Puis-je arrêter la surveillance ?",
    r: "Oui, sans préavis ni engagement de durée. L'historique de vos mesures vous reste." },
  { q: "Qui êtes-vous ?",
    r: "Alliance MANA, association déclarée loi 1901 (RNA W292008256), dont l'objet est de rendre les territoires et leurs acteurs lisibles par tout moyen numérique, y compris l'intelligence artificielle. Nous mesurons d'abord sur nos propres sites." },
  { q: "Facturation et TVA ?",
    r: "Tous les prix affichés sont hors taxes. La facture est émise par Alliance MANA, et vous l'acceptez avant tout travail." },
];

// FAMILLES et OFFRES_MANA vivent désormais dans src/offres.ts (voir l'import).

const SECTIONS = [
  {
    num: "01",
    titre: "Être trouvé par les IA",
    accroche: "Vos clients ne cherchent plus seulement. Ils demandent.",
    texte:
      "Quand quelqu'un demande à ChatGPT ou à Gemini un professionnel comme vous, l'assistant répond avec ce qu'il a lu et retenu du web. S'il ne vous a pas compris, il cite quelqu'un d'autre — et vous ne le saurez jamais : il n'y a ni classement à consulter, ni compte à ouvrir. Le GEO, c'est rendre une organisation compréhensible par ces machines : llms.txt, Model Context Protocol, données structurées. Alliance MANA produit cette infrastructure elle-même — ce que ni les agences de contenu, ni les tableaux de bord de mesure ne proposent." },
  {
    num: "02",
    titre: "L'audit GEO de votre structure",
    accroche: "Mairies, associations, offices de tourisme, entreprises.",
    texte:
      "Où en êtes-vous dans les assistants ? Qu'est-ce qui vous empêche d'être compris, trouvé, cité ? L'audit interroge quatre assistants — ChatGPT, Gemini, Claude et Perplexity — avec un panel de questions que vos acheteurs poseraient vraiment, et vous rend leurs réponses intégrales, leurs sources, et les concurrents cités à votre place.",
    cta: { label: "Demander un audit", href: "/approche" } },
  {
    num: "03",
    titre: "Combien ça coûte, et ce que vous recevez",
    accroche: "Des prix publics, un livrable daté, aucun devis à attendre.",
    texte:
      "Commencez par l'Express à 149 € pour voir où vous en êtes. Passez à l'Expert à 390 € quand vous voulez savoir qui est cité à votre place, et pourquoi. Chaque audit se commande seul : pas d'abonnement imposé, pas d'engagement, et vous connaissez le prix avant de nous écrire. Vous recevez un rapport, les réponses intégrales des assistants, et un plan d'action hiérarchisé.",
    // ⭐ Pas de `cta` ici, à dessein : cette section PORTE l'ancre #offres.
    // Un bouton « Voir les offres » y pointant renverrait sur elle-même —
    // le hero et la navigation l'utilisent pour DESCENDRE jusqu'ici.
    },
  {
    num: "04",
    titre: "La maison des IA",
    accroche: "Les machines interrogent. MANA tient le registre honnête.",
    texte:
      "Vous repartez avec une mesure que vous pouvez défendre : les réponses brutes, leurs sources, la date et le protocole. Personne ne peut l'acheter — ni vous, ni vos concurrents : le registre territorial de l'écosystème est non marchand, sans mise en avant payante ni ordre négociable. C'est ce qui rend le résultat opposable le jour où votre conseil, votre direction ou votre financeur vous demandera d'où il sort.",
    cta: { label: "Comprendre notre approche", href: "/approche" } },
];


export default function App() {
  const path = usePath();
  // La langue se lit dans l'URL, jamais dans un stockage : deux URLs, deux
  // langues, zéro préférence cachée qui diverge de ce que le lien partagé
  // raconte.
  const L = langueCourante();
  // La canonique suit la route ET sa langue. Les coquilles livrées la portent
  // déjà dans le HTML (vite.config.ts) ; ceci tient la navigation côté client.
  useEffect(() => {
    poserCanonique(path, L);
    // ⚠️ 11/11/2026 — les coquilles LIVRÉES portent le bon `lang` (vite.config
    // le réécrit par langue), mais la navigation côté client ne le mettait pas
    // à jour : sur /en/ après un clic, document.documentElement.lang restait
    // « fr ». Invisible à l'écran, décisif pour un lecteur d'écran et pour
    // toute machine qui lit la page après exécution du JS.
    document.documentElement.lang = L;
  }, [path, L]);
  // ⭐ Le moteur de recherche location a quitté l'accueil le 11/11/2026 :
  // la vitrine vend le GEO et les offres, elle ne cherche plus de séjours.
  // Les routes du pilote restent servies — voir le commentaire des SECTIONS.
  const annonce =
    annonceParId(routeAnnonce(path)) ??
    (() => {
      const locale = annonceLocaleParId(routeAnnonce(path));
      return locale ? enAnnonce(locale) : null;
    })();
  const territoire = territoireParSlug(routeTerritoire(path));
  const listeSlug = routeAnnonces(path);

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <a className="brand brand-icone" href={lien(`/`)} aria-label="MANAhome">
            <IconePixel nom="maison" taille={26} />
          </a>
          <nav className="nav">
            <a href={lien(`/approche`)}>
              <IconePixel nom="structure" />
              <span>{t(L, "Notre approche")}</span>
            </a>
            <a href={lien(`/#offres`)}>
              <IconePixel nom="grille" />
              <span>{t(L, "Offres & tarifs")}</span>
            </a>
            <a href={lien(`/#contact`)} className="nav-cta">
              <IconePixel nom="etoile" />
              <span>{t(L, "Demander un audit")}</span>
            </a>
            {/* Sélecteur de langue : l'autre version de la MÊME page, jamais
                un retour à l'accueil — perdre la route serait le défaut le
                plus visible du bilingue. */}
            <a
              href={lienAutreLangue(L, path)}
              className="nav-langue"
              aria-label={t(L, "Changer de langue")}
            >
              {L === "fr" ? "EN" : "FR"}
            </a>
          </nav>
        </div>
      </header>

      {annonce ? (
        <AnnonceDetail annonce={annonce} />
      ) : path === "/publier" ? (
        <Publier />
      ) : listeSlug ? (
        <AnnoncesListe slug={listeSlug} />
      ) : path === "/approche" ? (
        <Approche />
      ) : path === "/messagerie" ? (
        <Messagerie />
      ) : path === "/mes-annonces" ? (
        <MesAnnonces />
      ) : path === "/mentions-legales" ? (
        <MentionsLegales />
      ) : // Pages retirées le 04/11/2026 (repositionnement vers la location
      // de vacances) : /pros, /estimation, /espace-pro et /services n'ont
      // plus d'équivalent — elles redirigent vers /approche plutôt que de
      // répondre 404 à une URL déjà indexée (voir REDIRIGEES, canonique.ts,
      // et "une valeur qui dépend de la cible en dépend partout").
      path === "/pros" ? (
        window.location.replace(`${baseUrl()}/approche`)
      ) : path === "/estimation" ? (
        window.location.replace(`${baseUrl()}/approche`)
      ) : path === "/espace-pro" ? (
        window.location.replace(`${baseUrl()}/approche`)
      ) : path === "/services" ? (
        window.location.replace(`${baseUrl()}/approche`)
      ) : territoire ? (
        <TerritoireDetail territoire={territoire} />
      ) : (
        <>
          {/* Hero : le logo en grand, la promesse en dessous — plus de moteur
              de recherche depuis le 11/11/2026 : la vitrine vend le GEO. */}
          <section className="hero">
            <div className="wrap bulle-xl hero-moteur">
              <p className="hero-label">{t(L, "L'expertise GEO, par Alliance MANA")}</p>
              {/* ⚠️ `alt=""` à dessein : le logo porte déjà le mot MANAHOME, et
                  le <h1> juste à côté le porte aussi. Le décrire ferait
                  entendre le nom deux fois à un lecteur d'écran. */}
              <div className="hero-marque">
                <img className="hero-logo" src={logo} alt="" width={1024} height={1024} />
                <h1 className="brand-grand">
                  MANA<em>home</em>
                </h1>
              </div>
              {/* ⭐ La sonde est le premier geste possible, donc elle vient
                  tout de suite après le logo — avant même la promesse. Un
                  produit d'appel placé après deux paragraphes et deux boutons
                  n'appelle plus personne.
                  ⚠️ Elle était d'abord dans le header, où son enveloppe
                  héritait du gabarit de la barre : 116 px de débordement. */}
              <SondeGeo />
              <p className="section-accroche">
                {t(L, "Vos clients demandent à ChatGPT. Savez-vous ce qu'il répond sur vous ? Testez votre site en 30 secondes, gratuitement — puis mesurez votre visibilité réelle à partir de 149 €.")}
              </p>
              <div className="est-actions">
                <a className="btn btn-clair" href={lien(`/approche`)}>
                  {t(L, "Demander un audit")}
                </a>
                <a className="btn btn-clair" href={lien(`/#offres`)}>
                  {t(L, "Voir les offres")}
                </a>
              </div>
            </div>
          </section>

          <main className="wrap">
            {/* 01 — la section de tête. ⭐ 11/11/2026 : son bouton était
                codé en dur vers /annonces/crozon — le dernier lien de la
                vitrine vers le pilote location. Il est retiré, et la section
                lit désormais son `cta` dans SECTIONS comme ses voisines :
                un lien se change dans la DONNÉE, plus dans le gabarit. */}
            <section className="landing-section bulle">
              <h2 className="section-title">{t(L, SECTIONS[0].titre)}</h2>
              {/* ⭐ 11/11/2026 — l'encadré bleu (.sous-bulle) est retiré : le
                  contenu vit directement dans le conteneur clair. */}
              <p className="section-accroche">{t(L, SECTIONS[0].accroche)}</p>
              {/* Le constat AVANT l'explication : trois faits mesurés chez
                  nous, jamais une statistique de marché invérifiable. */}
              <ul className="constats">
                {/* ⭐ Le premier constat est VIVANT : il se lit sur le serveur
                    et avance au débit mesuré. Il était écrit en dur, avec sa
                    date — juste le jour de l'écriture, faux le lendemain. */}
                <CompteurAgentsIa />
                {CONSTATS.map((c) => (
                  <li key={c.chiffre + c.unite}>
                    <span className="constat-chiffre">{c.chiffre}</span>
                    <span className="constat-unite">{t(L, c.unite)}</span>
                    <span className="constat-quoi">{t(L, c.quoi)}</span>
                  </li>
                ))}
              </ul>
              <p className="section-texte">{t(L, SECTIONS[0].texte)}</p>
              {SECTIONS[0].cta && (
                <div className="est-actions">
                  <a className="btn btn-clair" href={lien(`${SECTIONS[0].cta.href}`)}>
                    {t(L, SECTIONS[0].cta.label)}
                  </a>
                </div>
              )}
            </section>

            {/* 02 → 04 — la section Offres porte l'ancre #offres, citée par
                la navigation et le hero. */}
            {SECTIONS.slice(1).map((s) => (
                <section
                  key={s.num}
                  id={s.num === "03" ? "offres" : undefined}
                  className="landing-section alt bulle"
                >
                  <h2 className="section-title">{t(L, s.titre)}</h2>
                  {/* ⭐ 11/11/2026 — plus d'encadré bleu : le contenu vit directement dans le conteneur clair. */}
                  <p className="section-accroche">{t(L, s.accroche)}</p>
                  <p className="section-texte">{t(L, s.texte)}</p>
                  {s.num === "02" && (
                    <div className="differences">
                      <h3 className="tarif-sous-titre">{t(L, "Ce que nous faisons autrement")}</h3>
                      <ul className="differences-liste">
                        {DIFFERENCES.map((d) => (
                          <li key={d.titre}>
                            <strong>{t(L, d.titre)}</strong>
                            <span>{t(L, d.texte)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {s.num === "02" && (
                    <div className="rapport">
                      <p className="rapport-avertissement">
                        {t(L, "Exemple illustratif — aucune entreprise réelle, aucun résultat réel. Cette maquette montre la forme du livrable.")}
                      </p>
                      <p className="rapport-question">
                        <span className="rapport-etiquette">{t(L, "La question posée")}</span>
                        {t(L, EXEMPLE_QUESTION)}
                      </p>
                      <div className="rapport-table-enveloppe">
                        <table className="rapport-table">
                          <thead>
                            <tr>
                              <th>{t(L, "Assistant")}</th>
                              <th>{t(L, "Ce qu'il a répondu")}</th>
                              <th>{t(L, "Concurrents")}</th>
                              <th>{t(L, "Sources citées")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {EXEMPLE_LIGNES.map((r) => (
                              <tr key={r.moteur} className={`rapport-${r.etat}`}>
                                <th scope="row">{r.moteur}</th>
                                <td>{t(L, r.constat)}</td>
                                <td>{t(L, r.concurrents)}</td>
                                <td>{t(L, r.sources)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="rapport-legende">
                        {t(L, "Vous recevez la réponse intégrale de chaque assistant, pas ce résumé — et avec elle, tout ce qui permet de la rejouer :")}
                      </p>
                      <ul className="rapport-protocole">
                        {EXEMPLE_PROTOCOLE.map((x) => (<li key={x}>{t(L, x)}</li>))}
                      </ul>
                      <p className="rapport-legende">
                        {t(L, "C'est ce qui sépare une mesure d'une impression : un audit qu'on ne peut pas rejouer ne prouve rien, et un score seul ne se vérifie pas.")}
                      </p>
                    </div>
                  )}
                  {s.num === "04" && (
                    <div className="collectes">
                      <h3 className="tarif-sous-titre">{t(L, "Trois environnements de collecte, jamais confondus")}</h3>
                      <ul className="collectes-liste">
                        {COLLECTES.map((c) => (
                          <li key={c.cle}>
                            <span className="collecte-cle">{c.cle}</span>
                            <span className="collecte-titre">{t(L, c.titre)}</span>
                            <span className="collecte-quoi">{t(L, c.quoi)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="rapport-legende">
                        {t(L, "Chaque réponse du rapport indique l'environnement qui l'a produite. Les sept moteurs chinois ne sont pas accessibles par une API identique, et ne sont donc pas testés dans les mêmes conditions : un moteur dont la collecte n'a pas fonctionné est déclaré « non testé », jamais présenté comme testé.")}
                      </p>
                    </div>
                  )}
                  {s.num === "03" && (
                    <>
                      {/* ⭐ Deux familles, pas une grille de six. Un audit
                          qu'on paie une fois et un abonnement mensuel ne se
                          comparent pas : les aligner côte à côte oblige le
                          lecteur à faire ce tri lui-même, et c'est justement
                          le tri qui décide de l'achat. */}
                      {FAMILLES.map((fam) => (
                      <div key={fam.cle} className="tarifs-famille">
                      <h3 className="tarif-sous-titre">{t(L, fam.titre)}</h3>
                      <div className="tarifs">
                        {OFFRES_GEO.filter((o) => o.famille === fam.cle).map((o) => (
                          <article
                            key={o.nom}
                            className={`tarif-carte${o.recommande ? " tarif-recommande" : ""}`}
                          >
                            {o.recommande && (
                              <p className="tarif-fanion">{t(L, "Offre recommandée")}</p>
                            )}
                            {ILLUSTRATIONS[o.nom] && (
                              /* ⚠️ `alt=""` et `loading="lazy"` : l'image
                                 répète le nom, le prix et les points déjà
                                 écrits en dessous — la décrire ferait tout
                                 entendre deux fois. Et six images de 1024 px
                                 pèsent 1 Mo : hors de l'écran au chargement,
                                 elles ne doivent pas retarder le premier
                                 rendu. */
                              <img
                                className="tarif-illustration"
                                src={ILLUSTRATIONS[o.nom]}
                                alt=""
                                width={1024}
                                height={1024}
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                            <h3 className="tarif-nom">{o.nom}</h3>
                            <p className="tarif-prix">{prixAffiche(o)}</p>
                            <p className="tarif-unite">{t(L, o.unite)}</p>
                            {o.depend && <p className="tarif-depend">{t(L, o.depend)}</p>}
                            <p className="tarif-pour">{t(L, o.pour)}</p>
                            <ul className="tarif-points">
                              {o.points.map((pt) => (
                                <li key={pt}>{t(L, pt)}</li>
                              ))}
                            </ul>
                          </article>
                        ))}
                      </div>
                      </div>
                      ))}
                      {/* ⚠️ Cette note n'est pas de la prudence juridique
                          décorative : elle dit ce que le produit ne PEUT
                          pas faire. Copilot et Google AI Overviews n'ont
                          pas d'accès permettant de les mesurer sans les
                          gratter — les annoncer serait vendre six moteurs
                          et en livrer quatre. */}
                      <p className="tarif-note">
                        {t(L, "Nous interrogeons les quatre assistants que vos clients utilisent vraiment : ChatGPT, Gemini, Claude et Perplexity. Copilot et Google AI Overviews n'offrent aucun accès mesurable — nous l'écrivons dans le rapport plutôt que d'inventer un chiffre. Vous saurez toujours ce qui a été mesuré, et ce qui ne l'a pas été.")}
                      </p>
                      <p className="tarif-note">
                        {t(L, "Personne ne peut garantir qu'une IA vous recommandera. Nous vendons la mesure, pas la promesse : vous recevez ce que les assistants répondent vraiment, avec leurs sources. Et aucun achat ne peut modifier les conclusions d'un audit — c'est précisément ce qui les rend utilisables face à votre direction ou à votre conseil.")}
                      </p>
                      {/* ⭐ Le tableau vient APRÈS les cartes et AVANT les
                          notes : c'est là que se joue le choix entre deux
                          prix qu'on vient de lire. */}
                      <div className="comparaison">
                        <h3 className="tarif-sous-titre">{t(L, "Express ou Expert : ce qui change")}</h3>
                        <div className="rapport-table-enveloppe">
                          <table className="rapport-table comparaison-table">
                            <thead>
                              <tr>
                                <th>{t(L, "Critère")}</th>
                                {COMPARAISON.colonnes.map((c) => (<th key={c}>{c}</th>))}
                              </tr>
                            </thead>
                            <tbody>
                              {COMPARAISON.lignes.map((l) => (
                                <tr key={l.critere}>
                                  <th scope="row">{t(L, l.critere)}</th>
                                  <td>{t(L, l.express)}</td>
                                  <td>{t(L, l.expert)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {/* ⭐ Après les prix, avant le départ : c'est le moment
                          où le lecteur se demande « et les autres ? ». On lui
                          répond nous-mêmes, en lui laissant deux questions à
                          poser — chez nous comme ailleurs. */}
                      <div className="franchise">
                        <h3 className="tarif-sous-titre">{t(L, "Ce qu'on ne vous dira pas ailleurs")}</h3>
                        {FRANCHISE.map((f) => (
                          <div key={f.titre} className="franchise-bloc">
                            <p className="franchise-titre">{t(L, f.titre)}</p>
                            <p className="franchise-texte">{t(L, f.texte)}</p>
                          </div>
                        ))}
                      </div>
                      {/* ⚠️ La FAQ en <details> natifs : elle se déplie sans
                          JavaScript, donc elle est lisible par un robot et par
                          qui a coupé le script. Une FAQ que les machines ne
                          voient pas, sur un site qui vend la lisibilité
                          machine, serait difficile à défendre. */}
                      <div className="faq">
                        <h3 className="tarif-sous-titre">{t(L, "Questions fréquentes")}</h3>
                        {FAQ.map((x) => (
                          <details key={x.q} className="faq-item">
                            <summary>{t(L, x.q)}</summary>
                            <p>{t(L, x.r)}</p>
                          </details>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="est-actions">
                    {s.cta && (
                      <a className="btn btn-clair" href={lien(`${s.cta.href}`)}>
                        {t(L, s.cta.label)}
                      </a>
                    )}
                    {s.num === "03" && (
                      <a className="btn btn-clair" href={lien(`/#contact`)}>
                        {t(L, "Commander un audit")}
                      </a>
                    )}
                  </div>
                </section>
            ))}
          </main>
        </>
      )}

      <footer className="site-footer">
        <div className="wrap footer-colonnes">
          <div>
            <p className="brand">
              MANA<em>home</em>
            </p>
            <p className="footer-note">
              {t(L, "MANAhome mesure ce que les assistants IA répondent sur les organisations : audits ponctuels, surveillance mensuelle, infrastructure lisible par les machines. Édité par Alliance MANA, association loi 1901. Être mieux compris améliore vos chances d'être cité ; aucune IA ne peut être obligée de le faire.")}
            </p>
            {/* ⚠️ /approche porte DÉJÀ le formulaire, en pleine page : l'y
                répéter dans le pied donnait deux formulaires identiques
                empilés, et deux ancres #contact sur la même page — un lien
                « Contact » ne savait plus laquelle viser. */}
            {path !== "/approche" && (
              <div id="contact">
                <ContactForm />
              </div>
            )}
          </div>
          <nav className="footer-nav" aria-label={t(L, "Pied de page")}>
            <a href={lien(`/#offres`)}>{t(L, "Offres & tarifs")}</a>
            <a href={lien(`/approche`)}>{t(L, "Notre approche")}</a>
            <a href={lien(`/#contact`)}>{t(L, "Contact")}</a>
            <a href={lien(`/mentions-legales`)}>{t(L, "Mentions légales")}</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
