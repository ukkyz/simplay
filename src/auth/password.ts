import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const FORMAT = "scrypt-v1";
// OWASP's 32 MiB scrypt profile. The derivation runs off the request thread.
const options = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `${FORMAT}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored?: string) {
  const match = stored?.match(/^scrypt-v1\$([0-9a-f]{32})\$([0-9a-f]{128})$/);
  // Still derive a key when the username doesn't exist to avoid a timing shortcut.
  const salt = match ? Buffer.from(match[1], "hex") : Buffer.alloc(16);
  const expected = match ? Buffer.from(match[2], "hex") : Buffer.alloc(KEY_LENGTH);
  const actual = await derive(password, salt);
  return timingSafeEqual(expected, actual) && Boolean(match);
}
