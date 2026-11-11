// Les icônes pixel de mana.love, réemployées dans le header de MANAhome.
// ⭐ Elles sont BLANCHES sur fond transparent. Plutôt que d'en fabriquer une
//    variante par couleur — qui divergerait au premier changement de charte —
//    chaque icône sert de MASQUE : la forme vient du fichier, la couleur vient
//    de `currentColor`, donc du CSS du lien qui la porte. Une seule image,
//    toutes les couleurs, y compris au survol et sur fond sombre.
// ⚠️ Les quatre viennent du jeu « points » de mana.love : maison, écran,
//    étoile, personnage. Deux correspondent exactement à ce que MANAhome
//    nomme (la maison, l'étoile d'action) ; les deux autres sont EMPRUNTÉES
//    faute d'équivalent dessiné. C'est écrit ici pour que personne ne croie
//    plus tard que « compte » désignait vraiment un compte.
import accueil from "./assets/icones/icone-accueil-points-v1.webp";
import ecran from "./assets/icones/icone-radio-repos-points-v2.webp";
import etoile from "./assets/icones/icone-action-points-v3.webp";
import personnage from "./assets/icones/icone-compte-points-v2.webp";

const JEU = {
  maison: accueil,
  grille: ecran,
  etoile: etoile,
  structure: personnage,
} as const;

export type NomIcone = keyof typeof JEU;

export function IconePixel({ nom, taille = 24 }: { nom: NomIcone; taille?: number }) {
  return (
    <span
      className="icone-pixel"
      aria-hidden="true"
      style={{
        width: taille,
        height: taille,
        // La propriété personnalisée porte l'URL ; le masque est en CSS.
        ["--icone" as string]: `url(${JEU[nom]})`,
      }}
    />
  );
}
