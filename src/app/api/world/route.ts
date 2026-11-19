import { getWorldRepository } from "@/db/world-repository";
import { WorldError } from "@/db/world-storage";
import { worldCommand } from "@/lib/world-commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 128 * 1024;
const headers = { "Cache-Control": "no-store" };
const fail = (status: number, error: string) => Response.json({ error }, { status, headers });

function report(error: unknown) {
  if (error instanceof WorldError) return fail(error.status, error.message);
  // Avoid logging query arguments (e.g. prompt contents).
  console.error("SQLite world request failed", error instanceof Error ? error.name : "Unknown error");
  return fail(503, "The world database is unavailable. Refresh and try again.");
}

export async function GET() {
  try {
    return Response.json(await getWorldRepository().read(), { headers });
  } catch (error) {
    return report(error);
  }
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403, "Use this site's world editor to save changes.");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return fail(415, "Send the world command as JSON.");
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return fail(413, "The world command is too large.");
  const reader = request.body?.getReader();
  if (!reader) return fail(400, "The world command is not valid JSON.");
  let input: unknown;
  try {
    const decoder = new TextDecoder();
    let body = "";
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);
        return fail(413, "The world command is too large.");
      }
      body += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(body + decoder.decode());
  } catch {
    return fail(400, "The world command is not valid JSON.");
  } finally {
    reader.releaseLock();
  }
  const command = worldCommand.safeParse(input);
  if (!command.success) return fail(400, "The world command has invalid or missing fields.");
  try {
    return Response.json(await getWorldRepository().execute(command.data), { headers });
  } catch (error) {
    return report(error);
  }
}
