# Maintenance Guide

## Safest development workflow

1. Make one kind of change at a time.
2. Use a new versioned app filename.
3. Use a new service-worker cache name.
4. Test the new version before making another change.
5. Keep animation experiments in a gallery or workshop file before integrating into the game.

## Adding a special animation later

1. Build and approve it in a standalone gallery.
2. Add an entry in `SPECIAL_ANIMATION_REGISTRY`.
3. Add or reuse a draw function.
4. Choose the right `updateMode`.
5. Set `overlay: true` only if it must draw above pins.
6. Set `exclusiveGroup` only if it must be mutually exclusive with related animations.
7. Test at least 5 levels.

## Revising an existing animation later

1. Change only that animation's draw function.
2. Avoid changing update logic unless necessary.
3. Test that the animation ends.
4. Confirm a new ball appears after the roll.
5. Confirm the next level advances.

## Changing gameplay later

Treat gameplay changes as higher risk. Test more heavily if changing:

- pin count;
- ball speed;
- roll limit;
- phase transitions;
- pin removal;
- special animation frequency;
- level completion logic.

## Cache/version rule

Every released version should use:

- a new folder name;
- a new app filename;
- a new cache name;
- a console marker with the version.
