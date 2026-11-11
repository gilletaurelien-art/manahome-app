import { useEffect } from "react";
import { lien, langueCourante } from "./router";
import { t } from "./i18n";
import { ContactForm } from "./ContactForm";
import {
  GlyphCadeau, GlyphBouclier, GlyphCadenas,
  GlyphStructure, GlyphBalance, GlyphVieLocale,
} from "./Glyphs";

/**
 * Page /approche.
 *
 * 🔴 ELLE VENDAIT ENCORE DES LOCATIONS DE VACANCES LE 11/11/2026, EN
 *    PRODUCTION, APRÈS LE PIVOT GEO. « MANAhome est un portail de location de
 *    vacances », « Publier mon annonce — gratuit ». Et ce n'était pas une page
 *    oubliée dans un coin : c'est la destination de TOUS les boutons
 *    « Demander un audit » — le hero, la navigation, la section 02 et la
 *    section 04 y mènent. Le visiteur qui cliquait sur l'appel à l'action
 *    principal atterrissait sur l'ancien produit, gratuit.
 * ⭐ Le pivot avait changé l'accueil et oublié où l'accueil ENVOIE. Changer une
 *    page d'accueil ne change pas un parcours : il faut suivre les liens.
 *
 * ⚠️ Elle se termine désormais par le formulaire lui-même, pas par un lien
 *    vers lui : une page qui a convaincu ne doit pas demander un clic de plus.
 */

const PILIERS = [
  {
    titre: "Vous saurez où vous en êtes, vraiment",
    glyphe: GlyphBalance,
    texte:
      "Vous verrez, noir sur blanc, ce que ChatGPT, Gemini, Claude et Perplexity répondent quand on leur demande un professionnel comme vous — et pourquoi ils citent qui ils citent. Aucune agence ne peut garantir une recommandation ; nous, nous pouvons vous montrer la réalité.",
  },
  {
    titre: "Un résultat que personne ne peut acheter",
    glyphe: GlyphBouclier,
    texte:
      "Ni vous ni vos concurrents ne pouvez infléchir un audit en achetant quoi que ce soit. C'est ce qui vous permet de le poser sur la table d'un conseil d'administration ou d'un financeur sans qu'on vous demande qui l'a payé.",
  },
  {
    titre: "Vous recevez les réponses, pas un score",
    glyphe: GlyphStructure,
    texte:
      "Les questions exactes, les réponses intégrales des assistants, les sources citées, les concurrents nommés à votre place. Un indice qu'on ne peut pas vérifier ne vaut rien ; une réponse qu'on peut relire se discute.",
  },
  {
    titre: "Un audit que vous pouvez rejouer",
    glyphe: GlyphCadenas,
    texte:
      "Date, heure, langue, localisation, environnement de collecte, version du modèle, nombre de répétitions. Une réponse d'IA varie d'un essai à l'autre : sans protocole, une variation du hasard se vend comme un progrès.",
  },
  {
    titre: "Vous saurez ce qui a été mesuré",
    glyphe: GlyphCadeau,
    texte:
      "Chaque réponse du rapport porte son moteur, sa date et son mode de collecte. Copilot et Google AI Overviews n'offrent aucun accès mesurable : ils apparaissent en « non testé », et ne pèsent jamais contre vous dans le résultat.",
  },
  {
    titre: "Une méthode déjà éprouvée en vrai",
    glyphe: GlyphVieLocale,
    texte:
      "Du 20 septembre au 11 novembre 2026 — 52 jours — nos journaux ont compté 14 853 183 requêtes d'agents IA sur mana.bzh et manafrance.org. Nous ne vous proposons rien que nous n'ayons posé sur nos propres sites d'abord.",
  },
];

export function Approche() {
  const L = langueCourante();
  // Une ancre #contact arrive parfois depuis une autre page : on la suit.
  useEffect(() => {
    if (window.location.hash === "#contact") {
      document.getElementById("contact")?.scrollIntoView();
    }
  }, []);

  return (
    <main className="wrap">
      <section className="landing-section bulle">
        <p className="hero-label">{t(L, "Notre approche")}</p>
        <h1 className="section-title">
          {t(L, "Ce que les IA disent de vous, mesuré et documenté.")}
        </h1>
        <p className="section-accroche">
          {t(L, "Le GEO, par Alliance MANA — pour les pros et les structures.")}
        </p>
        {/* ⭐ L'objet statutaire, cité tel qu'il est déclaré — pas reformulé.
            C'est ce qui explique pourquoi un service GEO est porté par une
            association : le but non lucratif n'est pas un argument de vente,
            c'est l'objet même, et il est opposable. */}
        <blockquote className="objet-association">
          <p>{t(L, "Alliance MANA poursuit un but non lucratif et d'intérêt général. Elle a pour objet : rendre, depuis la Bretagne, les territoires et leurs acteurs lisibles et accessibles par tout moyen numérique, y compris l'intelligence artificielle ; concevoir, développer et exploiter tout outil, média, service ou assistant numérique, notamment conversationnel, au service des personnes, des familles et des territoires ; promouvoir une doctrine éthique du numérique et des données personnelles ; valoriser l'économie sociale et solidaire et la vie associative ; exercer, à titre accessoire, toute activité destinée à assurer son financement, en France et à l'international.")}</p>
          <footer>{t(L, "Objet statutaire — association loi du 1er juillet 1901, RNA W292008256")}</footer>
        </blockquote>
        <p className="section-texte">
          {t(L, "Voici, noir sur blanc, ce que nous faisons et ce que nous ne ferons jamais. Si un point vous paraît trop prudent, c'est voulu : une promesse qu'on ne peut pas tenir se paie au premier client.")}
        </p>

        <div className="ia-grid">
          {PILIERS.map((p) => (
            <div key={p.titre} className="ia-bloc">
              <h3 className="label-icone"><p.glyphe size={22} />{t(L, p.titre)}</h3>
              <p>{t(L, p.texte)}</p>
            </div>
          ))}
        </div>

        <div className="est-actions">
          <a className="btn btn-clair" href={lien(`/#offres`)}>
            {t(L, "Voir les offres et les prix")}
          </a>
        </div>
      </section>

      {/* ⭐ Le formulaire EST sur la page. Cette page est la destination de
          « Demander un audit » : y faire atterrir le visiteur pour lui
          demander un clic de plus, c'est le perdre. */}
      <section className="landing-section bulle" id="contact">
        <h2 className="section-title">{t(L, "Demander un audit")}</h2>
        <p className="section-texte">
          {t(L, "Dites-nous qui vous êtes et ce que vous cherchez. Nous répondons avec un devis ou une commande, jamais avec une relance automatique.")}
        </p>
        <ContactForm />
      </section>
    </main>
  );
}
