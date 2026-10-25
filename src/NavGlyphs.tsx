// Glyphes de navigation : même famille que Glyphs.tsx (trait 1.5, sobre).
// Mobile : icône seule ; desktop/tablette : icône au-dessus du libellé.

type GlyphProps = { size?: number };

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function NavAnnonces({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3" y="4" width="8" height="7" rx="1.5" />
      <rect x="13" y="4" width="8" height="7" rx="1.5" />
      <rect x="3" y="13" width="8" height="7" rx="1.5" />
      <rect x="13" y="13" width="8" height="7" rx="1.5" />
    </svg>
  );
}

export function NavTerritoire({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12 21s-6.5-5.2-6.5-10a6.5 6.5 0 0 1 13 0c0 4.8-6.5 10-6.5 10z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}

export function NavPros({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function NavPublier({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M12 10.5v5M9.5 13h5" />
    </svg>
  );
}
