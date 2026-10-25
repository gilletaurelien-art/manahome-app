import { useEffect, useState } from "react";
import { baseUrl } from "./router";
import {
  Conversation,
  conversationParAnnonce,
  envoyer,
  lireConversations,
  reponseSimulee,
} from "./messagerie";

// Page /messagerie — boîte de réception de l'acheteur (démo : stockage
// local, aucun compte). Règle gravée : coordonnées jamais publiées, la
// mise en relation passe uniquement par ici.

export function Messagerie() {
  useEffect(() => {
    document.title = "Ma messagerie — MANAhome";
    return () => {
      document.title = "MANAhome — Gratuit. Accompagné. Lisible par les IA.";
    };
  }, []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");

  useEffect(() => {
    setConversations(lireConversations());
    const params = new URLSearchParams(window.location.search);
    const annonce = params.get("annonce");
    if (annonce) setActive(annonce);
  }, []);

  const rafraichir = () => setConversations(lireConversations());
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

        {conversations.length === 0 ? (
          <section className="publier-panel">
            <p className="est-erreur">
              Aucune conversation pour l'instant. Contactez un vendeur depuis
              une fiche d'annonce pour ouvrir la messagerie.
            </p>
            <div className="est-actions">
              <a className="btn btn-primary" href={`${B}/annonces/crozon`}>
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
