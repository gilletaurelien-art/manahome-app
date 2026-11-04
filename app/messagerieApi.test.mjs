import { describe, it, expect } from "vitest";
import { validerMessage, sqlOuvrirConversation, sqlListeConversations, CORPS_MAX } from "./messagerieApi.mjs";

describe("le message est validé avant de toucher la base", () => {
  it("un message posable passe, trimé", () => {
    expect(validerMessage("  Bonjour, disponible ?  ")).toEqual({ ok: true, corps: "Bonjour, disponible ?" });
  });

  it("vide, absent, trop long : refus avec une phrase", () => {
    expect(validerMessage("   ").erreur).toBe("message vide");
    expect(validerMessage(null).erreur).toBe("message invalide");
    expect(validerMessage("x".repeat(CORPS_MAX + 1)).erreur).toContain("trop long");
  });
});

describe("le vendeur est dérivé dans le SQL — jamais choisi par le client", () => {
  it("l'ouverture dérive le vendeur de l'annonce et exige une annonce publiée", () => {
    const sql = sqlOuvrirConversation();
    expect(sql).toContain("SELECT $1, auth.uid()::uuid, a.proprietaire");
    expect(sql).toContain("a.statut = 'publiee'");
    // le client ne peut pas injecter son propre vendeur : aucun $2, le seul
    // paramètre est l'annonce
    expect(new Set([...sql.matchAll(/[$]\d/g)].map((m) => m[0])).size).toBe(1);
  });

  it("la liste ne montre que les conversations où je suis partie", () => {
    const sql = sqlListeConversations();
    expect(sql).toContain("c.acheteur = auth.uid() OR c.vendeur = auth.uid()");
  });

  it("aucune coordonnée ne sort : ni email, ni téléphone", () => {
    for (const sql of [sqlOuvrirConversation(), sqlListeConversations()]) {
      expect(sql.toLowerCase()).not.toContain("email");
      expect(sql.toLowerCase()).not.toContain("telephone");
    }
  });
});
