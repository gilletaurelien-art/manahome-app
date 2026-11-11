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
// ⭐ 11/11/2026 — les prix GEO sont ARRÊTÉS (décision d'Aurélien). La page
// disait « aucun prix n'est arrêté à ce jour » : c'est devenu faux le jour
// même, et une phrase pareille sur une page de vente est un faux témoin.
// ⚠️ Les prix vivent ICI, en donnée, et NULLE PART ailleurs dans le gabarit :
//    un prix recopié à deux endroits diverge au premier changement.
const OFFRES_GEO = [
  {
    nom: "GEO Express",
    prix: "149 €",
    unite: "HT · paiement unique",
    pour: "Pour une photographie rapide de sa présence dans les IA.",
    points: [
      "Exploration automatisée du site",
      "Identification de l'entreprise et de ses activités",
      "Panel de questions commerciales",
      "Vérification de la présence et de l'exactitude des réponses",
      "Rapport synthétique et premières recommandations",
    ] },
  {
    nom: "GEO Expert",
    prix: "390 €",
    unite: "HT · paiement unique",
    recommande: true,
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
    nom: "GEO International",
    prix: "+199 €",
    unite: "HT · option sur GEO Expert",
    pour: "Pour mesurer sa visibilité sur un marché étranger.",
    points: [
      "Audit complémentaire sur un marché étranger",
      "Analyse dans une autre langue",
      "Comparaison des concurrents locaux",
      "Identification des sources et informations manquantes",
    ] },
  {
    nom: "GEO Monitoring",
    prix: "99 €",
    unite: "HT par mois · abonnement",
    pour: "Pour suivre son évolution, mois après mois.",
    points: [
      "Le même panel de questions rejoué chaque mois",
      "Suivi des concurrents et des changements de position",
      "Repérage des nouvelles sources citées",
      "Détection des réponses erronées ou des disparitions",
      "Rapport comparatif mensuel et historique conservé",
    ] },
  {
    nom: "MANA GEO China",
    prix: "+490 €",
    unite: "HT · audit complémentaire ponctuel",
    pour: "Pour savoir ce que les IA chinoises disent de vous.",
    points: [
      "Sept moteurs chinois : DeepSeek, Doubao, Qwen, Kimi, Yuanbao, ERNIE, GLM",
      "Questions posées EN chinois simplifié, pas traduites du français",
      "Réponses analysées en chinois avant d'être restituées en français",
      "Concurrents chinois et internationaux cités",
      "Sources locales identifiées",
      "Recommandations pour améliorer sa visibilité en Chine",
    ] },
  {
    nom: "GEO China Monitoring",
    prix: "+149 €",
    unite: "HT par mois · complément de GEO Monitoring",
    pour: "Pour suivre la visibilité chinoise dans le temps.",
    points: [
      "Les mêmes sept moteurs, les mêmes questions, chaque mois",
      "Évolution de la visibilité chinoise",
      "Nouveaux concurrents et nouvelles sources",
    ] },
];

// Les prix déjà arrêtés de l'écosystème, inchangés.
const OFFRES_MANA = [
  { nom: "L'assistant", prix: "9 €", unite: "HT par mois et PAR HUMAIN, jamais par structure" },
  { nom: "La fiche pro", prix: "9 €", unite: "HT" },
  { nom: "L'antenne", prix: "9 €", unite: "HT" },
];

const SECTIONS = [
  {
    num: "01",
    titre: "Être trouvé par les IA",
    accroche: "Le GEO : la visibilité qui se construit, pas celle qui s'achète.",
    texte:
      "llms.txt, Model Context Protocol, données structurées : TEMPOsystem vend l'infrastructure machine-readable elle-même — ce que ni les agences de contenu, ni les tableaux de bord de mesure ne proposent. La preuve vivante : manafrance.org, plus de 4,3 millions de visites d'agents IA mesurées." },
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
      "Caractéristiques organisées, données structurées, page publique en accès libre : le registre territorial est non marchand — aucune mise en avant payante, aucun ordre achetable. La structuration améliore les chances d'être compris et trouvé ; elle ne garantit pas qu'un assistant indexera ou citera une page.",
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
              <p className="hero-label">{t(L, "Le GEO, par TEMPOsystem")}</p>
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
                  {s.num === "03" && (
                    <>
                      <div className="tarifs">
                        {OFFRES_GEO.map((o) => (
                          <article
                            key={o.nom}
                            className={`tarif-carte${o.recommande ? " tarif-recommande" : ""}`}
                          >
                            {o.recommande && (
                              <p className="tarif-fanion">{t(L, "Offre recommandée")}</p>
                            )}
                            <h3 className="tarif-nom">{o.nom}</h3>
                            <p className="tarif-prix">{o.prix}</p>
                            <p className="tarif-unite">{t(L, o.unite)}</p>
                            <p className="tarif-pour">{t(L, o.pour)}</p>
                            <ul className="tarif-points">
                              {o.points.map((pt) => (
                                <li key={pt}>{t(L, pt)}</li>
                              ))}
                            </ul>
                          </article>
                        ))}
                      </div>
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
                            <span className="tarif-prix-simple">{o.prix}</span>
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
              {t(L, "Vitrine du GEO et des offres de l'écosystème MANA, opérée par TEMPOsystem. Prix affichés : uniquement les prix arrêtés — tout le reste est sur devis. Le GEO améliore les chances d'être compris et trouvé par les assistants IA ; il ne garantit ni indexation, ni citation, ni recommandation.")}
            </p>
            <div id="contact">
              <ContactForm />
            </div>
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
