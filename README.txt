Meowmoon Bowling v0.5
Fifth playable iteration

How to run locally
1. Unzip the folder.
2. Open index.html in a modern browser, or serve the folder with a simple local web server.
3. Tap anywhere on the screen to roll the ball, except the Meowmoon mascot.
4. Long-press the Meowmoon mascot for about 3 seconds to pause.
5. Tap anywhere while paused to resume.

Changes from v0.4
- Added six more special pin animations: Treasure Chest, Toy Train, Popcorn, Kite, Magic Paint, and Flower Bloom.
- Changed pin-special frequency so each level now has 3 special pins.
- Added 6 special ball-roll animations: Comet Ball, Rainbow Trail, Yarn Unspooling, Super Bounce, Meteor, and Giant Bounce.
- Changed ball-special frequency so each level now has 2 special balls.
- Slowed down the Cat Paw pin animation so it is easier to notice.
- Increased chain-help behavior and targeting bias toward clustered pins.
- Added a stronger accessibility cap so levels finish in no more than 10 rolls.

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
- By design, all pins are cleared in no more than 10 rolls.
- Level ends with the MEOW reward and then loads the next level.

Audio
- Background music remains the Bach MP3.
- Rolling, impact, and special-animation sounds remain generated placeholders.
- The prior background synth fallback remains removed.

Known v0.5 limitations
- The special-animation art is still canvas-drawn rather than sprite-based.
- Special ball and pin behaviors are primarily visual reward events rather than full physics power-up systems.
- This package has had a JavaScript syntax check, but it has not yet been device-tested on iPad, Fire tablet, or Galaxy.
