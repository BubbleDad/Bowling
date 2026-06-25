# Special Animation Gallery v1.0

Adds offline review tooling for all current production special animations.
This is a gallery/tooling version, not a Meowmoon Bowling game version.
The playable game is currently `v1.5.16 jellybean-safe-area-fix`.

## Files added

- `game/special-animation-galleries.html`: gallery index.
- `game/special-animation-gallery-page.html`: reusable category gallery page.
- `game/special-animation-preview.html`: iframe preview shell.
- `game/special-animation-gallery-app-v1.0.js`: preview-only runtime based on the current production app.
- `game/special-animation-gallery-data.js`: production animation inventory mirrored from `SPECIAL_ANIMATION_REGISTRY`.
- `game/special-animation-gallery.js`: gallery rendering, filtering, controls, large preview, and registry-count checks.
- `game/special-animation-gallery.css`: touch-friendly review UI styling.

## Production inventory

- Production special animations found: 75.
- Gallery pages: 8 category pages rendered through `special-animation-gallery-page.html`.
- Categories:
  - Core / Classic: 9
  - Vehicles and Transit: 14
  - Animals and Characters: 12
  - Accessibility and Mobility: 6
  - Sports: 11
  - Nature and Outdoors: 11
  - Places, Machines, and Mechanical: 4
  - Food, Toys, and Objects: 8

## Implementation note

`special-animation-gallery-app-v1.0.js` is a preview-only runtime used by `special-animation-preview.html`.
Normal `index.html` gameplay loads the current production app file, so scoring, pin lifecycle, animation timing/artwork, startup overlay behavior, and level progression are not intentionally changed by the gallery.

`sw.js` adds the gallery files to the current cache list and includes a same-origin queryless cache fallback so category and preview URLs with query strings can resolve from cached base gallery files when offline.

## Gallery preview framing adjustment

The gallery preview runtime uses gallery-only anchor overrides for a few animations whose full extents need more review space than the default centered pin replacement position:

- `elephantwave`, `regularwheelchair`, and `firetruck` are placed higher to keep bottoms/wheels visible.
- `hanbokribbontwirl` is placed higher to keep the lower ribbon/petal finish visible.
- `cardinalflyoff` is placed lower to keep the upward flight path visible.
- `soccergoal` uses the game-style sky/playfield background in preview so the net reads closer to gameplay.

These changes are limited to `special-animation-gallery-app-v1.0.js`; the playable game uses its current production app file.
