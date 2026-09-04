import { loadFont } from "@remotion/fonts";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/**
 * Fonts are self-hosted in public/fonts rather than fetched from Google's CDN
 * at render time. Renders stay hermetic: no network round-trip per frame, no
 * CDN outage or TLS surprise mid-render, and identical output on any machine.
 *
 * Both files are the "latin" subset as variable fonts, so a single file covers
 * the whole weight range declared below.
 */
export const JOST = "Jost";
export const CORMORANT = "Cormorant Garamond";

const handle = delayRender("Loading self-hosted fonts");

Promise.all([
  loadFont({
    family: JOST,
    url: staticFile("fonts/Jost-latin.woff2"),
    format: "woff2",
    weight: "300 500",
    display: "block",
  }),
  loadFont({
    family: CORMORANT,
    url: staticFile("fonts/CormorantGaramond-latin.woff2"),
    format: "woff2",
    weight: "300 700",
    display: "block",
  }),
])
  .then(() => continueRender(handle))
  .catch((err) => cancelRender(err));
