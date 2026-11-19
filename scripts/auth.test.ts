import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { allowAuthAttempt, AuthError, createAlexAccount, findSessionAccount, loginAccount, registerAccount, revokeSession } from "../src/auth/repository";
import { loginInput, registrationInput } from "../src/auth/validation";
import { openDatabase } from "../src/db/client";
import { accounts, authSessions } from "../src/db/schema";
import { createWorldRepository } from "../src/db/world-repository";
import { seedDemo } from "../src/db/world-storage";

async function setup(t: TestContext, initialOnly = false) {
  const dir = await mkdtemp(join(tmpdir(), "simplayz-auth-test-"));
  const path = join(dir, "simplayz.sqlite");
  const { client, db } = openDatabase(path);
  t.after(async () => {
    client.close();
    await rm(dir, { recursive: true, force: true });
  });
  await client.execute("PRAGMA journal_mode = WAL");
  let migrationsFolder = "./drizzle";
  if (initialOnly) {
    migrationsFolder = join(dir, "initial-migration");
    await mkdir(join(migrationsFolder, "meta"), { recursive: true });
    const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
    await writeFile(join(migrationsFolder, "meta/_journal.json"), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 1) }));
    await copyFile("drizzle/0000_initial.sql", join(migrationsFolder, "0000_initial.sql"));
  }
  await migrate(db, { migrationsFolder });
  await seedDemo(db);
  return { db, path, world: createWorldRepository(db) };
}

const password = () => `Simplayz test only ${randomBytes(18).toString("hex")}`;
const hasStatus = (status: number) => (error: unknown) => error instanceof AuthError && error.status === status;

test("username validation is case-insensitive and new passwords have a length bound", () => {
  const passphrase = password();
  assert.deepEqual(registrationInput.parse({ username: "  Harbor_Builder-6  ", password: passphrase }), {
    username: "harbor_builder-6", password: passphrase,
  });
  for (const username of ["ab", "a".repeat(25), "-user", "user name", "user/path", "Kay", "<alex>"]) {
    assert.equal(registrationInput.safeParse({ username, password: passphrase }).success, false, username);
  }
  for (const candidate of ["x".repeat(11), "x".repeat(129)]) {
    assert.equal(registrationInput.safeParse({ username: "user", password: candidate }).success, false);
  }
});

test("registration stores distinct salted hashes and only hashed session tokens", async (t) => {
  const { db, world } = await setup(t);
  const initial = await world.read();
  const passphrase = password();
  const [first, second] = await Promise.all([
    registerAccount(db, registrationInput.parse({ username: "Planner", password: passphrase })),
    registerAccount(db, registrationInput.parse({ username: "Editor", password: passphrase })),
  ]);
  const storedAccounts = await db.select().from(accounts);
  assert.equal(storedAccounts.length, 2);
  assert.equal(new Set(storedAccounts.map(({ passwordHash }) => passwordHash)).size, 2);
  for (const row of storedAccounts) {
    assert.match(row.passwordHash, /^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    assert.equal(row.ownedPlayerId, null);
  }
  const sessions = await db.select().from(authSessions);
  assert.deepEqual(new Set(sessions.map(({ tokenHash }) => tokenHash)), new Set(
    [first, second].map(({ token }) => createHash("sha256").update(token).digest("hex")),
  ));
  assert.deepEqual(await findSessionAccount(db, first.token), { username: "planner", ownsWorld: false });
  await assert.rejects(registerAccount(db, registrationInput.parse({ username: "PLANNER", password: password() })), hasStatus(409));
  assert.equal((await db.select().from(authSessions)).length, 2);
  assert.deepEqual(await world.read(), initial);
});

test("login denies unknown or incorrect credentials, rotates sessions, and keeps them valid across connections", async (t) => {
  const { db, path } = await setup(t);
  const passphrase = password();
  const credentials = registrationInput.parse({ username: "CrewLead", password: passphrase });
  const registered = await registerAccount(db, credentials);
  for (const invalid of [{ username: "missing", password: passphrase }, { ...credentials, password: "incorrect" }]) {
    await assert.rejects(loginAccount(db, invalid), { message: "Incorrect username or password." });
  }
  const otherDevice = await loginAccount(db, credentials);
  const login = await loginAccount(db, loginInput.parse({ username: "CREWLEAD", password: passphrase }), registered.token);
  assert.notEqual(login.token, registered.token);
  assert.equal(await findSessionAccount(db, registered.token), null);
  assert.equal(await findSessionAccount(db, "arbitrary-token"), null);
  assert.equal(await findSessionAccount(db, login.token, login.expiresAt), null);
  const reopened = openDatabase(path);
  try {
    assert.deepEqual(await findSessionAccount(reopened.db, login.token), { username: "crewlead", ownsWorld: false });
    await revokeSession(reopened.db, login.token);
  } finally {
    reopened.client.close();
  }
  assert.equal(await findSessionAccount(db, login.token), null);
  assert.equal((await findSessionAccount(db, otherDevice.token))?.username, "crewlead");
});

test("auth migration and local Alex provisioning preserve an edited save", async (t) => {
  const { db, world } = await setup(t, true);
  await world.execute({ type: "add-building", areaId: "delfshaven-yard", name: "Existing Alex Workshop", category: "workshop" });
  const edited = await world.read();
  await migrate(db, { migrationsFolder: "./drizzle" });
  assert.deepEqual(await db.select().from(accounts), []);
  assert.equal(await seedDemo(db), false);
  await assert.rejects(registerAccount(db, registrationInput.parse({ username: "ALeX", password: password() })), hasStatus(409));
  await assert.rejects(createAlexAccount(db, "short"), hasStatus(400));

  const passphrase = password();
  await createAlexAccount(db, passphrase);
  await assert.rejects(createAlexAccount(db, password()), hasStatus(409));
  const [owner] = await db.select().from(accounts);
  assert.equal(owner.ownedPlayerId, "alex");
  const signedIn = await loginAccount(db, { username: "alex", password: passphrase });
  assert.deepEqual(await findSessionAccount(db, signedIn.token), { username: "alex", ownsWorld: true });
  assert.deepEqual(await world.read(), edited);
});

test("login and registration attempts are throttled atomically and reset after the window", async (t) => {
  const { db } = await setup(t);
  const now = Date.now();
  const results = await Promise.all(Array.from({ length: 11 }, () => allowAuthAttempt(db, "login", "alex", now)));
  assert.equal(results.filter(Boolean).length, 10);
  assert.equal(await allowAuthAttempt(db, "login", "other", now), true);
  assert.equal(await allowAuthAttempt(db, "register", "alex", now), true);
  for (let i = 0; i < 29; i++) assert.equal(await allowAuthAttempt(db, "register", `crew-${i}`, now), true);
  assert.equal(await allowAuthAttempt(db, "register", "extra", now), false);
  assert.equal(await allowAuthAttempt(db, "register", "extra", now + 60_000), true);
  assert.equal(await allowAuthAttempt(db, "login", "alex", now + 15 * 60_000), true);
});
