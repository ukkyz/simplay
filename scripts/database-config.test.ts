import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test, type TestContext } from "node:test";
import { openConfiguredDatabase } from "../src/db/client";
import { DatabaseConfigError, resolveDatabaseConfig } from "../src/db/config";

const URL_KEY = "SIMPLAY_DB_TURSO_DATABASE_URL";
const TOKEN_KEY = "SIMPLAY_DB_TURSO_AUTH_TOKEN";
const sampleUrl = "libsql://database.example.invalid";
const fakeToken = "test-only-not-a-turso-credential";
const pair = { [URL_KEY]: sampleUrl, [TOKEN_KEY]: fakeToken };

function configError(...names: string[]) {
  return (error: unknown) => {
    assert.ok(error instanceof DatabaseConfigError);
    for (const name of names) assert.ok(error.message.includes(name));
    assert.ok(!error.message.includes(fakeToken));
    assert.ok(!error.message.includes("example.invalid"));
    return true;
  };
}

async function nonexistentFile(t: TestContext) {
  const dir = await mkdtemp(join(tmpdir(), "simplayz-db-config-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return join(dir, "must-not-create", "simplayz.sqlite");
}

test("local SQLite uses DATABASE_PATH, the old file-path alias, or the existing default", () => {
  assert.deepEqual(resolveDatabaseConfig({}), { kind: "sqlite", path: ".data/simplayz.sqlite" });
  assert.deepEqual(resolveDatabaseConfig({ [URL_KEY]: "", [TOKEN_KEY]: "" }), resolveDatabaseConfig({}));
  assert.deepEqual(resolveDatabaseConfig({ SIMPLAY_DB_URL: "prior-save.db" }), { kind: "sqlite", path: "prior-save.db" });
  assert.deepEqual(resolveDatabaseConfig({ DATABASE_PATH: "chosen.sqlite", SIMPLAY_DB_URL: "prior-save.db" }), { kind: "sqlite", path: "chosen.sqlite" });
  assert.throws(() => resolveDatabaseConfig({ SIMPLAY_DB_URL: sampleUrl }), configError("SIMPLAY_DB_URL"));
});

test("a Turso pair is selected before a local path, on or off Vercel", () => {
  const remote = { kind: "turso", url: sampleUrl, authToken: fakeToken };
  assert.deepEqual(resolveDatabaseConfig(pair), remote);
  assert.deepEqual(resolveDatabaseConfig({ ...pair, VERCEL: "1", DATABASE_PATH: "ignored.sqlite" }), remote);
  assert.deepEqual(resolveDatabaseConfig({ ...pair, [URL_KEY]: " https://database.example.invalid/ " }), {
    ...remote, url: "https://database.example.invalid/",
  });
});

test("partial, malformed, and missing Vercel configuration fail without printing values", () => {
  for (const VERCEL of [undefined, "1"]) {
    assert.throws(() => resolveDatabaseConfig({ VERCEL, [URL_KEY]: sampleUrl }), configError(TOKEN_KEY));
    assert.throws(() => resolveDatabaseConfig({ VERCEL, [TOKEN_KEY]: fakeToken }), configError(URL_KEY));
  }
  assert.throws(() => resolveDatabaseConfig({ VERCEL: "1", DATABASE_PATH: "offline.sqlite" }), configError(URL_KEY, TOKEN_KEY));
  assert.throws(() => resolveDatabaseConfig({ ...pair, [TOKEN_KEY]: "  " }), configError(TOKEN_KEY));
  assert.throws(() => resolveDatabaseConfig({ ...pair, [TOKEN_KEY]: "not a token" }), configError(TOKEN_KEY));
  for (const invalid of ["unparseable", "file:/private.db", "http://database.example.invalid", "libsql:///missing-host",
    "libsql://database.example.invalid?tls=0", "https://database.example.invalid/subpath",
    "libsql://database.example.invalid:70000", "libsql://database%00.example.invalid",
    `https://${fakeToken}@database.example.invalid`, "https://database.example.invalid/#fragment"]) {
    assert.throws(() => resolveDatabaseConfig({ ...pair, [URL_KEY]: invalid }), configError(URL_KEY));
  }
});

test("an unavailable Turso connection uses HTTP with no caching and never opens SQLite", async (t) => {
  const path = await nonexistentFile(t);
  const attempts: Request[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    attempts.push(new Request(input, init));
    return new Response(null, { status: 503 });
  });
  assert.throws(() => openConfiguredDatabase({ [URL_KEY]: sampleUrl, DATABASE_PATH: path }), configError(TOKEN_KEY));
  const connection = openConfiguredDatabase({ ...pair, DATABASE_PATH: path });
  try {
    assert.equal(connection.kind, "turso");
    await assert.rejects(connection.client.execute("SELECT 1"));
    assert.ok(attempts.length > 0);
    for (const request of attempts) {
      assert.equal(new URL(request.url).origin, "https://database.example.invalid");
      assert.equal(request.headers.get("authorization"), `Bearer ${fakeToken}`);
      assert.equal(request.cache, "no-store");
    }
    await assert.rejects(access(dirname(path)), { code: "ENOENT" });
  } finally {
    connection.client.close();
  }
});

test("database setup and Alex provisioning share fail-closed configuration", async (t) => {
  const path = await nonexistentFile(t);
  for (const args of [["scripts/db.ts", "setup"], ["scripts/auth-alex.ts", "--stdin"]]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", ...args], {
      encoding: "utf8",
      timeout: 15_000,
      input: "Disposable test passphrase\n",
      env: { ...process.env, VERCEL: "1", DATABASE_PATH: path, [URL_KEY]: "", [TOKEN_KEY]: fakeToken },
    });
    assert.equal(result.status, 1, result.error?.message);
    assert.match(result.stderr, new RegExp(URL_KEY));
    assert.doesNotMatch(result.stderr, new RegExp(fakeToken));
  }
  await assert.rejects(access(dirname(path)), { code: "ENOENT" });
});
