# Montage builder

Cuts a set of clips into a finished montage — slow push on each shot, crossfades,
animated lower-third captions, a title card and an end card — in the site's own
palette and type. Outputs 4K H.264 by default.

Pure ffmpeg, so it runs on any machine with ffmpeg 6+ and libx264. No Premiere,
no After Effects, no subscription.

## Use

    ./montage.sh clips.tsv output.mp4

`clips.tsv` is one clip per line, **tab**-separated:

    <file>	<in-point>	<duration>	<EYEBROW>	<title line 1>	<title line 2>

For example:

    shots/pour.mov	00:00:12.5	4.5	PRODUCT	Bottles, light,	and the slow pour
    shots/studio.mov	00:01:04.0	4.5	PORTRAIT	The frame	before the smile

The in-point is where in the source the clip starts; the duration is how long it
runs in the montage. Source clips can be any size or orientation — landscape,
portrait, mixed — they are scaled and centre-cropped to fill the frame.

## Options

Set as environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `W` / `H` | `3840` / `2160` | Output size. `1080` height for a quick preview. |
| `FPS` | `30` | Frame rate. |
| `CRF` | `18` | Quality; lower is better and bigger. 18 is visually lossless. |
| `XF` | `0.8` | Crossfade length in seconds. |
| `TITLE_D` / `END_D` | `4.0` / `3.5` | Card durations. |
| `MUSIC` | – | Audio bed; faded in and out automatically. |
| `NAME1` / `NAME2` | `Heba` / `Zituni` | Title card name, set in roman then italic. |
| `EYEBROW` | `CREATIVE DIRECTOR   PHOTOGRAPHER   MUSCAT` | Letter-spaced line above the name. |
| `ENDLINE` | `hebazituni.com` | End card line. |
| `SERIF`, `SERIF_I`, `SANS` | EB Garamond / Montserrat | Font files. |

So a fast check before committing to a full render:

    W=1280 H=720 CRF=23 ./montage.sh clips.tsv preview.mp4

## Fonts

The site is set in Cormorant Garamond and Jost. Those were not reachable from the
build environment, so the defaults are the closest things available as packages —
**EB Garamond** (same Garamond lineage as Cormorant) and **Montserrat**. To match
the site exactly, download the real families and point the font variables at them:

    SERIF=~/fonts/CormorantGaramond-Light.ttf \
    SERIF_I=~/fonts/CormorantGaramond-LightItalic.ttf \
    SANS=~/fonts/Jost-Light.ttf \
    ./montage.sh clips.tsv output.mp4

## build.sh

The same treatment rendered against generated stand-in footage, used to preview
the look without any source clips. `W=960 H=540 OUT=proof.mp4 ./build.sh` is quick;
the default 4K pass takes a few minutes.

## Notes for editing the filtergraphs

Two things bite when changing these:

- An expression containing a comma — anything with `min()` or `max()` — **must** be
  single-quoted. ffmpeg reads an unquoted comma as a filter separator.
- In `drawbox`, `w` and `h` mean the box's own size. The input frame is `iw` / `ih`.
