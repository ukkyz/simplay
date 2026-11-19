# Architecture and source map

## Runtime boundary

Next.js App Router serves the React 19 and TypeScript app. The root layout is independent of the database. [`(world)/layout.tsx`](../src/app/%28world%29/layout.tsx) checks the session before reading a SQLite snapshot for `SimplayzProvider` and `AppShell`. Public sign-in and registration never load that snapshot. Next routes and metadata handle deep links and titles. Interactive screens live under `src/screens/`; `@/` points to `src/`. Tailwind 4 supplies styles, and Three.js is loaded on demand for area and building previews.

There is one editable world (`alex`). A route player ID identifies that world, not the signed-in account. Any registered account may edit it. The reserved `alex` account is linked to the existing player only when [provisioned locally](../README.md#accounts-and-the-shared-world); that link does not grant exclusive editing permissions. Other map presences are fixtures, not connected sessions. There is no live multiplayer or LLM integration. Labels like *online*, *deployed*, and *verified* can still describe demo behavior.

## Routes and likely edit points

| Route pattern | Repro path | Start here |
| --- | --- | --- |
| `/login`, `/register` | `/login` | [`AuthScreen.tsx`](../src/components/AuthScreen.tsx), [`AuthForm.tsx`](../src/components/AuthForm.tsx), and the server-side [`actions.ts`](../src/auth/actions.ts). |
| `/` | `/` | [`WorldPage.tsx`](../src/screens/WorldPage.tsx): city search, geolocation, layers, and markers. [`OsmMap.tsx`](../src/components/OsmMap.tsx): tiles, pan/zoom, and attribution. |
| `/user/:userId/area/:areaId` | `/user/alex/area/delfshaven-yard` | [`AreaPage.tsx`](../src/screens/AreaPage.tsx): area selection and the Add building flow. |
| `/user/:userId/area/:areaId/building/:buildingId` | `/user/alex/area/delfshaven-yard/building/foundry-hall` | [`BuildingPage.tsx`](../src/screens/BuildingPage.tsx): room selection, staffing, and subdividing a room. |
| `/user/:userId/ai/management` | `/user/alex/ai/management` | [`AiManagementPage.tsx`](../src/screens/AiManagementPage.tsx): bot configuration and routing rules. [`BotConfigModal.tsx`](../src/components/BotConfigModal.tsx): drafts and static samples keyed by bot ID. |
| Unknown route or player | `/not-a-route` | [`not-found.tsx`](../src/app/not-found.tsx): app 404. Missing areas and buildings have their own empty states on valid route shapes. |

## Database and state flow

- [`config.ts`](../src/db/config.ts) selects local SQLite or Turso at runtime; the app and database CLI use the same selector. [`client.ts`](../src/db/client.ts) loads the native driver only for a local file and uses libSQL over HTTPS for Turso. Neither driver opens a database at build time. The local write queue prevents synchronous lock waits in one process; database transactions, not that queue, protect writes across instances. See the [rollout guide](deploy-vercel.md) for environment variables and setup.
- [`schema.ts`](../src/db/schema.ts) defines tables for players (profile, budget, rules, revision), player presence, areas, buildings, rooms, bots, and activity. Scoped keys and foreign keys preserve ownership and cascade deletes. Typed JSON columns store attributes of individual entities (e.g. a polygon or staffing assignment), not an entire world dump.
- Account tables store canonical usernames, versioned salted scrypt hashes, SHA-256 digests of random session tokens with seven-day expiry, and short-lived attempt counters. The raw token is sent only as an `HttpOnly` cookie. The [`auth repository`](../src/auth/repository.ts) handles lookup, expiry, revocation, and rate limits. Next Server Actions validate form submissions and check their request origin. Sign-out revokes the current session, not other devices' sessions.
- [`auth/server.ts`](../src/auth/server.ts) resolves the account per request. The world layout and pages require it, and world-backed metadata uses the same guarded reader. [`/api/world`](../src/app/api/world/route.ts) checks it independently on both reads and writes. Keep private data out of public routes and responses out of shared caches.
- [`world-storage.ts`](../src/db/world-storage.ts) reads a consistent snapshot and maps seed or imported data into rows. [`fixtures.ts`](../src/db/fixtures.ts) is for seeding and explicit reset, not a fallback for database errors. [`src/lib/data.ts`](../src/lib/data.ts) is the client catalog for static room styling, providers/models, saved cities, and budget display values.
- [`store.tsx`](../src/lib/store.tsx) keeps the acknowledged snapshot in memory. Reads refresh on reload or window focus. [`/api/world`](../src/app/api/world/route.ts) accepts validated, same-origin JSON commands; [`world-repository.ts`](../src/db/world-repository.ts) applies each change with its activity entry and revision in a transaction. The form stays open on save failure. The activity UI shows the latest 12 entries; older ones remain in SQLite until reset.
- Selection, camera/view settings, user location, toasts, and unsaved drafts are transient. They are not player records. [Legacy import](../README.md#database-workflow) is an explicit, non-overwriting setup operation; do not reintroduce browser storage for durable state.
- Layout drives both [`PlanViews.tsx`](../src/components/PlanViews.tsx) (SVG) and [`Scene3D.tsx`](../src/components/Scene3D.tsx) (procedural WebGL meshes). `Building.plan` and room `x/y/w/h` are local grid coordinates, not lat/lng or the displayed area in m². [`world-rules.ts`](../src/lib/world-rules.ts) shares footprint and size rules between the client preview and the server mutation.
- [`AppShell.tsx`](../src/components/AppShell.tsx) owns navigation, the account panel (sign-out and reset), and toast announcements. Reuse [`ui.tsx`](../src/components/ui.tsx) and the tokens in [`index.css`](../src/index.css).

## External and simulated surfaces

| Surface | What actually happens |
| --- | --- |
| Map tiles | `OsmMap` requests `tile.openstreetmap.org`. Keep OSM attribution visible. Tile failures hide failed images; overlays are independent of tile success. |
| Place lookup | `WorldPage` uses local suggestions and calls Nominatim only on submitted unlisted searches. Browser geolocation is permission-gated and isn't stored. |
| Fonts and art | Google Fonts have system fallbacks. `public/images/map-texture.jpg` is served by Next.js. |
| Bot config | **Test prompt** displays a fixture. **Save & deploy** writes config and bumps the prompt version only when prompt text changes. **Deploy changes** records activity, not a provider call. |
| Rendering budget and LOD | The area panel shows fixture values, not instrumented metrics. Its triangle cap differs from the seed prompt warning threshold; see [Rendering budgets](rendering-budget.md). |
