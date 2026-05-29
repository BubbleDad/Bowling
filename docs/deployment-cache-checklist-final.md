# Deployment and Cache Checklist

Use this checklist every time you upload a new Meowmoon Bowling version.

## Files to upload together

Upload the whole folder contents together, including:

- `index.html`
- the current versioned app file, for example `app-v1.4.6.js`
- `sw.js`
- `manifest.webmanifest`
- any audio files
- any documentation files if you want them preserved on the host

## Version matching

Before uploading, confirm:

- `index.html` references the current app filename.
- `sw.js` caches the current app filename.
- `sw.js` has a new cache name.
- the browser console marker mentions the current version.

For v1.4.6:

- app file: `app-v1.4.6.js`
- cache name: `meowmoon-bowling-v1-4-6-final-cleanup-cache`

## If testing shows an old version

If the browser appears to run old code:

1. refresh the page;
2. close and reopen the tab/browser;
3. clear site data/cache for the host;
4. confirm the host actually contains the newest `index.html`;
5. confirm `index.html` points to the newest app filename;
6. confirm the old app filename is not still referenced anywhere;
7. test in a private/incognito window or a different browser.

## Strong recommendation

Keep versioned app filenames. Do not go back to a generic `app.js` during active development.
