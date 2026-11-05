// Glyphes de navigation : famille « synapse » (trait 1.4, arrondis,
// pastille focale). Mobile : icône seule ; desktop : au-dessus du libellé.

type GlyphProps = { size?: number };

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Accent({ cx, cy, r = 1.5 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
}

export function NavAnnonces({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="4.5" width="7.2" height="6.4" rx="2" />
      <rect x="13.3" y="4.5" width="7.2" height="6.4" rx="2" />
      <rect x="3.5" y="13.1" width="7.2" height="6.4" rx="2" />
      <rect x="13.3" y="13.1" width="7.2" height="6.4" rx="2" />
      <Accent cx={16.9} cy={7.7} r={1.2} />
    </svg>
  );
}

export function NavTerritoire({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12 21c-3.9-3.2-6.3-6.7-6.3-10.2a6.3 6.3 0 0 1 12.6 0C18.3 14.3 15.9 17.8 12 21z" />
      <circle cx="12" cy="10.6" r="2.3" />
      <Accent cx={12} cy={10.6} r={1.1} />
    </svg>
  );
}

// Publier : un « + », jamais une maison — le header porte déjà celle de
// la marque, juste à côté (05/11/2026). Même silhouette = même icône pour
// deux actions différentes, une vraie collision trouvée à l'écran.
export function NavPublier({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.8v8.4M7.8 12h8.4" />
      <Accent cx={12} cy={12} r={0} />
    </svg>
  );
}

