import { lien, langueCourante } from "./router";
import { t } from "./i18n";

/**
 * Page /mentions-legales.
 *
 * 🔴 ELLE ÉTAIT FAUSSE SUR TROIS POINTS, ET C'EST UNE PAGE JURIDIQUE.
 *    1. « Site statique hébergé sur GitHub Pages (GitHub, Inc.) » — faux
 *       depuis la bascule : le site est servi par le KS-5, chez OVH, en
 *       France. Déclarer un hébergeur américain pour un service qui n'y a
 *       rien n'est pas seulement inexact au sens de la LCEN.
 *    2. « plateforme de mise en relation pour la location de vacances » —
 *       ce n'est plus l'activité depuis le 11/11/2026.
 *    3. AUCUN ÉDITEUR NOMMÉ : « les coordonnées complètes seront publiées
 *       avec la structure juridique définitive ». Or l'association existe
 *       depuis le 10/08/2026, et le site affiche désormais des prix.
 *
 * ⭐ UNE MENTION LÉGALE QUI RECOPIE UN FAIT D'INFRASTRUCTURE SE REVÉRIFIE À
 *    CHAQUE DÉMÉNAGEMENT. On déplace des données, on ne relit pas la page qui
 *    dit où elles sont — c'est exactement ce qui s'est passé le 2/11.
 *
 * ✅ RÉSERVE LEVÉE LE 11/11/2026 : le champ porte désormais Aurélien GILLET,
 *    fondateur d'Alliance MANA. Ce qui suit est conservé parce que la raison
 *    vaut pour la prochaine fois qu'une marque sera tentée d'y revenir.
 *
 * ⚠️ RÉSERVE JURIDIQUE, reportée ici pour qu'elle ne se reperde pas. La LCEN
 *    (art. 6 III 1°) demande le DIRECTEUR DE LA PUBLICATION ; pour un éditeur
 *    personne morale, c'est son représentant légal — une personne PHYSIQUE,
 *    nommée. « TEMPOsystem » est une marque, pas une personne : la mention ne
 *    désigne donc personne au sens de la loi. Le point a été signalé et la
 *    décision maintenue par le responsable. S'il la revoit, il suffit de
 *    mettre ici le nom du représentant légal d'Alliance MANA.
 *
 * Les valeurs ci-dessous viennent de `src/lib/editeur.ts` du dépôt
 * manafrance-app, où elles sont tenues à jour et documentées — elles sont
 * recopiées ici parce que les deux dépôts sont séparés. ⚠️ Toute correction
 * se fait DANS LES DEUX.
 */

const EDITEUR = {
  nom: "Alliance MANA",
  forme: "Association déclarée, régie par la loi du 1er juillet 1901 et le décret du 16 août 1901",
  rna: "W292008256",
  siege: "4 Lostmarc'h, 29160 Crozon",
  declaration: "Déclarée le 10 août 2026 auprès de la Sous-préfecture de Brest",
  email: "contact@manahome.org",
  site: "https://alliancemana.org",
  // ⭐ Donné par Aurélien le 11/11/2026. La réserve écrite plus haut est levée.
  directeur: "Aurélien GILLET, fondateur d'Alliance MANA",
};

/** Vérifié au registre RIPE sur l'adresse de production réelle, le 07/11/2026. */
const HEBERGEUR = {
  nom: "OVH SAS",
  adresse: "2 rue Kellermann, 59100 Roubaix, France",
  precision: "Serveur dédié situé en France. Le site, les interfaces et les données tiennent sur une seule machine.",
};

export function MentionsLegales() {
  const L = langueCourante();
  return (
    <main className="wrap">
      <section className="landing-section bulle">
        <p className="hero-label">{t(L, "Informations légales")}</p>
        <h1 className="section-title">{t(L, "Mentions légales")}</h1>

        <h2 className="tarif-sous-titre">{t(L, "Éditeur")}</h2>
        <ul className="mentions-liste">
          <li><strong>{EDITEUR.nom}</strong></li>
          <li>{t(L, EDITEUR.forme)}</li>
          <li>{t(L, "Numéro RNA")} : {EDITEUR.rna}</li>
          <li>{t(L, "Siège social")} : {EDITEUR.siege}</li>
          <li>{t(L, EDITEUR.declaration)}</li>
          <li>{t(L, "Courriel")} : <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a></li>
          <li>{t(L, "Directeur de la publication")} : {EDITEUR.directeur}</li>
        </ul>

        <h2 className="tarif-sous-titre">{t(L, "Hébergement")}</h2>
        <ul className="mentions-liste">
          <li><strong>{HEBERGEUR.nom}</strong> — {HEBERGEUR.adresse}</li>
          <li>{t(L, HEBERGEUR.precision)}</li>
        </ul>

        <h2 className="tarif-sous-titre">{t(L, "Nature du service")}</h2>
        <p className="section-texte">
          {t(L, "MANAhome est la vitrine du GEO et des offres de l'écosystème MANA, éditée par Alliance MANA. Le GEO consiste à mesurer ce que les assistants IA répondent au sujet d'une organisation, et à rendre cette organisation compréhensible par ces machines.")}
        </p>
        <p className="section-texte">
          {t(L, "MANAhome ne garantit ni indexation, ni citation, ni recommandation par un assistant IA : personne ne contrôle ce que répond un modèle. L'audit mesure et documente — il ne vend aucune position. Il reste indépendant de toute prestation d'optimisation.")}
        </p>

        <h2 className="tarif-sous-titre">{t(L, "Prix et commandes")}</h2>
        <p className="section-texte">
          {t(L, "Les prix affichés sont des prix publics et nets : aucune TVA ne s'ajoute. Alliance MANA est une association loi 1901 à gestion désintéressée dont les activités lucratives demeurent accessoires ; ses factures portent la mention « TVA non applicable, article 261-7 du CGI ». Une demande envoyée depuis ce site est enregistrée sur nos serveurs, et vous en recevez confirmation par courriel. Elle ne vaut pas commande : toute prestation fait l'objet d'un devis ou d'une facture émise par Alliance MANA, que vous acceptez avant tout travail.")}
        </p>

        <h2 className="tarif-sous-titre">{t(L, "Le test gratuit")}</h2>
        <p className="section-texte">
          {t(L, "L'adresse que vous saisissez dans le test de lisibilité est envoyée à notre serveur, qui consulte la page publique correspondante comme le ferait un moteur de recherche. Aucun compte, aucune adresse de courriel, aucun suivi : le test ne conserve rien de vous.")}
        </p>

        <h2 className="tarif-sous-titre">{t(L, "Données personnelles")}</h2>
        <p className="section-texte">
          {t(L, "Ce site ne dépose aucun traceur et n'a pas de compte utilisateur. Les informations que vous saisissez dans le formulaire ne quittent votre navigateur qu'au moment où vous cliquez sur « Envoyer » : elles sont alors enregistrées sur nos serveurs, en France, pour traiter votre demande et vous répondre. Aucune donnée, aucun contact n'est revendu, et vous pouvez en demander la suppression à tout moment.")}
        </p>
        <p className="section-texte">
          {t(L, "Pour exercer vos droits d'accès, de rectification ou de suppression sur un échange déjà engagé, écrivez à")} <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a>.
        </p>

        <div className="est-actions">
          <a className="btn btn-clair-ghost" href={lien(`/approche`)}>{t(L, "Notre approche")}</a>
          <a className="btn btn-clair" href={lien(`/`)}>{t(L, "Retour à l'accueil")}</a>
        </div>
      </section>
    </main>
  );
}
