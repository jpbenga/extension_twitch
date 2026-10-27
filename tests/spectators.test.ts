import { randomUUID, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { it, expect } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import { SessionService } from "../apps/server/src/session-service.js";
import {
  readOnlySpectators,
  spectatorCapabilitiesSchema,
} from "@extension-twitch/contracts/spectators";
it("discovers actual read-only spectator permissions without exposing a private preparation or accepting a fake interaction", async () => {
  const dir = mkdtempSync(join(tmpdir(), "xt-spectators-")),
    store = new SqliteStore(join(dir, "db.sqlite")),
    service = new SessionService(store, "http://127.0.0.1:3000"),
    server = createApp(service);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const token = randomBytes(32).toString("base64url");
    const { sessionId } = service.create(token, {
      requestId: randomUUID(),
      title: "Session",
      hostName: "GM",
      gameId: "undercover",
    });
    const path = `${origin}/sessions/${sessionId}/spectator-interactions`;
    const response = await fetch(path);
    expect(response.status).toBe(200);
    const data = spectatorCapabilitiesSchema.parse(await response.json());
    expect(data).toEqual(readOnlySpectators);
    expect(JSON.stringify(data)).not.toContain(token);
    expect(
      (
        await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "twitch-bits",
            paid: true,
            actionId: "vote",
          }),
        })
      ).status,
    ).toBe(404);
    expect(
      (await fetch(`${origin}/sessions/${randomUUID()}/spectator-interactions`))
        .status,
    ).toBe(404);
  } finally {
    await new Promise<void>((r) => {
      server.close(() => r());
      server.closeAllConnections();
    });
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
it("does not let a client manufacture a supported spectator action or a connected Twitch status", () => {
  expect(
    spectatorCapabilitiesSchema.safeParse({
      ...readOnlySpectators,
      actions: [{ id: "vote" }],
    }).success,
  ).toBe(false);
  expect(
    spectatorCapabilitiesSchema.safeParse({
      ...readOnlySpectators,
      nativeTwitch: "connected",
    }).success,
  ).toBe(false);
});
