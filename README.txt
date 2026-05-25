Meowmoon Bowling v0.4
Fourth playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. Tap anywhere on the screen to roll the ball, including the lowest part of the screen.
4. Exception: tapping or pressing the Meowmoon cat does not roll a ball.
5. Long-press the Meowmoon cat for about 3 seconds to pause.
6. Tap anywhere while paused to resume.

Changes from v0.3
- Kept the full-screen tap rolling change and cat-touch exception.
- Normal hit pins still fall first and then fade away.
- Added five more rare special pin animations in addition to the existing rocket animation:
  * Piñata Pin
  * Balloon Pin
  * Firework Pin
  * Jelly Pin
  * Cat Paw Pin
- All six special animations now vary each time they appear.
- Each special animation type has the same cooldown rule: once that specific type appears, it cannot appear again for at least four full later levels.
- Removed the generated synth background fallback so only the Bach MP3 is used for background music.
- Removed quotation marks from the rotating text box music line.
- Added generated placeholder audio cues for the new special animations.
- Updated title and service worker cache to v0.4.

Design still implemented
- Portrait-first tablet/iPad layout.
- Layout Option B: scattered obstacle-target pins, with singles, pairs, and small clusters.
- Pin Appearance Option 1: classic realistic white bowling pins with red stripes.
- Pins remain doubled in size from v0.1, as in v0.2 and v0.3.
- No score, no frames, no losing, no penalties, no account creation, no ads, no in-app purchases.
- Randomly generated levels with 16 to 24 visually distinct pins and varied spacing.
- Unlimited bowling balls.
- Tap-to-aim with quiet aim correction toward a nearby pin.
- Ball can use side-bounce paths.
- If a roll misses, the next roll is forced to be helpful.
- Pin falls may cause chain reactions; full-level chain clears remain capped so they are rare.
- Level ends when all pins are knocked down or removed by the normal or special animations.
- A MEOW! reward appears, then the next level loads automatically.
- Pause by 3-second mascot long-press.
- Automatic pause when browser, tab, or app loses visibility or focus, with a 500 millisecond grace period.
- Pause stops movement and music, dims the screen, and shows the copied Bubble Shooter v0.9 pause graphic.
- Bubble Shooter v0.9 code-drawn Meowmoon cat, sky/background, text/status box, and pause graphic remain copied into Bowling.

Audio
- Music is the uploaded Bubble Shooter v0.9 Bach MP3: audio/jesu-joy-piano-loop.mp3.
- Bowling roll, pin-hit, pin-fall, and all special-animation sound effects are generated placeholders.
- The earlier generated synth background fallback has been disabled and removed from use.

Known v0.4 limitations
- Special animation frequency is still governed by randomness plus per-animation cooldowns, so the exact mix seen in a short session will vary.
- The current special pin art is still canvas-drawn. It can later be replaced with polished sprites while preserving the behavior.
- Physics are intentionally simplified and friendly rather than realistic simulation physics.
- This package has had code checks, but it has not yet been device-tested on iPad, Fire tablet, or Galaxy.
