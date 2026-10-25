import type { Annonce } from "./annonces";
import { baseUrl } from "./router";

// Carte annonce : la vitrine du produit — prix en serif, DPE officiel,
// badge de source présent mais jamais dominant (règle anti-marketplace).
export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const lieu = annonce.lieu;
  return (
    <li className="card">
      <a href={`${baseUrl()}/annonce/${annonce.id}`}>
        {annonce.photos && annonce.photos.length > 0 ? (
          <div className="photo pleine" aria-hidden="true">
            <img src={annonce.photos[0]} alt="" loading="lazy" />
          </div>
        ) : (
          <div className="photo" aria-hidden="true">
            photo du bien
          </div>
        )}
        <div className="body">
          <p className="lieu">{lieu}</p>
          <h3>{annonce.titre}</h3>
          <p className="prix">{annonce.prix.toLocaleString("fr-FR")} €</p>
          <div className="meta">
            {annonce.surface && <span>{annonce.surface} m²</span>}
            {annonce.pieces != null && (
              <>
                <span className="sep">·</span>
                <span>{annonce.pieces} pièces</span>
              </>
            )}
            {annonce.dpe && (
              <>
                <span className="sep">·</span>
                <span className={`dpe dpe-${annonce.dpe}`} title={`DPE ${annonce.dpe}`}>
                  {annonce.dpe}
                </span>
              </>
            )}
          </div>
          {annonce.source === "import_pro" && (
            <p>
              <span className="badge-source pro">Annonce professionnelle</span>
            </p>
          )}
        </div>
      </a>
    </li>
  );
}
