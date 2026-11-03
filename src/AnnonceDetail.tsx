import { useEffect, useState } from "react";
import type { Annonce } from "./annonces";
import { baseUrl, langueCourante } from "./router";
import { t } from "./i18n";
import { ouvrirConversation } from "./messagerieDonnees";
import { annonceLocaleParId } from "./annoncesLocales";

// JSON-LD RealEstateListing (schema.org) : le cœur du pilier « Lisible
// par les IA ». Données structurées sur chaque fiche, URL stable.
function JsonLd({ annonce }: { annonce: Annonce }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: annonce.titre,
    url: `${window.location.origin}${baseUrl()}/annonce/${annonce.id}`,
    datePosted: annonce.datePublication,
    offers: {
      "@type": "Offer",
      price: annonce.prix,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    ...(annonce.surface
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: annonce.surface,
            unitCode: "MTK",
          },
        }
      : {}),
    ...(annonce.pieces != null
      ? { numberOfRooms: annonce.pieces }
      : {}),
    ...(annonce.dpe ? { description: `DPE ${annonce.dpe}` } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Crozon",
      addressRegion: "Bretagne",
      postalCode: "29160",
      addressCountry: "FR",
    },
  };
  return (
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  );
}

// ⭐ POURQUOI OS SUR UNE IFRAME, PAS UNE BIBLIOTHÈQUE DE CARTES.
// 1. DOCTRINE SOUVERAINE : OpenStreetMap est un fond de carte libre, hébergé
//    par une fondation européenne — pas une tuile cloud américaine. Et
//    l'embed officiel dispense d'ajouter Leaflet/MapLibre au bundle : la
//    fiche reste un pré-rendu léger, lisible, rapide sur mobile rural.
// 2. DOCTRINE ANTI-ADRESSE : PAS de marqueur. La géoloc des annonces est
//    LARGE (au quartier, voir 001_init.sql) et la carte dézoome d'office —
//    un marqueur transformerait un quartier en adresse. Le lien sortant
//    ouvre OSM sur la même zone, pas sur le bien.
function CarteOsm({ annonce }: { annonce: Annonce }) {
  const L = langueCourante();
  if (!annonce.geoloc) return null;
  const { lat, lon } = annonce.geoloc;
  // ~1,5 km de côté : la carte montre le QUARTIER, jamais la porte.
  const demi = 0.008;
  const bbox = `${lon - demi},${lat - demi},${lon + demi},${lat + demi}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`;
  return (
    <section className="fiche-carte" aria-label={t(L, "Carte du quartier")}>
      <p className="apercu-label">{t(L, "Carte du quartier")}</p>
      <iframe
        title={t(L, "Carte du quartier")}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <p className="fiche-carte-note">
        {t(L, "Localisation approximative au quartier, posée sur OpenStreetMap — la carte ne désigne jamais l'adresse précise du bien.")}{" "}
        <a
          href={`https://www.openstreetmap.org/#map=13/${lat}/${lon}`}
          target="_blank"
          rel="noreferrer"
        >
          {t(L, "Voir sur OpenStreetMap")}
        </a>
      </p>
    </section>
  );
}

export function AnnonceDetail({ annonce }: { annonce: Annonce }) {
  const [premierMessage, setPremierMessage] = useState("");
  const [lienCopie, setLienCopie] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const locale = annonceLocaleParId(annonce.id);

  useEffect(() => {
    document.title = `${annonce.titre} — MANAhome`;
    // Meta de partage (OG) injectées dynamiquement : SPA statique, une
    // seule page servie — chaque fiche façonne son propre aperçu social.
    const url = `${window.location.origin}${baseUrl()}/annonce/${annonce.id}`;
    const metas: [string, string, string][] = [
      ["property", "og:title", `${annonce.titre} — MANAhome`],
      [
        "property",
        "og:description",
        `${annonce.lieu} — ${annonce.prix.toLocaleString("fr-FR")} €${
          annonce.transaction === "location" ? "/mois" : ""
        }${
          annonce.surface ? `, ${annonce.surface} m²` : ""
        }. Annonce directe de particulier, gratuite, sur le portail territorial MANAhome.`,
      ],
      ["property", "og:url", url],
      ["name", "twitter:card", "summary"],
    ];
    const crees = metas.map(([attr, cle, val]) => {
      const m = document.createElement("meta");
      m.setAttribute(attr, cle);
      m.setAttribute("content", val);
      document.head.appendChild(m);
      return m;
    });
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
      crees.forEach((m) => m.remove());
    };
  }, [annonce]);

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${baseUrl()}/annonce/${annonce.id}`
      );
      setLienCopie(true);
      setTimeout(() => setLienCopie(false), 2500);
    } catch {
      setLienCopie(false);
    }
  };

  return (
    <>
      <JsonLd annonce={annonce} />
      <main className="fiche">
        <a className="retour" href={`${baseUrl()}/`}>
          ← Toutes les annonces
        </a>

        <div className="fiche-galerie">
          {annonce.photos && annonce.photos.length > 0 ? (
            <>
              <div className="fiche-photo-principale">
                <img src={annonce.photos[photoIndex]} alt={`Photo ${photoIndex + 1}`} />
              </div>
              {annonce.photos.length > 1 && (
                <div className="fiche-miniatures">
                  {annonce.photos.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`fiche-miniature ${i === photoIndex ? "on" : ""}`}
                      onClick={() => setPhotoIndex(i)}
                      aria-label={`Photo ${i + 1}`}
                    >
                      <img src={p} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="fiche-photos" aria-hidden="true">
              photo du bien
            </div>
          )}
        </div>

        <div className="fiche-corps">
          <p className="fiche-lieu">{annonce.lieu}</p>
          <h1 className="fiche-titre">{annonce.titre}</h1>

          {/* Les 4 chiffres : lecture en 2 secondes */}
          <dl className="fiche-chiffres">
            <div>
              <dt>Prix</dt>
              <dd className="canon">{annonce.prix.toLocaleString("fr-FR")} €{annonce.transaction === "location" &&
                <span className="prix-mois">/mois</span>}</dd>
            </div>
            {annonce.surface && (
              <div>
                <dt>Surface</dt>
                <dd>
                  {annonce.surface.toLocaleString("fr-FR")} m²
                </dd>
              </div>
            )}
            {annonce.pieces != null && (
              <div>
                <dt>Pièces</dt>
                <dd>{annonce.pieces}</dd>
              </div>
            )}
            {annonce.dpe && (
              <div>
                <dt>DPE</dt>
                <dd>
                  <span className={`dpe dpe-${annonce.dpe}`}>{annonce.dpe}</span>
                </dd>
              </div>
            )}
          </dl>

          <p className="fiche-description">{annonce.description}</p>

          <CarteOsm annonce={annonce} />

          <div className="fiche-pied">
            {annonce.source === "import_pro" ? (
              <span className="badge-source pro">
                Annonce professionnelle — importée
              </span>
            ) : (
              <span className="badge-source">Annonce directe de particulier</span>
            )}
          </div>
          <section
            id="contacter"
            className="publier-panel fiche-contacter"
            aria-label="Contacter le vendeur"
          >
            <p className="apercu-label">Contacter le vendeur</p>
            <div className="champ">
              <label htmlFor="premier-message">Votre premier message</label>
              <textarea
                id="premier-message"
                rows={3}
                placeholder="Bonjour, votre bien m'intéresse, serait-il possible de visiter ?"
                value={premierMessage}
                onChange={(e) => setPremierMessage(e.target.value)}
              />
              <p className="champ-aide">
                Aucune coordonnée échangée : la discussion se poursuit dans
                votre messagerie interne MANAhome.
              </p>
            </div>
            <div className="est-actions">
              <a
                className="btn btn-primary"
                href={`${baseUrl()}/messagerie?annonce=${annonce.id}`}
                onClick={() => {
                  if (premierMessage.trim()) {
                    ouvrirConversation(annonce.id, annonce.titre, premierMessage);
                  }
                }}
              >
                Ouvrir la conversation
              </a>
            </div>
          </section>
          <div className="fiche-partage">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={copierLien}
            >
              {lienCopie ? "Lien copié ✓" : "Copier le lien de l'annonce"}
            </button>
            {locale && (
              <a className="btn btn-ghost" href={`${baseUrl()}/mes-annonces`}>
                Gérer mon annonce
              </a>
            )}
          </div>
          <p className="fiche-note">
            La mise en relation se fait par messagerie interne : les
            coordonnées du vendeur ne sont jamais publiées.
          </p>
        </div>
      </main>
    </>
  );
}
