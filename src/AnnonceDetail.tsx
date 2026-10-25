import { useEffect } from "react";
import type { Annonce } from "./annonces";
import { baseUrl } from "./router";

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

export function AnnonceDetail({ annonce }: { annonce: Annonce }) {
  useEffect(() => {
    document.title = `${annonce.titre} — MANAhome`;
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, [annonce]);

  return (
    <>
      <JsonLd annonce={annonce} />
      <main className="fiche">
        <a className="retour" href={`${baseUrl()}/`}>
          ← Toutes les annonces
        </a>

        <div className="fiche-photos" aria-hidden="true">
          photo du bien
        </div>

        <div className="fiche-corps">
          <p className="fiche-lieu">{annonce.lieu}</p>
          <h1 className="fiche-titre">{annonce.titre}</h1>

          {/* Les 4 chiffres : lecture en 2 secondes */}
          <dl className="fiche-chiffres">
            <div>
              <dt>Prix</dt>
              <dd className="canon">{annonce.prix.toLocaleString("fr-FR")} €</dd>
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

          <div className="fiche-pied">
            {annonce.source === "import_pro" ? (
              <span className="badge-source pro">
                Annonce professionnelle — importée
              </span>
            ) : (
              <span className="badge-source">Annonce directe de particulier</span>
            )}
            <a className="btn btn-primary" href="#contacter">
              Contacter le vendeur
            </a>
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
