import type { IncomingMessage, ServerResponse } from "node:http";
import { accessTokenSchema } from "@extension-twitch/contracts/sessions";
import { SessionError } from "@extension-twitch/engine";
export function credential(request: IncomingMessage) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessTokenSchema.safeParse(token).success)
    throw new SessionError("ACCESS_DENIED", 401);
  return token;
}

export async function readJson(
  request: IncomingMessage,
  limit = 8192,
): Promise<unknown> {
  if (
    request.headers["content-type"]?.split(";")[0]?.trim() !==
    "application/json"
  )
    throw new SessionError("JSON_REQUIRED", 415);
  if (Number(request.headers["content-length"]) > limit)
    throw new SessionError("PAYLOAD_TOO_LARGE", 413);
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += buffer.length;
    if (length > limit) throw new SessionError("PAYLOAD_TOO_LARGE", 413);
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new SessionError("INVALID_JSON");
  }
}

export function json(response: ServerResponse, value: unknown, status = 200) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

export async function readPng(
  request: IncomingMessage,
  limit: number,
): Promise<Buffer> {
  if (request.headers["content-type"]?.split(";")[0]?.trim() !== "image/png")
    throw new SessionError("IMAGE_PNG_REQUIRED", 415);
  if (Number(request.headers["content-length"]) > limit)
    throw new SessionError("IMAGE_TOO_LARGE", 413);
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += bytes.length;
    if (length > limit) throw new SessionError("IMAGE_TOO_LARGE", 413);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}
