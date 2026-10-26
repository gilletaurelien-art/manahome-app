import { useEffect, useState } from "react";
import { baseUrl } from "./router";
import { PROS } from "./pros";
import {
  CATEGORIES_SERVICE,
  SERVICES_DEMO,
  CategorieService,
} from "./servicesHabitat";

// Page /pros — la porte professionnelle ET les services à l'habitat :
// vendre, louer, réparer, entretenir — un seul référentiel de l'habitat.
// Volontairement sans espace ni abonnement (non tranché). Règle gravée :
// « vérifié » exige une preuve ; aucun acte loi Hoguet.

const ETATS = [
  {
    titre: "Référencé",
    texte:
      "Identité vérifiée côté annuaire : le pro apparaît publiquement rattaché à ses annonces.",
  },
  {
    titre: "Actif",
    texte:
      "Le pro publie et maintient ses annonces sur le territoire du pilote.",
  },
  {
    titre: "Vérifié",
    texte:
      "Statut le plus exigeant : il exige une preuve documentaire. Sans preuve, pas de badge.",
  },
];

export function Pros() {
  const [categorie, setCategorie] = useState<CategorieService | "tous">("tous");

  useEffect(() => {
    document.title = "Professionnels & services de l'habitat — MANAhome";
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, []);

  const B = baseUrl();

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Professionnels & services</p>
        <h1 className="fiche-titre">
          Tous ceux qui font vivre l'habitat du territoire
        </h1>
        <p className="territoire-intro">
          Agences et mandataires diffusent leurs biens ; réparateurs, aides
          à domicile, diagnostiqueurs et autres services prennent soin des
          logements. Un seul référentiel, une même règle : référencement
          factuel, aucune recommandation, aucune donnée revendue.
        </p>

        <div className="ia-grid">
          <div className="ia-bloc">
            <h3>Vos annonces, structurées</h3>
            <p>
              Chaque fiche respecte le même format lisible : les 4 chiffres
              canon, le DPE, les données structurées. Vos biens sont présentés
              aussi proprement que ceux des particuliers.
            </p>
          </div>
          <div className="ia-bloc">
            <h3>Transparence de la source</h3>
            <p>
              Une annonce professionnelle est toujours badgeée. Elle n'apparaît
              jamais devant un dépôt direct à adéquation égale — c'est un choix
              assumé, inscrit dans notre règle de tri.
            </p>
          </div>
          <div className="ia-bloc">
            <h3>Ce que MANAhome n'est pas</h3>
            <p>
              Ni mandataire, ni négociateur, ni place de transaction : aucun acte
              relevant de la loi Hoguet n'est réalisé par la plateforme.
            </p>
          </div>
        </div>

        <section className="publier-panel">
          <p className="apercu-label">Services à l'habitat — prendre soin du logement</p>
          <p className="territoire-intro">
            Propriétaire ou locataire : trouver qui peut réparer, entretenir,
            garder ou adapter un logement.
          </p>
          <div className="annonces-filtres" role="group" aria-label="Filtrer les services">
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
          <div className="ia-grid">
            {(categorie === "tous"
              ? SERVICES_DEMO
              : SERVICES_DEMO.filter((sv) => sv.categorie === categorie)
            ).map((sv) => (
              <div key={sv.id} className="ia-bloc">
                <h3>{sv.nom}</h3>
                <p>
                  {sv.commune}
                  <br />
                  {sv.resume}
                </p>
              </div>
            ))}
          </div>
          <p className="ia-disclaimer">
            Services de démonstration — le référencement réel des pros de
            l'habitat se fait via l'inscription ci-dessous.
          </p>
        </section>

        <section className="publier-panel">
          <p className="apercu-label">Les pros et notaires du pilote Crozon</p>
          <p className="territoire-intro">
            Référencés depuis l'annuaire officiel des entreprises (source :
            recherche-entreprises.api.gouv.fr) — statut « référencé » : aucune
            de ces fiches n'est une recommandation, et le statut « vérifié »
            exigerait une preuve documentaire fournie par le pro lui-même.
          </p>
          <div className="ia-grid">
            {PROS.filter((p) => p.categorie === "agence").map((p) => (
              <div key={p.siren} className="ia-bloc">
                <h3>{p.raisonSociale}</h3>
                <p>
                  Agence immobilière · {p.commune}
                  <br />
                  {p.adressePublique}
                  <br />
                  SIREN {p.siren} · statut : {p.statut}
                </p>
              </div>
            ))}
            {PROS.filter((p) => p.categorie === "notaire").map((p) => (
              <div key={p.siren} className="ia-bloc">
                <h3>{p.raisonSociale}</h3>
                <p>
                  Office notarial · {p.commune}
                  <br />
                  {p.adressePublique}
                  <br />
                  SIREN {p.siren} · statut : {p.statut}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="publier-panel">
          <p className="apercu-label">Référentiel à 3 états</p>
          <div className="ia-grid">
            {ETATS.map((e, i) => (
              <div key={e.titre} className="ia-bloc">
                <h3>
                  {i + 1}. {e.titre}
                </h3>
                <p>{e.texte}</p>
              </div>
            ))}
          </div>
          <p className="ia-disclaimer">
            « Vérifié » exige une preuve documentaire. Aucune donnée ni lead n'est
            revendu ; les échanges passent par la messagerie interne.
          </p>
        </section>

        <div className="est-actions">
          <a className="btn btn-primary" href={`${B}/espace-pro`}>
            Rejoindre le référentiel
          </a>
          <a className="btn btn-ghost" href={`${B}/annonces/crozon`}>
            Voir les annonces du pilote
          </a>
          <a className="btn btn-ghost" href={`${B}/approche`}>
            Notre approche
          </a>
        </div>
      </div>
    </main>
  );
}
