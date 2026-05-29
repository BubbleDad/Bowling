# Cleanup Series Change Log

## v1.4.2 cleanup-registry

- Added `SPECIAL_ANIMATION_REGISTRY`.
- Made animation duration, drawing, overlay behavior, and sun exclusivity registry-based.
- Added registry validation.

## v1.4.3 lifecycle-safety

- Added defensive pin lifecycle helpers.
- Added safeguards for stuck falling/fading/animating pins.
- Added ball roll and resolving timeouts.
- Added safe cleanup for special animation update errors.

## v1.4.4 phase-state

- Centralized phase transitions.
- Added `enterPlayingPhase()`, `enterRollingPhase()`, `enterResolvingPhase()`, `enterRewardPhase()`, and pause/resume helpers.
- Added `validatePhaseState()`.

## v1.4.5 rendering-sections

- Refactored rendering into named layers.
- Added code section headers.
- Added rendering function index.

## v1.4.6 final-cleanup

- Added final documentation and audit files.
- Added deployment/cache checklist.
- Added final testing checklist.
- Added final animation registry reference.
- Added dead-code audit.
- No gameplay changes intended.
