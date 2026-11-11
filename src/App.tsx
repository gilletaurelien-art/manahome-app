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
// ⭐ Les prix ne vivent plus ici : ils sont dans src/offres.ts, lu AUSSI par
//    vite.config.ts pour le JSON-LD. Deux lecteurs, une seule source.
import { OFFRES_GEO, OFFRES_MANA, FAMILLES, prixAffiche } from "./offres";

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
  { chiffre: "5 922 180", unite: "requêtes d'agents IA",
    quoi: "sur manafrance.org, du 20 septembre au 11 novembre 2026. Ils passent, qu'on le sache ou non." },
  { chiffre: "13", unite: "agents distincts",
    quoi: "ClaudeBot, Applebot, GPTBot, Perplexity et dix autres — chacun lit, retient, et répondra avec ce qu'il a retenu." },
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
    titre: "Les offres arrêtées",
    accroche: "Les prix tranchés, rien d'autre.",
    texte:
      "Tout ce qui est affiché ici est arrêté. Ce qui ne l'est pas n'apparaît pas : le site n'invente aucune grille, et ne vous laisse pas découvrir le prix après le devis.",
    // ⭐ Pas de `cta` ici, à dessein : cette section PORTE l'ancre #offres.
    // Un bouton « Voir les offres » y pointant renverrait sur elle-même —
    // le hero et la navigation l'utilisent pour DESCENDRE jusqu'ici.
    },
  {
    num: "04",
    titre: "La maison des IA",
    accroche: "Les machines interrogent. MANA tient le registre honnête.",
    texte:
      "Pourquoi nous croire ? Parce que nous ne vendons pas ce que nous mesurons. Le registre territorial de l'écosystème est non marchand : aucune mise en avant payante, aucun ordre achetable. L'audit reste indépendant de toute prestation d'optimisation — aucun achat ne peut en modifier les conclusions. Nous mesurons d'abord sur nos propres sites avant de le proposer aux vôtres. Et nous disons ce que nous ne savons pas faire : la structuration améliore les chances d'être compris et trouvé, elle ne garantit pas qu'un assistant indexera ou citera une page.",
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
              <p className="hero-label">{t(L, "Le GEO, par Alliance MANA")}</p>
              <h1 className="brand-grand">
                MANA<em>home</em>
              </h1>
              <p className="section-accroche">
                {t(L, "Être trouvé par les assistants IA : l'infrastructure machine-readable, les audits, et les offres arrêtées de l'écosystème MANA.")}
              </p>
              <div className="est-actions">
                <a className="btn btn-clair" href={lien(`/approche`)}>
                  {t(L, "Demander un audit")}
                </a>
                <a className="btn btn-clair" href={lien(`/#offres`)}>
                  {t(L, "Voir les offres")}
                </a>
              </div>
              {/* ⭐ La sonde est DANS le hero : c'est le produit d'appel, et la
                  première chose qu'un visiteur peut faire sans rien donner.
                  ⚠️ Elle était d'abord dans le header, où son enveloppe
                  héritait du gabarit de la barre — 116 px de débordement. Ici
                  elle vit dans la carte du hero et n'a plus de largeur à
                  calculer. */}
              <SondeGeo />
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
                        {t(L, "Quatre assistants occidentaux sont interrogés : ChatGPT, Gemini, Claude et Perplexity. Microsoft Copilot et Google AI Overviews n'exposent aucun accès permettant de les mesurer honnêtement : ils sont déclarés « non testés », jamais comptés comme une absence.")}
                      </p>
                      <p className="tarif-note">
                        {t(L, "MANA GEO ne garantit jamais une recommandation par une IA, et ne la vend pas. Il mesure, documente et explique ce que les assistants répondent réellement — et aucune prestation d'optimisation ne peut en modifier les conclusions.")}
                      </p>
                      <h3 className="tarif-sous-titre">{t(L, "Les autres prix arrêtés")}</h3>
                      <ul className="tarifs-simples">
                        {OFFRES_MANA.map((o) => (
                          <li key={o.nom}>
                            <strong>{t(L, o.nom)}</strong>
                            <span className="tarif-prix-simple">{prixAffiche(o)}</span>
                            <span className="tarif-unite">{t(L, o.unite)}</span>
                          </li>
                        ))}
                      </ul>
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
              {t(L, "Vitrine du GEO et des offres de l'écosystème MANA, éditée par Alliance MANA. Prix affichés : uniquement les prix arrêtés — tout le reste est sur devis. Le GEO améliore les chances d'être compris et trouvé par les assistants IA ; il ne garantit ni indexation, ni citation, ni recommandation.")}
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
