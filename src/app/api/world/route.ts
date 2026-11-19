import { getAccount } from "@/auth/server";
import { getWorldRepository } from "@/db/world-repository";
import { WorldError } from "@/db/world-storage";
import { noStoreHeaders as headers, readJsonMutation, RequestError } from "@/lib/json-request";
import { worldCommand } from "@/lib/world-commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 128 * 1024;
const fail = (status: number, error: string) => Response.json({ error }, { status, headers });
const unauthorized = () => fail(401, "Sign in to access the shared world.");

function report(error: unknown) {
  if (error instanceof WorldError || error instanceof RequestError) return fail(error.status, error.message);
  // Avoid logging query arguments (e.g. prompt contents).
  console.error("SQLite world request failed", error instanceof Error ? error.name : "Unknown error");
  return fail(503, "The world database is unavailable. Refresh and try again.");
}

export async function GET() {
  try {
    if (!await getAccount()) return unauthorized();
    return Response.json(await getWorldRepository().read(), { headers });
  } catch (error) {
    return report(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!await getAccount()) return unauthorized();
    const command = worldCommand.safeParse(await readJsonMutation(request, MAX_BODY_BYTES));
    if (!command.success) return fail(400, "The world command has invalid or missing fields.");
    return Response.json(await getWorldRepository().execute(command.data), { headers });
  } catch (error) {
    return report(error);
  }
}
