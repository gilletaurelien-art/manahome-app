import { useId, useState } from "react";
import { GlyphPersonne, GlyphEmail, GlyphDescription, GlyphValidation } from "./Glyphs";
import { t } from "./i18n";
import { langueCourante } from "./router";
import { OFFRES_GEO } from "./offres";

/**
 * Le formulaire de demande d'audit.
 *
 * 🔴 CE QU'IL FAISAIT JUSQU'AU 11/11/2026, EN PRODUCTION : rien. Il écrivait
 *    la demande dans le `localStorage` DU VISITEUR puis affichait « votre
 *    message a bien été envoyé ». Personne ne recevait jamais rien.
 * ⭐ Puis il a ouvert la messagerie du visiteur — honnête, mais fragile : un
 *    `mailto:` ne s'ouvre pas chez qui n'a pas de client de courriel
 *    configuré, et rien n'était enregistré nulle part.
 *
 * ✅ DEPUIS CE SOIR IL ENREGISTRE VRAIMENT. Il POSTe sur
 *    `/api/geo-audit-demande`, servi par Caddy sur manahome.org même : la
 *    fonction enregistre la demande AVANT d'envoyer sa confirmation, par son
 *    propre SMTP. Même origine, donc pas de CORS ; aucune clé dans le bundle,
 *    Caddy la pose côté serveur.
 * ⚠️ La forme de la charge utile n'est pas devinée : elle est relevée sur le
 *    formulaire d'Alliance MANA qui appelle déjà cette fonction. Un champ
 *    inventé serait ignoré en silence — et la demande arriverait amputée.
 *
 * ⚠️ `offre` N'EXISTE PAS DANS L'API. Plutôt que d'inventer un champ que la
 *    fonction jetterait, l'offre voulue est préfixée au `souhait` : rien ne
 *    se perd, et rien n'est supposé de l'autre côté.
 *
 * ⭐ Et la règle qui tient ce fichier depuis sa réécriture : la confirmation
 *    décrit ce qui S'EST PASSÉ. Elle ne s'affiche que si le serveur a répondu
 *    `ok`, jamais parce que le bouton a été cliqué.
 */

const ENDPOINT = "/api/geo-audit-demande";
const DESTINATAIRE = "contact@manahome.org";

type Etat = {
  nom_structure: string; contact_nom: string; contact_fonction: string;
  email: string; site_url: string; secteur: string; code_postal: string;
  offre: string; souhait: string;
};
const VIDE: Etat = {
  nom_structure: "", contact_nom: "", contact_fonction: "", email: "",
  site_url: "", secteur: "", code_postal: "", offre: "", souhait: "",
};

export function ContactForm() {
  const L = langueCourante();
  const n = useId();
  const id = (cle: string) => `${n}-${cle}`;
  const [form, setForm] = useState<Etat>(VIDE);
  const [piege, setPiege] = useState("");       // site_web_bis
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok" | "erreur">("repos");
  const [motif, setMotif] = useState<string | null>(null);

  const valide =
    form.nom_structure.trim() !== "" && form.email.includes("@") && form.offre !== "";

  const envoyer = async () => {
    if (!valide || etat === "envoi") return;
    setEtat("envoi");
    setMotif(null);
    try {
      const r = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nom_structure: form.nom_structure,
          contact_nom: form.contact_nom,
          contact_fonction: form.contact_fonction,
          email: form.email,
          site_url: form.site_url,
          secteur: form.secteur,
          code_postal: form.code_postal,
          souhait: `${t(L, "Offre souhaitée")} : ${form.offre}\n\n${form.souhait}`,
          site_web_bis: piege,
          langue: L,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setMotif(d.error === "adresse_invalide" ? "adresse" : "autre");
        setEtat("erreur");
        return;
      }
      setEtat("ok");
    } catch {
      setMotif("autre");
      setEtat("erreur");
    }
  };

  const champ = (k: keyof Etat) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value }),
  });

  if (etat === "ok") {
    return (
      <div className="contact-form" role="status">
        <p className="contact-merci label-icone">
          <GlyphValidation size={18} />
          {t(L, "Votre demande est enregistrée. Vous recevez une confirmation par courriel, et une réponse sous deux jours ouvrés.")}
        </p>
        <button
          type="button"
          className="btn btn-clair-ghost"
          onClick={() => { setEtat("repos"); setForm(VIDE); }}
        >
          {t(L, "Faire une autre demande")}
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={(e) => { e.preventDefault(); envoyer(); }}>
      <p className="apercu-label label-icone">
        <GlyphDescription size={15} />
        {t(L, "Demander un audit, ou poser une question")}
      </p>

      <label htmlFor={id("nom_structure")} className="label-icone">
        <GlyphPersonne size={15} />{t(L, "Organisation")} *
      </label>
      <input id={id("nom_structure")} type="text" autoComplete="organization" required {...champ("nom_structure")} />

      <div className="contact-duo">
        <div>
          <label htmlFor={id("contact_nom")}>{t(L, "Votre nom")}</label>
          <input id={id("contact_nom")} type="text" autoComplete="name" {...champ("contact_nom")} />
        </div>
        <div>
          <label htmlFor={id("contact_fonction")}>{t(L, "Votre fonction")}</label>
          <input id={id("contact_fonction")} type="text" autoComplete="organization-title" {...champ("contact_fonction")} />
        </div>
      </div>

      <label htmlFor={id("email")} className="label-icone">
        <GlyphEmail size={15} />{t(L, "Courriel")} *
      </label>
      <input id={id("email")} type="email" autoComplete="email" required placeholder="vous@exemple.fr" {...champ("email")} />

      <label htmlFor={id("site_url")}>{t(L, "Site web")}</label>
      <input id={id("site_url")} type="url" inputMode="url" placeholder="https://" autoComplete="url" {...champ("site_url")} />

      <label htmlFor={id("offre")}>{t(L, "Offre souhaitée")} *</label>
      <select id={id("offre")} required {...champ("offre")}>
        <option value="">{t(L, "— choisir —")}</option>
        {OFFRES_GEO.map((o) => (
          <option key={o.nom} value={o.nom}>{o.nom}</option>
        ))}
        <option value={t(L, "Je ne sais pas encore")}>{t(L, "Je ne sais pas encore")}</option>
      </select>

      <div className="contact-duo">
        <div>
          <label htmlFor={id("secteur")}>{t(L, "Secteur d'activité")}</label>
          <input id={id("secteur")} type="text" {...champ("secteur")} />
        </div>
        <div>
          <label htmlFor={id("code_postal")}>{t(L, "Code postal")}</label>
          <input id={id("code_postal")} type="text" inputMode="numeric" autoComplete="postal-code" {...champ("code_postal")} />
        </div>
      </div>

      <label htmlFor={id("souhait")}>
        {t(L, "En une phrase : ce que vous aimeriez que les IA répondent à votre sujet")}
      </label>
      <textarea id={id("souhait")} rows={3} {...champ("souhait")} />

      {/* Piège à robots : invisible, jamais rempli par un humain. */}
      <div className="piege-robot" aria-hidden="true">
        <label htmlFor={id("site_web_bis")}>{t(L, "Ne pas remplir ce champ")}</label>
        <input id={id("site_web_bis")} type="text" tabIndex={-1} autoComplete="off"
               value={piege} onChange={(e) => setPiege(e.target.value)} />
      </div>

      <button type="submit" className="btn btn-clair" disabled={!valide || etat === "envoi"}>
        {etat === "envoi" ? t(L, "Envoi…") : t(L, "Envoyer ma demande")}
      </button>

      {etat === "erreur" && (
        <p className="sonde-erreur" role="status">
          {motif === "adresse"
            ? t(L, "Cette adresse de courriel ne semble pas valide.")
            : t(L, "La demande n'a pas pu être envoyée. Réessayez dans un instant, ou écrivez-nous directement.")}{" "}
          <a href={`mailto:${DESTINATAIRE}`}>{DESTINATAIRE}</a>
        </p>
      )}
      <p className="contact-repli">
        {t(L, "Réponse sous deux jours ouvrés. Vos données ne sont jamais revendues.")}
      </p>
    </form>
  );
}
