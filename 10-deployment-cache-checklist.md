# Deployment and Cache Checklist

## Upload these together

- `index.html`
- current app file, e.g. `app-v1.5.0.js`
- `sw.js`
- `manifest.webmanifest`
- audio folder/files
- any required assets
- docs if you want them hosted

## Version check

For v1.5.15 plus Special Animation Gallery v1.0:

- `index.html` should reference `app-v1.5.16.js`.
- `sw.js` should cache `./app-v1.5.16.js`.
- `sw.js` should cache the gallery files:
  - `./special-animation-galleries.html`
  - `./special-animation-gallery-page.html`
  - `./special-animation-preview.html`
  - `./special-animation-gallery.css`
  - `./special-animation-gallery-data.js`
  - `./special-animation-gallery.js`
  - `./special-animation-gallery-app-v1.0.js`
- `sw.js` should use `meowmoon-bowling-v1-5-16-jellybean-safe-area-fix-cache`.
- the playable game console marker should say v1.5.15.
- the gallery preview runtime console marker should say Gallery v1.0.

## If old behavior appears

1. Confirm the host has the new `index.html`.
2. Confirm `index.html` references the new app file.
3. Confirm `sw.js` has a new cache name.
4. Test private/incognito mode.
5. Clear site data for the host.
6. Confirm no old `app-v...js` file is still referenced.
