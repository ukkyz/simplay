import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { allowAuthAttempt, createAlexAccount, findSessionAccount, loginAccount } from "../src/auth/repository";
import { openConfiguredDatabase, openDatabase } from "../src/db/client";
import { databaseFailureReason } from "../src/db/diagnostics";
import { createWorldRepository } from "../src/db/world-repository";
import { seedDemo } from "../src/db/world-storage";
import { checkTurso } from "./check-turso";

async function fixture(t: TestContext) {
  const dir = await mkdtemp(join(tmpdir(), "simplayz-db-diag-"));
  const connection = openDatabase(join(dir, "world.sqlite"));
  t.after(async () => {
    connection.client.close();
    await rm(dir, { recursive: true, force: true });
  });
  return connection;
}

function labeled(expected: ReturnType<typeof databaseFailureReason>) {
  return (error: unknown) => {
    assert.equal(databaseFailureReason(error), expected);
    return true;
  };
}

test("missing migrations are diagnosed through the sign-in query and read-only probe", async (t) => {
  const { client, db } = await fixture(t);
  await assert.rejects(allowAuthAttempt(db, "login", "diagnostic-user"), labeled("schema-incomplete"));
  await assert.rejects(checkTurso(client), labeled("schema-incomplete"));
});

test("the read-only probe distinguishes setup and Alex provisioning without changing the save or sessions", async (t) => {
  const { client, db } = await fixture(t);
  await migrate(db, { migrationsFolder: "./drizzle" });
  assert.deepEqual(await checkTurso(client), { worldSeeded: false, alexProvisioned: false });
  await seedDemo(db);
  assert.deepEqual(await checkTurso(client), { worldSeeded: true, alexProvisioned: false });
  const password = "Temporary diagnostic passphrase, not used in production";
  await createAlexAccount(db, password);
  const { token } = await loginAccount(db, { username: "alex", password });
  const world = createWorldRepository(db);
  const original = await world.read();
  assert.deepEqual(await checkTurso(client), { worldSeeded: true, alexProvisioned: true });
  assert.deepEqual(await world.read(), original);
  assert.deepEqual(await findSessionAccount(db, token), { username: "alex", ownsWorld: true });
  assert.equal((await client.execute("SELECT count(*) AS attempts FROM auth_attempts")).rows[0]?.attempts, 0);
});

test("Turso failures produce fixed labels, not database response bodies or query details", async (t) => {
  const token = "synthetic-do-not-echo-this-token";
  let failure: number | Error;
  t.mock.method(globalThis, "fetch", async () => {
    if (failure instanceof Error) throw failure;
    return new Response(`Error response that echoes ${token}`, {
      status: failure, headers: { "Content-Type": "text/plain" },
    });
  });
  const { client, db } = openConfiguredDatabase({
    VERCEL: "1",
    SIMPLAY_DB_TURSO_DATABASE_URL: "libsql://diagnostic.example.invalid",
    SIMPLAY_DB_TURSO_AUTH_TOKEN: token,
  });
  t.after(() => client.close());
  for (const [error, label] of [
    [401, "database-access-denied"],
    [403, "database-access-denied"],
    [404, "database-endpoint-not-found"],
    [503, "database-unavailable"],
    [new DOMException(token, "TimeoutError"), "database-timeout"],
  ] as const) {
    failure = error;
    await assert.rejects(allowAuthAttempt(db, "login", "diagnostic-user"), labeled(label));
    await assert.rejects(checkTurso(client), labeled(label));
  }
  assert.equal(databaseFailureReason(Object.assign(new Error(token), { code: "SQLITE_READONLY" })), "database-access-denied");
  const hranaError = (message: string) => Object.assign(new Error(`SQLite error: ${message} (${token})`), { code: "SQLITE_UNKNOWN" });
  assert.equal(databaseFailureReason(hranaError("no such table: auth_attempts")), "schema-incomplete");
  assert.equal(databaseFailureReason(hranaError("attempt to write a readonly database")), "database-access-denied");
  assert.equal(databaseFailureReason(Object.assign(new Error(token), { code: token })), "unexpected-error");
});
