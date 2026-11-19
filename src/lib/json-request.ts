export class RequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export const noStoreHeaders = { "Cache-Control": "no-store" };

// JSON-only requests, without cross-origin CORS, also protect browsers that do
// not send Fetch Metadata. Cookie-bearing writes never accept HTML form posts.
export async function readJsonMutation(request: Request, maxBytes: number): Promise<unknown> {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site" || site === "same-site") {
    throw new RequestError(403, "Send this request from the Simplayz site.");
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError(415, "Send the request as JSON.");
  }
  const tooLarge = () => new RequestError(413, "The request is too large.");
  if (Number(request.headers.get("content-length")) > maxBytes) throw tooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "The request is not valid JSON.");
  try {
    const decoder = new TextDecoder();
    let body = "";
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => undefined);
        throw tooLarge();
      }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, "The request is not valid JSON.");
  } finally {
    reader.releaseLock();
  }
}
