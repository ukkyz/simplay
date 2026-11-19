# Verification

Use the committed npm lockfile (`npm ci`) on Node 22.x (at least 22.12). No provider credentials or database service are needed for the default checks.

| Command | What it verifies |
| --- | --- |
| `npm run db:setup` | Explicitly applies committed Drizzle migrations to the selected SQLite file or Turso database, then seeds the demo player idempotently. |
| `npm run typecheck` | TypeScript passes with the repo's strict settings. |
| `npm run test:db` | Tests database selection, credential redaction, fail-closed Turso errors, and temporary SQLite files for migration, auth, world persistence, and reset. |
| `npm run build` | Builds Next.js without a database connection or migration, even with `VERCEL=1` and no credentials. |
| `npm run check` | Runs typecheck, database tests, and the production build. |
| `npm run smoke` | Runs [`scripts/smoke.mjs`](../scripts/smoke.mjs) against the existing Next.js build and an isolated database. |

## Browser smoke

```sh
npm ci
npm run check
npx playwright install chromium
npm run smoke
```

The suite overrides Turso credentials and `VERCEL` in child processes, seeds a disposable SQLite file, provisions `alex` with a generated test password, runs a local production server, and tears it down. It checks guest denial for HTML, RSC, and the world API; signup, case-insensitive login, sign-out and revocation, and keyboard operation at a phone viewport; sign-in without JavaScript; and shared edits between accounts. It also covers route history and 404s, building creation with five starter rooms, a room edit with WebGL disabled and a failed save, session and edit persistence after a restart, bot config, invalid and cross-site writes, and Vercel runtime refusal to fall back to a file without credentials. It blocks external requests and checks for uncaught browser errors. It does not exercise real tiles, assistive technology, GPU performance, or model providers.

If the Playwright download is unavailable but a compatible Chromium executable and its OS libraries are installed, run `SMOKE_CHROMIUM_PATH=/path/to/chromium npm run smoke`.

## Manual checks by change

Use a disposable database to avoid editing the shared demo. For a local test, unset both Turso variables and make sure `VERCEL` is not `1`, then run `DATABASE_PATH=.data/manual.sqlite npm run db:setup` and `DATABASE_PATH=.data/manual.sqlite npm run dev`. A private window alone **does not** isolate writes on the same server. **Reset simulation** restores seed rows for everyone using that database.

| Change | Reproduce and check |
| --- | --- |
| Accounts | Open a world deep link in a fresh browser and confirm it redirects to sign-in. Register, sign out from the account panel, and revisit the link. Check a wrong password and a taken username with keyboard and a screen reader. Sign in to a second account and verify it sees the same saved changes. |
| World / OSM | On `/`, press `/` to focus search. Search a seeded city (e.g. Amsterdam), return to Rotterdam, pan/zoom, toggle layers, and enter Delfshaven Yard. For lookup changes, simulate a successful custom query and a failed Nominatim request; verify saved-city search and attribution. |
| Area / building | In Delfshaven Yard, add a named building, open it, and check for five starter rooms. In Foundry Hall, add a room using **Carve from** and verify both footprints. Compare SVG and WebGL selection when changing layouts. Check an invalid size and a failed save. |
| Routing / persistence | Open a nested URL directly and use Back/Forward across in-app navigation. Try a missing player/area/building and an unknown path. Check saved data in a new browser context, after a server restart, and after rerunning setup. |
| AI management | Configure Vertex, change provider and model, preview the mock, cancel a draft, and save a prompt edit. Check that the minor version increments once and survives reload; a settings-only change does not bump it. |
| Responsive / a11y | Use a desktop and a phone viewport (e.g. 1440×900 and 390×844). Check keyboard focus, labels, dialog dismissal, scrolling, and reduced motion. GPU changes also require the [rendering protocol](rendering-budget.md#profiling-protocol). |

## Preview and deployment

- `npm run dev` and `npm start` bind to `0.0.0.0`; set `SIMPLAYZ_DEV_HOST` to the exact forwarded hostname for Next.js development requests if needed. All browser requests use the app's origin, not sandbox `localhost`.
- For HTTPS hosting, configure your trusted proxy to preserve the public host and protocol (`X-Forwarded-Host`, `X-Forwarded-Proto`) for Server Actions and secure cookies. For an embedded HTTPS preview only, set `SIMPLAYZ_EMBEDDED_PREVIEW_HOST` to its exact hostname to allow a partitioned cookie inside a cross-site iframe. If the browser blocks partitioned cookies or the frame denies forms, open the preview as a top-level page. Leave the variable unset for normal `SameSite=Lax` cookies.
- See [Deploy Simplayz with Turso](deploy-vercel.md) for the Vercel configuration, SQLite backup, and hosted verification steps. Setup is an operator command, never a build hook. For self-hosted SQLite, use a persistent writable volume; never put the database or its journal under `public/` or commit it.
- Report routes, commands, device and observed results. Mark blocked or not-run checks explicitly. Note mocked requests and software WebGL when used.
