import { useEffect, useState } from "react";
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
// LOCATION DE VACANCES, entre propriétaires et vacanciers. Les sections 02
// (ex-« Vendre ou louer ») et 05 (ex-« Pros & services de l'habitat »,
// retirée) sont réécrites ou retirées en conséquence.
const SECTIONS = [
  {
    glyphe: GlyphCompas,
    num: "01",
    titre: "Découvrez les séjours",
    accroche: "Des locations de vacances, près de chez vous",
    texte:
      "Un accès direct aux annonces, sans compte à créer. Le catalogue est volontairement restreint et soigné — chaque fiche est structurée, sourcée, honnête." },
  {
    glyphe: GlyphAccompagnement,
    num: "02",
    titre: "Louez votre logement avec MANA",
    accroche: "Vous gardez la main. MANA vous accompagne.",
    texte:
      "Préparation de l'annonce, documents à prévoir (déclaration de meublé touristique, attestation d'assurance), calendrier de réservation : le propriétaire reste maître de son bien.",
    cta: { label: "Publier mon annonce", href: "/publier" } },
  {
    glyphe: GlyphStructure,
    num: "03",
    titre: "Annonces pour les IA",
    accroche: "Votre logement mérite d'être trouvé, pas noyé.",
    texte:
      "Caractéristiques organisées, informations utiles, page publique accessible aux moteurs et assistants compatibles.",
    cta: { label: "Comprendre notre approche", href: "/approche" } },
  {
    glyphe: GlyphTerritoire,
    num: "04",
    titre: "L'index des communes",
    accroche: "Un lieu, une fiche : la vie autour du séjour.",
    texte:
      "Transports, commerces, écoles, services, nature : chaque commune du territoire présentée honnêtement, avec des informations vérifiées lorsque c'est possible.",
    cta: { label: "Découvrir le territoire", href: "/territoire/crozon" } },
];

// Le moteur n'a plus qu'une distinction : chercher un séjour, ou publier
// le sien. Aucun choix vente/achat/services — un seul produit, deux côtés.
const MOTEUR_CATEGORIES = [
  { v: "chercher", l: "Trouver un séjour" },
  { v: "louer", l: "Louer mon bien" },
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
  const [moteurCategorie, setMoteurCategorie] = useState("chercher");
  const [moteurLieu, setMoteurLieu] = useState("");

  // Deux côtés, un seul produit : chercher un séjour, ou publier son bien —
  // plus de distinction acheter/vendre/services (repositionné 04/11/2026).
  const moteurRechercher = () => {
    const params = new URLSearchParams();
    if (moteurLieu.trim()) params.set("q", moteurLieu.trim());
    if (moteurCategorie === "chercher") {
      window.location.assign(lien(`/annonces/crozon?${params}`));
    } else {
      window.location.assign(
        lien(`/publier${moteurLieu.trim() ? `?lieu=${encodeURIComponent(moteurLieu.trim())}` : ""}`),
      );
    }
  };
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
            <a href={lien(`/annonces/crozon`)}>
              <NavAnnonces />
              <span>{t(L, "Vacances")}</span>
            </a>
            <a href={lien(`/territoire/crozon`)}>
              <NavTerritoire />
              <span>{t(L, "Territoire")}</span>
            </a>
            <a href={lien(`/publier`)} className="nav-cta">
              <NavPublier />
              <span>{t(L, "Publier")}</span>
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
          {/* Hero : le logo en grand, la promesse en dessous */}
          <section className="hero">
            <div className="wrap bulle-xl hero-moteur">
              <p className="hero-label">{t(L, "Les vacances, autrement")}</p>
              <h1 className="brand-grand">
                MANA<em>home</em>
              </h1>
              <div className="moteur">
                <div className="moteur-categories" role="group" aria-label={t(L, "Je cherche")}>
                  {MOTEUR_CATEGORIES.map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      className={`moteur-categorie-btn ${moteurCategorie === c.v ? "on" : ""}`}
                      aria-pressed={moteurCategorie === c.v}
                      onClick={() => setMoteurCategorie(c.v)}
                    >
                      {t(L, c.l)}
                    </button>
                  ))}
                </div>

                <div className="moteur-barre">
                  <svg className="moteur-loupe" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m15.5 15.5 4.5 4.5" />
                  </svg>
                  <input
                    id="moteur-lieu"
                    type="search"
                    autoComplete="off"
                    placeholder={t(L, "Commune ou code postal")}
                    value={moteurLieu}
                    onChange={(e) => setMoteurLieu(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && moteurRechercher()}
                  />
                  <button
                    type="button"
                    className="moteur-fleche"
                    aria-label={t(L, "Rechercher")}
                    onClick={moteurRechercher}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 12h15" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </button>
                </div>

              </div>
            </div>
          </section>


          <main className="wrap">
            {/* 01 — Catalogue : bulle avec sous-bulle, résultats dans la recherche */}
            <section className="landing-section bulle">
              <h2 className="section-title">{t(L, SECTIONS[0].titre)}</h2>
              <div className="sous-bulle">
                <p className="section-accroche">{t(L, SECTIONS[0].accroche)}</p>
                <p className="section-texte">{t(L, SECTIONS[0].texte)}</p>
                <div className="est-actions">
                  <a className="btn btn-clair" href={lien(`/annonces/crozon`)}>
                    {t(L, "Parcourir le catalogue")}
                  </a>
                </div>
              </div>
            </section>

            {/* 02 → 05 */}
            {SECTIONS.slice(1).map((s) => (
                <section key={s.num} className="landing-section alt bulle">
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
              {t(L, "Portail de locations de vacances, entre propriétaires et vacanciers. Gratuit, accompagné, lisible par les IA. La structuration améliore les chances de compréhension et de découverte ; elle ne garantit pas qu'un assistant IA indexera, recommandera ou citera une annonce.")}
            </p>
            <ContactForm />
          </div>
          <nav className="footer-nav" aria-label={t(L, "Pied de page")}>
            <a href={lien(`/annonces/crozon`)}>{t(L, "Vacances")}</a>
            <a href={lien(`/territoire/crozon`)}>{t(L, "Territoire")}</a>
            <a href={lien(`/publier`)}>{t(L, "Publier — gratuit")}</a>
            <a href={lien(`/approche`)}>{t(L, "Notre approche")}</a>
            <a href={lien(`/messagerie`)}>{t(L, "Ma messagerie")}</a>
            <a href={lien(`/mes-annonces`)}>{t(L, "Mes annonces")}</a>
            <a href={lien(`/approche`)}>{t(L, "À propos")}</a>
            <a href={lien(`/mentions-legales`)}>{t(L, "Mentions légales")}</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
