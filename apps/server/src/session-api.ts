import { UNDERCOVER_IMAGE_MAX_BYTES } from "@extension-twitch/contracts/undercover-stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createSessionSchema,
  invitationCodeSchema,
  joinSessionSchema,
  lobbyCommandSchema,
  sessionIdSchema,
} from "@extension-twitch/contracts/sessions";
import { gameExamples, SessionError } from "@extension-twitch/engine";
import { credential, readJson, readPng, json } from "./http-utils.js";
import { CreatorApi } from "./creator-api.js";
import { CreatorService } from "./creator-service.js";
import { ZodError } from "zod";
import {
  officialGames,
  officialSessionSchema,
} from "@extension-twitch/contracts/official-games";
import { readOnlySpectators } from "@extension-twitch/contracts/spectators";
import { prepareOfficialSession } from "./official-games.js";
import { hashValue, type SessionService } from "./session-service.js";

export class SessionApi {
  private readonly buckets = new Map<
    string,
    { count: number; until: number }
  >();
  private readonly creator: CreatorApi;
  constructor(
    private readonly service: SessionService,
    private readonly legacyTools = false,
    private readonly additionalMutationOrigins: readonly string[] = [],
  ) {
    this.creator = new CreatorApi(new CreatorService(service.store, service));
  }

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
      if (method === "GET" && path === "/official-games") {
        json(response, officialGames);
        return;
      }
      if (method === "GET" && path === "/game-examples") {
        if (!this.legacyTools) throw new SessionError("NOT_FOUND", 404);
        json(response, gameExamples);
        return;
      }
      if (method === "POST" || method === "DELETE") {
        const origin = request.headers.origin;
        if (
          origin &&
          origin !== this.service.publicOrigin &&
          !this.additionalMutationOrigins.includes(origin)
        )
          throw new SessionError("ORIGIN_DENIED", 403);
        this.limit(`network:${request.socket.remoteAddress ?? "local"}`, 240);
      }
      if (method === "POST" && path === "/official-games/undercover/sessions") {
        const token = credential(request);
        const input = officialSessionSchema.parse(await readJson(request));
        json(response, prepareOfficialSession(this.service, token, input), 201);
        return;
      }
      if (path.startsWith("/studio/")) {
        if (!this.legacyTools) throw new SessionError("NOT_FOUND", 404);
        this.limit(`studio:${hashValue(credential(request))}`, 90);
        if (await this.creator.handle(path, request, response)) return;
        throw new SessionError("NOT_FOUND", 404);
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
      const spectator = /^\/sessions\/([^/]+)\/spectator-interactions$/.exec(
        path,
      );
      if (
        method === "GET" &&
        spectator &&
        sessionIdSchema.safeParse(spectator[1]).success
      ) {
        this.service.view(spectator[1]!, null); // Same public availability check as the board.
        json(response, readOnlySpectators);
        return;
      }
      const media = /^\/sessions\/([^/]+)\/media\/([^/]+)$/.exec(path);
      if (
        media &&
        sessionIdSchema.safeParse(media[1]).success &&
        sessionIdSchema.safeParse(media[2]).success
      ) {
        const id = media[1]!,
          contentId = media[2]!;
        if (method === "POST") {
          const token = credential(request);
          this.limit(`media:${id}:${hashValue(token)}`, 30);
          this.service.assertMediaWrite(id, token, contentId);
          json(
            response,
            this.service.uploadMedia(
              id,
              token,
              contentId,
              await readPng(request, UNDERCOVER_IMAGE_MAX_BYTES),
            ),
          );
          return;
        }
        if (method === "DELETE") {
          const token = credential(request);
          this.limit(`media:${id}:${hashValue(token)}`, 30);
          json(response, this.service.removeMedia(id, token, contentId));
          return;
        }
        if (method === "GET") {
          const token = request.headers.authorization
            ? credential(request)
            : null;
          const bytes = this.service.readMedia(id, token, contentId);
          response.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": bytes.length,
            "Cache-Control": "private, no-store",
            "Content-Security-Policy": "default-src 'none'; sandbox",
          });
          response.end(bytes);
          return;
        }
        throw new SessionError("NOT_FOUND", 404);
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
        const input = lobbyCommandSchema.parse(await readJson(request));
        if (!this.legacyTools && input.command.type === "game.configure")
          throw new SessionError("FORBIDDEN", 403);
        json(response, this.service.command(id, token, input));
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
