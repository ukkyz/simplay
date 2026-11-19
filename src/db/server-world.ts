import { cache } from "react";
import { getWorldRepository } from "./world-repository";

// Share one SQLite snapshot between the layout and route metadata for a render.
export const readWorld = cache(() => getWorldRepository().read());
