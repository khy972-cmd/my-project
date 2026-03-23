# home-v2 runtime contract

- Canonical worker-home public entry: `/home-v2/main-v2-app/index.html`
- `src/pages/HomePage.tsx` loads that iframe runtime first and falls back to `src/pages/HomePage.legacy.tsx` only when the iframe cannot render.
- Keep static assets relative to `main-v2-app/`. A future rebuild can overwrite files inside that folder.
- The committed iframe bundle still contains a local `receiptFile` UI in its compiled materials flow. The canonical worklog receipt model in the main React app remains the `photo.status = "receipt"` attachment flow used by `src/pages/WorklogPage.tsx`.
- Do not add a second `home-v2` app root without updating `src/constants/publicRuntime.ts`, `vercel.json`, and this note together.
