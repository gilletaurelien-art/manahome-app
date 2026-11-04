import { nuitIso, nuiteesDe } from "./calendrierDonnees";

// Client du module calendrier — miroir API de calendrierDonnees.ts.
// ⭐ SOUS LE FLAG, LA SOURCE DE VÉRITÉ EST LE SERVEUR : les nuitées vivent
// en base (annonces_indisponibilites, 007), pas dans le localStorage. La
// SÉMANTIQUE ne bouge pas : bord exclu, nuitée = DATE ISO, le PUT remplace
// l'ensemble complet (ce que le calendrier affiche, la base le reflète).
//
// Garde : jamais de throw — l'appelant replie sur la démo.

export interface ResultatNuits {
  ok: boolean;
  nuits?: string[];
}

const dateDepuis = (iso: string) => new Date(`${iso}T00:00:00`);

/** Les nuitées bloquées de MON annonce (404 = pas à moi, 401 = pas connecté). */
export async function lireIndisposApi(annonceId: string): Promise<ResultatNuits> {
  try {
    const r = await fetch(`/api/annonces/${annonceId}/indisponibilites`, {
      credentials: "same-origin",
    });
    if (r.status === 200) {
      const corps = await r.json() as { nuits: string[] };
      return { ok: true, nuits: corps.nuits };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * Remplace l'ensemble des nuitées bloquées — le calendrier envoie ce
 * qu'il affiche, la base reflète exactement ça (delta serveur, 007).
 */
export async function poserIndisposApi(
  annonceId: string,
  nuits: string[]
): Promise<ResultatNuits> {
  try {
    const r = await fetch(`/api/annonces/${annonceId}/indisponibilites`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ nuits }),
    });
    if (r.status === 200) {
      const corps = await r.json() as { nuits: string[] };
      return { ok: true, nuits: corps.nuits };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

// ===== Les mêmes gestes que calendrierDonnees, en version serveur =====
// Les fonctions pures de dates restent celles du module démo : LA MÊME
// sémantique des deux côtés, testée une fois, appliquée deux fois.

export { nuitIso, nuiteesDe };

/** Bascule une nuit côté serveur : lire l'ensemble, modifier, renvoyer l'ensemble. */
export async function basculerNuitApi(
  annonceId: string,
  nuit: string,
  actuelles: string[]
): Promise<ResultatNuits> {
  const futures = actuelles.includes(nuit)
    ? actuelles.filter((n) => n !== nuit)
    : [...actuelles, nuit];
  return poserIndisposApi(annonceId, futures);
}

/** Libère un mois côté serveur — le calcul local est pur, l'écriture distante. */
export async function libererMoisApi(
  annonceId: string,
  anMois: string,
  actuelles: string[]
): Promise<ResultatNuits> {
  const restantes = actuelles.filter((n) => !n.startsWith(anMois));
  return poserIndisposApi(annonceId, restantes);
}

/** La date locale d'un timestamp, en ISO — réexport du miroir démo. */
export const nuit = dateDepuis;
