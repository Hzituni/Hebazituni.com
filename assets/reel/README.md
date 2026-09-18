# Showreel clips

The "Motion & montage" section on the homepage reads its clips from this folder.
Drop the files in with these exact names and nothing else needs to change —
no HTML edits, no code changes.

| File            | Used for                  | Shape           |
|-----------------|---------------------------|-----------------|
| `showreel.mp4`  | Large feature tile        | 16:9 landscape  |
| `product.mp4`   | Grid tile 1 — Product     | 4:5 portrait    |
| `portrait.mp4`  | Grid tile 2 — Portrait    | 4:5 portrait    |
| `process.mp4`   | Grid tile 3 — Behind the lens | 4:5 portrait |

Each clip should also have a matching poster image with the same name —
`showreel.jpg`, `product.jpg`, and so on. The poster is the still frame shown
before the video loads, and it's what visitors with reduced-motion enabled see
instead of a moving tile.

## Until the files are here

Any tile whose file is missing quietly falls back to the bone-and-olive gradient
with a small "Clip coming soon" label, and its play button is hidden so it can't
be clicked. The page never shows a broken video icon, so it is safe to ship the
section before the footage is ready — and safe to add the clips one at a time.

## Encoding

- **H.264 MP4** — the widest browser support by a distance.
- Keep the looping tiles **short (8–15s) and silent**; they autoplay muted, and
  browsers block autoplay on anything with an audio track that isn't muted.
- Aim for **under ~3 MB per tile**. These load on the homepage, and this is a
  GitHub Pages site with no CDN in front of it.
- The full-length version with sound is what opens in the lightbox, so it can be
  larger — it only loads once someone clicks.

## Changing the copy

The category and title on each tile live in `index.html` in the
`<!-- ── SHOWREEL ── -->` block, as `.reel-cat` and `.reel-title`.
