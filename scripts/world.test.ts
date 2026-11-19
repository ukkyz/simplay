import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { openDatabase } from "../src/db/client";
import { DEMO_PLAYER, DEMO_PRESENCE, DEMO_WORLD } from "../src/db/fixtures";
import { createWorldRepository } from "../src/db/world-repository";
import { importLegacyWorld, seedDemo, WorldError } from "../src/db/world-storage";
import { worldCommand, type BotSettings } from "../src/lib/world-commands";

async function setup(t: TestContext) {
  const dir = await mkdtemp(join(tmpdir(), "simplayz-db-test-"));
  const path = join(dir, "simplayz.sqlite");
  const connection = openDatabase(path);
  t.after(async () => {
    connection.client.close();
    await rm(dir, { recursive: true, force: true });
  });
  await connection.client.execute("PRAGMA journal_mode = WAL");
  await migrate(connection.db, { migrationsFolder: "./drizzle" });
  assert.equal(await seedDemo(connection.db), true);
  return { ...connection, path, world: createWorldRepository(connection.db) };
}

const initialWorld = JSON.parse(JSON.stringify(DEMO_WORLD));
const areaId = "delfshaven-yard";
const botSettings: BotSettings = {
  provider: "openai", model: "gpt-5", temperature: 0.6, responseFormat: "Table",
  systemPrompt: "A saved version of the technical director's prompt for this SQLite test.",
};

test("migrates and seeds the complete player world idempotently into a SQLite file", async (t) => {
  const { db, path, world } = await setup(t);
  await migrate(db, { migrationsFolder: "./drizzle" });
  assert.equal(await seedDemo(db), false);
  const snapshot = await world.read();
  assert.deepEqual(snapshot.player, DEMO_PLAYER);
  assert.deepEqual(snapshot.presence, DEMO_PRESENCE);
  assert.deepEqual(snapshot.world, initialWorld);
  assert.equal(snapshot.revision, 0);
  assert.equal((await readFile(path)).subarray(0, 16).toString(), "SQLite format 3\0");
});

test("layout, bot, routing, and activity edits survive reopening and re-seeding the database", async (t) => {
  const { world, path, client } = await setup(t);
  const site = await world.execute({ type: "add-building", areaId, name: "Test workshop", category: "workshop" });
  assert.ok(site.createdId);
  const buildingId = site.createdId;
  const [split] = await Promise.all([
    world.execute({ type: "split-room", areaId, buildingId, sourceRoomId: `${buildingId}-main`, name: "Quiet office", roomType: "focus", area: 24 }),
    world.execute({ type: "set-rule", key: "requireApproval", checked: true }),
  ]);
  assert.ok(split.createdId);
  await world.execute({ type: "save-bot", botId: "cto", settings: botSettings });
  await world.execute({ type: "set-bot-status", botId: "cto", status: "paused" });
  await world.execute({ type: "deploy-crew" });
  client.close();

  const reopened = openDatabase(path);
  const snapshot = await (async () => {
    try {
      assert.equal(await seedDemo(reopened.db), false);
      return await createWorldRepository(reopened.db).read();
    } finally {
      reopened.client.close();
    }
  })();
  assert.equal(snapshot.revision, 6);
  assert.deepEqual(snapshot.player, DEMO_PLAYER);
  assert.deepEqual(snapshot.presence, DEMO_PRESENCE);
  assert.deepEqual(snapshot.world.budget, DEMO_WORLD.budget);
  assert.equal(snapshot.world.routingRules.requireApproval, true);
  assert.equal(snapshot.world.activity[0].title, "Crew configuration deployed");
  assert.equal(snapshot.world.activity[1].title, "Bot paused");
  const saved = snapshot.world.bots.find(({ id }) => id === "cto")!;
  assert.deepEqual(saved, { ...DEMO_WORLD.bots[0], ...botSettings, promptVersion: "v3.3", status: "paused" });
  const building = snapshot.world.areas.find(({ id }) => id === areaId)?.buildings.find(({ id }) => id === buildingId);
  assert.ok(building);
  assert.equal(building.rooms.length, 6);
  assert.equal(building.rooms.find(({ id }) => id === `${buildingId}-main`)?.area, 64);
  assert.equal(building.rooms.find(({ id }) => id === split.createdId)?.area, 24);
  assert.equal(building.guard.role, "Guard");
  assert.equal(building.receptionist.role, "Receptionist");
});

test("invalid commands cannot overwrite player data or advance the revision", async (t) => {
  const { world } = await setup(t);
  const initial = await world.read();
  assert.equal(worldCommand.safeParse({ type: "reset", playerId: "someone-else" }).success, false);
  await assert.rejects(world.execute({ type: "save-bot", botId: "cto", settings: { ...botSettings, provider: "google" } }),
    (error) => error instanceof WorldError && error.status === 422);
  await assert.rejects(world.execute({
    type: "split-room", areaId, buildingId: "foundry-hall", sourceRoomId: "makers", name: "Too large", roomType: "focus", area: 180,
  }), (error) => error instanceof WorldError && error.status === 409);
  await assert.rejects(world.execute({ type: "add-building", areaId: "missing", name: "Unknown area", category: "studio" }),
    (error) => error instanceof WorldError && error.status === 404);
  assert.deepEqual(await world.read(), initial);
});

test("changing settings without editing prompt text preserves the prompt version", async (t) => {
  const { world } = await setup(t);
  const original = DEMO_WORLD.bots[0];
  const result = await world.execute({ type: "save-bot", botId: "cto", settings: { ...botSettings, systemPrompt: original.systemPrompt } });
  assert.equal(result.snapshot.world.bots[0].promptVersion, original.promptVersion);
  assert.equal(result.snapshot.world.bots[0].responseFormat, "Table");
});

test("legacy imports preserve existing saves and are allowed only before the first edit", async (t) => {
  const { db, world } = await setup(t);
  await assert.rejects(importLegacyWorld(db, { areas: [] }));
  const duplicate = structuredClone(DEMO_WORLD);
  duplicate.areas.push(duplicate.areas[0]);
  await assert.rejects(importLegacyWorld(db, duplicate)); // SQL failure rolls back the whole import.
  assert.equal((await world.read()).revision, 0);
  assert.deepEqual((await world.read()).world, initialWorld);

  const legacy = structuredClone(DEMO_WORLD);
  legacy.areas[0].buildings[0].rooms[0].name = "Imported reception";
  legacy.bots[0].systemPrompt = botSettings.systemPrompt;
  await importLegacyWorld(db, legacy);
  assert.equal(await seedDemo(db), false);
  await assert.rejects(importLegacyWorld(db, initialWorld), /unedited world/);
  assert.deepEqual((await world.read()).world, JSON.parse(JSON.stringify(legacy)));
});

test("the confirmed reset restores seed rows without reopening legacy import", async (t) => {
  const { db, world } = await setup(t);
  await world.execute({ type: "add-building", areaId, name: "Disposable site", category: "studio" });
  const { snapshot } = await world.execute({ type: "reset" });
  assert.deepEqual(snapshot.world, initialWorld);
  assert.equal(snapshot.revision, 2);
  await assert.rejects(importLegacyWorld(db, initialWorld), /unedited world/);
});
