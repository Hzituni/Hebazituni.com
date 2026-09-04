import { zColor } from "@remotion/zod-types";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { JOST, PLAYFAIR } from "../fonts";
import { Backdrop } from "./Backdrop";
import { Card, EditTimeline, Equalizer, Viewfinder } from "./Card";
import { DotGrid } from "./DotGrid";
import { P } from "./palette";

/** Everything is composed at this size and scaled to the real frame, so the
 *  same layout can be re-cut to other ratios later without re-measuring. */
const STAGE_W = 1080;
const STAGE_H = 1920;

export const introSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  wordmark: z.string(),
  /** File in public/, e.g. "hero.jpg". Empty falls back to the drawn wall. */
  heroImage: z.string(),
  cardOne: z.string(),
  cardTwo: z.string(),
  cardThree: z.string(),
  accent: zColor(),
  /**
   * dark        - the design as approved: near-black ground and dot grid.
   * olive       - the same, on a dark olive green ground.
   * transparent - ground and grid dropped, so the cards composite straight
   *               over your own footage.
   * green       - the same overlay on chroma green, for editors whose alpha
   *               support is unreliable (CapCut among them).
   */
  ground: z.enum(["dark", "olive", "transparent", "green"]),
});

export type IntroProps = z.infer<typeof introSchema>;

export const introDefaults: IntroProps = {
  firstName: "HEBA",
  lastName: "ZITUNI",
  wordmark: "HEBAZITUNI.COM",
  heroImage: "hero.jpg",
  ground: "dark",
  cardOne: "Creative",
  cardTwo: "Cinematic",
  cardThree: "Bold",
  accent: P.orange,
};

export const Intro: React.FC<IntroProps> = ({
  firstName,
  lastName,
  wordmark,
  heroImage,
  cardOne,
  cardTwo,
  cardThree,
  ground,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const scale = Math.min(width / STAGE_W, height / STAGE_H);

  /** Cards arrive out of depth: oversized, out of focus, drifting forward
   *  into place. Reads more considered than sliding in from an edge. */
  const arrive = (delay: number, from = 1.14) => {
    const s = spring({
      fps,
      frame: frame - delay,
      config: { damping: 200, mass: 0.9 },
      durationInFrames: 46,
    });
    return {
      opacity: interpolate(s, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
      scale: interpolate(s, [0, 1], [from, 1]),
      blur: interpolate(s, [0, 0.8], [22, 0], { extrapolateRight: "clamp" }),
      lift: interpolate(s, [0, 1], [58, 0]),
    };
  };

  /** Slow parallax so the finished frame keeps breathing under the hold. */
  const float = (amp: number, period: number, phase: number) =>
    Math.sin((frame / period) * Math.PI * 2 + phase) * amp;

  const layer = (a: ReturnType<typeof arrive>, drift: number, rot = 0) => ({
    opacity: a.opacity,
    filter: a.blur > 0.15 ? `blur(${a.blur}px)` : undefined,
    transform: `translateY(${a.lift + drift}px) scale(${a.scale}) rotate(${
      rot * (1 - a.opacity)
    }deg)`,
  });

  const hero = arrive(6, 1.1);
  const cA = arrive(22);
  const cB = arrive(30);
  const cC = arrive(38);
  const chip = arrive(46, 1.3);

  // Name wipes in word by word rather than fading -- a cut, not a dissolve.
  const wipe = (delay: number, len: number) =>
    interpolate(frame, [delay, delay + len], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const wipeA = wipe(58, 20);
  const wipeB = wipe(70, 22);

  const markIn = interpolate(frame, [84, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const gridIn = interpolate(frame, [0, 28], [0, 1], { extrapolateRight: "clamp" });

  // The whole composition dissolves to alpha, so it hands off to footage.
  const OUT = 26;
  const exit = interpolate(
    frame,
    [durationInFrames - OUT, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exitPush = interpolate(
    frame,
    [durationInFrames - OUT, durationInFrames - 1],
    [1, 1.035],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const HERO = { x: 230, y: 470, w: 620, h: 900 };

  return (
    <AbsoluteFill>
      {/* Chroma ground sits outside the dissolve, so the fade reveals green
          and keys away cleanly rather than fading to grey. */}
      {ground === "green" ? (
        <AbsoluteFill style={{ backgroundColor: "#00B140" }} />
      ) : null}
      <AbsoluteFill style={{ opacity: exit }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale * exitPush})`,
          transformOrigin: "center center",
        }}
      >
        <AbsoluteFill
          style={{
            width: STAGE_W,
            height: STAGE_H,
            left: (width - STAGE_W) / 2,
            top: (height - STAGE_H) / 2,
            backgroundColor:
              ground === "dark"
                ? P.ground
                : ground === "olive"
                  ? P.groundOlive
                  : "transparent",
            overflow: "hidden",
          }}
        >
          {ground === "dark" || ground === "olive" ? (
            <DotGrid
              w={STAGE_W}
              h={STAGE_H}
              dot={ground === "olive" ? P.gridDotOlive : P.gridDot}
              opacity={gridIn * 0.9}
            />
          ) : null}

          {/* Hero card */}
          <div
            style={{
              position: "absolute",
              left: HERO.x,
              top: HERO.y,
              width: HERO.w,
              height: HERO.h,
              ...layer(hero, float(9, 150, 0)),
            }}
          >
            {/* Edge glow: a warm bloom sitting behind the card, breathing
                slowly so the still frame never looks frozen. */}
            <div
              style={{
                position: "absolute",
                inset: -54,
                borderRadius: 70,
                background: `radial-gradient(ellipse at 50% 45%, rgba(232,81,31,${
                  0.6 + Math.sin(frame / 46) * 0.1
                }) 0%, rgba(232,81,31,0.16) 45%, rgba(232,81,31,0) 72%)`,
                filter: "blur(34px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 34,
                overflow: "hidden",
                // Glow hugging the border, not just a bloom behind the card.
                boxShadow: `0 60px 120px rgba(0,0,0,0.62), 0 0 46px rgba(232,81,31,${
                  0.42 + Math.sin(frame / 46) * 0.08
                }), 0 0 110px rgba(232,81,31,0.22)`,
              }}
            >
            {heroImage ? (
              <Img
                src={staticFile(heroImage)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Backdrop w={HERO.w} h={HERO.h} />
            )}

            {/* Scrim, kept light: just enough to seat the name on the
                photograph without dulling it. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(10,10,7,0) 42%, rgba(10,10,7,0.44) 68%, rgba(10,10,7,0.82) 100%)",
              }}
            />

            {/* Name, set on the card as asked: caps roman over caps italic. */}
            <div
              style={{
                position: "absolute",
                left: 52,
                top: 586,
                color: P.white,
                fontFamily: PLAYFAIR,
                lineHeight: 1.13,
                textShadow: "0 6px 30px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  fontSize: 82,
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  clipPath: `inset(0 ${(1 - wipeA) * 100}% 0 0)`,
                }}
              >
                {firstName}
              </div>
              <div
                style={{
                  fontSize: 96,
                  fontWeight: 500,
                  fontStyle: "italic",
                  letterSpacing: "0.01em",
                  clipPath: `inset(0 ${(1 - wipeB) * 100}% 0 0)`,
                }}
              >
                {lastName}
              </div>
            </div>

            {/* Lit rim: a hairline that catches at the top-left, the way a
                real edge would under the wall's light. */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 34,
                  boxShadow:
                    "inset 0 0 0 1.5px rgba(255,214,180,0.34), inset 0 1px 0 0 rgba(255,246,236,0.5)",
                }}
              />
            </div>
          </div>

          {/* Satellites */}
          <div
            style={{ position: "absolute", left: 640, top: 300, ...layer(cA, float(12, 190, 1.1), -4) }}
          >
            <Card label={cardTwo} variant="paper" w={330} h={205}>
              <Viewfinder />
            </Card>
          </div>

          <div
            style={{ position: "absolute", left: 55, top: 790, ...layer(cB, float(14, 165, 2.4), 4) }}
          >
            <Card label={cardOne} variant="frosted" w={345} h={255} solid={ground === "green"}>
              <EditTimeline />
            </Card>
          </div>

          <div
            style={{ position: "absolute", left: 690, top: 1300, ...layer(cC, float(11, 205, 0.4), -3) }}
          >
            <Card label={cardThree} variant="orange" w={350} h={285}>
              <Equalizer start={46} />
            </Card>
          </div>

          {/* Monogram chip */}
          <div
            style={{
              position: "absolute",
              left: 132,
              top: 552,
              width: 122,
              height: 122,
              borderRadius: 61,
              background: ground === "green" ? "#23241C" : "rgba(232,224,210,0.12)",
              border: "1px solid rgba(255,251,244,0.22)",
              backdropFilter: ground === "green" ? undefined : "blur(14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...layer(chip, float(10, 140, 3.2)),
            }}
          >
            <span
              style={{
                fontFamily: PLAYFAIR,
                fontStyle: "italic",
                fontSize: 48,
                color: P.bone,
              }}
            >
              HZ
            </span>
          </div>

          {/* Wordmark */}
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 1700,
              fontFamily: JOST,
              fontWeight: 300,
              fontSize: 20,
              letterSpacing: "0.42em",
              color: P.boneMid,
              opacity: markIn,
              transform: `translateX(${(1 - markIn) * -16}px)`,
            }}
          >
            {wordmark}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};