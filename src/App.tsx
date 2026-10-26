import { useState } from "react";
import { annonceLocaleParId, enAnnonce } from "./annoncesLocales";
import {
  GlyphCompas,
  GlyphStructure,
  GlyphAccompagnement,
  GlyphTerritoire,
  GlyphPros } from "./Glyphs";
import {
  NavAnnonces,
  NavTerritoire,
  NavPros,
  NavPublier,
  NavEstimation } from "./NavGlyphs";
import {
  usePath,
  routeAnnonce,
  annonceParId,
  routeTerritoire,
  territoireParSlug,
  routeAnnonces,
  baseUrl } from "./router";
import { AnnonceDetail } from "./AnnonceDetail";
import { TerritoireDetail } from "./TerritoireDetail";
import { Publier } from "./Publier";
import { Estimation } from "./Estimation";
import { AnnoncesListe } from "./AnnoncesListe";
import { Approche } from "./Approche";
import { Pros } from "./Pros";
import { Messagerie } from "./Messagerie";
import { EspacePro } from "./EspacePro";
import { MesAnnonces } from "./MesAnnonces";

// Tri SQL reflété côté front : une annonce importée ne passe jamais
// devant une directe à adéquation égale.

const SECTIONS = [
  {
    glyphe: GlyphCompas,
    num: "01",
    titre: "Découvrez les biens",
    accroche: "Vente et location, près de chez vous",
    texte:
      "Un accès direct aux biens, sans compte à créer. En pilote, le catalogue est volontairement restreint et soigné — chaque fiche est structurée, sourcée, honnête." },
  {
    glyphe: GlyphAccompagnement,
    num: "02",
    titre: "Vendre ou louer avec MANA",
    accroche: "Vous gardez la main. MANA vous accompagne.",
    texte:
      "Estimation indicative, préparation de l'annonce, documents à prévoir, compréhension du prix ou du loyer : le particulier reste maître de son projet.",
    cta: { label: "Publier mon annonce", href: "/publier" },
    cta2: { label: "Estimer mon bien", href: "/estimation" } },
  {
    glyphe: GlyphStructure,
    num: "03",
    titre: "Annonces pour les IA",
    accroche: "Votre bien mérite d'être trouvé, pas noyé.",
    texte:
      "Caractéristiques organisées, informations utiles, page publique accessible aux moteurs et assistants compatibles.",
    cta: { label: "Comprendre notre approche", href: "/approche" } },
  {
    glyphe: GlyphTerritoire,
    num: "04",
    titre: "L'index des communes",
    accroche: "Un lieu, une fiche : la vie autour du bien.",
    texte:
      "Transports, commerces, écoles, services, nature : chaque commune du territoire présentée honnêtement, avec des informations vérifiées lorsque c'est possible.",
    cta: { label: "Découvrir le territoire de Crozon", href: "/territoire/crozon" } },
  {
    glyphe: GlyphPros,
    num: "05",
    titre: "Professionnels & services de l'habitat",
    accroche: "Ceux qui vendent, louent… et ceux qui soignent les logements.",
    texte:
      "Agences, notaires, réparateurs, diagnostics : un seul référentiel, factuel, sans recommandation.",
    cta: {
      label: "Découvrir les pros & services du territoire",
      href: "/pros" } },
];

const MOTEUR_CATEGORIES = [
  { v: "acheter", l: "Acheter" },
  { v: "vendre", l: "Vendre" },
  { v: "louer", l: "Louer" },
  { v: "entretenir", l: "Services" },
];

// Sous le bouton Services : tout ce qui fait vivre l'habitat —
// l'immobilier pro ET les services à la personne autour du logement.
const SERVICES_CATEGORIES_MOTEUR = [
  { v: "pro", l: "Agence immobilière / mandataire" },
  { v: "notaire", l: "Notaire" },
  { v: "reparation", l: "Réparation & travaux" },
  { v: "menage", l: "Ménage & nettoyage" },
  { v: "jardinage", l: "Jardin & extérieur" },
  { v: "garde", l: "Garde de logement" },
  { v: "diagnostic", l: "Diagnostics & expertise" },
  { v: "autonomie", l: "Autonomie & adaptation" },
];

const B = baseUrl();

export default function App() {
  const path = usePath();
  const [moteurCategorie, setMoteurCategorie] = useState("acheter");
  const [servicesOuvert, setServicesOuvert] = useState(false);
  const [moteurLieu, setMoteurLieu] = useState("");

  const moteurRechercher = () => {
    const params = new URLSearchParams();
    if (moteurLieu.trim()) params.set("q", moteurLieu.trim());
    if (moteurCategorie === "acheter" || moteurCategorie === "louer") {
      params.set("tx", moteurCategorie === "louer" ? "location" : "vente");
      window.location.assign(`${B}/annonces/crozon?${params}`);
    } else if (moteurCategorie === "vendre") {
      window.location.assign(`${B}/publier?tx=${params.get("tx") ?? "vente"}${params.get("q") ? `&lieu=${encodeURIComponent(params.get("q")!)}` : ""}`);
    } else {
      // pro / notaire / service : la page /pros regroupe le référentiel
      window.location.assign(`${B}/pros?${params}`);
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
          <a className="brand" href={`${B}/`}>
            MANA<em>home</em>
          </a>
          <nav className="nav">
            <a href={`${B}/annonces/crozon`}>
              <NavAnnonces />
              <span>Annonces</span>
            </a>
            <a href={`${B}/estimation`}>
              <NavEstimation />
              <span>Estimation</span>
            </a>
            <a href={`${B}/territoire/crozon`}>
              <NavTerritoire />
              <span>Territoire</span>
            </a>
            <a href={`${B}/pros`}>
              <NavPros />
              <span>Pros &amp; services</span>
            </a>
            <a href={`${B}/publier`} className="nav-cta">
              <NavPublier />
              <span>Publier — gratuit</span>
            </a>
          </nav>
        </div>
      </header>

      {annonce ? (
        <AnnonceDetail annonce={annonce} />
      ) : path === "/publier" ? (
        <Publier />
      ) : path === "/estimation" ? (
        <Estimation />
      ) : listeSlug ? (
        <AnnoncesListe slug={listeSlug} />
      ) : path === "/approche" ? (
        <Approche />
      ) : path === "/pros" ? (
        <Pros />
      ) : path === "/messagerie" ? (
        <Messagerie />
      ) : path === "/espace-pro" ? (
        <EspacePro />
      ) : path === "/mes-annonces" ? (
        <MesAnnonces />
      ) : path === "/services" ? (
        window.location.replace(`${baseUrl()}/pros`)
      ) : territoire ? (
        <TerritoireDetail territoire={territoire} />
      ) : (
        <>
          {/* Hero : le logo en grand, la promesse en dessous */}
          <section className="hero">
            <div className="wrap bulle-xl hero-moteur">
              <p className="hero-label">L'immobilier, autrement</p>
              <h1 className="brand-grand">
                MANA<em>home</em>
              </h1>
              <div className="moteur">
                <div className="moteur-categories" role="group" aria-label="Je cherche">
                  {MOTEUR_CATEGORIES.map((c) =>
                    c.v === "entretenir" ? (
                      <div key={c.v} className="moteur-services-wrap">
                        <button
                          type="button"
                          className={`moteur-categorie-btn moteur-btn-or ${servicesOuvert || (moteurCategorie !== "acheter" && moteurCategorie !== "louer") ? "on" : ""}`}
                          aria-expanded={servicesOuvert}
                          aria-haspopup="listbox"
                          onClick={() => setServicesOuvert((o) => !o)}
                        >
                          {SERVICES_CATEGORIES_MOTEUR.find((sv) => sv.v === moteurCategorie)?.l ?? c.l}
                          <span className="chevron" aria-hidden="true">▾</span>
                        </button>
                        {servicesOuvert && (
                          <ul className="suggestions moteur-services-menu" role="listbox">
                            {SERVICES_CATEGORIES_MOTEUR.map((sv) => (
                              <li key={sv.v} role="option" aria-selected={moteurCategorie === sv.v}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMoteurCategorie(sv.v);
                                    setServicesOuvert(false);
                                  }}
                                >
                                  {sv.l}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <button
                        key={c.v}
                        type="button"
                        className={`moteur-categorie-btn ${moteurCategorie === c.v ? "on" : ""}`}
                        aria-pressed={moteurCategorie === c.v}
                        onClick={() => setMoteurCategorie(c.v)}
                      >
                        {c.l}
                      </button>
                    )
                  )}
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
                    placeholder={
                      moteurCategorie === "acheter" || moteurCategorie === "louer"
                        ? "Commune ou code postal"
                        : "Commune, métier ou besoin"
                    }
                    value={moteurLieu}
                    onChange={(e) => setMoteurLieu(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && moteurRechercher()}
                  />
                  <button
                    type="button"
                    className="moteur-fleche"
                    aria-label="Rechercher"
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
              <h2 className="section-title">{SECTIONS[0].titre}</h2>
              <div className="sous-bulle">
                <p className="section-accroche">{SECTIONS[0].accroche}</p>
                <p className="section-texte">{SECTIONS[0].texte}</p>
              </div>
              <div className="est-actions">
                <a className="btn btn-primary" href={`${B}/annonces/crozon`}>
                  Parcourir le catalogue du pilote
                </a>
              </div>
            </section>

            {/* 02 → 05 */}
            {SECTIONS.slice(1).map((s) => (
                <section key={s.num} className="landing-section alt bulle">
                  <h2 className="section-title">{s.titre}</h2>
                  <div className="sous-bulle">
                    <p className="section-accroche">{s.accroche}</p>
                    <p className="section-texte">{s.texte}</p>
                  </div>
                  <div className="est-actions">
                    {s.cta && (
                      <a className="btn btn-primary" href={`${B}${s.cta.href}`}>
                        {s.cta.label}
                      </a>
                    )}
                    {s.cta2 && (
                      <a className="btn btn-ghost" href={`${B}${s.cta2.href}`}>
                        {s.cta2.label}
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
              Portail immobilier territorial — pilote Crozon, presqu'île du
              Finistère. Gratuit, accompagné, lisible par les IA.
              La structuration améliore les chances de compréhension et de
              découverte ; elle ne garantit pas qu'un assistant IA indexera,
              recommandera ou citera une annonce.
            </p>
          </div>
          <nav className="footer-nav" aria-label="Pied de page">
            <a href={`${B}/annonces/crozon`}>Annonces</a>
            <a href={`${B}/estimation`}>Estimation indicative</a>
            <a href={`${B}/territoire/crozon`}>Territoire</a>
            <a href={`${B}/publier`}>Publier — gratuit</a>
            <a href={`${B}/approche`}>Notre approche</a>
            <a href={`${B}/pros`}>Professionnels & services de l'habitat</a>
            <a href={`${B}/espace-pro`}>Rejoindre le référentiel</a>
            <a href={`${B}/messagerie`}>Ma messagerie</a>
            <a href={`${B}/mes-annonces`}>Mes annonces</a>
          </nav>
        </div>
        <div className="wrap footer-bas">
          <p>
            MANAhome ne réalise aucun acte réglementé (loi Hoguet) : pas de
            mandat, pas de négociation, pas de transaction. Estimations
            indicatives, sans valeur contractuelle.
          </p>
          <p>
            Écosystème MANA —{" "}
            <a href="https://mana.bzh" rel="noopener">mana.bzh</a>
            {" · "}
            <a href="https://mana.love" rel="noopener">mana.love</a>
            {" · "}
            <a href="https://manafrance.org" rel="noopener">manafrance.org</a>
          </p>
        </div>
      </footer>
    </>
  );
}
