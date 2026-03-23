# public runtime map

- Root `public/` contains the main Vite shell assets plus two compatibility runtimes: `home-v2/main-v2-app/` and `@confirm3.html`.
- `/home-v2/main-v2-app/index.html` is the only committed worker-home iframe entry used by `src/pages/HomePage.tsx`.
- `public/home-v2/` is a namespace folder, not a second runtime. Do not add sibling home apps unless `src/constants/publicRuntime.ts` and `vercel.json` are updated together.
- `public/@confirm3.html` is a standalone compatibility confirm page. The current in-app "cert" action is powered by the React `ConfirmSheetApp`, not by this file.
- `public/vendor/` is still live because `@confirm3.html` loads `./vendor/*.js` directly at runtime. Source-code grep alone is not enough to prove those vendor files are dead.
- There is no `public/vendor@confirm3/` runtime path in this repo.
- Do not delete files inside `public/home-v2/main-v2-app/` unless the iframe bundle is rebuilt and its relative asset graph is re-checked. The committed bundle still owns its local `assets/`, `icons/`, and support files.
