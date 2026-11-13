import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { OFFRES_GEO } from "./offres";
import {
  TITRE_GENERIQUE, TITRE_GENERIQUE_EN,
  DESCRIPTION_GENERIQUE, DESCRIPTION_GENERIQUE_EN,
} from "./canonique";

/* ⚠️ LES COMMENTAIRES SONT RETIRÉS AVANT TOUTE LECTURE DE RÈGLE. Le bloc qui
   explique le retrait de `makesOffer` CITE le mot pour dire pourquoi on ne
   l'emploie plus : un garde posé sur le texte brut s'accuserait lui-même, et
   un `grep` validerait une consigne fausse. */
const config = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

/* ⚠️ Et le commentaire HTML aussi : celui qui explique le retrait des prix de
   l'en-tête vit DANS le fichier gardé. Sans ce nettoyage, le garde lirait sa
   propre justification et accuserait la réparation. */
const entete = readFileSync(new URL("../index.html", import.meta.url), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "");

/* ⭐ LA TROISIÈME RÉDACTION : les titres de /fr/ et /en/ ne viennent pas de la
   coquille mais de deux constantes — et l'anglaise échappait aux deux premiers
   nettoyages. Le garde lit donc les TROIS fichiers. */
const titres = readFileSync(new URL("./canonique.ts", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

/* ⚠️ Commentaires retirés : le bloc qui explique la bascule NOMME le RNA et
   l'association pour dire qu'ils n'ont plus rien à faire ici. */
const mentions = readFileSync(new URL("./MentionsLegales.tsx", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("les mentions légales nomment la bonne entité", () => {
  /* 🔴 POURQUOI — 13/11/2026, arbitrage « l'asso prouve, la société encaisse ».
     Les deux jeux de mentions sont EXACTEMENT inverses : une association
     s'identifie par son RNA et jamais par un SIRET ; une entreprise
     individuelle doit afficher SIREN, SIRET et code APE, et n'a ni RNA, ni RCS,
     ni numéro de TVA. ⛔ Écrire l'un sur le site de l'autre est une fausse
     déclaration — et un nom d'entité se recopie sans y penser d'un site de
     l'écosystème à l'autre. C'est pour ça que ce garde est un test et pas une
     note : il y a huit sites et un seul rédacteur. */

  /* ⛔ LE GARDE LIT LES CHAMPS, PAS LE FICHIER — et il a fallu deux mutations
     pour l'apprendre. Un premier jet vérifiait `toContain("514 004 118")` :
     vider le SIREN passait au vert, parce que le SIRET contient le SIREN. Et
     `toContain("Aurélien GILLET")` passait avec un directeur remplacé, parce
     que le même nom vit dans `nom:`. La bonne chaîne au mauvais endroit — le
     même défaut que le compteur de tracés le matin du même jour. */
  /* ⭐ LE BLOC DE VALEURS, SANS LA PROSE AUTOUR — et c'est la leçon que ce
     fichier prêchait sans l'appliquer partout. Deux des quatre tests lisaient
     `mentions`, c'est-à-dire le FICHIER ENTIER : commentaires compris. Le
     14/11/2026 ils ont refusé le passage à l'association parce que le
     commentaire qui EXPLIQUAIT la bascule citait « TEMPOsystem », « 293 B » et
     le SIREN de l'entreprise — des mots justes, à un endroit qui ne déclare
     rien. ⛔ Un garde qui lit la prose force à édulcorer la prose : il fait
     disparaître l'explication pour satisfaire le test. On lit donc l'objet. */
  const bloc = (): string => {
    const m = mentions.match(/const EDITEUR = \{[\s\S]*?\n\};/);
    if (!m) throw new Error("objet EDITEUR introuvable dans les mentions légales");
    return m[0];
  };

  const champ = (nom: string): string => {
    const m = mentions.match(new RegExp(`\\b${nom}:\\s*"([^"]*)"`));
    if (!m) throw new Error(`champ ${nom} absent des mentions légales`);
    return m[1];
  };

  /* 🔄 CES QUATRE TESTS SONT RETOURNÉS, PAS RÉÉCRITS — 14/11/2026.
     Ils exigeaient l'entreprise individuelle et INTERDISAIENT l'association ;
     ils exigent maintenant l'inverse. ⭐ Ce qu'ils protègent n'a pas changé
     d'un mot : les deux jeux de mentions sont exactement opposés, et écrire
     l'un sur le site de l'autre reste une fausse déclaration. Seule la bonne
     réponse a changé, parce que l'ACTIVITÉ du site a changé — le GEO est parti
     chez temposystem.eu et .fr, manahome ne vend plus rien.
     ⛔ Les supprimer aurait laissé le site sans garde une semaine avant que
     quelqu'un remette « Alliance MANA » sur une vitrine commerciale. */

  it("affiche l'immatriculation de l'association", () => {
    expect(champ("rna"), "le RNA est l'identifiant d'une association déclarée")
      .toBe("W292008256");
    expect(champ("siren")).toBe("130 121 866");
    expect(champ("siret")).toBe("130 121 866 00011");
    expect(champ("ape")).toBe("94.99Z");
  });

  it("ne déclare AUCUN régime de TVA d'entreprise", () => {
    /* ⭐ Ni 293 B ni 261-7 : ce site ne vend RIEN. L'article 293 B est le
       régime d'une entreprise, l'article 261-7 celui d'une association qui a
       des recettes lucratives. Invoquer l'un ou l'autre décrirait une activité
       qui n'existe pas sur ce domaine — et pour l'association, qui dépose un
       rescrit mécénat, ce serait une pièce contre son propre dossier. */
    expect(bloc(), "l'art. 293 B, propre aux entreprises, est resté")
      .not.toMatch(/293\s*B/);
    expect(bloc(), "l'art. 261-7 décrirait des recettes lucratives")
      .not.toMatch(/261[-\s,]*7/);
    expect(bloc(), "il faut dire que rien n'est vendu").toContain("Aucune vente");
  });

  it("ne porte AUCUNE marque de l'entreprise individuelle", () => {
    for (const interdit of ["514 004 118", "8690F", "TEMPOsystem",
                            "Entrepreneur individuel", "293 B"]) {
      expect(bloc(), `« ${interdit} » est revenu dans les mentions de MANAhome`)
        .not.toContain(interdit);
    }
  });

  it("nomme une PERSONNE comme directeur de la publication", () => {
    /* ⭐ L'art. 6 III 1° de la LCEN veut une personne physique NOMMÉE. C'est
       le seul des quatre tests qui n'a pas eu à être retourné : il exigeait
       une personne quand l'éditeur était une personne, il l'exige encore
       maintenant que l'éditeur est une personne morale.
       ⚠️ CE QU'IL NE VÉRIFIE PAS, et qu'aucun test ne peut vérifier : que
       cette personne soit la BONNE. Pour une personne morale, la loi du
       29/07/1982 (art. 93-2) désigne le représentant légal — le président,
       selon l'article 119 des statuts. Aurélien GILLET est inscrit sur sa
       décision, et les statuts ne portent aucune clause le désignant : c'est
       une ligne de PV du bureau qui réglerait le point, pas une assertion. */
    expect(champ("directeur")).toBe("Aurélien GILLET");
    expect(champ("nom"), "l'éditeur est la personne MORALE, pas la personne physique")
      .toBe("Alliance MANA");
    expect(mentions).toContain("Directeur de la publication");
  });
});

describe("les données structurées ne déclarent aucun prix", () => {
  /* 🔴 POURQUOI CE GARDE EXISTE — 13/11/2026. Le JSON-LD de l'accueil
     déclarait huit offres tarifées au nom d'Alliance MANA, dans la couche que
     lisent les moteurs et les assistants. L'association dépose un rescrit
     mécénat, qui se juge sur l'activité réelle et DÉCLARÉE : une offre
     commerciale publiée à son nom est une pièce contre son propre dossier.
     ⭐ Et ce défaut-là avait déjà prouvé qu'il savait survivre : « TEMPOsystem »
        est resté dans cette même couche VINGT-QUATRE HEURES après avoir été
        retiré du texte visible, parce que corriger un texte ne corrige pas ce
        que les machines lisent. Un commentaire ne l'aurait pas tenu. */

  it("ne pose pas de bloc makesOffer", () => {
    expect(config, "makesOffer est revenu dans le JSON-LD")
      .not.toMatch(/makesOffer/);
  });

  it("ne lit plus le catalogue des offres", () => {
    expect(config, "vite.config.ts lit de nouveau OFFRES_GEO")
      .not.toMatch(/OFFRES_GEO/);
    expect(config, "un import du catalogue est revenu")
      .not.toMatch(/from\s+"\.\/src\/offres"/);
  });

  it("ne recopie aucun montant du catalogue", () => {
    /* ⛔ Le garde ne cherche pas le mot « price » mais les VALEURS : un
       balisage réécrit à la main, sous un autre nom de champ, déclarerait les
       mêmes prix sans jamais employer le mot. */
    const montants = [...new Set(OFFRES_GEO.map((o) => o.montant))];
    expect(montants.length, "catalogue vide : le garde a raté sa cible")
      .toBeGreaterThan(2);
    for (const m of montants) {
      expect(config, `le montant ${m} est écrit dans la couche machine`)
        .not.toMatch(new RegExp(`['"\`]${m}['"\`]|\\b${m}\\b\\s*,?\\s*priceCurrency`));
    }
  });

  it("ne laisse aucun montant dans l'en-tête de la coquille", () => {
    /* 🔴 POSÉ APRÈS COUP, ET C'EST LA LEÇON. Le 13/11 à 15 h 45 les prix ont
       été retirés du JSON-LD ; une heure plus tard « Audits dès <prix> € »
       était toujours dans le <title>, la description et les deux balises
       og: — QUATRE fois, dans le fichier d'à côté.
       ⭐ Il y a plusieurs RÉDACTIONS du même site, et corriger l'une ne corrige
          pas les autres. Le garde couvre donc les deux fichiers, pas un. */
    const montants = [...new Set(OFFRES_GEO.map((o) => o.montant))];
    for (const m of montants) {
      expect(entete, `le montant ${m} est revenu dans l'en-tête`)
        .not.toMatch(new RegExp(`\\b${m}\\b`));
    }
    expect(entete, "l'en-tête n'a plus de titre : la mesure a raté sa cible")
      .toMatch(/<title>/);
  });

  it("ne laisse aucun montant dans les titres par langue", () => {
    const montants = [...new Set(OFFRES_GEO.map((o) => o.montant))];
    for (const m of montants) {
      expect(titres, `le montant ${m} est revenu dans un titre de langue`)
        .not.toMatch(new RegExp(`\\b${m}\\b`));
    }
    /* ⛔ Et les deux langues existent toujours : un garde qui verdit parce que
       la constante anglaise a disparu ne garde plus rien. */
    expect(titres).toMatch(/TITRE_GENERIQUE\s*=/);
    expect(titres).toMatch(/TITRE_GENERIQUE_EN\s*=/);
  });

  it("sert une description ANGLAISE sur les pages anglaises", () => {
    /* 🔴 POURQUOI — 13/11/2026. Le titre de /en/ était traduit, `og:description`
       non : un lien partagé depuis la page anglaise affichait un titre anglais
       et deux phrases de français. ⭐ Invisible en relisant le dépôt — ça se
       voit en collant le lien dans une conversation, ou en lisant la PAGE
       SERVIE. C'est le même angle mort que les titres par langue, une heure
       plus tôt : la couche machine a plus de rédactions qu'on ne croit. */
    expect(DESCRIPTION_GENERIQUE_EN, "les deux langues servent le même texte")
      .not.toBe(DESCRIPTION_GENERIQUE);
    for (const mot of ["Vos clients", "secondes", "répondent", "concurrents cités"]) {
      expect(DESCRIPTION_GENERIQUE_EN, `« ${mot} » est resté dans la version anglaise`)
        .not.toContain(mot);
    }
    /* ⛔ Et le garde refuse une anglaise vide ou bâclée : un champ effacé
       passerait toutes les vérifications ci-dessus. */
    expect(DESCRIPTION_GENERIQUE_EN.length).toBeGreaterThan(80);
    expect(DESCRIPTION_GENERIQUE_EN).toContain("MANAhome");
    /* Et les deux titres restent distincts, pour la même raison. */
    expect(TITRE_GENERIQUE_EN).not.toBe(TITRE_GENERIQUE);
  });

  it("injecte bien la description dans les deux balises", () => {
    /* ⚠️ Une description traduite mais jamais injectée serait un progrès
       invisible : la constante serait juste et la page servie, fausse. */
    expect(config, "og:description n'est plus réécrite par langue")
      .toMatch(/og:description" content="\$\{description\}/);
    expect(config, 'la meta "description" n\'est plus réécrite par langue')
      .toMatch(/name="description" content="\$\{description\}/);
  });

  it("garde l'organisation et son rattachement — ce n'est pas eux qu'on retire", () => {
    /* ⭐ Le retrait porte sur les PRIX, pas sur l'identité. Si un jour c'est
       l'identité qu'on veut changer, ce sera une autre décision, et elle devra
       être prise — pas obtenue par effet de bord d'un nettoyage de prix. */
    expect(config).toMatch(/"@type":\s*"Organization"/);
    expect(config).toMatch(/parentOrganization/);
  });
});
