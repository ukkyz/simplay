import { createClient as createTursoClient, type Client } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql/http";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveDatabaseConfig, type DatabaseEnvironment } from "./config";

const requireLocal = createRequire(import.meta.url);
const connect = (client: Client) => ({ client, db: drizzle({ client }) });

// Explicit file connections are also used by the isolated SQLite tests.
export function openDatabase(file: string) {
  // The native adapter is loaded only when using a local database.
  const { createClient } = requireLocal("@libsql/client/sqlite3") as typeof import("@libsql/client/sqlite3");
  const path = resolve(/*turbopackIgnore: true*/ file);
  mkdirSync(dirname(path), { recursive: true });
  return connect(createClient({ url: pathToFileURL(path).href, timeout: 2000 }));
}

export function openConfiguredDatabase(env?: DatabaseEnvironment) {
  const config = resolveDatabaseConfig(env);
  if (config.kind === "sqlite") return { kind: config.kind, ...openDatabase(config.path) };

  const client = createTursoClient({
    url: config.url,
    authToken: config.authToken,
    fetch(input: RequestInfo | URL, init?: RequestInit) {
      // Never let Next cache database responses, and bound hung HTTP requests.
      const parent = init?.signal ?? (input instanceof Request ? input.signal : undefined);
      const timeout = AbortSignal.timeout(10_000);
      return fetch(input, { ...init, cache: "no-store", signal: parent ? AbortSignal.any([parent, timeout]) : timeout });
    },
  });
  return { kind: config.kind, ...connect(client) };
}

export type Database = ReturnType<typeof connect>["db"];

// Next can load the DB module from different route bundles in the same process.
const processGlobals = globalThis as typeof globalThis & {
  simplayzDatabase?: Database;
  simplayzWriters?: WeakMap<Database, Promise<void>>;
};
export function getDatabase() {
  // Nothing connects or migrates at import or build time.
  return (processGlobals.simplayzDatabase ??= openConfiguredDatabase().db);
}

const writers = (processGlobals.simplayzWriters ??= new WeakMap());

// Avoid blocking a local SQLite transaction with a second writer in the same
// process. Across instances, the database's write transactions serialize edits.
export function writeDatabase<T>(db: Database, work: () => Promise<T>): Promise<T> {
  const result = (writers.get(db) ?? Promise.resolve()).then(work);
  writers.set(db, result.then(() => undefined, () => undefined));
  return result;
}
