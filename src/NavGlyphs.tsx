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

export function NavPros({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.4" />
      <path d="M9.5 7.5V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 13h17" />
      <Accent cx={17.2} cy={10.2} r={1.2} />
    </svg>
  );
}

export function NavPublier({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M4 11.2 12 4.5l8 6.7" />
      <path d="M5.5 10.2V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8.8" />
      <path d="M12 10.6v4.6M9.8 12.8h4.4" />
    </svg>
  );
}

export function NavEstimation({ size = 20 }: GlyphProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M12 3.5v17" />
      <path d="M4.5 6.2h15" />
      <path d="m6.4 6.2-2.6 5.6a3 3 0 0 0 5.4 0z" />
      <path d="m17.6 6.2-2.6 5.6a3 3 0 0 0 5.4 0z" />
      <path d="M9 20.5h6" />
      <Accent cx={12} cy={20.5} r={1.1} />
    </svg>
  );
}
