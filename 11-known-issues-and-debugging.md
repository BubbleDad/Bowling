# Known Issues and Debugging Guide

## First-frame status text error

Fixed in v1.5.9. The first `requestAnimationFrame` timestamp could be slightly earlier than `game.titleStartedAt`, producing a negative rotating-message index and an `undefined.split` error. Rotating-status elapsed time is now clamped to zero and has a first-message fallback.

## Startup screen does not appear

The current transparent HTML overlay is intended to protect against this. Check:

- `#startOverlay` exists in `index.html`;
- `app-v1.5.0.js` reads `startOverlay`;
- `startRollFromPointerEvent()` is present;
- the overlay is transparent but not removed.

## Old behavior appears

Likely causes:

- old `index.html`;
- old `sw.js`;
- wrong cache name;
- browser site data.

## No ball appears

Check:

- phase is `playing`;
- `game.ball` is null before firing;
- `fireBall()` reaches `enterRollingPhase()`;
- target path is valid.

## Game freezes after an animation

Check:

- registry duration;
- `updateMode`;
- animation finish/removal logic;
- console errors from update/draw functions.

## Level does not advance

Check:

- `remainingUprightCount()`;
- pin `removed` status;
- stuck `pin.rocket`;
- stuck `fading` or `falling` state.
