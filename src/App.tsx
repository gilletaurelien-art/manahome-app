import { ANNONCES_DEMO } from "./annonces";
import { annoncesPublieesLocales, annonceLocaleParId, enAnnonce } from "./annoncesLocales";
import { AnnonceCard } from "./AnnonceCard";
import {
  GlyphMaison,
  GlyphCompas,
  GlyphStructure,
  GlyphAccompagnement,
  GlyphTerritoire,
  GlyphPros,
} from "./Glyphs";
import {
  NavAnnonces,
  NavTerritoire,
  NavPros,
  NavPublier,
  NavEstimation,
} from "./NavGlyphs";
import {
  usePath,
  routeAnnonce,
  annonceParId,
  routeTerritoire,
  territoireParSlug,
  routeAnnonces,
  baseUrl,
} from "./router";
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
const directes = [
  ...annoncesPublieesLocales().map(enAnnonce),
  ...ANNONCES_DEMO.filter((a) => a.source === "directe_particulier"),
];
const importees = ANNONCES_DEMO.filter((a) => a.source === "import_pro");
const triees = [...directes, ...importees];

const PROMESSES = [
  {
    glyphe: GlyphMaison,
    titre: "Gratuit pour les particuliers",
    texte:
      "Publication gratuite, sans commission de vente prélevée par MANAhome.",
  },
  {
    glyphe: GlyphAccompagnement,
    titre: "Un accompagnement à chaque étape",
    texte:
      "Estimation indicative, annonce, documents : vous avancez sans être seul.",
  },
  {
    glyphe: GlyphStructure,
    titre: "Des annonces conçues pour être comprises par les IA",
    texte:
      "Une fiche structurée, prête pour une nouvelle manière de chercher un logement.",
  },
];

const SECTIONS = [
  {
    glyphe: GlyphCompas,
    num: "01",
    titre: "Découvrez les biens",
    accroche: "Les annonces disponibles près de chez vous",
    texte:
      "Un accès direct aux biens, sans obliger le visiteur à créer un compte. En démarrage de pilote, nous assumons un catalogue volontairement restreint et soigné.",
  },
  {
    glyphe: GlyphAccompagnement,
    num: "02",
    titre: "Vendre sans être seul",
    accroche: "Vous gardez la main. MANA vous accompagne.",
    texte:
      "Estimation indicative, préparation de l'annonce, documents à prévoir, compréhension du prix net vendeur et prochaines étapes. Le particulier reste maître de son projet.",
    cta: { label: "Préparer la vente de mon bien", href: "/publier" },
    cta2: { label: "Estimer mon bien", href: "/estimation" },
  },
  {
    glyphe: GlyphStructure,
    num: "03",
    titre: "Une annonce prête pour les IA",
    accroche:
      "Votre bien ne devrait pas être invisible parce que son annonce est mal structurée.",
    texte:
      "MANA aide à organiser les caractéristiques, préciser les informations utiles et produire une page publique techniquement accessible aux moteurs et assistants compatibles.",
    cta: { label: "Comprendre notre approche", href: "/approche" },
  },
  {
    glyphe: GlyphTerritoire,
    num: "04",
    titre: "Choisir un lieu, pas seulement un logement",
    accroche: "Le bien compte. La vie autour aussi.",
    texte:
      "Transports, commerces, écoles, services, nature : le territoire présenté honnêtement, avec des informations vérifiées lorsque c'est possible.",
    cta: { label: "Découvrir le territoire de Crozon", href: "/territoire/crozon" },
  },
  {
    glyphe: GlyphPros,
    num: "05",
    titre: "Pour les professionnels",
    accroche: "Une autre façon de diffuser vos biens.",
    texte:
      "Une porte d'entrée dédiée aux agences et mandataires : diffusion complémentaire, annonces structurées. Sans promesse de classement garanti.",
    cta: {
      label: "Découvrir MANAhome pour les professionnels",
      href: "/pros",
    },
  },
];

const PILIER_IA = [
  {
    titre: "Des données structurées",
    texte:
      "Prix, surface, pièces, localisation, caractéristiques et informations énergétiques.",
  },
  {
    titre: "Une page accessible",
    texte:
      "Contenu public lisible, URL stable et indexation permise lorsque les conditions le permettent.",
  },
  {
    titre: "Des informations plus utiles",
    texte:
      "Distinction claire entre données vérifiées, déclarations du vendeur et informations territoriales.",
  },
];

const B = baseUrl();

export default function App() {
  const path = usePath();
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
              <span>Professionnels</span>
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
      ) : territoire ? (
        <TerritoireDetail territoire={territoire} />
      ) : (
        <>
          {/* Hero : le logo en grand, la promesse en dessous */}
          <section className="hero">
            <div className="wrap">
              <p className="hero-label">L'immobilier, autrement</p>
              <h1 className="brand-grand">
                MANA<em>home</em>
              </h1>
              <p className="lede">
                Publiez gratuitement. Soyez accompagné. Préparez votre annonce
                à l'ère des intelligences artificielles.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href={`${B}/publier`}>
                  Je souhaite vendre
                </a>
                <a className="btn btn-ghost" href={`${B}/annonces/crozon`}>
                  Je cherche un bien
                </a>
              </div>
              <p className="hero-note">
                Particuliers : publication gratuite, sans commission de vente
                prélevée par MANAhome.
              </p>
            </div>
          </section>

          {/* Les trois promesses : carte blanche centrale qui chevauche le hero */}
          <section className="promesses wrap">
            <div className="promesse-card">
              <div className="promesses-grid">
                {PROMESSES.map((p) => {
                  const G = p.glyphe;
                  return (
                    <div key={p.titre} className="promesse">
                      <span className="glyphe">
                        <G />
                      </span>
                      <h3>{p.titre}</h3>
                      <p>{p.texte}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <main className="wrap">
            {/* 01 — Catalogue : état « démarrage » assumé, qualité > volume */}
            <section className="landing-section">
              <span className="glyphe section-glyphe">
                <GlyphCompas />
              </span>
              <p className="section-num">{SECTIONS[0].num}</p>
              <h2 className="section-title">{SECTIONS[0].titre}</h2>
              <p className="section-accroche">{SECTIONS[0].accroche}</p>
              <p className="section-texte">{SECTIONS[0].texte}</p>
              <ul className="listings">
                {triees.map((a) => (
                  <AnnonceCard key={a.id} annonce={a} />
                ))}
              </ul>
              <p className="catalogue-note">
                Pilote Crozon — annonces de démonstration. Les annonces
                réelles arriveront avec les premiers vendeurs.
              </p>
            </section>

            {/* 02 → 05 */}
            {SECTIONS.slice(1).map((s) => {
              const G = s.glyphe;
              return (
                <section key={s.num} className="landing-section alt">
                  <span className="glyphe section-glyphe">
                    <G />
                  </span>
                  <p className="section-num">{s.num}</p>
                  <h2 className="section-title">{s.titre}</h2>
                  <p className="section-accroche">{s.accroche}</p>
                  <p className="section-texte">{s.texte}</p>
                  {s.cta && (
                    <a className="btn btn-ghost" href={`${B}${s.cta.href}`}>
                      {s.cta.label}
                    </a>
                  )}
                  {s.cta2 && (
                    <a className="btn btn-primary" href={`${B}${s.cta2.href}`}>
                      {s.cta2.label}
                    </a>
                  )}
                </section>
              );
            })}

            {/* Promesse IA : section éditoriale avec démonstration, pas un slogan */}
            <section className="landing-section section-ia">
              <h2 className="section-title">
                Demain, on cherchera aussi un logement en parlant à une IA.
              </h2>
              <blockquote className="ia-quote">
                « Je cherche une maison avec jardin, près de la mer, à moins de
                15 minutes des commerces, dans un secteur calme. »
              </blockquote>
              <p className="section-texte">
                MANAhome structure les informations des annonces pour faciliter
                leur compréhension par les outils compatibles.
              </p>
              <div className="ia-grid">
                {PILIER_IA.map((b) => (
                  <div key={b.titre} className="ia-bloc">
                    <h3>{b.titre}</h3>
                    <p>{b.texte}</p>
                  </div>
                ))}
              </div>
              <p className="ia-disclaimer">
                La structuration améliore les chances de compréhension et de
                découverte ; elle ne garantit pas qu'un assistant IA indexera,
                recommandera ou citera une annonce.
              </p>
            </section>
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
            </p>
          </div>
          <nav className="footer-nav" aria-label="Pied de page">
            <a href={`${B}/annonces/crozon`}>Annonces</a>
            <a href={`${B}/estimation`}>Estimation indicative</a>
            <a href={`${B}/territoire/crozon`}>Territoire</a>
            <a href={`${B}/publier`}>Publier — gratuit</a>
            <a href={`${B}/approche`}>Notre approche</a>
            <a href={`${B}/pros`}>Professionnels</a>
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
