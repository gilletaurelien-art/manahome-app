# Protocole de test-restore pré-migration KS-5

Version 1 — 25/10/2026 · À valider par Aurélien avant exécution.
Statut : **LECTURE SEULE, aucune action sur le VPS de production.**
Objectif : prouver que la chaîne de sauvegarde (dump nightly + miroir chiffré) se restaure — en sens inverse, sur une machine tierce — avant toute migration.
Machine cible : **KS-5** (vide, livré) — l'essai chronomètre en même temps la fenêtre de migration sur HDD.

> Valeurs `À RENSEIGNER` : à compléter par Aurélien avant l'essai. Aucune commande n'est à lancer sans validation de ce document.

---

## 0. Règles de sécurité de l'essai

- Le KS-5 doit être **vierge** : aucun service de prod n'y tourne pendant l'essai.
- L'essai **ne touche jamais au VPS de prod** : on copie, on ne déplace pas.
- La clé publique du miroir chiffré est sur le VPS ; la clé privée reste sur la machine de contrôle (Mac). **Ne jamais copier la clé privée sur le KS-5.**
- Chronométrer chaque phase (`date +%s` ou `time`) — l'objectif double est preuve + calibration de la fenêtre de maintenance.

## 1. Préparation (sur la machine de contrôle, ex. Mac)

| # | Action | Commande (indicative) | Fait |
|---|---|---|---|
| 1.1 | Identifier le dump nightly le plus récent sur le VPS et son âge | `ssh <VPS> 'ls -lh --time-style=long-iso /srv/sauvegardes/ \| grep -i dump'` `# À RENSEIGNER : chemin exact` | ☐ |
| 1.2 | Vérifier l'intégrité du dump AVANT transfert (checksum côté VPS) | `ssh <VPS> 'sha256sum <chemin_dump>'` | ☐ |
| 1.3 | Copier le dump + un échantillon du miroir chiffré vers la machine de contrôle (ou directement KS-5) | `rsync -av --progress <VPS>:<chemin> ./restore-test/` | ☐ |
| 1.4 | Vérifier le checksum après copie (identique à 1.2) | `sha256sum ./restore-test/<dump>` | ☐ |
| 1.5 | Confirmer la présence de la clé privée du miroir sur la machine de contrôle | `À RENSEIGNER : mécanisme de déchiffrement du miroir (age? gpg? rclone crypt?)` | ☐ |
| 1.6 | Noter l'espace dispo sur KS-5 (il faut ~2× la taille du dump + marge) | `ssh <KS-5> 'df -h /'` | ☐ |

## 2. Déchiffrement de l'échantillon du miroir (machine de contrôle)

| # | Action | Commande | Fait |
|---|---|---|---|
| 2.1 | Déchiffrer l'échantillon du miroir chiffré (zéro-connaissance : local uniquement) | `À RENSEIGNER : commande de déchiffrement du miroir` | ☐ |
| 2.2 | Vérifier que le contenu déchiffré est exploitable (liste les fichiers, en ouvrir un) | `tar -tf <archive>` + ouverture d'un fichier texte | ☐ |
| 2.3 | ☐ **Critère bloquant** : le miroir se déchiffre ET s'ouvre sur machine tierce |  | ☐ |

## 3. Restore du dump Postgres sur KS-5

Hypothèses à confirmer (À RENSEIGNER) : format du dump (`pg_dump` custom `-Fc` ou SQL pur ?), nom de la base, version Postgres source.

| # | Action | Commande (à adapter) | Fait |
|---|---|---|---|
| 3.1 | Installer la **même version majeure** de Postgres que le VPS sur KS-5 | `À RENSEIGNER : version PG du VPS (psql --version)` | ☐ |
| 3.2 | Créer une base d'essai (jamais le nom de prod, pour éviter tout doute) | `createdb manafrance_restore_test` | ☐ |
| 3.3 | ⏱️ **Lancer le restore chronométré** | `time pg_restore -d manafrance_restore_test -j 4 <dump>` (ou `psql` si dump SQL) | ☐ |
| 3.4 | Noter la durée exacte → c'est la base du calibrage de la fenêtre de migration |  | ☐ |
| 3.5 | ☐ **Critère bloquant** : restore complète sans erreur fatale (les warning `pg_restore` IGNORED ownership sont tolérés si dump lancé sans superuser) |  | ☐ |

## 4. Vérifications post-restore (la partie qui prouve vraiment)

Le restore ne vaut que si les gardes RGPD ont survécu. Chaque requête doit retourner le résultat attendu (comparé à la prod, en lecture seule).

| # | Vérification | Requête sur la base restaurée | Attendu | Fait |
|---|---|---|---|---|
| 4.1 | Les tables sont là | `SELECT count(*) FROM pg_tables WHERE schemaname='public';` | ~249 | ☐ |
| 4.2 | Le volume est plausible | `SELECT count(*) FROM ressources;` | ~6 498 561 (± qq jours d'écart vs sonde du 25/10) | ☐ |
| 4.3 | **RLS emportée** : 211 tables RLS-ON | `SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relrowsecurity;` | ~211 | ☐ |
| 4.4 | Les 38 RLS-OFF sont les mêmes qu'en prod | même requête en négatif, diff avec liste sonde | identique à la sonde | ☐ |
| 4.5 | **Fonction anti-domicile présente** | `SELECT proname FROM pg_proc WHERE proname='adresse_est_un_domicile';` | 1 ligne | ☐ |
| 4.6 | **Gardes CHECK emportées** | `SELECT count(*) FROM pg_constraint WHERE contype='c' AND conname LIKE '%domicile%';` `# À RENSEIGNER : noms exacts des 5 CHECK` | 5 | ☐ |
| 4.7 | `annuaire_exclusions` : contenu + contraintes | `SELECT count(*) FROM annuaire_exclusions;` | 3 lignes | ☐ |
| 4.8 | Fonctions présentes | `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public';` | ~1 357 (± agrégats) | ☐ |
| 4.9 | PostGIS fonctionnel (si utilisé) | `SELECT postgis_version();` | version, pas d'erreur | ☐ |
| 4.10 | Smoke applicatif léger : une fonction métier au hasard s'exécute | `À RENSEIGNER : 1-2 fonctions métier représentatives (ex. chercher_le_pays)` | résultat cohérent | ☐ |

## 5. Critères de réussite (noir sur blanc)

L'essai est **VERT** si et seulement si :

1. Le miroir chiffré se déchiffre sur machine tierce avec la clé privée (§2.3).
2. Le dump se restaure intégralement sur KS-5 (§3.5).
3. **100 % des vérifications §4 passent** : RLS, CHECK, `annuaire_exclusions`, `adresse_est_un_domicile()` — c'est la preuve que « pg_dump emporte les gardes » est vrai en pratique.
4. La durée de restore est notée et transposée en fenêtre de maintenance (marge ×2).

Si un seul critère échoue : **migration bloquée**, on corrige la chaîne de sauvegarde et on rejoue l'essai. On ne migre pas sur une sauvegarde dont le restore échoue.

## 6. Après l'essai (que l'essai soit vert ou rouge)

- Conserver les mesures : durée de restore, durée de déchiffrement, checksums, résultats des requêtes §4 → dans `MEMOIRE_IA.md` / carnet de migration.
- Nettoyer le KS-5 de l'essai : `dropdb manafrance_restore_test` + suppression des copies du dump (le KS-5 doit être propre pour la vraie bascule).
- Si rouge : documenter précisément le maillon cassé (dump ? chiffrement ? version PG ?) avant toute correction.

## 7. À renseigner par Aurélien avant l'essai

- [ ] Chemin exact des dumps nightlies et format (`pg_dump -Fc` ?)
- [ ] Mécanisme de chiffrement du miroir (age / gpg / rclone crypt ?) et sa commande de déchiffrement
- [ ] Version Postgres exacte du VPS
- [ ] Noms exacts des 5 CHECK anti-domicile
- [ ] 1-2 fonctions métier représentatives pour le smoke (§4.10)
- [ ] Accès SSH au KS-5 (l'essai suppose qu'il est joignable et vierge)
