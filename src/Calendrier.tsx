import { useEffect, useState } from "react";
import { t } from "./i18n";
import { langueCourante } from "./router";
import {
  basculerNuit,
  bloquerPlage,
  libererMois,
  lireIndispos,
  nuiteesDe,
  nuiteesDepuisIcs,
  nuitIso,
} from "./calendrierDonnees";

// Le calendrier de blocage de l'extranet propriétaire — 04/11/2026.
// ⭐ MIROIR FRONT de la migration 007 (`annonces_indisponibilites`) :
// une nuit cliquée est BLOQUÉE (ou libérée), jamais « réservée ». Ce
// composant n'encaisse rien, ne connaît aucun voyageur, aucun montant —
// il est le seul point d'écriture des blocages côté démo, comme le
// trigger `verrouille_nuitees_sejour` l'est côté base.
//
// V2 : blocage par plage (début → fin), import iCal collé (Airbnb/Booking
// exportent en .ics ; les évènements deviennent des BLOCAGES, pas des
// réservations — miroir de `annonces_ical`), libération du mois affiché.
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
  // Mode plage : premier clic = début, second = fin. Null = hors mode.
  const [debutPlage, setDebutPlage] = useState<string | null>(null);
  const [ics, setIcs] = useState("");
  const [rapportIcs, setRapportIcs] = useState<string | null>(null);

  useEffect(() => {
    setIndispos(lireIndispos(annonceId));
  }, [annonceId]);

  const appliquer = (nuits: string[]) => setIndispos(bloquerPlage(annonceId, nuits));

  const cliquerNuit = (nuit: string) => {
    if (debutPlage === null || nuit <= debutPlage) {
      // premier clic, ou clic avant le début : on reprend le début ici
      setDebutPlage(nuit);
      return;
    }
    // second clic après le début : on bloque [début, nuit], bord exclu —
    // la nuit de départ du SÉJOUR suivant reste disponible.
    appliquer(nuiteesDe(debutPlage, nuit));
    setDebutPlage(null);
  };

  const importerIcs = () => {
    const { nuits, ignores } = nuiteesDepuisIcs(ics);
    if (nuits.length === 0) {
      setRapportIcs(t(L, "Aucune nuitée lisible dans ce calendrier."));
      return;
    }
    appliquer(nuits);
    setRapportIcs(
      ignores > 0
        ? t(L, "{n} nuitées bloquées, {i} évènement(s) illisible(s) ignoré(s).")
            .replace("{n}", String(nuits.length))
            .replace("{i}", String(ignores))
        : t(L, "{n} nuitées bloquées.").replace("{n}", String(nuits.length)),
    );
    setIcs("");
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
  const anMois = `${mois.an}-${String(mois.m + 1).padStart(2, "0")}`;
  const bloquesCeMois = indispos.filter((n) => n.startsWith(anMois)).length;

  return (
    <div className="calendrier">
      <div className="calendrier-tete">
        <button
          type="button"
          className="btn btn-ghost"
          aria-label={t(L, "Mois précédent")}
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
          aria-label={t(L, "Mois suivant")}
          onClick={() =>
            setMois((c) => (c.m === 11 ? { an: c.an + 1, m: 0 } : { ...c, m: c.m + 1 }))
          }
        >
          →
        </button>
      </div>

      <div className="calendrier-outils">
        <button
          type="button"
          className={`btn btn-ghost ${debutPlage ? "on" : ""}`}
          aria-pressed={debutPlage !== null}
          onClick={() => {
            setDebutPlage(null);
            // replier/déplier l'import en même temps qu'on quitte la plage
            setRapportIcs(null);
          }}
        >
          {debutPlage
            ? t(L, "Cliquez la nuit de fin…")
            : t(L, "Bloquer une plage")}
        </button>
        {bloquesCeMois > 0 && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIndispos(libererMois(annonceId, anMois))}
          >
            {t(L, "Libérer ce mois")}
          </button>
        )}
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
              onClick={() =>
                debutPlage !== null ? cliquerNuit(nuit) : setIndispos(basculerNuit(annonceId, nuit))
              }
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

      {/* Import iCal : le .ics exporté d'Airbnb/Booking, collé — ses
          évènements deviennent des blocages, jamais des réservations. */}
      <details className="calendrier-ics">
        <summary>{t(L, "Importer un calendrier externe (iCal)")}</summary>
        <div className="champ">
          <label htmlFor={`ics-${annonceId}`}>
            {t(L, "Collez le contenu de votre fichier .ics (Airbnb, Booking…)")}
          </label>
          <textarea
            id={`ics-${annonceId}`}
            rows={4}
            value={ics}
            onChange={(e) => setIcs(e.target.value)}
            placeholder="BEGIN:VCALENDAR…"
          />
          <div className="est-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={importerIcs}
              disabled={!ics.trim()}
            >
              {t(L, "Importer les nuitées occupées")}
            </button>
          </div>
          {rapportIcs && <p className="champ-aide" role="status">{rapportIcs}</p>}
        </div>
      </details>
    </div>
  );
}
