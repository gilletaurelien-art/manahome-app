// Glyphes SVG inline — zéro dépendance, zéro requête réseau.
// Style « synapse » : trait 1.4, géométrie régulière sur grille 24,
// arrondis généreux, accent or (pastille) en point focal — l'icône
// signe, elle ne décore pas.
//
// ⭐ RÉORGANISÉ le 05/11/2026 : les glyphes vivent par FAMILLE D'USAGE, pas
// par ordre d'ajout. Deux défauts trouvés à l'écran en faisant ce rangement :
// 1. NavPublier (NavGlyphs.tsx) était une maison — identique au logo du
//    header, qui est AUSSI devenu une maison ce jour-là. Refaite en « + ».
// 2. Arrivée/Départ portaient GlyphVoyageurs (deux silhouettes) : une DATE
//    n'est pas un VOYAGEUR. Deux flèches sur calendrier, GlyphArrivee/
//    GlyphDepart, les remplacent.

type GlyphProps = { size?: number };

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Point focal signature : pastille pleine, héritée en currentColor.
function Accent({ cx, cy, r = 1.6 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
}

// ── Marque et sections de l'accueil ──────────────────────────────────────
// GlyphMaison sert aussi de type de bien (Publier) et d'étape « Le bien ».

export function GlyphMaison({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M4 11.2 12 4.5l8 6.7" />
      <path d="M5.5 10.2V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8.8" />
      <path d="M9.5 20v-5.2a.8.8 0 0 1 .8-.8h3.4a.8.8 0 0 1 .8.8V20" />
      <Accent cx={12} cy={8.2} r={1.3} />
    </svg>
  );
}

export function GlyphCompas({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="m14.8 9.2-1.6 4.4-4 1.6 1.6-4.4z" />
      <Accent cx={12} cy={12} r={1.2} />
    </svg>
  );
}

export function GlyphStructure({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M4.5 6.5h15" />
      <path d="M4.5 12h15" />
      <path d="M4.5 17.5h8.5" />
      <circle cx="17.8" cy="17.5" r="2.2" />
      <Accent cx={17.8} cy={17.5} r={1.1} />
    </svg>
  );
}

export function GlyphAccompagnement({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="8.2" cy="7.8" r="3.2" />
      <path d="M3.5 20.5v-.7a4.7 4.7 0 0 1 4.7-4.7h1.6" />
      <path d="m14.5 15.6 5.5-2.3v5.4l-5.5 2.3z" />
      <Accent cx={8.2} cy={7.8} r={1.1} />
    </svg>
  );
}

export function GlyphTerritoire({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.6c2.6 2.3 4 5.1 4 8.4s-1.4 6.1-4 8.4c-2.6-2.3-4-5.1-4-8.4s1.4-6.1 4-8.4z" />
    </svg>
  );
}

// ── Tarifs : un glyphe par palier (04/11/2026) ──────────────────────────

export function GlyphNuit({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M16.8 13.4A7.2 7.2 0 1 1 10.6 4a5.8 5.8 0 0 0 6.2 9.4z" />
      <Accent cx={16.5} cy={6.2} r={1} />
    </svg>
  );
}

export function GlyphSemaine({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M3.5 9.5h17" />
      <path d="M7.5 3.5v3M16.5 3.5v3" />
      <Accent cx={8.2} cy={14} r={1} />
      <Accent cx={12} cy={14} r={1} />
      <Accent cx={15.8} cy={14} r={1} />
    </svg>
  );
}

export function GlyphMois({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M3.5 9.5h17" />
      <path d="M7.5 3.5v3M16.5 3.5v3" />
      <path d="M7.8 13.2h8.4M7.8 16.4h5.6" />
      <Accent cx={16.5} cy={16.4} r={1} />
    </svg>
  );
}

// ── Dates du séjour : Arrivée / Départ (05/11/2026) ─────────────────────
// Deux flèches opposées sur un calendrier — jamais GlyphVoyageurs, qui
// reste réservé au NOMBRE de voyageurs, pas à une date.

export function GlyphArrivee({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M3.5 9.5h17" />
      <path d="M7.5 3.5v3M16.5 3.5v3" />
      <path d="M8.5 15.5h5.5M11.5 12.7l2.8 2.8-2.8 2.8" />
      <Accent cx={16.5} cy={15.5} r={1} />
    </svg>
  );
}

export function GlyphDepart({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M3.5 9.5h17" />
      <path d="M7.5 3.5v3M16.5 3.5v3" />
      <path d="M15.5 15.5h-5.5M12.5 12.7l-2.8 2.8 2.8 2.8" />
      <Accent cx={7.5} cy={15.5} r={1} />
    </svg>
  );
}

// ── Caractéristiques d'une annonce ──────────────────────────────────────

export function GlyphSurface({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M4 9.5V4h5.5" />
      <path d="M20 9.5V4h-5.5" />
      <path d="M4 14.5V20h5.5" />
      <path d="M20 14.5V20h-5.5" />
      <Accent cx={12} cy={12} r={1.2} />
    </svg>
  );
}

export function GlyphPieces({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M6.5 3.5h8.4v17H6.5z" />
      <path d="M14.9 3.5 18.5 5v15l-3.6-1" />
      <Accent cx={12.4} cy={12} r={1} />
    </svg>
  );
}

export function GlyphCouchage({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M3.5 19.5v-9a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9" />
      <path d="M3.5 16h17" />
      <path d="M6 8.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 6v2.5" />
      <Accent cx={8} cy={13} r={1} />
    </svg>
  );
}

export function GlyphDpe({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12.8 2.8 5.5 13.4h5l-1.3 7.8 8.3-11.6h-5.4z" />
      <Accent cx={12} cy={12} r={1} />
    </svg>
  );
}

// ── Type de bien : filtres du catalogue et formulaire de dépôt ─────────
// (GlyphMaison, en tête de fichier, complète ce trio.)

export function GlyphAppartement({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="6" y="3.5" width="12" height="17" rx="1.4" />
      <path d="M9 7.5h1.4M13.6 7.5H15M9 11h1.4M13.6 11H15M9 14.5h1.4M13.6 14.5H15" />
      <rect x="10.4" y="16.5" width="3.2" height="4" />
      <Accent cx={12} cy={7.5} r={0.6} />
    </svg>
  );
}

export function GlyphTerrain({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M3.5 19.5 8 9l3 5 2.5-4.5 3.5 6 3.5-2.5" />
      <path d="M3.5 19.5h17" />
      <Accent cx={13.5} cy={9.5} r={1} />
    </svg>
  );
}

// ── Équipements : parking, piscine, jardin, balcon (04/11/2026) ─────────

export function GlyphParking({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M9 17V7h3.4a3 3 0 0 1 0 6H9" />
      <Accent cx={16.5} cy={6.5} r={0} />
    </svg>
  );
}

export function GlyphPiscine({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M3 8.5c4-4 6 4 10 0s6-4 8 0" />
      <path d="M3 14c4-4 6 4 10 0s6-4 8 0" />
      <path d="M3 19.5c4-4 6 4 10 0s6-4 8 0" />
      <Accent cx={12} cy={4} r={0} />
    </svg>
  );
}

export function GlyphJardin({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12 20.5V12" />
      <path d="M12 12C7 12 4.5 9 4.5 4.5 10 4.5 12 7.5 12 12z" />
      <path d="M12 12c5 0 7.5-3 7.5-7.5-5.5 0-7.5 3-7.5 7.5z" />
      <Accent cx={12} cy={12} r={1} />
    </svg>
  );
}

export function GlyphBalconEquip({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M4 10.5h16" />
      <path d="M4 10.5V19M9 10.5V19M14 10.5V19M19 10.5V19" />
      <path d="M4 19h16" />
      <path d="M4 10.5V6.5h16v4" />
      <Accent cx={12} cy={6.5} r={0} />
    </svg>
  );
}

// ── Formulaire de dépôt : photo, description, contact ───────────────────

export function GlyphPhoto({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M3.5 7.8a1.6 1.6 0 0 1 1.6-1.6h2l1.3-2h7.2l1.3 2h2a1.6 1.6 0 0 1 1.6 1.6v9.6a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6z" />
      <circle cx="12" cy="13" r="4" />
      <Accent cx={12} cy={13} r={1.1} />
    </svg>
  );
}

export function GlyphDescription({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M16.5 3.5 20.5 7.5 9 19H5v-4z" />
      <path d="m14 6 4 4" />
      <Accent cx={5.5} cy={18.5} r={1} />
    </svg>
  );
}

export function GlyphEmail({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="m4.2 6.8 7.8 6 7.8-6" />
      <Accent cx={12} cy={16} r={1} />
    </svg>
  );
}

export function GlyphPersonne({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.5 20.5v-.9a6.3 6.3 0 0 1 6.3-6.3h2.4a6.3 6.3 0 0 1 6.3 6.3v.9" />
      <Accent cx={12} cy={8.2} r={1} />
    </svg>
  );
}

// ── Recherche et séjour ──────────────────────────────────────────────────

export function GlyphVoyageurs({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="8.6" cy="8" r="2.6" />
      <path d="M3.5 19.5v-.8a5.1 5.1 0 0 1 5.1-5.1 5.1 5.1 0 0 1 5.1 5.1v.8" />
      <circle cx="16.5" cy="7.5" r="2" />
      <path d="M15.2 13.8a4.3 4.3 0 0 1 5.3 4.2v1.5" />
      <Accent cx={8.6} cy={8} r={0.9} />
    </svg>
  );
}

export function GlyphBudget({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M14.8 9.2a3 3 0 0 0-2.8-1.7c-1.8 0-3 1.3-3 3s1.2 3 3 3a3 3 0 0 0 2.8-1.7" />
      <path d="M8.3 10.6h4.4M8.3 13.4h4.4" />
      <Accent cx={12} cy={3.6} r={0} />
    </svg>
  );
}

export function GlyphMessagerie({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M4 5.5h16v11H9.5L5 20v-3.5H4z" />
      <Accent cx={8.5} cy={11} r={1} />
      <Accent cx={12} cy={11} r={1} />
      <Accent cx={15.5} cy={11} r={1} />
    </svg>
  );
}

export function GlyphLien({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M12 6.2 14 4.2a3.4 3.4 0 0 1 4.8 4.8l-2 2" />
      <path d="M12 17.8 10 19.8a3.4 3.4 0 0 1-4.8-4.8l2-2" />
      <Accent cx={12} cy={12} r={1} />
    </svg>
  );
}

export function GlyphValidation({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="m8.3 12.3 2.6 2.6 5-5.4" />
      <Accent cx={12} cy={3.6} r={0} />
    </svg>
  );
}

// ── « Notre approche », six piliers ─────────────────────────────────────
// (GlyphStructure, plus haut, est le 4ᵉ pilier : « Une annonce structurée ».)

export function GlyphCadeau({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="9.5" width="17" height="11" rx="1.6" />
      <path d="M3.5 9.5h17" />
      <path d="M12 9.5V20.5" />
      <path d="M12 9.5c-1-3.2-3-4.6-4.5-4.2s-1.6 2.6 0 3.4 4.5.8 4.5.8z" />
      <path d="M12 9.5c1-3.2 3-4.6 4.5-4.2s1.6 2.6 0 3.4-4.5.8-4.5.8z" />
      <Accent cx={12} cy={9.5} r={1.2} />
    </svg>
  );
}

export function GlyphBouclier({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12 3.4 19 6v6c0 5-3 8.3-7 9.6-4-1.3-7-4.6-7-9.6V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
      <Accent cx={12} cy={3.4} r={1} />
    </svg>
  );
}

export function GlyphCadenas({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="5.5" y="11" width="13" height="9.5" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
      <Accent cx={12} cy={15.5} r={1.2} />
    </svg>
  );
}

export function GlyphBalance({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12 3.5v16.2M8 20.5h8" />
      <path d="M4.5 7.5h15" />
      <path d="M4.5 7.5 2.3 12.5a2.4 2.4 0 0 0 4.4 0z" />
      <path d="M19.5 7.5 17.3 12.5a2.4 2.4 0 0 0 4.4 0z" />
      <Accent cx={12} cy={3.5} r={1} />
    </svg>
  );
}

export function GlyphVieLocale({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12 21s-7-5.2-7-10.8A7 7 0 0 1 19 10.2C19 15.8 12 21 12 21z" />
      <path d="M12 10.2a2.4 2.4 0 1 0 0 .01z" />
      <Accent cx={12} cy={10.2} r={1} />
    </svg>
  );
}

// ── Mentions légales ──────────────────────────────────────────────────────
// (GlyphStructure = Éditeur, GlyphBouclier = Nature du service,
// GlyphCadenas = Données personnelles — tous réutilisés d'« Approche ».)

export function GlyphHebergement({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="4" y="9.5" width="16" height="9" rx="1.6" />
      <path d="M4 13.5h16" />
      <circle cx="7" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M8 5.5h8v4H8z" />
      <Accent cx={17} cy={16} r={1} />
    </svg>
  );
}
