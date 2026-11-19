import { createClient } from "@libsql/client/sqlite3";
import { drizzle } from "drizzle-orm/libsql/sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function databasePath() {
  // This is runtime data on a writable volume, not a deployable asset.
  return resolve(/*turbopackIgnore: true*/ process.env.SIMPLAY_DB_URL || ".data/simplayz.sqlite");
}

export function openDatabase(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  const client = createClient({ url: pathToFileURL(path).href, timeout: 2000 });
  return { client, db: drizzle({ client }) };
}

export type Database = ReturnType<typeof openDatabase>["db"];

// Next can load the DB module from different route bundles in the same process.
const processGlobals = globalThis as typeof globalThis & {
  simplayzDatabase?: Database;
  simplayzWriters?: WeakMap<Database, Promise<void>>;
};
export function getDatabase() {
  return (processGlobals.simplayzDatabase ??= openDatabase(databasePath()).db);
}

const writers = (processGlobals.simplayzWriters ??= new WeakMap());

// Auth and world edits use the same queue so a synchronous SQLite lock wait
// cannot block another transaction in this Node process from committing.
export function writeDatabase<T>(db: Database, work: () => Promise<T>): Promise<T> {
  const result = (writers.get(db) ?? Promise.resolve()).then(work);
  writers.set(db, result.then(() => undefined, () => undefined));
  return result;
}
