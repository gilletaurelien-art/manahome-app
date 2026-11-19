#!/usr/bin/env node
// Pilote « où dormir en Finistère » — la logique pure du générateur de pages.
//
//     scripts/fabriquer-hebergement-29.mjs   lance tout (fetch live ou --fixture)
//     scripts/hebergement-29.test.mjs        teste CE module
//
// PÉRIMÈTRE — une seule population, pas deux. `ressources` mêle ~19,7 M de
// lieux et ~2 M d'associations ; le siège déclaré d'une association est souvent
// un domicile (945 262 lignes masquées par adresse_est_un_domicile()). Le
// pilote ne travaille QUE sur l'hébergement touristique pro du Finistère :
//   • famille « hebergement » (mots posés par la migration ou_dormir) ;
//   • éditeur OpenStreetMap écarté (publisher « © les contributeurs
//     OpenStreetMap ») — le pilote porte sur la moisson DATAtourisme ;
//   • source « association » écartée côté client, par double défense ;
//   • code postal 29xxx lu dans l'adresse, sinon position dans l'enveloppe
//     du département.
//
// ⚠️ LES PAGES CREUSES SONT PÉNALISÉES : une page par fiche N'EST PAS une
//    page par ligne de base. `aDuContenuReel()` écarte toute fiche qui n'a
//    presque rien à dire (pas d'adresse, ni téléphone, ni site, ni horaires,
//    ni objet) — on ne publie pas une coquille plutôt que de la publier vide.
//
// PAGINATION — chercher_le_pays rend au plus 100 lignes par appel (p_limit
// plafonné à 100) et un OFFSET plafonné à 900 : 1 000 lignes max par requête.
// Le département est donc parcouru par tuiles (p_bbox), et une tuile qui
// atteint le plafond est subdivisée en quatre, jusqu'à une taille minimale.

export const DEPARTEMENT = "29";
export const RPC_URL =
  process.env.MANAHOME_RPC_URL ?? "https://db.temposystem.fr/rest/v1/rpc/chercher_le_pays";
export const CLE_ANON_PUBLIQUE =
  process.env.MANAHOME_CLE_ANON ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg0NzUzODA3LCJleHAiOjE5NDI0MzM4MDd9.vn2mcmhK6396qYlhDAC7_bBbKIHs8jPyUxww0ZYbHCo";
export const FAMILLE = "hebergement";
// Enveloppe du Finistère : minLng, minLat, maxLng, maxLat (ordre ST_MakeEnvelope).
export const BBOX_29 = [-5.3, 47.6, -3.2, 49.0];
export const TAILLE_TUILE = 0.15;
export const TAILLE_MIN_TUILE = 0.02;
export const LIMITE_PAGE = 100; // plafond serveur de p_limit
export const OFFSET_MAX = 900; // plafond serveur de p_depuis
export const PLAFOND_TUILE = LIMITE_PAGE * (OFFSET_MAX / LIMITE_PAGE + 1); // 1000 lignes atteignables
export const SEUIL_TEXTE = 400; // garde anti-coquille : texte servi minimum
export const PREFIXE_ROUTE = "hebergement-29";

const PUBLISHER_OSM = "openstreetmap";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function slugify(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function slugPour(r) {
  const base = slugify(r.titre) || "fiche";
  return `${base}-${String(r.id ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`;
}

export function urlFiche(r, site) {
  return `${site}/fr/${PREFIXE_ROUTE}/${slugPour(r)}`;
}

/** Premier code postal trouvé dans l'adresse (l'adresse publiée inclut « 29160 Crozon »). */
export function codePostalDe(r) {
  return String(r.adresse ?? "").match(/\b([0-9]{5})\b/)?.[1] ?? null;
}

export function dansBbox(lng, lat, bbox = BBOX_29) {
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    lng >= bbox[0] && lat >= bbox[1] && lng <= bbox[2] && lat <= bbox[3]
  );
}

export function estOSM(r) {
  return String(r.publisher ?? "").toLowerCase().includes(PUBLISHER_OSM);
}

/** Le filtre de périmètre : DATAtourisme (pas OSM), jamais une association, en 29. */
export function estDansLePerimetre(r) {
  if (!r || !r.titre || !r.id) return false;
  if (r.source === "association") return false;
  if (estOSM(r)) return false;
  const cp = codePostalDe(r);
  if (cp) return cp.startsWith(DEPARTEMENT);
  return dansBbox(r.lng, r.lat);
}

/**
 * La règle anti-pages-creuses : une fiche publiable a un nom, une commune, et
 * AU MOINS un contenu réel (adresse, téléphone, site, horaires ou objet).
 */
export function aDuContenuReel(r) {
  if (!r || !r.commune) return false;
  return Boolean(r.adresse || r.telephone || r.site || r.horaires || r.objet);
}

const TYPES = {
  Hotel: "Hôtel", HotelTrade: "Hôtel", HotelRestaurant: "Hôtel-restaurant",
  Camping: "Camping", CampingAndCaravanning: "Camping", CamperVanArea: "Aire de camping-car",
  BedAndBreakfast: "Chambre d'hôtes", Guesthouse: "Maison d'hôtes",
  RentalAccommodation: "Meublé de tourisme", CollectiveAccommodation: "Hébergement collectif",
  GroupLodging: "Gîte de groupe", HolidayResort: "Village vacances",
  Accommodation: "Hébergement", LodgingBusiness: "Hébergement",
};

export function libelleType(r) {
  const c = (r.categories ?? [])[0];
  if (!c) return "Hébergement touristique";
  return TYPES[c] ?? c;
}

export function texteSansBalises(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CSS_PAGE = `
:root{--ink:#1d1d1f;--doux:#6e6e73;--ecume:#e3e3e6;--rayon:6px;--sys:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:16px/1.65 var(--sys);-webkit-font-smoothing:antialiased}
.wrap{max-width:760px;margin:0 auto;padding:0 24px}
header.bar{border-bottom:1px solid var(--ecume);padding:14px 0;font-size:14px}
header.bar a{color:var(--ink);text-decoration:none;font-weight:600}
h1{font-size:1.9rem;line-height:1.2;margin:36px 0 .3em;letter-spacing:-.02em}
.lead{font-size:1.1rem;max-width:62ch;margin:0 0 6px}
.date{font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--doux);margin:0 0 26px}
dl.infos{margin:0 0 8px}
dl.infos div{display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--ecume)}
dl.infos dt{flex:0 0 110px;font:500 11px/1.8 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--doux)}
dl.infos dd{margin:0}
.etiquettes{margin:14px 0 0}
.etiquette{display:inline-block;border:1px solid var(--ecume);border-radius:999px;padding:2px 10px;font-size:13px;color:var(--doux);margin:0 6px 6px 0}
section.contact{border:1px solid var(--ink);border-radius:var(--rayon);box-shadow:3px 3px 0 0 var(--ink);padding:20px 22px;margin:34px 0 0;background:#fff}
section.contact h2{margin:0 0 4px;font-size:1.15rem}
section.contact p{font-size:14px;color:var(--doux);margin:.2em 0 14px}
form.relais label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px}
form.relais input,form.relais textarea{width:100%;font:15px/1.5 var(--sys);padding:8px 10px;border:1px solid var(--ecume);border-radius:6px;background:#fff;color:var(--ink)}
form.relais button{margin-top:14px;font:600 15px var(--sys);padding:10px 18px;border:1px solid var(--ink);border-radius:6px;background:var(--ink);color:#fff;cursor:pointer}
form.relais button:disabled{opacity:.5;cursor:default}
.relais-statut{font-size:14px;margin:12px 0 0}
.piege-robot{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.limites{border-top:1px solid var(--ecume);margin-top:40px;padding-top:8px}
.limites h2{font-size:1.05rem;margin:18px 0 6px}
.limites li{font-size:14px;line-height:1.7;margin:.5em 0;color:var(--ink)}
.limites ul{margin:0;padding-left:20px}
footer{border-top:1px solid var(--ecume);margin-top:44px;padding:20px 0 48px;font-size:13px;color:var(--doux)}
footer a{color:var(--doux)}
@media(max-width:620px){h1{font-size:1.5rem}}
`;

function formulaireRelais(r, url, base) {
  if (!r.entite_id) return "";
  return `
<section class="contact">
<h2>Contacter ${esc(r.titre)}</h2>
<p>Votre message part de MANAhome : ni votre adresse, ni celle de la structure n'est publiée. La structure vous répond directement par courriel.</p>
<form class="relais" data-relais data-entite-id="${esc(r.entite_id)}" data-titre="${esc(r.titre)}" data-lien="${esc(url)}">
  <label for="f-nom">Votre nom</label>
  <input id="f-nom" name="nom" type="text" required maxlength="120" autocomplete="name">
  <label for="f-expediteur">Votre courriel</label>
  <input id="f-expediteur" name="expediteur" type="email" required autocomplete="email" placeholder="vous@exemple.fr">
  <label for="f-message">Votre message</label>
  <textarea id="f-message" name="message" rows="5" required minlength="20" maxlength="4000" placeholder="Bonjour, je cherche à dormir à ${esc(r.commune)}…"></textarea>
  <div class="piege-robot" aria-hidden="true">
    <label for="f-botcheck">Ne pas remplir ce champ</label>
    <input id="f-botcheck" name="botcheck" type="text" tabindex="-1" autocomplete="off">
  </div>
  <button type="submit">Envoyer le message</button>
  <p class="relais-statut" role="status"></p>
</form>
<noscript><p>Activez JavaScript : le formulaire passe par le relais de MANAhome, qui ne publie aucune adresse de courriel.</p></noscript>
</section>
<script type="module" src="${base}assets/relais-contact.js"></script>`;
}

/** La page d'une fiche : son texte dans le HTML, lisible sans JavaScript. */
export function pageFiche(r, { site, base = "/", date }) {
  const slug = slugPour(r);
  const url = urlFiche(r, site);
  const type = libelleType(r);
  const cp = codePostalDe(r);
  const titre = `${r.titre} — hébergement à ${r.commune}, Finistère`;
  const desc =
    `Où dormir à ${r.commune} (Finistère) ? ${r.titre}, ${type.toLowerCase()} à ${r.commune}.` +
    (r.adresse ? ` Adresse : ${r.adresse}.` : "") +
    (r.site ? ` Site : ${r.site}.` : "") +
    ` Source DATAtourisme, relev du ${date}.`;

  const lignes = [];
  if (r.adresse) lignes.push(`<div><dt>Adresse</dt><dd>${esc(r.adresse)}</dd></div>`);
  if (r.horaires) lignes.push(`<div><dt>Horaires</dt><dd>${esc(r.horaires)}</dd></div>`);
  if (r.telephone) lignes.push(`<div><dt>Téléphone</dt><dd><a href="tel:${esc(r.telephone.replace(/[^+0-9]/g, ""))}">${esc(r.telephone)}</a></dd></div>`);
  if (r.site) lignes.push(`<div><dt>Site</dt><dd><a href="${esc(r.site)}" rel="noopener nofollow">${esc(r.site)}</a></dd></div>`);

  const etiquettes = (r.categories ?? [])
    .map((c) => `<span class="etiquette">${esc(TYPES[c] ?? c)}</span>`)
    .join("");

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: r.titre,
    description: r.objet ?? undefined,
    url,
    inLanguage: "fr",
    address: r.adresse
      ? { "@type": "PostalAddress", streetAddress: r.adresse, addressLocality: r.commune, postalCode: cp ?? undefined, addressCountry: "FR" }
      : undefined,
    telephone: r.telephone ?? undefined,
    // ⚠️ Aucun prix, aucune disponibilité, aucun avis : ce relevé dit ce qui
    //    existe et où, pas ce que ça vaut ni si c'est ouvert.
  };
  if (r.site) jsonld.sameAs = [r.site];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titre)} — MANAhome</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fr" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<script type="application/ld+json">
${JSON.stringify(jsonld)}
</script>
<style>${CSS_PAGE}</style>
</head>
<body>
<header class="bar"><div class="wrap">
  <a href="${site}/fr/${PREFIXE_ROUTE}">← Où dormir en Finistère</a>
</div></header>

<main class="wrap">
<h1>${esc(r.titre)}</h1>
<p class="lead">${esc(type)} à <strong>${esc(r.commune)}</strong>, Finistère — cette page répond à « où dormir à ${esc(r.commune)} ? », et se lit sans JavaScript.</p>
<p class="date">Source DATAtourisme · éditeur ${esc(r.publisher ?? "DATAtourisme")} · relev du ${date}</p>

${lignes.length ? `<dl class="infos">${lignes.join("")}</dl>` : ""}
${etiquettes ? `<p class="etiquettes">${etiquettes}</p>` : ""}
${r.objet ? `<p>${esc(r.objet)}</p>` : ""}

${formulaireRelais(r, url, base)}

<div class="limites">
<h2>Ce que cette page ne dit pas</h2>
<ul>
<li><strong>Aucun prix, aucune disponibilité, aucun avis.</strong> La page dit ce qui existe et où.</li>
<li><strong>Aucune adresse de courriel publiée.</strong> Le bouton « Contacter » passe par le relais de MANAhome : la structure reçoit votre message sans que son adresse soit rendue publique.</li>
</ul>
</div>
</main>

<footer><div class="wrap">
<a href="${site}/fr/">MANAhome</a> ·
<a href="${site}/fr/mentions-legales">Mentions légales</a> ·
Données <a href="https://www.datatourisme.fr" rel="noopener nofollow">DATAtourisme</a>, licence Ouverte 2.0 — attribution : ${esc(r.publisher ?? "DATAtourisme")}
</div></footer>
</body>
</html>
`;
}

/** La page d'index du périmètre : aucune page ne doit rester orpheline. */
export function pageIndex(fiches, { site, date, stats }) {
  const url = `${site}/fr/${PREFIXE_ROUTE}`;
  const editeurs = [...new Set(fiches.map((f) => f.publisher).filter(Boolean))];
  const parCommune = new Map();
  for (const f of fiches) {
    const c = f.commune ?? "Commune inconnue";
    if (!parCommune.has(c)) parCommune.set(c, []);
    parCommune.get(c).push(f);
  }
  const communes = [...parCommune.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  const blocs = communes
    .map(([commune, liste]) => {
      const items = liste
        .map((f) => `<li><a href="${urlFiche(f, site)}">${esc(f.titre)}</a> <span class="n">${esc(libelleType(f))}</span></li>`)
        .join("");
      return `<h2>${esc(commune)} <span class="n">(${liste.length})</span></h2><ul class="fiches">${items}</ul>`;
    })
    .join("\n");

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Où dormir en Finistère — hébergements",
    description: `${fiches.length} hébergements touristiques en Finistère (29), issus de DATAtourisme, relev du ${date}.`,
    url,
    inLanguage: "fr",
    isPartOf: { "@type": "WebSite", name: "MANAhome", url: `${site}/` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: fiches.length,
      itemListElement: fiches.map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: f.titre,
        url: urlFiche(f, site),
      })),
    },
  };

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Où dormir en Finistère (29) — ${fiches.length} hébergements — MANAhome</title>
<meta name="description" content="${fiches.length} hébergements touristiques en Finistère, issus de DATAtourisme : où dormir à Crozon, Quimper, Brest… Relev du ${date}.">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fr" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:title" content="Où dormir en Finistère (29) — MANAhome">
<meta property="og:description" content="${fiches.length} hébergements touristiques en Finistère, issus de DATAtourisme. Relev du ${date}.">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<script type="application/ld+json">
${JSON.stringify(jsonld)}
</script>
<style>${CSS_PAGE}
ul.fiches{list-style:none;margin:0 0 26px;padding:0}
ul.fiches li{padding:6px 0;border-bottom:1px solid var(--ecume);font-size:15px}
ul.fiches a{color:var(--ink);text-decoration:none}
ul.fiches a:hover{text-decoration:underline}
ul.fiches .n{color:var(--doux);font-size:13px}
h2{font-size:1.15rem;margin:30px 0 6px}
</style>
</head>
<body>
<header class="bar"><div class="wrap">
  <a href="${site}/fr/">← MANAhome</a>
</div></header>

<main class="wrap">
<h1>Où dormir en Finistère (29)</h1>
<p class="lead"><strong>${fiches.length}</strong> hébergements touristiques publiés, venus de la moisson
<strong>DATAtourisme</strong> (${editeurs.length} éditeurs). Une page par fiche, avec son adresse,
ses horaires, son site — et un bouton pour écrire sans publier aucune adresse de courriel.</p>
<p class="date">Relev du ${date} · source DATAtourisme, licence Ouverte 2.0${stats ? ` · ${stats.brutes} fiches lues, ${stats.creuses} écartées (trop peu à dire)` : ""}</p>

${blocs}

<div class="limites">
<h2>Ce que ce relevé ne dit pas</h2>
<ul>
<li><strong>Aucun prix, aucune disponibilité, aucun avis, aucun classement.</strong> On ne vend aucune mise en avant : figurer ici est gratuit.</li>
<li><strong>Aucune adresse de courriel.</strong> Le contact passe par le relais de MANAhome, qui la résout côté serveur et la garde hors du site.</li>
<li><strong>Les logements de particuliers ne figurent pas ici.</strong> Un domicile n'est pas un établissement ; seules les fiches professionnelles du tourisme sont publiées.</li>
</ul>
</div>
</main>

<footer><div class="wrap">
<a href="${site}/fr/">MANAhome</a> ·
<a href="${site}/fr/mentions-legales">Mentions légales</a> ·
Données <a href="https://www.datatourisme.fr" rel="noopener nofollow">DATAtourisme</a>, licence Ouverte 2.0
</div></footer>
</body>
</html>
`;
}

/** Les tuiles de parcours de l'enveloppe, [minLng, minLat, maxLng, maxLat]. */
export function tuiles(bbox = BBOX_29, taille = TAILLE_TUILE) {
  const out = [];
  for (let lng = bbox[0]; lng < bbox[2]; lng += taille) {
    for (let lat = bbox[1]; lat < bbox[3]; lat += taille) {
      out.push([lng, lat, Math.min(lng + taille, bbox[2]), Math.min(lat + taille, bbox[3])]);
    }
  }
  return out;
}

async function appelerRpc(fetchImpl, { p_bbox, p_depuis }) {
  const r = await fetchImpl(RPC_URL, {
    method: "POST",
    headers: {
      apikey: CLE_ANON_PUBLIQUE,
      Authorization: `Bearer ${CLE_ANON_PUBLIQUE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      p_texte: "",
      p_famille: FAMILLE,
      p_bbox,
      p_limit: LIMITE_PAGE,
      p_depuis,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) {
    throw new Error(`chercher_le_pays a répondu ${r.status} (tuile ${p_bbox.join(",")}, depuis ${p_depuis})`);
  }
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}

/**
 * Parcourt tout le périmètre par tuiles, avec pagination (p_depuis) et
 * subdivision des tuiles qui atteignent le plafond de 1 000 lignes.
 * `fetchImpl` est injecté : les tests le remplacent par un faux.
 */
export async function chargerPerimetre({ fetchImpl = globalThis.fetch, bbox = BBOX_29, taille = TAILLE_TUILE } = {}) {
  const vus = new Map();
  const file = tuiles(bbox, taille);
  const stats = { requetes: 0, tuiles: 0, subdivisions: 0, brutes: 0 };
  while (file.length) {
    const tuile = file.shift();
    stats.tuiles++;
    let depuis = 0;
    let dernierePleine = false;
    let total = null;
    while (depuis <= OFFSET_MAX) {
      const lignes = await appelerRpc(fetchImpl, { p_bbox: tuile, p_depuis: depuis });
      stats.requetes++;
      if (!lignes.length) break;
      total = lignes[0]?.total_trouve ?? lignes.length;
      for (const l of lignes) if (!vus.has(l.id)) vus.set(l.id, l);
      dernierePleine = lignes.length >= LIMITE_PAGE;
      if (!dernierePleine) break;
      depuis += LIMITE_PAGE;
    }
    // ⚠️ Une tuile pleine jusqu'au plafond serveur (1 000 lignes) est
    //    incomplète : on la subdivise plutôt que de perdre des fiches.
    if (dernierePleine && depuis > OFFSET_MAX && (total ?? 0) > PLAFOND_TUILE && tuile[2] - tuile[0] > TAILLE_MIN_TUILE) {
      stats.subdivisions++;
      const [a, b, c, d] = tuile;
      const mx = (a + c) / 2;
      const my = (b + d) / 2;
      file.push([a, b, mx, my], [mx, b, c, my], [a, my, mx, d], [mx, my, c, d]);
    }
  }
  stats.brutes = vus.size;
  const retenues = [...vus.values()].filter(estDansLePerimetre);
  return { rows: retenues, stats };
}

/** Les entrées du plan de site pour le périmètre (idempotent). */
export function lignesSitemap(fiches, site, date) {
  const entetes = [`  <url><loc>${site}/fr/${PREFIXE_ROUTE}</loc><lastmod>${date}</lastmod><priority>0.8</priority></url>`];
  for (const f of fiches) {
    entetes.push(
      `  <url><loc>${urlFiche(f, site)}</loc><lastmod>${date}</lastmod><priority>0.6</priority></url>`,
    );
  }
  return entetes;
}

/** Insère les entrées dans le sitemap en retirant d'abord les anciennes (rejouable). */
export function patchSitemap(xml, lignes) {
  const nettoye = xml
    .split("\n")
    // Sans le slash final : la ligne d'index finit par /hebergement-29</loc>.
    .filter((l) => !l.includes(`/${PREFIXE_ROUTE}`))
    .join("\n");
  if (!nettoye.includes("</urlset>")) throw new Error("sitemap : </urlset> introuvable");
  return nettoye.replace("</urlset>", lignes.join("\n") + "\n</urlset>");
}
