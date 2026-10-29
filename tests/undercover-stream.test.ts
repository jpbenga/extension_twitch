import { randomBytes, randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import {
  SessionService,
  hashValue,
} from "../apps/server/src/session-service.js";
import {
  TemporaryMediaRelay,
  validateTemporaryPng,
} from "../apps/server/src/temporary-media.js";
import { prepareOfficialSession } from "../apps/server/src/official-games.js";
import { createUndercoverTvLayout } from "@extension-twitch/contracts/undercover-layout";
import { undercoverSettingsSchema } from "@extension-twitch/contracts/official-games";
import {
  undercoverBroadcastSchema,
  UNDERCOVER_MEDIA_TTL_MS,
} from "@extension-twitch/contracts/undercover-stream";
import {
  gmSessionSchema,
  playerSessionSchema,
  publicSessionSchema,
  type LobbyAction,
  type GmSessionView,
} from "@extension-twitch/contracts/sessions";
const token = () => randomBytes(32).toString("base64url");
const crc = (b: Buffer) => {
  let c = 0xffffffff;
  for (const v of b) {
    c ^= v;
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(kind: string, data: Buffer) {
  const b = Buffer.alloc(data.length + 12);
  b.writeUInt32BE(data.length);
  b.write(kind, 4);
  data.copy(b, 8);
  b.writeUInt32BE(crc(b.subarray(4, -4)), b.length - 4);
  return b;
}
function png(w = 2, h = 2) {
  const head = Buffer.alloc(13);
  head.writeUInt32BE(w);
  head.writeUInt32BE(h, 4);
  head[8] = 8;
  head[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", head),
    chunk("IDAT", deflateSync(Buffer.alloc((w * 4 + 1) * h))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("bounded temporary media", () => {
  it("decodes bounded normalized PNG and rejects HTML, truncation, bad checksums and oversized dimensions", () => {
    expect(validateTemporaryPng(png())).toEqual({ width: 2, height: 2 });
    for (const value of [
      Buffer.from('<svg onload="alert(1)"></svg>'),
      png().subarray(0, -1),
      Buffer.from(png()),
    ]) {
      if (value.length === png().length) value[40] = value[40]! ^ 1;
      expect(() => validateTemporaryPng(value)).toThrow();
    }
    expect(() => validateTemporaryPng(png(1601, 1))).toThrow("IMAGE_TOO_LARGE");
  });
  it("expires and cleans memory without reviving on read; a fresh upload reconnects", () => {
    let now = 100;
    const expired: string[] = [];
    const relay = new TemporaryMediaRelay(
      (id) => expired.push(id),
      () => now,
    );
    relay.put("session", "content", png());
    expect(relay.get("session", "content")).toBeDefined();
    now += UNDERCOVER_MEDIA_TTL_MS;
    expect(relay.get("session", "content")).toBeUndefined();
    relay.sweep();
    expect(expired).toEqual(["session"]);
    relay.put("session", "content", png());
    expect(relay.get("session", "content")).toBeDefined();
    relay.clearSession("session");
    expect(relay.get("session", "content")).toBeUndefined();
    relay.close();
  });
  it("anonymous schema structurally rejects a hidden mapping", () => {
    expect(
      undercoverBroadcastSchema.safeParse({
        mode: "none",
        revision: 0,
        page: 0,
        transition: false,
        assignments: [],
      }).success,
    ).toBe(false);
    expect(
      undercoverBroadcastSchema.safeParse({
        mode: "duo",
        revision: 0,
        page: 0,
        transition: false,
        contents: [
          { id: randomUUID(), label: "A" },
          { id: randomUUID(), label: "B" },
        ],
        assignments: [],
      }).success,
    ).toBe(false);
  });
});

describe("Undercover preparation, publication and media over real HTTP/SSE", () => {
  let service: SessionService,
    store: SqliteStore,
    server: ReturnType<typeof createApp>,
    origin: string,
    id: string,
    gmToken: string,
    gm: GmSessionView,
    dir: string;
  let players: { id: string; token: string }[] = [];
  const controllers: AbortController[] = [];
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  async function post(path: string, t: string, body: unknown) {
    return fetch(origin + path, {
      method: "POST",
      headers: { ...auth(t), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  async function view(t = gmToken) {
    return gmSessionSchema.parse(
      await (
        await fetch(`${origin}/sessions/${id}/private`, { headers: auth(t) })
      ).json(),
    );
  }
  async function cmd(action: LobbyAction, t = gmToken) {
    return post(`/sessions/${id}/commands`, t, {
      commandId: randomUUID(),
      expectedVersion: (await view()).version,
      command: action,
    });
  }
  async function accepted(action: LobbyAction) {
    const r = await cmd(action);
    expect(r.status, await r.clone().text()).toBe(200);
    gm = await view();
    return r;
  }
  async function act(
    actionId: string,
    t = gmToken,
    parameters: Record<string, string> = {},
  ) {
    const r = await cmd(
      { type: "game.action", runId: gm.game!.runId, actionId, parameters },
      t,
    );
    expect(r.status, await r.clone().text()).toBe(200);
    gm = await view();
  }
  async function publicView() {
    return publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
  }
  const nextRef = () => ({
    id: randomUUID(),
    title: "Future privée introuvable publiquement",
    series: { ...gm.undercoverPreparation!.series, position: 2 },
  });
  const settings = undercoverSettingsSchema.parse({
    "civil-word": "Contenu-courant-A",
    "undercover-word": "Contenu-courant-B",
  });
  async function finish() {
    while (!gm.game!.play!.turns!.complete) await act("confirm-clue");
    await act("open-vote");
    const assignments = store.load(id).gameRun!.assignments;
    const target = players.find((p) => assignments[p.id] === "undercover")!;
    for (const p of players)
      await act("vote", p.token, {
        target:
          p.id === target.id
            ? players.find((q) => q.id !== p.id)!.id
            : target.id,
      });
    await act("resolve");
    expect(gm.game!.play!.outcome).toBeDefined();
  }
  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "xt-stream-"));
    store = new SqliteStore(join(dir, "state.sqlite"));
    service = new SessionService(store, "http://127.0.0.1:3000");
    server = createApp(service);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    gmToken = token();
    const ref = {
      id: randomUUID(),
      title: "Ma paire privée",
      series: {
        id: randomUUID(),
        title: "Mon conducteur privé",
        position: 1,
        total: 2,
      },
    };
    const r = await post("/official-games/undercover/sessions", gmToken, {
      requestId: randomUUID(),
      settings,
      preparation: ref,
    });
    expect(r.status).toBe(201);
    id = (await r.json()).sessionId;
    gm = await view();
    players = [];
    for (let i = 0; i < 3; i++) {
      const t = token(),
        r = await post(`/invitations/${gm.invitationCode}/join`, t, {
          requestId: randomUUID(),
          name: `Invité ${i + 1}`,
        });
      players.push({ token: t, id: (await r.json()).participantId });
    }
    gm = await view();
  });
  afterEach(async () => {
    controllers.splice(0).forEach((c) => c.abort());
    await new Promise<void>((r) => {
      server.close(() => r());
      server.closeAllConnections();
    });
    service.shutdown();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  it("pins only current metadata, creates no demo identities itself and prevents a second salon for one series", async () => {
    expect(gm.game).toBeUndefined();
    expect(gm.undercoverPreparation!.title).toBe("Ma paire privée");
    const r = await post("/official-games/undercover/sessions", gmToken, {
      requestId: randomUUID(),
      settings,
      preparation: nextRef(),
    });
    expect(r.status).toBe(409);
    const pub = await publicView();
    expect(pub.undercoverBroadcast).toEqual({
      mode: "none",
      revision: 0,
      page: 0,
      transition: false,
    });
    expect(JSON.stringify(pub)).not.toMatch(
      /courant-A|courant-B|conducteur|Ma paire|assignments/,
    );
    expect(
      (await cmd({ type: "undercover.publish", mode: "duo" })).status,
    ).toBe(409);
  });
  it("only distributes on GM action; players receive exactly their own content and private media", async () => {
    const a = gm.undercoverPreparation!.contents.a,
      b = gm.undercoverPreparation!.contents.b;
    const upload = await fetch(`${origin}/sessions/${id}/media/${a.id}`, {
      method: "POST",
      headers: { ...auth(gmToken), "Content-Type": "image/png" },
      body: new Uint8Array(png()),
    });
    expect(upload.status).toBe(200);
    expect((await fetch(`${origin}/sessions/${id}/media/${a.id}`)).status).toBe(
      403,
    );
    await accepted({ type: "game.use-prepared" });
    expect(gm.game!.play!.dealt).toBe(false);
    await act("deal");
    for (const p of players) {
      const raw = await (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: auth(p.token),
        })
      ).json();
      const v = playerSessionSchema.parse(raw);
      expect(v.personalContent).toBeDefined();
      expect(v.personalContent!.label).toBe(
        v.game!.values.find((v) => v.id === "secret-word")!.value,
      );
      expect(JSON.stringify(raw)).not.toContain("undercoverPreparation");
      const other = v.personalContent!.id === a.id ? b.id : a.id;
      expect(
        (
          await fetch(`${origin}/sessions/${id}/media/${other}`, {
            headers: auth(p.token),
          })
        ).status,
      ).toBe(403);
      if (v.personalContent!.id === a.id)
        expect(
          (
            await fetch(`${origin}/sessions/${id}/media/${a.id}`, {
              headers: auth(p.token),
            })
          ).status,
        ).toBe(200);
    }
    expect(JSON.stringify(await publicView())).not.toContain(
      settings["civil-word"],
    );
  });
  it("publishes a genuinely anonymous HTTP and SSE duo; mappings require the explicit separate GM command", async () => {
    await accepted({ type: "game.use-prepared" });
    await act("deal");
    const abort = new AbortController();
    controllers.push(abort);
    const response = await fetch(`${origin}/sessions/${id}/public/events`, {
      signal: abort.signal,
    });
    const reader = response.body!.getReader();
    let frames = "";
    await reader.read();
    expect(
      (
        await cmd(
          { type: "undercover.publish", mode: "assignments" },
          players[0]!.token,
        )
      ).status,
    ).toBe(403);
    await accepted({ type: "undercover.publish", mode: "duo" });
    const pub = await publicView();
    expect(pub.undercoverBroadcast?.mode).toBe("duo");
    expect(pub.undercoverBroadcast).not.toHaveProperty("assignments");
    const timeout = setTimeout(() => abort.abort(), 2000);
    while (!frames.includes('"mode":"duo"')) {
      const r = await reader.read();
      frames += new TextDecoder().decode(r.value);
    }
    clearTimeout(timeout);
    expect(frames).not.toMatch(
      /"assignments"|"configuration"|"undercoverPreparation"|Mon conducteur|majority|minority/,
    );
    await accepted({ type: "undercover.publish", mode: "assignments" });
    const visible = (await publicView()).undercoverBroadcast;
    expect(visible?.mode).toBe("assignments");
    if (visible?.mode === "assignments")
      expect(visible.assignments).toHaveLength(3);
    await accepted({ type: "undercover.publish", mode: "none" });
    expect((await publicView()).undercoverBroadcast).not.toHaveProperty(
      "contents",
    );
    abort.abort();
  });
  it("validates binary input, origin and media writer; public access is revoked with publication", async () => {
    const c = gm.undercoverPreparation!.contents.a.id,
      url = `${origin}/sessions/${id}/media/${c}`;
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: { ...auth(players[0]!.token), "Content-Type": "image/png" },
          body: new Uint8Array(png()),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: {
            ...auth(gmToken),
            "Content-Type": "image/png",
            Origin: "https://evil.example",
          },
          body: new Uint8Array(png()),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: { ...auth(gmToken), "Content-Type": "image/png" },
          body: "not-an-image",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: { ...auth(gmToken), "Content-Type": "image/svg+xml" },
          body: "<svg/>",
        })
      ).status,
    ).toBe(415);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: { ...auth(gmToken), "Content-Type": "image/png" },
          body: new Uint8Array(png()),
        })
      ).status,
    ).toBe(200);
    await accepted({ type: "game.use-prepared" });
    await act("deal");
    await accepted({ type: "undercover.publish", mode: "duo" });
    const image = await fetch(url);
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    expect(image.headers.get("cache-control")).toContain("no-store");
    await accepted({ type: "undercover.publish", mode: "none" });
    expect((await fetch(url)).status).toBe(403);
    expect(
      (await fetch(url, { method: "DELETE", headers: auth(players[0]!.token) }))
        .status,
    ).toBe(403);
    expect(
      (
        await fetch(url, {
          method: "DELETE",
          headers: { ...auth(gmToken), Origin: "https://evil.example" },
        })
      ).status,
    ).toBe(403);
    expect(
      (await fetch(url, { method: "DELETE", headers: auth(gmToken) })).status,
    ).toBe(200);
    expect((await fetch(url, { headers: auth(gmToken) })).status).toBe(410);
  });
  it("next and replay are different authenticated atomic commands; no early next or automatic future disclosure", async () => {
    await accepted({ type: "game.use-prepared" });
    await act("deal");
    const preparation = nextRef();
    const next = {
      type: "undercover.next" as const,
      settings: undercoverSettingsSchema.parse({
        "civil-word": "Suivante-A-jamais-avant",
        "undercover-word": "Suivante-B-jamais-avant",
      }),
      preparation,
      overlayLayout: createUndercoverTvLayout("balanced"),
      broadcastTheme: "on-air-premium" as const,
    };
    expect((await cmd(next)).status).toBe(409);
    await finish();
    expect((await publicView()).undercoverBroadcast?.mode).toBe("final");
    await accepted({ type: "game.restart", runId: gm.game!.runId });
    expect(gm.undercoverPreparation!.id).not.toBe(preparation.id);
    expect((await publicView()).undercoverBroadcast?.mode).toBe("none");
    await act("deal");
    await finish();
    const input = {
      commandId: randomUUID(),
      expectedVersion: gm.version,
      command: next,
    };
    const first = await post(`/sessions/${id}/commands`, gmToken, input);
    expect(first.status, await first.clone().text()).toBe(200);
    const snapshot = gmSessionSchema.parse(await first.json());
    expect(snapshot.game!.play!.dealt).toBe(false);
    expect(snapshot.undercoverPreparation!.id).toBe(preparation.id);
    expect(snapshot.participants).toHaveLength(3);
    expect(snapshot.broadcastTheme).toBe("on-air-premium");
    expect(snapshot.overlayLayout?.schemaVersion).toBe(2);
    const retry = await post(`/sessions/${id}/commands`, gmToken, input);
    expect(retry.status).toBe(200);
    expect((await view()).game!.runId).toBe(snapshot.game!.runId);
    const pub = await publicView();
    expect(pub.undercoverBroadcast).toMatchObject({
      mode: "none",
      transition: true,
    });
    expect(JSON.stringify(pub)).not.toMatch(
      /Suivante-A|Suivante-B|Future privée/,
    );
    gm = await view();
    await act("deal");
    expect((await publicView()).undercoverBroadcast?.transition).toBe(false);
    for (const p of players)
      expect(
        (
          await fetch(`${origin}/sessions/${id}/private`, {
            headers: auth(p.token),
          })
        ).status,
      ).toBe(200);
  });
  it("expiration loses only the image, reconnect upload restores it and raw media never persists to SQLite", async () => {
    const c = gm.undercoverPreparation!.contents.a.id;
    service.uploadMedia(id, gmToken, c, png());
    expect(
      gmSessionSchema.parse(service.view(id, hashValue(gmToken)))
        .undercoverPreparation!.contents.a.image,
    ).toBeDefined();
    const serialized = JSON.stringify(store.load(id));
    expect(serialized).not.toContain("data:image");
    expect(serialized).not.toContain(png().toString("base64"));
    service.media.clearSession(id);
    const fallback = gmSessionSchema.parse(
      service.view(id, hashValue(gmToken)),
    );
    expect(fallback.undercoverPreparation!.contents.a.label).toBe(
      settings["civil-word"],
    );
    expect(fallback.undercoverPreparation!.contents.a.image).toBeUndefined();
    expect(
      (
        await fetch(`${origin}/sessions/${id}/media/${c}`, {
          headers: auth(gmToken),
        })
      ).status,
    ).toBe(410);
    service.uploadMedia(id, gmToken, c, png());
    expect(
      (
        await fetch(`${origin}/sessions/${id}/media/${c}`, {
          headers: auth(gmToken),
        })
      ).status,
    ).toBe(200);
  });
  it("preserves the series binding and pinned preparation across restart without persisting binary files", () => {
    const reopened = new SqliteStore(join(dir, "state.sqlite"));
    const recovered = new SessionService(reopened, "http://127.0.0.1:3000");
    expect(
      gmSessionSchema.parse(recovered.view(id, hashValue(gmToken)))
        .undercoverPreparation!.id,
    ).toBe(gm.undercoverPreparation!.id);
    expect(() =>
      prepareOfficialSession(recovered, gmToken, {
        requestId: randomUUID(),
        settings,
        preparation: nextRef(),
      }),
    ).toThrow("SERIES_ALREADY_PREPARED");
    recovered.shutdown();
    reopened.close();
  });
});
