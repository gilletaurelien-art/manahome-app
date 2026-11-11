/**
 * ⛔ L'ORDRE D'UNE ADRESSE NE SE DEVINE PAS, ET UN RÉSIDU NE S'AFFICHE PAS.
 *
 * La moisson stocke les PARTIES séparées (voie, numéro, code postal) parce que
 * les coller est irréversible : « 12 rue de la Paix » en France, « Hauptstraße
 * 12 » en Allemagne. La mise en forme vit donc ici, et ces tests la tiennent.
 */
import { describe, expect, it } from "vitest";
import { adresseLisible, numeroAvantVoie } from "./adresse";

describe("l'adresse se met en forme selon la source", () => {
  it("la France met le numéro devant la voie", () => {
    expect(adresseLisible({ voie: "Rue d'Antrain", numero: "35" }, "FR"))
      .toBe("35 Rue d'Antrain");
  });

  it("⭐ et l'ordre par défaut met la VOIE devant, parce que c'est là que la donnée existe", () => {
    // Autriche 73,8 %, Allemagne 71,1 %, Pays-Bas 61,3 %, Suisse 57,1 % :
    // six des sept pays les mieux adressés d'OSM écrivent voie puis numéro.
    expect(adresseLisible({ voie: "Hauptstraße", numero: "12" }, "DE"))
      .toBe("Hauptstraße 12");
    expect(numeroAvantVoie("DE")).toBe(false);
    expect(numeroAvantVoie("AT")).toBe(false);
    expect(numeroAvantVoie("FR")).toBe(true);
    expect(numeroAvantVoie("fr")).toBe(true); // la casse ne décide pas
  });

  it("une source sans pays connu ne lève pas et reste lisible", () => {
    expect(adresseLisible({ voie: "Stadtplatz", numero: "29" }, undefined))
      .toBe("Stadtplatz 29");
  });

  it("⚠️ une chaîne déjà formée par la source est servie telle quelle", () => {
    // DATAtourisme, la Sardaigne et l'Ombrie écrivent l'adresse entière :
    // la recomposer depuis des parties qu'on n'a pas serait une invention.
    expect(adresseLisible({ entiere: "23 rue du 24 août", codePostal: "44000" }, "FR"))
      .toBe("23 rue du 24 août, 44000");
  });

  it("⛔ et le code postal ne se répète pas s'il y est déjà", () => {
    expect(adresseLisible({ entiere: "Via Gallura, 14 — 07020", codePostal: "07020" }, "IT"))
      .toBe("Via Gallura, 14 — 07020");
  });

  it("🔴 un numéro SANS voie ne s'affiche pas — il ne désigne rien", () => {
    // Mesuré au Luxembourg : 8 fiches sur 197 portent un numéro ou un code
    // postal sans nom de rue, des hameaux sans voirie nommée.
    expect(adresseLisible({ numero: "12" }, "FR")).toBe(null);
    expect(adresseLisible({ numero: "12", codePostal: "1469" }, "LU")).toBe("1469");
  });

  it("⛔ aucune ponctuation orpheline : une adresse absente rend null", () => {
    expect(adresseLisible(null)).toBe(null);
    expect(adresseLisible(undefined)).toBe(null);
    expect(adresseLisible({})).toBe(null);
    expect(adresseLisible({ voie: "   ", numero: "  ", codePostal: " " })).toBe(null);
  });

  it("une voie seule suffit, sans virgule pendante", () => {
    expect(adresseLisible({ voie: "Port du Fret" }, "FR")).toBe("Port du Fret");
  });

  it("le code postal seul s'affiche, parce qu'il situe", () => {
    expect(adresseLisible({ codePostal: "29160" }, "FR")).toBe("29160");
  });
});

describe("🔴 l'ordre est une propriété du PAYS, jamais de la source", () => {
  it("une fiche FRANÇAISE d'OpenStreetMap met le numéro devant", () => {
    // Le défaut vu à l'écran le 11/11/2026 : « Camping de l'Aber, Route de
    // l'Aber 50 » à Crozon. `osm-monde` couvre 211 pays — indexer l'ordre sur
    // la source, c'est appliquer la convention autrichienne à la France.
    expect(adresseLisible({ voie: "Route de l'Aber", numero: "50", codePostal: "29160" }, "FR"))
      .toBe("50 Route de l'Aber, 29160");
  });

  it("et la même source en Autriche garde la voie devant", () => {
    expect(adresseLisible({ voie: "Getreidegasse", numero: "9" }, "AT"))
      .toBe("Getreidegasse 9");
  });
});
