import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lte, or, sql } from "drizzle-orm";
import { writeDatabase, type Database } from "../db/client";
import { DEMO_PLAYER } from "../db/fixtures";
import { accounts, authAttempts, authSessions, players } from "../db/schema";
import type { WriteTx } from "../db/world-storage";
import type { SignedInAccount } from "./credentials";
import { hashPassword, verifyPassword } from "./password";
import { newPassword, type Credentials } from "./validation";

const MINUTE = 60_000;
const SESSION_LIFETIME = 7 * 24 * 60 * MINUTE;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const validToken = (token: string | undefined): token is string => Boolean(token && /^[\w-]{43}$/.test(token));

export class AuthError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export interface Session {
  token: string;
  expiresAt: number;
}

export async function allowAuthAttempt(db: Database, action: "login" | "register", username: string, now = Date.now()) {
  return writeDatabase(db, () => db.transaction(async (tx) => {
    await tx.delete(authAttempts).where(lte(authAttempts.expiresAt, now));
    async function count(key: string, windowMs: number) {
      const [row] = await tx.insert(authAttempts).values({ key, count: 1, expiresAt: now + windowMs })
        .onConflictDoUpdate({ target: authAttempts.key, set: { count: sql`${authAttempts.count} + 1` } })
        .returning({ count: authAttempts.count });
      return row.count;
    }
    // A global cap also limits password work when requests use many usernames.
    // Do not rely on client-supplied forwarding headers for rate limiting.
    if (await count(`${action}:total`, MINUTE) > (action === "login" ? 100 : 30)) return false;
    return await count(`${action}:user:${username}`, 15 * MINUTE) <= (action === "login" ? 10 : 5);
  }));
}

async function issueSession(tx: WriteTx, username: string, previousToken?: string): Promise<Session> {
  const now = Date.now();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + SESSION_LIFETIME;
  const expired = lte(authSessions.expiresAt, now);
  await tx.delete(authSessions).where(validToken(previousToken) ? or(expired, eq(authSessions.tokenHash, hashToken(previousToken))) : expired);
  await tx.insert(authSessions).values({ username, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function registerAccount(db: Database, credentials: Credentials, previousToken?: string) {
  const { username, password } = credentials;
  if (username === DEMO_PLAYER.id) throw new AuthError(409, "That username is unavailable.");
  const passwordHash = await hashPassword(password);
  return writeDatabase(db, () => db.transaction(async (tx) => {
    const [created] = await tx.insert(accounts).values({ username, passwordHash, createdAt: Date.now() })
      .onConflictDoNothing({ target: accounts.username }).returning({ username: accounts.username });
    if (!created) throw new AuthError(409, "That username is unavailable.");
    return issueSession(tx, username, previousToken);
  }));
}

export async function loginAccount(db: Database, credentials: Credentials, previousToken?: string) {
  const { username, password } = credentials;
  const [account] = await db.select({ passwordHash: accounts.passwordHash }).from(accounts).where(eq(accounts.username, username));
  if (!await verifyPassword(password, account?.passwordHash)) {
    throw new AuthError(401, "Incorrect username or password.");
  }
  return writeDatabase(db, () => db.transaction((tx) => issueSession(tx, username, previousToken)));
}

export async function findSessionAccount(db: Database, token: string | undefined, now = Date.now()): Promise<SignedInAccount | null> {
  if (!validToken(token)) return null;
  const [account] = await db.select({ username: accounts.username, ownedPlayerId: accounts.ownedPlayerId })
    .from(authSessions).innerJoin(accounts, eq(accounts.username, authSessions.username))
    .where(and(eq(authSessions.tokenHash, hashToken(token)), gt(authSessions.expiresAt, now)));
  return account ? { username: account.username, ownsWorld: account.ownedPlayerId === DEMO_PLAYER.id } : null;
}

export async function revokeSession(db: Database, token?: string) {
  if (validToken(token)) {
    await writeDatabase(db, async () => { await db.delete(authSessions).where(eq(authSessions.tokenHash, hashToken(token))); });
  }
}

// The existing Alex world is never recreated or updated by this command.
export async function createAlexAccount(db: Database, password: string) {
  if (!newPassword.safeParse(password).success) throw new AuthError(400, "Use a password with 12–128 characters.");
  const passwordHash = await hashPassword(password);
  await writeDatabase(db, () => db.transaction(async (tx) => {
    const [player] = await tx.select({ id: players.id }).from(players).where(eq(players.id, DEMO_PLAYER.id));
    if (!player) throw new AuthError(409, "Run npm run db:setup to seed the Alex world first.");
    const [created] = await tx.insert(accounts).values({
      username: DEMO_PLAYER.id, passwordHash, ownedPlayerId: player.id, createdAt: Date.now(),
    }).onConflictDoNothing().returning({ username: accounts.username });
    if (!created) throw new AuthError(409, "Alex already has an account. The existing password and world were not changed.");
  }));
}
