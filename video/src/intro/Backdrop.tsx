import { P } from "./palette";

/**
 * Stand-in for the terracotta wall: a sunlit render wall with olive branches
 * across it, echoing the reference photograph's composition -- shadowed wedge
 * in the top-left corner, hard diagonal light break, foliage entering from
 * the left, cast shadows falling away to the lower left.
 *
 * This is drawn, not photographed. Supply `heroImage` on the composition to
 * replace it with a real picture; nothing else in the layout changes.
 *
 * Geometry comes from a fixed seed at module scope, so every frame and every
 * render thread draws exactly the same wall.
 */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Leaf = { x: number; y: number; rx: number; ry: number; rot: number; tone: number };
type Branch = { d: string; leaves: Leaf[] };

// Unit-space (0..1) sprigs, scaled to the card at draw time.
const buildBranches = (seed: number, specs: { x: number; y: number; len: number; drop: number }[]) => {
  const rand = mulberry32(seed);
  const out: Branch[] = [];
  for (const s of specs) {
    const endX = s.x + s.len;
    const endY = s.y + s.drop;
    const d = `M ${s.x} ${s.y} C ${s.x + s.len * 0.42} ${s.y + s.drop * 0.08}, ${
      s.x + s.len * 0.74
    } ${s.y + s.drop * 0.48}, ${endX} ${endY}`;

    const leaves: Leaf[] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      const bx = s.x + s.len * t;
      const by = s.y + s.drop * (t * t * 0.8 + t * 0.2);
      const side = i % 2 === 0 ? -1 : 1;
      const spread = 0.028 + rand() * 0.034;
      leaves.push({
        x: bx + side * spread * 0.3,
        y: by + side * spread,
        // Olive leaves are long and narrow -- roughly four to one.
        rx: 0.036 + rand() * 0.026,
        ry: 0.009 + rand() * 0.005,
        rot: -24 + side * 30 + rand() * 24,
        tone: rand(),
      });
    }
    out.push({ d, leaves });
  }
  return out;
};

// Foliage catching the light, entering from the left as in the photograph.
const LIT = buildBranches(20260904, [
  { x: -0.06, y: 0.2, len: 0.78, drop: 0.2 },
  { x: -0.1, y: 0.46, len: 0.7, drop: 0.16 },
]);

// The same foliage thrown onto the wall, longer and softer.
const CAST = buildBranches(77712, [
  { x: 0.1, y: 0.08, len: 0.86, drop: 0.3 },
  { x: -0.04, y: 0.42, len: 0.8, drop: 0.26 },
]);

const LEAF_TONES = ["#7E8C5E", "#63714A", "#4A5836", "#8E9A6E"];

const leafPath = (rx: number, ry: number) =>
  `M ${-rx} 0 Q 0 ${-ry}, ${rx} 0 Q 0 ${ry}, ${-rx} 0 Z`;

export const Backdrop: React.FC<{ readonly w: number; readonly h: number }> = ({ w, h }) => {
  const sx = (v: number) => v * w;
  const sy = (v: number) => v * h;

  const branchGroup = (
    branches: Branch[],
    stroke: string,
    fill: (l: Leaf) => string,
    strokeW: number,
  ) =>
    branches.map((b, i) => {
      // Re-express the unit-space curve in card pixels.
      const nums = b.d.match(/-?\d*\.?\d+/g)!.map(Number);
      const px = nums.map((n, k) => (k % 2 === 0 ? sx(n) : sy(n)));
      const d = `M ${px[0]} ${px[1]} C ${px[2]} ${px[3]}, ${px[4]} ${px[5]}, ${px[6]} ${px[7]}`;
      return (
        <g key={i}>
          <path d={d} stroke={stroke} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
          {b.leaves.map((l, j) => (
            <path
              key={j}
              d={leafPath(sx(l.rx), sy(l.ry))}
              fill={fill(l)}
              transform={`translate(${sx(l.x)} ${sy(l.y)}) rotate(${l.rot})`}
            />
          ))}
        </g>
      );
    });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor={P.clayLit} />
          <stop offset="52%" stopColor={P.clay} />
          <stop offset="100%" stopColor={P.clayDeep} />
        </linearGradient>
        <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.clayShadow} stopOpacity="0" />
          <stop offset="100%" stopColor={P.clayShadow} stopOpacity="0.8" />
        </linearGradient>
        <filter id="edge" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width={w} height={h} fill="url(#wall)" />

      {/* Shadowed wedge in the top-left, with the hard diagonal break. */}
      <polygon
        points={`0,0 ${w * 0.66},0 0,${h * 0.46}`}
        fill={P.clayShadow}
        opacity="0.5"
        filter="url(#edge)"
      />

      {/* Cast shadows first, then the foliage that throws them. */}
      <g filter="url(#soft)" opacity="0.34">
        {branchGroup(CAST, P.clayShadow, () => P.clayShadow, 4)}
      </g>
      <g>
        {branchGroup(
          LIT,
          "#4A5233",
          (l) => LEAF_TONES[Math.floor(l.tone * LEAF_TONES.length)],
          3.5,
        )}
      </g>

      <rect y={h * 0.55} width={w} height={h * 0.45} fill="url(#foot)" />
      <rect width={w} height={h} filter="url(#grain)" opacity="0.07" />
    </svg>
  );
};
