import type { IncomingMessage, ServerResponse } from "node:http";
import {
  accessTokenSchema,
  createSessionSchema,
  invitationCodeSchema,
  joinSessionSchema,
  lobbyCommandSchema,
  sessionIdSchema,
} from "@extension-twitch/contracts/sessions";
import { SessionError } from "@extension-twitch/engine";
import { ZodError } from "zod";
import { hashValue, type SessionService } from "./session-service.js";

function credential(request: IncomingMessage) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessTokenSchema.safeParse(token).success)
    throw new SessionError("ACCESS_DENIED", 401);
  return token;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  if (
    request.headers["content-type"]?.split(";")[0]?.trim() !==
    "application/json"
  )
    throw new SessionError("JSON_REQUIRED", 415);
  if (Number(request.headers["content-length"]) > 8192)
    throw new SessionError("PAYLOAD_TOO_LARGE", 413);
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += buffer.length;
    if (length > 8192) throw new SessionError("PAYLOAD_TOO_LARGE", 413);
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new SessionError("INVALID_JSON");
  }
}

function json(response: ServerResponse, value: unknown, status = 200) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

export class SessionApi {
  private readonly buckets = new Map<
    string,
    { count: number; until: number }
  >();
  constructor(private readonly service: SessionService) {}

  private limit(key: string, maximum: number) {
    const now = Date.now();
    for (const [entry, bucket] of this.buckets)
      if (bucket.until <= now) this.buckets.delete(entry);
    const bucket = this.buckets.get(key) ?? { count: 0, until: now + 60_000 };
    if (bucket.count >= maximum || this.buckets.size > 4096)
      throw new SessionError("RATE_LIMITED", 429);
    bucket.count += 1;
    this.buckets.set(key, bucket);
  }

  async handle(request: IncomingMessage, response: ServerResponse) {
    response.setHeader("Referrer-Policy", "no-referrer");
    try {
      const path = new URL(request.url ?? "/", "http://internal").pathname;
      const method = request.method;
      if (method === "POST") {
        const origin = request.headers.origin;
        if (origin && origin !== this.service.publicOrigin)
          throw new SessionError("ORIGIN_DENIED", 403);
        this.limit(`network:${request.socket.remoteAddress ?? "local"}`, 240);
      }
      if (method === "POST" && path === "/sessions") {
        const token = credential(request);
        const input = createSessionSchema.parse(await readJson(request));
        json(response, this.service.create(token, input), 201);
        return;
      }
      const join = /^\/invitations\/([^/]+)\/join$/.exec(path);
      if (method === "POST" && join) {
        const code = invitationCodeSchema.parse(join[1]);
        const token = credential(request);
        json(
          response,
          this.service.join(
            code,
            token,
            joinSessionSchema.parse(await readJson(request)),
          ),
          201,
        );
        return;
      }
      const session =
        /^\/sessions\/([^/]+)\/(public|private|commands)(\/events)?$/.exec(
          path,
        );
      if (!session || !sessionIdSchema.safeParse(session[1]).success)
        throw new SessionError("NOT_FOUND", 404);
      const id = session[1]!;
      const access = session[2];
      const token = access === "public" ? null : credential(request);
      if (
        method === "POST" &&
        access === "commands" &&
        !session[3] &&
        token !== null
      ) {
        this.limit(`command:${id}:${hashValue(token)}`, 90);
        json(
          response,
          this.service.command(
            id,
            token,
            lobbyCommandSchema.parse(await readJson(request)),
          ),
        );
        return;
      }
      if (method !== "GET" || access === "commands")
        throw new SessionError("NOT_FOUND", 404);
      if (!session[3]) {
        json(
          response,
          this.service.view(id, token === null ? null : hashValue(token)),
        );
        return;
      }
      this.limit(`streams:${request.socket.remoteAddress ?? "local"}`, 300);
      request.setTimeout(0);
      const unsubscribe = this.service.subscribe(id, token, (message) => {
        if (response.destroyed || response.writableEnded) return;
        if (!response.headersSent)
          response.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-store, no-transform",
            "X-Accel-Buffering": "no",
            Connection: "keep-alive",
          });
        if (!response.write(`data: ${JSON.stringify(message)}\n\n`))
          response.destroy();
        if (message.type === "access.revoked") response.end();
      });
      const heartbeat = setInterval(() => {
        if (!response.write(": heartbeat\n\n")) response.destroy();
      }, 10_000);
      heartbeat.unref();
      response.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    } catch (error) {
      request.resume();
      if (response.headersSent) {
        response.end();
        return;
      }
      if (error instanceof SessionError) {
        if (error.status === 429) response.setHeader("Retry-After", "60");
        json(response, { error: error.code }, error.status);
      } else if (error instanceof ZodError)
        json(response, { error: "INVALID_INPUT" }, 400);
      else {
        // Never log request bodies, credentials, URLs or authoritative state.
        console.error(
          "Session operation failed; inspect database availability and schema.",
        );
        json(response, { error: "INTERNAL_ERROR" }, 500);
      }
    }
  }
}
