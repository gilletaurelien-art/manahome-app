import { useEffect } from "react";
import { baseUrl , lien} from "./router";
import {
  GlyphCadeau, GlyphBouclier, GlyphCadenas,
  GlyphStructure, GlyphBalance, GlyphVieLocale,
} from "./Glyphs";

// Page /approche — éditoriale : ce que MANAhome fait, ce qu'il ne fait pas.
// Le visiteur sort de cette page en sachant exactement à quoi s'attendre.

// Repositionné le 04/11/2026 : MANAhome n'est plus un portail immobilier
// généraliste — c'est un portail de LOCATION DE VACANCES, entre propriétaires
// et vacanciers. Les piliers qui parlaient de vente, mandat ou négociation
// immobilière sont réécrits dans ce sens. Un glyphe par pilier (même famille
// « synapse » que la nav) : les gens repèrent une idée à sa forme avant d'en
// lire le texte.
const PILIERS = [
  {
    titre: "Gratuit, vraiment",
    glyphe: GlyphCadeau,
    texte:
      "Publier une annonce ne coûte rien et ne rapporte rien à MANAhome sur votre location : aucune commission, aucun frais caché, aucun payant déguisé en option.",
  },
  {
    titre: "Aucun acte réglementé",
    glyphe: GlyphBouclier,
    texte:
      "MANAhome n'est pas une agence de location et n'en fait pas le métier : pas de mandat, pas d'encaissement, pas d'intermédiaire financier. Vous restez l'unique décisionnaire.",
  },
  {
    titre: "Vos données restent à vous",
    glyphe: GlyphCadenas,
    texte:
      "Aucune revente de données ni de leads. Les coordonnées ne sont jamais publiques : les échanges entre propriétaire et voyageur passent par une messagerie interne.",
  },
  {
    titre: "Une annonce structurée",
    glyphe: GlyphStructure,
    texte:
      "Surface, pièces, capacité, DPE, localisation : chaque fiche est organisée pour être lisible par les humains — et par les outils compatibles IA.",
  },
  {
    titre: "L'honnêteté comme règle",
    glyphe: GlyphBalance,
    texte:
      "Badge obligatoire sur les annonces importées, tarifs affichés sourcés et datés : nous préférons un catalogue restreint et vrai.",
  },
  {
    titre: "Le territoire au centre",
    glyphe: GlyphVieLocale,
    texte:
      "Un séjour se choisit aussi pour sa vie autour : transports, services, nature, risques connus — présentés sans enjolivement.",
  },
];

export function Approche() {

  const B = baseUrl();

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Notre approche</p>
        <h1 className="fiche-titre">
          Des locations de vacances honnêtes, structurées, territoriales
        </h1>
        <p className="territoire-intro">
          MANAhome est un portail de location de vacances, entre
          propriétaires et vacanciers. Voici, noir sur blanc, ce
          que nous faisons — et ce que nous ne ferons jamais.
        </p>

        <div className="ia-grid">
          {PILIERS.map((p) => (
            <div key={p.titre} className="ia-bloc">
              <h3 className="label-icone"><p.glyphe size={22} />{p.titre}</h3>
              <p>{p.texte}</p>
            </div>
          ))}
        </div>

        <p className="ia-disclaimer">
          MANAhome fait partie de l'écosystème MANA (mana.bzh, mana.love,
          manafrance.org).
        </p>

        <div className="est-actions">
          <a className="btn btn-ghost" href={lien(`/annonces/crozon`)}>
            Voir les annonces
          </a>
          <a className="btn btn-primary" href={lien(`/publier`)}>
            Publier mon annonce — gratuit
          </a>
        </div>
      </div>
    </main>
  );
}
