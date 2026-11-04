import type { Annonce } from "./annonces";
import { tarifsListe, libelleTarif, type UniteTarif } from "./annonces";
import { baseUrl } from "./router";
import {
  GlyphNuit, GlyphSemaine, GlyphMois, GlyphSurface, GlyphPieces, GlyphCouchage,
  GlyphParking, GlyphPiscine, GlyphJardin, GlyphBalconEquip,
} from "./Glyphs";
import { LIBELLE_EQUIPEMENT, type Equipement } from "./annonces";

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

// Carte annonce : la vitrine du produit — tarifs en serif, DPE officiel,
// badge de source présent mais jamais dominant (règle anti-marketplace).
export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const lieu = annonce.lieu;
  const tarifs = tarifsListe(annonce.tarifs);
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
          {/* Chaque palier renseigné, et uniquement ceux-là — le propriétaire
              choisit librement nuit / semaine / mois (04/11/2026). */}
          <p className="prix">
            {tarifs.map((t, i) => {
              const Icone = ICONE_UNITE[t.unite];
              return (
                <span key={t.unite} className="label-icone">
                  {i > 0 && <span className="sep"> · </span>}
                  <Icone size={16} />
                  {libelleTarif(t.montant, t.unite)}
                </span>
              );
            })}
          </p>
          <p className="meta"><span className="badge-source">Location</span></p>
          <div className="meta">
            {annonce.surface && (
              <span className="label-icone"><GlyphSurface size={15} />{annonce.surface} m²</span>
            )}
            {annonce.pieces != null && (
              <>
                <span className="sep">·</span>
                <span className="label-icone"><GlyphPieces size={15} />{annonce.pieces} pièces</span>
              </>
            )}
            {annonce.couchages != null && (
              <>
                <span className="sep">·</span>
                <span className="label-icone"><GlyphCouchage size={15} />{annonce.couchages} couchages</span>
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
          {annonce.equipements && annonce.equipements.length > 0 && (
            <div className="meta">
              {annonce.equipements.map((e) => {
                const Icone = ICONE_EQUIPEMENT[e];
                return (
                  <span key={e} title={LIBELLE_EQUIPEMENT[e]} aria-label={LIBELLE_EQUIPEMENT[e]}>
                    <Icone size={16} />
                  </span>
                );
              })}
            </div>
          )}
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
