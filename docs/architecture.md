# Architecture and source map

## Stack and runtime boundary

React 19 and TypeScript render a single client-side app. Vite 7 builds it, Tailwind 4 supplies styles, and Three.js renders the area and building previews directly (no React Three Fiber). The `@/` alias points to `src/`. `src/main.tsx` mounts `<App />` in React Strict Mode; `src/App.tsx` wraps routing in `SimplayzProvider` and each screen in `AppShell`.

There is **no server, account authentication, shared multiplayer world, or live LLM integration** in this checkout. The `userId` in routes is a path parameter, not an authorization check. Labels such as *online*, *deployed*, and *verified* can describe seeded demo state; check the implementation before assuming a service or pipeline exists.

## Routes and likely edit points

| Route pattern | Repro path | Start here |
| --- | --- | --- |
| `/` | `/` | [`WorldPage.tsx`](../src/pages/WorldPage.tsx): city search, geolocation, layers, and area/player markers. [`OsmMap.tsx`](../src/components/OsmMap.tsx): tile projection, pan/zoom, markers, and attribution. |
| `/user/:userId/area/:areaId` | `/user/alex/area/delfshaven-yard` | [`AreaPage.tsx`](../src/pages/AreaPage.tsx): area selection and the Add building flow, with five starter rooms. |
| `/user/:userId/area/:areaId/building/:buildingId` | `/user/alex/area/delfshaven-yard/building/foundry-hall` | [`BuildingPage.tsx`](../src/pages/BuildingPage.tsx): room selection, staffing, and adding a room by splitting an existing room. |
| `/user/:userId/ai/management` | `/user/alex/ai/management` | [`AiManagementPage.tsx`](../src/pages/AiManagementPage.tsx): bot state, route settings, prompt version bump on text change. [`BotConfigModal.tsx`](../src/components/BotConfigModal.tsx): draft config and static samples keyed by bot ID. |
| Other path | `/not-a-route` | [`App.tsx`](../src/App.tsx): route not found. Valid route shapes with missing areas or buildings have page-specific empty states. |

[`src/lib/router.ts`](../src/lib/router.ts) owns route parsing, titles, and `navigate()`, which pushes History API state and emits `popstate`. Keep in-app navigation and direct loads/back/forward in mind when changing routes. The host must serve `index.html` for app routes.

## State and data flow

- [`src/lib/types.ts`](../src/lib/types.ts) defines `WorldState`, `Area`, `Building`, `Room`, and `Bot`. [`src/lib/data.ts`](../src/lib/data.ts) seeds the Alex world, Rotterdam areas, player markers, provider/model metadata, AI activity, and asset-budget display values.
- [`src/lib/store.tsx`](../src/lib/store.tsx) exposes immutable edits through `useSimplayz()`. It loads saved data or a clone of `WORLD`, writes `simplayz.world.v1` to `localStorage`, and listens for same-origin cross-tab `storage` events. That is not network sync. It checks that `areas` and `bots` are arrays but does not run schema migrations. Seed changes may only appear in fresh storage; use a separate test context rather than clearing someone's existing save.
- The shared layout drives [`PlanViews.tsx`](../src/components/PlanViews.tsx) (SVG plans) and [`Scene3D.tsx`](../src/components/Scene3D.tsx) (procedural WebGL meshes). `Building.plan` and the room `x/y/w/h` fields are local grid coordinates, not lat/lng or the room's displayed `area` in m². Cross-check geometry and selected IDs in both views when changing layout.
- [`AppShell.tsx`](../src/components/AppShell.tsx) owns shared navigation, profile/reset, and toasts. [`ui.tsx`](../src/components/ui.tsx) contains buttons, panels, fields, toggles, and dialogs. [`index.css`](../src/index.css) has the bone/paper/ink palette, lime accents, typography, and reduced-motion CSS; prefer its tokens over a new theme. Tailwind scans `src/` and `index.html`, not docs or test scripts.

## External and simulated surfaces

| Surface | What actually happens |
| --- | --- |
| Map tiles | `OsmMap` requests `tile.openstreetmap.org` from the browser. Keep OSM attribution visible. Tile failures hide the failed image; overlays are independent of tile success. |
| Place lookup | `WorldPage` uses local `LOCATIONS` suggestions and calls Nominatim on submitted unlisted searches, not on every keystroke. Browser geolocation is permission-gated. Mock these paths in automation and check service usage policies before expanding request volume. |
| Fonts and local art | Google Fonts are requested by `index.css` with system fallbacks; `public/images/map-texture.jpg` is served separately from the inlined HTML. |
| Bot config and budget | **Test prompt** displays `testOutputs`, not inference. **Save & deploy** saves config locally; **Deploy changes** adds an activity entry/toast. Provider status, price, latency, and policy copy are fixtures, not provider guarantees or enforcement. |
| Rendering budget and LOD | The area dashboard renders `ASSET_BUDGET`; it does not instrument the scene. Its triangle cap and the seed bot warning threshold differ. See [Rendering budgets](rendering-budget.md) before using either in a prompt. |
