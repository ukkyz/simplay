import { z } from "zod";
import type { PlayerSnapshot } from "./types";
import { BUILDING_CATEGORIES, MAX_ROOM_AREA, MIN_ROOM_AREA } from "./world-rules";

export const entityId = z.string().max(100).regex(/^[a-z0-9][a-z0-9_-]*$|^-[a-z0-9]+$/);
export const roomType = z.enum(["lobby", "workspace", "security", "social", "focus", "garden", "meeting"]);
export const botId = z.enum(["cto", "cfo", "coo"]);
export const provider = z.enum(["openai", "anthropic", "google", "xai", "mistral", "groq", "local"]);
export const responseFormat = z.enum(["Structured JSON", "Markdown brief", "Table"]);
export const botStatus = z.enum(["online", "paused"]);
export const botSettings = z.strictObject({
  provider,
  model: entityId,
  temperature: z.number().min(0).max(1.2),
  systemPrompt: z.string().trim().min(40).max(20_000),
  responseFormat,
});

const name = z.string().trim().min(2);
export const worldCommand = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("add-building"),
    areaId: entityId,
    name: name.max(36),
    category: z.enum(BUILDING_CATEGORIES.map((entry) => entry.id)),
  }),
  z.strictObject({
    type: z.literal("split-room"),
    areaId: entityId,
    buildingId: entityId,
    sourceRoomId: entityId,
    name: name.max(30),
    roomType,
    area: z.number().min(MIN_ROOM_AREA).max(MAX_ROOM_AREA),
  }),
  z.strictObject({ type: z.literal("save-bot"), botId, settings: botSettings }),
  z.strictObject({ type: z.literal("set-bot-status"), botId, status: botStatus }),
  z.strictObject({
    type: z.literal("set-rule"),
    key: z.enum(["fallback", "costGuard", "requireApproval"]),
    checked: z.boolean(),
  }),
  z.strictObject({ type: z.literal("deploy-crew") }),
  z.strictObject({ type: z.literal("reset") }),
]);

export type WorldCommand = z.infer<typeof worldCommand>;
export type BotSettings = z.infer<typeof botSettings>;

export interface WorldCommandResult {
  snapshot: PlayerSnapshot;
  createdId?: string;
}
