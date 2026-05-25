Meowmoon Bowling v0.2
Second playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. Tap in the sky area to roll the ball.
4. Long-press the Meowmoon cat for about 3 seconds to pause.
5. Tap anywhere while paused to resume.

Changes from v0.1
- Doubled the bowling pin size. The v0.1 pin height range was 44-70 CSS pixels; v0.2 uses 88-140 CSS pixels.
- Used the uploaded Bubble Shooter v0.9 package as the source for copied Meowmoon elements.
- Copied the Bubble Shooter v0.9 canvas-drawn Meowmoon cat source code into Bowling.
- Copied the Bubble Shooter v0.9 text/status box drawing code into Bowling.
- Copied the Bubble Shooter v0.9 pause cat and pause overlay drawing code into Bowling, with the same pause message.
- Copied the Bubble Shooter v0.9 sky/background drawing code into Bowling.
- Included the Bubble Shooter v0.9 Bach MP3 file at audio/jesu-joy-piano-loop.mp3 and wired Bowling to use it.

Design still implemented
- Portrait-first tablet/iPad layout.
- Layout Option B: scattered obstacle-target pins, with singles, pairs, and small clusters.
- Pin Appearance Option 1: classic realistic white bowling pins with red stripes.
- No score, no frames, no losing, no penalties, no account creation, no ads, no in-app purchases.
- Randomly generated levels with 16 to 24 visually distinct pins and varied spacing.
- Unlimited bowling balls.
- Tap-to-aim with quiet aim correction toward a nearby pin.
- Ball can use side-bounce paths.
- If a roll misses, the next roll is forced to be helpful.
- Pin falls may cause chain reactions; full-level chain clears remain capped so they are rare.
- Level ends when all pins fall.
- A MEOW! reward appears, then the next level loads automatically.
- Pause by 3-second mascot long-press.
- Automatic pause when browser/tab/app loses visibility or focus, with a 500 millisecond grace period.
- Pause stops movement and music, dims the screen, and shows the copied Bubble Shooter v0.9 pause graphic.

Audio
- Music is the uploaded Bubble Shooter v0.9 Bach MP3: audio/jesu-joy-piano-loop.mp3.
- Bowling roll, pin-hit, and pin-fall sound effects are still generated placeholders.
- For a later iteration, replace the generated sound effects with confirmed CC0/public-domain bowling roll and pin-hit/fall files.

Known v0.2 limitations
- The Bubble Shooter v0.9 package contained no separate Meowmoon PNG/SVG art files. The cat, status box, sky, and pause graphic are code-drawn canvas assets inside Bubble Shooter's index.html, so v0.2 copies those source functions directly.
- The text/status box is now copied from Bubble Shooter v0.9 and rotates Bubble Shooter-style status messages. We can later revise the text content while keeping the copied visual treatment.
- Physics are intentionally simplified and friendly rather than realistic simulation physics.
- The current pin art is still canvas-drawn; it can later be replaced with a polished sprite while preserving the larger v0.2 sizing.
