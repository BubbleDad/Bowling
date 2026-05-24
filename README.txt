Meowmoon Bowling v0.1
First playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. Tap in the sky area to roll the ball.
4. Long-press the Meowmoon cat for about 3 seconds to pause.
5. Tap anywhere while paused to resume.

Design implemented in v0.1
- Portrait-first tablet/iPad layout.
- Layout Option B: scattered obstacle-target pins, with singles, pairs, and small clusters.
- Pin Appearance Option 1: classic realistic white bowling pins with red stripes.
- No score, no frames, no losing, no penalties, no account creation, no ads, no in-app purchases.
- Randomly generated levels with 16 to 24 visually distinct pins and varied spacing.
- Unlimited bowling balls.
- Tap-to-aim with quiet aim correction toward a nearby pin.
- Ball can use side-bounce paths.
- If a roll misses, the next roll is forced to be helpful.
- Pin falls may cause chain reactions; full-level chain clears are deliberately capped so they are rare.
- Level ends when all pins fall.
- A MEOW! reward appears, then the next level loads automatically.
- Same general Meowmoon Bubble Shooter-style sky canvas, title/reward treatment, launcher/mascot placement, and text-box concept.
- Pause by 3-second mascot long-press.
- Automatic pause when browser/tab/app loses visibility or focus, with a 500 millisecond grace period.
- Pause stops movement and music, dims the screen, and shows a smiling cat pause graphic.

Audio
- To use the Bach MP3 now, place it here:
  assets/audio/bach-placeholder.mp3
- v0.1 has a built-in fallback music loop if that MP3 is absent.
- v0.1 sound effects are generated placeholders, not third-party recordings.
- See assets/audio/README_AUDIO.txt for sound-source candidates reviewed for later replacement.

Known v0.1 limitations
- The exact Meowmoon mascot image file from Bubble Shooter v0.9 was not bundled separately; v0.1 redraws the mascot in canvas using the same placement and approximate scale from the available v0.9 snippets.
- The exact Bach MP3 was not found in the File Library search, so the package expects you to add it at the path above.
- Physics are intentionally simplified and friendly rather than realistic simulation physics.
- The current pin art is canvas-drawn programmer art; it can later be replaced with a polished PNG/SVG sprite.

Suggested next iteration
- Replace generated sound effects with confirmed CC0/public-domain bowling roll and pin-hit/fall files.
- Replace programmer-art pins with final art based on Pin Appearance Option 1.
- Drop in the exact v0.9 mascot art if available as a standalone image.
- Test on iPad, Fire tablet, and Galaxy A16 in both browser and PWA install modes.
