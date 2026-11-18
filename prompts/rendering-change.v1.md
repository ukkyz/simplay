# Rendering change — v1

- **Use when:** You need a rendering patch, a technical art plan, or a performance review.
- **Pass if:** The visual target is demonstrable and every changed asset has a scoped budget and a fallback.
- **Expected response:** Visual outcome, assets/work, before/after results, and trade-offs.

```text
Read AGENTS.md and docs/rendering-budget.md.
Mode: [implement / plan-only / review — pick one].
Scene: [seeded area/building URL, asset IDs, view, time of day].
Visual target: [reference plus one visible change; specify what to preserve,
for example silhouette, room legibility, or picking].
Repro: [steps and current problem].
Budget: [device/browser, viewport/DPR, p95 frame-time target, scene draws/triangles,
texture memory, particle count and overdraw cap].
Asset limits: [asset ID/type, peak visible count, LOD0–LOD3 for heroes,
triangles, texture sizes/format, draws, particles per asset].
Fallback: [low/mobile tier, reduced motion, and no-WebGL SVG behavior].
Out of scope: [asset import, redesign, or other excluded work].

Do not use fixture dashboard numbers as measurements. If a limit is missing,
propose one and label it for approval before asset production. Validate with
matching before/after camera, viewport, and lighting. Run npm run check for code
changes and verify existing 2D editing and scene selection still work.

Return sections in this order:
1. Visual outcome: max 2 sentences; attach before/after evidence if available.
2. Assets/work: changed files or plan plus the per-asset budget.
3. Verification: device/route/view | metric | before | after | cap | status.
   Use "not measured" for missing numbers; include build and fallback checks.
4. Trade-offs: max 3 bullets including any blockers.
```
