// Messagerie interne — miroir démo des tables conversations/messages.
// En prod : auth + API, RLS p_participants (seuls les participants voient
// la conversation). Ici : store local (localStorage), aucune donnée
// identifiante — pas de coordonnées, pas d'email, rien qui identifie.
// Règle gravée : les coordonnées ne sont jamais publiées ; la mise en
// relation passe uniquement par cette messagerie.

export interface Message {
  id: string;
  conversationId: string;
  auteur: "moi" | "vendeur"; // démo : l'acheteur local et le vendeur simulé
  corps: string;
  date: string; // ISO
}

export interface Conversation {
  id: string;
  annonceId: string;
  annonceTitre: string;
  dernierLe: string; // ISO du dernier message
  messages: Message[];
}

const CLE = "manahome-messagerie-demo";

export function lireConversations(): Conversation[] {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function ecrire(conversations: Conversation[]) {
  localStorage.setItem(CLE, JSON.stringify(conversations));
}

export function conversationParAnnonce(
  annonceId: string
): Conversation | null {
  return (
    lireConversations().find((c) => c.annonceId === annonceId) ?? null
  );
}

export function ouvrirConversation(
  annonceId: string,
  annonceTitre: string,
  premierMessage: string
): Conversation {
  const tous = lireConversations();
  let conv = tous.find((c) => c.annonceId === annonceId);
  if (!conv) {
    conv = {
      id: `conv-${annonceId}`,
      annonceId,
      annonceTitre,
      dernierLe: new Date().toISOString(),
      messages: [],
    };
    tous.push(conv);
  }
  conv.annonceTitre = annonceTitre;
  envoyer(conv.id, premierMessage, tous);
  return conv;
}

export function envoyer(
  conversationId: string,
  corps: string
): void;
export function envoyer(
  conversationId: string,
  corps: string,
  _tous: Conversation[]
): void;
export function envoyer(
  conversationId: string,
  corps: string,
  tousPasse?: Conversation[]
): void {
  const tous = tousPasse ?? lireConversations();
  const conv = tous.find((c) => c.id === conversationId);
  if (!conv || !corps.trim()) return;
  conv.messages.push({
    id: `msg-${Date.now()}`,
    conversationId,
    auteur: "moi",
    corps: corps.trim(),
    date: new Date().toISOString(),
  });
  conv.dernierLe = new Date().toISOString();
  ecrire(tous);
}

// Réponse simulée du vendeur (démo uniquement) — un échange pour rendre
// le parcours lisible ; en prod, notification + réponse réelle.
export function reponseSimulee(conversationId: string) {
  const tous = lireConversations();
  const conv = tous.find((c) => c.id === conversationId);
  if (!conv) return;
  conv.messages.push({
    id: `msg-${Date.now()}`,
    conversationId,
    auteur: "vendeur",
    corps: "Merci pour votre message ! (Démo — en production, le vendeur répond ici, par messagerie interne, sans jamais exposer ses coordonnées.)",
    date: new Date().toISOString(),
  });
  conv.dernierLe = new Date().toISOString();
  ecrire(tous);
}
