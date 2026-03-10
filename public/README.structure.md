# public structure note

- Root `public/` is for the main app shell, PWA assets, `@confirm3.html`, and shared static files.
- `public/home-v2/main-v2-app/` is a committed iframe home build output and should be treated as its own app.
- `src/pages/HomePage.tsx` only switches between partner home, the `home-v2` iframe app, and `src/pages/HomePage.legacy.tsx` as the final fallback.
- `public/vendor/` contains confirm-page vendor files so `@confirm3.html` does not depend on CDN by default.
- Duplicate-looking files under `home-v2/main-v2-app/` are deletion-hold items unless a runtime reference is proven dead.
