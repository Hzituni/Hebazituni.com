import { P } from "./palette";

/** The reference's dotted ground plane. Drawn as a tiled pattern so the cost
 *  is constant no matter how large the frame gets. */
export const DotGrid: React.FC<{
  readonly w: number;
  readonly h: number;
  readonly gap?: number;
  readonly opacity?: number;
  readonly dot?: string;
}> = ({ w, h, gap = 38, opacity = 1, dot = P.gridDot }) => (
  <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} opacity={opacity}>
    <defs>
      <pattern id="dots" width={gap} height={gap} patternUnits="userSpaceOnUse">
        <circle cx={gap / 2} cy={gap / 2} r="2.1" fill={dot} />
      </pattern>
      <radialGradient id="dotFade" cx="50%" cy="46%" r="62%">
        <stop offset="0%" stopColor="#fff" stopOpacity="1" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id="dotMask">
        <rect width={w} height={h} fill="url(#dotFade)" />
      </mask>
    </defs>
    <rect width={w} height={h} fill="url(#dots)" mask="url(#dotMask)" />
  </svg>
);
