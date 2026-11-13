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
 * ⚠️ CE BLOC NE SUIT PLUS `src/lib/editeur.ts` du dépôt manafrance-app : celui-ci
 * porte l'ASSOCIATION, qui édite mana.bzh, manafrance.org et manatimebank.org.
 * MANAhome a changé de camp le 13/11/2026 ; les valeurs de l'entreprise
 * individuelle viennent de la table `billing_issuers`. Ne plus synchroniser les
 * deux — ce serait reconduire la fausse déclaration qu'on vient de retirer.
 */

// 🔴 BASCULÉ LE 13/11/2026 — L'ÉDITEUR N'EST PLUS L'ASSOCIATION.
//    Arbitrage d'Aurélien : « l'asso prouve, la société encaisse ». Alliance
//    MANA ne facture plus rien ; MANAhome est la vitrine commerciale, donc son
//    éditeur est l'entreprise. Cela ANNULE la décision du 11/11 (« facturation
//    = Alliance MANA »), et ce n'est pas une dérive : les deux dates sont
//    écrites pour qu'une session future ne « répare » pas celle-ci.
//
// ⛔ ÉCRIRE L'UN SUR LE SITE DE L'AUTRE EST UNE FAUSSE DÉCLARATION, et les deux
//    jeux de mentions sont EXACTEMENT inverses :
//      · l'association s'identifie par son RNA, et JAMAIS par un SIRET ;
//      · l'entreprise individuelle DOIT afficher SIREN, SIRET et code APE, et
//        n'a ni RNA, ni RCS, ni numéro de TVA intracommunautaire.
//    Un garde le tient (`src/structure.test.ts`), parce qu'un nom d'entité se
//    recopie sans y penser d'un site à l'autre.
//
// ⭐ ET LA RÉSERVE LCEN TOMBE D'ELLE-MÊME. Elle disait : « TEMPOsystem est une
//    marque, pas une personne ; la mention ne désigne donc personne au sens de
//    l'art. 6 III 1° ». L'éditeur est désormais une PERSONNE PHYSIQUE nommée,
//    exerçant sous ce nom commercial — la loi est satisfaite sans détour.
// 🔴 L'ÉDITEUR REVIENT À L'ASSOCIATION — 14/11/2026, décision d'Aurélien, et
//    c'est la SECONDE bascule en vingt-quatre heures. Elle n'est pas une
//    hésitation : chacune suivait l'activité réelle du site.
//      13/11 — manahome VENDAIT le GEO → l'entreprise individuelle.
//      14/11 — le GEO est parti chez temposystem.eu et .fr → le site ne vend
//              plus rien, et « rendre les territoires et leurs acteurs lisibles
//              et accessibles par tout moyen numérique, y compris
//              l'intelligence artificielle » est MOT POUR MOT l'objet d'Alliance
//              MANA, refondu en AGE le 15/10/2026.
//    ⭐ Ce qui détermine l'éditeur, c'est ce que le site FAIT, pas ce qu'on
//       préfère. Un relevé ouvert que personne ne paie n'est pas une activité
//       commerciale — et le déclarer tel serait une pièce contre le rescrit
//       mécénat que l'association dépose.
//
// ⚠️ DIRECTEUR DE LA PUBLICATION — le point est signalé, pas enterré. Pour une
//    personne morale, la loi du 29/07/1982 (art. 93-2) désigne le REPRÉSENTANT
//    LÉGAL, et l'article 119 des statuts dit que « le président représente
//    l'Association dans tous les actes de la vie civile » — soit Bruno GILLET
//    depuis l'AGE du 15/10. Les statuts ne portent AUCUNE clause désignant un
//    directeur de la publication : vérifié dans les 21 articles, l'unique
//    mention voisine (« toute personne dûment mandatée ») vise les formalités
//    de déclaration en préfecture, pas la direction de publication.
//    ⛔ Aurélien GILLET est inscrit ici sur sa décision. Ce qui rendrait la
//    mention inattaquable tient en une ligne de procès-verbal du bureau le
//    mandatant à ce titre. Tant qu'elle n'existe pas, cette note la remplace.
const EDITEUR = {
  nom: "Alliance MANA",
  forme: "Association déclarée, régie par la loi du 1er juillet 1901 et le décret du 16 août 1901",
  rna: "W292008256",
  siren: "130 121 866",
  siret: "130 121 866 00011",
  ape: "94.99Z",
  siege: "4 Lostmarc'h, 29160 Crozon",
  // ⚠️ Ce site ne vend RIEN : le relevé est publié en données ouvertes. On
  //    n'écrit donc aucune mention de franchise — l'art. 293 B est le régime
  //    d'une entreprise, et l'invoquer ici décrirait une activité qui n'existe
  //    pas sur ce domaine.
  tva: "Aucune vente sur ce site : le relevé est publié en données ouvertes, sous licence ODbL. L'association ne dispose pas de numéro de TVA intracommunautaire.",
  email: "contact@manahome.org",
  directeur: "Aurélien GILLET",
  qualiteDirecteur: "fondateur",
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
          {/* ⭐ Le RNA D'ABORD : une association déclarée s'identifie par lui,
              et c'est le numéro à rappeler dans toute correspondance
              préfectorale. Le SIREN et le SIRET existent depuis le 18/08/2026
              et se donnent aussi — ils servent aux financeurs publics. */}
          <li>{t(L, "Numéro RNA")} : {EDITEUR.rna}</li>
          <li>{t(L, "Numéro SIREN")} : {EDITEUR.siren}</li>
          <li>{t(L, "Numéro SIRET")} : {EDITEUR.siret}</li>
          <li>{t(L, "Code APE")} : {EDITEUR.ape}</li>
          <li>{t(L, "Adresse")} : {EDITEUR.siege}</li>
          <li>{t(L, EDITEUR.tva)}</li>
          <li>{t(L, "Courriel")} : <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a></li>
          <li>{t(L, "Directeur de la publication")} : {EDITEUR.directeur}, {t(L, EDITEUR.qualiteDirecteur)}</li>
        </ul>

        <h2 className="tarif-sous-titre">{t(L, "Hébergement")}</h2>
        <ul className="mentions-liste">
          <li><strong>{HEBERGEUR.nom}</strong> — {HEBERGEUR.adresse}</li>
          <li>{t(L, HEBERGEUR.precision)}</li>
        </ul>

        <h2 className="tarif-sous-titre">{t(L, "Nature du service")}</h2>
        {/* ⛔ 14/11/2026 — CE BLOC DÉCRIVAIT ENCORE LE GEO, et c'est le dernier
            reste trouvé : « MANAhome est la vitrine du GEO […] éditée par
            TEMPOsystem », puis une section « Prix et commandes » annonçant la
            franchise de l'art. 293 B. ⭐ Les mentions légales sont la page
            qu'on relit le moins et qui engage le plus — on y cherche l'éditeur,
            jamais la description du service. Trouvé en relisant la page
            SERVIE, après que l'accueil et /approche étaient déjà propres. */}
        <p className="section-texte">
          {t(L, "MANAhome publie un relevé ouvert des hébergements touristiques du monde, construit à partir de données ouvertes : une page par pays, avec les types recensés, les lieux que l'on peut nommer sans se tromper, et la part que l'on ne peut pas.")}
        </p>
        <p className="section-texte">
          {t(L, "Rien n'est vendu sur ce site : aucun classement, aucune mise en avant, aucune place. Le relevé dit ce qui existe et où, à une date, avec sa source. Il ne dit ni ce que ça vaut, ni si c'est ouvert, et ne garantit ni exhaustivité ni exactitude des données reprises de ses sources.")}
        </p>

        <h2 className="tarif-sous-titre">{t(L, "Données et licence")}</h2>
        <p className="section-texte">
          {t(L, "Les données proviennent d'OpenStreetMap et de registres publics ouverts. Elles sont republiées sous licence ODbL, qui en autorise la réutilisation à condition d'en citer la source et de partager les éventuelles modifications aux mêmes conditions.")}
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
