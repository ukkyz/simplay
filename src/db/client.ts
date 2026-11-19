import { createClient } from "@libsql/client/sqlite3";
import { drizzle } from "drizzle-orm/libsql/sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function databasePath() {
  // This is runtime data on a writable volume, not a deployable asset.
  return resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH || ".data/simplayz.sqlite");
}

export function openDatabase(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  const client = createClient({ url: pathToFileURL(path).href, timeout: 2000 });
  return { client, db: drizzle({ client }) };
}

export type Database = ReturnType<typeof openDatabase>["db"];
