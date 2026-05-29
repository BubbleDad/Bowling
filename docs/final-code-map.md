# Final Code Map

The current game remains a single-file JavaScript application for deployment simplicity.

## Main files

- `index.html`: loads the canvas, audio, service worker, and versioned app script.
- `app-v1.4.6.js`: main game source.
- `sw.js`: service worker cache.
- `manifest.webmanifest`: web app manifest.
- audio file(s): background music and/or sound assets.

## JavaScript sections

Inside `app-v1.4.6.js`, the intended navigation order is:

1. Canvas, constants, and game state
2. Special animation registry
3. Audio
4. Layout, level setup, and pin generation
5. Input, pause/resume, and phase-state helpers
6. Ball movement and pin lifecycle
7. Particles and celebration effects
8. Rendering pipeline and drawing functions
9. Main loop and startup

## Most important systems

### `SPECIAL_ANIMATION_REGISTRY`

Central list of special pin animations and their metadata.

### Phase helpers

- `enterPlayingPhase()`
- `enterRollingPhase()`
- `enterResolvingPhase()`
- `enterRewardPhase()`
- `enterPausedPhase()`
- `validatePhaseState()`

### Lifecycle helpers

- `markPinRemoved()`
- `repairPinLifecycle()`
- `clearLingeringResolvedPins()`

### Rendering layers

- `drawPlayfieldLayer()`
- `drawPinAndParticleLayer()`
- `drawPlayerAndBallLayer()`
- `drawInterfaceLayer()`
- `drawOverlayLayer()`
