import { useCurrentFrame } from "remotion";
import { JOST } from "../fonts";
import { P } from "./palette";

export type Variant = "frosted" | "paper" | "orange";

const skins: Record<Variant, React.CSSProperties> = {
  frosted: {
    background: "rgba(232,224,210,0.10)",
    border: "1px solid rgba(255,251,244,0.20)",
    backdropFilter: "blur(18px)",
    color: P.white,
  },
  paper: {
    background: P.paper,
    border: "1px solid rgba(17,18,13,0.08)",
    color: P.black,
  },
  orange: {
    background: P.orange,
    border: "1px solid rgba(255,255,255,0.16)",
    color: P.white,
  },
};

export const Card: React.FC<{
  readonly label: string;
  readonly variant: Variant;
  readonly w: number;
  readonly h: number;
  readonly children: React.ReactNode;
  /** Chroma-key exports cannot carry translucency: green read through a
   *  frosted card keys away with the background and punches a hole in it.
   *  This swaps the frost for the solid colour it resolves to on the dark
   *  ground, so the card survives the key. */
  readonly solid?: boolean;
}> = ({ label, variant, w, h, children, solid = false }) => {
  const skin =
    solid && variant === "frosted"
      ? {
          background: "#23241C",
          border: "1px solid rgba(255,251,244,0.20)",
          color: P.white,
        }
      : skins[variant];
  const dim = variant === "paper" ? "rgba(17,18,13,0.55)" : "rgba(255,251,244,0.70)";
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 26,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
        overflow: "hidden",
        ...skin,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontFamily: JOST,
            fontWeight: 400,
            fontSize: 19,
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: JOST, fontSize: 19, color: dim }}>→</span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Creative: an edit timeline -- clips on two tracks under a playhead. Reads
 *  as video editing at a glance and stays distinct from the viewfinder. */
export const EditTimeline: React.FC = () => {
  const w = 176;
  const h = 96;
  const clip = (x: number, y: number, cw: number, o: number) => (
    <rect x={x} y={y} width={cw} height={22} rx={5} fill={P.white} opacity={o} />
  );
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {clip(0, 14, 62, 0.95)}
      {clip(68, 14, 40, 0.55)}
      {clip(114, 14, 62, 0.8)}
      {clip(0, 52, 44, 0.6)}
      {clip(50, 52, 74, 0.95)}
      {clip(130, 52, 46, 0.5)}
      {/* Playhead */}
      <g fill={P.white}>
        <rect x={95} y={2} width={2.5} height={92} />
        <path d={`M ${96.25 - 7} 0 L ${96.25 + 7} 0 L ${96.25} 11 Z`} />
      </g>
    </svg>
  );
};

/** Cinematic: a viewfinder framing the empty middle -- the shot before it exists. */
export const Viewfinder: React.FC = () => {
  const s = 80;
  const arm = 23;
  const t = 2.5;
  const c = P.black;
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <rect width={arm} height={t} fill={c} />
      <rect width={t} height={arm} fill={c} />
    </g>
  );
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {corner(0, 0, 1, 1)}
      {corner(s, 0, -1, 1)}
      {corner(0, s, 1, -1)}
      {corner(s, s, -1, -1)}
      <circle cx={s / 2} cy={s / 2} r="3" fill={c} />
    </svg>
  );
};

/** Bold: the reference's equalizer, kept because it is the one motif that
 *  actually moves. Heights are fixed and phase-shifted, never random, so the
 *  bars are identical on every render thread. */
const BAR_SEED = [0.35, 0.62, 0.44, 0.82, 0.55, 0.95, 0.7, 1, 0.76, 0.58, 0.88, 0.46, 0.66, 0.38];

export const Equalizer: React.FC<{ readonly start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const w = 210;
  const h = 104;
  const bw = 7;
  const gap = (w - BAR_SEED.length * bw) / (BAR_SEED.length - 1);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {BAR_SEED.map((base, i) => {
        const wave = Math.sin((frame - start) / 7 + i * 0.55) * 0.16;
        const grow = Math.min(1, Math.max(0, (frame - start - i * 1.6) / 12));
        const bh = Math.max(4, h * (base + wave) * grow);
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={bw / 2}
            fill={P.white}
          />
        );
      })}
    </svg>
  );
};
