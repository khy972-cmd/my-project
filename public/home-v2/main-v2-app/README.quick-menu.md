# home-v2 quick menu note

This directory is the committed build output for the live worker-home iframe runtime served from `/home-v2/main-v2-app/index.html`.
`src/pages/HomePage.tsx` loads this app first for worker home and falls back to `src/pages/HomePage.legacy.tsx` only when the iframe app cannot render.
Quick-menu icon paths patched here can be overwritten by a future rebuild.
Keep quick-menu icons local and sync legacy fallback in `src/pages/HomePage.legacy.tsx`.

The compiled bundle still contains a local `receiptFile` UI in its materials flow.
That is compatibility behavior inside the committed static bundle, not the canonical receipt model for worklogs.
The canonical receipt/worklog attachment path in the main app is `src/pages/WorklogPage.tsx`, where receipt files are photo attachments with `status = "receipt"`.
