// La sonde MANAtimebank — empreinte du fait.
//
// Deux témoignages du MÊME fait doivent produire le MÊME sha256, pour que
// la dédup (sondeDedup.mjs) les reconnaisse comme un seul événement dans
// les agrégats (cahier §1 « empreinte du fait »). L'empreinte ne dépend
// donc QUE des faits partagés par les deux parties — jamais de qui déclare,
// jamais de l'horodatage de la déclaration.

import { createHash } from "node:crypto";

/**
 * sha256 hex des faits partagés d'un geste : qui a donné, qui a reçu
 * (chaîne vide = « le commun »), combien de secondes, quel jour civil.
 * Volontairement SANS dimension ni mot libre : deux témoins qui décrivent
 * le même geste avec des mots différents doivent quand même dédupliquer.
 */
export function empreinteFait({ aDonne, aRecu, dureeS, jour }) {
  const brut = [aDonne, aRecu ?? "commun", String(dureeS), jour].join("|");
  return createHash("sha256").update(brut, "utf8").digest("hex");
}
