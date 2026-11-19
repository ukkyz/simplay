const TURSO_URL = "SIMPLAY_DB_TURSO_DATABASE_URL";
const TURSO_TOKEN = "SIMPLAY_DB_TURSO_AUTH_TOKEN";
const LOCAL_DEFAULT = ".data/simplayz.sqlite";

export type DatabaseConfig =
  | { kind: "sqlite"; path: string }
  | { kind: "turso"; url: string; authToken: string };

export class DatabaseConfigError extends Error {
  override name = "DatabaseConfigError";
}

export type DatabaseEnvironment = Readonly<Record<string, string | undefined>>;

export function resolveDatabaseConfig(env: DatabaseEnvironment = process.env): DatabaseConfig {
  const rawUrl = env[TURSO_URL];
  const rawToken = env[TURSO_TOKEN];
  // Empty optional env values can be used to disable the pair outside Vercel.
  // Whitespace-only or partially supplied configurations are still errors.
  if (env.VERCEL !== "1" && !rawUrl && !rawToken) {
    const key = env.DATABASE_PATH ? "DATABASE_PATH" : "SIMPLAY_DB_URL";
    const path = env[key] || LOCAL_DEFAULT;
    if (/^(?:file|libsql|https?|wss?):/i.test(path)) {
      throw new DatabaseConfigError(`${key} must be a local file path, not a database URL.`);
    }
    return { kind: "sqlite", path };
  }

  const url = rawUrl?.trim();
  const authToken = rawToken?.trim();
  if (!url || !authToken) {
    const missing = [!url ? TURSO_URL : null, !authToken ? TURSO_TOKEN : null].filter(Boolean).join(" and ");
    throw new DatabaseConfigError(`Set ${missing} to configure Turso.`);
  }

  function invalidUrl() {
    return new DatabaseConfigError(`${TURSO_URL} must be a libsql:// or https:// database endpoint without credentials, a path, query, or fragment.`);
  }
  if (!/^(?:libsql|https):\/\/[^/\s\\?#@%]+\/?$/i.test(url)) throw invalidUrl();
  try {
    // Validate the host and port as HTTPS, matching the HTTP client's transport.
    new URL(url.replace(/^libsql:/i, "https:"));
  } catch {
    throw invalidUrl();
  }
  if (!/^[\x21-\x7e]+$/.test(authToken)) {
    throw new DatabaseConfigError(`${TURSO_TOKEN} must be a nonempty token without embedded whitespace.`);
  }
  return { kind: "turso", url, authToken };
}

export function databaseErrorMessage(error: unknown, fallback: string) {
  return error instanceof DatabaseConfigError ? error.message : fallback;
}
