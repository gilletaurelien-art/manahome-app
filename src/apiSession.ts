// Client du module session — inscription, connexion, déconnexion, moi.
// Miroir front de app/session.mjs côté serveur : le cookie est HttpOnly,
// posé PAR le serveur ; ce module ne touche JAMAIS au contenu du cookie.
//
// Garde : jamais de throw — le front décide du repli, pas la fonction.

export interface EtatSession {
  connecte: boolean;
  email?: string;
}

export async function inscription(email: string, motDePasse: string): Promise<EtatSession> {
  try {
    const r = await fetch("/api/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, mot_de_passe: motDePasse }),
    });
    if (r.status === 201) {
      const corps = await r.json();
      return { connecte: true, email: corps.email };
    }
    if (r.status === 409) return { connecte: false };
    return { connecte: false };
  } catch {
    return { connecte: false };
  }
}

export async function connexion(email: string, motDePasse: string): Promise<EtatSession> {
  try {
    const r = await fetch("/api/auth/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, mot_de_passe: motDePasse }),
    });
    if (r.status === 200) {
      const corps = await r.json();
      return { connecte: true, email: corps.email };
    }
    return { connecte: false };
  } catch {
    return { connecte: false };
  }
}

export async function deconnexion(): Promise<void> {
  try {
    await fetch("/api/auth/deconnexion", { method: "POST", credentials: "same-origin" });
  } catch {
    // même coupé : l'état local repartira de zéro au rechargement
  }
}

export async function moi(): Promise<EtatSession> {
  try {
    const r = await fetch("/api/auth/moi", { credentials: "same-origin" });
    if (r.status === 200) {
      const corps = await r.json();
      return { connecte: true, email: corps.email };
    }
    return { connecte: false };
  } catch {
    return { connecte: false };
  }
}
