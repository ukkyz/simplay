import { z } from "zod";
import type { WorldState } from "../lib/types";
import { botId, botStatus, entityId, provider, responseFormat, roomType } from "../lib/world-commands";

const text = z.string();
const number = z.number();
const positive = z.number().positive();
const coordinates = z.object({ lat: number.min(-90).max(90), lng: number.min(-180).max(180) });
const color = z.string().regex(/^#[a-f\d]{6}$/i);
const footprint = z.object({ x: number, y: number, w: positive, h: positive });
const staff = z.object({
  name: text, initials: text, role: z.enum(["Guard", "Receptionist"]), shift: text,
  status: z.enum(["on-duty", "handoff", "off-duty"]),
});
const room = footprint.extend({
  id: entityId, name: text, type: roomType, area: positive,
  status: z.enum(["live", "ready", "setup"]), occupants: number.nonnegative(), staff: text.optional(),
});
const building = z.object({
  id: entityId, name: text, category: text, description: text, level: number,
  accent: color, accentSoft: color, roof: color, plan: footprint, guard: staff, receptionist: staff,
  metrics: z.object({ efficiency: number, power: number, water: number, footfall: number }),
  rooms: z.array(room).max(1000),
});
const area = z.object({
  id: entityId, name: text, city: text, country: text, district: text, coordinates,
  zoom: number, polygon: z.array(coordinates), level: number, xp: number, xpNext: positive,
  residents: number, happiness: number, income: number, energy: number, lotCode: text,
  accent: color, accentSoft: color, description: text, buildings: z.array(building).max(1000),
});
const bot = z.object({
  id: botId, name: text, role: z.enum(["CTO", "CFO", "COO"]), title: text, tagline: text,
  provider, model: entityId, temperature: number.min(0).max(1.2), systemPrompt: text,
  promptVersion: z.string().regex(/^v\d{1,6}\.\d{1,6}$/), status: botStatus, task: text,
  tokensToday: number, monthlySpend: number, accent: color, accentSoft: color, responseFormat,
});

// The previous app stored the WorldState object, not the profile or presence data.
export const legacyWorldSchema: z.ZodType<WorldState> = z.object({
  areas: z.array(area).min(1).max(100),
  bots: z.array(bot).length(3),
  activity: z.array(z.object({
    id: entityId, bot: z.enum(["cto", "cfo", "coo", "system"]), title: text, detail: text, time: text,
    tone: z.enum(["lime", "sky", "coral", "neutral"]),
  })).max(1000),
  budget: z.object({ monthly: positive, used: number, tokenCap: positive, tokenUsed: number }),
  routingRules: z.object({ fallback: z.boolean(), costGuard: z.boolean(), requireApproval: z.boolean() }),
});
