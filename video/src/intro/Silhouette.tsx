/**
 * A woman in hijab and abaya, drawn as a silhouette and seen from behind --
 * the same read as the reference's samurai, where the figure is a shape
 * rather than a portrait. No facial features, so it stays iconic and needs
 * no photograph.
 */

// Crown, hijab drape, shoulder, then the abaya falling to the frame edge.
// Kept narrow through the hem: a wider flare reads as a mass, not a person.
const BODY = `
M 350 88
C 300 88, 268 128, 265 188
C 262 236, 256 268, 246 300
C 234 338, 220 358, 210 376
C 194 404, 186 452, 182 522
C 177 606, 172 720, 166 848
C 162 930, 160 972, 159 1000
L 545 1000
C 544 968, 540 918, 534 848
C 526 742, 518 630, 512 546
C 506 480, 498 424, 486 394
C 476 368, 464 352, 452 336
C 440 320, 434 296, 431 266
C 428 234, 428 198, 425 176
C 419 126, 398 88, 350 88
Z`;

// The scarf's falling edge. Hugs the body -- pushed out further it reads as a wing.
const SCARF = `
M 452 336
C 486 366, 512 420, 522 486
C 530 540, 528 590, 520 628
C 516 580, 505 528, 488 480
C 474 440, 460 386, 452 336
Z`;

export const Silhouette: React.FC<{
  readonly width: number;
  readonly rim?: string;
}> = ({ width, rim = "rgba(255,164,104,0.28)" }) => {
  const height = width * (1000 / 700);
  return (
    <svg width={width} height={height} viewBox="0 0 700 1000" style={{ display: "block" }}>
      <g fill="#0A0A07">
        <path d={BODY} />
        <path d={SCARF} />
      </g>
      {/* Warm rim where the wall light wraps the figure. */}
      <g fill="none" stroke={rim} strokeWidth="2.5">
        <path d={BODY} />
        <path d={SCARF} />
      </g>
    </svg>
  );
};
