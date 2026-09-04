import { Fragment } from "react";
import { zColor } from "@remotion/zod-types";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { CORMORANT, JOST } from "./fonts";
import { COLORS } from "./theme";

export const titleCardSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  eyebrow: z.string(),
  background: zColor(),
  accent: zColor(),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const titleCardDefaults: TitleCardProps = {
  firstName: "Heba",
  lastName: "Zituni",
  eyebrow: "Creative Director · Photographer · Muscat, Oman",
  background: COLORS.black,
  accent: COLORS.bone,
};

export const TitleCard: React.FC<TitleCardProps> = ({
  firstName,
  lastName,
  eyebrow,
  background,
  accent,
}) => {
  const eyebrowParts = eyebrow
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Type scales off the short edge so 16:9, 9:16 and 1:1 all stay balanced.
  const unit = Math.min(width, height) / 100;

  const rise = (delay: number) =>
    spring({ fps, frame: frame - delay, config: { damping: 200 }, durationInFrames: 40 });

  const firstIn = rise(10);
  const lastIn = rise(22);
  const eyebrowIn = rise(4);
  const ruleIn = rise(46);
  const roleIn = rise(58);

  // A held breath at the end rather than a hard cut.
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Very slow push in; the frame should feel photographic, never zoomy.
  const push = interpolate(frame, [0, durationInFrames], [1, 1.05]);

  return (
    <AbsoluteFill style={{ backgroundColor: background, opacity: fadeOut }}>
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", paddingInline: unit * 8 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              columnGap: unit * 1.4,
              rowGap: unit * 1.2,
              fontFamily: JOST,
              fontWeight: 300,
              fontSize: unit * 2.4,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: COLORS.boneMid,
              opacity: eyebrowIn,
              transform: `translateY(${(1 - eyebrowIn) * unit * 2}px)`,
            }}
          >
            {/*
              Laid out as flex items split on the separator so a narrow frame
              breaks between phrases -- never mid-phrase, which stranded
              "Oman" on its own line in 9:16.
            */}
            {eyebrowParts.map((part, i) => (
              <Fragment key={part}>
                {i > 0 ? <span style={{ opacity: 0.5 }}>·</span> : null}
                <span style={{ whiteSpace: "nowrap" }}>{part}</span>
              </Fragment>
            ))}
          </div>

          <div
            style={{
              fontFamily: CORMORANT,
              fontWeight: 300,
              fontSize: unit * 17,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              color: COLORS.white,
              marginTop: unit * 5,
            }}
          >
            <div
              style={{
                opacity: firstIn,
                transform: `translateY(${(1 - firstIn) * unit * 5}px)`,
              }}
            >
              {firstName}
            </div>
            <div
              style={{
                fontStyle: "italic",
                color: accent,
                opacity: lastIn,
                transform: `translateY(${(1 - lastIn) * unit * 5}px)`,
              }}
            >
              {lastName}
            </div>
          </div>

          <div
            style={{
              width: ruleIn * unit * 22,
              height: 1,
              backgroundColor: COLORS.olive,
              margin: `${unit * 5}px auto 0`,
            }}
          />

          <div
            style={{
              fontFamily: JOST,
              fontWeight: 300,
              fontSize: unit * 2.2,
              // Letter-spacing settles inward as it fades up.
              letterSpacing: `${interpolate(roleIn, [0, 1], [0.5, 0.2])}em`,
              textTransform: "uppercase",
              color: COLORS.bone,
              marginTop: unit * 4,
              opacity: roleIn,
            }}
          >
            Portfolio
          </div>
        </div>
      </AbsoluteFill>

      {/* Vignette: keeps the corners from feeling flat, as in a printed plate. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 45%, ${COLORS.black}cc 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
