/**
 * Les illustrations des offres — SÉPARÉES de `offres.ts`, et pas par goût.
 *
 * 🔴 Elles y étaient d'abord, et le build l'a refusé : « No loader is
 *    configured for ".webp" ». La cause est structurelle — `offres.ts` est lu
 *    par DEUX moteurs. Le navigateur passe par Vite, qui sait transformer un
 *    import d'image en URL ; `vite.config.ts`, lui, est compilé par esbuild
 *    côté Node pour fabriquer le JSON-LD, et esbuild n'a aucun loader d'image.
 * ⭐ Un module partagé entre deux environnements ne peut contenir que ce que
 *    les DEUX savent lire. Les prix sont des nombres : tout le monde sait les
 *    lire. Une image, non.
 *
 * ⚠️ CES IMAGES PORTENT LE PRIX, GRAVÉ DEDANS (« 149 € HT · paiement
 *    unique »), ainsi que le nom et la liste des points. Le texte de la carte
 *    fait foi : l'image est décorative, `alt=""`. Un lecteur d'écran, un robot
 *    et le JSON-LD lisent `montant` dans offres.ts, jamais l'illustration.
 * ⛔ Si un prix change, les six images sont à refaire. Aucun test ne peut le
 *    voir : personne ne lit un prix dans une image en intégration continue.
 * ⚠️ Elles sont en FRANÇAIS, y compris sur /en/. Assumé tant qu'elles restent
 *    décoratives ; à reprendre le jour où elles deviennent du contenu.
 */
import geoExpress from "./assets/offres/geo-express.webp";
import geoExpert from "./assets/offres/geo-expert.webp";
import geoInternational from "./assets/offres/geo-international.webp";
import geoMonitoring from "./assets/offres/geo-monitoring.webp";
import geoChina from "./assets/offres/geo-china.webp";
import geoChinaMonitoring from "./assets/offres/geo-china-monitoring.webp";

/** La clé est le `nom` de l'offre dans offres.ts — une offre sans
 *  illustration n'en affiche simplement pas. */
export const ILLUSTRATIONS: Record<string, string> = {
  "GEO Express": geoExpress,
  "GEO Expert": geoExpert,
  "GEO International": geoInternational,
  "GEO Monitoring": geoMonitoring,
  "MANA GEO China": geoChina,
  "GEO China Monitoring": geoChinaMonitoring,
};
