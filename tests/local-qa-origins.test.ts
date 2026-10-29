import { describe, it, expect } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { localQaBrowserOrigins } from "../apps/server/src/local-browser-origins.js";
import { createApp } from "../apps/server/src/app.js";
import { SessionService } from "../apps/server/src/session-service.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";

const lan = "http://192.168.1.42:3000";
const optIn = { LOCAL_QA_LOOPBACK_ORIGINS: "1" };
describe("explicit local QA browser origins", () => {
  it("enables only the two exact loopback origins at the configured web port", () => {
    expect(localQaBrowserOrigins(lan, optIn)).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]);
    expect(localQaBrowserOrigins("http://10.0.0.2:3100", optIn)).toEqual([
      "http://localhost:3100",
      "http://127.0.0.1:3100",
    ]);
  });
  it.each([
    {},
    { LOCAL_QA_LOOPBACK_ORIGINS: "0" },
    { ...optIn, NODE_ENV: "production" },
    { ...optIn, SERVER_HOST: "0.0.0.0" },
    { ...optIn, SERVER_HOST: "192.168.1.42" },
  ])(
    "keeps the strict origin policy without a safe development opt-in: %j",
    (env) => {
      expect(localQaBrowserOrigins(lan, env)).toEqual([]);
    },
  );
  it.each([
    "https://studio.example",
    "https://192.168.1.42:3000",
    "http://studio.example",
    "http://10.attacker.example:3000",
  ])("does not enable aliases for %s", (origin) => {
    expect(localQaBrowserOrigins(origin, optIn)).toEqual([]);
  });
});

for (const enabled of [false, true])
  it(`real mutations ${enabled ? "accept" : "reject"} localhost while preserving the canonical LAN links and access checks`, async () => {
    const store = new SqliteStore(":memory:");
    const server = createApp(new SessionService(store, lan), {
      additionalMutationOrigins: enabled
        ? localQaBrowserOrigins(lan, optIn)
        : [],
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const api = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const token = randomBytes(32).toString("base64url");
    const body = { requestId: randomUUID(), settings: {} };
    const create = (origin: string, value = body) =>
      fetch(`${api}/official-games/undercover/sessions`, {
        method: "POST",
        headers: {
          Origin: origin,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      });
    try {
      const result = await create("http://localhost:3000");
      expect(result.status).toBe(enabled ? 201 : 403);
      expect(result.headers.get("access-control-allow-origin")).toBeNull();
      if (!enabled)
        expect(await result.json()).toEqual({ error: "ORIGIN_DENIED" });
      const canonical = await create(lan);
      expect(canonical.status).toBe(201);
      const { sessionId } = await canonical.json();
      const view = await (
        await fetch(`${api}/sessions/${sessionId}/private`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json();
      expect(view.publicUrl).toBe(`${lan}/sessions/${sessionId}/public`);
      expect(view.joinUrl).toMatch(/^http:\/\/192\.168\.1\.42:3000\/join\//);
      expect(view.participants).toHaveLength(0);
      expect(view.game).toBeUndefined();
      if (enabled)
        expect((await create("http://127.0.0.1:3000")).status).toBe(201);
      for (const hostile of [
        "http://localhost:3001",
        "https://localhost:3000",
        "http://localhost.attacker.example:3000",
        "http://192.168.1.99:3000",
        "http://0.0.0.0:3000",
        "null",
      ])
        expect((await create(hostile)).status).toBe(403);
      const denied = await fetch(`${api}/sessions/${sessionId}/commands`, {
        method: "POST",
        headers: {
          Origin: enabled ? "http://localhost:3000" : lan,
          Authorization: `Bearer ${randomBytes(32).toString("base64url")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commandId: randomUUID(),
          expectedVersion: view.version,
          command: { type: "session.admission", open: false },
        }),
      });
      expect(denied.status).toBe(401);
      expect((await denied.json()).error).toBe("ACCESS_DENIED");
    } finally {
      await new Promise<void>((r) => {
        server.close(() => r());
        server.closeAllConnections();
      });
      store.close();
    }
  });
