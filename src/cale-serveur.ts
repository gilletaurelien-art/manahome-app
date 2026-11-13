// La cale du rendu serveur — à importer AVANT tout le reste.
//
// 🔴 POURQUOI UNE CALE PLUTÔT QU'UNE RÉÉCRITURE. Le routeur maison lit
//    `window.location.pathname` AU RENDU (`usePath`, `langueCourante`), et une
//    vingtaine de modules touchent à `window`, `document` ou `localStorage`.
//    Les rendre tous « isomorphes » serait une refonte, pour un bénéfice que
//    cette cale donne en trente lignes.
//
// ⚠️ ELLE NE SIMULE PAS UN NAVIGATEUR, ET C'EST VOULU. `renderToString`
//    n'exécute PAS les `useEffect` : rien de ce qui charge des données ne part.
//    La cale ne sert qu'au PREMIER rendu — celui qui produit le HTML que les
//    robots liront. Tout ce qui arrive après est l'affaire du navigateur.
//
// ⛔ NE JAMAIS L'IMPORTER DANS LE BUNDLE CLIENT. Elle écrase `window.location`
//    par un objet mort ; dans un navigateur, elle casserait la navigation.
//    Seul `src/entree-serveur.tsx` l'importe, et lui seul part au build SSR.
//
// ⭐ L'ORDRE D'IMPORT EST LA SEULE CHOSE QUI LA FAIT MARCHER : en ESM, le corps
//    d'un module importé s'exécute avant celui qui l'importe. `entree-serveur`
//    fait donc `import "./cale-serveur"` AVANT `import App`. Déplacer cette
//    ligne d'un cran la rend inopérante, sans erreur.

type Faux = Record<string, unknown>;

const g = globalThis as unknown as Faux;

/** Vrai si le rendu qui vient de se faire a tenté de naviguer. */
let aNavigue = false;
export function aRedirige(): boolean { return aNavigue; }

/** Le chemin que le prochain rendu doit croire. */
export function poserLeChemin(chemin: string): void {
  aNavigue = false;
  (g.window as Faux).location = {
    pathname: chemin, search: "", hash: "", href: "https://manahome.org" + chemin,
    origin: "https://manahome.org", protocol: "https:", host: "manahome.org",
    // ⭐ UNE NAVIGATION AU RENDU N'EST PAS UNE ERREUR : c'est la SIGNATURE d'une
    //    page de redirection. `REDIRIGEES` (canonique.ts) en compte quatre —
    //    services, pros, estimation, espace-pro — et App.tsx les expédie par
    //    `location.replace`. Elles n'ont aucun contenu à prérendre, et leur
    //    coquille doit rester une coquille : c'est le JS qui redirige, et la
    //    canonique pointe déjà sur la destination.
    //    ⛔ La première version LEVAIT ici, et le prérendu s'arrêtait net sur
    //    /en/espace-pro. Le commentaire disait « erreur de conception » — il
    //    avait tort : la page faisait exactement son travail. On NOTE au lieu
    //    de lever, et l'appelant décide.
    replace: () => { aNavigue = true; },
    assign: () => { aNavigue = true; },
  };
}

if (!g.window) {
  const stockage = {
    getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {},
    key: () => null, length: 0,
  };
  g.window = {
    localStorage: stockage, sessionStorage: stockage,
    addEventListener: () => {}, removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    scrollTo: () => {}, requestAnimationFrame: () => 0,
    navigator: { language: "fr", userAgent: "manahome-prerender" },
  };
  g.localStorage = stockage;
  g.sessionStorage = stockage;
  g.navigator = (g.window as Faux).navigator;
  // ⚠️ `document` reste MINIMAL à dessein. Un composant qui en a vraiment besoin
  //    au rendu doit échouer bruyamment ici plutôt que de rendre du vide en
  //    silence — c'est exactement le défaut qu'on est en train de corriger.
  g.document = {
    title: "", documentElement: { lang: "fr", style: {} },
    createElement: () => ({ setAttribute: () => {}, style: {} }),
    querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null,
    head: { appendChild: () => {} }, body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
    addEventListener: () => {}, removeEventListener: () => {},
  };
  poserLeChemin("/fr/");
}
