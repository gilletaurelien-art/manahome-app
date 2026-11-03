import { useEffect, useState } from "react";
import { baseUrl , lien} from "./router";
import {
  Conversation,
  conversationParAnnonce,
  envoyer,
  lireConversations,
  reponseSimulee,
} from "./messagerieDonnees";
import { t } from "./i18n";
import { langueCourante } from "./router";
import {
  lireSejours,
  accepterSejour,
  confirmerSejour,
  annulerSejour,
  cloreSejour,
  type Sejour,
} from "./sejoursDonnees";

// Page /messagerie — boîte de réception de l'acheteur (démo : stockage
// local, aucun compte). Règle gravée : coordonnées jamais publiées, la
// mise en relation passe uniquement par ici.

// Le statut du séjour, le vocabulaire de la base — rien d'inventé.
const STATUT_SEJOUR: Record<string, string> = {
  demande_envoyee: "demande envoyée",
  acceptee: "acceptée",
  paiement_attendu: "paiement attendu",
  confirmee: "confirmé — nuitées bloquées",
  annulee: "annulé",
  cloturee: "terminé",
};

export function Messagerie() {

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const [sejours, setSejours] = useState<Sejour[]>([]);

  useEffect(() => {
    setConversations(lireConversations());
    setSejours(lireSejours());
    const params = new URLSearchParams(window.location.search);
    const annonce = params.get("annonce");
    if (annonce) setActive(annonce);
  }, []);

  const rafraichir = () => setConversations(lireConversations());
  // Les gestes du séjour RECHARGENT aussi le stockage des nuitées : une
  // confirmation bloque les dates (miroir du trigger 007) et l'écran des
  // annonces doit le refléter au prochain montage — pas mentir par cache.
  const rafraichirSejours = () => setSejours(lireSejours());
  const courante = conversations.find((c) => c.annonceId === active);

  const envoyerMessage = () => {
    if (!courante || !brouillon.trim()) return;
    envoyer(courante.id, brouillon);
    reponseSimulee(courante.id);
    setBrouillon("");
    rafraichir();
  };

  const B = baseUrl();

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Mise en relation protégée</p>
        <h1 className="fiche-titre">Ma messagerie</h1>
        <p className="territoire-intro">
          Les échanges entre acheteurs et vendeurs passent par la messagerie
          interne : aucune coordonnée n'est exposée, rien n'est revendu.
        </p>

        {sejours.length > 0 && (
          <section className="publier-panel" aria-label="Mes séjours">
            <p className="apercu-label">{t(langueCourante(), "Mes séjours")}</p>
            <p className="champ-aide">
              {t(langueCourante(), "Démo locale : ce navigateur joue les deux rôles — vous voyez la demande du voyageur ET les commandes de l'hôte. En production, chaque côté ne voit que le sien, et aucun paiement ne transite ici.")}
            </p>
            <ul className="sejours-liste">
              {sejours.map((s) => (
                <li key={s.id} className="sejour-item">
                  <div>
                    <p className="annonce-vendeur-titre">{s.annonceTitre}</p>
                    <p className="annonce-vendeur-meta">
                      {s.arrivee} → {s.depart} · {s.voyageursNb}{" "}
                      {t(langueCourante(), "voyageur(s)")} ·{" "}
                      {t(langueCourante(), STATUT_SEJOUR[s.statut])}
                    </p>
                  </div>
                  <div className="annonce-vendeur-actions">
                    {s.statut === "demande_envoyee" && (
                      <button type="button" className="btn btn-ghost"
                        onClick={() => { accepterSejour(s.id); rafraichirSejours(); }}>
                        {t(langueCourante(), "Accepter")}
                      </button>
                    )}
                    {(s.statut === "acceptee" || s.statut === "paiement_attendu") && (
                      <button type="button" className="btn btn-primary"
                        onClick={() => { confirmerSejour(s.id); rafraichirSejours(); }}>
                        {t(langueCourante(), "Confirmer le séjour")}
                      </button>
                    )}
                    {s.statut === "confirmee" && (
                      <button type="button" className="btn btn-ghost"
                        onClick={() => { cloreSejour(s.id); rafraichirSejours(); }}>
                        {t(langueCourante(), "Clôturer")}
                      </button>
                    )}
                    {s.statut !== "annulee" && s.statut !== "cloturee" && (
                      <button type="button" className="btn btn-ghost"
                        onClick={() => { annulerSejour(s.id); rafraichirSejours(); }}>
                        {t(langueCourante(), "Annuler")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {conversations.length === 0 ? (
          <section className="publier-panel">
            <p className="est-erreur">
              Aucune conversation pour l'instant. Contactez un vendeur depuis
              une fiche d'annonce pour ouvrir la messagerie.
            </p>
            <div className="est-actions">
              <a className="btn btn-primary" href={lien(`/annonces/crozon`)}>
                Voir les annonces du pilote
              </a>
            </div>
          </section>
        ) : (
          <div className="messagerie-grille">
            <aside className="messagerie-liste" aria-label="Conversations">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  className={`messagerie-item${
                    c.annonceId === active ? " on" : ""
                  }`}
                  onClick={() => setActive(c.annonceId)}
                >
                  <span className="messagerie-item-titre">{c.annonceTitre}</span>
                  <span className="messagerie-item-date">
                    {new Date(c.dernierLe).toLocaleDateString("fr-FR")}
                  </span>
                </button>
              ))}
            </aside>
            <section className="publier-panel messagerie-fil" aria-live="polite">
              {!courante ? (
                <p className="territoire-intro">
                  Choisissez une conversation à gauche.
                </p>
              ) : (
                <>
                  <p className="apercu-label">{courante.annonceTitre}</p>
                  <div className="messagerie-messages">
                    {courante.messages.map((m) => (
                      <div key={m.id} className={`msg msg-${m.auteur}`}>
                        {m.corps}
                      </div>
                    ))}
                  </div>
                  <div className="messagerie-envoi">
                    <input
                      value={brouillon}
                      placeholder="Votre message…"
                      aria-label="Votre message"
                      onChange={(e) => setBrouillon(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={envoyerMessage}
                      disabled={!brouillon.trim()}
                    >
                      Envoyer
                    </button>
                  </div>
                  <p className="ia-disclaimer">
                    Démo : stockage local, aucune donnée transmise. En
                    production, chaque message passe par le serveur, chiffré
                    en transit, visible uniquement des participants (RLS).
                  </p>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
