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
];

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

        <div className="territoire-grid">
          {FACETTES.map((f) => (
            <div key={f.cle} className="territoire-bloc">
              <div className="territoire-bloc-tete">
                <h3>{f.titre}</h3>
                <p>{f.sous}</p>
              </div>
              <p className="territoire-texte">{t.enrichissement[f.cle]}</p>
            </div>
          ))}
        </div>

        <p className="territoire-note">
          Informations présentées avec honnêteté : elles sont enrichies et
          vérifiées lorsque c'est possible, et mises à jour au fil du pilotage
          du territoire.
        </p>
      </main>
    </>
  );
}
