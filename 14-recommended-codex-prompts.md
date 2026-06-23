# Recommended Codex Prompts

## Set up baseline

```text
Review this repository as the Meowmoon Bowling v1.5.13 stable version. Do not change gameplay. Confirm index.html loads app-v1.5.13.js, confirm sw.js caches app-v1.5.13.js, run node --check on the app file, and summarize the file structure.
```

## Wording-only change

```text
Make a wording-only release. Replace the specified phrase everywhere user-facing, update the versioned app filename, update index.html, sw.js, VERSION.txt, and docs. Do not change gameplay, animation code, pin count, or startup overlay behavior. Run node --check and provide a diff summary.
```

## Create animation gallery

```text
Create a standalone offline animation gallery for the requested animation. Do not modify the playable game. Include only the new animation, a pause button, and a reset button. Keep it self-contained and cite no external assets.
```

## Integrate approved animation

```text
Integrate the approved gallery animation into the playable game as one new special pin animation. Add one registry entry, duration, update mode, and draw function. Do not change any other animations or gameplay rules. Run node --check and list exactly what changed.
```

## Cache/version bump

```text
Bump the game to the next version. Rename the app file, update index.html, update sw.js cache name and cached app filename, update VERSION.txt, and run node --check. Do not otherwise change gameplay or art.
```

## Regression test guide

```text
Review the code changes and produce a testing checklist specific to this release. Identify whether testing should focus on startup, ball loading, pin lifecycle, animation completion, cache behavior, or rendering order.
```

## Refactor without behavior change

```text
Refactor the named section for readability only. Preserve behavior. Do not change animation artwork, gameplay rules, pin count, phase transitions, or cache behavior except for version bump if requested. Run node --check and summarize risks.
```
