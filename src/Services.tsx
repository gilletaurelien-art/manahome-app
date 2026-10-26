import { useEffect, useState } from "react";
import { baseUrl } from "./router";
import {
  CATEGORIES_SERVICE,
  SERVICES_DEMO,
  CategorieService,
} from "./servicesHabitat";

// /services — prendre soin du logement : réparer, entretenir, garder,
// adapter. Ouvert aux propriétaires ET aux locataires : un logement
// vivant, c'est l'affaire de ceux qui l'habitent.

export function Services() {
  const [categorie, setCategorie] = useState<CategorieService | "tous">("tous");

  useEffect(() => {
    document.title = "Services à l'habitat — MANAhome";
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, []);

  const liste =
    categorie === "tous"
      ? SERVICES_DEMO
      : SERVICES_DEMO.filter((s) => s.categorie === categorie);

  const B = baseUrl();

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Prendre soin du logement</p>
        <h1 className="fiche-titre">Services à l'habitat</h1>
        <p className="territoire-intro">
          Un logement, ça se répare, s'entretient, se garde et s'adapte.
          Propriétaire ou locataire : ici, vous trouvez qui peut s'en occuper,
          sur le territoire. Référencement factuel, aucune recommandation.
        </p>

        <div className="annonces-filtres" role="group" aria-label="Filtrer par catégorie">
          <button
            type="button"
            className={`btn btn-ghost ${categorie === "tous" ? "on" : ""}`}
            aria-pressed={categorie === "tous"}
            onClick={() => setCategorie("tous")}
          >
            Tous
          </button>
          {CATEGORIES_SERVICE.map((c) => (
            <button
              key={c.v}
              type="button"
              className={`btn btn-ghost ${categorie === c.v ? "on" : ""}`}
              aria-pressed={categorie === c.v}
              onClick={() => setCategorie(c.v)}
            >
              {c.l}
            </button>
          ))}
        </div>

        <ul className="listings">
          {liste.map((s) => {
            const cat = CATEGORIES_SERVICE.find((c) => c.v === s.categorie);
            return (
              <li key={s.id} className="card">
                <div className="body">
                  <p className="lieu">{s.commune}</p>
                  <h3>{s.nom}</h3>
                  <p className="meta">
                    <span className="badge-source">{cat?.l}</span>
                  </p>
                  <p>{s.resume}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="catalogue-note">
          Services de démonstration — le référencement réel des professionnels
          de l'habitat arrive avec le référentiel. Aucune recommandation :
          des faits, un contact, votre décision.
        </p>

        <div className="est-actions">
          <a className="btn btn-ghost" href={`${B}/espace-pro`}>
            Je propose un service — rejoindre le référentiel
          </a>
        </div>
      </div>
    </main>
  );
}
