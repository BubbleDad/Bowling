# Annotated Code Map

The playable game remains a single-file JavaScript application for deployment simplicity.

## Main files

- `index.html`: page shell, canvas, transparent start overlay, audio element, app script, service-worker registration.
- `app-v1.5.5.js`: main game code.
- `sw.js`: service worker and cache list.
- `manifest.webmanifest`: progressive web app manifest.
- `VERSION.txt`: current version summary.
- `docs/`: release notes and maintenance material.

## JavaScript sections

Inside `app-v1.5.5.js`, the intended navigation order is:

1. **Canvas, constants, and game state**
   - Canvas setup.
   - Layout constants.
   - State object.
   - Safety constants.

2. **Special animation registry**
   - `SPECIAL_ANIMATION_REGISTRY`
   - `PIN_SPECIAL_TYPES`
   - registry helper functions.

3. **Audio**
   - music start/resume/pause.
   - rolling and special sound effects.

4. **Layout, level setup, and pin generation**
   - `resize()`
   - `computeLayout()`
   - `startLevel()`
   - `generatePins()`
   - `createPin()`

5. **Input, pause/resume, and phase-state helpers**
   - pointer handlers.
   - transparent start overlay handling.
   - pause/resume.
   - phase helpers such as `enterPlayingPhase()` and `enterRollingPhase()`.

6. **Ball movement and pin lifecycle**
   - `fireBall()`
   - `updateBall()`
   - `resolveBallHit()`
   - pin knockdown and lifecycle safety helpers.

7. **Particles and celebration effects**
   - reward confetti.
   - burst particles.
   - helper drawing effects.

8. **Rendering pipeline and drawing functions**
   - `render()`
   - rendering layer functions.
   - pin drawing.
   - special animation drawing functions.

9. **Main loop and startup**
   - startup validation.
   - requestAnimationFrame loop.
