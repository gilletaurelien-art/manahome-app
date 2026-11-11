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
  directeur: "TEMPOsystem",
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
          {t(L, "MANAhome est la vitrine du GEO et des offres de l'écosystème MANA, opérée par TEMPOsystem. Le GEO consiste à mesurer ce que les assistants IA répondent au sujet d'une organisation, et à rendre cette organisation compréhensible par ces machines.")}
        </p>
        <p className="section-texte">
          {t(L, "MANAhome ne garantit ni indexation, ni citation, ni recommandation par un assistant IA : personne ne contrôle ce que répond un modèle. L'audit mesure et documente — il ne vend aucune position. Il reste indépendant de toute prestation d'optimisation.")}
        </p>

        <h2 className="tarif-sous-titre">{t(L, "Prix et commandes")}</h2>
        <p className="section-texte">
          {t(L, "Les prix affichés sont des prix arrêtés, hors taxes. Aucune commande n'est enregistrée depuis ce site : une demande ouvre votre logiciel de courriel, et rien n'est transmis avant que vous ne l'envoyiez vous-même. Toute prestation fait l'objet d'un devis ou d'une facture émise par la structure qui la réalise.")}
        </p>

        <h2 className="tarif-sous-titre">{t(L, "Données personnelles")}</h2>
        <p className="section-texte">
          {t(L, "Ce site ne dépose aucun traceur et ne collecte aucune donnée personnelle par lui-même : il n'a ni compte, ni formulaire enregistré côté serveur. Les informations que vous saisissez dans le formulaire de demande restent dans votre navigateur jusqu'à ce que vous les envoyiez par votre propre messagerie. Aucune donnée ni aucun contact n'est revendu.")}
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
