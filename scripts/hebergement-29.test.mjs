import { describe, it, expect } from "vitest";
import {
  estDansLePerimetre,
  estOSM,
  codePostalDe,
  aDuContenuReel,
  slugPour,
  slugify,
  urlFiche,
  pageFiche,
  pageIndex,
  texteSansBalises,
  SEUIL_TEXTE,
  PREFIXE_ROUTE,
  BBOX_29,
  TAILLE_TUILE,
  tuiles,
  chargerPerimetre,
  lignesSitemap,
  patchSitemap,
} from "./hebergement-29.mjs";
import { construireCorpsRelais } from "../public/assets/relais-contact.js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const SITE = "https://manahome.org";
const DATE = "2026-11-19";

const base = (o = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
  source: "lieu",
  titre: "Hôtel de la Baie",
  texte: "Crozon · CRT Bretagne",
  objet: null,
  source_url: "https://www.datatourisme.fr/",
  publisher: "Comité régional du tourisme de Bretagne",
  commune: "Crozon",
  adresse: "12 quai du Port, 29160 Crozon",
  lng: -4.4879,
  lat: 48.2459,
  a_une_adresse: true,
  categories: ["Hotel"],
  telephone: "02 98 27 11 22",
  courriel: null,
  site: "https://www.exemple-hotel-crozon.fr",
  horaires: "Accueil 24h/24",
  rna: null,
  entite_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  total_trouve: 1,
  ...o,
});

describe("le périmètre ne prend que l'hébergement pro du Finistère", () => {
  it("garde une fiche DATAtourisme du 29 (code postal lu dans l'adresse)", () => {
    expect(codePostalDe(base())).toBe("29160");
    expect(estDansLePerimetre(base())).toBe(true);
  });

  it("écarte OpenStreetMap par son éditeur", () => {
    const r = base({ publisher: "© les contributeurs OpenStreetMap" });
    expect(estOSM(r)).toBe(true);
    expect(estDansLePerimetre(r)).toBe(false);
  });

  it("écarte une association, même avec un code postal 29", () => {
    expect(estDansLePerimetre(base({ source: "association", rna: "W291234567", adresse: null, a_une_adresse: false }))).toBe(false);
  });

  it("écarte un autre département (56100 Lorient)", () => {
    expect(estDansLePerimetre(base({ adresse: "5 cours de la Bôbre, 56100 Lorient", commune: "Lorient", lng: -3.37, lat: 47.75 }))).toBe(false);
  });

  it("garde une fiche sans adresse si sa position tombe dans l'enveloppe du 29", () => {
    expect(estDansLePerimetre(base({ adresse: null, a_une_adresse: false }))).toBe(true);
  });

  it("écarte une fiche sans adresse hors enveloppe", () => {
    expect(estDansLePerimetre(base({ adresse: null, lng: -2.0, lat: 48.6 }))).toBe(false);
  });
});

describe("la règle anti-pages-creuses", () => {
  it("une fiche avec un seul contenu réel est publiable", () => {
    expect(aDuContenuReel(base({ telephone: null, site: null, horaires: null }))).toBe(true); // adresse seule
  });
  it("une fiche sans rien à dire est écartée", () => {
    expect(aDuContenuReel(base({ adresse: null, a_une_adresse: false, telephone: null, site: null, horaires: null, objet: null }))).toBe(false);
  });
  it("une fiche sans commune est écartée", () => {
    expect(aDuContenuReel(base({ commune: null }))).toBe(false);
  });
});

describe("les slugs", () => {
  it("sont en [a-z0-9-], sans accent, et portent l'id tronqué", () => {
    const s = slugPour(base({ titre: "Chambres d'hôtes Korrigans", id: "44444444-4444-4444-8444-444444444444" }));
    expect(s).toBe("chambres-d-hotes-korrigans-44444444");
    expect(s).toMatch(/^[a-z0-9-]+$/);
  });
  it("ne sont jamais vides", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugPour(base({ titre: "!!!" }))).toMatch(/^fiche-[a-z0-9]+$/);
  });
});

describe("la page d'une fiche", () => {
  const r = base();
  const html = pageFiche(r, { site: SITE, base: "/", date: DATE });

  it("porte sa canonique, son titre, son JSON-LD", () => {
    expect(html).toContain(`<link rel="canonical" href="${SITE}/fr/${PREFIXE_ROUTE}/${slugPour(r)}">`);
    expect(html).toContain(`<title>${r.titre} — hébergement à Crozon, Finistère — MANAhome</title>`);
    expect(html).toContain('"@type":"LodgingBusiness"');
    expect(html).toContain('"name":"Hôtel de la Baie"');
  });

  it("porte son contenu réel dans le HTML (lisible sans JavaScript)", () => {
    expect(html).toContain("12 quai du Port, 29160 Crozon");
    expect(html).toContain("02 98 27 11 22");
    expect(html).toContain("Accueil 24h/24");
    expect(texteSansBalises(html).length).toBeGreaterThan(SEUIL_TEXTE);
  });

  it("ne publie JAMAIS l'adresse de courriel de la fiche", () => {
    const avecCourriel = pageFiche(base({ courriel: "secret@structure.fr" }), { site: SITE, base: "/", date: DATE });
    expect(avecCourriel).not.toContain("secret@structure.fr");
  });

  it("porte le formulaire de relais avec l'entite_id, et le piège à robots", () => {
    expect(html).toContain('data-relais data-entite-id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"');
    expect(html).toContain('name="botcheck"');
    expect(html).toContain("piege-robot");
    // Le piège est masqué en CSS, jamais display:none (un lecteur d'écran ne
    // doit ni le voir ni le remplir — aria-hidden pose la seconde moitié).
    expect(html).toMatch(/\.piege-robot\{[^}]*overflow:hidden/);
    expect(html).not.toMatch(/\.piege-robot\{[^}]*display:\s*none/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('src="/assets/relais-contact.js"');
  });

  it("n'a pas de formulaire sans entite_id", () => {
    const sans = pageFiche(base({ entite_id: null }), { site: SITE, base: "/", date: DATE });
    expect(sans).not.toContain("data-relais");
  });

  it("ne déclare aucun prix ni aucune disponibilité", () => {
    expect(html).not.toContain('"price"');
    expect(html).not.toContain("availability");
    expect(html).toContain("Aucun prix, aucune disponibilité");
  });
});

describe("le corps du relais (bouton Contacter)", () => {
  it("a exactement les sept champs attendus — jamais de destinataire", () => {
    const corps = JSON.parse(
      construireCorpsRelais({
        entiteId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        nom: "Marie",
        expediteur: "Marie@Exemple.fr",
        message: "Bonjour, avez-vous une chambre le 12 juillet ?",
        titre: "Hôtel de la Baie",
        lien: "https://manahome.org/fr/hebergement-29/x",
        botcheck: "",
      }),
    );
    expect(Object.keys(corps).sort()).toEqual(
      ["botcheck", "entite_id", "expediteur", "lien", "message", "nom", "titre"].sort(),
    );
    expect(corps.entite_id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(corps.expediteur).toBe("marie@exemple.fr");
    expect(corps.botcheck).toBe("");
    expect(corps).not.toHaveProperty("destinataire");
  });

  it("refuse de construire un corps sans entite_id", () => {
    expect(() => construireCorpsRelais({ entiteId: "", nom: "x", expediteur: "x@y.fr", message: "m" })).toThrow();
  });
});

describe("la page d'index", () => {
  const fiches = [base(), base({ id: "22222222-2222-4222-8222-222222222222", titre: "Gîte Ty An Ero", commune: "Crozon", categories: ["RentalAccommodation"] })];
  const html = pageIndex(fiches, { site: SITE, date: DATE, stats: { brutes: 9, creuses: 1 } });
  it("liste chaque fiche avec son lien", () => {
    for (const f of fiches) expect(html).toContain(urlFiche(f, SITE));
    expect(html).toContain("2 hébergements");
    expect(html).toContain("DATAtourisme");
  });
});

describe("le parcours de la RPC (tuiles + pagination)", () => {
  it("déduplique par id entre tuiles et s'arrête quand la page n'est pas pleine", async () => {
    const requetes = [];
    const fake = async (_url, opts) => {
      const { p_bbox, p_depuis } = JSON.parse(opts.body);
      requetes.push([p_bbox, p_depuis]);
      // Une même fiche servie par deux tuiles voisines (chevauchement) :
      const ligne = { ...base(), id: "99999999-9999-4999-8999-999999999999", adresse: "1 port, 29160 Crozon" };
      if (p_bbox[0] <= -4.4 && -4.4 <= p_bbox[2] && p_bbox[1] <= 48.2 && 48.2 <= p_bbox[3]) {
        return { ok: true, json: async () => (p_depuis === 0 ? [ligne, { ...ligne, id: "88888888-8888-4888-8888-888888888888", titre: "Second" }] : []) };
      }
      return { ok: true, json: async () => [] };
    };
    const { rows, stats } = await chargerPerimetre({ fetchImpl: fake, bbox: [-4.6, 48.1, -4.3, 48.3], taille: 0.15 });
    expect(rows.map((r) => r.id).sort()).toEqual(["88888888-8888-4888-8888-888888888888", "99999999-9999-4999-8999-999999999999"]);
    // Chaque tuile répond en UNE requête (2 lignes < 100 → dernière page).
    expect(stats.requetes).toBe(stats.tuiles);
  });

  it("subdivise une tuile qui atteint le plafond de 1 000 lignes", async () => {
    let requetes = 0;
    const fake = async (_url, opts) => {
      const { p_bbox, p_depuis } = JSON.parse(opts.body);
      requetes++;
      // Seule la grosse tuile déborde ; ses sous-tuiles répondent vide.
      // (seuil à 0.25 : la largeur réelle est 0.2999… en virgule flottante)
      if (p_bbox[2] - p_bbox[0] <= 0.25) return { ok: true, json: async () => [] };
      const lignes = Array.from({ length: 100 }, (_, i) => ({
        ...base(),
        id: `00000000-0000-4000-8000-${String(p_depuis * 100 + i).padStart(12, "0")}`,
        adresse: "1 port, 29160 Crozon",
        total_trouve: 5000,
      }));
      return { ok: true, json: async () => lignes };
    };
    const { stats } = await chargerPerimetre({ fetchImpl: fake, bbox: [-4.6, 48.1, -4.3, 48.3], taille: 0.3 });
    // 10 requêtes sur la tuile pleine (offset 0…900), puis 4 sous-tuiles vides.
    expect(stats.subdivisions).toBe(1);
    expect(stats.requetes).toBe(10 + 4);
    expect(requetes).toBe(stats.requetes);
  });

  it("propage une erreur HTTP au lieu d'écrire des pages vides", async () => {
    const fake = async () => ({ ok: false, status: 503 });
    await expect(chargerPerimetre({ fetchImpl: fake, bbox: [-4.6, 48.1, -4.3, 48.3], taille: 0.3 })).rejects.toThrow("503");
  });
});

describe("le plan de site", () => {
  it("ajoute l'index et une URL par fiche, de façon idempotente", () => {
    const xml = `<?xml version="1.0"?>\n<urlset>\n  <url><loc>https://manahome.org/fr/</loc></url>\n</urlset>\n`;
    const fiches = [base()];
    const une = patchSitemap(xml, lignesSitemap(fiches, SITE, DATE));
    const deux = patchSitemap(une, lignesSitemap(fiches, SITE, DATE));
    expect(deux).toBe(une);
    // 1 URL d'origine + index + 1 fiche = 3 <url>, et pas une de plus au second passage.
    expect((deux.match(/<url>/g) ?? []).length).toBe(3);
    expect(deux).toContain(`<loc>${SITE}/fr/${PREFIXE_ROUTE}</loc>`);
    expect(deux).toContain(`<loc>${urlFiche(fiches[0], SITE)}</loc>`);
    expect(deux).toContain("<lastmod>2026-11-19</lastmod>");
  });
});

describe("la fixture d'exemple", () => {
  it("ne produit que des fiches publiables et des slugs uniques", () => {
    const rows = JSON.parse(readFileSync(resolve(ICI, "exemples-hebergement-29.json"), "utf8"));
    const retenues = rows.filter(estDansLePerimetre);
    expect(retenues.length).toBe(6); // OSM, Morbihan et association écartés ; la creuse reste dans le périmètre
    const pub = retenues.filter(aDuContenuReel);
    expect(pub.length).toBe(5); // la fiche creuse est écartée à la publication
    const slugs = pub.map(slugPour);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const f of pub) {
      const html = pageFiche(f, { site: SITE, base: "/", date: DATE });
      expect(texteSansBalises(html).length).toBeGreaterThan(SEUIL_TEXTE);
    }
  });
});

describe("les tuiles", () => {
  it("couvrent l'enveloppe du département sans trou", () => {
    const t = tuiles(BBOX_29, TAILLE_TUILE);
    expect(t.length).toBeGreaterThan(50);
    for (const [a, b, c, d] of t) {
      expect(a).toBeLessThan(c);
      expect(b).toBeLessThan(d);
      expect(a).toBeGreaterThanOrEqual(BBOX_29[0]);
      expect(c).toBeLessThanOrEqual(BBOX_29[2]);
    }
  });
});
