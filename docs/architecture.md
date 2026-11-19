# Architecture and source map

## Runtime boundary

Next.js App Router serves the React 19 and TypeScript app. [`src/app/layout.tsx`](../src/app/layout.tsx) reads a server-side SQLite snapshot and supplies it to `SimplayzProvider` and `AppShell`. File-based routes and Next metadata handle deep links and page titles. Interactive screens live under `src/screens/`; `@/` points to `src/`. Tailwind 4 supplies styles, and Three.js is loaded on demand for area and building previews.

There is one editable demo player (`alex`). Other map presences are seeded records, not connected sessions. A URL player ID is not an authorization check. The app has no account authentication, real-time multiplayer service, or live LLM integration; all visitors to one instance share the demo database. Labels like *online*, *deployed*, and *verified* can still describe demo behavior.

## Routes and likely edit points

| Route pattern | Repro path | Start here |
| --- | --- | --- |
| `/` | `/` | [`WorldPage.tsx`](../src/screens/WorldPage.tsx): city search, geolocation, layers, and markers. [`OsmMap.tsx`](../src/components/OsmMap.tsx): tiles, pan/zoom, and attribution. |
| `/user/:userId/area/:areaId` | `/user/alex/area/delfshaven-yard` | [`AreaPage.tsx`](../src/screens/AreaPage.tsx): area selection and the Add building flow. |
| `/user/:userId/area/:areaId/building/:buildingId` | `/user/alex/area/delfshaven-yard/building/foundry-hall` | [`BuildingPage.tsx`](../src/screens/BuildingPage.tsx): room selection, staffing, and subdividing a room. |
| `/user/:userId/ai/management` | `/user/alex/ai/management` | [`AiManagementPage.tsx`](../src/screens/AiManagementPage.tsx): bot configuration and routing rules. [`BotConfigModal.tsx`](../src/components/BotConfigModal.tsx): drafts and static samples keyed by bot ID. |
| Unknown route or player | `/not-a-route` | [`not-found.tsx`](../src/app/not-found.tsx): app 404. Missing areas and buildings have their own empty states on valid route shapes. |

## SQLite and state flow

- [`schema.ts`](../src/db/schema.ts) defines tables for players (profile, budget, rules, revision), player presence, areas, buildings, rooms, bots, and activity. Scoped keys and foreign keys preserve ownership and cascade deletes. Typed JSON columns store attributes of individual entities (e.g. a polygon or staffing assignment), not an entire world dump.
- [`world-storage.ts`](../src/db/world-storage.ts) reads a consistent snapshot and maps seed or imported data into rows. [`fixtures.ts`](../src/db/fixtures.ts) is for seeding and explicit reset, not a fallback for database errors. [`src/lib/data.ts`](../src/lib/data.ts) is the client catalog for static room styling, providers/models, saved cities, and budget display values.
- [`store.tsx`](../src/lib/store.tsx) keeps the acknowledged snapshot in memory. Reads refresh on reload or window focus. [`/api/world`](../src/app/api/world/route.ts) accepts validated, same-origin JSON commands; [`world-repository.ts`](../src/db/world-repository.ts) applies each change with its activity entry and revision in a transaction. The form stays open on save failure. The activity UI shows the latest 12 entries; older ones remain in SQLite until reset.
- Selection, camera/view settings, user location, toasts, and unsaved drafts are transient. They are not player records. [Legacy import](../README.md#database-workflow) is an explicit, non-overwriting setup operation; do not reintroduce browser storage for durable state.
- Layout drives both [`PlanViews.tsx`](../src/components/PlanViews.tsx) (SVG) and [`Scene3D.tsx`](../src/components/Scene3D.tsx) (procedural WebGL meshes). `Building.plan` and room `x/y/w/h` are local grid coordinates, not lat/lng or the displayed area in m². [`world-rules.ts`](../src/lib/world-rules.ts) shares footprint and size rules between the client preview and the server mutation.
- [`AppShell.tsx`](../src/components/AppShell.tsx) owns navigation, the profile/reset menu, and toast announcements. Reuse [`ui.tsx`](../src/components/ui.tsx) and the tokens in [`index.css`](../src/index.css).

## External and simulated surfaces

| Surface | What actually happens |
| --- | --- |
| Map tiles | `OsmMap` requests `tile.openstreetmap.org`. Keep OSM attribution visible. Tile failures hide failed images; overlays are independent of tile success. |
| Place lookup | `WorldPage` uses local suggestions and calls Nominatim only on submitted unlisted searches. Browser geolocation is permission-gated and isn't stored. |
| Fonts and art | Google Fonts have system fallbacks. `public/images/map-texture.jpg` is served by Next.js. |
| Bot config | **Test prompt** displays a fixture. **Save & deploy** writes config and bumps the prompt version only when prompt text changes. **Deploy changes** records activity, not a provider call. |
| Rendering budget and LOD | The area panel shows fixture values, not instrumented metrics. Its triangle cap differs from the seed prompt warning threshold; see [Rendering budgets](rendering-budget.md). |
