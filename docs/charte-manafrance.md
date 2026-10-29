# Charte graphique MANAhome — transposition pour manafrance.org

Document de reprise : appliquer le design de la landing manahome.org au site
manafrance.org (associations et bénévolat). Source de vérité : repo
`gilletaurelien-art/manahome-app`, branche main, `src/styles.css`.

## 1. Règle de transposition noir

**MANAhome vit sur fond clair (sable), MANAFRANCE vivra sur fond noir.**
Le principe : inverser les valeurs claires/sombres, garder les mêmes
proportions, rayons et ombres — le dessin « bulle » est identique, seules
les teintes basculent.

| Élément | MANAhome (fond clair) | MANAFRANCE (fond noir) |
|---|---|---|
| Fond de page | sable `#faf8f3` | **noir `#0a0a0f`** (pur, sans dégradé) |
| Grande bulle | blanc 90 % | **blanc chaud 94 %** (inchangé — la bulle claire ressort sur noir) |
| Sous-bulle | encre `#1b2a4a` | **encre `#1b2a4a`** (inchangée) |
| Action (btn primaire) | encre plein, texte sable | **encre plein, texte sable** (inchangé) |
| Accent | or `#c9a227` | **orange MANAFRANCE** (voir §2) |
| Texte sur fond noir | — | **blanc `#fff` / sable `#faf8f3`**, jamais gris < 70 % |

Le noir étant le fond, la **grande bulle blanche** et la **sous-bulle encre**
deviennent les deux niveaux de lecture — exactement comme sur manahome, où
le contraste bulle/sous-bulle porte la hiérarchie.

## 2. Couleurs exactes (tokens)

```css
:root {
  /* MANAFRANCE : fond noir, accent orange vif (bouton actuel du site) */
  --noir: #0a0a0f;          /* fond de page, pur, zéro dégradé */
  --encre: #1b2a4a;         /* sous-bulle, boutons — inchangé */
  --orange: #ff7a1a;        /* accent : remplacer l'or #c9a227 de manahome */
  --sable: #faf8f3;         /* texte clair sur encre/noir */
  --ecume: #e5e0d6;         /* bordures discrètes sur bulles */
  --blanc-chaud: #fff;      /* fond des bulles */
}
```

L'or `#c9a227` de manahome devient **orange** `#ff7a1a` partout où l'accent
apparaît : anneau de la bulle, hover des ghost, focus des champs, pilule
de recherche, soulignements. **Un seul accent**, jamais deux.

## 3. Le système « bulle » (copier tel quel depuis manahome-app)

```css
.bulle {
  background: rgb(255 255 255 / 94%);
  border: 1px solid var(--ecume);
  border-radius: 44px 56px 40px 52px / 52px 42px 56px 46px;
  box-shadow:
    inset 0 2px 6px rgb(255 255 255 / 85%),
    0 4px 12px rgb(0 0 0 / 30%),
    0 0 0 4px rgb(255 122 26 / 18%),   /* anneau ORANGE au lieu de l'or */
    0 36px 80px rgb(0 0 0 / 45%);      /* ombre plus profonde sur noir */
  padding: var(--sp-2) var(--sp-4);
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
}

.sous-bulle {                             /* bulle dans la bulle */
  background: var(--encre);
  border: 1px solid var(--encre);
  border-radius: 20px 26px 18px 24px;
  box-shadow: inset 0 1px 3px rgb(255 255 255 / 12%),
              0 3px 10px rgb(0 0 0 / 30%);
  padding: var(--sp-4);
  margin: 0 auto;
  max-width: 60ch;
}
.sous-bulle .accroche { color: var(--sable); }
.sous-bulle .texte   { color: #fff; opacity: 0.92; }
```

- rayons mixtes **asymétriques** : c'est la signature, ne pas uniformiser ;
- la sous-bulle **épouse** la bulle en mobile (marges négatives,
  `padding-bottom: 0` sur la bulle, rayons bas accentués) ;
- les bulles ne dépassent jamais la largeur du header.

## 4. Header

Pilule ovale **flottante sticky** (`border-radius: 999px`, même ombre +
anneau orange). Icônes SVG inline + libellés sur **une seule ligne**
(`white-space: nowrap`) en desktop, **icônes seules** (libellés sr-only)
sous 900 px. Glyphes « synapse » : trait 1.4, arrondis, pastille focale
pleine — copier `src/Glyphs.tsx` / `NavGlyphs.tsx` comme base.

Sur fond noir : la pilule reste **blanche** (contraste maximal), le brand
`MANAFRANCE` en encre + accent orange sur `FRANCE`.

## 5. Le hero = le moteur (pattern à transposer)

Le hero de manahome est une grande bulle contenant :
1. **segments** en pilules (action sélectionnée = encre pleine) ;
2. **grande barre pilule blanche** : loupe fine SVG intégrée, champ texte,
   **bouton flèche ronde accent dans la barre** (40 px desktop, 44 px mobile) ;
3. routage au clic avec paramètres URL pré-branchés.

Pour manafrance, transposer tel quel : segments (« Missions de bénévolat » /
« Associations » / « Je propose mon temps »…), champ « Nom de la structure »,
champ « code postal, commune », bouton flèche orange. La barre mobile reste
**une seule ligne** (`flex-wrap: nowrap`, `min-width: 0`).

## 6. Boutons (famille unifiée, Rubik 700)

```css
.btn {
  display: inline-block; font-family: var(--sans); font-weight: 700;
  padding: 12px 26px; border-radius: 999px;
  border: 1px solid var(--encre); text-decoration: none; cursor: pointer;
  transition: all 170ms ease;
}
.btn:hover { transform: translateY(-1px); }
.btn-primary { background: var(--encre); color: var(--sable); }
.btn-ghost   { background: rgb(255 255 255 / 75%); color: var(--encre); }
.btn-ghost:hover { background: var(--orange); color: #fff; border-color: var(--orange); }
/* dans la sous-bulle encre : */
.btn-clair       { background: var(--blanc-chaud); color: var(--encre); }
.btn-clair-ghost { background: transparent; color: var(--sable); border-color: rgb(255 255 255 / 45%); }
```

## 7. Typographie (self-hostée, licences OFL dans `src/fonts/`)

- **Marelle Bâton 2** : brand, titres de sections (**MAJUSCULES** via
  `text-transform: uppercase`, `--t-xl`, `letter-spacing: 0.04em`), accroches ;
- **Rubik** 700 : sous-titres, boutons, labels ; Rubik 400 : texte courant
  (`line-height: 1.7`) ;
- textes sur fond noir : blanc/sable uniquement, `opacity` ≥ 0.8.

## 8. Footer

Grande **bulle encre** (inchangée sur noir — elle marque la fin de page) :
brand blanc + accent, 2 colonnes desktop (2/3 présentation + formulaire
contact avec confirmation d'envoi, 1/3 liens en pilules translucides
`rgb(255 255 255 / 8%)`, hover sable), 1 colonne empilée en mobile.

## 9. Interdits (règles MANA)

Dégradés décoratifs · glassmorphism (zéro backdrop-filter) · compteurs
factices · urgence artificielle · carrousel auto · emoji UI · plus d'un
accent coloré. Sobriété : budget CSS < 20 Ko, zéro dépendance UI.

## 10. Spécificités manafrance.org à préserver

Le contenu actuel est gardé, seul l'habillage change :
- titre **MANAFRANCE** (monospace actuel → passer en Marelle Bâton 2
  majuscules, encre sur la bulle) ;
- sous-titre « Associations et bénévolat près de chez vous » → accroche
  Marelle sur la bulle ou dans la sous-bulle ;
- bouton orange « MISSIONS DE BÉNÉVOLAT » → `btn-primary` encre (l'orange
  reste l'accent, pas le fond du bouton principal) ;
- les deux champs de recherche + CHERCHER → moteur hero (§5) ;
- « PAR THÈME » / « PAR RÉGION » → segments du moteur ou filtres du
  catalogue.

## 11. Checklist de transposition

1. Copier `src/fonts/` + blocs `@font-face` ;
2. copier le design system `src/styles.css` puis appliquer les variables §2 ;
3. remplacer tous les `#c9a227` par `var(--orange)` ;
4. passer le fond body à `--noir` et ajuster les ombres (plus profondes) ;
5. transposer le contenu existant dans les composants hero/bulles/footer ;
6. vérifier mobile PWA une ligne, fenêtre privée, fetch URL live.

*Source : `gilletaurelien-art/manahome-app` main — toute divergence se
règle en relisant `src/styles.css`, qui fait foi.*
