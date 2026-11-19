import "server-only";
import { cache } from "react";
import { requireAccount } from "../auth/server";
import { getWorldRepository } from "./world-repository";

// Metadata and layouts share a request-local snapshot, never a public cache.
export const readWorld = cache(async () => {
  await requireAccount();
  return getWorldRepository().read();
});
