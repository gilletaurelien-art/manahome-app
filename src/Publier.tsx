import { useMemo, useState } from "react";
import { baseUrl } from "./router";

// Parcours vendeur : dépôt GRATUIT, aucune friction inutile (doctrine :
// « aucun champ obligatoire inutile »). 3 étapes max, ton chaleureux.
// Le backend branchera : auth particuliers, sauvegarde brouillon,
// rédaction assistée Mistral, pipeline photo S3.

type Etape = 1 | 2 | 3;

interface FormBien {
  type: string;
  surface: string;
  pieces: string;
  prix: string;
  dpe: string;
  lieu: string;
}

const TYPES = [
  { v: "maison", l: "Maison" },
  { v: "appartement", l: "Appartement" },
  { v: "terrain", l: "Terrain" },
  { v: "autre", l: "Autre" },
];

const DPES = ["A", "B", "C", "D", "E", "F", "G", "NC"];

export function Publier() {
  const [etape, setEtape] = useState<Etape>(1);
  const [bien, setBien] = useState<FormBien>({
    type: "",
    surface: "",
    pieces: "",
    prix: "",
    dpe: "",
    lieu: "",
  });
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");

  // La rédaction assistée (Mistral) arrive avec le backend : le bouton
  // est présent dès maintenant, l'API se branchera derrière.
  const apercu = useMemo(
    () => ({
      titre:
        bien.type && bien.lieu
          ? `${TYPES.find((t) => t.v === bien.type)?.l ?? bien.type} à ${bien.lieu}`
          : "Votre annonce",
      prix: bien.prix ? `${Number(bien.prix).toLocaleString("fr-FR")} €` : "Prix à définir",
      surface: bien.surface ? `${bien.surface} m²` : null,
      pieces: bien.pieces ? `${bien.pieces} pièces` : null,
      dpe: bien.dpe && bien.dpe !== "NC" ? bien.dpe : null,
    }),
    [bien]
  );

  const etape1Valide = bien.type && bien.lieu && bien.prix;

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Gratuit, sans commission</p>
        <h1 className="fiche-titre">Publier mon annonce</h1>
        <p className="territoire-intro">
          Trois étapes, aucun engagement. Vous gardez la main à tout moment :
          votre annonce n'est publiée que lorsque vous la validez.
        </p>

        {/* Étapes */}
        <ol className="etapes">
          <li className={etape === 1 ? "on" : etape > 1 ? "done" : ""}>Le bien</li>
          <li className={etape === 2 ? "on" : etape > 2 ? "done" : ""}>La description</li>
          <li className={etape === 3 ? "on" : ""}>Validation</li>
        </ol>

        {etape === 1 && (
          <section className="publier-panel">
            <div className="champ">
              <label htmlFor="type">Type de bien *</label>
              <select
                id="type"
                value={bien.type}
                onChange={(e) => setBien({ ...bien, type: e.target.value })}
              >
                <option value="">Choisir…</option>
                {TYPES.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>
            <div className="champ">
              <label htmlFor="lieu">Commune ou secteur *</label>
              <input
                id="lieu"
                placeholder="Ex : Crozon, presqu'île"
                value={bien.lieu}
                onChange={(e) => setBien({ ...bien, lieu: e.target.value })}
              />
            </div>
            <div className="champ-grid">
              <div className="champ">
                <label htmlFor="prix">Prix de vente *</label>
                <input
                  id="prix"
                  type="number"
                  min={0}
                  placeholder="245 000"
                  value={bien.prix}
                  onChange={(e) => setBien({ ...bien, prix: e.target.value })}
                />
                <p className="champ-aide">
                  Une estimation indicative vous sera proposée à l'étape suivante.
                </p>
              </div>
              <div className="champ">
                <label htmlFor="surface">Surface (m²)</label>
                <input
                  id="surface"
                  type="number"
                  min={0}
                  value={bien.surface}
                  onChange={(e) => setBien({ ...bien, surface: e.target.value })}
                />
              </div>
              <div className="champ">
                <label htmlFor="pieces">Pièces</label>
                <input
                  id="pieces"
                  type="number"
                  min={0}
                  value={bien.pieces}
                  onChange={(e) => setBien({ ...bien, pieces: e.target.value })}
                />
              </div>
            </div>
            <div className="champ">
              <label>DPE (diagnostic de performance énergétique)</label>
              <div className="dpe-choix">
                {DPES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`dpe-btn ${bien.dpe === d ? "on" : ""}`}
                    onClick={() => setBien({ ...bien, dpe: d })}
                  >
                    <span className={`dpe dpe-${d === "NC" ? "NC" : d}`}>{d}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="publier-nav">
              <span />
              <button
                className="btn btn-primary"
                disabled={!etape1Valide}
                onClick={() => setEtape(2)}
              >
                Continuer
              </button>
            </div>
          </section>
        )}

        {etape === 2 && (
          <section className="publier-panel">
            <div className="champ">
              <label htmlFor="desc">Décrivez votre bien, comme vous le raconteriez</label>
              <textarea
                id="desc"
                rows={7}
                placeholder="Maison lumineuse à deux pas du port, jardin clos, cuisine ouverte…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="champ-aide">
                Pas inspiré ? La rédaction assistée arrive avec votre compte :
                elle transforme vos mots en annonce chaleureuse et factuelle.
              </p>
            </div>
            <div className="publier-nav">
              <button className="btn btn-ghost" onClick={() => setEtape(1)}>
                ← Retour
              </button>
              <button className="btn btn-primary" onClick={() => setEtape(3)}>
                Continuer
              </button>
            </div>
          </section>
        )}

        {etape === 3 && (
          <section className="publier-panel">
            <p className="apercu-label">Aperçu de votre annonce</p>
            <div className="fiche-corps apercu">
              <p className="fiche-lieu">{bien.lieu}</p>
              <h2 className="fiche-titre">{apercu.titre}</h2>
              <dl className="fiche-chiffres">
                <div>
                  <dt>Prix</dt>
                  <dd className="canon">{apercu.prix}</dd>
                </div>
                {apercu.surface && (
                  <div>
                    <dt>Surface</dt>
                    <dd>{apercu.surface}</dd>
                  </div>
                )}
                {apercu.pieces && (
                  <div>
                    <dt>Pièces</dt>
                    <dd>{apercu.pieces}</dd>
                  </div>
                )}
                {apercu.dpe && (
                  <div>
                    <dt>DPE</dt>
                    <dd>
                      <span className={`dpe dpe-${apercu.dpe}`}>{apercu.dpe}</span>
                    </dd>
                  </div>
                )}
              </dl>
              {description && <p className="fiche-description">{description}</p>}
            </div>

            <div className="champ">
              <label htmlFor="email">Votre e-mail (pour retrouver votre brouillon) *</label>
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="champ-aide">
                Jamais publié, jamais revendu. La mise en relation avec les
                acheteurs se fera par messagerie interne.
              </p>
            </div>

            <div className="publier-nav">
              <button className="btn btn-ghost" onClick={() => setEtape(2)}>
                ← Retour
              </button>
              <button
                className="btn btn-primary"
                disabled={!email.includes("@")}
                onClick={() => alert("Backend à brancher : sauvegarde du brouillon")}
              >
                Enregistrer le brouillon — gratuit
              </button>
            </div>
          </section>
        )}

        <p className="publier-note">
          Aucune carte bancaire, aucune commission : la publication est
          gratuite pour les particuliers. MANA ne réalise aucun acte
          réglementé — vous restez maître de votre vente.
        </p>
      </div>
    </main>
  );
}
