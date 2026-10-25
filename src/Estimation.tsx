import { useEffect, useMemo, useState } from "react";
import { TERRITOIRES, Territoire } from "./territoires";
import { baseUrl } from "./router";

// Module ESTIMATION — écran 1 : formulaire minimal sans compte (aucun champ
// identifiant). Écran 2 : fourchette ±10 % (pas un chiffre unique), médiane
// dessous, lien vers la page territoire. Écran 3 : CTA vers /publier
// pré-rempli. Données : territoires.prixHistorique (fixtures démo aujourd'hui,
// agrégat DVF en prod) — affichage sourcé et daté.

const TYPES = [
  { v: "maison", l: "Maison" },
  { v: "appartement", l: "Appartement" },
];

interface FormEstimation {
  commune: string;
  type: string;
  surface: string;
  pieces: string;
}

interface Resultat {
  territoire: Territoire;
  bas: number;
  haut: number;
  mediane: number;
  annee: number;
}

function trouverTerritoire(commune: string): Territoire | null {
  const c = commune.trim().toLowerCase();
  if (!c) return null;
  return (
    TERRITOIRES.find(
      (t) =>
        t.nom.toLowerCase() === c ||
        t.slug === c ||
        t.codeInsee === c.replace(/\s/g, "")
    ) ?? null
  );
}

function estimer(
  territoire: Territoire,
  surface: number,
  type: string
): Resultat {
  // Dernier point connu de l'historique (en prod : dernier agrégat DVF)
  const dernier = territoire.prixHistorique[
    territoire.prixHistorique.length - 1
  ] ?? { annee: new Date().getFullYear(), prixM2: 0 };
  // Le prix historique porte sur les maisons ; décote indicative sur
  // l'appartement en pilote (affinée quand l'agrégat DVF sera branché).
  const coefType = type === "appartement" ? 0.9 : 1;
  const mediane = Math.round((dernier.prixM2 * coefType * surface) / 1000) * 1000;
  return {
    territoire,
    bas: Math.round((mediane * 0.9) / 1000) * 1000,
    haut: Math.round((mediane * 1.1) / 1000) * 1000,
    mediane,
    annee: dernier.annee,
  };
}

const fmt = (n: number) => n.toLocaleString("fr-FR");

function JsonLd() {
  // La page répond à « combien vaut une maison à Crozon » : Question/Answer
  const dernierCrozon = TERRITOIRES[0].prixHistorique[
    TERRITOIRES[0].prixHistorique.length - 1
  ];
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Combien vaut une maison à Crozon ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `L'estimation indicative pour une maison à Crozon se base sur un prix moyen d'environ ${dernierCrozon.prixM2.toLocaleString("fr-FR")} €/m² (dernier point : ${dernierCrozon.annee}). L'estimation est présentée sous forme de fourchette ±10 % et se calcule gratuitement, sans compte, sur la page d'estimation. Estimation basée sur les ventes publiques, sans valeur contractuelle.`,
        },
      },
    ],
  };
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

export function Estimation() {
  useEffect(() => {
    document.title = "Estimer mon bien — MANAhome";
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, []);

  const [form, setForm] = useState<FormEstimation>({
    commune: "",
    type: "maison",
    surface: "",
    pieces: "",
  });
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const B = baseUrl();

  const formValide = form.commune.trim() && form.surface && Number(form.surface) > 0;

  const calculer = () => {
    const t = trouverTerritoire(form.commune);
    if (!t) {
      setErreur(
        "Cette commune n'est pas encore couverte par le pilote. Pour l'instant : Crozon et sa presqu'île."
      );
      setResultat(null);
      return;
    }
    setErreur(null);
    setResultat(estimer(t, Number(form.surface), form.type));
  };

  const paramsPublier = useMemo(() => {
    const p = new URLSearchParams();
    p.set("type", form.type);
    if (form.commune) p.set("lieu", form.commune.trim());
    if (form.surface) p.set("surface", form.surface);
    if (form.pieces) p.set("pieces", form.pieces);
    if (resultat) p.set("prix", String(resultat.mediane));
    return p.toString();
  }, [form, resultat]);

  return (
    <>
      <JsonLd />
      <main className="publier">
      <div className="wrap">
        <p className="hero-label">Gratuit, sans compte</p>
        <h1 className="fiche-titre">Estimer mon bien</h1>
        <p className="territoire-intro">
          Une estimation <strong>indicative</strong>, en deux minutes, sans créer
          de compte ni laisser de coordonnées.
        </p>

        {!resultat && !erreur && (
          <section className="publier-panel" aria-label="Formulaire d'estimation">
            <div className="champ">
              <label htmlFor="est-commune">Commune *</label>
              <input
                id="est-commune"
                placeholder="Ex : Crozon"
                value={form.commune}
                onChange={(e) => setForm({ ...form, commune: e.target.value })}
              />
              <p className="champ-aide">
                Pilote : Crozon et sa presqu'île, pour l'instant.
              </p>
            </div>
            <div className="champ">
              <label htmlFor="est-type">Type de bien *</label>
              <select
                id="est-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>
            <div className="champ-grid">
              <div className="champ">
                <label htmlFor="est-surface">Surface habitable (m²) *</label>
                <input
                  id="est-surface"
                  type="number"
                  min={0}
                  value={form.surface}
                  onChange={(e) => setForm({ ...form, surface: e.target.value })}
                />
              </div>
              <div className="champ">
                <label htmlFor="est-pieces">Nombre de pièces</label>
                <input
                  id="est-pieces"
                  type="number"
                  min={0}
                  value={form.pieces}
                  onChange={(e) => setForm({ ...form, pieces: e.target.value })}
                />
              </div>
            </div>
            <div className="publier-nav">
              <span />
              <button
                className="btn btn-primary"
                disabled={!formValide}
                onClick={calculer}
              >
                Voir mon estimation
              </button>
            </div>
          </section>
        )}

        {erreur && !resultat && (
          <section className="publier-panel" aria-live="polite">
            <p className="est-erreur">{erreur}</p>
            <div className="publier-nav">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setErreur(null);
                  setForm({ ...form, commune: "" });
                }}
              >
                ← Modifier la commune
              </button>
            </div>
          </section>
        )}

        {resultat && (
          <section className="publier-panel" aria-live="polite">
            <p className="apercu-label">
              Estimation indicative — {resultat.territoire.nom}, {resultat.annee}
            </p>
            <p className="est-fourchette">
              {fmt(resultat.bas)} € – {fmt(resultat.haut)} €
            </p>
            <p className="est-mediane">
              Valeur médiane indicative : <strong>{fmt(resultat.mediane)} €</strong>
              {" "}· fourchette ±10 %
            </p>
            <p className="est-source">
              Basée sur les ventes publiques de {resultat.territoire.nom} (données
              de démonstration en pilote — l'agrégat DVF officiel prendra le
              relais en production). Dernier point : {resultat.annee}.
            </p>
            <div className="est-actions">
              <a
                className="btn btn-primary"
                href={`${B}/publier?${paramsPublier}`}
              >
                Publier mon annonce avec ce prix
              </a>
              <a
                className="btn btn-ghost"
                href={`${B}/territoire/${resultat.territoire.slug}`}
              >
                Voir le détail des prix du territoire
              </a>
              <button
                className="btn btn-ghost"
                onClick={() => setResultat(null)}
              >
                ← Refaire l'estimation
              </button>
            </div>
            <p className="ia-disclaimer">
              Estimation basée sur les ventes publiques, sans valeur
              contractuelle. Elle ne remplace pas une estimation réalisée par un
              professionnel.
            </p>
          </section>
        )}
      </div>
      </main>
    </>
  );
}
