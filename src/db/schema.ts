import { foreignKey, index, integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import type { ActivityEntry, Area, Bot, Building, PlayerPresence, Room, WorldState } from "../lib/types";

// Keep ownership, identity and ordering queryable. JSON columns store only the
// attributes of one entity (never its children or the entire player world).
const data = <T>() => text("data", { mode: "json" }).$type<T>().notNull();
const position = () => integer("position").notNull();

export const players = sqliteTable("players", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  initials: text("initials").notNull(),
  level: integer("level").notNull(),
  title: text("title").notNull(),
  budget: text("budget", { mode: "json" }).$type<WorldState["budget"]>().notNull(),
  routingRules: text("routing_rules", { mode: "json" }).$type<WorldState["routingRules"]>().notNull(),
  revision: integer("revision").notNull().default(0),
});

export const accounts = sqliteTable("accounts", {
  username: text("username").primaryKey().notNull(),
  passwordHash: text("password_hash").notNull(),
  ownedPlayerId: text("owned_player_id").references(() => players.id, { onDelete: "set null" }).unique(),
  createdAt: integer("created_at").notNull(),
});

export const authSessions = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey().notNull(),
  username: text("username").notNull().references(() => accounts.username, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
}, (t) => [
  index("auth_sessions_username_idx").on(t.username),
  index("auth_sessions_expiry_idx").on(t.expiresAt),
]);

export const authAttempts = sqliteTable("auth_attempts", {
  key: text("key").primaryKey().notNull(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (t) => [index("auth_attempts_expiry_idx").on(t.expiresAt)]);

const playerId = () => text("player_id").notNull().references(() => players.id, { onDelete: "cascade" });

export const playerPresence = sqliteTable("player_presence", {
  playerId: playerId(),
  id: text("id").notNull(),
  position: position(),
  data: data<Omit<PlayerPresence, "id">>(),
}, (t) => [primaryKey({ columns: [t.playerId, t.id] })]);

export const areas = sqliteTable("areas", {
  playerId: playerId(),
  id: text("id").notNull(),
  position: position(),
  data: data<Omit<Area, "id" | "buildings">>(),
}, (t) => [primaryKey({ columns: [t.playerId, t.id] })]);

export const buildings = sqliteTable("buildings", {
  playerId: text("player_id").notNull(),
  areaId: text("area_id").notNull(),
  id: text("id").notNull(),
  position: position(),
  data: data<Omit<Building, "id" | "rooms">>(),
}, (t) => [
  primaryKey({ columns: [t.playerId, t.areaId, t.id] }),
  foreignKey({ columns: [t.playerId, t.areaId], foreignColumns: [areas.playerId, areas.id] }).onDelete("cascade"),
]);

export const rooms = sqliteTable("rooms", {
  playerId: text("player_id").notNull(),
  areaId: text("area_id").notNull(),
  buildingId: text("building_id").notNull(),
  id: text("id").notNull(),
  position: position(),
  data: data<Omit<Room, "id">>(),
}, (t) => [
  primaryKey({ columns: [t.playerId, t.areaId, t.buildingId, t.id] }),
  foreignKey({
    columns: [t.playerId, t.areaId, t.buildingId],
    foreignColumns: [buildings.playerId, buildings.areaId, buildings.id],
  }).onDelete("cascade"),
]);

export const bots = sqliteTable("bots", {
  playerId: playerId(),
  id: text("id").$type<Bot["id"]>().notNull(),
  position: position(),
  data: data<Omit<Bot, "id">>(),
}, (t) => [primaryKey({ columns: [t.playerId, t.id] })]);

export const activity = sqliteTable("activity", {
  sequence: integer("sequence").primaryKey({ autoIncrement: true }),
  playerId: playerId(),
  id: text("id").notNull(),
  data: data<Omit<ActivityEntry, "id">>(),
}, (t) => [
  unique().on(t.playerId, t.id),
  index("activity_player_sequence_idx").on(t.playerId, t.sequence),
]);
