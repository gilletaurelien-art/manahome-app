import { useId, useState } from "react";
import { t } from "./i18n";
import { langueCourante } from "./router";

/**
 * La sonde GEO — le test gratuit, dans le header.
 *
 * Elle appelle `POST /api/geo` sur manahome.org même, relayé par Caddy vers
 * la fonction `sonde-lisibilite`. Elle rend un score sur 100 et le détail des
 * dix critères.
 *
 * 🔴 CE COMMENTAIRE A ÉTÉ FAUX PENDANT UNE HEURE : il annonçait un appel vers
 *    `https://alliancemana.com/api/geo`, exact à l'écriture, périmé dès que la
 *    constante est passée en même origine — et définitivement faux depuis que
 *    ce domaine redirige vers .org (12/11/2026). La description vivait à côté
 *    du code qu'elle décrivait, sans rien pour les tenir ensemble.
 *
 * ⛔ CE QU'ELLE NE FAIT PAS, ET IL FAUT QUE ÇA SE LISE. Elle inspecte la PAGE
 *    (llms.txt, robots.txt, JSON-LD, canonique, langue, fraîcheur du
 *    sitemap) : de la lisibilité machine, mesurable en trois secondes. Elle
 *    n'interroge AUCUN assistant et ne dit rien de ce que ChatGPT répond sur
 *    vous — c'est précisément l'objet de l'audit payant.
 * ⭐ Laisser croire le contraire serait cannibaliser l'offre avec son propre
 *    produit d'appel : qui croit avoir eu la mesure n'achète pas l'audit.
 *    D'où la phrase sous le résultat, qui n'est pas une précaution mais la
 *    frontière commerciale elle-même.
 */

/* ⚠️ MÊME ORIGINE, et c'est une correction de survie : la sonde appelait
   `https://alliancemana.com/api/geo`, or ce domaine va rediriger vers .org où
   la route n'existe pas (mesuré : 404). Elle est désormais servie par
   manahome.org même — Caddy relaie vers la fonction, la clé reste côté
   serveur, et il n'y a plus de domaine tiers dont dépendre. */
const SONDE = "/api/geo";

type Critere = { cle: string; label: string; present: boolean; motifEchec: string };
type Resultat = { url: string; score: number; criteres: Critere[]; recommandation?: string };

export function SondeGeo() {
  const L = langueCourante();
  const n = useId();
  const [url, setUrl] = useState("");
  const [etat, setEtat] = useState<"repos" | "encours" | "fait" | "erreur">("repos");
  const [res, setRes] = useState<Resultat | null>(null);

  const lancer = async () => {
    if (!url.trim()) return;
    setEtat("encours");
    setRes(null);
    try {
      const r = await fetch(SONDE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setRes(await r.json());
      setEtat("fait");
    } catch {
      // ⚠️ On ne dit jamais « votre site a un problème » quand c'est NOTRE
      //    appel qui a échoué : la sonde peut être indisponible, le réseau
      //    coupé, l'adresse injoignable. Confondre les deux ferait annoncer
      //    un défaut inexistant — sur un site qui vend la mesure honnête.
      setEtat("erreur");
    }
  };

  const rates = res ? res.criteres.filter((c) => !c.present) : [];

  return (
    <div className="sonde">
      <form
        className="sonde-forme"
        onSubmit={(e) => { e.preventDefault(); lancer(); }}
      >
        <label htmlFor={`${n}-url`} className="sonde-etiquette">
          {t(L, "Testez la lisibilité machine de votre site")}
        </label>
        <div className="sonde-ligne">
          <input
            id={`${n}-url`}
            type="url"
            inputMode="url"
            autoComplete="url"
            required
            placeholder="https://votre-site.fr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" className="btn btn-clair" disabled={etat === "encours"}>
            {etat === "encours" ? t(L, "Analyse…") : t(L, "Tester — gratuit, 30 s")}
          </button>
        </div>
      </form>

      {etat === "erreur" && (
        <p className="sonde-erreur" role="status">
          {t(L, "Le test n'a pas abouti. Cela peut venir de la sonde ou de l'adresse saisie — pas forcément de votre site. Réessayez dans un instant.")}
        </p>
      )}

      {etat === "fait" && res && (
        <div className="sonde-resultat" role="status">
          <p className="sonde-score">
            <strong>{res.score}</strong><span>/100</span>
            <span className="sonde-cible">{res.url}</span>
          </p>
          {rates.length === 0 ? (
            <p className="sonde-detail">{t(L, "Les dix critères de lisibilité machine sont satisfaits.")}</p>
          ) : (
            <ul className="sonde-liste">
              {rates.map((c) => (
                <li key={c.cle}><strong>{c.label}</strong> — {c.motifEchec}</li>
              ))}
            </ul>
          )}
          {/* La frontière, écrite sous CHAQUE résultat. */}
          <p className="sonde-limite">
            {t(L, "Ce test lit votre page : llms.txt, robots.txt, données structurées, canonique, langue, fraîcheur. Il n'interroge aucun assistant et ne dit rien de ce que ChatGPT ou Gemini répondent à votre sujet — c'est l'objet de l'audit.")}
          </p>
        </div>
      )}
    </div>
  );
}
