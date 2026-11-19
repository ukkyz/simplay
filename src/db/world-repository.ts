import { and, count, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { MODELS, PROVIDERS } from "../lib/data";
import type { ActivityEntry, Building } from "../lib/types";
import type { WorldCommand, WorldCommandResult } from "../lib/world-commands";
import { BUILDING_CATEGORIES, BUILDING_SLOTS, maxCarvedArea, splitFootprint } from "../lib/world-rules";
import { getDatabase, writeDatabase, type Database } from "./client";
import { DEMO_PLAYER, DEMO_WORLD } from "./fixtures";
import { activity, areas, bots, buildings, players, rooms } from "./schema";
import { insertBuilding, readPlayer, replaceWorld, WorldError, type WriteTx } from "./world-storage";

const playerId = DEMO_PLAYER.id;
const playerKey = eq(players.id, playerId);

function starterBuilding(id: string, name: string, categoryId: string, position: number): Building {
  const category = BUILDING_CATEGORIES.find((option) => option.id === categoryId)!;
  return {
    id, name, category: category.label, level: 1,
    accent: category.accent, accentSoft: category.soft, roof: category.roof,
    description: "A freshly surveyed building site. Your AI crew has staged the minimum viable layout — the interior is ready for the first edit pass.",
    plan: BUILDING_SLOTS[position % BUILDING_SLOTS.length],
    rooms: [
      { id: `${id}-welcome`, name: "Welcome Desk", type: "lobby", area: 28, x: 0, y: 0, w: 6, h: 5, status: "setup", occupants: 0 },
      { id: `${id}-main`, name: "Main Floor", type: "workspace", area: 88, x: 6, y: 0, w: 9, h: 9, status: "setup", occupants: 0 },
      { id: `${id}-focus`, name: "Focus Room", type: "focus", area: 22, x: 15, y: 0, w: 5, h: 9, status: "setup", occupants: 0 },
      { id: `${id}-social`, name: "Common Room", type: "social", area: 46, x: 0, y: 5, w: 6, h: 9, status: "setup", occupants: 0 },
      { id: `${id}-green`, name: "Green Corner", type: "garden", area: 60, x: 6, y: 9, w: 14, h: 5, status: "setup", occupants: 0 },
    ],
    guard: { name: "Rune Vale", initials: "RV", role: "Guard", shift: "18:00 – 02:00", status: "handoff" },
    receptionist: { name: "Tess Marlow", initials: "TM", role: "Receptionist", shift: "08:00 – 16:00", status: "on-duty" },
    metrics: { efficiency: 64, power: 42, water: 37, footfall: 18 },
  };
}

async function logActivity(tx: WriteTx, entry: Omit<ActivityEntry, "id" | "time">) {
  await tx.insert(activity).values({ playerId, id: randomUUID(), data: { ...entry, time: "Just now" } });
}

async function apply(tx: WriteTx, command: WorldCommand): Promise<string | undefined> {
  switch (command.type) {
    case "add-building": {
      const [area] = await tx.select().from(areas).where(and(eq(areas.playerId, playerId), eq(areas.id, command.areaId)));
      if (!area) throw new WorldError(404, "That area is no longer available.");
      const [{ total }] = await tx.select({ total: count() }).from(buildings)
        .where(and(eq(buildings.playerId, playerId), eq(buildings.areaId, area.id)));
      const slug = command.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
      const id = `${slug}-${randomUUID()}`;
      await insertBuilding(tx, playerId, area.id, total, starterBuilding(id, command.name, command.category, total));
      await logActivity(tx, {
        bot: "cto", title: "Building site provisioned",
        detail: `${command.name} added to ${area.data.name} with 5 starter rooms`, tone: "coral",
      });
      return id;
    }
    case "split-room": {
      const siteKey = and(eq(buildings.playerId, playerId), eq(buildings.areaId, command.areaId), eq(buildings.id, command.buildingId));
      const roomScope = and(eq(rooms.playerId, playerId), eq(rooms.areaId, command.areaId), eq(rooms.buildingId, command.buildingId));
      const sourceKey = and(roomScope, eq(rooms.id, command.sourceRoomId));
      const [building] = await tx.select().from(buildings).where(siteKey);
      const [sourceRow] = await tx.select().from(rooms).where(sourceKey);
      if (!building || !sourceRow) throw new WorldError(404, "That building or source room is no longer available.");
      const source = { id: sourceRow.id, ...sourceRow.data };
      const split = splitFootprint(source);
      if (!split || command.area > maxCarvedArea(source)) {
        throw new WorldError(409, "The source room is too small for this split. Refresh the plan or choose a smaller floor area.");
      }
      const [{ total }] = await tx.select({ total: count() }).from(rooms).where(roomScope);
      const id = `room-${randomUUID()}`;
      await tx.update(rooms).set({ data: { ...sourceRow.data, ...split.rest, area: source.area - command.area } }).where(sourceKey);
      await tx.insert(rooms).values({
        playerId, areaId: command.areaId, buildingId: command.buildingId, id, position: total,
        data: { ...split.created, name: command.name, area: command.area, type: command.roomType, status: "ready", occupants: 0 },
      });
      await logActivity(tx, {
        bot: "coo", title: "Room added to building",
        detail: `${command.name} carved from ${source.name} · ${building.data.name}`, tone: "lime",
      });
      return id;
    }
    case "save-bot":
    case "set-bot-status": {
      const botKey = and(eq(bots.playerId, playerId), eq(bots.id, command.botId));
      const [bot] = await tx.select().from(bots).where(botKey);
      if (!bot) throw new WorldError(404, "That bot is no longer available.");
      if (command.type === "save-bot") {
        const { provider, model, systemPrompt, temperature } = command.settings;
        const selected = MODELS.find((entry) => entry.id === model && entry.provider === provider);
        if (!selected) throw new WorldError(422, "Choose a model supported by the selected provider.");
        const [major, minor] = bot.data.promptVersion.slice(1).split(".").map(Number);
        const promptVersion = systemPrompt === bot.data.systemPrompt ? bot.data.promptVersion : `v${major}.${minor + 1}`;
        await tx.update(bots).set({ data: { ...bot.data, ...command.settings, promptVersion } }).where(botKey);
        await logActivity(tx, {
          bot: bot.id, title: "Model route updated",
          detail: `${bot.data.name} configured for ${selected.name} on ${PROVIDERS.find((entry) => entry.id === provider)?.name} · temp ${temperature.toFixed(1)}`,
          tone: bot.id === "cto" ? "coral" : bot.id === "cfo" ? "sky" : "lime",
        });
      } else if (bot.data.status !== command.status) {
        await tx.update(bots).set({ data: { ...bot.data, status: command.status } }).where(botKey);
        await logActivity(tx, {
          bot: bot.id, title: command.status === "paused" ? "Bot paused" : "Bot resumed",
          detail: `${bot.data.name} · model route unchanged.`, tone: "neutral",
        });
      }
      break;
    }
    case "set-rule": {
      const [player] = await tx.select({ rules: players.routingRules }).from(players).where(playerKey);
      await tx.update(players).set({ routingRules: { ...player.rules, [command.key]: command.checked } }).where(playerKey);
      break;
    }
    case "deploy-crew":
      await logActivity(tx, {
        bot: "system", title: "Crew configuration deployed",
        detail: "Demo configuration recorded. No model call was made.", tone: "neutral",
      });
      break;
    case "reset":
      await replaceWorld(tx, playerId, DEMO_WORLD);
      break;
  }
}

export function createWorldRepository(db: Database) {
  const read = () => readPlayer(db, playerId);
  return {
    read,
    execute(command: WorldCommand): Promise<WorldCommandResult> {
      return writeDatabase(db, async () => {
        const createdId = await db.transaction(async (tx) => {
          const [player] = await tx.update(players).set({ revision: sql`${players.revision} + 1` })
            .where(playerKey).returning({ id: players.id });
          if (!player) throw new WorldError(503, "The demo world has not been seeded yet.");
          return apply(tx, command);
        });
        return { snapshot: await read(), createdId };
      });
    },
  };
}

let repository: ReturnType<typeof createWorldRepository> | undefined;
export function getWorldRepository() {
  return (repository ??= createWorldRepository(getDatabase()));
}
