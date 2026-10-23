import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AddressInfo } from "node:net";
import { beforeEach, afterEach, it, expect, describe } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import { SessionService } from "../apps/server/src/session-service.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import {
  creatorGameSchema,
  studioViewSchema,
  type CreatorOperation,
  type StudioView,
} from "@extension-twitch/contracts/creator";
import {
  gmSessionSchema,
  sessionAccessSchema,
  sessionViewSchema,
} from "@extension-twitch/contracts/sessions";
const token = () => randomBytes(32).toString("base64url");
describe("private creator workspaces over real HTTP and SQLite", () => {
  let directory: string,
    store: SqliteStore,
    server: ReturnType<typeof createApp>,
    origin: string,
    owner: string,
    other: string,
    view: StudioView;
  async function start() {
    store = new SqliteStore(join(directory, "studio.sqlite"));
    server = createApp(new SessionService(store, "http://127.0.0.1:3000"));
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }
  async function stop() {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
    store.close();
  }
  const post = (
    path: string,
    credential: string,
    body: unknown,
    extra: Record<string, string> = {},
  ) =>
    fetch(`${origin}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credential}`,
        ...extra,
      },
      body: JSON.stringify(body),
    });
  const workspacePath = () => `/studio/workspaces/${view.workspace.id}`;
  async function cmd(
    operation: CreatorOperation,
    commandId = randomUUID(),
    expectedVersion = view.workspace.version,
  ) {
    return post(`${workspacePath()}/commands`, owner, {
      commandId,
      expectedVersion,
      operation,
    });
  }
  async function accepted(operation: CreatorOperation) {
    const response = await cmd(operation);
    expect(response.status).toBe(200);
    view = studioViewSchema.parse(await response.json());
    return view;
  }
  async function createDraft() {
    await accepted({
      type: "draft.fork",
      source: { gameId: view.catalog[0]!.identity.id, version: "0.1.0" },
      title: "Variante privée",
    });
    return view.workspace.games[0]!;
  }
  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), "xt-creator-"));
    owner = token();
    other = token();
    await start();
    const response = await post("/studio/workspaces", owner, {
      requestId: randomUUID(),
      name: "Mon atelier",
    });
    expect(response.status).toBe(201);
    view = studioViewSchema.parse(await response.json());
  });
  afterEach(async () => {
    await stop();
    rmSync(directory, { recursive: true, force: true });
  });
  it("requires a separate owner capability, rejects owner spoofing and untrusted origins, exposes no public library", async () => {
    const g = await createDraft();
    for (const credential of [null, other]) {
      const response = await fetch(`${origin}${workspacePath()}`, {
        headers: credential ? { Authorization: `Bearer ${credential}` } : {},
      });
      expect(response.status).toBe(401);
    }
    const forged = await post(`${workspacePath()}/commands`, other, {
      commandId: randomUUID(),
      expectedVersion: view.workspace.version,
      operation: {
        type: "draft.publish",
        gameId: g.identity.id,
        version: "1.0.0",
        rightsAttested: true,
      },
      ownerId: view.workspace.id,
    });
    expect(forged.status).toBe(400);
    expect(
      (
        await post(`${workspacePath()}/commands`, other, {
          commandId: randomUUID(),
          expectedVersion: view.workspace.version,
          operation: {
            type: "draft.publish",
            gameId: g.identity.id,
            version: "1.0.0",
            rightsAttested: true,
          },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await post(
          "/studio/workspaces",
          token(),
          { requestId: randomUUID(), name: "Non" },
          { Origin: "https://other.example" },
        )
      ).status,
    ).toBe(403);
    const publicResult = await fetch(`${origin}/games/${g.identity.id}`);
    expect(publicResult.status).toBe(404);
    expect(await publicResult.text()).not.toContain("Variante privée");
    expect(
      (
        await post("/studio/workspaces", token(), {
          requestId: randomUUID(),
          name: "Faux",
          ownerId: view.workspace.id,
        })
      ).status,
    ).toBe(400);
  });
  it("deduplicates creation and mutation, enforces conflicts and preserves published snapshots", async () => {
    const creatorToken = token(),
      input = { requestId: randomUUID(), name: "Reprise" };
    const first = studioViewSchema.parse(
      await (await post("/studio/workspaces", creatorToken, input)).json(),
    );
    expect(
      studioViewSchema.parse(
        await (await post("/studio/workspaces", creatorToken, input)).json(),
      ).workspace.id,
    ).toBe(first.workspace.id);
    const requestId = randomUUID(),
      version = view.workspace.version,
      operation = {
        type: "draft.create",
        title: "Guidé",
        mode: "guided",
        guide: {
          kind: "collective-counter",
          goal: 5,
          pointsMax: 3,
          multiplier: 2,
          oncePerPlayer: true,
        },
      } as const;
    const results = await Promise.all([
      cmd(operation, requestId, version),
      cmd(operation, requestId, version),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    view = studioViewSchema.parse(await results[0]!.json());
    expect(view.workspace.games).toHaveLength(1);
    expect(view.workspace.version).toBe(version + 1);
    expect(
      (await cmd({ ...operation, title: "Autre" }, requestId, version)).status,
    ).toBe(409);
    const game = view.workspace.games[0]!;
    expect(
      (
        await cmd(
          {
            type: "draft.publish",
            gameId: game.identity.id,
            version: "1.0.0",
            rightsAttested: true,
          },
          randomUUID(),
          version,
        )
      ).status,
    ).toBe(409);
    await accepted({
      type: "draft.publish",
      gameId: game.identity.id,
      version: "1.0.0",
      rightsAttested: true,
    });
    const release = structuredClone(view.workspace.games[0]!.releases[0]);
    const changed = structuredClone(view.workspace.games[0]!.draft.definition);
    changed.variables[0]!.value.initial = 17;
    await accepted({
      type: "draft.save",
      gameId: game.identity.id,
      definition: changed,
      metadata: game.draft.metadata,
      assets: game.draft.assets,
    });
    expect(view.workspace.games[0]!.releases[0]).toEqual(release);
    expect(
      (
        await cmd({
          type: "draft.publish",
          gameId: game.identity.id,
          version: "1.0.0",
          rightsAttested: true,
        })
      ).status,
    ).toBe(409);
  });
  it("restores drafts, versions, installations and receipts from disk without storing raw owner tokens", async () => {
    const game = await createDraft();
    await accepted({
      type: "draft.publish",
      gameId: game.identity.id,
      version: "1.0.0",
      rightsAttested: true,
    });
    const operation = {
      type: "library.install",
      source: { gameId: game.identity.id, version: "1.0.0" },
    } as const;
    const id = randomUUID(),
      version = view.workspace.version;
    const response = await cmd(operation, id, version);
    expect(response.status).toBe(200);
    view = studioViewSchema.parse(await response.json());
    await stop();
    const db = new DatabaseSync(join(directory, "studio.sqlite"));
    expect(db.prepare("PRAGMA user_version").get()?.user_version).toBe(2);
    db.close();
    expect(
      readFileSync(join(directory, "studio.sqlite")).toString(),
    ).not.toContain(owner);
    await start();
    const replay = await cmd(operation, id, version);
    expect(replay.status).toBe(200);
    const restored = studioViewSchema.parse(await replay.json());
    expect(restored).toEqual(view);
  });
  it("adds creator tables to a version-1 session database without losing legacy sessions", async () => {
    const gm = token();
    const created = sessionAccessSchema.parse(
      await (
        await post("/sessions", gm, {
          requestId: randomUUID(),
          title: "Avant Studio",
          hostName: "GM",
          gameId: "undercover",
        })
      ).json(),
    );
    await stop();
    const db = new DatabaseSync(join(directory, "studio.sqlite"));
    db.exec(
      "DROP TABLE creator_receipts; DROP TABLE creator_workspaces; PRAGMA user_version=1;",
    );
    db.close();
    await start();
    const response = await fetch(
      `${origin}/sessions/${created.sessionId}/private`,
      { headers: { Authorization: `Bearer ${gm}` } },
    );
    expect(response.status).toBe(200);
    expect(gmSessionSchema.parse(await response.json()).title).toBe(
      "Avant Studio",
    );
    expect(
      (
        await post("/studio/workspaces", other, {
          requestId: randomUUID(),
          name: "Après migration",
        })
      ).status,
    ).toBe(201);
  });
  it("pins a private draft for a real test without granting the library owner access to unrelated sessions", async () => {
    const game = await createDraft(),
      gm = token();
    const testInput = {
      requestId: randomUUID(),
      sessionToken: gm,
      gameId: game.identity.id,
      version: "draft",
    };
    const prepared = await post(
      `${workspacePath()}/test-sessions`,
      owner,
      testInput,
    );
    expect(prepared.status).toBe(201);
    const access = sessionAccessSchema.parse(await prepared.json());
    const sessionPath = `/sessions/${access.sessionId}`;
    expect(
      (
        await fetch(`${origin}${sessionPath}/private`, {
          headers: { Authorization: `Bearer ${owner}` },
        })
      ).status,
    ).toBe(401);
    const host = gmSessionSchema.parse(
      await (
        await fetch(`${origin}${sessionPath}/private`, {
          headers: { Authorization: `Bearer ${gm}` },
        })
      ).json(),
    );
    expect(host.preparedGame?.title).toBe("Variante privée");
    const publicBefore = sessionViewSchema.parse(
      await (await fetch(`${origin}${sessionPath}/public`)).json(),
    );
    expect(JSON.stringify(publicBefore)).not.toContain("preparedGame");
    const changed = structuredClone(game.draft.definition);
    changed.variables[0]!.value.initial = 55;
    await accepted({
      type: "draft.save",
      gameId: game.identity.id,
      definition: changed,
      metadata: game.draft.metadata,
      assets: game.draft.assets,
    });
    const player = token();
    const joined = await post(
      `/invitations/${host.invitationCode}/join`,
      player,
      { requestId: randomUUID(), name: "Nova" },
    );
    expect(joined.status).toBe(201);
    const rejected = await post(`${sessionPath}/commands`, player, {
      commandId: randomUUID(),
      expectedVersion: 2,
      command: { type: "game.use-prepared" },
    });
    expect(rejected.status).toBe(403);
    const configured = await post(`${sessionPath}/commands`, gm, {
      commandId: randomUUID(),
      expectedVersion: 2,
      command: { type: "game.use-prepared" },
    });
    expect(configured.status).toBe(200);
    const snapshot = gmSessionSchema.parse(await configured.json());
    expect(snapshot.game?.values.find((v) => v.id === "total")?.value).toBe(0);
    expect(
      view.workspace.games[0]!.draft.definition.variables[0]!.value.initial,
    ).toBe(55);
  });
  it("refuses unacknowledged rights and prepares only an allowlisted export manifest", async () => {
    const game = await createDraft();
    expect(
      (
        await post(`${workspacePath()}/commands`, owner, {
          commandId: randomUUID(),
          expectedVersion: view.workspace.version,
          operation: {
            type: "draft.publish",
            gameId: game.identity.id,
            version: "1.0.0",
            rightsAttested: false,
          },
        })
      ).status,
    ).toBe(400);
    await accepted({
      type: "draft.publish",
      gameId: game.identity.id,
      version: "1.0.0",
      rightsAttested: true,
    });
    const response = await post(`${workspacePath()}/manifest`, owner, {
      gameId: game.identity.id,
      version: "1.0.0",
    });
    expect(response.status).toBe(200);
    const serialized = JSON.stringify(await response.json());
    for (const forbidden of [
      owner,
      "binding",
      "configuration",
      "session",
      "invitationCode",
    ])
      expect(serialized).not.toContain(forbidden);
    expect(
      creatorGameSchema.parse(view.workspace.games[0]).releases,
    ).toHaveLength(1);
  });
  it("prepares a lobby title containing emoji without splitting a Unicode character", async () => {
    const game = await createDraft();
    const title = "a" + "🎮".repeat(20);
    await accepted({
      type: "draft.save",
      gameId: game.identity.id,
      definition: game.draft.definition,
      metadata: { ...game.draft.metadata, title },
      assets: game.draft.assets,
    });
    const gm = token();
    const response = await post(`${workspacePath()}/test-sessions`, owner, {
      requestId: randomUUID(),
      sessionToken: gm,
      gameId: game.identity.id,
      version: "draft",
    });
    expect(response.status).toBe(201);
    const access = sessionAccessSchema.parse(await response.json());
    const hostResponse = await fetch(
      `${origin}/sessions/${access.sessionId}/private`,
      { headers: { Authorization: `Bearer ${gm}` } },
    );
    expect(hostResponse.status).toBe(200);
    expect(gmSessionSchema.parse(await hostResponse.json()).title).toBe(
      "a" + "🎮".repeat(15),
    );
  });
  it("refuses preparing a different draft revision after a concurrent edit", async () => {
    const game = await createDraft();
    const revision = game.draft.revision;
    await accepted({
      type: "draft.save",
      gameId: game.identity.id,
      definition: game.draft.definition,
      metadata: { ...game.draft.metadata, title: "Autre édition" },
      assets: game.draft.assets,
    });
    const request = {
      requestId: randomUUID(),
      sessionToken: token(),
      gameId: game.identity.id,
      version: "draft",
      draftRevision: revision,
    };
    const rejected = await post(
      `${workspacePath()}/test-sessions`,
      owner,
      request,
    );
    expect(rejected.status).toBe(409);
    const acceptedTest = await post(`${workspacePath()}/test-sessions`, owner, {
      ...request,
      draftRevision: revision + 1,
    });
    expect(acceptedTest.status).toBe(201);
    const access = sessionAccessSchema.parse(await acceptedTest.json());
    const response = await fetch(
      `${origin}/sessions/${access.sessionId}/private`,
      { headers: { Authorization: `Bearer ${request.sessionToken}` } },
    );
    expect(
      gmSessionSchema.parse(await response.json()).preparedGame?.title,
    ).toBe("Autre édition");
  });
});
