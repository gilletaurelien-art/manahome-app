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
    titre: "Nous mesurons, nous ne promettons pas",
    glyphe: GlyphBalance,
    texte:
      "Aucune agence ne peut garantir qu'un assistant IA vous recommandera : personne ne contrôle ce que répond ChatGPT. Nous mesurons ce qu'ils répondent vraiment, nous le documentons, et nous expliquons pourquoi.",
  },
  {
    titre: "L'audit ne se vend pas lui-même",
    glyphe: GlyphBouclier,
    texte:
      "Nous ne vendons pas ce que nous mesurons. Aucune prestation d'optimisation ne peut modifier les conclusions d'un audit — c'est la seule façon qu'un audit vaille quelque chose.",
  },
  {
    titre: "Vous recevez les réponses, pas un score",
    glyphe: GlyphStructure,
    texte:
      "Les questions exactes, les réponses intégrales des assistants, les sources citées, les concurrents nommés à votre place. Un indice qu'on ne peut pas vérifier ne vaut rien ; une réponse qu'on peut relire se discute.",
  },
  {
    titre: "Reproductible, ou ce n'est pas une mesure",
    glyphe: GlyphCadenas,
    texte:
      "Date, heure, langue, localisation, environnement de collecte, version du modèle, nombre de répétitions. Une réponse d'IA varie d'un essai à l'autre : sans protocole, une variation du hasard se vend comme un progrès.",
  },
  {
    titre: "Ce que nous ne savons pas faire, nous le disons",
    glyphe: GlyphCadeau,
    texte:
      "Microsoft Copilot et Google AI Overviews n'exposent aucun accès permettant de les mesurer sans gratter leur interface. Ils sont déclarés « non testés » dans nos rapports — jamais comptés comme une absence de votre entreprise.",
  },
  {
    titre: "Nous mesurons d'abord chez nous",
    glyphe: GlyphVieLocale,
    texte:
      "Du 20 septembre au 11 novembre 2026, nos journaux ont compté 5 922 180 requêtes d'agents IA sur manafrance.org. Nous ne vous proposons rien que nous n'ayons posé sur nos propres sites d'abord.",
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
          {t(L, "Mesurer ce que les IA répondent. Rien de plus, rien de moins.")}
        </h1>
        <p className="section-accroche">
          {t(L, "Le GEO, par Alliance MANA — pour les pros et les structures.")}
        </p>
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
