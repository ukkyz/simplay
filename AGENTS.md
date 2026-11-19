# Working on Simplayz

Simplayz uses Next.js App Router, React/TypeScript, and Drizzle with local SQLite. The server shares one editable demo world across browser sessions; player presence and AI-provider execution are simulated. OpenStreetMap tiles and place lookup are real network dependencies.

## Read only what the task needs

| Task | Start here |
| --- | --- |
| Routes, database, state, or external services | [Architecture and source map](docs/architecture.md) |
| Build, bug reproduction, responsive UI, or regression checks | [Verification](docs/verification.md) |
| 3D art, shaders, VFX, textures, or frame time | [Rendering budgets and profiling](docs/rendering-budget.md) |
| Prompt writing, review, or AI management | [Versioned prompts and eval workflow](prompts/README.md) |

## Working agreements

1. Check `git status --short` and read the affected source before proposing edits. Use a seeded route and a concrete reproduction for bugs. Distinguish a demo label from an implemented feature.
2. Confirm how to verify the result before editing. In plan-only or review mode, don't change files. Ask a focused question if the answer would change scope or a budget; otherwise state the assumption and proceed.
3. Keep durable player data in SQLite. Write through validated commands and transactions; keep tokens, provider credentials, and the database out of the client and Git. Commit Drizzle migrations with schema changes. Preserve existing saves and use a disposable database for destructive tests.
4. Reuse the Next routes, React context, Tailwind tokens, and UI primitives. Keep 2D plans usable without WebGL and verify geometry and selection in both views. Document per-asset limits before production, audit transparency on mobile, and require LOD0–LOD3 for new hero meshes. Never use fixture metrics as profile data.
5. For bot prompt changes, define the output contract and pass/fail cases first. Version the prompt, ground it with verified IDs and constraints, and test the intended model and temperature only when a live runner is available. The UI's **Test prompt** is a fixture, not a model eval.

## Verification and handoff

- Install with `npm ci` (Node 22.12+). Set up a local database with `npm run db:setup`; it does not overwrite existing edits. Run `npm run check` for TypeScript, SQLite integration tests, and the production build. After building, run `npm run smoke` when Chromium is available.
- Report the routes and interactions checked. For rendering changes, give before/after metrics and the device, or state what was not measured. Distinguish mocked and headless checks from live verification.
- Summarize the outcome, changed files, checks with results, and any blockers. Leave unrelated fixes out of the patch.
