import { useMemo, useState } from "react";
import { baseUrl, langueCourante } from "./router";
import { t as tr } from "./i18n";
import { enregistrerAnnonceLocale } from "./annoncesLocales";
import { creerAnnonceApi, poserJustificatifApi, publierAnnonceApi } from "./apiDepot";
import { compresserPhoto, LIMITE_PHOTOS } from "./photos";
import {
  tarifsListe, EQUIPEMENTS, LIBELLE_EQUIPEMENT,
  type Tarifs, type UniteTarif, type Equipement,
} from "./annonces";
import {
  GlyphMaison, GlyphNuit, GlyphSemaine, GlyphMois,
  GlyphSurface, GlyphPieces, GlyphDpe, GlyphPhoto, GlyphDescription, GlyphEmail,
  GlyphCompas, GlyphValidation, GlyphCouchage,
  GlyphParking, GlyphPiscine, GlyphJardin, GlyphBalconEquip,
} from "./Glyphs";

const ICONE_EQUIPEMENT: Record<Equipement, (p: { size?: number }) => JSX.Element> = {
  parking: GlyphParking,
  piscine: GlyphPiscine,
  jardin: GlyphJardin,
  balcon: GlyphBalconEquip,
};

const ICONE_UNITE: Record<UniteTarif, (p: { size?: number }) => JSX.Element> = {
  nuit: GlyphNuit,
  semaine: GlyphSemaine,
  mois: GlyphMois,
};

// Pré-remplissage depuis un lien profond : /publier?type=…&lieu=…
function paramsPublier(): Partial<FormBien> {
  const p = new URLSearchParams(window.location.search);
  const get = (k: string) => p.get(k) ?? "";
  const nuit = get("prix"); // compat : les liens profonds existants passent "prix"
  return {
    type: get("type"),
    lieu: get("lieu"),
    surface: get("surface"),
    pieces: get("pieces"),
    tarifNuit: nuit && Number(nuit) > 0 ? String(Math.round(Number(nuit))) : "",
  };
}

// Parcours propriétaire : dépôt GRATUIT, aucune friction inutile (doctrine :
// « aucun champ obligatoire inutile »). 3 étapes max, ton chaleureux.
// MANAhome ne porte plus que la location de vacances (séjours courts) :
// un seul parcours, pas de choix vente/location.
// ⭐ TROIS PALIERS DE TARIF (04/11/2026), LIBRES : le propriétaire choisit
// lesquels il propose — nuit, semaine, mois — et les montants n'ont pas à
// être proportionnels entre eux. Seule règle : au moins un des trois.
// Le backend branchera : auth particuliers, sauvegarde brouillon,
// rédaction assistée Mistral, pipeline photo S3.

type Etape = 1 | 2 | 3;

interface FormBien {
  type: string;
  surface: string;
  pieces: string;
  couchages: string;
  tarifNuit: string;
  tarifSemaine: string;
  tarifMois: string;
  dpe: string;
  lieu: string;
}

/** Les champs de tarif remplis, en Tarifs — jamais un champ vide converti en 0. */
function tarifsDuFormulaire(bien: FormBien): Tarifs {
  return {
    ...(bien.tarifNuit ? { nuit: Number(bien.tarifNuit) } : {}),
    ...(bien.tarifSemaine ? { semaine: Number(bien.tarifSemaine) } : {}),
    ...(bien.tarifMois ? { mois: Number(bien.tarifMois) } : {}),
  };
}

const TYPES = [
  { v: "maison", l: "Maison" },
  { v: "appartement", l: "Appartement" },
  { v: "terrain", l: "Terrain" },
  { v: "autre", l: "Autre" },
];

const LIBELLE_UNITE_TARIF: Record<UniteTarif, string> = {
  nuit: "nuit",
  semaine: "semaine",
  mois: "mois",
};

const DPES = ["A", "B", "C", "D", "E", "F", "G", "NC"];

export function Publier() {
  const [etape, setEtape] = useState<Etape>(1);
  const L = langueCourante();
  const [bien, setBien] = useState<FormBien>({
    type: "",
    surface: "",
    pieces: "",
    couchages: "",
    tarifNuit: "",
    tarifSemaine: "",
    tarifMois: "",
    lieu: "",
    dpe: "",
    ...paramsPublier(),
  });
  // Équipements : une LISTE de ce qui est présent, jamais quatre booléens
  // à part — un équipement non coché n'entre simplement pas dans la liste.
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const basculerEquipement = (e: Equipement) =>
    setEquipements((liste) =>
      liste.includes(e) ? liste.filter((x) => x !== e) : [...liste, e]
    );
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
      setPhotoErreur(tr(L, "Jusqu'à {n} photos par annonce.").replace("{n}", String(LIMITE_PHOTOS)));
      return;
    }
    const aTraiter = Array.from(fichiers).slice(0, restant);
    try {
      const compressees = await Promise.all(aTraiter.map(compresserPhoto));
      setPhotos((p) => [...p, ...compressees]);
    } catch {
      setPhotoErreur(tr(L, "Certaines photos n'ont pas pu être lues. Réessayez."));
    }
  };

  // La rédaction assistée (Mistral) arrive avec le backend : le bouton
  // est présent dès maintenant, l'API se branchera derrière.
  const apercu = useMemo(
    () => ({
      titre:
        bien.type && bien.lieu
          ? `${TYPES.find((t) => t.v === bien.type)?.l ?? bien.type} à ${bien.lieu}`
          : tr(L, "Votre annonce"),
      tarifs: tarifsListe(tarifsDuFormulaire(bien)),
      surface: bien.surface ? `${bien.surface} m²` : null,
      pieces: bien.pieces ? `${bien.pieces} pièces` : null,
      couchages: bien.couchages ? `${bien.couchages} couchages` : null,
      dpe: bien.dpe && bien.dpe !== "NC" ? bien.dpe : null,
    }),
    [bien]
  );

  // Au moins UN des trois paliers — jamais tous requis.
  const etape1Valide =
    bien.type && bien.lieu && (bien.tarifNuit || bien.tarifSemaine || bien.tarifMois);

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
        tarif_nuit: bien.tarifNuit ? Number(bien.tarifNuit) : null,
        tarif_semaine: bien.tarifSemaine ? Number(bien.tarifSemaine) : null,
        tarif_mois: bien.tarifMois ? Number(bien.tarifMois) : null,
        surface_m2: bien.surface ? Number(bien.surface) : null,
        pieces: bien.pieces ? Number(bien.pieces) : null,
        couchages: bien.couchages ? Number(bien.couchages) : null,
        parking: equipements.includes("parking"),
        piscine: equipements.includes("piscine"),
        jardin: equipements.includes("jardin"),
        balcon: equipements.includes("balcon"),
        dpe: bien.dpe || null,
        description,
        code_insee: "29042",
      };
      const cree = await creerAnnonceApi(corps);
      if (!cree.ok || !cree.id) {
        setRefusPublication(cree.erreur ?? tr(L, "Une erreur est survenue."));
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
      setRefusPublication(pub.erreur ?? tr(L, "Une erreur est survenue."));
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
      setRefusPublication(pub.erreur ?? tr(L, "Une erreur est survenue."));
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
      tarifs: tarifsDuFormulaire(bien),
      surface: bien.surface ? Number(bien.surface) : undefined,
      pieces: bien.pieces ? Number(bien.pieces) : undefined,
      couchages: bien.couchages ? Number(bien.couchages) : undefined,
      equipements: equipements.length ? equipements : undefined,
      dpe: bien.dpe && bien.dpe !== "NC" ? bien.dpe : undefined,
      description,
      photos: photos.length ? photos : undefined,
    });
    window.location.assign(`${baseUrl()}/mes-annonces?publiee=${a.id}`);
  };

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">{tr(L, "Gratuit, sans commission")}</p>
        <h1 className="fiche-titre">{tr(L, "Publier mon annonce")}</h1>
        <p className="territoire-intro">
          {tr(L, "Trois étapes, aucun engagement. Vous gardez la main à tout moment : votre annonce n'est publiée que lorsque vous la validez.")}
        </p>

        {/* Étapes */}
        <ol className="etapes">
          <li className={`label-icone ${etape === 1 ? "on" : etape > 1 ? "done" : ""}`}><GlyphMaison size={16} />{tr(L, "Le bien")}</li>
          <li className={`label-icone ${etape === 2 ? "on" : etape > 2 ? "done" : ""}`}><GlyphDescription size={16} />{tr(L, "La description")}</li>
          <li className={`label-icone ${etape === 3 ? "on" : ""}`}><GlyphValidation size={16} />{tr(L, "Validation")}</li>
        </ol>

        {etape === 1 && (
          <section className="publier-panel">
            <div className="champ champ-recherche">
              <label htmlFor="type" className="label-icone"><GlyphMaison size={15} />{tr(L, "Type de bien *")}</label>
              <input
                id="type"
                type="text"
                role="combobox"
                aria-expanded={typeOuvert}
                aria-controls="type-suggestions"
                autoComplete="off"
                placeholder={tr(L, "Rechercher : maison, appartement, terrain…")}
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
                  {suggestionsType.map((opt) => (
                    <li key={opt.v} role="option" aria-selected={bien.type === opt.v}>
                      <button
                        type="button"
                        onClick={() => choisirType(opt)}
                      >
                        {tr(L, opt.l)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {bien.type && !typeOuvert && (
                <p className="champ-aide">
                  {tr(L, "Sélection :")} {tr(L, TYPES.find((opt) => opt.v === bien.type)?.l ?? "")}
                </p>
              )}
            </div>
            <div className="champ">
              <label htmlFor="lieu" className="label-icone"><GlyphCompas size={15} />{tr(L, "Commune ou secteur *")}</label>
              <input
                id="lieu"
                placeholder={tr(L, "Ex : nom de la commune ou du secteur")}
                value={bien.lieu}
                onChange={(e) => setBien({ ...bien, lieu: e.target.value })}
              />
            </div>
            <div className="champ">
              <label className="label-icone"><GlyphNuit size={15} />{tr(L, "Vos tarifs — au moins un des trois *")}</label>
              <p className="champ-aide">
                {tr(L, "Libre à vous de ne proposer qu'un seul palier, ou les trois. Les montants n'ont pas besoin d'être proportionnels entre eux.")}
              </p>
              <div className="champ-grid">
                <div className="champ">
                  <label htmlFor="tarif-nuit" className="label-icone"><GlyphNuit size={15} />{tr(L, "Par nuit (€)")}</label>
                  <input
                    id="tarif-nuit"
                    type="number"
                    min={0}
                    placeholder="50"
                    value={bien.tarifNuit}
                    onChange={(e) => setBien({ ...bien, tarifNuit: e.target.value })}
                  />
                </div>
                <div className="champ">
                  <label htmlFor="tarif-semaine" className="label-icone"><GlyphSemaine size={15} />{tr(L, "Par semaine (€)")}</label>
                  <input
                    id="tarif-semaine"
                    type="number"
                    min={0}
                    placeholder="250"
                    value={bien.tarifSemaine}
                    onChange={(e) => setBien({ ...bien, tarifSemaine: e.target.value })}
                  />
                </div>
                <div className="champ">
                  <label htmlFor="tarif-mois" className="label-icone"><GlyphMois size={15} />{tr(L, "Par mois (€)")}</label>
                  <input
                    id="tarif-mois"
                    type="number"
                    min={0}
                    placeholder="750"
                    value={bien.tarifMois}
                    onChange={(e) => setBien({ ...bien, tarifMois: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="champ-grid">
              <div className="champ">
                <label htmlFor="surface" className="label-icone"><GlyphSurface size={15} />{tr(L, "Surface (m²)")}</label>
                <input
                  id="surface"
                  type="number"
                  min={0}
                  value={bien.surface}
                  onChange={(e) => setBien({ ...bien, surface: e.target.value })}
                />
              </div>
              <div className="champ">
                <label htmlFor="pieces" className="label-icone"><GlyphPieces size={15} />{tr(L, "Pièces")}</label>
                <input
                  id="pieces"
                  type="number"
                  min={0}
                  value={bien.pieces}
                  onChange={(e) => setBien({ ...bien, pieces: e.target.value })}
                />
              </div>
              <div className="champ">
                <label htmlFor="couchages" className="label-icone"><GlyphCouchage size={15} />{tr(L, "Couchages")}</label>
                <input
                  id="couchages"
                  type="number"
                  min={0}
                  placeholder={tr(L, "Ex : 4")}
                  value={bien.couchages}
                  onChange={(e) => setBien({ ...bien, couchages: e.target.value })}
                />
              </div>
            </div>
            <div className="champ">
              <label className="label-icone"><GlyphParking size={15} />{tr(L, "Équipements")}</label>
              <p className="champ-aide">
                {tr(L, "Cochez uniquement ce qui est réellement présent — un équipement non coché n'est pas affiché comme absent, il n'est juste pas annoncé.")}
              </p>
              <div className="dpe-choix">
                {EQUIPEMENTS.map((e) => {
                  const Icone = ICONE_EQUIPEMENT[e];
                  return (
                    <button
                      key={e}
                      type="button"
                      className={`dpe-btn label-icone ${equipements.includes(e) ? "on" : ""}`}
                      aria-pressed={equipements.includes(e)}
                      onClick={() => basculerEquipement(e)}
                    >
                      <Icone size={16} />
                      {tr(L, LIBELLE_EQUIPEMENT[e])}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="champ">
              <label className="label-icone"><GlyphDpe size={15} />{tr(L, "DPE (diagnostic de performance énergétique)")}</label>
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
                {tr(L, "Continuer")}
              </button>
            </div>
          </section>
        )}

        {etape === 2 && (
          <section className="publier-panel">
            <div className="champ">
              <label htmlFor="photos" className="label-icone"><GlyphPhoto size={15} />{tr(L, "Les photos de votre bien")}</label>
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
                {tr(L, "Jusqu'à {n} photos, compressées dans votre navigateur avant tout envoi. La première fera la vitrine de l'annonce. (Démo locale : rien ne quitte votre appareil.)").replace("{n}", String(LIMITE_PHOTOS))}
              </p>
              {photoErreur && <p className="est-erreur">{photoErreur}</p>}
              {photos.length > 0 && (
                <ul className="photos-apercu">
                  {photos.map((p, i) => (
                    <li key={i}>
                      <img src={p} alt={`Photo ${i + 1}`} />
                      {i === 0 && <span className="photos-vitrine">{tr(L, "Vitrine")}</span>}
                      <button
                        type="button"
                        aria-label={tr(L, "Retirer la photo {n}").replace("{n}", String(i + 1))}
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
              <label htmlFor="desc" className="label-icone"><GlyphDescription size={15} />{tr(L, "Décrivez votre bien, comme vous le raconteriez")}</label>
              <textarea
                id="desc"
                rows={7}
                placeholder={tr(L, "Maison lumineuse à deux pas du port, jardin clos, cuisine ouverte…")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="champ-aide">
                {tr(L, "Pas inspiré ? La rédaction assistée arrive avec votre compte : elle transforme vos mots en annonce chaleureuse et factuelle.")}
              </p>
            </div>
            <div className="publier-nav">
              <button className="btn btn-ghost" onClick={() => setEtape(1)}>
                ← {tr(L, "Retour")}
              </button>
              <button className="btn btn-primary" onClick={() => setEtape(3)}>
                {tr(L, "Continuer")}
              </button>
            </div>
          </section>
        )}

        {etape === 3 && (
          <section className="publier-panel">
            <p className="apercu-label label-icone"><GlyphValidation size={18} />{tr(L, "Aperçu de votre annonce")}</p>
            {photos.length > 0 && (
              <div className="apercu-photo">
                <img src={photos[0]} alt={tr(L, "Photo principale")} />
              </div>
            )}
            <div className="fiche-corps apercu">
              <p className="fiche-lieu">{bien.lieu}</p>
              <h2 className="fiche-titre">{apercu.titre}</h2>
              <dl className="fiche-chiffres">
                {apercu.tarifs.length > 0 ? (
                  apercu.tarifs.map((tar) => {
                    const Icone = ICONE_UNITE[tar.unite];
                    return (
                      <div key={tar.unite}>
                        <dt className="label-icone"><Icone size={16} />{tr(L, "Tarif / {unite}").replace("{unite}", tr(L, LIBELLE_UNITE_TARIF[tar.unite]))}</dt>
                        <dd className="canon">{tar.montant.toLocaleString("fr-FR")} €</dd>
                      </div>
                    );
                  })
                ) : (
                  <div>
                    <dt className="label-icone"><GlyphNuit size={16} />{tr(L, "Tarif")}</dt>
                    <dd className="canon">{tr(L, "À définir")}</dd>
                  </div>
                )}
                {apercu.surface && (
                  <div>
                    <dt className="label-icone"><GlyphSurface size={16} />{tr(L, "Surface")}</dt>
                    <dd>{apercu.surface}</dd>
                  </div>
                )}
                {apercu.pieces && (
                  <div>
                    <dt className="label-icone"><GlyphPieces size={16} />{tr(L, "Pièces")}</dt>
                    <dd>{apercu.pieces}</dd>
                  </div>
                )}
                {apercu.couchages && (
                  <div>
                    <dt className="label-icone"><GlyphCouchage size={16} />{tr(L, "Couchages")}</dt>
                    <dd>{apercu.couchages}</dd>
                  </div>
                )}
                {apercu.dpe && (
                  <div>
                    <dt className="label-icone"><GlyphDpe size={16} />{tr(L, "DPE")}</dt>
                    <dd>
                      <span className={`dpe dpe-${apercu.dpe}`}>{apercu.dpe}</span>
                    </dd>
                  </div>
                )}
              </dl>
              {equipements.length > 0 && (
                <p className="meta">
                  {equipements.map((e) => {
                    const Icone = ICONE_EQUIPEMENT[e];
                    return (
                      <span key={e} className="label-icone">
                        <Icone size={15} />{tr(L, LIBELLE_EQUIPEMENT[e])}
                      </span>
                    );
                  })}
                </p>
              )}
              {description && <p className="fiche-description">{description}</p>}
            </div>

            <div className="champ">
              <label htmlFor="email" className="label-icone"><GlyphEmail size={15} />{tr(L, "Votre e-mail (pour retrouver votre brouillon) *")}</label>
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="champ-aide">
                {tr(L, "Jamais publié, jamais revendu. La mise en relation avec les voyageurs se fera par messagerie interne.")}
              </p>
            </div>

            {featureBack && refusPublication && (
              <div className="champ" role="alert">
                <p className="est-erreur">{refusPublication}</p>
                {brouillonId && (
                  <>
                    <label htmlFor="num-declaration">{tr(L, "Numéro de déclaration de meublé touristique")}</label>
                    <input
                      id="num-declaration"
                      value={numeroDeclaration}
                      placeholder={tr(L, "Ex : 29160 123456 2026 1 1")}
                      onChange={(e) => setNumeroDeclaration(e.target.value)}
                    />
                    <label htmlFor="ref-assurance">{tr(L, "Référence de l'attestation d'assurance")}</label>
                    <input
                      id="ref-assurance"
                      value={referenceAssurance}
                      placeholder={tr(L, "Ex : ATL-2026-12345")}
                      onChange={(e) => setReferenceAssurance(e.target.value)}
                    />
                    <label htmlFor="assurance-expire">{tr(L, "Validité de l'assurance (date)")}</label>
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
                        {tr(L, "Déposer mes justificatifs et publier")}
                      </button>
                    </div>
                    <p className="champ-aide">
                      {tr(L, "Votre annonce est enregistrée en brouillon — gratuite, sans condition. Elle passera en ligne dès que le serveur aura vérifié la présence des justificatifs.")}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="publier-nav">
              <button className="btn btn-ghost" onClick={() => setEtape(2)}>
                ← {tr(L, "Retour")}
              </button>
              <button
                className="btn btn-primary"
                disabled={!email.includes("@") || envoiEnCours}
                onClick={publier}
              >
                {tr(L, "Publier mon annonce — gratuit")}
              </button>
            </div>
          </section>
        )}

        <p className="publier-note">
          {tr(L, "Aucune carte bancaire, aucune commission : la publication est gratuite pour les particuliers. MANA ne réalise aucun acte réglementé — vous restez maître de votre location.")}
        </p>
      </div>
    </main>
  );
}
