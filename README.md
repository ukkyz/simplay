# Simplayz

Explore a Rotterdam world on OpenStreetMap, edit buildings and room layouts, and configure a simulated AI crew. Next.js serves the app, and Drizzle stores accounts, sessions, and world changes in local SQLite or Turso. All signed-in accounts can edit the **same** world. Player presence and model execution are simulated.

## Run locally

Use Node.js 22.x (22.12 or newer) and npm. No API keys are needed for local SQLite.

```sh
npm ci
npm run db:setup   # apply migrations and seed once; safe to rerun
npm run dev
```

Open `http://localhost:3000` locally or the forwarded preview in a remote workspace. SQLite defaults to `.data/simplayz.sqlite`. Set `DATABASE_PATH` in the environment or `.env.local` to use another file (see [`.env.example`](.env.example)). Existing `SIMPLAY_DB_URL` file paths still work as a lower-priority alias.

## Accounts and the shared world

Visit `/register` to create an account and sign in. Usernames are case-insensitive and use 3–24 ASCII letters, digits, underscores, or hyphens; the first character must be a letter or digit. Use a password of 12–128 characters. To leave, choose **Sign out** in the header's account panel. Guests only have access to the sign-in and signup screens.

To link the existing save to its reserved owner login, run this once in a local terminal against the same database used by the app:

```sh
npm run db:setup
npm run auth:alex
```

Enter and confirm a password at the hidden prompts, then sign in as `alex`. There is no default password, and public signup cannot claim `alex`. The command never replaces an existing account or changes the world. For unattended setup, `npm run auth:alex -- --stdin` accepts one password via a private pipe; do not pass it as a command-line argument.

Every signed-in account opens the same save, including the routes below. A new account does not create another player or world. **Reset simulation** restores the starter world for everyone, without deleting any accounts.

| Screen | Seeded path |
| --- | --- |
| World map | `/` |
| Delfshaven Yard | `/user/alex/area/delfshaven-yard` |
| Foundry Hall | `/user/alex/area/delfshaven-yard/building/foundry-hall` |
| AI Management | `/user/alex/ai/management` |

## Database workflow

- Edit [`src/db/schema.ts`](src/db/schema.ts), run `npm run db:generate -- --name describe_change`, and commit the generated SQL **and** metadata in `drizzle/`.
- Apply migrations with `npm run db:migrate`. `npm run db:seed` inserts the starter player, presence, layouts, bots, budget, rules, and activity only if the demo player is missing. `npm run db:setup` does both.
- **Moving an old save:** On the old app's origin, export the raw `simplayz.world.v1` value from browser Local Storage to a JSON file (don't paste it into a prompt or commit it). Run `npm run db:setup`, then `npm run db:import -- /path/to/world.json` before making your first edit. Import validates the snapshot and refuses to overwrite an edited or already imported database. The app no longer reads or writes player data in Local Storage.

## Deployment

For Vercel, follow [Deploy Simplayz with Turso](docs/deploy-vercel.md). Set `SIMPLAY_DB_TURSO_DATABASE_URL` and `SIMPLAY_DB_TURSO_AUTH_TOKEN` on the server, using separate databases and tokens for Preview and Production. The build does not connect to or migrate the database. Apply setup or migrations explicitly against the selected target before serving traffic.

For self-hosted SQLite, run database setup against a **persistent writable volume**, then `npm run build` and `npm start` with the same `DATABASE_PATH`. Serve the Node app over HTTPS, not as a static export. Back up the database before upgrades. **Signup is open:** anyone who can reach your instance can register, read, and edit the shared save.

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

[Prompt templates and a filled example](prompts/README.md) cover task, rendering, and bot-prompt work. [AGENTS.md](AGENTS.md) links to the source map and task-specific checks.

## Checks

```sh
npm run check                  # TypeScript, SQLite integration tests, Next.js build
npx playwright install chromium  # one-time browser setup
npm run smoke                  # production server + temporary SQLite database
```

See [Verification](docs/verification.md) for test coverage, preview setup, and limits.
