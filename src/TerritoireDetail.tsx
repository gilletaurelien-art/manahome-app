import { useEffect } from "react";
import type { Territoire } from "./territoires";
import { baseUrl } from "./router";

// JSON-LD Place : le territoire aussi est lisible par les IA —
// c'est la couche d'enrichissement de la table `territoires`.
function JsonLdTerritoire({ t }: { t: Territoire }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: t.nom,
    description: t.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: t.nom,
      addressRegion: "Bretagne",
      postalCode: "29160",
      addressCountry: "FR",
    },
  };
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

const FACETTES = [
  {
    cle: "environnement" as const,
    titre: "Environnement",
    sous: "Nature, littoral, paysages",
  },
  {
    cle: "transports" as const,
    titre: "Transports",
    sous: "Se déplacer au quotidien",
  },
  {
    cle: "services" as const,
    titre: "Services",
    sous: "Commerces, écoles, santé",
  },
  {
    cle: "vieLocale" as const,
    titre: "Vie locale",
    sous: "Communauté, culture, loisirs",
  },
  { cle: "parcs" as const, titre: "Parcs naturels", sous: "Espaces protégés" },
  {
    cle: "publics" as const, titre: "Services publics", sous: "Administrations" },
  {
    cle: "intercomm" as const,
    titre: "Intercommunalité",
    sous: "Communauté de communes",
  },
];

// Graphique de prix en SVG pur : ~30 lignes, aucune lib de charts.
function PrixChart({ data }: { data: { annee: number; prixM2: number }[] }) {
  const W = 640;
  const H = 220;
  const PAD = 36;
  const min = Math.min(...data.map((d) => d.prixM2));
  const max = Math.max(...data.map((d) => d.prixM2));
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (data.length - 1);
  const y = (v: number) => H - PAD - ((v - min) * (H - 2 * PAD)) / (max - min);
  const points = data.map((d, i) => `${x(i)},${y(d.prixM2)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="prix-chart"
      role="img"
      aria-label="Prix moyen au mètre carré sur les dix dernières années"
    >
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
      {data.map((d, i) => (
        <g key={d.annee}>
          <circle cx={x(i)} cy={y(d.prixM2)} r="3.5" fill="var(--or)" />
          {i % 2 === 0 && (
            <text x={x(i)} y={H - 10} textAnchor="middle" className="chart-label">
              {d.annee}
            </text>
          )}
        </g>
      ))}
      <text x={PAD} y={y(max) - 8} className="chart-label chart-val">
        {max.toLocaleString("fr-FR")} €/m²
      </text>
      <text x={W - PAD} y={y(min) - 8} textAnchor="end" className="chart-label chart-val">
        {min.toLocaleString("fr-FR")} €/m²
      </text>
    </svg>
  );
}

export function TerritoireDetail({ territoire }: { territoire: Territoire }) {
  const t = territoire;
  useEffect(() => {
    document.title = `${t.nom} — Territoire — MANAhome`;
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, [t]);

  return (
    <>
      <JsonLdTerritoire t={t} />
      <main className="fiche territoire">
        <a className="retour" href={`${baseUrl()}/`}>
          ← Accueil
        </a>

        <p className="hero-label">Choisir un lieu, pas seulement un logement</p>
        <h1 className="fiche-titre">{t.nom}</h1>
        <p className="territoire-intro">{t.description}</p>

        {/* Chiffres-clés : lecture en 2 secondes, sous le titre */}
        <dl className="territoire-chiffres">
          <div>
            <dt>Habitants</dt>
            <dd>{t.chiffres.habitants}</dd>
          </div>
          <div>
            <dt>Commerces</dt>
            <dd>{t.chiffres.commerces}</dd>
          </div>
          <div>
            <dt>Associations</dt>
            <dd>{t.chiffres.associations}</dd>
          </div>
        </dl>

        <div className="territoire-grid">
          {FACETTES.map((f) => {
            const texte =
              f.cle === "parcs"
                ? t.parcsNaturels
                : f.cle === "publics"
                  ? t.servicesPublics
                  : f.cle === "intercomm"
                    ? t.communauteCommunes
                    : t.enrichissement[f.cle];
            return (
              <div key={f.cle} className="territoire-bloc">
                <div className="territoire-bloc-tete">
                  <h3>{f.titre}</h3>
                  <p>{f.sous}</p>
                </div>
                <p className="territoire-texte">{texte}</p>
              </div>
            );
          })}
        </div>

        {/* Prix sur 10 ans : graphique SVG maison, zéro dépendance */}
        <section className="territoire-prix">
          <div className="territoire-bloc-tete">
            <h3>Prix de l'immobilier</h3>
            <p>Moyenne indicative au m² (maisons), 10 dernières années</p>
          </div>
          <PrixChart data={t.prixHistorique} />
          <p className="territoire-note">
            Données de démonstration — le jour venu, la source sera un flux
            contractualisé (DVF ou partenaire), jamais du scraping.
          </p>
        </section>

        {/* Géorisques : synthèse honnête + lien officiel */}
        <section className="territoire-bloc georisk">
          <div className="territoire-bloc-tete">
            <h3>Risques naturels</h3>
            <p>Synthèse Géorisques — vérifiez chaque adresse</p>
          </div>
          <p className="territoire-texte">{t.georisk.synthese}</p>
          <a className="btn btn-ghost" href={t.georisk.url} target="_blank" rel="noopener noreferrer">
            Consulter Géorisques pour {t.nom}
          </a>
        </section>

        <p className="territoire-note">
          Informations présentées avec honnêteté : elles sont enrichies et
          vérifiées lorsque c'est possible, et mises à jour au fil du pilotage
          du territoire.
        </p>
      </main>
    </>
  );
}
