import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import { SessionService } from "../apps/server/src/session-service.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import { answerBox, collectivePulse } from "@extension-twitch/engine";
import {
  gmSessionSchema,
  sessionAccessSchema,
  sessionViewSchema,
  sessionStreamEventSchema,
  type LobbyAction,
} from "@extension-twitch/contracts/sessions";
const credential = () => randomBytes(32).toString("base64url");

describe("configurable runs on the existing session transport", () => {
  let store: SqliteStore,
    server: ReturnType<typeof createApp>,
    origin: string,
    id: string,
    directory: string;
  let gm: string, p1: string, p2: string, playerId: string;
  const controllers: AbortController[] = [];
  async function start() {
    store = new SqliteStore(join(directory, "sessions.sqlite"));
    server = createApp(new SessionService(store, "http://127.0.0.1:3000"), {
      legacyTools: true,
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }
  async function stop() {
    controllers.splice(0).forEach((c) => c.abort());
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
    store.close();
  }
  const post = (path: string, token: string, value: unknown) =>
    fetch(`${origin}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(value),
    });
  async function view(token: string | null = gm) {
    const response = await fetch(
      `${origin}/sessions/${id}/${token === null ? "public" : "private"}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    expect(response.status).toBe(200);
    return sessionViewSchema.parse(await response.json());
  }
  async function command(
    token: string,
    command: LobbyAction,
    commandId = randomUUID(),
    version?: number,
  ) {
    return post(`/sessions/${id}/commands`, token, {
      commandId,
      expectedVersion: version ?? (await view()).version,
      command,
    });
  }
  async function action(
    token: string,
    actionId: string,
    parameters: Record<string, string | number | boolean> = {},
  ) {
    const v = await view();
    return command(token, {
      type: "game.action",
      runId: v.publicGame!.runId,
      actionId,
      parameters,
    });
  }
  async function configure(definition = answerBox) {
    expect(
      (
        await command(gm, {
          type: "game.configure",
          definition,
          configuration: {},
          assets: [],
        })
      ).status,
    ).toBe(200);
  }
  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), "xt-generic-"));
    await start();
    gm = credential();
    p1 = credential();
    p2 = credential();
    id = sessionAccessSchema.parse(
      await (
        await post("/sessions", gm, {
          requestId: randomUUID(),
          title: "Générique",
          hostName: "GM",
          gameId: "undercover",
        })
      ).json(),
    ).sessionId;
    const gmView = gmSessionSchema.parse(await view());
    const joinPlayer = async (token: string, name: string) =>
      sessionAccessSchema.parse(
        await (
          await post(`/invitations/${gmView.invitationCode}/join`, token, {
            requestId: randomUUID(),
            name,
          })
        ).json(),
      );
    await joinPlayer(p1, "Nova");
    playerId = (await joinPlayer(p2, "Atlas")).participantId!;
  });
  afterEach(async () => {
    await stop();
    rmSync(directory, { recursive: true, force: true });
  });

  it("rejects player configuration and role escalation; preserves legacy lobby semantics before installation", async () => {
    expect(
      (
        await command(p1, {
          type: "game.configure",
          definition: collectivePulse,
          configuration: {},
          assets: [],
        })
      ).status,
    ).toBe(403);
    expect(
      (await command(p1, { type: "participant.ready", ready: true })).status,
    ).toBe(200);
    expect((await view()).publicGame).toBeUndefined();
    await configure();
    expect(
      (
        await command(p1, {
          type: "game.assign-role",
          participantId: playerId,
          roleId: "reviewer",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await command(gm, {
          type: "game.assign-role",
          participantId: playerId,
          roleId: "host",
        })
      ).status,
    ).toBe(400);
    const gmView = gmSessionSchema.parse(await view());
    expect(
      (
        await post(`/invitations/${gmView.invitationCode}/join`, credential(), {
          requestId: randomUUID(),
          name: "Late",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await command(gm, {
          type: "participant.remove",
          participantId: playerId,
        })
      ).status,
    ).toBe(409);
  });
  it("runs private answers, custom roles, declarative phases and explicit reveal over HTTP", async () => {
    await configure();
    expect(
      (await action(p1, "answer", { text: "Secret individuel" })).status,
    ).toBe(403);
    await command(gm, {
      type: "game.assign-role",
      participantId: playerId,
      roleId: "reviewer",
    });
    await action(gm, "open");
    expect((await action(p2, "answer", { text: "Forbidden" })).status).toBe(
      403,
    );
    expect(
      (await action(p1, "answer", { text: "Secret individuel" })).status,
    ).toBe(200);
    for (const token of [null, p2])
      expect(JSON.stringify(await view(token))).not.toContain(
        "Secret individuel",
      );
    expect(JSON.stringify(await view(p1))).toContain("Secret individuel");
    const host = await view();
    expect(host.publicGame?.values.some((v) => v.id === "answer")).toBe(false);
    expect(JSON.stringify(host.events)).not.toContain("Secret individuel");
    await action(gm, "review");
    expect((await action(gm, "reveal")).status).toBe(403);
    await action(p2, "approve");
    await action(gm, "reveal");
    const publicView = await view(null);
    expect(publicView.publicGame?.phase.id).toBe("revealed");
    expect(JSON.stringify(publicView)).toContain("Secret individuel");
    expect(JSON.stringify(publicView)).not.toContain("production-note");
    expect(publicView.publicGame?.management).toBeUndefined();
  });
  it("retains the pinned run, private values and receipts after reopening SQLite, rejects old run commands after replay", async () => {
    await configure(collectivePulse);
    await action(gm, "open");
    const before = await view();
    const envelope = {
      type: "game.action" as const,
      runId: before.publicGame!.runId,
      actionId: "contribute",
      parameters: { amount: 3 },
    };
    const commandId = randomUUID();
    const results = await Promise.all([
      command(p1, envelope, commandId, before.version),
      command(p1, envelope, commandId, before.version),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect((await view()).version).toBe(before.version + 1);
    await stop();
    await start();
    expect(
      (await view()).publicGame?.values.find((v) => v.id === "total")?.value,
    ).toBe(3);
    expect(store.load(id).gameRun?.definition.version).toBe("0.1.0");
    expect(
      (await command(p1, envelope, commandId, before.version)).status,
    ).toBe(200);
    expect((await view()).version).toBe(before.version + 1);
    await command(gm, {
      type: "game.restart",
      runId: before.publicGame!.runId,
    });
    expect((await command(p1, envelope)).status).toBe(409);
    expect(
      (await view()).publicGame?.values.find((v) => v.id === "total")?.value,
    ).toBe(0);
    expect((await view(p1)).audience).toBe("player");
    await command(gm, { type: "session.reset" });
    expect((await view()).publicGame).toBeUndefined();
    expect((await view()).participants).toHaveLength(0);
    expect(
      (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${p1}` },
        })
      ).status,
    ).toBe(401);
  });
  it("publishes the generic action to public SSE and recovers the latest projection on reconnect", async () => {
    await configure(collectivePulse);
    await action(gm, "open");
    async function streamUntilTotal(total: number) {
      const controller = new AbortController();
      controllers.push(controller);
      const response = await fetch(`${origin}/sessions/${id}/public/events`, {
        signal: controller.signal,
      });
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        while (true) {
          buffer += decoder.decode((await reader.read()).value, {
            stream: true,
          });
          let boundary: number;
          while ((boundary = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            if (!frame.startsWith("data: ")) continue;
            const event = sessionStreamEventSchema.parse(
              JSON.parse(frame.slice(6)) as unknown,
            );
            if (
              event.type === "session.snapshot" &&
              event.view.publicGame?.values.find((v) => v.id === "total")
                ?.value === total
            )
              return event.view;
          }
        }
      } finally {
        clearTimeout(timeout);
        controller.abort();
      }
    }
    const next = streamUntilTotal(2);
    await action(p1, "contribute", { amount: 2 });
    expect((await next).publicGame?.actions).toEqual([]);
    expect(
      (await streamUntilTotal(2)).publicGame?.values.find(
        (v) => v.id === "total",
      )?.value,
    ).toBe(2);
  });
});
