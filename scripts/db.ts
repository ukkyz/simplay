import nextEnv from "@next/env";
import { migrate } from "drizzle-orm/libsql/migrator";
import { readFile, stat } from "node:fs/promises";
import { ZodError } from "zod";
import { openConfiguredDatabase } from "../src/db/client";
import { databaseErrorMessage } from "../src/db/config";
import { databaseFailureReason } from "../src/db/diagnostics";
import { importLegacyWorld, seedDemo, WorldError } from "../src/db/world-storage";
import { checkTurso } from "./check-turso";

async function readLegacySave(file: string | undefined): Promise<unknown> {
  if (!file) throw new WorldError(400, "Usage: npm run db:import -- /path/to/world.json");
  try {
    if ((await stat(file)).size > 2 * 1024 * 1024) {
      throw new WorldError(400, "The legacy save must be at most 2 MiB.");
    }
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error instanceof WorldError) throw error;
    throw new WorldError(400, "Could not read a valid JSON file at the supplied legacy save path.");
  }
}

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const [task, file] = process.argv.slice(2);

try {
  if (!task || !["check", "migrate", "seed", "setup", "import"].includes(task)) {
    throw new WorldError(400, "Expected check, migrate, seed, setup, or import.");
  }
  const input = task === "import" ? await readLegacySave(file) : undefined;
  // The hosted diagnostic requires the Turso pair even in a local operator shell.
  const env = task === "check" ? { ...process.env, VERCEL: "1" } : undefined;
  const { kind, db, client } = openConfiguredDatabase(env);
  try {
    if (task === "check") {
      const { worldSeeded, alexProvisioned } = await checkTurso(client);
      if (!worldSeeded) throw new WorldError(503, "Turso sign-in tables are readable, but the shared world is missing. Verify the selected database before setup.");
      console.log("Turso reads passed: sign-in schema is readable and the shared world exists.");
      console.log(`Reserved Alex login: ${alexProvisioned ? "present" : "not provisioned"}.`);
      console.log("This read-only check does not verify write permissions.");
    }
    if (task === "setup" || task === "migrate") {
      if (kind === "sqlite") await client.execute("PRAGMA journal_mode = WAL");
      await migrate(db, { migrationsFolder: "./drizzle" });
      console.log(`Migrations applied (${kind === "turso" ? "Turso" : "local SQLite"}).`);
    }
    if (task === "setup" || task === "seed") {
      console.log(await seedDemo(db) ? "Seeded the Simplayz demo world." : "Demo player already exists; left saved data unchanged.");
    }
    if (task === "import") {
      await importLegacyWorld(db, input);
      console.log("Imported the legacy save. Keep the original export as a backup.");
    }
  } finally {
    client.close();
  }
} catch (error) {
  // Do not print driver errors, connection strings, or values from imported saves.
  console.error(error instanceof WorldError ? error.message
    : error instanceof ZodError ? "The legacy save does not match the Simplayz schema."
    : databaseErrorMessage(error, task === "check"
      ? `Turso read check failed (${databaseFailureReason(error)}). See docs/deploy-vercel.md#troubleshoot-sign-in.`
      : "Database command failed. Check database connectivity, write permissions, and migration status."));
  process.exitCode = 1;
}
