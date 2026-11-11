import { useState } from "react";
import { GlyphPersonne, GlyphEmail, GlyphDescription, GlyphValidation } from "./Glyphs";
import { t } from "./i18n";
import { langueCourante } from "./router";
import { OFFRES_GEO, OFFRES_MANA } from "./offres";

/**
 * Le formulaire de demande d'audit.
 *
 * 🔴 CE QU'IL FAISAIT JUSQU'AU 11/11/2026, EN PRODUCTION : rien. Il écrivait
 *    la demande dans le `localStorage` DU VISITEUR, puis affichait « votre
 *    message a bien été envoyé. Nous répondons très vite. » Personne ne
 *    recevait jamais rien, et le visiteur repartait convaincu du contraire.
 *    Un commentaire disait « Démo : l'envoi est simulé » — il était juste, et
 *    il n'a empêché personne : une description fidèle occupe la place d'un
 *    garde sans en être un. C'est l'écran qui mentait, pas le code.
 *
 * ⛔ IL N'Y A AUCUN SERVEUR. Mesuré : /api/* rend la coquille avec un 404, et
 *    aucun conteneur manahome ne tourne sur le KS-5. On ne peut donc pas
 *    « envoyer » — alors on ne le dit pas. Le formulaire COMPOSE la demande
 *    et ouvre la messagerie du visiteur : le message part vraiment, par son
 *    propre compte, et il le voit partir.
 * ⭐ D'où la règle qui tient ce fichier : la confirmation décrit ce qui S'EST
 *    PASSÉ, jamais ce qu'on aurait voulu qu'il se passe. Tant qu'il n'y a pas
 *    d'accusé de réception, il n'y a pas de « message envoyé ».
 */

const DESTINATAIRE = "contact@manahome.org";

type Etat = {
  organisation: string;
  site: string;
  courriel: string;
  offre: string;
  secteur: string;
  territoire: string;
  message: string;
};

const VIDE: Etat = {
  organisation: "", site: "", courriel: "", offre: "", secteur: "", territoire: "", message: "",
};

export function ContactForm() {
  const L = langueCourante();
  const [form, setForm] = useState<Etat>(VIDE);
  const [compose, setCompose] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);

  const valide =
    form.organisation.trim() !== "" &&
    form.courriel.includes("@") &&
    form.offre !== "";

  const corps = () =>
    [
      `${t(L, "Organisation")} : ${form.organisation}`,
      `${t(L, "Site web")} : ${form.site || "—"}`,
      `${t(L, "Courriel")} : ${form.courriel}`,
      `${t(L, "Offre souhaitée")} : ${form.offre}`,
      `${t(L, "Secteur d'activité")} : ${form.secteur || "—"}`,
      `${t(L, "Territoire ou marché visé")} : ${form.territoire || "—"}`,
      "",
      form.message || "—",
    ].join("\n");

  const envoyer = () => {
    if (!valide) return;
    const texte = corps();
    const url =
      `mailto:${DESTINATAIRE}` +
      `?subject=${encodeURIComponent(`${t(L, "Demande")} — ${form.offre} — ${form.organisation}`)}` +
      `&body=${encodeURIComponent(texte)}`;
    setCompose(texte);
    // ⚠️ Ouvrir la messagerie PEUT ne rien faire (webmail non configuré, client
    // absent). L'écran suivant ne dit donc jamais « envoyé » : il explique, et
    // il donne l'adresse et le texte à recopier si rien ne s'est ouvert.
    window.location.href = url;
  };

  const champ = (k: keyof Etat) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value }),
  });

  if (compose !== null) {
    return (
      <div className="contact-form" role="status">
        <p className="contact-merci label-icone">
          <GlyphValidation size={18} />
          {t(L, "Votre logiciel de courriel vient de s'ouvrir avec votre demande. Elle ne part que lorsque vous cliquez sur « Envoyer » chez vous — rien n'a encore été transmis.")}
        </p>
        <p className="contact-repli">
          {t(L, "Rien ne s'est ouvert ? Écrivez-nous directement à")}{" "}
          <a href={`mailto:${DESTINATAIRE}`}>{DESTINATAIRE}</a>{" "}
          {t(L, "en recopiant ce texte :")}
        </p>
        <pre className="contact-apercu">{compose}</pre>
        <div className="contact-actions">
          <button
            type="button"
            className="btn btn-clair"
            onClick={() => {
              navigator.clipboard?.writeText(compose).then(
                () => setCopie(true),
                () => setCopie(false),
              );
            }}
          >
            {copie ? t(L, "Texte copié") : t(L, "Copier le texte")}
          </button>
          <button
            type="button"
            className="btn btn-clair-ghost"
            onClick={() => { setCompose(null); setCopie(false); setForm(VIDE); }}
          >
            {t(L, "Faire une autre demande")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="contact-form"
      onSubmit={(e) => { e.preventDefault(); envoyer(); }}
    >
      <p className="apercu-label label-icone">
        <GlyphDescription size={15} />
        {t(L, "Demander un audit, ou poser une question")}
      </p>

      <label htmlFor="c-organisation" className="label-icone">
        <GlyphPersonne size={15} />{t(L, "Organisation")} *
      </label>
      <input id="c-organisation" type="text" autoComplete="organization" required {...champ("organisation")} />

      <label htmlFor="c-site">{t(L, "Site web")}</label>
      <input id="c-site" type="url" inputMode="url" placeholder="https://" autoComplete="url" {...champ("site")} />

      <label htmlFor="c-courriel" className="label-icone">
        <GlyphEmail size={15} />{t(L, "Courriel")} *
      </label>
      <input id="c-courriel" type="email" autoComplete="email" required placeholder="vous@exemple.fr" {...champ("courriel")} />

      <label htmlFor="c-offre">{t(L, "Offre souhaitée")} *</label>
      <select id="c-offre" required {...champ("offre")}>
        <option value="">{t(L, "— choisir —")}</option>
        {[...OFFRES_GEO, ...OFFRES_MANA].map((o) => (
          <option key={o.nom} value={o.nom}>{o.nom}</option>
        ))}
        <option value={t(L, "Je ne sais pas encore")}>{t(L, "Je ne sais pas encore")}</option>
      </select>

      <div className="contact-duo">
        <div>
          <label htmlFor="c-secteur">{t(L, "Secteur d'activité")}</label>
          <input id="c-secteur" type="text" {...champ("secteur")} />
        </div>
        <div>
          <label htmlFor="c-territoire">{t(L, "Territoire ou marché visé")}</label>
          <input id="c-territoire" type="text" {...champ("territoire")} />
        </div>
      </div>

      <label htmlFor="c-message">{t(L, "Votre message")}</label>
      <textarea id="c-message" rows={3} {...champ("message")} />

      <button type="submit" className="btn btn-clair" disabled={!valide}>
        {t(L, "Préparer ma demande")}
      </button>
      <p className="contact-repli">
        {t(L, "Le bouton ouvre votre logiciel de courriel avec la demande déjà rédigée. Rien n'est transmis avant que vous l'envoyiez vous-même.")}
      </p>
    </form>
  );
}
