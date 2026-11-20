import type { Client } from "@libsql/client";
import { DEMO_PLAYER } from "../src/db/fixtures";

export async function checkTurso(client: Pick<Client, "batch">) {
  const [, , , readiness] = await client.batch([
    // Verify the columns used by sign-in without reading hashes or sessions.
    "SELECT key, count, expires_at FROM auth_attempts LIMIT 0",
    "SELECT username, password_hash, owned_player_id FROM accounts LIMIT 0",
    "SELECT token_hash, username, expires_at FROM auth_sessions LIMIT 0",
    {
      sql: `SELECT EXISTS(SELECT 1 FROM players WHERE id = ?) AS world_seeded,
                   EXISTS(SELECT 1 FROM accounts WHERE username = ?) AS alex_provisioned`,
      args: [DEMO_PLAYER.id, DEMO_PLAYER.id],
    },
  ], "read");
  const [row] = readiness.rows;
  return { worldSeeded: row?.world_seeded === 1, alexProvisioned: row?.alex_provisioned === 1 };
}
