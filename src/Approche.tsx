import { useEffect } from "react";
import { baseUrl } from "./router";

// Page /approche — éditoriale : ce que MANAhome fait, ce qu'il ne fait pas.
// Le visiteur sort de cette page en sachant exactement à quoi s'attendre.

const PILIERS = [
  {
    titre: "Gratuit, vraiment",
    texte:
      "Publier une annonce ne coûte rien et ne rapporte rien à MANAhome sur votre vente : aucune commission, aucun frais caché, aucun payant déguisé en option.",
  },
  {
    titre: "Aucun acte réglementé",
    texte:
      "MANAhome n'est pas un agent immobilier et n'en fait pas le métier : pas de mandat, pas de négociation, pas de transaction. Vous restez l'unique décisionnaire.",
  },
  {
    titre: "Vos données restent à vous",
    texte:
      "Aucune revente de données ni de leads. Les coordonnées ne sont jamais publiques : les contacts passent par une messagerie interne.",
  },
  {
    titre: "Une annonce structurée",
    texte:
      "Surface, pièces, DPE, localisation, énergétique : chaque fiche est organisée pour être lisible par les humains — et par les outils compatibles IA.",
  },
  {
    titre: "L'honnêteté comme règle",
    texte:
      "Badge obligatoire sur les annonces importées, prix affichés sourcés et datés, état « pilote » assumé : nous préférons un catalogue restreint et vrai.",
  },
  {
    titre: "Le territoire au centre",
    texte:
      "Un logement se choisit aussi pour sa vie autour : transports, services, nature, risques connus — présentés sans enjolivement.",
  },
];

export function Approche() {
  useEffect(() => {
    document.title = "Notre approche — MANAhome";
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, []);

  const B = baseUrl();

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Notre approche</p>
        <h1 className="fiche-titre">
          Un immobilier honnête, structuré, territorial
        </h1>
        <p className="territoire-intro">
          MANAhome est un portail immobilier territorial, en pilote sur Crozon.
          Voici, noir sur blanc, ce que nous faisons — et ce que nous ne ferons
          jamais.
        </p>

        <div className="ia-grid">
          {PILIERS.map((p) => (
            <div key={p.titre} className="ia-bloc">
              <h3>{p.titre}</h3>
              <p>{p.texte}</p>
            </div>
          ))}
        </div>

        <p className="ia-disclaimer">
          MANAhome fait partie de l'écosystème MANA (mana.bzh, mana.love,
          manafrance.org). Pilote Crozon, Finistère.
        </p>

        <div className="est-actions">
          <a className="btn btn-ghost" href={`${B}/annonces/crozon`}>
            Voir les annonces du pilote
          </a>
          <a className="btn btn-primary" href={`${B}/publier`}>
            Publier mon annonce — gratuit
          </a>
        </div>
      </div>
    </main>
  );
}
