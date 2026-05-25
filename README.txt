Meowmoon Bowling v0.7
Seventh playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. The intro title screen now stays visible until the first non-cat tap, to make the starting prompt more reliable.
4. Tap anywhere except the Meowmoon mascot to begin and roll the ball.
5. Long-press the Meowmoon mascot for about 3 seconds to pause.
6. Tap anywhere while paused to resume.

Changes from v0.6
- Added 5 new vehicle-related special pin animations with sounds:
  * Race Car
  * Airplane
  * Helicopter
  * Bus
  * Bulldozer
- Increased the volume of generated sound effects relative to the Bach MP3.
- Lowered the Bach MP3 volume further so special effects are easier to hear.
- Changed special-pin frequency so every directly hit roll triggers one special pin animation.
- Kept 3 special balls per level.
- Kept the no-more-than-8-roll completion assist.
- Improved startup behavior so the intro splash with “Tap anywhere to roll” remains visible until the first roll.
- Updated service worker cache version.

Design still implemented
- Portrait-first tablet/iPad layout.
- Same Meowmoon cat mascot placement, size, and long-press pause behavior copied from Bubble Shooter v0.9.
- Same sky background family, pause graphic, and text-box/status-box family copied from Bubble Shooter v0.9.
- No score, no frames, no losing, no timers, no penalties, no accounts, no ads, and no in-app purchases.
- Randomly generated levels with 16 to 24 pins.
- Unlimited balls.
- Tap-to-aim with quiet assist.
- Side-wall bounces still supported.
- One special pin animation is intended to occur on every successful roll.
- 3 special balls are assigned per level.
- Levels are designed to finish in no more than 8 rolls.
- Level ends with the MEOW reward and then loads the next level.

Known v0.7 limitations
- The special-animation art is still canvas-drawn rather than sprite-based.
- Vehicle behaviors are visual reward events, not realistic vehicle physics.
- This package has had a JavaScript syntax check, but it has not yet been device-tested on iPad, Fire tablet, or Galaxy.
