# Final Cleanup Testing Checklist

This checklist is for cleanup/refactor versions where behavior should remain unchanged.

## Smoke test

- Game loads.
- Title appears.
- First tap starts game.
- Ball appears and rolls.
- Pins appear fully onscreen.
- Text box appears.
- Music/audio behavior is acceptable.

## Basic gameplay test

Play at least 3 levels and confirm:

- a new ball appears after each roll;
- rolls do not freeze;
- special animations do not stop the game;
- final pin removal advances to the next level;
- reward overlay appears;
- next level starts.

## Longer stability test

Play 5 to 8 levels and watch for:

- no-ball state;
- blank text box;
- rolling without resolution;
- failure to advance after final pin;
- excessive old cached behavior;
- pause/resume problems.

## Pause/resume test

- start a level;
- switch tabs or background the browser;
- confirm pause overlay appears;
- tap to resume;
- confirm play continues.

## Cache test

Confirm the browser is running the expected version by checking the console marker:

`Meowmoon Bowling code loaded: v1.4.6 final-cleanup`
