import { useEffect, useMemo, useState } from "react";
import { ANNONCES_DEMO, Annonce } from "./annonces";
import { annoncesPublieesLocales, enAnnonce } from "./annoncesLocales";
import { AnnonceCard } from "./AnnonceCard";
import { territoireParSlug , lien} from "./router";
import { t } from "./i18n";
import { langueCourante } from "./router";
import { lireIndispos } from "./calendrierDonnees";
import { estDisponible, libellePlage, plageValide, type Plage } from "./disponibilite";
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

// Vente / location : le portail couvre l'habitat entier, pas que la vente.
// Miroir front : les mois courts du libellé de plage (disponibilite.ts).
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const TX_FILTRE = [
  { v: "tous", l: "Vente & location" },
  { v: "vente", l: "À vendre" },
  { v: "location", l: "À louer" },
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
  const params = new URLSearchParams(window.location.search);
  const [recherche, setRecherche] = useState(params.get("q") ?? "");
  const [prixMax, setPrixMax] = useState("");
  // Dates du voyageur : arrivée/départ, lues dans l'URL (?arr=…&dep=…) pour
  // que le moteur d'accueil puisse y envoyer une recherche datée.
  const [arrivee, setArrivee] = useState(params.get("arr") ?? "");
  const [depart, setDepart] = useState(params.get("dep") ?? "");
  const txInitial = params.get("tx");
  const [filtreTx, setFiltreTx] = useState(
    txInitial === "location" || txInitial === "vente" ? txInitial : "tous"
  );

  useEffect(() => {
    const t = territoireParSlug(slug);
    document.title = `Annonces ${t ? t.nom : ""} — MANAhome`;
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, [slug]);

  const territoire = territoireParSlug(slug);

  const annonces = useMemo(() => {
    const directes = [
      ...annoncesPublieesLocales().map(enAnnonce),
      ...ANNONCES_DEMO.filter((a) => a.source === "directe_particulier"),
    ];
    const importees = ANNONCES_DEMO.filter((a) => a.source === "import_pro");
    const triees = [...directes, ...importees];
    const parType =
      filtre === "tous" ? triees : triees.filter((a) => typeDe(a) === filtre);
    const parTx =
      filtreTx === "tous"
        ? parType
        : parType.filter((a) => (a.transaction ?? "vente") === filtreTx);
    const q = recherche.trim().toLowerCase();
    const parTexte = q
      ? parTx.filter(
          (a) =>
            a.lieu.toLowerCase().includes(q) ||
            a.titre.toLowerCase().includes(q)
        )
      : parTx;
    const budget = prixMax ? Number(prixMax) : null;
    const parPrix = budget
      ? parTexte.filter((a) => a.prix <= budget)
      : parTexte;
    // Disponibilité réelle : une annonce aux nuitées bloquées sur la plage
    // ne sort PAS — miroir front de est_disponible() (007). Bord exclu :
    // la même sémantique que le calendrier propriétaire, sinon la fiche
    // dirait « disponible » là où l'hôte lit « bloquée ».
    const plage: Plage = { arrivee, depart };
    const parDates = plageValide(plage)
      ? parPrix.filter((a) => estDisponible(lireIndispos(a.id), plage))
      : parPrix;
    return parDates;
  }, [filtre, filtreTx, recherche, prixMax, arrivee, depart]);

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

        <section className="publier-panel recherche-panel" aria-label="Recherche">
          <div className="champ-grid">
            <div className="champ">
              <label htmlFor="recherche">Commune ou secteur</label>
              <input
                id="recherche"
                type="search"
                placeholder="Ex : Crozon, Kerloc'h, port…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
            <div className="champ">
              <label htmlFor="date-arrivee">Arrivée</label>
              <input
                id="date-arrivee"
                type="date"
                value={arrivee}
                onChange={(e) => setArrivee(e.target.value)}
              />
            </div>
            <div className="champ">
              <label htmlFor="date-depart">Départ</label>
              <input
                id="date-depart"
                type="date"
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
              />
            </div>
            <div className="champ">
              <label htmlFor="prix-max">
                Budget max {filtreTx === "location" ? "(€/mois)" : "(€)"}
              </label>
              <input
                id="prix-max"
                type="number"
                min={0}
                placeholder={filtreTx === "location" ? "Ex : 900" : "Ex : 300 000"}
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
              />
            </div>
          </div>
        </section>

        {plageValide({ arrivee, depart }) && (
          <p className="recherche-dates" role="status">
            {t(langueCourante(), "Séjour du {plage} — seules les annonces disponibles sur ces dates sont affichées.")
              .replace("{plage}", libellePlage({ arrivee, depart }, MOIS_COURTS) ?? "")}
          </p>
        )}

        <div className="annonces-filtres" role="group" aria-label="Filtrer par transaction">
          {TX_FILTRE.map((t) => (
            <button
              key={t.v}
              type="button"
              className={`btn btn-ghost ${filtreTx === t.v ? "on" : ""}`}
              aria-pressed={filtreTx === t.v}
              onClick={() => setFiltreTx(t.v)}
            >
              {t.l}
            </button>
          ))}
        </div>
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
          <a className="btn btn-ghost" href={lien(`/territoire/${slug}`)}>
            Découvrir le territoire
          </a>
          <a className="btn btn-primary" href={lien(`/publier`)}>
            Publier mon annonce — gratuit
          </a>
        </div>
      </div>
      </main>
    </>
  );
}
