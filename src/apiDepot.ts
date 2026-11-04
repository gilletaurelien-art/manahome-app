// Client du dépôt d'annonce réel — miroir front de app/depot.mjs.
// ⭐ GRATUIT ET SANS CONDITION : créer un brouillon n'exige rien. Publier
// passe par le verrou serveur (007) — le front traduit ses refus en
// phrases, il ne devine jamais ce qui manque.

export interface ResultatDepot {
  ok: boolean;
  id?: string;
  statut?: string;
  erreur?: string;
}

export async function creerAnnonceApi(corps: Record<string, unknown>): Promise<ResultatDepot> {
  try {
    const r = await fetch("/api/annonces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(corps),
    });
    if (r.status === 201) {
      const reponse = await r.json();
      return { ok: true, id: reponse.id, statut: reponse.statut };
    }
    if (r.status === 400 || r.status === 401) {
      const reponse = await r.json();
      return { ok: false, erreur: reponse.erreur };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function poserJustificatifApi(
  annonceId: string,
  corps: Record<string, unknown>
): Promise<ResultatDepot> {
  try {
    const r = await fetch(`/api/annonces/${annonceId}/justificatifs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(corps),
    });
    if (r.status === 201) return { ok: true };
    if (r.status === 400 || r.status === 404) {
      const reponse = await r.json();
      return { ok: false, erreur: reponse.erreur };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function publierAnnonceApi(annonceId: string): Promise<ResultatDepot> {
  try {
    const r = await fetch(`/api/annonces/${annonceId}/publier`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (r.status === 200) {
      const reponse = await r.json();
      return { ok: true, statut: reponse.statut };
    }
    if (r.status === 409 || r.status === 404) {
      const reponse = await r.json();
      return { ok: false, erreur: reponse.erreur };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
