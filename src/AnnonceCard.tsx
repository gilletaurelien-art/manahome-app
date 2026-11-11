import type { Annonce } from "./annonces";
import { tarifsListe, LIBELLE_UNITE, type UniteTarif } from "./annonces";
import { adresseLisible } from "./adresse";
import { paysDeLaFiche } from "./apiHebergements";
import type { HebergementImporte } from "./apiHebergements";
import { baseUrl, langueCourante } from "./router";
import { t } from "./i18n";
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
  const importe = annonce as Partial<HebergementImporte>;
  const adresse = annonce.source === "import_pro"
    ? adresseLisible(importe.adresseParts, paysDeLaFiche(importe))
    : null;
  const L = langueCourante();
  return (
    <li className="card">
      <a href={`${baseUrl()}/annonce/${annonce.id}`}>
        {annonce.photos && annonce.photos.length > 0 ? (
          <div className="photo pleine" aria-hidden="true">
            <img src={annonce.photos[0]} alt="" loading="lazy" />
          </div>
        ) : (
          <div className="photo" aria-hidden="true">
            {t(L, "photo du bien")}
          </div>
        )}
        <div className="body">
          <p className="lieu">{lieu}</p>
          {/* ⭐ L'ADRESSE, mise en forme SELON LA SOURCE : « 12 rue de la Paix »
              en France, « Hauptstraße 12 » ailleurs. La moisson garde les
              parties séparées justement pour que ce choix se fasse ici.
              ⚠️ Jamais sur un dépôt de particulier : seuls les établissements
              importés en portent une, et deux contraintes de base le
              garantissent côté serveur. */}

          <h3>{annonce.titre}</h3>
          {/* ⭐ L'ADRESSE SOUS LE NOM, jamais au-dessus : « Crozon / Route de
              l'Aber 50 / Camping de l'Aber » se lisait à l'envers — on nomme
              l'établissement, puis on dit où il est.
              ⚠️ Jamais sur un dépôt de particulier : seuls les établissements
              importés en portent une, et deux contraintes de base le
              garantissent côté serveur. */}
          {adresse && <p className="adresse">{adresse}</p>}
          {/* Chaque palier renseigné, et uniquement ceux-là — le propriétaire
              choisit librement nuit / semaine / mois (04/11/2026). */}
          {/* ⛔ UN TARIF ABSENT SE DIT, IL NE SE LAISSE PAS EN BLANC.
              Les établissements importés du catalogue moissonné n'ont AUCUN
              prix — personne ne les a déposés, personne n'en a fixé un. Sans
              cette ligne, `tarifs` vide rendait un `<p class="prix">` vide :
              un champ manquant qui s'affiche en blanc se lit comme un défaut
              du site, un champ manquant qui s'annonce se lit comme une
              honnêteté. */}
          <p className="prix">
            {tarifs.length === 0 && (
              <span className="prix-absent">{t(L, "Tarif à demander")}</span>
            )}
            {tarifs.map((tar, i) => {
              const Icone = ICONE_UNITE[tar.unite];
              return (
                <span key={tar.unite} className="label-icone">
                  {i > 0 && <span className="sep"> · </span>}
                  <Icone size={16} />
                  {tar.montant.toLocaleString("fr-FR")} €/{t(L, LIBELLE_UNITE[tar.unite])}
                </span>
              );
            })}
          </p>
          <p className="meta"><span className="badge-source">{t(L, "Location")}</span></p>
          <div className="meta">
            {annonce.surface && (
              <span className="label-icone"><GlyphSurface size={15} />{annonce.surface} m²</span>
            )}
            {annonce.pieces != null && (
              <>
                <span className="sep">·</span>
                <span className="label-icone"><GlyphPieces size={15} />{t(L, "{n} pièces").replace("{n}", String(annonce.pieces))}</span>
              </>
            )}
            {annonce.couchages != null && (
              <>
                <span className="sep">·</span>
                <span className="label-icone"><GlyphCouchage size={15} />{t(L, "{n} couchages").replace("{n}", String(annonce.couchages))}</span>
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
                  <span key={e} title={t(L, LIBELLE_EQUIPEMENT[e])} aria-label={t(L, LIBELLE_EQUIPEMENT[e])}>
                    <Icone size={16} />
                  </span>
                );
              })}
            </div>
          )}
          {annonce.source === "import_pro" && (
            <p>
              <span className="badge-source pro">{t(L, "Annonce professionnelle")}</span>
            </p>
          )}
        </div>
      </a>
    </li>
  );
}
