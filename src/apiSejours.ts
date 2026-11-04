// Client du module séjours — miroir front de app/sejours.mjs.
// ⭐ LA BASE DÉCIDE, LE FRONT TRADUIT : le refus de double réservation vit
// dans le trigger 007, les transitions dans les UPDATE verrouillés — ici,
// on traduit les 409 en phrases honnêtes, on ne re-teste rien.
//
// Le cycle affiché est LE MÊME que la démo (sejoursDonnees.ts) : le
// voyageur voit où en est son séjour, l'hôte ce qu'il lui reste à faire.

export interface SejourApi {
  id: string;
  annonce_id?: string;
  annonceTitre?: string;
  arrivee: string;
  depart: string;
  voyageurs_nb: number;
  mode: string;
  statut: "demande_envoyee" | "acceptee" | "paiement_attendu" | "confirmee" | "annulee" | "cloturee";
  conditions?: Record<string, unknown>;
  titre?: string;
}

export interface ResultatSejour {
  ok: boolean;
  sejour?: SejourApi;
  sejours?: SejourApi[];
  erreur?: string;
}

// chaque 409 a sa phrase — jamais un code brut à l'écran
const PHRASES_409: Record<string, string> = {
  "demande déjà en cours": "Vous avez déjà une demande en cours pour ce logement.",
  "double réservation refusée": "Ces dates viennent d'être réservées ailleurs.",
  "transition non permise": "Ce séjour n'est plus dans l'état attendu pour ce geste.",
  "ces dates ne sont pas disponibles": "Ces dates ne sont pas disponibles pour ce logement.",
};

export function phraseErreur(erreur: string): string {
  return PHRASES_409[erreur] ?? "Une erreur est survenue.";
}

export async function demanderSejourApi(entree: {
  annonceId: string;
  arrivee: string;
  depart: string;
  voyageursNb: number;
}): Promise<ResultatSejour> {
  try {
    const r = await fetch("/api/sejours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        annonceId: entree.annonceId,
        arrivee: entree.arrivee,
        depart: entree.depart,
        voyageursNb: entree.voyageursNb,
      }),
    });
    if (r.status === 201) return { ok: true, sejour: await r.json() };
    if (r.status === 409 || r.status === 400) {
      const corps = await r.json();
      return { ok: false, erreur: phraseErreur(corps.erreur ?? "") };
    }
    return { ok: false, erreur: phraseErreur("") };
  } catch {
    return { ok: false, erreur: phraseErreur("") };
  }
}

export async function lireSejoursApi(): Promise<ResultatSejour> {
  try {
    const r = await fetch("/api/sejours", { credentials: "same-origin" });
    if (r.status === 200) {
      const corps = await r.json() as { sejours: SejourApi[] };
      return { ok: true, sejours: corps.sejours };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function gesteSejourApi(id: string, geste: string): Promise<ResultatSejour> {
  try {
    const r = await fetch(`/api/sejours/${id}/${geste}`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (r.status === 200) return { ok: true, sejour: await r.json() };
    if (r.status === 409) {
      const corps = await r.json();
      return { ok: false, erreur: phraseErreur(corps.erreur ?? "") };
    }
    return { ok: false, erreur: phraseErreur("") };
  } catch {
    return { ok: false, erreur: phraseErreur("") };
  }
}
