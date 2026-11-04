import { useEffect, useState } from "react";
import { t } from "./i18n";
import { langueCourante } from "./router";
import { inscription, connexion, deconnexion, moi, type EtatSession } from "./apiSession";

// Panneau de session de l'extranet — affiché SOUS FEATURE_BACK seulement.
// ⭐ Le module calendrier est un module PROPRIÉTAIRE : la session est son
// prérequis, et le propriétaire doit voir son état (connecté, à quel email)
// sans chercher. Le cookie est HttpOnly : ce panneau ne le lit jamais, il
// demande au serveur qui il sert (/api/auth/moi).
//
// Garde d'honnêteté : les erreurs se disent en phrases, jamais en codes.
// « Inscription impossible » sans dire si l'email existe — pas d'annuaire.

const featureBack = typeof __FEATURE_BACK__ !== "undefined" && __FEATURE_BACK__;

export function AuthPanel() {
  const L = langueCourante();
  const [etat, setEtat] = useState<EtatSession | null>(null);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!featureBack) return;
    moi().then(setEtat);
  }, []);

  if (!featureBack) return null;

  const tenterInscription = async () => {
    const r = await inscription(email, motDePasse);
    setEtat(r);
    setMessage(r.connecte ? null : t(L, "Inscription impossible — vérifiez votre email et un mot de passe de 10 caractères minimum."));
  };

  const tenterConnexion = async () => {
    const r = await connexion(email, motDePasse);
    setEtat(r);
    setMessage(r.connecte ? null : t(L, "Identifiants invalides."));
  };

  const seDeconnecter = async () => {
    await deconnexion();
    setEtat({ connecte: false });
    setMessage(null);
  };

  return (
    <section className="publier-panel" aria-label={t(L, "Mon compte")}>
      <p className="apercu-label">{t(L, "Mon compte")}</p>
      {etat === null ? (
        <p className="champ-aide" role="status">{t(L, "…")}</p>
      ) : etat.connecte ? (
        <div className="est-actions">
          <p className="champ-aide">{etat.email}</p>
          <button type="button" className="btn btn-ghost" onClick={seDeconnecter}>
            {t(L, "Se déconnecter")}
          </button>
        </div>
      ) : (
        <>
          <div className="champ-grid">
            <div className="champ">
              <label htmlFor="auth-email">{t(L, "Email")}</label>
              <input id="auth-email" type="email" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="champ">
              <label htmlFor="auth-mdp">{t(L, "Mot de passe")}</label>
              <input id="auth-mdp" type="password" autoComplete="current-password"
                value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            </div>
          </div>
          {message && <p className="est-erreur" role="alert">{message}</p>}
          <div className="est-actions">
            <button type="button" className="btn btn-primary" onClick={tenterConnexion} disabled={!email || !motDePasse}>
              {t(L, "Se connecter")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={tenterInscription} disabled={!email || !motDePasse}>
              {t(L, "Créer mon compte")}
            </button>
          </div>
          <p className="champ-aide">
            {t(L, "Les nuitées de vos annonces réelles se gèrent avec votre compte ; sans compte, le calendrier de démonstration reste actif.")}
          </p>
        </>
      )}
    </section>
  );
}
