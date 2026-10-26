import { createServer } from "node:http";
import {
  healthSchema,
  transportEventSchema,
} from "@extension-twitch/contracts";
import { SessionApi } from "./session-api.js";
import type { SessionService } from "./session-service.js";

export function createApp(
  service?: SessionService,
  options: { legacyTools?: boolean } = {},
) {
  const sessions = service
    ? new SessionApi(service, options.legacyTools)
    : null;
  return createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");

    if (request.method === "GET" && request.url === "/events") {
      // Transport probe only: no session subscription, secret or mutation.
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        // Prevent proxy compression from buffering the first event indefinitely.
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      const event = transportEventSchema.parse({
        type: "transport.ready",
        protocolVersion: 1,
      });
      response.write(`data: ${JSON.stringify(event)}\n\n`);
      const heartbeat = setInterval(
        () => response.write(": heartbeat\n\n"),
        15_000,
      );
      heartbeat.unref();
      response.on("close", () => clearInterval(heartbeat));
      return;
    }

    response.setHeader("Content-Type", "application/json; charset=utf-8");
    if (request.method === "GET" && request.url === "/health") {
      response.end(
        JSON.stringify(
          healthSchema.parse({
            status: "ok",
            service: "extension-twitch-server",
            mode: service ? "sessions" : "foundation",
          }),
        ),
      );
      return;
    }

    if (sessions) {
      void sessions.handle(request, response);
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: "NOT_FOUND" }));
  }).on("close", () => service?.shutdown());
}
