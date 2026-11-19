import { defineConfig } from "drizzle-kit";

// Generation is offline. The database CLI selects the runtime backend.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
