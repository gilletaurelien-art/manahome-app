// Client du module messagerie — miroir front de app/messagerieApi.mjs.
// ⭐ LA MISE EN RELATION PROTÉGÉE, EN VRAI : le vendeur est dérivé de
// l'annonce PAR LE SERVEUR, la participation vérifiée dans le SQL —
// une conversation qui n'est pas la mienne n'existe pas pour moi (404).
// Jamais de throw : le repli démo décide à l'appelant.

export interface ConversationApi {
  id: string;
  annonce_id: string;
  acheteur: string;
  vendeur: string;
  created_at: string;
  titre?: string;
  statut_sejour?: string | null;
}

export interface MessageApi {
  auteur: string;
  corps: string;
  created_at: string;
}

export interface ResultatMessagerie<T> {
  ok: boolean;
  donnees?: T;
}

/** Ouvre (ou retrouve) la conversation d'une annonce publiée. */
export async function ouvrirConversationApi(
  annonceId: string
): Promise<ResultatMessagerie<ConversationApi>> {
  try {
    const r = await fetch(`/api/annonces/${annonceId}/conversations`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (r.status === 200 || r.status === 201) {
      return { ok: true, donnees: await r.json() };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Les conversations où je suis partie — acheteur ou vendeur. */
export async function lireConversationsApi(): Promise<ResultatMessagerie<ConversationApi[]>> {
  try {
    const r = await fetch("/api/conversations", { credentials: "same-origin" });
    if (r.status === 200) {
      const corps = await r.json() as { conversations: ConversationApi[] };
      return { ok: true, donnees: corps.conversations };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Les messages d'une conversation — uniquement si j'en suis partie. */
export async function lireMessagesApi(
  conversationId: string
): Promise<ResultatMessagerie<MessageApi[]>> {
  try {
    const r = await fetch(`/api/conversations/${conversationId}/messages`, {
      credentials: "same-origin",
    });
    if (r.status === 200) {
      const corps = await r.json() as { messages: MessageApi[] };
      return { ok: true, donnees: corps.messages };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Envoie un message — la participation est vérifiée dans le SQL. */
export async function envoyerMessageApi(
  conversationId: string,
  corps: string
): Promise<ResultatMessagerie<MessageApi>> {
  try {
    const r = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ corps }),
    });
    if (r.status === 201) {
      return { ok: true, donnees: await r.json() };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
