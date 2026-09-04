import { Composition } from "remotion";
import { Intro, introDefaults, introSchema } from "./intro/Intro";
import { TitleCard, titleCardDefaults, titleCardSchema } from "./TitleCard";

/**
 * One component, three deliverables: YouTube (16:9), Reels/Shorts/Stories
 * (9:16) and a square feed post. Edit the copy once and all three follow.
 */
const FPS = 30;
const DURATION = 150; // 5s

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Intro-Vertical"
        component={Intro}
        schema={introSchema}
        defaultProps={introDefaults}
        durationInFrames={150}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Intro-Vertical-Overlay"
        component={Intro}
        schema={introSchema}
        defaultProps={{ ...introDefaults, ground: "transparent" as const }}
        durationInFrames={150}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Intro-Vertical-Green"
        component={Intro}
        schema={introSchema}
        defaultProps={{ ...introDefaults, ground: "green" as const }}
        durationInFrames={150}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="TitleCard-Landscape"
        component={TitleCard}
        schema={titleCardSchema}
        defaultProps={titleCardDefaults}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="TitleCard-Vertical"
        component={TitleCard}
        schema={titleCardSchema}
        defaultProps={titleCardDefaults}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="TitleCard-Square"
        component={TitleCard}
        schema={titleCardSchema}
        defaultProps={titleCardDefaults}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1080}
      />
    </>
  );
};
