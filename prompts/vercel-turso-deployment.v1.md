# Vercel + Turso deployment prompt — v1

**Pass if:** The existing Next.js app can run on Vercel using Turso, local development still works with SQLite, and the migration and verification steps preserve existing saves and accounts.

**Expected response:** Outcome, changes, rollout checklist, and verification results with any blockers.

## Copy this prompt

```text
Read AGENTS.md. Mode: implement code, tests, and deployment documentation. Do not deploy to
Vercel, modify a live database, or request credentials in chat. Ask before any operation
that would write to a hosted database unless it is explicitly designated as disposable for
this task.

Goal: Make Simplayz deployable on Vercel with a persistent Turso database. Use the exact
server-only environment variables SIMPLAY_DB_TURSO_DATABASE_URL and
SIMPLAY_DB_TURSO_AUTH_TOKEN.

Baseline: Verify the checkout first. The branch based on b6bfa3b already uses Next.js App
Router, TypeScript, Drizzle, and a local libSQL/SQLite file. Keep Next.js and use Vercel's
Next.js preset and a supported Node.js version compatible with package.json. Do not convert
it again, use a static export, or change routes, UI, or sign-in behavior. Start in
src/db/client.ts, scripts/db.ts, scripts/auth-alex.ts, next.config.ts, and .env.example.

Database configuration:
- When both variables are set and valid, connect to the supplied Turso database with a
  server-side libSQL client compatible with the installed Drizzle version. Verify support
  for interactive transactions, consistent batch reads, and the committed Drizzle
  migrations. Use the remote database even if DATABASE_PATH is also set.
- On Vercel (VERCEL=1 at runtime), require both variables. In any environment, reject
  partial or invalid configuration with a message naming the relevant variable, without
  exposing values. Never fall back to SQLite if a remote database was requested or cannot be
  reached.
- Outside Vercel, when both Turso variables are unset, retain local SQLite via DATABASE_PATH
  or .data/simplayz.sqlite. Use one configuration path for the app and database commands.
  Local-only operations such as directory creation and PRAGMA journal_mode=WAL must not run
  in Turso mode.
- Keep database access lazy and server-only. The Next.js build must not connect to a
  database or apply migrations, even with VERCEL=1 and no credentials. Do not expose
  credentials via NEXT_PUBLIC_ variables, logs, browser bundles, or Git. Add only commented
  placeholders to .env.example.

Data and behavior to preserve:
- Keep the current Drizzle schema and migration history unless a demonstrated change is
  necessary. Preserve atomic world edits and registration/session writes across
  independently running Vercel instances; a process-local queue is not a distributed lock.
  Keep existing secure session cookies and server-side checks on world pages, metadata, and
  GET/POST /api/world.
- Make db:migrate, db:seed, db:setup, db:import, and auth:alex target the selected database.
  Retain the validation and overwrite guard for db:import. Run migrations and optional seed
  explicitly from an authorized shell, not during builds, cold starts, or requests.
  Repeating setup must leave an edited save and existing accounts alone. Keep alex reserved
  and never create a default password.
- Document two paths: initialize an empty Turso database, or back up the existing SQLite
  database and copy it into a fresh Turso target using a supported import method. The latter
  must preserve the world revision, accounts, and migration history; the browser JSON import
  alone cannot migrate accounts. Verify a copy before cutover. Do not overwrite an existing
  Turso database or transfer real data as part of this task.

Acceptance and verification:
1. Test the config matrix: local defaults, explicit DATABASE_PATH, valid remote pair, each
   missing member of the pair, invalid remote URL, and missing credentials on Vercel.
   Confirm a remote configuration error cannot create or write a local SQLite file.
2. Run npm ci, npm run check, and npm run smoke. Local tests must use temporary databases
   even if Turso credentials exist in the shell. Confirm a production Next.js build succeeds
   in Vercel mode without secrets and does not start database setup.
3. If an approved disposable Turso database is available, apply setup twice, test
   signup/login/logout and guest denial, and verify that two signed-in accounts see the same
   saved edit after reload and a fresh server instance. Confirm concurrent edits preserve
   revisions and that a rejected write leaves data unchanged. If remote or Vercel
   verification cannot be run, mark it not run and give exact steps to reproduce it.
4. Document the Vercel setup: repository root, Next.js preset, compatible Node.js version,
   and where to set the two variables in Preview and Production. Ensure Vercel system
   variables are available at runtime, and use different database URLs and tokens for
   Preview and Production. Include migration/seed timing, optional Alex provisioning, backup
   and rollback steps, and the warning that open signup grants edit access to the shared
   world.

Return: (1) what changed and why, (2) files changed, (3) the exact rollout checklist, and
(4) checks run with results and any remaining blockers. Do not describe a deployment,
transfer, or live test as complete unless it was actually verified.
```
