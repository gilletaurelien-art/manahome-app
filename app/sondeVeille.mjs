// La sonde MANAtimebank — la veille (le care en période).
//
// Une ouverture + une fermeture ; la durée se DÉDUIT, jamais de comptage
// geste à geste (cahier §2 « la charge »). Arrondie à la minute en
// dessous, jamais au-dessus : pas de fausse précision, et jamais de
// minute offerte par l'arrondi.

export function dureeVeilleS(ouverteLe, fermeeLe) {
  const debut = new Date(ouverteLe).getTime();
  const fin = new Date(fermeeLe).getTime();
  const brut = Math.floor((fin - debut) / 1000);
  if (brut <= 0) return 0;
  return Math.floor(brut / 60) * 60;
}
