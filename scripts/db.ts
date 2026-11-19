import nextEnv from "@next/env";
import { migrate } from "drizzle-orm/libsql/migrator";
import { readFile, stat } from "node:fs/promises";
import { databasePath, openDatabase } from "../src/db/client";
import { importLegacyWorld, seedDemo } from "../src/db/world-storage";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const [task, file] = process.argv.slice(2);
const path = databasePath();
const { db, client } = openDatabase(path);

try {
  if (task === "setup" || task === "migrate") {
    await client.execute("PRAGMA journal_mode = WAL");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log(`SQLite migrations applied: ${path}`);
  }
  if (task === "setup" || task === "seed") {
    console.log(await seedDemo(db) ? "Seeded the Simplayz demo world." : "Demo player already exists; left saved data unchanged.");
  } else if (task === "import") {
    if (!file) throw new Error("Usage: npm run db:import -- /path/to/world.json");
    if ((await stat(file)).size > 2 * 1024 * 1024) throw new Error("The legacy save must be at most 2 MiB.");
    await importLegacyWorld(db, JSON.parse(await readFile(file, "utf8")));
    console.log("Imported the legacy save into SQLite. Keep the original export as a backup.");
  } else if (task !== "migrate") {
    throw new Error("Expected migrate, seed, setup, or import.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Database command failed.");
  process.exitCode = 1;
} finally {
  client.close();
}
