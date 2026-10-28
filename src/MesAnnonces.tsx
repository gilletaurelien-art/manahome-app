import { useEffect, useState } from "react";
import { baseUrl } from "./router";
import {
  AnnonceLocale,
  lireAnnoncesLocales,
  changerStatut,
  supprimerAnnonceLocale,
} from "./annoncesLocales";

// /mes-annonces — gestion démo de mes annonces déposées (localStorage).
// Miroir du back : une annonce particulier se dépublie et se supprime
// librement ; la suppression est une exclusion, pas une archive publique.

const STATUT_LABEL: Record<string, string> = {
  publiee: "En ligne",
  depubliee: "Dépubliée",
};

export function MesAnnonces() {
  const [annonces, setAnnonces] = useState<AnnonceLocale[] | null>(null);
  const [publieeId, setPublieeId] = useState<string | null>(null);

  // Le titre est posé par App depuis la table de routes (src/canonique.ts) —
  // plus ici : il doit aussi être injecté dans le HTML livré, et deux copies de
  // la même phrase divergent tôt ou tard.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setPublieeId(p.get("publiee"));
    setAnnonces(lireTout());
  }, []);

  if (annonces === null) return null;

  const rafraichir = () => setAnnonces(lireTout());

  const B = baseUrl();
  const enLigne = annonces.filter((a) => a.statut === "publiee");
  const horsLigne = annonces.filter((a) => a.statut !== "publiee");

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Espace vendeur — démo locale</p>
        <h1 className="fiche-titre">Mes annonces</h1>
        <p className="territoire-intro">
          Vos annonces déposées depuis ce navigateur. Démo locale : en
          production, elles vivront derrière votre compte, avec la même
          liberté — dépublier, remettre en ligne, supprimer définitivement.
        </p>

        {publieeId && (
          <section className="publier-panel">
            <p className="est-resultat">
              Annonce publiée. Elle apparaît dès maintenant dans le catalogue
              du pilote, derrière le badge « Annonce directe de particulier ».
            </p>
            <div className="est-actions">
              <a
                className="btn btn-primary"
                href={`${B}/annonce/${publieeId}`}
              >
                Voir ma fiche publique
              </a>
              <a className="btn btn-ghost" href={`${B}/annonces/crozon`}>
                Voir le catalogue
              </a>
            </div>
          </section>
        )}

        {annonces.length === 0 ? (
          <section className="publier-panel">
            <p className="territoire-intro">
              Aucune annonce pour l'instant. La publication est gratuite, sans
              commission — trois étapes suffisent.
            </p>
            <div className="est-actions">
              <a className="btn btn-primary" href={`${B}/publier`}>
                Publier mon annonce — gratuit
              </a>
            </div>
          </section>
        ) : (
          <ul className="listings">
            {[...enLigne, ...horsLigne].map((a) => (
              <li key={a.id} className="annonce-vendeur">
                <div>
                  <p className="fiche-lieu">{a.lieu}</p>
                  <p className="annonce-vendeur-titre">{a.titre}</p>
                  <p className="annonce-vendeur-meta">
                    {a.prix.toLocaleString("fr-FR")} €
                    {a.surface ? ` · ${a.surface.toLocaleString("fr-FR")} m²` : ""}
                    {a.pieces ? ` · ${a.pieces} pièces` : ""} ·{" "}
                    {STATUT_LABEL[a.statut]}
                  </p>
                </div>
                <div className="annonce-vendeur-actions">
                  {a.statut === "publiee" && (
                    <a className="btn btn-ghost" href={`${B}/annonce/${a.id}`}>
                      Voir
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      changerStatut(
                        a.id,
                        a.statut === "publiee" ? "depubliee" : "publiee"
                      );
                      rafraichir();
                    }}
                  >
                    {a.statut === "publiee" ? "Dépublier" : "Remettre en ligne"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      supprimerAnnonceLocale(a.id);
                      rafraichir();
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="publier-note">
          Aucune donnée identifiante n'est stockée : l'e-mail saisi au dépôt
          n'est pas conservé, la mise en relation se fait par messagerie
          interne. Suppression = exclusion définitive.
        </p>
      </div>
    </main>
  );
}

function lireTout(): AnnonceLocale[] {
  const toutes = lireAnnoncesLocales();
  return [
    ...toutes.filter((a) => a.statut === "publiee"),
    ...toutes.filter((a) => a.statut !== "publiee"),
  ];
}
