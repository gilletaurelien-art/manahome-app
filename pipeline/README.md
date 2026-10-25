# Pipeline de compression d'images

**Le pipeline AVANT la première annonce — la discipline d'abord.**

Toute photo passant par MANAhome subit :

1. **Rescale + compression WebP** : master à 1600 px de bord long, qualité ~80.
2. **Thumbnails** : 400 px pour listes/grilles.
3. **TTL des originaux** : le fichier original lourd ne vit que quelques minutes (upload temporaire purgé après traitement).

Économie visée : ~3 Mo/annonce contre ~150 Mo sans discipline (~0,25 €/mois de stockage à 10 000 annonces).

## Implémentation

`pipeline/process.py` — déclenché par l'app à chaque upload. Lit l'original depuis le bucket `uploads/`, écrit `annonces/<uuid>/master.webp` et `annonces/<uuid>/thumb.webp` dans le S3 (compat OVHcloud / RustFS), puis supprime l'original.

Variables : `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`.

## Règles

- Aucune photo ne peut être servie sans passer par le pipeline (seules les sorties `master.webp` / `thumb.webp` sont référencées en base).
- Jamais de fichier vidéo accepté : vidéos et visites 3D en URL externe uniquement (contrainte CHECK en base, `db/schema/001_init.sql`).
