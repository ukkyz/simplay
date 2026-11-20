# Deploy Simplayz to Vercel with Turso

Simplayz is already a Next.js App Router app. Vercel runs its authenticated routes as Node.js functions; it is not a static export. **Signup is open:** anyone who can reach the app can create an account and edit the shared Alex world. Use deployment protection or restrict network access if the world should be private.

## 1. Choose databases and configure Vercel

1. Use **separate Turso Cloud/libSQL databases** for Preview and Production, with a different database-scoped read/write token for each. If you are bringing an existing SQLite save, create its destination from a backup in step 2 instead of seeding an empty production database first.
2. In the Vercel project, set **Root Directory** to the repository root and **Framework Preset** to **Next.js**. Use [Node.js 22.x](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) (22.12 or newer in that series), as constrained by `package.json`. [`vercel.json`](../vercel.json) selects Next.js and `npm run build`. That command runs only `next build`; leave the Next.js output directory at its default and do not add a database command to the install or build settings.
3. Under **Settings → Environment Variables**, set both names below in **Preview** with its own pair and in **Production** with its own pair. Make the token sensitive. Keep [Enable access to System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables#enable-system-environment-variables) checked so the app sees `VERCEL=1` at runtime. Leave the Arena-specific `SIMPLAYZ_EMBEDDED_PREVIEW_HOST` unset for normal Vercel previews.

| Variable | Value |
| --- | --- |
| `SIMPLAY_DB_TURSO_DATABASE_URL` | The Turso database's `libsql://…` endpoint (or its `https://…` equivalent), with no user info, path, query string, or fragment. |
| `SIMPLAY_DB_TURSO_AUTH_TOKEN` | That database's read/write auth token, not the organization API token. |

Set credentials in the dashboard or a private operator shell. Don't put them in Git, screenshots, `NEXT_PUBLIC_` variables, or client code. Both vars are required on Vercel. An invalid pair or unreachable Turso database does not fall back to a file. Outside Vercel, omitting both uses `DATABASE_PATH` or the default `.data/simplayz.sqlite`; `SIMPLAY_DB_URL` is a transitional alias for **local file paths only**, with lower priority than `DATABASE_PATH`. Replace any old `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` project settings with the exact names above before deploying.

## 2. Prepare each target explicitly

Run `npm ci` from the repo root on an authorized machine. For each command below, load **only the intended target's pair** into your shell or ignored `.env.local`. Verify the target in the Turso dashboard before any write. Do not run setup from Vercel or concurrently from multiple operator shells. Migrations are applied from the committed `drizzle/` files, neither at build time nor on requests.

### Empty database

Create an empty Turso database in the intended group, then run:

```sh
npm run db:setup
```

Expect `Migrations applied (Turso).` and a seed confirmation on the first run. On a second run it should report that the demo player already exists, without overwriting existing edits or accounts. To provision the optional reserved owner login, run `npm run auth:alex` against that same target and enter a password at the hidden prompts. There is no default password. Skip this step if the `alex` account already exists.

### Copy an existing SQLite save

1. Rehearse on a fresh target first. For the final copy, stop writes to the old app. Use SQLite's online backup command to make a consistent snapshot, including committed changes that may still be in the WAL. Use a new private path outside the repo; do not copy just the main file while the source is writing.

   ```sh
   sqlite3 /private/source/simplayz.sqlite ".backup '/private/backup/simplayz-copy.sqlite'"
   sqlite3 /private/backup/simplayz-copy.sqlite 'PRAGMA integrity_check; PRAGMA foreign_key_check;'
   ```

   Expect `ok` and no foreign-key violations. Keep the source and the backup intact.
2. [Create a new database from the copy](https://docs.turso.tech/cli/db/create#create-database-from-sqlite-file). Use a new name and select the intended group with `--group` if needed. Do not import over an existing database.

   ```sh
   turso db create simplayz-copy --from-file /private/backup/simplayz-copy.sqlite --wait
   ```

3. Compare the backup and the new target before switching traffic. In SQLite and the Turso SQL shell, check `SELECT id, revision FROM players;`, row counts for `areas`, `buildings`, `rooms`, `bots`, `activity`, `accounts`, and `auth_sessions` (where present in the source), and `SELECT created_at, hash FROM __drizzle_migrations ORDER BY created_at;`. Compare a known saved edit. Do not print account password hashes or session tokens. If the expected migration history or records are missing, stop and investigate; do not seed over the copy or reconstruct the migration journal by hand.
4. With the new target's pair selected, run `npm run db:migrate` to apply any pending migrations. Recheck the saved revision, records, and owner linkage, then verify an existing account can sign in and see the saved edit. If the hostname changes, browsers will need to sign in again even if session rows were copied. Use `npm run auth:alex` only if that login did not already exist and you want to add it. A browser's legacy world JSON is **not** a full backup and cannot migrate accounts or the migration journal.

## 3. Verify Preview before cutover

Use only a disposable target for writes in this checklist. A browser private window by itself does not isolate database changes.

1. Run `npm ci`, `npm run check`, and `npm run smoke` as in [Verification](verification.md). The normal tests don't contact Turso.
2. To exercise the actual target before deployment, load the disposable pair, build once, and run the two starts in different terminals with the same disposable pair:

   ```sh
   VERCEL=1 npm run build
   VERCEL=1 npm start -- --port 3100
   # In a second terminal:
   VERCEL=1 npm start -- --port 3101
   ```

   In a signed-out browser, open `/user/alex/area/delfshaven-yard`; it should redirect to `/login`. Both `GET` and `POST` to `/api/world` without a session must return 401. Then register different accounts in separate browser profiles on the two servers. Add a building on one and reload the other; both should see it. Restart one server and confirm the same building and login still work. Sign out and confirm world access is denied again.
3. On the two instances, submit two different building additions in the same area at nearly the same time. Compare the signed-in `/api/world` snapshot before and after: both successful edits must appear, and the revision must increase once per commit. In a signed-in browser's console on the disposable instance, run the command below and expect `404`. `GET /api/world` must then return the same snapshot and revision as before the rejected write. Run `npm run db:setup` again and confirm it kept the saved changes and accounts.

   ```js
   const response = await fetch("/api/world", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       type: "add-building", areaId: "rollout-missing-area",
       name: "Rejected rollout check", category: "workshop",
     }),
   });
   console.log(response.status);
   ```
4. When authorized to deploy, deploy to **Preview** first. Repeat guest denial, registration/sign-in/sign-out, and persistence checks there against the Preview database. Verify sign-in issues an `HttpOnly`, `Secure` session cookie under HTTPS. Review sanitized build/runtime logs for errors; never copy secrets into the log. Only after these checks pass should you cut over Production to its separately prepared target.

## Troubleshoot sign-in

**“Account access is temporarily unavailable”** is a request-time error. A successful build does not check the database. A warning about a newer Node.js version is not evidence of a sign-in failure; Node 22.x is supported by Vercel and is intentionally selected by `package.json`.

1. Check whether the failing URL is a **Preview** or **Production** deployment. In that scope, verify that both `SIMPLAY_DB_TURSO_DATABASE_URL` and `SIMPLAY_DB_TURSO_AUTH_TOKEN` were present when the deployment was created. Check that the endpoint and the unexpired **database-scoped, read/write** token belong to the same database. If environment settings changed, use a deployment created with those settings. Do not paste the values into logs or chat.
2. From this checkout, after `npm ci`, run the following in an authorized private shell with the **same pair** as the failing deployment. The command requires both variables, never opens a local file, and does not migrate, seed, or write to Turso.

   ```sh
   NODE_ENV=production npm run db:check
   ```

3. Use the result to narrow down the failure:

   | Result | What to verify |
   | --- | --- |
   | `schema-incomplete` or shared world missing | Confirm this is the intended target and check its migration/import history. Only after confirming it is empty and authorized for setup, use `npm run db:setup`. An existing save should follow the backup/migration path above. |
   | `database-access-denied` | Verify the token is valid for that exact database. Sign-in writes rate-limit counters and sessions, so a read-only token is insufficient even if `db:check` succeeds. |
   | `database-endpoint-not-found`, `database-network-error`, `database-timeout`, or `database-unavailable` | Check the endpoint, database availability in Turso, and connectivity from the deployed function. |
   | Reads pass, but `alex` is not provisioned | The demo profile isn't a login. Restore the existing account from a verified backup, or provision it with `npm run auth:alex` if this is an authorized new target. |

4. If reads pass but sign-in still fails, check the affected deployment's **runtime logs** for the failing `POST /login`, not just the build log. Look for `Account request failed` and its phase and failure label (for example, `login/rate-limit: database-access-denied`). `local-storage-unavailable` on Vercel is a reason to verify that system variables are available and that the remote pair is configured. Share only the phase and failure label, never the token, password, session cookie, or raw query data.

## Rollback

- Keep the pre-cutover database/backup and a known-good app deployment until the new one is verified. For a code-only regression, roll back to a known-good deployment compatible with the current Turso schema and environment. Rolling back app code does not undo database writes or schema changes.
- Before a data rollback or returning to the old SQLite instance, stop writes and back up the current Turso state. Restoring an older snapshot can lose new accounts and world edits. Reconcile those changes before moving traffic. Restore into a **new** target, verify it, and then update the pair and redeploy; never overwrite the active database in place.
