import { useEffect, useMemo, useState } from "react";
import { ANNONCES_DEMO, Annonce } from "./annonces";
import { annoncesPublieesLocales, enAnnonce } from "./annoncesLocales";
import { AnnonceCard } from "./AnnonceCard";
import { territoireParSlug , lien} from "./router";
import { t } from "./i18n";
import { langueCourante } from "./router";
import { lireIndispos } from "./calendrierDonnees";
import { estDisponible, libellePlage, plageValide, type Plage } from "./disponibilite";
import { chargerAnnonces } from "./apiAnnonces";
import { baseUrl } from "./router";
import {
  GlyphStructure, GlyphMaison, GlyphAppartement, GlyphTerrain,
  GlyphCompas, GlyphBudget, GlyphVoyageurs,
} from "./Glyphs";

// Page catalogue /annonces/:territoire — miroir front de la vue SQL
// annonces_publiques : tri directes avant importées à adéquation égale,
// badge source sur les importées, jamais l'inverse.

const TYPES_FILTRE = [
  { v: "tous", l: "Tous les biens", glyphe: GlyphStructure },
  { v: "maison", l: "Maisons", glyphe: GlyphMaison },
  { v: "appartement", l: "Appartements", glyphe: GlyphAppartement },
  { v: "terrain", l: "Terrains", glyphe: GlyphTerrain },
];

// Miroir front : les mois courts du libellé de plage (disponibilite.ts).
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc."];

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

// ⭐ FEATURE_BACK (docs/branchement-back.md) : sous le flag, la recherche
// part du service app — le FILTRE DE DATES SE FAIT CÔTÉ SERVEUR
// (est_disponible), le front ne re-filtre pas ce que le serveur a déjà
// filtré. En repli (flag éteint OU appel échoué), la démo localStorage
// sert les mêmes sémantiques : la page n'est jamais plus vide qu'avant.
const featureBack = typeof __FEATURE_BACK__ !== "undefined" && __FEATURE_BACK__;

export function AnnoncesListe({ slug }: { slug: string }) {
  const [filtre, setFiltre] = useState("tous");
  const params = new URLSearchParams(window.location.search);
  const [recherche, setRecherche] = useState(params.get("q") ?? "");
  const [prixMax, setPrixMax] = useState("");
  // Dates du voyageur : arrivée/départ, lues dans l'URL (?arr=…&dep=…) pour
  // que le moteur d'accueil puisse y envoyer une recherche datée.
  const [arrivee, setArrivee] = useState(params.get("arr") ?? "");
  const [depart, setDepart] = useState(params.get("dep") ?? "");
  // mode API : annonces du service (undefined = pas encore tranché)
  const [annoncesApi, setAnnoncesApi] = useState<Annonce[] | null>(null);
  const [apiEchouee, setApiEchouee] = useState(false);

  useEffect(() => {
    const t = territoireParSlug(slug);
    document.title = `Annonces ${t ? t.nom : ""} — MANAhome`;
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, [slug]);

  const territoire = territoireParSlug(slug);

  // En mode API, la recherche part au serveur à CHAQUE changement de filtre :
  // c'est lui qui détient la disponibilité réelle (est_disponible).
  useEffect(() => {
    if (!featureBack) return;
    let ignore = false;
    chargerAnnonces({
      type_bien: filtre === "tous" ? undefined : filtre,
      prix_max: prixMax ? Number(prixMax) : undefined,
      q: recherche || undefined,
      arrivee: arrivee || undefined,
      depart: depart || undefined,
    }).then((r) => {
      if (ignore) return;
      if (r.ok && r.annonces) setAnnoncesApi(r.annonces);
      else {
        // back absent : repli démo — et l'état dit POURQUOI, pas seulement quoi
        setApiEchouee(true);
        setAnnoncesApi(null);
      }
    });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtre, recherche, prixMax, arrivee, depart]);

  const annonces = useMemo(() => {
    const directes = [
      ...annoncesPublieesLocales().map(enAnnonce),
      ...ANNONCES_DEMO.filter((a) => a.source === "directe_particulier"),
    ];
    const importees = ANNONCES_DEMO.filter((a) => a.source === "import_pro");
    const triees = [...directes, ...importees];
    const parType =
      filtre === "tous" ? triees : triees.filter((a) => typeDe(a) === filtre);
    const q = recherche.trim().toLowerCase();
    const parTexte = q
      ? parType.filter(
          (a) =>
            a.lieu.toLowerCase().includes(q) ||
            a.titre.toLowerCase().includes(q)
        )
      : parType;
    // Le budget ne porte QUE sur le tarif à la nuitée (label du champ) : une
    // annonce sans ce palier n'est ni exclue ni incluse par erreur, elle
    // passe simplement le filtre — on ne compare jamais à un prix absent.
    const budget = prixMax ? Number(prixMax) : null;
    const parPrix = budget
      ? parTexte.filter((a) => a.tarifs.nuit == null || a.tarifs.nuit <= budget)
      : parTexte;
    // Sous le flag, le serveur a DÉJÀ filtré par dates et budget (et le
    // front ne re-filtre pas : deux filtres des mêmes dates = deux
    // occasions de diverger). En démo, le miroir local s'applique —
    // bord exclu, la même sémantique que le calendrier propriétaire.
    if (featureBack) {
      return annoncesApi ?? (apiEchouee ? parPrix : []);
    }
    const plage: Plage = { arrivee, depart };
    const parDates = plageValide(plage)
      ? parPrix.filter((a) => estDisponible(lireIndispos(a.id), plage))
      : parPrix;
    return parDates;
  }, [filtre, recherche, prixMax, arrivee, depart, featureBack, annoncesApi, apiEchouee]);

  const B = baseUrl();

  return (
    <>
      <JsonLd annonces={annonces} slug={slug} />
      <main className="publier">
      <div className="wrap">
        {territoire && <p className="hero-label">{territoire.nom}</p>}
        <h1 className="fiche-titre">
          {territoire ? `Les annonces à ${territoire.nom}` : "Les annonces"}
        </h1>
        <p className="territoire-intro">
          Un catalogue volontairement restreint et soigné. Chaque annonce est
          structurée pour être comprise, y compris par les outils compatibles IA.
        </p>

        <section className="publier-panel recherche-panel" aria-label="Recherche">
          <div className="champ-grid">
            <div className="champ">
              <label htmlFor="recherche" className="label-icone"><GlyphCompas size={15} />Commune ou secteur</label>
              <input
                id="recherche"
                type="search"
                placeholder="Ex : nom de la commune, quartier, port…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
            <div className="champ">
              <label htmlFor="date-arrivee" className="label-icone"><GlyphVoyageurs size={15} />Arrivée</label>
              <input
                id="date-arrivee"
                type="date"
                value={arrivee}
                onChange={(e) => setArrivee(e.target.value)}
              />
            </div>
            <div className="champ">
              <label htmlFor="date-depart" className="label-icone"><GlyphVoyageurs size={15} />Départ</label>
              <input
                id="date-depart"
                type="date"
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
              />
            </div>
            <div className="champ">
              <label htmlFor="prix-max" className="label-icone"><GlyphBudget size={15} />Budget max (€/nuit)</label>
              <input
                id="prix-max"
                type="number"
                min={0}
                placeholder="Ex : 100"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
              />
            </div>
          </div>
        </section>

        {featureBack && apiEchouee && (
          <p className="recherche-dates" role="status">
            {t(langueCourante(), "Le service des annonces est momentanément indisponible — le catalogue de démonstration s'affiche.")}
          </p>
        )}

        {plageValide({ arrivee, depart }) && (
          <p className="recherche-dates" role="status">
            {t(langueCourante(), "Séjour du {plage} — seules les annonces disponibles sur ces dates sont affichées.")
              .replace("{plage}", libellePlage({ arrivee, depart }, MOIS_COURTS) ?? "")}
          </p>
        )}

        <div className="annonces-filtres" role="group" aria-label="Filtrer par type">
          {TYPES_FILTRE.map((opt) => (
            <button
              key={opt.v}
              type="button"
              className={`btn btn-ghost label-icone ${filtre === opt.v ? "on" : ""}`}
              aria-pressed={filtre === opt.v}
              onClick={() => setFiltre(opt.v)}
            >
              <opt.glyphe size={16} />
              {opt.l}
            </button>
          ))}
        </div>

        {annonces.length === 0 ? (
          <section className="publier-panel">
            <p className="est-erreur">
              Aucune annonce de ce type pour l'instant sur ce territoire.
            </p>
            <p className="territoire-intro">
              Catalogue de démarrage : il est volontairement restreint.
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

        {!featureBack && (
          <p className="catalogue-note">
            Annonces de démonstration — les annonces réelles arriveront avec les
            premiers propriétaires. Les annonces professionnelles importées
            sont toujours affichées après les dépôts directs, à qualité égale.
          </p>
        )}

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
