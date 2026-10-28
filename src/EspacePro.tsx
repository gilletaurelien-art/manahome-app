import { useEffect, useState } from "react";
import { baseUrl } from "./router";
import { PROS } from "./prosDonnees";

// Espace pro — inscription au référentiel (3 états) et dépôt de candidature
// d'annonce pro. Périmètre volontairement MINIMAL : pas d'abonnement, pas de
// monétisation (non tranché par Aurélien), pas d'acte loi Hoguet.
// Règles gravées respectées : statut « vérifié » exige une preuve
// documentaire ; badge obligatoire sur toute annonce pro ; une importée ne
// passe jamais devant une directe à adéquation égale.

interface FormPro {
  raisonSociale: string;
  siren: string;
  categorie: "agence" | "mandataire" | "notaire" | "service_habitat";
  commune: string;
  email: string;
}

const CATEGORIES = [
  { v: "agence", l: "Agence immobilière" },
  { v: "mandataire", l: "Mandataire (carte T ou carte B)" },
  { v: "notaire", l: "Office notarial" },
  { v: "service_habitat", l: "Service à l'habitat (réparation, ménage, jardin, diagnostics…)" },
];

const DEMANDES_CLE = "manahome-demandes-pro-demo";

export function EspacePro() {

  const [form, setForm] = useState<FormPro>({
    raisonSociale: "",
    siren: "",
    categorie: "agence",
    commune: "Crozon",
    email: "",
  });
  const [envoye, setEnvoye] = useState(false);
  const [dejaReference, setDejaReference] = useState<boolean | null>(null);

  // Vérification en direct contre le référentiel affiché (SIREN suffisant en
  // prod : la consolidation vérifiera l'identité côté annuaire officiel)
  const sirenConnu = PROS.some((p) => p.siren === form.siren.trim());

  const valide =
    form.raisonSociale.trim() &&
    /^\d{9}$/.test(form.siren.trim()) &&
    form.commune.trim() &&
    /.+@.+\..+/.test(form.email.trim());

  const soumettre = () => {
    if (!valide) return;
    try {
      const existing = JSON.parse(localStorage.getItem(DEMANDES_CLE) ?? "[]");
      existing.push({ ...form, date: new Date().toISOString() });
      localStorage.setItem(DEMANDES_CLE, JSON.stringify(existing));
    } catch {
      // démo : échec de stockage non bloquant
    }
    setEnvoye(true);
  };

  const B = baseUrl();

  return (
    <main className="publier">
      <div className="wrap">
        <p className="hero-label">Professionnels</p>
        <h1 className="fiche-titre">Rejoindre le référentiel</h1>
        <p className="territoire-intro">
          L'inscription au référentiel est gratuite. Elle fait apparaître
          votre fiche (raison sociale, commune) — sans jamais publier de
          coordonnées. Le statut « vérifié » ne s'obtient qu'avec une preuve
          documentaire ; aucune fiche n'est une recommandation.
        </p>

        {envoye ? (
          <section className="publier-panel" aria-live="polite">
            <p className="apercu-label">Demande enregistrée</p>
            <p className="est-mediane">
              Merci ! Votre demande d'inscription au référentiel est notée.
              (Démo : en production, la consolidation vérifie votre SIREN
              contre l'annuaire officiel et vous demandera la preuve
              documentaire pour le statut « vérifié ».)
            </p>
            <div className="est-actions">
              <a className="btn btn-ghost" href={`${B}/pros`}>
                Voir le référentiel
              </a>
              <button
                className="btn btn-ghost"
                onClick={() => setEnvoye(false)}
              >
                ← Inscrire un autre professionnel
              </button>
            </div>
          </section>
        ) : (
          <section className="publier-panel" aria-label="Inscription pro">
            <div className="champ">
              <label htmlFor="pro-raison">Raison sociale *</label>
              <input
                id="pro-raison"
                placeholder="Ex : Selarl…, SARL…"
                value={form.raisonSociale}
                onChange={(e) =>
                  setForm({ ...form, raisonSociale: e.target.value })
                }
              />
            </div>
            <div className="champ">
              <label htmlFor="pro-siren">SIREN (9 chiffres) *</label>
              <input
                id="pro-siren"
                inputMode="numeric"
                placeholder="123456789"
                value={form.siren}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setForm({ ...form, siren: v });
                  setDejaReference(
                    PROS.some((p) => p.siren === v) ? true : null
                  );
                }}
              />
              {dejaReference && sirenConnu && (
                <p className="champ-aide">
                  Ce SIREN figure déjà au référentiel — votre demande sera
                  traitée comme une mise à jour de fiche.
                </p>
              )}
            </div>
            <div className="champ">
              <label htmlFor="pro-categorie">Catégorie *</label>
              <select
                id="pro-categorie"
                value={form.categorie}
                onChange={(e) =>
                  setForm({ ...form, categorie: e.target.value as FormPro["categorie"] })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.v} value={c.v}>
                    {c.l}
                  </option>
                ))}
              </select>
            </div>
            <div className="champ-grid">
              <div className="champ">
                <label htmlFor="pro-commune">Commune du pilote *</label>
                <input
                  id="pro-commune"
                  placeholder="Crozon"
                  value={form.commune}
                  onChange={(e) =>
                    setForm({ ...form, commune: e.target.value })
                  }
                />
              </div>
              <div className="champ">
                <label htmlFor="pro-email">Email professionnel *</label>
                <input
                  id="pro-email"
                  type="email"
                  placeholder="contact@…"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <p className="champ-aide">
              L'email sert uniquement à la mise en relation pour votre
              inscription — il n'est jamais publié ni revendu (règle gravée).
            </p>
            <div className="publier-nav">
              <span />
              <button
                className="btn btn-primary"
                disabled={!valide}
                onClick={soumettre}
              >
                Envoyer ma demande
              </button>
            </div>
            <p className="ia-disclaimer">
              Aucun abonnement, aucune monétisation à ce stade. MANAhome ne
              réalise aucun acte relevant de la loi Hoguet : pas de mandat,
              pas de négociation, pas de transaction.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
