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
