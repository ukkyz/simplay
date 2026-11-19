import nextEnv from "@next/env";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { AuthError, createAlexAccount } from "../src/auth/repository";
import { databasePath, openDatabase } from "../src/db/client";

async function readPassword() {
  if (process.argv.length === 3 && process.argv[2] === "--stdin") {
    if (process.stdin.isTTY) throw new AuthError(400, "Omit --stdin to use the hidden terminal prompt.");
    return readFileSync(0, "utf8").replace(/\r?\n$/, "");
  }
  if (!process.stdin.isTTY || process.argv.length > 2) {
    throw new AuthError(400, "Run npm run auth:alex in a terminal, or pass --stdin to read from a private pipe.");
  }
  const muted = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const input = createInterface({ input: process.stdin, output: muted, terminal: true, historySize: 0 });
  const abort = new AbortController();
  input.once("SIGINT", () => abort.abort());
  try {
    process.stderr.write("Password for alex (hidden): ");
    const password = await input.question("", { signal: abort.signal });
    process.stderr.write("\nConfirm password: ");
    if (password !== await input.question("", { signal: abort.signal })) throw new AuthError(400, "Passwords do not match.");
    return password;
  } finally {
    input.close();
    process.stderr.write("\n");
  }
}

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
try {
  const password = await readPassword();
  const { client, db } = openDatabase(databasePath());
  try {
    await createAlexAccount(db, password);
    console.log("Created the alex owner login. The existing world was left unchanged.");
  } finally {
    client.close();
  }
} catch (error) {
  console.error(error instanceof AuthError ? error.message : "Owner setup did not complete. Check the database and run npm run db:setup first.");
  process.exitCode = 1;
}
