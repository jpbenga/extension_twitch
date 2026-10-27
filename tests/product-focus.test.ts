import { createUndercoverLayout } from "@extension-twitch/contracts/undercover-layout";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import { CreatorService } from "../apps/server/src/creator-service.js";
import {
  SessionService,
  hashValue,
} from "../apps/server/src/session-service.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import { undercoverDefinition } from "@extension-twitch/game-undercover/definition";
import { undercoverLegacyDefinition } from "@extension-twitch/game-undercover/definition";
import {
  officialCatalogSchema,
  undercoverSettingsSchema,
} from "@extension-twitch/contracts/official-games";
import {
  gmSessionSchema,
  sessionAccessSchema,
  publicSessionSchema,
} from "@extension-twitch/contracts/sessions";

const token = () => randomBytes(32).toString("base64url");
describe("closed official product API, preserving the legacy engine and data", () => {
  let dir: string,
    store: SqliteStore,
    service: SessionService,
    server: ReturnType<typeof createApp>,
    origin: string;
  const owner = token();
  async function start() {
    store = new SqliteStore(join(dir, "data.sqlite"));
    service = new SessionService(store, "http://127.0.0.1:3000");
    server = createApp(service);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }
  async function stop() {
    await new Promise<void>((r) => {
      server.close(() => r());
      server.closeAllConnections();
    });
    store.close();
  }
  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "xt-product-"));
    await start();
  });
  afterEach(async () => {
    await stop();
    rmSync(dir, { recursive: true, force: true });
  });
  const post = (path: string, body: unknown, access = owner) =>
    fetch(origin + path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  async function prepare(settings: unknown = {}, requestId = randomUUID()) {
    const response = await post("/official-games/undercover/sessions", {
      requestId,
      settings,
    });
    expect(response.status).toBe(201);
    return sessionAccessSchema.parse(await response.json());
  }
  async function gm(id: string) {
    return gmSessionSchema.parse(
      await (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${owner}` },
        })
      ).json(),
    );
  }
  async function joinPlayers(id: string) {
    const view = await gm(id);
    for (let i = 0; i < 3; i++) {
      const response = await post(
        `/invitations/${view.invitationCode}/join`,
        { requestId: randomUUID(), name: `Joueur ${i + 1}` },
        token(),
      );
      expect(response.status).toBe(201);
    }
  }
  async function install(id: string, configuration?: Record<string, unknown>) {
    const view = await gm(id);
    return post(`/sessions/${id}/commands`, {
      commandId: randomUUID(),
      expectedVersion: view.version,
      command: {
        type: "game.use-prepared",
        ...(configuration ? { configuration } : {}),
      },
    });
  }
  it("pins the public broadcast theme independently of layout edits and restores it through replay and restart", async () => {
    const requestId = randomUUID(),
      payload = { requestId, settings: {}, broadcastTheme: "on-air-premium" };
    const created = await post("/official-games/undercover/sessions", payload);
    expect(created.status).toBe(201);
    const { sessionId: id } = sessionAccessSchema.parse(await created.json());
    expect((await gm(id)).broadcastTheme).toBe("on-air-premium");
    expect(
      (
        await post("/official-games/undercover/sessions", {
          ...payload,
          broadcastTheme: "neon-show",
        })
      ).status,
    ).toBe(409);
    await joinPlayers(id);
    await install(id);
    let view = await gm(id);
    expect(
      (
        await post(`/sessions/${id}/commands`, {
          commandId: randomUUID(),
          expectedVersion: view.version,
          command: {
            type: "overlay.configure",
            layout: createUndercoverLayout(),
          },
        })
      ).status,
    ).toBe(200);
    view = await gm(id);
    expect(
      (
        await post(`/sessions/${id}/commands`, {
          commandId: randomUUID(),
          expectedVersion: view.version,
          command: { type: "game.restart", runId: view.game!.runId },
        })
      ).status,
    ).toBe(200);
    await stop();
    await start();
    const publicView = publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
    expect(publicView.broadcastTheme).toBe("on-air-premium");
    expect(JSON.stringify(publicView)).not.toMatch(
      /Phare|Fusée|invitationCode|preparedGame/,
    );
    for (const broadcastTheme of ["custom", { css: "background:red" }])
      expect(
        (
          await post("/official-games/undercover/sessions", {
            requestId: randomUUID(),
            settings: {},
            broadcastTheme,
          })
        ).status,
      ).toBe(400);
  });
  it("persists a layout seed and GM updates with normal receipts, SSE projections and conflict protection", async () => {
    const layout = createUndercoverLayout("bottom");
    const requestId = randomUUID();
    const payload = { requestId, settings: {}, overlayLayout: layout };
    const first = await post("/official-games/undercover/sessions", payload);
    expect(first.status).toBe(201);
    const { sessionId: id } = sessionAccessSchema.parse(await first.json());
    expect(
      await (await post("/official-games/undercover/sessions", payload)).json(),
    ).toEqual({ sessionId: id });
    await joinPlayers(id);
    await install(id);
    const view = await gm(id),
      runId = view.game!.runId;
    expect(view.overlayLayout).toEqual(layout);
    const changed = createUndercoverLayout("lateral");
    const command = {
      commandId: randomUUID(),
      expectedVersion: view.version,
      command: { type: "overlay.configure", layout: changed },
    };
    const playerToken = token();
    // A real player from another new party cannot claim a GM operation here.
    expect(
      (await post(`/sessions/${id}/commands`, command, playerToken)).status,
    ).toBe(401);
    const publicViews: unknown[] = [];
    const unsub = service.subscribe(id, null, (m) => {
      if (m.type === "session.snapshot") publicViews.push(m.view);
    });
    try {
      expect((await post(`/sessions/${id}/commands`, command)).status).toBe(
        200,
      );
      const version = (await gm(id)).version;
      expect((await post(`/sessions/${id}/commands`, command)).status).toBe(
        200,
      );
      expect((await gm(id)).version).toBe(version);
      expect(
        (
          await post(`/sessions/${id}/commands`, {
            ...command,
            commandId: randomUUID(),
          })
        ).status,
      ).toBe(409);
      expect(
        publicSessionSchema.parse(publicViews.at(-1)).overlayLayout,
      ).toEqual(changed);
      expect(JSON.stringify(publicViews)).not.toMatch(
        /Phare|Fusée|invitationCode|preparedGame/,
      );
    } finally {
      unsub();
    }
    await stop();
    await start();
    expect((await gm(id)).overlayLayout).toEqual(changed);
    expect((await gm(id)).game!.runId).toBe(runId);
    const restored = await gm(id);
    expect(
      (
        await post(`/sessions/${id}/commands`, {
          commandId: randomUUID(),
          expectedVersion: restored.version,
          command: { type: "game.restart", runId },
        })
      ).status,
    ).toBe(200);
    expect((await gm(id)).overlayLayout).toEqual(changed);
  });
  it("refuses a real player's layout command and validates malformed layouts before mutation", async () => {
    const { sessionId: id } = await prepare();
    const view = await gm(id),
      playerToken = token();
    await post(
      `/invitations/${view.invitationCode}/join`,
      { requestId: randomUUID(), name: "Player" },
      playerToken,
    );
    const next = await gm(id),
      layout = createUndercoverLayout();
    const command = {
      commandId: randomUUID(),
      expectedVersion: next.version,
      command: { type: "overlay.configure", layout },
    };
    expect(
      (await post(`/sessions/${id}/commands`, command, playerToken)).status,
    ).toBe(403);
    expect(
      (
        await post(`/sessions/${id}/commands`, {
          ...command,
          command: {
            ...command.command,
            layout: { ...layout, css: "arbitrary" },
          },
        })
      ).status,
    ).toBe(400);
    expect((await gm(id)).version).toBe(next.version);
    expect((await gm(id)).overlayLayout).toBeUndefined();
  });
  it("exposes only actual official availability, never pedagogical examples or definitions", async () => {
    const catalog = officialCatalogSchema.parse(
      await (await fetch(origin + "/official-games")).json(),
    );
    expect(catalog.map((g) => g.id)).toEqual(["undercover", "auctions", "spy"]);
    expect(
      catalog
        .filter((g) => g.availability === "playable-demo")
        .map((g) => g.id),
    ).toEqual(["undercover"]);
    expect(JSON.stringify(catalog)).not.toContain('"definition"');
    expect((await fetch(origin + "/game-examples")).status).toBe(404);
  });
  it("validates a bounded strict settings model and two clue rounds by default", () => {
    expect(undercoverSettingsSchema.parse({})["clue-rounds"]).toBe(2);
    for (const bad of [
      { "clue-rounds": 0 },
      { "clue-rounds": 6 },
      { "clue-rounds": 1.5 },
      { "civil-word": " " },
      { "civil-word": "ＰＨＡＲＥ", "undercover-word": "phare" },
      { "round-limit": 31 },
      { "undercover-count": 0 },
      { rules: [] },
      { "civil-word": "x".repeat(81) },
    ])
      expect(undercoverSettingsSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects settings and definition injection before creating a session", async () => {
    for (const body of [
      { requestId: randomUUID(), settings: { variables: [] } },
      { requestId: randomUUID(), settings: { "clue-rounds": 9 } },
      {
        requestId: randomUUID(),
        settings: {},
        definition: undercoverDefinition,
      },
    ])
      expect(
        (await post("/official-games/undercover/sessions", body)).status,
      ).toBe(400);
    expect(
      (
        await post("/official-games/auctions/sessions", {
          requestId: randomUUID(),
          settings: {},
        })
      ).status,
    ).toBe(404);
  });
  it("keeps the official launch independent of workspaces and honors exact retry receipts", async () => {
    const requestId = randomUUID();
    const first = await prepare({}, requestId);
    expect(await prepare({}, requestId)).toEqual(first);
    expect(
      (
        await post("/official-games/undercover/sessions", {
          requestId,
          settings: { "clue-rounds": 3 },
        })
      ).status,
    ).toBe(409);
    expect((await post("/studio/workspaces", { name: "hidden" })).status).toBe(
      404,
    );
    expect(store.load(first.sessionId).preparedGame?.definition.version).toBe(
      "0.2.0",
    );
  });
  it("pins authorized settings through restart, refuses overrides and never projects private words", async () => {
    const { sessionId: id } = await prepare({
      "civil-word": "SECRETCIVIL",
      "undercover-word": "SECRETINTRUS",
      "clue-rounds": 3,
    });
    await stop();
    await start();
    await joinPlayers(id);
    expect((await install(id, { "clue-rounds": 1 })).status).toBe(400);
    expect((await install(id, { arbitrary: 1 })).status).toBe(400);
    expect((await install(id)).status).toBe(200);
    const run = store.load(id).gameRun!;
    expect(run.configuration["clue-rounds"]).toBe(3);
    const pub = publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
    expect(JSON.stringify(pub)).not.toMatch(/SECRETCIVIL|SECRETINTRUS/);
  });
  it("blocks arbitrary configuration through the public API, preserving existing gameplay", async () => {
    const { sessionId: id } = await prepare();
    await joinPlayers(id);
    const view = await gm(id);
    expect(
      (
        await post(`/sessions/${id}/commands`, {
          commandId: randomUUID(),
          expectedVersion: view.version,
          command: {
            type: "game.configure",
            definition: undercoverDefinition,
            configuration: {},
            assets: [],
          },
        })
      ).status,
    ).toBe(403);
    expect((await install(id)).status).toBe(200);
  });
  it("requires GM authorization and validates the real roster on installation", async () => {
    const { sessionId: id } = await prepare({ "undercover-count": 2 });
    expect((await gm(id)).preparedGame).toMatchObject({
      minimumPlayers: 5,
      maximumPlayers: 12,
    });
    await joinPlayers(id);
    expect((await install(id)).status).toBe(400);
    expect(
      (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${token()}` },
        })
      ).status,
    ).toBe(401);
  });
  it("preserves an old private library across restart while the product refuses its editing endpoints", async () => {
    const historical = new CreatorService(store, service).create(owner, {
      name: "Bibliothèque historique",
      requestId: randomUUID(),
    });
    const id = historical.workspace.id;
    await stop();
    await start();
    expect(store.loadStudio(id, hashValue(owner))).toEqual(
      historical.workspace,
    );
    expect(
      (
        await fetch(`${origin}/studio/workspaces/${id}`, {
          headers: { Authorization: `Bearer ${owner}` },
        })
      ).status,
    ).toBe(404);
    expect(store.loadStudio(id, hashValue(owner))).toEqual(
      historical.workspace,
    );
  });
  it("restores a historical frozen game without enabling creation APIs or rewriting its rules", async () => {
    const { sessionId: id } = service.create(
      owner,
      {
        requestId: randomUUID(),
        title: "Ancienne partie",
        hostName: "GM",
        gameId: "undercover",
      },
      { definition: undercoverLegacyDefinition, assets: [] },
    );
    await joinPlayers(id);
    expect((await install(id)).status).toBe(200);
    await stop();
    await start();
    const view = await gm(id);
    expect(view.game?.definitionVersion).toBe("0.1.0");
    expect(view.game?.play?.turns).toBeUndefined();
    const response = await post(`/sessions/${id}/commands`, {
      commandId: randomUUID(),
      expectedVersion: view.version,
      command: {
        type: "game.action",
        runId: view.game!.runId,
        actionId: "deal",
        parameters: {},
      },
    });
    expect(response.status).toBe(200);
    expect(store.load(id).gameRun?.definition.version).toBe("0.1.0");
  });
});
