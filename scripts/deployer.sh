#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# DÉPLOIEMENT DE manahome.org
# ═══════════════════════════════════════════════════════════════════════════
#
# Posé le 12/11/2026. Avant lui, ce site était envoyé à la main par un rsync
# qu'il fallait se rappeler — et dont la dernière trace était un horodatage de
# fichier. ⭐ Un outil qui écrit sur une surface PUBLIQUE et qui ne vit nulle
# part est une dette, pas un outil : personne ne peut le relire, le comparer,
# ni revenir en arrière. (Même leçon que `reordonner.py`, qui n'existait que
# sur le VPS et a dupliqué des morceaux pendant huit heures.)
#
# ⚠️ L'ORDRE COMPTE : construire, PUIS prérendre, PUIS envoyer. Le prérendu lit
# le `site/` construit ; l'envoyer avant le prérendu expédierait des pages
# vides avec un code 200, ce qu'aucune sonde ne distingue d'un site qui marche.
#
# ⚠️ PAS DE `--delete`. La racine servie peut contenir des fichiers qui ne
# viennent pas de ce dépôt ; les emporter se verrait en 404, trop tard.
set -euo pipefail

HOTE="${MANA_HOTE:-debian@147.135.254.25}"
CIBLE="${MANA_CIBLE:-/srv/www-manahome/}"
ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ICI"

# 🔴 LES DEUX VARIABLES NE SONT PAS UN DÉTAIL : SANS ELLES ON EXPÉDIE UN SITE
#    QUI SE DÉCLARE SUR GITHUB PAGES. `vite.config.ts` retombe par défaut sur
#    `https://gilletaurelien-art.github.io` + `/manahome-app/`, et toute la
#    couche machine suit : la canonique, le JSON-LD, le plan de site, les
#    robots. ⭐ Et le garde interne qui refuse les URL de Pages ne se déclenche
#    QUE si l'on construit pour un domaine (`siteUrl !== HOTE_PAGES`) : avec un
#    `npm run build` nu, il n'y a rien à refuser, donc il se tait. Un garde
#    conditionné à l'intention ne protège pas de l'oubli de l'intention.
#    Vécu le 12/11/2026 : la première version de ce script appelait `npm run
#    build` tout court et aurait mis des URL github.io sur manahome.org.
export SITE_URL="${SITE_URL:-https://manahome.org}"
export BASE_PATH="${BASE_PATH:-/}"

echo "→ construction pour $SITE_URL$BASE_PATH …"
npm run build

# ⚠️ Le prérendu N'EST PAS une étape séparée : c'est le `writeBundle` de
#    `vite.config.ts` qui écrit les pages par langue et par route. Le
#    `package.json` portait un script `prerender` pointant sur
#    `scripts/prerender.mjs`, fichier QUI N'A JAMAIS EXISTÉ — `npm run
#    prerender` plantait. Prouvé par mutation le 12/11 : `site/approche`
#    effacé, `npm run build` seul le reconstruit.

# ⭐ LES PAGES « PAYS » SONT ÉCRITES ICI, ENTRE LA CONSTRUCTION ET L'ENVOI, et
#    cet emplacement est la seule chose qui compte. `npm run build` réécrit
#    `site/` en entier : les générer avant, c'est les perdre. Les générer après
#    le rsync, c'est ne jamais les expédier. ⚠️ Elles passent ensuite sous le
#    garde « aucune URL de GitHub Pages », comme tout le reste — c'est voulu :
#    un fichier qui échappe au garde parce qu'il n'est pas né de vite est
#    exactement le genre d'exception qui finit en production.
echo "→ pages pays …"
SITE_URL="$SITE_URL" node scripts/fabriquer-pays.mjs

echo "→ aucune URL de GitHub Pages ne survit ?"
if grep -rl "gilletaurelien-art.github.io" site/ >/dev/null 2>&1; then
  echo "🔴 des URL de GitHub Pages sont dans le build — ne PAS expédier." >&2
  grep -rl "gilletaurelien-art.github.io" site/ | head -5 >&2
  exit 1
fi
echo "   ✓ aucune"

# ⭐ LE GARDE QUI MANQUAIT AILLEURS : on refuse d'expédier un `site/` plus
#    vieux qu'un fichier source. C'est l'erreur vécue le 09/08/2026 sur l'autre
#    dépôt — un déploiement lancé seul expédie le build précédent, donc du code
#    périmé, sans que rien ne le signale.
if [ -n "$(find src public -newer site/index.html -type f -print -quit 2>/dev/null)" ]; then
  echo "🔴 des sources sont plus récentes que site/index.html — la construction n'a pas pris." >&2
  exit 1
fi

# ⚠️ `--rsync-path="sudo rsync"` EST OBLIGATOIRE ICI, et ce n'est pas du confort.
#    `/srv/www-manahome` appartient à l'uid 501 (le compte du Mac, via un
#    `rsync -a` qui a préservé le propriétaire numérique) en mode 755. Le compte
#    `debian` ne peut donc pas y écrire : sans sudo côté serveur, chaque fichier
#    existant échoue en « Permission denied » et le déploiement s'arrête à
#    moitié — certains fichiers neufs passent, les anciens non. ⭐ Un
#    déploiement qui échoue PARTIELLEMENT est pire qu'un déploiement qui refuse :
#    le site se retrouve dans un état que personne n'a écrit.
echo "→ envoi vers $HOTE:$CIBLE …"
rsync -a --human-readable --rsync-path="sudo rsync" site/ "$HOTE:$CIBLE"

echo "→ contrôle en ligne …"
CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 https://manahome.org/)
echo "   manahome.org : $CODE"
[ "$CODE" = "200" ] || { echo "🔴 le site ne rend pas 200." >&2; exit 1; }
echo "✓ déployé."
