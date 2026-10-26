// Glyphes SVG inline — zéro dépendance, zéro requête réseau.
// Style « synapse » : trait 1.4, géométrie régulière sur grille 24,
// arrondis généreux, accent or (pastille) en point focal — l'icône
// signe, elle ne décore pas.

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

export function GlyphPros({ size = 24 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.4" />
      <path d="M9.5 7.5V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 13h17" />
      <Accent cx={17.2} cy={10.2} r={1.2} />
    </svg>
  );
}
