import { useEffect, useMemo, useState } from "react";
import { ANNONCES_DEMO, Annonce } from "./annonces";
import { AnnonceCard } from "./AnnonceCard";
import { territoireParSlug } from "./router";
import { baseUrl } from "./router";

// Page catalogue /annonces/:territoire — miroir front de la vue SQL
// annonces_publiques : tri directes avant importées à adéquation égale,
// badge source sur les importées, jamais l'inverse.

const TYPES_FILTRE = [
  { v: "tous", l: "Tous les biens" },
  { v: "maison", l: "Maisons" },
  { v: "appartement", l: "Appartements" },
  { v: "terrain", l: "Terrains" },
];

function typeDe(annonce: Annonce): string {
  const t = annonce.titre.toLowerCase();
  if (t.includes("terrain")) return "terrain";
  if (t.includes("appartement") || t.includes("studio") || t.includes("t2") || t.includes("t3"))
    return "appartement";
  return "maison";
}

// JSON-LD ItemList : le catalogue est compréhensible par les moteurs et
// assistants — miroir de ce que la vue annonces_publiques expose en prod.
function JsonLd({ annonces, slug }: { annonces: Annonce[]; slug: string }) {
  const origin = window.location.origin;
  const B = baseUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: annonces.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${origin}${B}/annonce/${a.id}`,
      name: a.titre,
    })),
  };
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

export function AnnoncesListe({ slug }: { slug: string }) {
  const [filtre, setFiltre] = useState("tous");

  useEffect(() => {
    const t = territoireParSlug(slug);
    document.title = `Annonces ${t ? t.nom : ""} — MANAhome`;
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, [slug]);

  const territoire = territoireParSlug(slug);

  const annonces = useMemo(() => {
    const directes = ANNONCES_DEMO.filter(
      (a) => a.source === "directe_particulier"
    );
    const importees = ANNONCES_DEMO.filter((a) => a.source === "import_pro");
    const triees = [...directes, ...importees];
    return filtre === "tous" ? triees : triees.filter((a) => typeDe(a) === filtre);
  }, [filtre]);

  const B = baseUrl();

  return (
    <>
      <JsonLd annonces={annonces} slug={slug} />
      <main className="publier">
      <div className="wrap">
        <p className="hero-label">Pilote {territoire ? territoire.nom : "Crozon"}</p>
        <h1 className="fiche-titre">
          Les annonces {territoire ? `à ${territoire.nom}` : "du pilote"}
        </h1>
        <p className="territoire-intro">
          Un catalogue volontairement restreint et soigné. Chaque annonce est
          structurée pour être comprise, y compris par les outils compatibles IA.
        </p>

        <div className="annonces-filtres" role="group" aria-label="Filtrer par type">
          {TYPES_FILTRE.map((t) => (
            <button
              key={t.v}
              type="button"
              className={`btn btn-ghost ${filtre === t.v ? "on" : ""}`}
              aria-pressed={filtre === t.v}
              onClick={() => setFiltre(t.v)}
            >
              {t.l}
            </button>
          ))}
        </div>

        {annonces.length === 0 ? (
          <section className="publier-panel">
            <p className="est-erreur">
              Aucune annonce de ce type pour l'instant sur ce territoire.
            </p>
            <p className="territoire-intro">
              En pilote démarrage, le catalogue est volontairement restreint.
              Revenez bientôt, ou explorez le territoire pendant ce temps.
            </p>
          </section>
        ) : (
          <ul className="listings">
            {annonces.map((a) => (
              <AnnonceCard key={a.id} annonce={a} />
            ))}
          </ul>
        )}

        <p className="catalogue-note">
          Annonces de démonstration — les annonces réelles arriveront avec les
          premiers vendeurs. Les annonces professionnelles importées sont
          toujours affichées après les dépôts directs, à qualité égale.
        </p>

        <div className="est-actions">
          <a className="btn btn-ghost" href={`${B}/territoire/${slug}`}>
            Découvrir le territoire
          </a>
          <a className="btn btn-primary" href={`${B}/publier`}>
            Publier mon annonce — gratuit
          </a>
        </div>
      </div>
      </main>
    </>
  );
}
