/**
 * ⛔ UN ÉTABLISSEMENT MOISSONNÉ N'EST PAS UNE ANNONCE.
 *
 * 1 108 926 fiches collectées auprès de sources publiques. Personne ne les a
 * déposées, personne n'en a fixé le prix : elles n'ont ni tarif, ni surface,
 * ni DPE, ni photo. Ces tests tiennent ce que le mapping a le droit de dire —
 * et surtout ce qu'il n'a pas le droit d'inventer.
 */
import { describe, expect, it } from "vitest";
import { enHebergementImporte, paysDeLaFiche, type LigneHebergement } from "./apiHebergements";
import { tarifsListe } from "./annonces";
import { adresseLisible } from "./adresse";

const LIGNE: LigneHebergement = {
  rang: 1, pertinence: 0, titre: "Best Western Kregenn", commune: "Quimper",
  famille: "hotel", typologie: "hotel", couchages: null, chambres: 32,
  capacite_connue: false, pays: "FR", lat: 47.995, lng: -4.097,
  adresse: null, adresse_voie: "Rue des Réguaires", adresse_numero: "13",
  adresse_code_postal: "29000", source: "osm-monde",
  attribution: "© les contributeurs d'OpenStreetMap", registre_public: "https://www.openstreetmap.org/",
};

describe("le mapping n'invente rien", () => {
  it("⛔ aucun tarif — et c'est un FAIT, pas un oubli", () => {
    const h = enHebergementImporte(LIGNE);
    expect(tarifsListe(h.tarifs)).toEqual([]);
    // Le témoin inverse : si quelqu'un se met à déduire un prix, ce test tombe.
    expect(h.tarifs.nuit).toBeUndefined();
    expect(h.tarifs.semaine).toBeUndefined();
    expect(h.tarifs.mois).toBeUndefined();
  });

  it("⛔ ni surface, ni pièces, ni DPE, ni photo, ni description inventée", () => {
    const h = enHebergementImporte(LIGNE);
    expect(h.surface).toBeUndefined();
    expect(h.pieces).toBeUndefined();
    expect(h.dpe).toBeUndefined();
    expect(h.photos).toBeUndefined();
    expect(h.description).toBe("");
  });

  it("⭐ le titre est servi TEL QUEL — c'est le nom propre de l'établissement", () => {
    expect(enHebergementImporte(LIGNE).titre).toBe("Best Western Kregenn");
  });

  it("il est toujours de source import_pro, donc affiché après les dépôts directs", () => {
    expect(enHebergementImporte(LIGNE).source).toBe("import_pro");
  });

  it("⚠️ il porte sa source, parce que c'est elle qui dit l'ordre de l'adresse", () => {
    const h = enHebergementImporte(LIGNE);
    expect(h.sourceCle).toBe("osm-monde");
    // ⛔ La source est conservée pour l'attribution, PAS pour l'ordre :
    //    `osm-monde` couvre 211 pays, donc les deux conventions.
    expect(adresseLisible(h.adresseParts, paysDeLaFiche(h))).toBe("13 Rue des Réguaires, 29000");
  });

  it("⭐ et la même fiche en Allemagne se lit dans l'ordre allemand", () => {
    const h = enHebergementImporte({ ...LIGNE, pays: "DE" });
    expect(adresseLisible(h.adresseParts, paysDeLaFiche(h))).toBe("Rue des Réguaires 13, 29000");
  });

  it("⚠️ une fiche SANS pays ne casse rien — elle prend l'ordre par défaut", () => {
    // `null` est l'état de 828 287 fiches OpenStreetMap tant que la passe
    // mondiale n'a pas repassé. Un inconnu se dégrade, il ne ment pas.
    const h = enHebergementImporte({ ...LIGNE, pays: null });
    expect(paysDeLaFiche(h)).toBe(null);
    expect(adresseLisible(h.adresseParts, paysDeLaFiche(h))).toBe("Rue des Réguaires 13, 29000");
  });

  it("une fiche sans adresse ne rend rien à afficher, pas une chaîne vide", () => {
    const h = enHebergementImporte({
      ...LIGNE, adresse: null, adresse_voie: null, adresse_numero: null, adresse_code_postal: null,
    });
    expect(adresseLisible(h.adresseParts, "FR")).toBe(null);
  });

  it("⚠️ l'attribution et le registre public suivent la fiche — la licence l'exige", () => {
    const h = enHebergementImporte(LIGNE);
    expect(h.attribution).toContain("OpenStreetMap");
    expect(h.registrePublic).toContain("openstreetmap.org");
  });

  it("une position n'existe que si les deux coordonnées existent", () => {
    expect(enHebergementImporte({ ...LIGNE, lat: null }).geoloc).toBeUndefined();
    expect(enHebergementImporte(LIGNE).geoloc).toEqual({ lat: 47.995, lon: -4.097 });
  });

  it("⛔ deux fiches différentes n'ont pas le même identifiant", () => {
    const a = enHebergementImporte(LIGNE);
    const b = enHebergementImporte({ ...LIGNE, titre: "Escale Océania" });
    expect(a.id).not.toBe(b.id);
  });
});
