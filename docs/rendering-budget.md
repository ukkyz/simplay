# Rendering budgets and profiling

## What the app shows vs. what it measures

[`Scene3D.tsx`](../src/components/Scene3D.tsx) builds procedural mesh previews from the layout. [`ASSET_BUDGET`](../src/lib/data.ts) and the [seed `basePrompt`](../src/db/fixtures.ts) are fixtures, not live counters or build gates.

| Metric | Area panel fixture (shown / cap) | Seed bot prompt warns above |
| --- | --- | --- |
| Triangles | 48,200 / 80,000 | 25,000 per area |
| Draw calls | 24 / 40 | 40 per area |
| Texture memory | 41.8 / 64 MB | 64 MB per area |
| Particles / overdraw | 120 / 512 | Not specified |

The triangle figures are different thresholds; neither is a measured limit. Confirm whether a task needs a warning threshold, a hard limit, or UI copy before changing them. The LOD and BC7/ASTC badges are also fixtures: there's no mesh import, LOD generation, or compressed-texture pipeline wired up. The 2D SVG plans remain editable when WebGL is unavailable.

## Budget new assets before production

Use these as **proposed intake ceilings for new content**, not as telemetry, release claims, or a mandate to retrofit existing scenes. Confirm them (or record replacements) with the asset owner before making assets. Pick key views and a representative desktop and low-end mobile device, then approve scene-level totals from a real baseline. If no target device or cap is agreed, report the gap rather than guessing at a pass.

| Asset family | Triangles per visible instance (LOD0/1/2/3 where used) | Texture allocation (max dimension; GPU estimate) | Main-pass submissions | Peak live particles |
| --- | --- | --- | --- | --- |
| Hero building shell | 4,000 / 2,000 / 1,000 / 500 | 1024² per map; 8 MiB per set | 2 per instance | 0 |
| Modular room kit | 1,500 / 750 / 350 / 150 | 512² per map; 2 MiB per shared set | 2 per instance or batch | 0 |
| Repeated prop / foliage | 600 / 300 / 150 / 75 | 512²; 2 MiB per shared atlas | 1 per visible batch/material | 0 |
| Animated resident | 1,200 / 600 / 300 / 150 | 512² per map; 2 MiB per shared set | 1 per instance or batch | 0 |
| 3D selection marker / label | 16 | 512×256; 0.7 MiB per shared atlas | 1 per visible label or batch | 0 |
| Translucent VFX (if added) | 2 per billboard | 256²; 0.5 MiB per atlas | 1 per batched emitter | 32 mobile / 64 desktop per emitter |
| Map tiles / 2D plan | No WebGL triangles | OSM tiles are 256² (~0.25 MiB decoded RGBA8 each); prefer SVG/CSS for new plan detail | Track tile requests, DOM and paint separately | 0 |

For the local map backdrop, the existing [`map-texture.jpg`](../public/images/map-texture.jpg) is 1586×992 and 476,243 bytes (~6 MiB if decoded as RGBA8). Use those dimensions and transfer size as ceilings for replacements unless a larger asset is approved. Report this separately from Three.js texture memory.

- Write the approved manifest in the task or PR: asset ID/type, source/license, max visible count per scene, LOD counts and switch thresholds, material slots, textures (sizes, channels, mips, target format), draws, particles, and platforms. Sum peak visible cost including shadows/extra passes; a per-asset ceiling alone is not a scene budget. Budget overdraw separately from particle count.
- A new hero mesh is not ready to ship without LOD0–LOD3, proven transitions at actual camera distances, and preserved silhouette and picking. For WebGL, begin with shared materials, simpler primitives and batching/instancing when it reduces measured cost. Don't promise BC7/ASTC on a device without checking loader support and fallback.
- Cap transparent/additive coverage and overlap on mobile; check the worst case (zoomed in, multiple layers, night) rather than judging by count. Prefer opaque geometry or alpha test when it preserves the look. For new VFX, start with at most 64 mobile / 128 desktop live particles across the scene; lower emission/size or disable the effect in the low tier if overdraw dominates. Keep a reduced-motion behavior explicit for new animations; CSS preferences do not automatically stop the Three.js loop.

## Profiling protocol

1. Use a production preview and a fresh seed (or describe the exact edited layout). Compare Delfshaven Yard and Foundry Hall at matching camera pose, viewport, DPR, lighting, and visible assets. The current renderer clamps DPR to 1.75 and uses a 1024² directional shadow map; keep those settings constant between runs unless they're the experiment.
2. Record the browser, OS, GPU/device, viewport/DPR, and time-of-day/view. Sample idle and camera interaction after warm-up for the same interval (for example, three 10-second runs per revision). Cover the worst changed view and at least one real mobile device when judging fill rate. Starter frame targets to confirm are 16.7 ms desktop (60 fps) and 33.3 ms low-tier mobile (30 fps), not promises about current performance.
3. Capture p50/p95 presented-frame intervals and main-thread cost in a Performance trace. Use a supported GPU profiler or timer when GPU time matters; `requestAnimationFrame` intervals alone aren't GPU time. Record Three.js `renderer.info.render.calls` and `.triangles` with the same pass accounting before/after; `.memory` counts texture/geometry objects, not bytes. For a full mip chain, estimate uncompressed texture memory as `width × height × bytes/texel × 4/3`; account for compressed formats and render targets separately.
4. Compare screenshots of the same view and check selection/picking, time controls, and the SVG fallback. Navigate away and back repeatedly to check resource release. `Scene3D` cleans up frames, listeners, controls, geometries, materials, and textures on teardown; dispose any added resources there. Widen its `dataKey` only for geometry-affecting inputs that need rebuilds; selection/view/time currently use the imperative API without rebuilding the renderer.

Report `device/route/view | metric | before | after | cap | pass/fail/not measured` plus one sentence about the visual trade-off. Software or headless rendering is useful for correctness, not a mobile performance result.
