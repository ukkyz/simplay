import { and, desc, eq } from "drizzle-orm";
import type { Area, Building, PlayerSnapshot, WorldState } from "../lib/types";
import type { Database } from "./client";
import { DEMO_PLAYER, DEMO_PRESENCE, DEMO_WORLD } from "./fixtures";
import { legacyWorldSchema } from "./legacy";
import { activity, areas, bots, buildings, playerPresence, players, rooms } from "./schema";

export type WriteTx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export class WorldError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function readPlayer(db: Database, playerId: string): Promise<PlayerSnapshot> {
  // Sequential SQL in a single read transaction: no mixed snapshots mid-write.
  const [[owner], presenceRows, areaRows, buildingRows, roomRows, botRows, activityRows] = await db.batch([
    db.select().from(players).where(eq(players.id, playerId)),
    db.select().from(playerPresence).where(eq(playerPresence.playerId, playerId)).orderBy(playerPresence.position),
    db.select().from(areas).where(eq(areas.playerId, playerId)).orderBy(areas.position),
    db.select().from(buildings).where(eq(buildings.playerId, playerId)).orderBy(buildings.position),
    db.select().from(rooms).where(eq(rooms.playerId, playerId)).orderBy(rooms.position),
    db.select().from(bots).where(eq(bots.playerId, playerId)).orderBy(bots.position),
    db.select().from(activity).where(eq(activity.playerId, playerId)).orderBy(desc(activity.sequence)).limit(12),
  ]);
  if (!owner) throw new WorldError(503, "The demo world has not been seeded yet.");

  const playerAreas = new Map<string, Area>();
  const sites = new Map<string, Map<string, Building>>();
  for (const row of areaRows) {
    playerAreas.set(row.id, { id: row.id, ...row.data, buildings: [] });
    sites.set(row.id, new Map());
  }
  for (const row of buildingRows) {
    const building: Building = { id: row.id, ...row.data, rooms: [] };
    playerAreas.get(row.areaId)?.buildings.push(building);
    sites.get(row.areaId)?.set(row.id, building);
  }
  for (const row of roomRows) {
    sites.get(row.areaId)?.get(row.buildingId)?.rooms.push({ id: row.id, ...row.data });
  }
  const { budget, routingRules, revision, ...player } = owner;
  return {
    player,
    revision,
    presence: presenceRows.map(({ id, data }) => ({ id, ...data })),
    world: {
      areas: [...playerAreas.values()],
      bots: botRows.map(({ id, data }) => ({ id, ...data })),
      activity: activityRows.map(({ id, data }) => ({ id, ...data })),
      routingRules,
      budget,
    },
  };
}

export async function insertBuilding(tx: WriteTx, playerId: string, areaId: string, position: number, building: Building) {
  const { id, rooms: layout, ...data } = building;
  await tx.insert(buildings).values({ playerId, areaId, id, position, data });
  if (layout.length) {
    await tx.insert(rooms).values(layout.map(({ id: roomId, ...data }, position) => ({
      playerId, areaId, buildingId: id, id: roomId, position, data,
    })));
  }
}

async function insertWorld(tx: WriteTx, playerId: string, world: WorldState) {
  for (const [position, area] of world.areas.entries()) {
    const { id, buildings, ...data } = area;
    await tx.insert(areas).values({ playerId, id, position, data });
    for (const [index, building] of buildings.entries()) {
      await insertBuilding(tx, playerId, id, index, building);
    }
  }
  await tx.insert(bots).values(world.bots.map(({ id, ...data }, position) => ({ playerId, id, position, data })));
  if (world.activity.length) {
    // Insert oldest-first so sorting by sequence desc restores display order.
    await tx.insert(activity).values([...world.activity].reverse().map(({ id, ...data }) => ({ playerId, id, data })));
  }
}

export async function seedDemo(db: Database) {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(players).values({
      ...DEMO_PLAYER,
      budget: DEMO_WORLD.budget,
      routingRules: DEMO_WORLD.routingRules,
    }).onConflictDoNothing({ target: players.id }).returning({ id: players.id });
    if (!created) return false;

    await tx.insert(playerPresence).values(DEMO_PRESENCE.map(({ id, ...data }, position) => ({
      playerId: created.id, id, position, data,
    })));
    await insertWorld(tx, created.id, DEMO_WORLD);
    return true;
  });
}

export async function replaceWorld(tx: WriteTx, playerId: string, world: WorldState) {
  await tx.delete(areas).where(eq(areas.playerId, playerId)); // Cascades through buildings and rooms.
  await tx.delete(bots).where(eq(bots.playerId, playerId));
  await tx.delete(activity).where(eq(activity.playerId, playerId));
  await tx.update(players).set({ budget: world.budget, routingRules: world.routingRules }).where(eq(players.id, playerId));
  await insertWorld(tx, playerId, world);
}

export async function importLegacyWorld(db: Database, input: unknown) {
  const world = legacyWorldSchema.parse(input);
  await db.transaction(async (tx) => {
    // The CLI may import only into a seeded world that has never been edited.
    const [claimed] = await tx.update(players).set({ revision: 1 })
      .where(and(eq(players.id, DEMO_PLAYER.id), eq(players.revision, 0)))
      .returning({ id: players.id });
    if (!claimed) throw new WorldError(409, "Legacy import requires a freshly seeded, unedited world; no saved data was overwritten.");
    await replaceWorld(tx, claimed.id, world);
  });
}
