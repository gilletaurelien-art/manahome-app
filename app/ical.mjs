// Import iCal côté serveur — chantier 5.
//
// ⭐ TROIS GARDES HÉRITÉES.
// 1. UN ÉVÈNEMENT ICAL EST UN BLOCAGE, JAMAIS UNE RÉSERVATION : l'iCal dit
//    « occupé », il ne dit pas pour qui ni pour combien (miroir exact de
//    `annonces_ical` et du parseur front).
// 2. LE RÉ-IMPORT REMPLACE SA PROPRE TRACE : les nuitées du dernier import
//    sont mémorisées (migration 009) — retirer/remplacer ne touche jamais
//    les blocages manuels de l'hôte ni les nuits confirmées (cause ciblée).
// 3. HTTPS UNIQUEMENT, TIMEOUT COURT : l'URL vient de l'hôte ; on ne sonde
//    pas le réseau interne du conteneur (file://, http, localhost refusés).

/** Déplie les lignes iCal (RFC 5545 : une continuation commence par une espace). */
function deplierLignes(texte) {
  const lignes = [];
  for (const brute of texte.split(/\r?\n/)) {
    if (/^[ \t]/.test(brute) && lignes.length) {
      lignes[lignes.length - 1] += brute.slice(1);
    } else {
      lignes.push(brute);
    }
  }
  return lignes;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** La partie date d'une valeur DTSTART/DTEND : DATE ou DATE-TIME (Z ignoré). */
function dateDeValeur(valeur) {
  const m = String(valeur).match(/^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z?)?$/);
  if (!m) return null;
  const [a, mo, j] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  if (!ISO.test(iso)) return null;
  const d = new Date(Date.UTC(a, mo - 1, j));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) {
    return null;
  }
  return iso;
}

/** Les nuitées d'une plage [arrivée, départ[, bord exclu — la sémantique du cycle. */
export function nuiteesDe(arrivee, depart) {
  const sortie = [];
  if (!dateDeValeur(arrivee.replaceAll("-", "")) || !dateDeValeur(depart.replaceAll("-", ""))) {
    return sortie;
  }
  const fin = Date.parse(`${depart}T00:00:00Z`);
  for (
    let t = Date.parse(`${arrivee}T00:00:00Z`);
    t < fin;
    t += 24 * 60 * 60 * 1000
  ) {
    const d = new Date(t);
    sortie.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
  }
  return sortie;
}

/**
 * Les nuitées bloquées d'un contenu iCal, et le nombre d'évènements ignorés
 * — cacher une erreur de parse transformerait un import silencieusement
 * faux en confiance de façade. Miroir du parseur front (calendrierDonnees.ts).
 */
export function nuiteesDepuisIcs(texte) {
  if (!texte.includes("BEGIN:VEVENT")) return { nuits: [], ignores: 0 };
  const lignes = deplierLignes(texte);
  const nuits = new Set();
  let ignores = 0;
  let debut = null;
  let fin = null;
  const clore = () => {
    if (debut && fin && fin > debut) {
      for (const n of nuiteesDe(debut, fin)) nuits.add(n);
    } else if (debut && !fin) {
      nuits.add(debut); // pas de DTEND : une nuitée unique
    } else if (debut === null && fin === null && dansEvenement) {
      ignores += 1;
    }
    debut = null;
    fin = null;
  };
  let dansEvenement = false;
  for (const ligne of lignes) {
    if (/^BEGIN:VEVENT$/i.test(ligne)) {
      dansEvenement = true;
      debut = null;
      fin = null;
    } else if (/^END:VEVENT$/i.test(ligne)) {
      clore();
      dansEvenement = false;
    } else if (/^DTSTART[;:]/i.test(ligne)) {
      debut = dateDeValeur(ligne.split(":").slice(1).join(":").trim());
    } else if (/^DTEND[;:]/i.test(ligne)) {
      fin = dateDeValeur(ligne.split(":").slice(1).join(":").trim());
    }
  }
  return { nuits: [...nuits].sort(), ignores };
}

/** Une URL iCal acceptée : https uniquement, jamais localhost ni fichier. */
export function urlValide(u) {
  if (typeof u !== "string") return false;
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const h = parsed.hostname.toLowerCase();
  return !(h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h.endsWith(".local"));
}

/** Récupère un .ics — timeout court, taille plafonnée (un calendrier honnête est petit). */
export async function telechargerIcs(url, { fetchImpl = fetch, timeoutMs = 10000, maxOctets = 2_000_000 } = {}) {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, { signal: controleur.signal, redirect: "follow" });
    if (!r.ok) return { ok: false, erreur: "calendrier inaccessible" };
    const texte = await r.text();
    if (texte.length > maxOctets) return { ok: false, erreur: "calendrier trop volumineux" };
    return { ok: true, texte };
  } catch {
    return { ok: false, erreur: "calendrier inaccessible" };
  } finally {
    clearTimeout(minuteur);
  }
}

/** Le delta d'un ré-import : retirer l'ancienne trace, poser la nouvelle. */
export function deltaImport(anciennes, nouvelles) {
  const ancien = new Set(anciennes);
  const neuf = new Set(nouvelles);
  return {
    aPoser: [...neuf].filter((n) => !ancien.has(n)),
    aRetirer: [...ancien].filter((n) => !neuf.has(n)),
    stables: [...neuf].filter((n) => ancien.has(n)),
  };
}
