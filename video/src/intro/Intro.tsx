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
import { Silhouette } from "./Silhouette";

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
});

export type IntroProps = z.infer<typeof introSchema>;

export const introDefaults: IntroProps = {
  firstName: "HEBA",
  lastName: "ZITUNI",
  wordmark: "HEBAZITUNI.COM",
  heroImage: "",
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
            backgroundColor: P.ground,
            overflow: "hidden",
          }}
        >
          <DotGrid w={STAGE_W} h={STAGE_H} opacity={gridIn * 0.9} />

          {/* Hero card */}
          <div
            style={{
              position: "absolute",
              left: HERO.x,
              top: HERO.y,
              width: HERO.w,
              height: HERO.h,
              borderRadius: 34,
              overflow: "hidden",
              boxShadow: "0 60px 120px rgba(0,0,0,0.6)",
              ...layer(hero, float(9, 150, 0)),
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

            <div
              style={{
                position: "absolute",
                left: 140,
                top: HERO.h - 671 + 20,
              }}
            >
              <Silhouette width={470} />
            </div>

            {/* Scrim: the reference bleeds a gradient up the card's base. It
                also gives the name one consistent ground instead of half
                bright wall, half dark figure. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(10,10,7,0) 40%, rgba(10,10,7,0.42) 66%, rgba(10,10,7,0.80) 100%)",
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
            <Card label={cardOne} variant="frosted" w={345} h={255}>
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
              background: "rgba(232,224,210,0.12)",
              border: "1px solid rgba(255,251,244,0.22)",
              backdropFilter: "blur(14px)",
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
  );
};
