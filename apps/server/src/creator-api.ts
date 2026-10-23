import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import {
  creatorCommandSchema,
  creatorTestSchema,
  workspaceCreateSchema,
} from "@extension-twitch/contracts/creator";
import { credential, json, readJson } from "./http-utils.js";
import type { CreatorService } from "./creator-service.js";
export class CreatorApi {
  constructor(private readonly service: CreatorService) {}
  async handle(
    path: string,
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const token = credential(request);
    if (path === "/studio/workspaces" && request.method === "POST") {
      json(
        response,
        this.service.create(
          token,
          workspaceCreateSchema.parse(await readJson(request)),
        ),
        201,
      );
      return true;
    }
    const match =
      /^\/studio\/workspaces\/([^/]+)(?:\/(commands|test-sessions|manifest))?$/.exec(
        path,
      );
    if (!match || !z.uuid().safeParse(match[1]).success) return false;
    const id = match[1]!;
    if (request.method === "GET" && !match[2]) {
      json(response, this.service.view(id, token));
      return true;
    }
    if (request.method === "POST" && match[2] === "commands") {
      json(
        response,
        this.service.command(
          id,
          token,
          creatorCommandSchema.parse(await readJson(request, 32768)),
        ),
      );
      return true;
    }
    if (request.method === "POST" && match[2] === "test-sessions") {
      json(
        response,
        this.service.testSession(
          id,
          token,
          creatorTestSchema.parse(await readJson(request)),
        ),
        201,
      );
      return true;
    }
    if (request.method === "POST" && match[2] === "manifest") {
      const input = z
        .strictObject({
          gameId: z.uuid(),
          version: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/),
        })
        .parse(await readJson(request));
      json(
        response,
        this.service.manifest(id, token, input.gameId, input.version),
      );
      return true;
    }
    return false;
  }
}
