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
import { lireSejoursApi, gesteSejourApi, type SejourApi } from "./apiSejours";
import {
  lireConversationsApi,
  lireMessagesApi,
  envoyerMessageApi,
  type ConversationApi,
  type MessageApi,
} from "./apiMessagerie";

// Page /messagerie — boîte de réception du voyageur (démo : stockage
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

// ⭐ FEATURE_BACK (module séjours, côté gestion) : sous le flag, la liste
// et les gestes partent au service — le cycle affiché est le même, la base
// tranche (trigger 007), le front traduit. Repli démo intégral.
const featureBack = typeof __FEATURE_BACK__ !== "undefined" && __FEATURE_BACK__;

export function Messagerie() {

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [sejoursApi, setSejoursApi] = useState<SejourApi[] | null>(null);
  // ⭐ FEATURE_BACK (module messagerie) : conversations et messages via
  // l'API — participation vérifiée dans le SQL, repli démo intégral.
  const [conversationsApi, setConversationsApi] = useState<ConversationApi[] | null>(null);
  const [messagesApi, setMessagesApi] = useState<MessageApi[] | null>(null);

  useEffect(() => {
    setConversations(lireConversations());
    setSejours(lireSejours());
    if (featureBack) {
      lireSejoursApi().then((r) => {
        if (r.ok && r.sejours) setSejoursApi(r.sejours);
      });
      lireConversationsApi().then((r) => {
        // ok=false (pas connecté, back absent) : conversationsApi reste
        // null et la liste DÉMO s'affiche — jamais un panneau vide
        if (r.ok && r.donnees) setConversationsApi(r.donnees);
      });
    }
    const params = new URLSearchParams(window.location.search);
    const annonce = params.get("annonce");
    if (annonce) setActive(annonce);
  }, []);

  const rafraichir = () => setConversations(lireConversations());
  // Les gestes du séjour RECHARGENT aussi le stockage des nuitées : une
  // confirmation bloque les dates (miroir du trigger 007) et l'écran des
  // annonces doit le refléter au prochain montage — pas mentir par cache.
  const rafraichirSejours = () => setSejours(lireSejours());
  const rafraichirApi = () => {
    lireSejoursApi().then((r) => {
      if (r.ok && r.sejours) setSejoursApi(r.sejours);
    });
  };
  const couranteApi = conversationsApi?.find((c) => c.annonce_id === active) ?? null;
  useEffect(() => {
    if (!featureBack || !couranteApi) {
      setMessagesApi(null);
      return;
    }
    let ignore = false;
    lireMessagesApi(couranteApi.id).then((r) => {
      if (!ignore) setMessagesApi(r.ok && r.donnees ? r.donnees : []);
    });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, couranteApi?.id]);
  const courante = conversations.find((c) => c.annonceId === active);

  const envoyerMessage = () => {
    if (!brouillon.trim()) return;
    if (featureBack && couranteApi && messagesApi !== null) {
      // le serveur vérifie la participation dans le SQL ; aucun message
      // simulé ne s'ajoute jamais en mode réel
      envoyerMessageApi(couranteApi.id, brouillon).then((r) => {
        if (r.ok && r.donnees) {
          setMessagesApi([...messagesApi, r.donnees]);
        }
      });
      setBrouillon("");
      return;
    }
    if (!courante) return;
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
          Les échanges entre voyageurs et propriétaires passent par la messagerie
          interne : aucune coordonnée n'est exposée, rien n'est revendu.
        </p>

        {sejours.length > 0 && (
          <section className="publier-panel" aria-label="Mes séjours">
            <p className="apercu-label">{t(langueCourante(), "Mes séjours")}</p>
            <p className="champ-aide">
              {t(langueCourante(), "Démo locale : ce navigateur joue les deux rôles — vous voyez la demande du voyageur ET les commandes de l'hôte. En production, chaque côté ne voit que le sien, et aucun paiement ne transite ici.")}
            </p>
            {sejoursApi !== null ? (
            <ul className="sejours-liste">
              {sejoursApi.map((s) => (
                <li key={s.id} className="sejour-item">
                  <div>
                    <p className="annonce-vendeur-titre">{s.titre ?? s.annonce_id}</p>
                    <p className="annonce-vendeur-meta">
                      {s.arrivee} → {s.depart} · {s.voyageurs_nb}{" "}
                      {t(langueCourante(), "voyageur(s)")} ·{" "}
                      {t(langueCourante(), STATUT_SEJOUR[s.statut] ?? s.statut)}
                    </p>
                  </div>
                  <div className="annonce-vendeur-actions">
                    {s.statut === "demande_envoyee" && (
                      <button type="button" className="btn btn-ghost"
                        onClick={() => gesteSejourApi(s.id, "accepter").then(rafraichirApi)}>
                        {t(langueCourante(), "Accepter")}
                      </button>
                    )}
                    {(s.statut === "acceptee" || s.statut === "paiement_attendu") && (
                      <button type="button" className="btn btn-primary"
                        onClick={() => gesteSejourApi(s.id, "confirmer").then(rafraichirApi)}>
                        {t(langueCourante(), "Confirmer le séjour")}
                      </button>
                    )}
                    {s.statut === "confirmee" && (
                      <button type="button" className="btn btn-ghost"
                        onClick={() => gesteSejourApi(s.id, "cloturer").then(rafraichirApi)}>
                        {t(langueCourante(), "Clôturer")}
                      </button>
                    )}
                    {s.statut !== "annulee" && s.statut !== "cloturee" && (
                      <button type="button" className="btn btn-ghost"
                        onClick={() => gesteSejourApi(s.id, "annuler").then(rafraichirApi)}>
                        {t(langueCourante(), "Annuler")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            ) : (
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
            )}
          </section>
        )}

        {(conversationsApi !== null ? conversationsApi.length === 0 : conversations.length === 0) ? (
          <section className="publier-panel">
            <p className="est-erreur">
              Aucune conversation pour l'instant. Contactez un propriétaire depuis
              une fiche d'annonce pour ouvrir la messagerie.
            </p>
            <div className="est-actions">
              <a className="btn btn-primary" href={lien(`/annonces/crozon`)}>
                Voir les annonces
              </a>
            </div>
          </section>
        ) : (
          <div className="messagerie-grille">
            <aside className="messagerie-liste" aria-label="Conversations">
              {conversationsApi !== null
                ? conversationsApi.map((c) => (
                    <button
                      key={c.id}
                      className={`messagerie-item${
                        c.annonce_id === active ? " on" : ""
                      }`}
                      onClick={() => setActive(c.annonce_id)}
                    >
                      <span className="messagerie-item-titre">
                        {c.titre ?? c.annonce_id}
                      </span>
                      <span className="messagerie-item-date">
                        {new Date(c.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </button>
                  ))
                : conversations.map((c) => (
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
              {conversationsApi !== null && !couranteApi ? (
                <p className="territoire-intro">
                  Choisissez une conversation à gauche.
                </p>
              ) : conversationsApi !== null && couranteApi && messagesApi !== null ? (
                <>
                  <p className="apercu-label">{couranteApi.titre ?? couranteApi.annonce_id}</p>
                  <div className="messagerie-messages">
                    {messagesApi.map((m, i) => (
                      <div key={`${m.created_at}-${i}`} className="msg">
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
                </>
              ) : !courante ? (
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
                  {!featureBack && (
                    <p className="ia-disclaimer">
                      Démo : stockage local, aucune donnée transmise. En
                      production, chaque message passe par le serveur, chiffré
                      en transit, visible uniquement des participants (RLS).
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
