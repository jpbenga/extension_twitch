import { randomBytes, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import {
  SessionService,
  hashValue,
} from "../apps/server/src/session-service.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import {
  gmSessionSchema,
  sessionAccessSchema,
  sessionStreamEventSchema,
  sessionViewSchema,
  type LobbyAction,
  type SessionView,
} from "@extension-twitch/contracts/sessions";

const credential = () => randomBytes(32).toString("base64url");

describe("real sessions over HTTP, SQLite and SSE", () => {
  let store: SqliteStore;
  let server: ReturnType<typeof createApp>;
  let origin: string;
  let gmToken: string;
  let id: string;
  const streams: AbortController[] = [];

  async function post(
    path: string,
    token: string,
    value: unknown,
    extra: Record<string, string> = {},
  ) {
    return fetch(`${origin}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...extra,
      },
      body: JSON.stringify(value),
    });
  }
  async function view(token: string | null = gmToken, sessionId = id) {
    const response = await fetch(
      `${origin}/sessions/${sessionId}/${token === null ? "public" : "private"}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    expect(response.status).toBe(200);
    return sessionViewSchema.parse(await response.json());
  }
  async function join(
    name: string,
    token = credential(),
    requestId = randomUUID(),
  ) {
    const gm = gmSessionSchema.parse(await view());
    const response = await post(
      `/invitations/${gm.invitationCode}/join`,
      token,
      { name, requestId },
    );
    expect(response.status).toBe(201);
    return { token, ...sessionAccessSchema.parse(await response.json()) };
  }
  async function command(
    token: string,
    action: LobbyAction,
    expectedVersion?: number,
    commandId = randomUUID(),
  ) {
    return post(`/sessions/${id}/commands`, token, {
      commandId,
      expectedVersion: expectedVersion ?? (await view()).version,
      command: action,
    });
  }
  async function openStream(token: string | null) {
    const controller = new AbortController();
    streams.push(controller);
    const response = await fetch(
      `${origin}/sessions/${id}/${token === null ? "public" : "private"}/events`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      },
    );
    expect(response.status).toBe(200);
    const reader = response.body!.getReader();
    let buffer = "";
    const decoder = new TextDecoder();
    return {
      controller,
      async until(
        predicate: (
          event: ReturnType<typeof sessionStreamEventSchema.parse>,
        ) => boolean,
      ) {
        const timeout = setTimeout(() => controller.abort(), 4000);
        try {
          for (;;) {
            const boundary = buffer.indexOf("\n\n");
            if (boundary >= 0) {
              const frame = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              if (!frame.startsWith("data: ")) continue;
              const event = sessionStreamEventSchema.parse(
                JSON.parse(frame.slice(6)) as unknown,
              );
              if (predicate(event)) return event;
            } else {
              const chunk = await reader.read();
              if (chunk.done)
                throw new Error("Stream ended before expected event");
              buffer += decoder.decode(chunk.value, { stream: true });
            }
          }
        } finally {
          clearTimeout(timeout);
        }
      },
    };
  }
  const snapshot =
    (predicate: (view: SessionView) => boolean) =>
    (event: ReturnType<typeof sessionStreamEventSchema.parse>) =>
      event.type === "session.snapshot" && predicate(event.view);

  beforeEach(async () => {
    store = new SqliteStore(":memory:");
    server = createApp(new SessionService(store, "http://127.0.0.1:3000"));
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    gmToken = credential();
    const response = await post("/sessions", gmToken, {
      requestId: randomUUID(),
      title: "Émission réelle",
      hostName: "GM",
      gameId: "undercover",
    });
    expect(response.status).toBe(201);
    id = sessionAccessSchema.parse(await response.json()).sessionId;
  });
  afterEach(async () => {
    streams.splice(0).forEach((controller) => controller.abort());
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
    store.close();
  });

  it("creates a persistent empty lobby with server-bound GM access and network invitations", async () => {
    const state = gmSessionSchema.parse(await view());
    expect(state.participants).toEqual([]);
    expect(state.phase).toBe("lobby");
    expect(state.version).toBe(1);
    expect(state.joinUrl).toBe(
      `http://127.0.0.1:3000/join/${state.invitationCode}`,
    );
    expect(state.publicUrl).toBe(`http://127.0.0.1:3000/sessions/${id}/public`);
    expect(store.load(id).title).toBe("Émission réelle");
    const response = await fetch(`${origin}/sessions/${id}/private`);
    expect(response.status).toBe(401);
  });

  it("retries create and join without duplicating a session or participant", async () => {
    const token = credential();
    const input = {
      requestId: randomUUID(),
      title: "Reprise",
      hostName: "GM",
      gameId: "spy",
    };
    const responses = await Promise.all([
      post("/sessions", token, input),
      post("/sessions", token, input),
    ]);
    const results = await Promise.all(
      responses.map((response) => response.json()),
    );
    expect(results[0]).toEqual(results[1]);
    const playerToken = credential();
    const requestId = randomUUID();
    const [first, second] = await Promise.all([
      join("Nova", playerToken, requestId),
      join("Nova", playerToken, requestId),
    ]);
    expect(first.participantId).toBe(second.participantId);
    expect((await view()).participants).toHaveLength(1);
    expect((await view()).version).toBe(2);
    expect(
      (await post("/sessions", token, { ...input, title: "Different" })).status,
    ).toBe(409);
  });

  it("keeps invitation and credential data out of player/public HTTP and SSE projections", async () => {
    const nova = await join("Nova");
    const atlas = await join("Atlas");
    const gm = gmSessionSchema.parse(await view());
    for (const token of [null, nova.token, atlas.token]) {
      const data = await view(token);
      const serialized = JSON.stringify(data);
      for (const secret of [
        gmToken,
        nova.token,
        atlas.token,
        gm.invitationCode,
        hashValue(gmToken),
        "invitationCode",
        "token_hash",
      ])
        expect(serialized).not.toContain(secret);
      expect(data.audience).toBe(token === null ? "public" : "player");
      const stream = await openStream(token);
      const event = await stream.until(snapshot(() => true));
      expect(JSON.stringify(event)).not.toContain(gm.invitationCode);
    }
    expect((await view(nova.token)).audience).toBe("player");
  });

  it("rejects role spoofing, cross-session credentials, untrusted origin and game actions", async () => {
    const player = await join("Nova");
    expect(
      (await command(player.token, { type: "session.admission", open: false }))
        .status,
    ).toBe(403);
    expect(
      (await command(gmToken, { type: "participant.ready", ready: true }))
        .status,
    ).toBe(403);
    const payload = {
      commandId: randomUUID(),
      expectedVersion: (await view()).version,
      command: { type: "participant.ready", ready: true },
      actor: { role: "gm" },
    };
    expect(
      (await post(`/sessions/${id}/commands`, player.token, payload)).status,
    ).toBe(400);
    expect(
      (
        await post(`/sessions/${id}/commands`, player.token, {
          ...payload,
          actor: undefined,
          command: { type: "game.start" },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await post(`/sessions/${id}/commands`, credential(), {
          ...payload,
          actor: undefined,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await post(
          "/sessions",
          credential(),
          {
            requestId: randomUUID(),
            title: "No",
            hostName: "GM",
            gameId: "undercover",
          },
          { Origin: "https://other.example" },
        )
      ).status,
    ).toBe(403);
    const other = sessionAccessSchema.parse(
      await (
        await post("/sessions", credential(), {
          requestId: randomUUID(),
          title: "Other",
          hostName: "GM",
          gameId: "spy",
        })
      ).json(),
    );
    expect(
      (
        await fetch(`${origin}/sessions/${other.sessionId}/private`, {
          headers: { Authorization: `Bearer ${gmToken}` },
        })
      ).status,
    ).toBe(401);
    expect((await view()).admissionOpen).toBe(true);
  });

  it("deduplicates a double tap and refuses conflicting reuse of its command id", async () => {
    const player = await join("Nova");
    const version = (await view()).version;
    const requestId = randomUUID();
    const results = await Promise.all([
      command(
        player.token,
        { type: "participant.ready", ready: true },
        version,
        requestId,
      ),
      command(
        player.token,
        { type: "participant.ready", ready: true },
        version,
        requestId,
      ),
    ]);
    expect(results.map((response) => response.status)).toEqual([200, 200]);
    const after = await view();
    expect(after.version).toBe(version + 1);
    expect(
      after.events.filter((event) => event.type === "participant.ready"),
    ).toHaveLength(1);
    expect(
      (
        await command(
          player.token,
          { type: "participant.ready", ready: false },
          version,
          requestId,
        )
      ).status,
    ).toBe(409);
    expect((await view()).participants[0]?.ready).toBe(true);
  });

  it("serializes simultaneous commands and exposes a version conflict without lost updates", async () => {
    const nova = await join("Nova");
    const atlas = await join("Atlas");
    const version = (await view()).version;
    const results = await Promise.all([
      command(nova.token, { type: "participant.ready", ready: true }, version),
      command(atlas.token, { type: "participant.ready", ready: true }, version),
    ]);
    expect(results.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    const state = await view();
    expect(state.participants.filter((player) => player.ready)).toHaveLength(1);
    const losingToken =
      state.participants.find((player) => !player.ready)?.id ===
      nova.participantId
        ? nova.token
        : atlas.token;
    expect(
      (
        await command(
          losingToken,
          { type: "participant.ready", ready: true },
          state.version,
        )
      ).status,
    ).toBe(200);
    expect((await view()).participants.every((player) => player.ready)).toBe(
      true,
    );
  });

  it("broadcasts real mutations to GM, players and spectators and resumes with the latest snapshot", async () => {
    const player = await join("Nova");
    const streams = await Promise.all([
      openStream(gmToken),
      openStream(player.token),
      openStream(null),
    ]);
    await command(player.token, { type: "participant.ready", ready: true });
    for (const stream of streams)
      await stream.until(
        snapshot((state) => state.participants[0]?.ready === true),
      );
    streams[2]!.controller.abort();
    await command(gmToken, {
      type: "session.rename",
      title: "Nouveau plateau",
    });
    const resumed = await openStream(null);
    await resumed.until(
      snapshot(
        (state) =>
          state.title === "Nouveau plateau" &&
          state.participants[0]?.ready === true,
      ),
    );
  });

  it("tracks multiple connections per identity without persisting false online state", async () => {
    const player = await join("Nova");
    const observer = await openStream(null);
    const first = await openStream(player.token);
    const second = await openStream(player.token);
    await observer.until(
      snapshot((state) => state.participants[0]?.connected === true),
    );
    first.controller.abort();
    expect((await view()).participants[0]?.connected).toBe(true);
    second.controller.abort();
    await observer.until(
      snapshot((state) => state.participants[0]?.connected === false),
    );
    expect((await view()).version).toBe(2);
  });

  it("closes admissions, rejects duplicate names and revokes a connected participant", async () => {
    const player = await join("Nova");
    const gm = gmSessionSchema.parse(await view());
    expect(
      (
        await post(`/invitations/${gm.invitationCode}/join`, credential(), {
          requestId: randomUUID(),
          name: "nova",
        })
      ).status,
    ).toBe(409);
    await command(gmToken, { type: "session.admission", open: false });
    expect(
      (
        await post(`/invitations/${gm.invitationCode}/join`, credential(), {
          requestId: randomUUID(),
          name: "Atlas",
        })
      ).status,
    ).toBe(409);
    const stream = await openStream(player.token);
    await command(gmToken, {
      type: "participant.remove",
      participantId: player.participantId!,
    });
    await stream.until((event) => event.type === "access.revoked");
    expect(
      (await command(player.token, { type: "participant.ready", ready: true }))
        .status,
    ).toBe(401);
    expect((await view()).participants).toEqual([]);
  });

  it("resets atomically, retains GM/public access, renews invitations and revokes all players", async () => {
    const player = await join("Nova");
    const before = gmSessionSchema.parse(await view());
    const stream = await openStream(player.token);
    await command(gmToken, { type: "session.reset" });
    await stream.until((event) => event.type === "access.revoked");
    const after = gmSessionSchema.parse(await view());
    expect(after.publicUrl).toBe(before.publicUrl);
    expect(after.invitationCode).not.toBe(before.invitationCode);
    expect(after.participants).toEqual([]);
    expect((await view(null)).participants).toEqual([]);
    expect(
      (
        await post(`/invitations/${before.invitationCode}/join`, credential(), {
          requestId: randomUUID(),
          name: "Atlas",
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${player.token}` },
        })
      ).status,
    ).toBe(401);
    expect((await join("Nova")).participantId).not.toBe(player.participantId);
  });

  it("bounds input sizes and refuses malformed commands without changing state", async () => {
    const before = await view();
    expect(
      (
        await post(`/sessions/${id}/commands`, gmToken, {
          commandId: randomUUID(),
          expectedVersion: 1,
          command: { type: "session.rename", title: "x".repeat(9000) },
        })
      ).status,
    ).toBe(413);
    expect(
      (await command(gmToken, { type: "session.admission", open: false }, 0))
        .status,
    ).toBe(409);
    expect((await view()).version).toBe(before.version);
    expect((await post("/lab/simulate", gmToken, {})).status).toBe(404);
    expect((await post("/payments", gmToken, {})).status).toBe(404);
  });
});
