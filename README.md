# Simplayz

Explore a Rotterdam world on OpenStreetMap, edit buildings and room layouts, and configure a simulated AI crew. This checkout is a browser-only React app: player presence and AI execution are demo data, and edits are saved in browser storage rather than shared across devices.

## Run locally

Use Node.js 22.12+ and npm. No API keys or environment files are needed.

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

Open the URL printed by Vite (usually `http://localhost:5173` locally), or the forwarded preview in a remote workspace. See [Verification](docs/verification.md) for browser tests and hosting notes.

| Screen | Seeded path |
| --- | --- |
| World map | `/` |
| Delfshaven Yard | `/user/alex/area/delfshaven-yard` |
| Foundry Hall | `/user/alex/area/delfshaven-yard/building/foundry-hall` |
| AI Management | `/user/alex/ai/management` |

## Your next AI task

Copy [the task template](prompts/agent-task.v1.md), or start with this short version:

```text
Read AGENTS.md first. Task template: agent-task v1.
Mode: [implement / plan-only / review — pick one].
Goal: [one observable behavior to change].
Repro or reference: [seeded route, steps, and what happens now].
Acceptance: [expected result, failure case, and what must stay unchanged].
Return: outcome, files, checks with results, and blockers.
```

[Prompt templates and a filled example](prompts/README.md) cover task, rendering, and bot-prompt work. [AGENTS.md](AGENTS.md) is the entry point for repository instructions and links to the relevant source maps and checks.

## Checks

```sh
npm run check                 # TypeScript + production build
npx playwright install chromium  # one-time browser setup
npm run smoke                 # browser smoke against the build
```

The browser check blocks external requests and exercises the no-WebGL fallback; it does not profile rendering or test live services. Deploy the **whole** `dist/` directory over HTTP, with an SPA fallback for deep links. The generated HTML inlines JS/CSS, but still references a public image and external services.
