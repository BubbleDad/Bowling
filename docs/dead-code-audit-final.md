# Dead-Code Audit

This audit was generated during v1.4.6 final cleanup.

No functions were deleted in this pass. The purpose of this report is to identify candidates for later manual review.

## Summary

- Function declarations found: 213
- Special animation registry entries found: 47
- Functions with only their own declaration found: 18

## Likely unused candidates

- `activePinCount()`
- `animationTypesByExclusiveGroup()`
- `drawBottomClouds()`
- `drawCatScratchPin()`
- `drawCountTenPin()`
- `drawFishPin()`
- `drawFootballThrower()`
- `drawGymnasticsFlipPin()`
- `drawJogStrollerSoloPin()`
- `drawPenguinPin()`
- `drawSkiJumpPin()`
- `drawTreasurePin()`
- `drawWheelchairSprintPin()`
- `makeFishBurst()`
- `makePenguinBurst()`
- `marbleRunPosition()`
- `restorePin()`
- `wrapCenteredText()`

## Drawing functions with only one apparent reference outside declaration

These may be legitimate because some drawing functions are referenced through the animation registry, passed as callbacks, or used indirectly.

- `drawAccessibleVan()`
- `drawAirplanePin()`
- `drawBackground()`
- `drawBall()`
- `drawBallTrail()`
- `drawBalloonPin()`
- `drawBaseballCatchPin()`
- `drawBasketballDribblePin()`
- `drawBasketballHoopPin()`
- `drawBatBaseballPin()`
- `drawBirdPin()`
- `drawBowlingStrikePin()`
- `drawBulldozerPin()`
- `drawBunnyPin()`
- `drawBusPin()`
- `drawCatPawPin()`
- `drawCurlingPin()`
- `drawDandelionLifePin()`
- `drawDandelionSeedHeadPin()`
- `drawDandelionStemPin()`
- `drawDogPin()`
- `drawElephantWalker()`
- `drawElephantWavePin()`
- `drawFireTruckBody()`
- `drawFireTruckPin()`
- `drawFireworkPin()`
- `drawFlowerPin()`
- `drawFootballThrowPin()`
- `drawFrogPin()`
- `drawGamePlanet()`
- `drawGiraffeWalkPin()`
- `drawGiraffeWalker()`
- `drawGolfDrivePin()`
- `drawHeart()`
- `drawHeartDrawPin()`
- `drawHeartOutlinePin()`
- `drawHelicopterPin()`
- `drawHockeyPuckPin()`
- `drawHoldProgress()`
- `drawInterfaceLayer()`
- `drawJellyPin()`
- `drawJogStrollerParentPin()`
- `drawJoggingParent()`
- `drawKitePin()`
- `drawMagicPaintPin()`
- `drawMarbleRunPin()`
- `drawMoon()`
- `drawOverlayLayer()`
- `drawParticles()`
- `drawPathPreview()`
- `drawPauseCat()`
- `drawPauseOverlay()`
- `drawPinAndParticleLayer()`
- `drawPinataPin()`
- `drawPinataStarPin()`
- `drawPlayerAndBallLayer()`
- `drawPlayfieldLayer()`
- `drawPopcornPin()`
- `drawRaceCarPin()`
- `drawRegularWheelchairBody()`
- `drawRegularWheelchairPin()`
- `drawReward()`
- `drawRotatingStatusText()`
- `drawScratchPostPin()`
- `drawSoccerBallShape()`
- `drawSoccerGoalPin()`
- `drawStarTreePin()`
- `drawSunPlanetsPin()`
- `drawSunTravelPin()`
- `drawTennisServePin()`
- `drawThreeStarTreesPin()`
- `drawTinyWheelchairForVan()`
- `drawTitleBar()`
- `drawTitleOverlay()`
- `drawToyTrainPin()`
- `drawVanLiftPin()`
- `drawWheelchairHumanAGallery()`
- `drawWheelchairHumanBGallery()`
- `drawWheelchairRacerBase()`
- `drawWheelchairRacerGallery()`

## Recommendation

Do not delete these automatically. For each candidate, search the code, confirm it is not referenced from the registry or a helper, then remove one function at a time and test.
