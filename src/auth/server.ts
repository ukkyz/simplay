import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDatabase } from "../db/client";
import { DatabaseConfigError } from "../db/config";
import { findSessionAccount, revokeSession, type Session } from "./repository";

const SESSION_COOKIE = "simplayz_session";

export async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export const getAccount = cache(async () => {
  const token = await readSessionToken();
  if (!token) return null;
  try {
    return await findSessionAccount(getDatabase(), token);
  } catch (error) {
    if (error instanceof DatabaseConfigError) throw error;
    // Server Components may log uncaught errors. Do not attach driver details.
    throw new Error("Could not read the session from the database.");
  }
});

export async function requireAccount() {
  const account = await getAccount();
  if (!account) redirect("/login");
  return account;
}

async function cookieOptions(expires: Date) {
  const request = await headers();
  const host = request.get("x-forwarded-host")?.split(",")[0].trim() ?? request.get("host") ?? "";
  const https = request.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  const embedded = host !== "" && host === process.env.SIMPLAYZ_EMBEDDED_PREVIEW_HOST;
  const loopback = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
  return {
    expires, path: "/", httpOnly: true,
    secure: embedded || https || (process.env.NODE_ENV === "production" && !loopback),
    sameSite: embedded ? "none" as const : "lax" as const,
    partitioned: embedded,
  };
}

export async function setSessionCookie(session: Session) {
  (await cookies()).set(SESSION_COOKIE, session.token, await cookieOptions(new Date(session.expiresAt)));
}

export async function clearSession() {
  const token = await readSessionToken();
  if (token) await revokeSession(getDatabase(), token);
  // Match the original cookie scope, including its partition in an iframe.
  (await cookies()).set(SESSION_COOKIE, "", await cookieOptions(new Date(0)));
}
