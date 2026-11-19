import "server-only";
import { cache } from "react";
import { requireAccount } from "../auth/server";
import { DatabaseConfigError } from "./config";
import { getWorldRepository } from "./world-repository";
import { WorldError } from "./world-storage";

// Metadata and layouts share a request-local snapshot, never a public cache.
export const readWorld = cache(async () => {
  await requireAccount();
  try {
    return await getWorldRepository().read();
  } catch (error) {
    if (error instanceof DatabaseConfigError || error instanceof WorldError) throw error;
    throw new Error("Could not read the world from the database.");
  }
});
