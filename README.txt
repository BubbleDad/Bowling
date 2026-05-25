Meowmoon Bowling v1.0.2
Maze-level hotfix iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. The intro title screen stays visible until the first non-cat tap.
4. Tap anywhere except the Meowmoon mascot to begin and roll the ball.
5. Long-press the Meowmoon mascot for about 3 seconds to pause.
6. Tap anywhere while paused to resume.

Changed from v1.0.1
- Reduced the size of the MAZE LEVEL! opening text so it fits better on screen.
- Reduced the size of the smaller tap anywhere to roll text under MAZE LEVEL!.
- Slowed maze ball travel to half of the regular ball speed.
- Reworked maze generation to use more of the playfield.
- Reworked the maze path to be more like a square labyrinth with more horizontal and vertical turns.
- Increased maze path pins from 5-8 to 10-14.
- Increased final maze clump pins from 5-8 to 6-9.
- Kept the guaranteed every-fourth-level maze cadence for review: levels 4, 8, 12, etc.
- Updated service worker cache to v1.0.2.

Maze behavior
- Maze levels are randomly generated each time they appear.
- A maze level begins with the large message "MAZE LEVEL!" and smaller text "tap anywhere to roll".
- One tap sends the ball through the full maze route automatically.
- Along the route, the ball knocks down pins and triggers the same special pin animations used in regular play.
- At the end of the maze, the ball hits a final clump of pins and triggers several more special animations.
- Maze reward text is shown on three lines: "MEOW!" / "MEOW!" / "MEOW!".
- Maze levels do not occur two times in a row.

Continuing design
- Same Meowmoon cat mascot placement, size, and long-press pause behavior copied from Bubble Shooter v0.9.
- Same sky background family, pause graphic, and text-box/status-box family copied from Bubble Shooter v0.9.
- No score, no frames, no losing, no timers, no penalties, no accounts, no ads, and no in-app purchases.
- Regular levels still use tap-to-aim with quiet assist and side-wall bounces.
- Regular levels are designed to finish in no more than 8 rolls.
- Special pin animations remain the passive reward core of the game.

Notes
- Maze visuals use a Neon Arcade Maze treatment inside the same overall Meowmoon playfield.
- This package has had a JavaScript syntax check, but it has not yet been device-tested on iPad, Fire tablet, or Galaxy.
