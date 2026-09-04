/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

/**
 * Remotion normally downloads its own Chrome Headless Shell on first render.
 * Some sandboxes/CI images block that download but already ship a Chromium,
 * so prefer an explicit REMOTION_BROWSER_EXECUTABLE, then any known local
 * build, and otherwise fall through to Remotion's own download.
 */
const browserCandidates = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter((p): p is string => Boolean(p));

const browser = browserCandidates.find((p) => existsSync(p));
if (browser) {
  Config.setBrowserExecutable(browser);
}
