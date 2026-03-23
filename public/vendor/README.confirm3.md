# confirm3 vendor runtime

These files are loaded by `/@confirm3.html` via relative `./vendor/*.js` URLs.

- `lucide.min.js`
- `signature_pad.umd.min.js`
- `html2canvas.min.js`
- `jspdf.umd.min.js`

They are still live runtime dependencies even though the current React app imports its own npm packages.
Do not rename or remove this folder unless `public/@confirm3.html` is retired or updated in the same change.

There is no `vendor@confirm3` public path in this repo.
