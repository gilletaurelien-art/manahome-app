import { useMemo, useState } from "react";
import { baseUrl } from "./router";
import { enregistrerAnnonceLocale } from "./annoncesLocales";
import { creerAnnonceApi, poserJustificatifApi, publierAnnonceApi } from "./apiDepot";
import { compresserPhoto, LIMITE_PHOTOS } from "./photos";

// Pré-remplissage depuis un lien profond : /publier?type=…&lieu=…
function paramsPublier(): Partial<FormBien> {
  const p = new URLSearchParams(window.location.search);
  const get = (k: string) => p.get(k) ?? "";
  const prix = get("prix");
  return {
    type: get("type"),
    lieu: get("lieu"),
    surface: get("surface"),
    pieces: get("pieces"),
    prix: prix && Number(prix) > 0 ? String(Math.round(Number(prix))) : "",
  };
}

// Parcours propriétaire : dépôt GRATUIT, aucune friction inutile (doctrine :
// « aucun champ obligatoire inutile »). 3 étapes max, ton chaleureux.
// MANAhome ne porte plus que la location de vacances (séjours courts) :
// un seul parcours, pas de choix vente/location.
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
    ...paramsPublier(),
    dpe: "",
  } as FormBien);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoErreur, setPhotoErreur] = useState("");
  const [typeRecherche, setTypeRecherche] = useState(
    TYPES.find((t) => t.v === bien.type)?.l ?? ""
  );
  const [typeOuvert, setTypeOuvert] = useState(false);

  const suggestionsType = TYPES.filter(
    (t) =>
      !typeRecherche.trim() ||
      t.l.toLowerCase().includes(typeRecherche.trim().toLowerCase()) ||
      t.v.includes(typeRecherche.trim().toLowerCase())
  );

  const choisirType = (t: { v: string; l: string }) => {
    setBien({ ...bien, type: t.v });
    setTypeRecherche(t.l);
    setTypeOuvert(false);
  };

  const ajouterPhotos = async (fichiers: FileList | null) => {
    if (!fichiers) return;
    setPhotoErreur("");
    const restant = LIMITE_PHOTOS - photos.length;
    if (restant <= 0) {
      setPhotoErreur(`Jusqu'à ${LIMITE_PHOTOS} photos par annonce.`);
      return;
    }
    const aTraiter = Array.from(fichiers).slice(0, restant);
    try {
      const compressees = await Promise.all(aTraiter.map(compresserPhoto));
      setPhotos((p) => [...p, ...compressees]);
    } catch {
      setPhotoErreur("Certaines photos n'ont pas pu être lues. Réessayez.");
    }
  };

  // La rédaction assistée (Mistral) arrive avec le backend : le bouton
  // est présent dès maintenant, l'API se branchera derrière.
  const apercu = useMemo(
    () => ({
      titre:
        bien.type && bien.lieu
          ? `${TYPES.find((t) => t.v === bien.type)?.l ?? bien.type} à ${bien.lieu}`
          : "Votre annonce",
      prix: bien.prix ? `${Number(bien.prix).toLocaleString("fr-FR")} € / nuit` : "Tarif à définir",
      surface: bien.surface ? `${bien.surface} m²` : null,
      pieces: bien.pieces ? `${bien.pieces} pièces` : null,
      dpe: bien.dpe && bien.dpe !== "NC" ? bien.dpe : null,
    }),
    [bien]
  );

  const etape1Valide = bien.type && bien.lieu && bien.prix;

  // ⭐ FEATURE_BACK : sous le flag, le dépôt part au service — brouillon
  // GRATUIT ET SANS CONDITION, puis publication via le verrou serveur.
  // Si le verrou demande les justificatifs légaux (locations, 007), le
  // formulaire les réclame EN PHRASES et les envoie : le trigger tranche,
  // le front traduit, il ne devine jamais ce qui manque.
  const featureBack = typeof __FEATURE_BACK__ !== "undefined" && __FEATURE_BACK__;
  const [brouillonId, setBrouillonId] = useState<string | null>(null);
  const [refusPublication, setRefusPublication] = useState<string | null>(null);
  const [numeroDeclaration, setNumeroDeclaration] = useState("");
  const [referenceAssurance, setReferenceAssurance] = useState("");
  const [assuranceExpire, setAssuranceExpire] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const publierReel = async () => {
    setEnvoiEnCours(true);
    try {
      const corps: Record<string, unknown> = {
        type_bien: bien.type === "terrain" ? "terrain" : bien.type === "appartement" ? "appartement" : "maison",
        offre: "location_courte_duree",
        prix_eur: null,
        tarif_nuit: Number(bien.prix),
        surface_m2: bien.surface ? Number(bien.surface) : null,
        pieces: bien.pieces ? Number(bien.pieces) : null,
        dpe: bien.dpe || null,
        description,
        code_insee: "29042",
      };
      const cree = await creerAnnonceApi(corps);
      if (!cree.ok || !cree.id) {
        setRefusPublication(cree.erreur ?? "Une erreur est survenue.");
        return;
      }
      setBrouillonId(cree.id);
      const pub = await publierAnnonceApi(cree.id);
      if (pub.ok) {
        window.location.assign(`${baseUrl()}/mes-annonces?publiee=${cree.id}`);
        return;
      }
      // refus du verrou : la phrase dit ce qui manque, le panneau
      // justificatifs n'apparaît QUE si le serveur l'a demandé
      setRefusPublication(pub.erreur ?? "Une erreur est survenue.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const envoyerJustificatifs = async () => {
    if (!brouillonId) return;
    setEnvoiEnCours(true);
    try {
      if (numeroDeclaration.trim()) {
        await poserJustificatifApi(brouillonId, {
          type_document: "declaration_meuble",
          reference: numeroDeclaration.trim(),
        });
      }
      if (referenceAssurance.trim()) {
        await poserJustificatifApi(brouillonId, {
          type_document: "attestation_assurance",
          reference: referenceAssurance.trim(),
          expire_le: assuranceExpire || null,
        });
      }
      const pub = await publierAnnonceApi(brouillonId);
      if (pub.ok) {
        window.location.assign(`${baseUrl()}/mes-annonces?publiee=${brouillonId}`);
        return;
      }
      setRefusPublication(pub.erreur ?? "Une erreur est survenue.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Démo locale : l'annonce est enregistrée dans ce navigateur (miroir du
  // dépôt direct de particulier). En prod : auth + API + S3 pour les photos.
  const publier = () => {
    if (featureBack) {
      publierReel();
      return;
    }
    const a = enregistrerAnnonceLocale({
      transaction: "location",
      titre: apercu.titre,
      lieu: bien.lieu,
      prix: Number(bien.prix),
      surface: bien.surface ? Number(bien.surface) : undefined,
      pieces: bien.pieces ? Number(bien.pieces) : undefined,
      dpe: bien.dpe && bien.dpe !== "NC" ? bien.dpe : undefined,
      description,
      photos: photos.length ? photos : undefined,
    });
    window.location.assign(`${baseUrl()}/mes-annonces?publiee=${a.id}`);
  };

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
            <div className="champ champ-recherche">
              <label htmlFor="type">Type de bien *</label>
              <input
                id="type"
                type="text"
                role="combobox"
                aria-expanded={typeOuvert}
                aria-controls="type-suggestions"
                autoComplete="off"
                placeholder="Rechercher : maison, appartement, terrain…"
                value={typeRecherche}
                onChange={(e) => {
                  setTypeRecherche(e.target.value);
                  setTypeOuvert(true);
                }}
                onFocus={() => setTypeOuvert(true)}
                onBlur={() =>
                  setTimeout(() => setTypeOuvert(false), 120)
                }
              />
              {typeOuvert && suggestionsType.length > 0 && (
                <ul id="type-suggestions" className="suggestions" role="listbox">
                  {suggestionsType.map((t) => (
                    <li key={t.v} role="option" aria-selected={bien.type === t.v}>
                      <button
                        type="button"
                        onClick={() => choisirType(t)}
                      >
                        {t.l}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {bien.type && !typeOuvert && (
                <p className="champ-aide">
                  Sélection : {TYPES.find((t) => t.v === bien.type)?.l}
                </p>
              )}
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
                <label htmlFor="prix">Tarif par nuit (€) *</label>
                <input
                  id="prix"
                  type="number"
                  min={0}
                  placeholder="85"
                  value={bien.prix}
                  onChange={(e) => setBien({ ...bien, prix: e.target.value })}
                />
                <p className="champ-aide">
                  Vous pourrez ajuster vos tarifs par période depuis votre
                  calendrier, après publication.
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
              <label htmlFor="photos">Les photos de votre bien</label>
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  ajouterPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="champ-aide">
                Jusqu'à {LIMITE_PHOTOS} photos, compressées dans votre
                navigateur avant tout envoi. La première fera la vitrine de
                l'annonce. (Démo locale : rien ne quitte votre appareil.)
              </p>
              {photoErreur && <p className="est-erreur">{photoErreur}</p>}
              {photos.length > 0 && (
                <ul className="photos-apercu">
                  {photos.map((p, i) => (
                    <li key={i}>
                      <img src={p} alt={`Photo ${i + 1}`} />
                      {i === 0 && <span className="photos-vitrine">Vitrine</span>}
                      <button
                        type="button"
                        aria-label={`Retirer la photo ${i + 1}`}
                        onClick={() =>
                          setPhotos((tab) => tab.filter((_, j) => j !== i))
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
            {photos.length > 0 && (
              <div className="apercu-photo">
                <img src={photos[0]} alt="Photo principale" />
              </div>
            )}
            <div className="fiche-corps apercu">
              <p className="fiche-lieu">{bien.lieu}</p>
              <h2 className="fiche-titre">{apercu.titre}</h2>
              <dl className="fiche-chiffres">
                <div>
                  <dt>Tarif</dt>
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
                voyageurs se fera par messagerie interne.
              </p>
            </div>

            {featureBack && refusPublication && (
              <div className="champ" role="alert">
                <p className="est-erreur">{refusPublication}</p>
                {brouillonId && (
                  <>
                    <label htmlFor="num-declaration">Numéro de déclaration de meublé touristique</label>
                    <input
                      id="num-declaration"
                      value={numeroDeclaration}
                      placeholder="Ex : 29160 123456 2026 1 1"
                      onChange={(e) => setNumeroDeclaration(e.target.value)}
                    />
                    <label htmlFor="ref-assurance">Référence de l'attestation d'assurance</label>
                    <input
                      id="ref-assurance"
                      value={referenceAssurance}
                      placeholder="Ex : ATL-2026-12345"
                      onChange={(e) => setReferenceAssurance(e.target.value)}
                    />
                    <label htmlFor="assurance-expire">Validité de l'assurance (date)</label>
                    <input
                      id="assurance-expire"
                      type="date"
                      value={assuranceExpire}
                      onChange={(e) => setAssuranceExpire(e.target.value)}
                    />
                    <div className="est-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={envoiEnCours || !numeroDeclaration.trim() || !referenceAssurance.trim()}
                        onClick={envoyerJustificatifs}
                      >
                        Déposer mes justificatifs et publier
                      </button>
                    </div>
                    <p className="champ-aide">
                      Votre annonce est enregistrée en brouillon — gratuite,
                      sans condition. Elle passera en ligne dès que le
                      serveur aura vérifié la présence des justificatifs.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="publier-nav">
              <button className="btn btn-ghost" onClick={() => setEtape(2)}>
                ← Retour
              </button>
              <button
                className="btn btn-primary"
                disabled={!email.includes("@") || envoiEnCours}
                onClick={publier}
              >
                Publier mon annonce — gratuit
              </button>
            </div>
          </section>
        )}

        <p className="publier-note">
          Aucune carte bancaire, aucune commission : la publication est
          gratuite pour les particuliers. MANA ne réalise aucun acte
          réglementé — vous restez maître de votre location.
        </p>
      </div>
    </main>
  );
}
