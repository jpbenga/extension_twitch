import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import { readConfiguration } from "../apps/server/src/config.js";

describe("foundation HTTP and realtime transport", () => {
  const server = createApp();
  let origin: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  });

  it("serves health over an actual HTTP connection without cache or secrets", async () => {
    const response = await fetch(`${origin}/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      status: "ok",
      service: "extension-twitch-server",
      mode: "foundation",
    });
  });

  it("opens an SSE stream and sends a schema-defined readiness event", async () => {
    const controller = new AbortController();
    const response = await fetch(`${origin}/events`, {
      signal: controller.signal,
    });
    try {
      expect(response.headers.get("content-type")).toBe("text/event-stream");
      expect(response.headers.get("cache-control")).toBe(
        "no-store, no-transform",
      );
      const reader = response.body?.getReader();
      const chunk = await reader?.read();
      expect(new TextDecoder().decode(chunk?.value)).toBe(
        'data: {"type":"transport.ready","protocolVersion":1}\n\n',
      );
      await reader?.cancel();
    } finally {
      controller.abort();
    }
  });

  it.each(["/commands", "/payments", "/sessions", "/unknown"])(
    "does not expose %s",
    async (path) => {
      const response = await fetch(`${origin}${path}`, {
        method: "POST",
        body: JSON.stringify({ role: "gm", verified: true }),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "NOT_FOUND" });
    },
  );

  it("does not accept writes to health or stream routes", async () => {
    expect((await fetch(`${origin}/health`, { method: "POST" })).status).toBe(
      404,
    );
    expect((await fetch(`${origin}/events`, { method: "POST" })).status).toBe(
      404,
    );
  });
});

describe("server configuration validation", () => {
  it("uses local defaults and supports explicit cloud overrides", () => {
    expect(readConfiguration({})).toEqual({ host: "127.0.0.1", port: 4000 });
    expect(
      readConfiguration({ SERVER_HOST: "0.0.0.0", SERVER_PORT: "4010" }),
    ).toEqual({ host: "0.0.0.0", port: 4010 });
  });
  it.each(["0", "65536", "abc", "4000.5"])(
    "rejects invalid port %s",
    (port) => {
      expect(() => readConfiguration({ SERVER_PORT: port })).toThrow();
    },
  );
});
