// La charte des pages écrites hors React — une seule fois, pour deux générateurs.
//
// ⭐ POURQUOI UN MODULE ET PAS UNE COPIE. `fabriquer-pays.mjs` et
//    `fabriquer-accueil.mjs` produisent des pages qui doivent se ressembler :
//    même fond, même filet, même ombre portée de 3 px. Recopier quarante lignes
//    de CSS dans deux fichiers, c'est garantir qu'elles divergeront à la
//    première retouche — et une divergence de charte ne casse rien, donc
//    personne ne la signale.
//
// ⚠️ Les valeurs viennent du CSS construit de l'application (`site/assets/
//    index-*.css`), relevées le 13/11/2026 : encre #1d1d1f, doux #6e6e73,
//    écume #e3e3e6, rayon 6px, police système. ⛔ Ce ne sont PAS des couleurs
//    choisies ici — si la charte de l'app change, celle-ci doit suivre, et rien
//    ne le dira automatiquement.

export const SITE_DEFAUT = "https://manahome.org";

export const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const nombre = (x, lg) => x.toLocaleString(lg === "fr" ? "fr-FR" : "en-US");

/** Le socle commun : variables, corps, en-tête, titres, encadré, pied. */
export const CSS_SOCLE = `
:root{--ink:#1d1d1f;--doux:#6e6e73;--ecume:#e3e3e6;--rayon:6px;
  --sys:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:16px/1.65 var(--sys);-webkit-font-smoothing:antialiased}
.wrap{max-width:980px;margin:0 auto;padding:0 24px}
header.bar{border-bottom:1px solid var(--ecume);padding:14px 0;font-size:14px}
header.bar a{color:var(--ink);text-decoration:none;font-weight:600}
header.bar .lang{float:right;color:var(--doux);font-weight:400}
h1{font-size:2.1rem;line-height:1.15;margin:40px 0 .3em;letter-spacing:-.02em;text-wrap:balance}
.lead{font-size:1.125rem;max-width:62ch;margin:0 0 6px}
.date{font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;
  text-transform:uppercase;color:var(--doux);margin:0 0 34px}
h2{font-size:1.3rem;margin:44px 0 .2em}
.sous{font-size:14px;color:var(--doux);max-width:62ch;margin:.4em 0 0}
.limites{border:1px solid var(--ink);border-radius:var(--rayon);box-shadow:3px 3px 0 0 var(--ink);
  padding:22px 24px;margin:40px 0 0;background:#fff}
.limites h2{margin-top:0}
.limites ul{margin:0;padding-left:20px}
.limites li{font-size:14px;line-height:1.7;margin:.65em 0}
footer{border-top:1px solid var(--ecume);margin-top:56px;padding:20px 0 48px;font-size:13px;color:var(--doux)}
footer a{color:var(--doux)}
@media(max-width:620px){h1{font-size:1.7rem}}
`;

/** La barre du haut : un retour à gauche, la langue à droite. */
export function entete(lg, site, retour, hrefRetour, hrefAutre) {
  return `<header class="bar"><div class="wrap">
  <a href="${hrefRetour}">${esc(retour)}</a>
  <span class="lang"><a href="${hrefAutre}" hreflang="${lg === "fr" ? "en" : "fr"}">${
    lg === "fr" ? "English" : "Français"}</a></span>
</div></header>`;
}

export function pied(lg, site) {
  return `<footer><div class="wrap">
<a href="${site}/${lg}/">MANAhome</a> ·
<a href="${site}/${lg}/pays">${lg === "fr" ? "Les pays" : "Countries"}</a> ·
<a href="${site}/${lg}/approche">${lg === "fr" ? "La méthode" : "The method"}</a> ·
<a href="${site}/${lg}/mentions-legales">${lg === "fr" ? "Mentions légales" : "Legal notice"}</a> ·
OpenStreetMap, ODbL
</div></footer>`;
}

/** ⭐ Le garde partagé : une page sans texte est le défaut qu'on passe la
 *  soirée à corriger. Il vit ici pour que les deux générateurs l'appliquent
 *  pareil — un seuil recopié finirait par différer. */
export function exigerDuTexte(html, quoi, minimum = 1200) {
  const texte = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim();
  if (texte.length < minimum) {
    console.error(`🔴 ${quoi} : ${texte.length} caractères de texte — c'est une coquille.`);
    process.exit(1);
  }
  return texte.length;
}
