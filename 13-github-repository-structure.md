# Suggested GitHub Repository Structure

Recommended repository layout:

```text
meowmoon-bowling/
  game/
    index.html
    app-v1.5.12.js
    sw.js
    manifest.webmanifest
    VERSION.txt
    audio/
  workshop/
    galleries/
    templates/
  docs/
    handoff/
    testing/
    deployment/
  releases/
    v1.5.0/
  README.md
```

## First commit checklist

1. Create repo.
2. Copy current `game/`.
3. Copy docs.
4. Confirm `index.html` loads `app-v1.5.12.js`.
5. Confirm `sw.js` caches `app-v1.5.12.js`.
6. Run JavaScript syntax check:
   ```bash
   node --check game/app-v1.5.12.js
   ```
7. Commit as:
   ```text
   Maintain Meowmoon Bowling v1.5.12
   ```

## Branching suggestion

- `main`: tested stable playable game.
- `workshop`: animation experiments.
- `feature/v1.5.1-opening-polish`: one future change.
