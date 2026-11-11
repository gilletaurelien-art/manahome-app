import { useEffect, useRef, useState } from "react";
import { t } from "./i18n";
import { langueCourante } from "./router";

/**
 * Le compteur d'agents IA, en direct — jumeau de celui de manafrance.org.
 *
 * ⭐ IL TOURNE, et ce n'est pas un effet : `/api/compteur` rend, par site, un
 *    `total` et un `par_seconde` MESURÉ sur le dernier jour plein. Le compteur
 *    avance à ce débit entre deux relevés, puis se recale sur la valeur
 *    serveur. Il n'invente pas un chiffre — il interpole entre deux mesures.
 *
 * ⚠️ IL SOMME TOUS LES SITES, délibérément. Le compteur de manafrance.org
 *    affiche ce même total sous un bandeau « MANAFRANCE.ORG » : il attribue à
 *    un site un chiffre qui en couvre deux (mesuré : manafrance.org seul vaut
 *    5,93 M, mana.bzh 8,93 M, le total 14,85 M). Ici le libellé dit
 *    « l'écosystème MANA », qui est ce que le chiffre compte vraiment.
 *
 * ⚠️ LE NOMBRE DE JOURS SE CALCULE, il ne s'écrit pas. La page portait « du
 *    20 septembre au 11 novembre 2026 — 52 jours » en dur : juste le jour de
 *    l'écriture, faux le lendemain. `depuis` vient du serveur, les jours s'en
 *    déduisent à chaque affichage.
 *
 * ⚠️ Et si l'appel échoue, le composant ne rend RIEN — pas un « 0 ». Un zéro
 *    affiché dirait « aucun agent ne passe », exactement le contraire de ce
 *    que la page démontre.
 */

type Ligne = { site: string; total: number; depuis: string; par_seconde: number };

export function CompteurAgentsIa() {
  const L = langueCourante();
  const [base, setBase] = useState<{ total: number; parSeconde: number; depuis: string } | null>(null);
  const [affiche, setAffiche] = useState(0);
  const depart = useRef<number>(0);

  useEffect(() => {
    let vivant = true;
    const lire = async () => {
      try {
        const r = await fetch("/api/compteur", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
          signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) return;
        const lignes: Ligne[] = await r.json();
        if (!vivant || !Array.isArray(lignes) || lignes.length === 0) return;
        const total = lignes.reduce((s, l) => s + (l.total || 0), 0);
        const parSeconde = lignes.reduce((s, l) => s + (l.par_seconde || 0), 0);
        // La plus ancienne date de départ de l'écosystème.
        const depuis = lignes.map((l) => l.depuis).filter(Boolean).sort()[0];
        setBase({ total, parSeconde, depuis });
        setAffiche(total);
        depart.current = Date.now();
      } catch {
        /* silence : voir l'en-tête — rien plutôt qu'un zéro. */
      }
    };
    lire();
    // Un relevé toutes les cinq minutes suffit : entre deux, on interpole.
    const t = setInterval(lire, 5 * 60_000);
    return () => { vivant = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!base || base.parSeconde <= 0) return;
    // ⚠️ `prefers-reduced-motion` : un chiffre qui s'agite est un mouvement.
    const calme = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (calme) return;
    const id = setInterval(() => {
      const ecoule = (Date.now() - depart.current) / 1000;
      setAffiche(Math.floor(base.total + ecoule * base.parSeconde));
    }, 1000);
    return () => clearInterval(id);
  }, [base]);

  if (!base) return null;

  const jours = Math.max(
    1,
    Math.floor((Date.now() - new Date(base.depuis + "T00:00:00Z").getTime()) / 86_400_000),
  );

  return (
    <li className="constat-vivant">
      <span className="constat-chiffre" aria-live="off">
        {affiche.toLocaleString(L === "en" ? "en-GB" : "fr-FR")}
      </span>
      <span className="constat-unite">
        {t(L, "visites automatisées identifiées comme provenant d'agents IA")}
      </span>
      <span className="constat-quoi">
        {t(L, "sur l'ensemble de l'écosystème MANA, depuis")} {jours} {t(L, "jours")}.{" "}
        {/* ⚠️ CETTE PRÉCISION N'EST PAS UNE PRUDENCE, C'EST LA MESURE EXACTE.
            Un passage de GPTBot sur une page n'est PAS une question posée à
            ChatGPT par un humain. Confondre les deux gonflerait le chiffre
            d'un ordre de grandeur, sur le site qui facture la mesure
            honnête — et un prospect technique le verrait. */}
        {t(L, "Ces chiffres mesurent l'activité des robots sur notre infrastructure, pas le nombre de questions posées par les utilisateurs aux assistants.")}
      </span>
    </li>
  );
}
