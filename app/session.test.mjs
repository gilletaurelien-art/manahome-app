import { describe, it, expect } from "vitest";
import { creerSession, lireSession, uidDepuisRequete, NOM_COOKIE, TTL_SESSION_MS } from "./session.mjs";
import { hacherMotDePasse, verifierMotDePasse, validerIdentifiants } from "./auth.mjs";

const SECRET = "secret-de-test";
const UID = "12345678-1234-1234-1234-123456789abc";

describe("la session est signée, expirée refusée, forgée rejetée", () => {
  it("une session créée se lit, uid intact", () => {
    expect(lireSession(creerSession(UID, SECRET), SECRET)).toBe(UID);
  });

  it("une session expirée est refusée — le temps fait partie de la preuve", () => {
    const maintenant = Date.now();
    const cookie = creerSession(UID, SECRET, maintenant - TTL_SESSION_MS - 1);
    expect(lireSession(cookie, SECRET, maintenant)).toBeNull();
  });

  it("un cookie forgé (signature d'un autre secret, charge trafiquée) est rejeté", () => {
    const legitime = creerSession(UID, SECRET);
    const trafique = legitime.slice(0, -1) + (legitime.endsWith("0") ? "1" : "0");
    expect(lireSession(trafique, SECRET)).toBeNull();
    expect(lireSession(creerSession(UID, "autre-secret"), SECRET)).toBeNull();
    expect(lireSession("pas.un.cookie", SECRET)).toBeNull();
    expect(lireSession("", SECRET)).toBeNull();
  });

  it("un uid qui n'est pas un uuid est refusé même bien signé", () => {
    const cookie = creerSession("je-ne-suis-pas-un-uid", SECRET);
    expect(lireSession(cookie, SECRET)).toBeNull();
  });

  it("l'extraction depuis l'en-tête Cookie ignore les autres cookies", () => {
    const enTete = `autre=1; ${NOM_COOKIE}=${creerSession(UID, SECRET)}; encore=2`;
    expect(uidDepuisRequete(enTete, SECRET)).toBe(UID);
    expect(uidDepuisRequete("autre=1", SECRET)).toBeNull();
    expect(uidDepuisRequete(undefined, SECRET)).toBeNull();
  });
});

describe("le mot de passe ne vit que haché", () => {
  it("le haché ne contient jamais le mot de passe, et se vérifie", () => {
    const stocke = hacherMotDePasse("motdepasse-secret-10");
    expect(stocke).not.toContain("motdepasse-secret-10");
    expect(verifierMotDePasse("motdepasse-secret-10", stocke)).toBe(true);
    expect(verifierMotDePasse("motdepasse-secret-11", stocke)).toBe(false);
  });

  it("deux hachés du même mot de passe diffèrent (sel unique)", () => {
    expect(hacherMotDePasse("meme-mot-de-passe")).not.toBe(hacherMotDePasse("meme-mot-de-passe"));
  });

  it("un haché malformé est refusé sans lever", () => {
    expect(verifierMotDePasse("x", "pas-de-sep")).toBe(false);
    expect(verifierMotDePasse("x", "")).toBe(false);
  });

  it("la validation exige un email et 10 caractères", () => {
    expect(validerIdentifiants("a@b.co", "1234567890")).toBeNull();
    expect(validerIdentifiants("pas-un-email", "1234567890")).toMatch(/email/);
    expect(validerIdentifiants("a@b.co", "court")).toMatch(/mot de passe/);
  });
});
