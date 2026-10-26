import { useEffect } from "react";
import { baseUrl } from "./router";

// Mentions légales — page minimale, honnête : pas d'acte loi Hoguet,
// pas de revente de données, hébergement GitHub Pages.
// L'éditeur complet (raison sociale, adresse, SIREN) sera publié
// avec la structure définitive de l'association/entreprise MANA.

export function MentionsLegales() {
  useEffect(() => {
    document.title = "Mentions légales — MANAhome";
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, []);

  const B = baseUrl();

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Informations légales</p>
        <h1 className="fiche-titre">Mentions légales</h1>

        <section className="publier-panel">
          <p className="apercu-label">Éditeur</p>
          <p className="territoire-intro">
            MANAhome est édité par l'écosystème MANA (mana.bzh, mana.love,
            manafrance.org), dans le cadre du pilote territorial de Crozon
            (Finistère). Les coordonnées complètes de l'éditeur seront
            publiées avec la structure juridique définitive du projet.
          </p>
        </section>

        <section className="publier-panel">
          <p className="apercu-label">Hébergement</p>
          <p className="territoire-intro">
            Site statique hébergé sur GitHub Pages (GitHub, Inc.). Aucune
            donnée personnelle n'est collectée par le site en l'état : les
            fonctionnalités de démonstration (annonces, messagerie) restent
            locales à votre navigateur.
          </p>
        </section>

        <section className="publier-panel">
          <p className="apercu-label">Nature du service</p>
          <p className="territoire-intro">
            MANAhome est une plateforme d'affichage et d'accompagnement. Elle
            ne réalise aucun acte réglementé par la loi Hoguet (n° 70-9) :
            pas de mandat, pas de négociation, pas de transaction. Les
            estimations fournies sont indicatives et sans valeur
            contractuelle.
          </p>
        </section>

        <section className="publier-panel">
          <p className="apercu-label">Données personnelles</p>
          <p className="territoire-intro">
            Aucune donnée ni lead n'est revendu. Les coordonnées ne sont
            jamais publiées : la mise en relation se fait par messagerie
            interne. Vous pouvez demander la suppression de vos données à
            tout moment — la suppression est une exclusion définitive.
          </p>
        </section>

        <div className="est-actions">
          <a className="btn btn-ghost" href={`${B}/approche`}>
            Notre approche
          </a>
          <a className="btn btn-primary" href={`${B}/`}>
            Retour à l'accueil
          </a>
        </div>
      </div>
    </main>
  );
}
