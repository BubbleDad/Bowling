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

For v1.5.7:

- `index.html` should reference `app-v1.5.7.js`.
- `sw.js` should cache `./app-v1.5.7.js`.
- `sw.js` should use `meowmoon-bowling-v1-5-7-cardinal-hanbok-ferry-cache`.
- the console marker should say v1.5.7.

## If old behavior appears

1. Confirm the host has the new `index.html`.
2. Confirm `index.html` references the new app file.
3. Confirm `sw.js` has a new cache name.
4. Test private/incognito mode.
5. Clear site data for the host.
6. Confirm no old `app-v...js` file is still referenced.
