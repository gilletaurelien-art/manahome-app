import { useEffect } from "react";
import { poserCanonique } from "./canonique";
import { annonceLocaleParId, enAnnonce } from "./annoncesLocales";
import {
  GlyphMaison,
  GlyphCompas,
  GlyphStructure,
  GlyphAccompagnement,
  GlyphTerritoire } from "./Glyphs";
import {
  NavAnnonces,
  NavTerritoire,
  NavPublier } from "./NavGlyphs";
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
const SECTIONS = [
  {
    glyphe: GlyphCompas,
    num: "01",
    titre: "Être trouvé par les IA",
    accroche: "Le GEO : la visibilité qui se construit, pas celle qui s'achète.",
    texte:
      "llms.txt, Model Context Protocol, données structurées : TEMPOsystem vend l'infrastructure machine-readable elle-même — ce que ni les agences de contenu, ni les tableaux de bord de mesure ne proposent. La preuve vivante : manafrance.org, plus de 4,3 millions de visites d'agents IA mesurées." },
  {
    glyphe: GlyphStructure,
    num: "02",
    titre: "L'audit GEO de votre structure",
    accroche: "Mairies, associations, offices de tourisme, entreprises.",
    texte:
      "Où en êtes-vous dans les assistants ? Qu'est-ce qui vous empêche d'être compris, trouvé, cité ? L'audit mesure l'état réel, puis la mise en œuvre suit : structuration, exposition, interrogeabilité. Sur devis — aucun prix n'est arrêté à ce jour, et nous n'en affichons pas.",
    cta: { label: "Demander un audit", href: "/approche" } },
  {
    glyphe: GlyphAccompagnement,
    num: "03",
    titre: "Les offres arrêtées",
    accroche: "Les prix tranchés, rien d'autre.",
    texte:
      "L'assistant : 9 €/mois par humain, jamais par structure. La fiche pro : 9 €. L'antenne : 9 €. Ces prix sont arrêtés — tout ce qui ne l'est pas reste sur devis, et le site ne l'invente pas.",
    // ⭐ Pas de `cta` ici, à dessein : cette section PORTE l'ancre #offres.
    // Un bouton « Voir les offres » y pointant renverrait sur elle-même —
    // le hero et la navigation l'utilisent pour DESCENDRE jusqu'ici.
    },
  {
    glyphe: GlyphTerritoire,
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
            <GlyphMaison size={28} />
          </a>
          <nav className="nav">
            <a href={lien(`/approche`)}>
              <NavTerritoire />
              <span>{t(L, "Notre approche")}</span>
            </a>
            <a href={lien(`/#offres`)}>
              <NavAnnonces />
              <span>{t(L, "Offres & tarifs")}</span>
            </a>
            <a href={lien(`/#contact`)} className="nav-cta">
              <NavPublier />
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
              <div className="sous-bulle">
                <p className="section-accroche">{t(L, SECTIONS[0].accroche)}</p>
                <p className="section-texte">{t(L, SECTIONS[0].texte)}</p>
                {SECTIONS[0].cta && (
                  <div className="est-actions">
                    <a className="btn btn-clair" href={lien(`${SECTIONS[0].cta.href}`)}>
                      {t(L, SECTIONS[0].cta.label)}
                    </a>
                  </div>
                )}
              </div>
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
                  <div className="sous-bulle">
                    <p className="section-accroche">{t(L, s.accroche)}</p>
                    <p className="section-texte">{t(L, s.texte)}</p>
                    <div className="est-actions">
                      {s.cta && (
                        <a className="btn btn-clair" href={lien(`${s.cta.href}`)}>
                          {t(L, s.cta.label)}
                        </a>
                      )}
                    </div>
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
