import { P } from "./palette";

/**
 * The terracotta wall behind the figure: a sunlit render wall with olive
 * branch shadows raking across it. Generated rather than photographed, so it
 * carries no licence and every value stays tunable. Geometry is derived from
 * a fixed seed at module scope, so every frame and every render thread draws
 * exactly the same wall.
 */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Leaf = { x: number; y: number; rx: number; ry: number; rot: number };
type Branch = { d: string; leaves: Leaf[] };

const buildBranches = (): Branch[] => {
  const rand = mulberry32(20260904);
  const branches: Branch[] = [];

  // Three sprigs raking down-right, as a low sun would throw them.
  const starts = [
    { x: -40, y: 120, len: 520, drop: 300 },
    { x: 40, y: 380, len: 460, drop: 240 },
    { x: -60, y: 640, len: 400, drop: 190 },
  ];

  for (const s of starts) {
    const endX = s.x + s.len;
    const endY = s.y + s.drop;
    const d = `M ${s.x} ${s.y} C ${s.x + s.len * 0.4} ${s.y + s.drop * 0.1}, ${
      s.x + s.len * 0.7
    } ${s.y + s.drop * 0.5}, ${endX} ${endY}`;

    const leaves: Leaf[] = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      // Point on the sprig, approximated along the same curve.
      const bx = s.x + s.len * t;
      const by = s.y + s.drop * (t * t * 0.85 + t * 0.15);
      const side = i % 2 === 0 ? -1 : 1;
      const spread = 34 + rand() * 40;
      leaves.push({
        x: bx + side * spread * 0.35,
        y: by + side * spread,
        rx: 27 + rand() * 17,
        ry: 12 + rand() * 6,
        rot: -28 + side * 34 + rand() * 26,
      });
    }
    branches.push({ d, leaves });
  }
  return branches;
};

const BRANCHES = buildBranches();

export const Backdrop: React.FC<{ readonly w: number; readonly h: number }> = ({ w, h }) => {
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={P.clayLit} />
          <stop offset="46%" stopColor={P.clay} />
          <stop offset="100%" stopColor={P.clayDeep} />
        </linearGradient>

        {/* The hard diagonal edge where direct sun stops. */}
        <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF9A5E" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FF9A5E" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.clayShadow} stopOpacity="0" />
          <stop offset="100%" stopColor={P.clayShadow} stopOpacity="0.85" />
        </linearGradient>

        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6.5" />
        </filter>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width={w} height={h} fill="url(#wall)" />

      {/* Sunlit wedge across the upper wall. */}
      <polygon points={`0,0 ${w},0 ${w},${h * 0.34} 0,${h * 0.62}`} fill="url(#sun)" />

      <g filter="url(#soft)" opacity="0.36">
        {BRANCHES.map((b, i) => (
          <g key={i} fill={P.clayShadow} stroke={P.clayShadow}>
            <path d={b.d} strokeWidth="3" fill="none" />
            {b.leaves.map((l, j) => (
              <path
                key={j}
                // A pointed lens, not an ellipse -- olive leaves have tips.
                d={`M ${-l.rx} 0 Q 0 ${-l.ry}, ${l.rx} 0 Q 0 ${l.ry}, ${-l.rx} 0 Z`}
                transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}
              />
            ))}
          </g>
        ))}
      </g>

      {/* Weight at the base, so the figure has something to stand against. */}
      <rect y={h * 0.55} width={w} height={h * 0.45} fill="url(#foot)" />

      {/* Wall tooth. */}
      <rect width={w} height={h} filter="url(#grain)" opacity="0.07" />
    </svg>
  );
};
