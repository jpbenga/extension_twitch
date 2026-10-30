import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as tlsRequest } from "node:https";
import type { AddressInfo } from "node:net";
import {
  createTwitchGateway,
  allowedPublicPath,
} from "../scripts/twitch-gateway.ts";
import { createApp } from "../apps/server/src/app.js";
import {
  SessionService,
  hashValue,
} from "../apps/server/src/session-service.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import { prepareOfficialSession } from "../apps/server/src/official-games.js";
import { officialSessionSchema } from "@extension-twitch/contracts/official-games";
import { createUndercoverTvLayout } from "@extension-twitch/contracts/undercover-layout";
import {
  gmSessionSchema,
  type LobbyAction,
} from "@extension-twitch/contracts/sessions";
import {
  sessionFromPublicInput,
  viewerConfigurationSchema,
} from "../apps/twitch/src/configuration.js";
import { localNetworkRequest } from "../apps/web/src/lib/local-network-request.js";

describe("native Twitch viewer configuration", () => {
  const id = randomUUID();
  it("accepts public pointers, never a private recovery link or executable configuration", () => {
    expect(
      sessionFromPublicInput(`http://192.168.0.2:3000/sessions/${id}/public`),
    ).toBe(id);
    expect(sessionFromPublicInput(id)).toBe(id);
    expect(
      viewerConfigurationSchema.parse({
        version: 1,
        sessionId: id,
        apiOrigin: "https://localhost:8443/",
      }).apiOrigin,
    ).toBe("https://localhost:8443");
    for (const p of ["gm", "player/another"])
      expect(() =>
        sessionFromPublicInput(`https://localhost/sessions/${id}/${p}`),
      ).toThrow();
    expect(() =>
      sessionFromPublicInput(
        `https://localhost/sessions/${id}/obs#access=not-a-real-secret`,
      ),
    ).toThrow();
    for (const apiOrigin of [
      "http://localhost:8443",
      "https://name:password@example.com",
      "https://localhost/a",
      "https://localhost/?token=bad",
    ])
      expect(
        viewerConfigurationSchema.safeParse({
          version: 1,
          sessionId: id,
          apiOrigin,
        }).success,
      ).toBe(false);
    expect(
      viewerConfigurationSchema.safeParse({
        version: 1,
        sessionId: id,
        apiOrigin: "https://localhost:8443",
        gmToken: "forbidden",
      }).success,
    ).toBe(false);
  });
  it("marks only loopback and private relay reads for Chromium local network access", () => {
    expect(
      localNetworkRequest("https://localhost:8443", { cache: "no-store" }),
    ).toMatchObject({ cache: "no-store", targetAddressSpace: "loopback" });
    expect(
      localNetworkRequest("https://192.168.0.46:8443", {
        credentials: "omit",
      }),
    ).toMatchObject({ credentials: "omit", targetAddressSpace: "private" });
    expect(
      localNetworkRequest("https://preview.example.com", {
        cache: "no-store",
      }),
    ).toEqual({ cache: "no-store" });
  });
});
describe("HTTPS public-only Twitch gateway with the actual game backend", () => {
  let directory: string,
    cert: Buffer,
    store: SqliteStore,
    service: SessionService,
    api: ReturnType<typeof createApp>,
    gateway: ReturnType<typeof createTwitchGateway>,
    port: number,
    id: string;
  const gmToken = randomBytes(32).toString("base64url");
  const gm = () => gmSessionSchema.parse(service.view(id, hashValue(gmToken)));
  const command = (command: LobbyAction) =>
    service.command(id, gmToken, {
      commandId: randomUUID(),
      expectedVersion: gm().version,
      command,
    });
  function get(
    path: string,
    headers: Record<string, string> = {},
    method = "GET",
    stream = false,
  ): Promise<{
    status: number;
    headers: Record<string, unknown>;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const req = tlsRequest(
        { hostname: "127.0.0.1", port, path, method, ca: cert, headers },
        (res) => {
          let body = "";
          const finish = () =>
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body,
            });
          res.on("data", (chunk: Buffer) => {
            body += chunk.toString();
            if (stream && body.includes("\n\n")) {
              finish();
              req.destroy();
            }
          });
          res.on("end", finish);
        },
      );
      req.on("error", reject);
      req.end();
    });
  }
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), "xt-twitch-tls-"));
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        join(directory, "key.pem"),
        "-out",
        join(directory, "cert.pem"),
        "-days",
        "1",
        "-subj",
        "/CN=localhost",
        "-addext",
        "subjectAltName=DNS:localhost,IP:127.0.0.1",
      ],
      { stdio: "ignore" },
    );
    cert = readFileSync(join(directory, "cert.pem"));
    writeFileSync(
      join(directory, "panel.html"),
      "<!doctype html><title>Fixture</title>",
    );
    writeFileSync(
      join(directory, "config.html"),
      "<!doctype html><title>Configuration fixture</title>",
    );
    store = new SqliteStore(":memory:");
    service = new SessionService(store, "http://127.0.0.1:3000");
    api = createApp(service);
    await new Promise<void>((resolve) => api.listen(0, "127.0.0.1", resolve));
    id = prepareOfficialSession(
      service,
      gmToken,
      officialSessionSchema.parse({
        requestId: randomUUID(),
        settings: {},
        overlayLayout: createUndercoverTvLayout(),
        preparation: {
          id: randomUUID(),
          title: "Paire publique de test",
          series: {
            id: randomUUID(),
            title: "Test privé",
            position: 1,
            total: 1,
          },
        },
      }),
    ).sessionId;
    for (const name of ["Alex", "Camille", "Noa"])
      service.join(gm().invitationCode, randomBytes(32).toString("base64url"), {
        requestId: randomUUID(),
        name,
      });
    command({ type: "game.use-prepared" });
    command({
      type: "game.action",
      runId: gm().game!.runId,
      actionId: "deal",
      parameters: {},
    });
    command({ type: "undercover.publish", mode: "duo" });
    gateway = createTwitchGateway({
      tls: { cert, key: readFileSync(join(directory, "key.pem")) },
      upstream: `http://127.0.0.1:${(api.address() as AddressInfo).port}`,
      dist: directory,
      extensionClientId: "testextension",
    });
    await new Promise<void>((resolve) =>
      gateway.listen(0, "127.0.0.1", resolve),
    );
    port = (gateway.address() as AddressInfo).port;
  });
  afterAll(async () => {
    for (const server of [gateway, api])
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
    store.close();
    rmSync(directory, { recursive: true, force: true });
  });
  it("serves embeddable HTML over verified TLS without weakening the main app framing policy", async () => {
    const r = await get("/panel.html");
    expect(r.status).toBe(200);
    expect(r.headers["x-frame-options"]).toBeUndefined();
    expect(r.headers["content-security-policy"]).toContain("frame-ancestors");
    expect(r.headers["content-security-policy"]).toContain(
      "https://*.twitch.tech",
    );
    expect(r.headers["content-security-policy"]).not.toContain("unsafe-eval");

    const twitchConfig = await get(
      "/config.html?anchor=config&language=fr&mode=config&state=testing",
    );
    expect(twitchConfig.status).toBe(200);
    expect(twitchConfig.body).toContain("Configuration fixture");
  });
  it("answers Chrome private-network preflights for Twitch iframe assets only", async () => {
    const allowed = await get(
      "/config.html?anchor=config&mode=config",
      {
        Origin: "https://dashboard.twitch.tv",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Private-Network": "true",
      },
      "OPTIONS",
    );
    expect(allowed.status).toBe(204);
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://dashboard.twitch.tv",
    );
    expect(allowed.headers["access-control-allow-private-network"]).toBe(
      "true",
    );

    const denied = await get(
      "/config.html?anchor=config&mode=config",
      {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Private-Network": "true",
      },
      "OPTIONS",
    );
    expect(denied.status).toBe(403);
  });
  it("never forwards private, command, invitation, credentials or arbitrary filesystem routes", async () => {
    for (const p of [
      `/api/server/sessions/${id}/private`,
      `/api/server/sessions/${id}/private/events`,
      `/api/server/sessions/${id}/commands`,
      `/api/server/official-games`,
      `/../.env`,
      `/api/server/sessions/${id}/public?access=bad`,
    ])
      expect(
        (await get(p, { Authorization: `Bearer ${gmToken}` })).status,
      ).toBe(404);
    expect(
      (await get(`/api/server/sessions/${id}/public`, {}, "POST")).status,
    ).toBe(405);
    expect(
      allowedPublicPath(
        `/api/server/sessions/${id}/media/${randomUUID()}`,
        "?url=https://example.com",
      ),
    ).toBe(false);
  });
  it("returns identical anonymous public HTTP and SSE projections, even with an incoming GM bearer", async () => {
    const r = await get(`/api/server/sessions/${id}/public`, {
      Authorization: `Bearer ${gmToken}`,
      Cookie: "private=not-forwarded",
    });
    expect(r.status).toBe(200);
    const pub = JSON.parse(r.body);
    expect(pub.audience).toBe("public");
    expect(pub.undercoverBroadcast.mode).toBe("duo");
    expect(pub.undercoverBroadcast).not.toHaveProperty("assignments");
    expect(r.body).not.toContain(gmToken);
    expect(pub).not.toHaveProperty("game");
    expect(
      pub.publicGame.play.roster.every(
        (p: { role?: string }) => p.role === undefined,
      ),
    ).toBe(true);
    const s = await get(
      `/api/server/sessions/${id}/public/events`,
      {},
      "GET",
      true,
    );
    expect(s.status).toBe(200);
    const snapshot = JSON.parse(s.body.split("data: ")[1]!.split("\n\n")[0]!);
    expect(snapshot.view).toEqual(pub);
  });
  it("permits only the configured Twitch asset origin and explicit public preflights", async () => {
    const path = `/api/server/sessions/${id}/public`;
    expect((await get(path, { Origin: "https://evil.example" })).status).toBe(
      403,
    );
    const r = await get(path, {
      Origin: "https://testextension.ext-twitch.tv",
    });
    expect(r.headers["access-control-allow-origin"]).toBe(
      "https://testextension.ext-twitch.tv",
    );
    expect(r.headers["access-control-allow-credentials"]).toBeUndefined();
    expect(
      (
        await get(
          path,
          {
            Origin: "https://testextension.ext-twitch.tv",
            "access-control-request-method": "GET",
            "access-control-request-headers": "authorization",
          },
          "OPTIONS",
        )
      ).status,
    ).toBe(403);
    const p = await get(
      path,
      {
        Origin: "https://testextension.ext-twitch.tv",
        "access-control-request-method": "GET",
        "access-control-request-private-network": "true",
      },
      "OPTIONS",
    );
    expect(p.status).toBe(204);
    expect(p.headers["access-control-allow-private-network"]).toBe("true");
  });
});
