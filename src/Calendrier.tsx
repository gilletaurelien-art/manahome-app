import { useEffect, useState } from "react";
import { t } from "./i18n";
import { langueCourante } from "./router";
import { basculerNuit, lireIndispos, nuitIso } from "./calendrierDonnees";

// Le calendrier de blocage de l'extranet propriétaire — 04/11/2026.
// ⭐ MIROIR FRONT de la migration 007 (`annonces_indisponibilites`) :
// une nuit cliquée est BLOQUÉE (ou libérée), jamais « réservée ». Ce
// composant n'encaisse rien, ne connaît aucun voyageur, aucun montant —
// il est le seul point d'écriture des blocages côté démo, comme le
// trigger `verrouille_nuitees_sejour` l'est côté base.
//
// ACCESSIBILITÉ : chaque nuitée est un bouton portant son état en texte
// (bloquée / disponible) — jamais une couleur seule, le daltonisme est
// un utilisateur sur douze.

const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function Calendrier({ annonceId }: { annonceId: string }) {
  const L = langueCourante();
  const [indispos, setIndispos] = useState<string[]>([]);
  const [mois, setMois] = useState(() => {
    const d = new Date();
    return { an: d.getFullYear(), m: d.getMonth() };
  });

  useEffect(() => {
    setIndispos(lireIndispos(annonceId));
  }, [annonceId]);

  const basculer = (nuit: string) => {
    setIndispos(basculerNuit(annonceId, nuit));
  };

  const premiere = new Date(mois.an, mois.m, 1);
  const nbJours = new Date(mois.an, mois.m + 1, 0).getDate();
  // Lundi = colonne 0 : Date.getDay() compte dimanche = 0 → décalage.
  const decalage = (premiere.getDay() + 6) % 7;
  const cellules: (string | null)[] = [
    ...Array(decalage).fill(null),
    ...Array.from({ length: nbJours }, (_, i) => nuitIso(new Date(mois.an, mois.m, i + 1))),
  ];
  const aujourdhui = nuitIso(new Date());

  return (
    <div className="calendrier">
      <div className="calendrier-tete">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            setMois((c) => (c.m === 0 ? { an: c.an - 1, m: 11 } : { ...c, m: c.m - 1 }))
          }
        >
          ←
        </button>
        <p className="calendrier-mois">
          {t(L, MOIS[mois.m])} {mois.an}
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            setMois((c) => (c.m === 11 ? { an: c.an + 1, m: 0 } : { ...c, m: c.m + 1 }))
          }
        >
          →
        </button>
      </div>
      <div className="calendrier-grille" role="grid">
        {JOURS.map((j) => (
          <span key={j} className="calendrier-entete" role="columnheader">
            {t(L, j)}
          </span>
        ))}
        {cellules.map((nuit, i) =>
          nuit === null ? (
            <span key={`vide-${i}`} aria-hidden="true" />
          ) : (
            <button
              key={nuit}
              type="button"
              role="gridcell"
              className={`calendrier-nuit ${indispos.includes(nuit) ? "bloquee" : ""}`}
              aria-pressed={indispos.includes(nuit)}
              aria-label={`${nuit} — ${indispos.includes(nuit) ? t(L, "bloquée") : t(L, "disponible")}`}
              onClick={() => basculer(nuit)}
            >
              {Number(nuit.slice(8))}
              {nuit === aujourdhui && <span className="calendrier-auj" aria-hidden="true" />}
            </button>
          ),
        )}
      </div>
      <p className="calendrier-note">
        {t(
          L,
          "Cliquez une nuitée pour la bloquer ou la libérer. Bloquer n'est pas réserver : MANAhome n'encaisse aucun paiement, et une nuitée non bloquée reste disponible partout où vous diffusez.",
        )}
      </p>
    </div>
  );
}
