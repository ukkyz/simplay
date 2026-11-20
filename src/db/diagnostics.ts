import { DatabaseConfigError } from "./config";

// Drizzle wraps driver errors, which can contain SQL parameters or responses
// from the database endpoint. Inspect the causes, but only return fixed labels.
export function databaseFailureReason(error: unknown) {
  for (let depth = 0; depth < 6 && error instanceof Error; depth++) {
    const { cause, code, status } = error as Error & { cause?: unknown; code?: unknown; status?: unknown };
    if (error instanceof DatabaseConfigError) return "configuration";
    if (error.name === "HttpServerError") {
      if (status === 401 || status === 403) return "database-access-denied";
      if (status === 404) return "database-endpoint-not-found";
      if (status === 429 || (typeof status === "number" && status >= 500)) return "database-unavailable";
    }
    if (typeof code === "string") {
      if (/^SQLITE_(?:AUTH|PERM|READONLY)(?:_|$)/.test(code)) return "database-access-denied";
      if (/^SQLITE_(?:BUSY|LOCKED)(?:_|$)/.test(code)) return "database-busy";
      // Hrana can report SQL errors as SQLITE_UNKNOWN even when local SQLite
      // gives a specific code. Only recognize known symptoms; never echo them.
      if (code === "SQLITE_ERROR" || code === "SQLITE_UNKNOWN" || code === "SQL_INPUT_ERROR") {
        if (/\b(?:no such (?:table|column)|has no column named)\b/i.test(error.message)) return "schema-incomplete";
        if (/\b(?:attempt to write a readonly database|not authorized)\b/i.test(error.message)) return "database-access-denied";
      }
      if (code === "SQLITE_CANTOPEN" || code === "EROFS") return "local-storage-unavailable";
      if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT") return "database-timeout";
      if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ERR_TLS_CERT_ALTNAME_INVALID", "CERT_HAS_EXPIRED"].includes(code)) {
        return "database-network-error";
      }
    }
    if (error.name === "TimeoutError") return "database-timeout";
    error = cause;
  }
  return "unexpected-error";
}
