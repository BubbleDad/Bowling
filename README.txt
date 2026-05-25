Meowmoon Bowling v0.3
Third playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. Tap anywhere on the screen to roll the ball, including the lowest part of the screen.
4. Exception: tapping/pressing the Meowmoon cat does not roll a ball.
5. Long-press the Meowmoon cat for about 3 seconds to pause.
6. Tap anywhere while paused to resume.

Changes from v0.2
- Removed the low-screen dead zone. Taps in the lower UI area now roll a bowling ball.
- Preserved the mascot exception: touches on the Meowmoon cat do not roll, so the 3-second long-press pause gesture remains protected.
- Normal hit pins now keep the knockdown animation and then fade away after they fall.
- Added the first rare special pin animation: a hit pin can transform into a rocket, fly around the playing area, then leave for good.
- The rocket special is capped by level/game cooldown: after a rocket appears, at least 3 full later levels must pass before another rocket can appear, so it cannot happen more frequently than once every four games/levels.
- Added generated placeholder rocket audio: launch, flight whoosh, and piñata-style burst.
- Added a piñata-style burst of stars, confetti, treats, toys, and hearts when the rocket special completes.
- Updated title and service worker cache to v0.3.

Design still implemented
- Portrait-first tablet/iPad layout.
- Layout Option B: scattered obstacle-target pins, with singles, pairs, and small clusters.
- Pin Appearance Option 1: classic realistic white bowling pins with red stripes.
- Pins remain doubled in size from v0.1, as in v0.2.
- No score, no frames, no losing, no penalties, no account creation, no ads, no in-app purchases.
- Randomly generated levels with 16 to 24 visually distinct pins and varied spacing.
- Unlimited bowling balls.
- Tap-to-aim with quiet aim correction toward a nearby pin.
- Ball can use side-bounce paths.
- If a roll misses, the next roll is forced to be helpful.
- Pin falls may cause chain reactions; full-level chain clears remain capped so they are rare.
- Level ends when all pins are knocked down/removed by the normal or special animations.
- A MEOW! reward appears, then the next level loads automatically.
- Pause by 3-second mascot long-press.
- Automatic pause when browser/tab/app loses visibility or focus, with a 500 millisecond grace period.
- Pause stops movement and music, dims the screen, and shows the copied Bubble Shooter v0.9 pause graphic.
- Bubble Shooter v0.9 code-drawn Meowmoon cat, sky/background, text/status box, and pause graphic remain copied into Bowling.

Audio
- Music is the uploaded Bubble Shooter v0.9 Bach MP3: audio/jesu-joy-piano-loop.mp3.
- Bowling roll, pin-hit, pin-fall, rocket launch, rocket flight, and rocket burst sound effects are generated placeholders.
- For a later iteration, generated placeholders can be replaced with confirmed CC0/public-domain sound files.

Known v0.3 limitations
- The special rocket animation is intentionally coded as a rare event with a cooldown and random chance, so it may take multiple levels to see it naturally.
- The current pin and rocket art are still canvas-drawn. They can later be replaced with polished sprites while preserving the behavior.
- Physics are intentionally simplified and friendly rather than realistic simulation physics.
- This package has had code checks, but it has not yet been device-tested on iPad, Fire tablet, or Galaxy.
