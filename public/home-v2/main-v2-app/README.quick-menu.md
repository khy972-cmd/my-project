# home-v2 quick menu note

This directory is a committed build output for the iframe home.
`src/pages/HomePage.tsx` loads this app first for worker home and falls back to `src/pages/HomePage.legacy.tsx` only when the iframe app cannot render.
Quick-menu icon paths patched here can be overwritten by a future rebuild.
Keep quick-menu icons local and sync legacy fallback in `src/pages/HomePage.legacy.tsx`.
