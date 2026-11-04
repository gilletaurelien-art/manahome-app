// Indisponibilités démo (localStorage) — miroir front de la table
// `annonces_indisponibilites` (migration 007).
//
// ⭐ TROIS CHOIX QUI VIENNENT DE LA MIGRATION, PAS DU CONFORT.
// 1. ON NE STOCKE QUE LES BLOCAGES : une nuit non listée est disponible.
//    L'inverse (stocker les disponibilités) rendrait chaque nuitée oubliée
//    une réservation fantôme — le défaut le plus coûteux d'un calendrier.
// 2. LE CALENDRIER N'ENCAISSE RIEN : bloquer une nuitée n'est pas réserver.
//    Aucun statut, aucun voyageur, aucun montant ici — seulement des
//    exceptions sur blocage, exactement comme en base.
// 3. UTC PARTOUT : une nuitée est une DATE (pas un timestamp). Elle est
//    calculée et stockée en ISO (`YYYY-MM-DD`) — jamais en heure locale,
//    sinon la même nuit change de jour selon le fuseau du navigateur.

const CLE = "manahome-indispos-demo";

/** La date locale d'un timestamp, en ISO — une NUITÉ est une date. */
export function nuitIso(d: Date): string {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${a}-${m}-${j}`;
}

/** Une date ISO est-elle valide et bien formée ? */
export function estNuitValide(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  return !Number.isNaN(d.getTime()) && nuitIso(d) === s;
}

function lireTout(): Record<string, string[]> {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return {};
    const parse = JSON.parse(brut) as Record<string, unknown>;
    const sortie: Record<string, string[]> = {};
    for (const [id, nuits] of Object.entries(parse)) {
      if (Array.isArray(nuits)) {
        sortie[id] = nuits.filter(
          (n): n is string => typeof n === "string" && estNuitValide(n),
        );
      }
    }
    return sortie;
  } catch {
    // JSON corrompu : repartir de zéro plutôt que de briser la page —
    // un blocage perdu se repose, une page morte ne se récupère pas.
    return {};
  }
}

// Les deux gestes du stockage, isolés pour que bloquerPlage/libererMois
// écrivent EXACTEMENT comme basculerNuit — trois chemins d'écriture, c'est
// deux de trop pour une même clé localStorage.
function lireToutStockage(): Record<string, string[]> {
  return lireTout();
}
function ecrireStockage(tout: Record<string, string[]>): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(tout));
  } catch {
    // quota dépassé : la démo continue en lecture (même doctrine que
    // basculerNuit — l'UI reverra l'état précédent au remontage).
  }
}

/** Les nuitées bloquées d'une annonce, triées. */
export function lireIndispos(id: string): string[] {
  return [...(lireTout()[id] ?? [])].sort();
}

/** Bloque ou libère une nuit — bascule idempotente par date ISO. */
export function basculerNuit(id: string, nuit: string): string[] {
  if (!estNuitValide(nuit)) return lireIndispos(id);
  const tout = lireTout();
  const actuelles = tout[id] ?? [];
  const futures = actuelles.includes(nuit)
    ? actuelles.filter((n) => n !== nuit)
    : [...actuelles, nuit];
  if (futures.length === 0) delete tout[id];
  else tout[id] = [...futures].sort();
  try {
    localStorage.setItem(CLE, JSON.stringify(tout));
  } catch {
    // quota dépassé : la démo continue en lecture, l'UI reverra l'état
    // précédent au prochain montage plutôt que de mentir à l'écran.
  }
  return lireIndispos(id);
}

/** Les nuitées d'une plage [arrivée, départ[, en ISO — bord exclu. */
export function nuiteesDe(arrivee: string, depart: string): string[] {
  const sortie: string[] = [];
  if (!estNuitValide(arrivee) || !estNuitValide(depart)) return sortie;
  const fin = new Date(`${depart}T00:00:00`).getTime();
  for (
    let d = new Date(`${arrivee}T00:00:00`);
    d.getTime() < fin;
    d.setDate(d.getDate() + 1)
  ) {
    sortie.push(nuitIso(d));
  }
  return sortie;
}

// ===== Import iCal : les nuitées d'un .ics deviennent des blocages =====
//
// ⭐ POURQUOI PAR TEXTE COLLÉ, PAS PAR URL (V2 démo). L'import vise le flux
// réel du propriétaire : il exporte son calendrier Airbnb/Booking (.ics) et
// le colle ici. Un fetch direct vers ces URLs se heurterait au CORS et
// exigerait un proxy serveur — en production seulement. Le parseur, lui,
// est déjà le bon : DATE ou DATE-TIME, lignes repliées, bord exclu.
//
// 🛑 AUCUN évènement ne devient une « réservation » : tout devient cause
// 'blocage' (nuitée indisponible), miroir exact de `annonces_ical` en 007 —
// l'iCal dit « occupé », il ne dit pas pour qui ni pour combien.

/** Déplie les lignes iCal (RFC 5545 : une continuation commence par une espace). */
function deplierLignes(texte: string): string[] {
  const lignes: string[] = [];
  for (const brute of texte.split(/\r?\n/)) {
    if (/^[ \t]/.test(brute) && lignes.length) {
      lignes[lignes.length - 1] += brute.slice(1);
    } else {
      lignes.push(brute);
    }
  }
  return lignes;
}

/** La partie date d'une valeur DTSTART/DTEND : DATE ou DATE-TIME (Z ignoré). */
function dateDeValeur(valeur: string): string | null {
  const m = valeur.match(/^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z?)?$/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  return estNuitValide(iso) ? iso : null;
}

/**
 * Les nuitées bloquées d'un contenu iCal, et le nombre d'évènements
 * ignorés (mal formés) — cacher une erreur de parse transformerait un
 * import « silencieusement faux » en confiance de façade.
 */
export function nuiteesDepuisIcs(texte: string): { nuits: string[]; ignores: number } {
  const dansEvenement = texte.includes("BEGIN:VEVENT");
  if (!dansEvenement) return { nuits: [], ignores: 0 };
  const lignes = deplierLignes(texte);
  const nuits = new Set<string>();
  let ignores = 0;
  let debut: string | null = null;
  let fin: string | null = null;
  let vevent = false;
  const clore = () => {
    if (debut && fin && fin > debut) {
      for (const n of nuiteesDe(debut, fin)) nuits.add(n);
    } else if (debut && !fin) {
      // pas de DTEND : une seule nuitée (séjour d'une nuit)
      nuits.add(debut);
    } else if (vevent && (!debut || !fin)) {
      ignores += 1;
    }
    debut = null;
    fin = null;
  };
  for (const ligne of lignes) {
    if (/^BEGIN:VEVENT$/i.test(ligne)) {
      vevent = true;
      debut = null;
      fin = null;
    } else if (/^END:VEVENT$/i.test(ligne)) {
      clore();
      vevent = false;
    } else if (/^DTSTART[;:]/i.test(ligne)) {
      debut = dateDeValeur(ligne.split(":").slice(1).join(":").trim());
    } else if (/^DTEND[;:]/i.test(ligne)) {
      fin = dateDeValeur(ligne.split(":").slice(1).join(":").trim());
    }
  }
  return { nuits: [...nuits].sort(), ignores };
}

/** Bloque une plage de nuitées d'un coup — retourne l'état trié. */
export function bloquerPlage(id: string, nuits: string[]): string[] {
  const valides = new Set([...lireIndispos(id), ...nuits.filter(estNuitValide)]);
  const tout = lireToutStockage();
  if (valides.size === 0) return [];
  tout[id] = [...valides].sort();
  ecrireStockage(tout);
  return tout[id];
}

/** Libère toutes les nuitées bloquées d'un mois donné (YYYY-MM). */
export function libererMois(id: string, anMois: string): string[] {
  const restantes = lireIndispos(id).filter((n) => !n.startsWith(anMois));
  const tout = lireToutStockage();
  if (restantes.length === 0) delete tout[id];
  else tout[id] = restantes;
  ecrireStockage(tout);
  return restantes;
}
