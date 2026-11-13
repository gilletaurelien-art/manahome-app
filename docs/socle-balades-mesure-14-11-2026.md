# Le socle des balades — mesuré le 14/11/2026

Étape 1 de la séquence du cahier des charges MANAhome v0 : *« Mesurer le socle :
état réel du routage piéton, de la composition, des fermetures. […] Vérifie leur
état dans le code avant de les considérer comme réutilisables — ces mots
décrivent le passé, pas une mesure actuelle. »*

C'est fait. **Le socle ne tient pas sous la forme que le cahier suppose**, et le
cahier prévoit ce cas : *« Si une hypothèse de ce document heurte la réalité du
code, tu ne contournes pas : tu documentes l'écart et tu attends l'arbitrage. »*

Rien n'a été écrit. Voici les écarts, chacun avec sa mesure.

---

## 1. 🔴 Le routage piéton n'existe pas

```
SELECT extname, extversion FROM pg_extension;
→ postgis 3.3.7          (pgrouting : ABSENT)
```

**pgRouting n'est pas installé** sur la base de production. Il n'y a donc aucun
graphe routable, et rien qui sache calculer un chemin d'un point à un autre.

## 2. 🔴 La « composition d'itinéraires » est un sélecteur de points

Une seule fonction existe :

```
proposer_balade(p_lat, p_lng, p_rayon_km, p_types text[], p_buffer_m, p_plafond_etapes)
```

Elle prend un point et un rayon, et rend des lieux. Son corps ne contient
**aucune** ligne employant `pgr_*`, `ST_LineMerge`, `ST_Union` ni un `ORDER BY`
d'assemblage : elle ne construit pas de tracé. ⭐ « Composition d'itinéraires »
décrivait une intention, pas un code qui tourne.

## 3. ⚠️ Les tracés ne sont pas un réseau praticable

Ils existent, et en quantité — c'est la bonne nouvelle :

| | tracés | km |
|---|---|---|
| `sentier` (OSM) | 26 665 | 227 599 |
| `pdipr` | **536** | 7 361 |
| **total** | **27 201** | **234 960** |

Les 536 PDIPR du cahier sont bien là. Mais autour de Crozon (rayon 15 km) :

| source | tracés | km médian | km max | sauts > 200 m | saut max |
|---|---|---|---|---|---|
| pdipr | 47 | **14,67** | **509** | 89 | **602 m** |
| sentier | 28 | 12,03 | 12 | 14 | 378 m |

🔴 **Un tracé de 509 km dans un rayon de 15 km n'est pas un sentier**, c'est un
assemblage. Et des écarts de 602 m entre deux points consécutifs veulent dire
que la géométrie a des trous : on ne peut pas y router, parce qu'entre ces deux
points il n'y a rien.

⭐ C'est le défaut déjà enregistré sous « `sentiers_traces` : 95 % recollés dans
le désordre ». Il n'était pas réparé ; il est maintenant chiffré.

### 🔴 CORRECTION DU MÊME JOUR — cette section concluait trop vite

Deux heures plus tard, la mesure suivante a renversé la conclusion. **Les trous
étaient DANS la séquence de points de chaque tracé, pas entre les tracés.** Leur
union, une fois nœudée, est un réseau propre :

```
ST_Dump(ST_Node(ST_Union(geom)))   -- rayon 8 km autour de Crozon
→ 12 716 arêtes · 10 224 nœuds · 962 km · longueur médiane 15 m
→ pgr_connectedComponents : UNE SEULE composante, 100 % des nœuds
```

Et un itinéraire réel se calcule : **Crozon bourg → pointe de Dinan, 228 arêtes,
13 927 m**, soit ~3 h à 4,5 km/h — plausible pour 8 km à vol d'oiseau sur un
réseau côtier.

⭐ **Une mesure juste peut porter une conclusion fausse.** « Médiane 14,7 km,
max 509 km, sauts de 602 m » était exact ; « on ne route pas là-dessus » ne
l'était pas. Je regardais les tracés comme des objets à suivre un par un, alors
que ce qui compte est leur UNION. Le défaut du recollement reste réel pour qui
veut afficher « le sentier n° 9 » ; il est sans effet pour qui veut router.

**Conséquence : aucun ré-import OSM n'est nécessaire pour composer.** La matière
est là, et elle tient.

## 4. 🔴 La base que le cahier vise n'existe pas

Le cahier demande `db/schema/013_balades.sql`, « même grammaire que les
007-012 ». Or :

```
SELECT table_name FROM information_schema.tables
 WHERE table_name IN ('annonces','sejours','territoires','comptes','pros');
→ 0 rows
```

**Aucune des tables de `db/schema/001-012` n'existe en production.** Il n'y a
pas de base `manahome` dans le cluster, pas de service systemd, pas de
conteneur. `app/serveur.mjs` (node + `pg`) n'a jamais tourné en ligne.

⚠️ Le « pivot locations » que le cahier décrit comme porté par le dépôt est donc
**du code et un schéma jamais joués** — le front le confirme : `territoires.ts`
dit « ici fixtures », `annonces.ts` exporte `ANNONCES_DEMO`.

## 5. ⚠️ Les travaux antérieurs sont dans un AUTRE dépôt

`meBalader.ts`, les migrations `proposer_balade_rpc`,
`pois_sur_trace_balade`, `le_vocabulaire_des_itineraires` : tout vit dans
**`manafrance-app`**, sur la base Supabase/PostGIS du KS-5 — pas ici.

C'est aussi là que vivent les 662 514 hébergements (`hebergements_moisson`) que
ce dépôt publie déjà, via `scripts/mesurer-pays.mjs` qui les lit **par SSH**.

⭐ Ce dépôt n'a donc pas de base à lui : il a un schéma qui n'a jamais été joué,
et il lit celle du voisin par-dessus le mur.

---

## Ce que cela change dans la séquence

Le cahier dit : *« Si le routage existant ne tient pas, mesurer d'abord, réparer
ensuite, composer en dernier. »* La mesure est faite — **il ne tient pas**. La
réparation précède donc tout le reste, et elle n'est pas dans la séquence
actuelle :

1. ✅ **Où vit le produit — tranché le 14/11 par Aurélien : la base de
   l'écosystème.** Les douze migrations de `db/schema/` et `app/serveur.mjs` ne
   seront donc jamais jouées : à marquer comme morts, pas à laisser paraître
   vivants.
2. ✅ **pgRouting est installé**, dans son propre schéma `routage`, migration
   `20261114003459`. Il était déjà dans l'image : aucun changement d'image,
   aucune interruption. 321 fonctions, aucune dans `public`, aucun droit à
   `anon`.
3. ✅ **Le réseau tient** — voir la correction ci-dessus. Un itinéraire se
   calcule aujourd'hui sur la donnée existante.
4. ⏳ **Ce qui reste avant le compositeur** : la table d'arêtes doit devenir
   PERMANENTE et se maintenir (le nœudage coûte quelques secondes sur 8 km ;
   il ne peut pas se refaire à chaque requête), la praticabilité doit être
   pondérée (un tracé n'est pas une route), et les fermetures doivent exclure
   des arêtes.
5. ⏳ **Re-mesurer sur une zone PAUVRE**, pour éprouver le refus honnête — c'est
   la promesse du cahier (« je ne peux pas composer ici, voici pourquoi ») et
   elle n'a encore jamais été vérifiée.

⛔ Les étapes 2 à 7 du cahier (migration 013, compositeur, carte, souvenirs,
signalements, partage, llms.txt) restent valables **telles qu'écrites** — elles
attendent simplement que le socle existe.

---

*Toutes les mesures ci-dessus ont été prises le 14/11/2026 sur la base de
production du KS-5. Les relancer : les requêtes sont dans l'historique de la
session, et chacune tient en une page.*
