import { defineConfig } from "drizzle-kit";

const isLocal = process.env.SIMPLAY_DB_URL? true : false;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isLocal ? 'sqlite' : 'turso',
  dbCredentials: isLocal
    ? {
        url: process.env.SIMPLAY_DB_URL!,
      }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
});