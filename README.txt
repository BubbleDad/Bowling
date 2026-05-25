Meowmoon Bowling v0.8
Eighth playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. The intro title screen stays visible until the first non-cat tap.
4. Tap anywhere except the Meowmoon mascot to begin and roll the ball.
5. Long-press the Meowmoon mascot for about 3 seconds to pause.
6. Tap anywhere while paused to resume.

Changes from v0.7
- Added 6 new animal special pin animations with sounds:
  * Bunny
  * Frog
  * Fish
  * Bird
  * Penguin
  * Dog Zoomies
- Removed all special ball animations so the bowling ball remains visually simple.
- The focus remains on the pin animations.
- Preserved the end-of-level multi-special celebration clear.
- Preserved one special pin animation on every successful roll.
- Preserved the no-more-than-8-roll completion assist.
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
- No special ball effects are assigned in v0.8.
- Levels are designed to finish in no more than 8 rolls.
- Level ends with the MEOW reward and then loads the next level.

Known v0.8 limitations
- The special-animation art is still canvas-drawn rather than sprite-based.
- Animal and vehicle behaviors are visual reward events, not realistic physics.
- This package has had a JavaScript syntax check, but it has not yet been device-tested on iPad, Fire tablet, or Galaxy.
