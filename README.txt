Meowmoon Bowling v0.6
Sixth playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. Tap anywhere on the screen to roll the ball, except the Meowmoon mascot.
4. Long-press the Meowmoon mascot for about 3 seconds to pause.
5. Tap anywhere while paused to resume.

Changes from v0.5.1
- Added distinct generated placeholder sounds for the newer special pin animations:
  * Treasure Chest: chest-open and sparkle/reward sounds.
  * Toy Train: chug and whistle-like toy-train sounds.
  * Popcorn: pop-pop-pop cluster sounds.
  * Kite: wind/flutter whoosh sounds.
  * Magic Paint: brush-swish and paint-splash sounds.
  * Flower Bloom: bloom/chime sounds.
- Raised generated sound-effect gain significantly so special pin animations are easier to hear over the Bach MP3.
- Lowered Bach MP3 background volume slightly to leave more room for effects.
- Changed frequency to 4 special pins per level.
- Changed frequency to 3 special balls per level.
- Tightened level completion assist so each level finishes in no more than 8 rolls.

Design still implemented
- Portrait-first tablet/iPad layout.
- Same Meowmoon cat mascot placement, size, and long-press pause behavior copied from Bubble Shooter v0.9.
- Same sky background family, pause graphic, and text-box/status-box family copied from Bubble Shooter v0.9.
- No score, no frames, no losing, no timers, no penalties, no accounts, no ads, and no in-app purchases.
- Randomly generated levels with 16 to 24 pins.
- Unlimited balls.
- Tap-to-aim with quiet assist.
- Side-wall bounces still supported.
- If a roll misses, the next roll helps.
- By design, all pins are cleared in no more than 8 rolls.
- Level ends with the MEOW reward and then loads the next level.

Current special pin animations
Rocket, Piñata, Balloon, Firework, Jelly, Cat Paw, Treasure Chest, Toy Train, Popcorn, Kite, Magic Paint, and Flower Bloom.

Current special ball animations
Comet, Rainbow Trail, Yarn Unspooling, Super Bounce, Meteor, and Giant Bounce.

Known v0.6 limitations
- Special-animation art is still canvas-drawn rather than sprite-based.
- Special ball and pin behaviors are primarily visual reward events rather than full physics power-up systems.
- This package has had a JavaScript syntax check and a lightweight contact-path smoke check, but it has not yet been device-tested on iPad, Fire tablet, or Galaxy.
