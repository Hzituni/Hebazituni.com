# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Project setup notes

### Typography

The site's two typefaces are **self-hosted** in `public/fonts` (latin subset,
variable) and loaded through `src/fonts.ts`:

```tsx
import { JOST, CORMORANT } from "./fonts";

<div style={{ fontFamily: JOST }}>...</div>
```

Renders deliberately do not fetch fonts from Google's CDN. A render pulling
fonts over the network is one outage, proxy, or TLS mismatch away from
failing halfway through, and self-hosting keeps output identical on every
machine. `@remotion/google-fonts` is installed too and is fine for local
experimentation, but anything committed should go through `src/fonts.ts`.

To add a weight or another family, drop the `.woff2` into `public/fonts` and
add a `loadFont` call to `src/fonts.ts`.

### Chrome for rendering

Remotion downloads its own Chrome Headless Shell on first render. Where that
download is unavailable (locked-down CI, sandboxes), `remotion.config.ts`
falls back to a Chromium already on the machine. Point it anywhere with:

```console
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npx remotion render
```

On a normal machine this does nothing and Remotion downloads Chrome as usual.

### Installed packages

Beyond the Remotion core: `transitions`, `shapes`, `paths`, `noise`,
`motion-blur`, `animation-utils` (motion), `captions` (subtitles),
`media-utils` (audio waveforms, media metadata), `fonts` + `google-fonts`
(typography), and `zod-types` + `zod` (typed props editable in Studio).

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
