# Verification

## Baseline commands

Use the committed npm lockfile (`npm ci`) on Node 22.12+. No backend or provider credentials are needed.

| Command | What it proves |
| --- | --- |
| `npm run typecheck` | TypeScript passes with the repo's strict settings. Vite alone does not type-check. |
| `npm run build` | The production bundle is emitted. JS/CSS are inlined into `dist/index.html`; `dist/images/map-texture.jpg` stays separate. |
| `npm run check` | Runs both of the above. Run after source changes. |
| `npm run smoke` | Runs [`scripts/smoke.mjs`](../scripts/smoke.mjs) against the existing build. Run after rebuilding. |

### Browser smoke

```sh
npm ci
npm run check
npx playwright install chromium
npm run smoke
```

The suite starts and stops an ephemeral local Vite preview; you don't need to run a dev server. It uses fresh browser contexts, blocks external requests, and disables WebGL to check that the 2D workflow survives. It covers World → Area navigation, browser history and the 404 view, a direct Building load and room edit surviving reload, and a mocked bot prompt preview plus saved version/text surviving reload. It also checks for uncaught page errors.

If the Playwright download is unavailable but a compatible Chromium executable and its OS libraries are already installed, run `SMOKE_CHROMIUM_PATH=/path/to/chromium npm run smoke`. Report a blocked browser check if neither option is available. This suite does not test real tiles, geolocation permissions, mobile layout, GPU performance, or model behavior.

## Manual checks by change

Start with a fresh browser profile or private window. On a disposable save, the profile menu's **Reset simulation** restores seed data; do not use it on a world you want to keep. The [route table](architecture.md#routes-and-likely-edit-points) gives reproducible routes.

| Change | Reproduce and check |
| --- | --- |
| World / OSM | On `/`, press `/` to focus search. Search a seeded city (e.g. Amsterdam), return to Rotterdam, pan/zoom, toggle map layers, and enter Delfshaven Yard. For lookup changes, simulate both a successful custom query and a failed Nominatim request; saved-city search should still work. Check attribution and permission denial if touched. |
| Area / building | In Delfshaven Yard, add a test building and confirm it is listed with five starter rooms; open it and reload. In Foundry Hall, add a named room using **Carve from**, verify the source and new room in the floor plan, and reload. When editing geometry, verify matching selection and dimensions in 2D and WebGL. |
| Routing / storage | Open a nested URL directly, then go back/forward after in-app navigation. Try a missing area/building and an unknown path. For state work, check reload, an existing `simplayz.world.v1` save, and synchronization between two tabs on the same origin. |
| AI management | Configure Vertex at `/user/alex/ai/management`. Check model list when the provider changes, preview the mock, cancel a draft, and save a prompt edit; the minor version should increment once and survive reload. Changes to routing options alone should not bump it. Do not count this as testing a provider. |
| Responsive / a11y | Check a desktop viewport and a phone viewport (e.g. 1440×900 and 390×844). Use Tab, Enter/Space, and Escape where applicable; check labels, visible focus, dialogs, scrolling, and reduced-motion behavior. For GPU changes, run the [rendering protocol](rendering-budget.md#profiling-protocol). |

## Preview and deployment

- Run `npm run dev -- --host 0.0.0.0` for a workspace preview. If the proxy host is rejected, add only its exact hostname via Vite's `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`, not a blanket allowlist. Browser code should not use `localhost` to reach sandbox services.
- To inspect the build run `npm run preview -- --host 0.0.0.0` after building. Static hosting should serve files normally and rewrite app-route requests to `/index.html`, so bookmarked area/building/AI URLs still open. Don't use `file://` for verification.
- Record the commands, route, viewport/device, and observed result. Say **not run** or **blocked** if a check wasn't possible; note mocked network and software WebGL explicitly.
