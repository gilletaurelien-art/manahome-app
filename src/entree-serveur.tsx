// L'entrée du rendu serveur — le seul module qui connaisse la cale.
//
// ⭐ L'ORDRE DES DEUX PREMIÈRES LIGNES EST LA SEULE CHOSE QUI COMPTE. En ESM, le
//    corps d'un module importé s'exécute avant celui qui l'importe : la cale
//    pose `window` AVANT que `App` — et le routeur qu'il importe — ne cherchent
//    `window.location`. Les intervertir ne produit pas une erreur claire, mais
//    un `window is not defined` au premier rendu.
import { poserLeChemin, aRedirige } from "./cale-serveur";
import { renderToString } from "react-dom/server";
import App from "./App";

/**
 * Rend une route en HTML. `chemin` est l'URL COMPLÈTE côté site (« /fr/approche »),
 * pas le chemin nu : c'est elle que le routeur lit pour déduire la langue.
 *
 * ⚠️ Ce qu'on obtient est le PREMIER rendu, sans aucun `useEffect`. Les blocs
 *    qui attendent une donnée distante sortent dans leur état d'attente — c'est
 *    exact, et c'est ce qu'un robot doit lire : ce que la page AFFIRME avant
 *    d'avoir interrogé qui que ce soit.
 *
 * ⭐ Rend `null` quand la route REDIRIGE (services, pros, estimation,
 *    espace-pro) : ces pages n'ont pas de contenu, elles ont une destination.
 *    Leur coquille doit rester vide — c'est le JS qui expédie, et la canonique
 *    pointe déjà ailleurs. Prérendre le contenu d'une page qui s'en va serait
 *    montrer aux machines ce qu'un humain ne voit jamais.
 *
 * 🔴 ET CE RETOUR `null` A MANQUÉ UNE FOIS, SANS BRUIT. Un remplacement
 *    automatique — le seul de la session écrit sans vérifier qu'il avait trouvé
 *    son motif — n'a pas appliqué cette fonction. `aRedirige` restait importé
 *    mais jamais appelé : l'élagage du bundle l'a donc retiré, avec le drapeau
 *    qu'il lisait. Les quatre redirections se prérendaient en 941 caractères de
 *    chrome vide, et rien ne le signalait. ⭐ Un import inutilisé ne casse pas —
 *    il disparaît.
 */
export function rendre(chemin: string): string | null {
  poserLeChemin(chemin);
  const html = renderToString(<App />);
  return aRedirige() ? null : html;
}
