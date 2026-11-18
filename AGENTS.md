# Working on Simplayz

Simplayz is a React/TypeScript single-page world-building simulator. This checkout is client-only: player presence and AI-provider behavior are simulated. Local edits persist in the browser; OpenStreetMap tiles and place lookup are real network dependencies.

## Read only what the task needs

| Task | Start here |
| --- | --- |
| Routes, data, state, or external services | [Architecture and source map](docs/architecture.md) |
| Build, bug reproduction, responsive UI, or regression checks | [Verification](docs/verification.md) |
| 3D art, shaders, VFX, textures, or frame time | [Rendering budgets and profiling](docs/rendering-budget.md) |
| Prompt writing, review, or AI management | [Versioned prompts and eval workflow](prompts/README.md) |

## Working agreements

1. Check `git status --short` and read the affected source before proposing edits. Use a seeded route and a concrete reproduction for bugs. Treat the code as authoritative about current behavior; distinguish a demo label from an implemented feature.
2. Confirm what the result should do and how to verify it before editing. In plan-only or review mode, don't change files. Ask a focused question if the answer would change scope or a budget; otherwise state the assumption and proceed.
3. Keep the existing React context, History API router, Tailwind tokens, and UI primitives unless the task explicitly changes them. Preserve existing `simplayz.world.v1` data or describe a backward-compatible migration. Don't add dependencies, a backend, live provider calls, or credential storage as incidental work.
4. Keep 2D plans usable without WebGL. For layout changes, verify the SVG and 3D previews agree on geometry and selection. For rendering changes, document per-asset limits before production, audit transparency on mobile, and require LOD0–LOD3 for new hero meshes. Never use fixture metrics as profile data.
5. For bot prompt changes, define the output contract and pass/fail cases first. Version the prompt, ground it with verified IDs and constraints, and record eval results at the intended model and temperature if a live runner is actually available. The UI's **Test prompt** is a mock, not a model eval.

## Verification and handoff

- Install with `npm ci` (Node 22.12+ recommended). Run `npm run check` for TypeScript and the production build. After building, run `npm run smoke` when Chromium is available; setup and limits are in [Verification](docs/verification.md).
- For UI changes, report the routes and interactions checked. For rendering changes, report device and before/after numbers, or state what wasn't measured. Don't pass off headless or mocked checks as live verification.
- Summarize the outcome, changed files, checks with results, and any blockers. Leave unrelated fixes out of the patch.
