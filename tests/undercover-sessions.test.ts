import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { undercoverDefinition } from "@extension-twitch/game-undercover/definition";
import type {
  LobbyAction,
  GmSessionView,
} from "@extension-twitch/contracts/sessions";
import {
  gmSessionSchema,
  playerSessionSchema,
  publicSessionSchema,
} from "@extension-twitch/contracts/sessions";
import { createApp } from "../apps/server/src/app.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import { SessionService } from "../apps/server/src/session-service.js";
const secret = () => randomBytes(32).toString("base64url");
describe("official-game primitives through authenticated HTTP, SQLite and SSE", () => {
  let directory: string,
    store: SqliteStore,
    server: ReturnType<typeof createApp>,
    origin: string,
    id: string,
    gmToken: string,
    gm: GmSessionView,
    players: { id: string; token: string }[];
  const headers = (token: string) => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });
  const post = (path: string, token: string, body: unknown) =>
    fetch(`${origin}${path}`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
    });
  const privateView = (token = gmToken) =>
    fetch(`${origin}/sessions/${id}/private`, { headers: headers(token) }).then(
      (r) => r.json(),
    );
  async function command(
    action: LobbyAction,
    token = gmToken,
    envelope?: {
      commandId: string;
      expectedVersion: number;
      command: LobbyAction;
    },
  ) {
    const view = (await privateView(token)) as { version: number };
    const input = envelope ?? {
      commandId: randomUUID(),
      expectedVersion: view.version,
      command: action,
    };
    return post(`/sessions/${id}/commands`, token, input);
  }
  async function accepted(action: LobbyAction, token = gmToken) {
    const response = await command(action, token);
    expect(response.status).toBe(200);
    gm = gmSessionSchema.parse(await privateView());
    return response;
  }
  async function action(
    actionId: string,
    token = gmToken,
    parameters: Record<string, string> = {},
  ) {
    if (actionId === "open-vote") {
      while (gm.game!.play!.turns && !gm.game!.play!.turns!.complete)
        await action("confirm-clue");
    }
    return accepted(
      { type: "game.action", actionId, runId: gm.game!.runId, parameters },
      token,
    );
  }
  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), "xt-uc-http-"));
    store = new SqliteStore(join(directory, "state.sqlite"));
    server = createApp(new SessionService(store, "http://127.0.0.1:3000"), {
      legacyTools: true,
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    gmToken = secret();
    const created = (await (
      await post("/sessions", gmToken, {
        requestId: randomUUID(),
        title: "Undercover test",
        hostName: "GM",
        gameId: "undercover",
      })
    ).json()) as { sessionId: string };
    id = created.sessionId;
    gm = gmSessionSchema.parse(await privateView());
    players = [];
    for (let i = 0; i < 4; i++) {
      const token = secret(),
        joined = (await (
          await post(`/invitations/${gm.invitationCode}/join`, token, {
            requestId: randomUUID(),
            name: `Invité ${i + 1}`,
          })
        ).json()) as { participantId: string };
      players.push({ id: joined.participantId, token });
    }
    const definition = structuredClone(undercoverDefinition);
    definition.actions.find((a) => a.id === "vote")!.label =
      "Libellé privé du rôle · ne pas publier";
    await accepted({
      type: "game.configure",
      definition,
      assets: [],
      configuration: {
        "civil-word": "SecretCivil-unique",
        "undercover-word": "SecretIntrus-unique",
      },
    });
  });
  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
    store.close();
    rmSync(directory, { recursive: true, force: true });
  });
  it("stores a single random deal receipt and isolates participant, GM and public projections", async () => {
    const commandBody = {
      commandId: randomUUID(),
      expectedVersion: gm.version,
      command: {
        type: "game.action",
        runId: gm.game!.runId,
        actionId: "deal",
        parameters: {},
      } as LobbyAction,
    };
    const first = await command(commandBody.command, gmToken, commandBody);
    expect(first.status).toBe(200);
    const roles = structuredClone(store.load(id).gameRun!.assignments);
    const second = await command(commandBody.command, gmToken, commandBody);
    expect(second.status).toBe(200);
    expect(store.load(id).gameRun!.assignments).toEqual(roles);
    expect(
      store.load(id).events.filter((e) => e.type === "game.action"),
    ).toHaveLength(1);
    const pub = publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
    expect(JSON.stringify(pub)).not.toMatch(
      /SecretCivil-unique|SecretIntrus-unique|assignments|configuration/,
    );
    for (const p of players) {
      const view = playerSessionSchema.parse(await privateView(p.token));
      expect(view.game!.values.map((v) => v.participantId)).toEqual([p.id]);
      expect(view.game!.management).toBeUndefined();
      expect(view.game!.role).toBeUndefined();
    }
    expect(JSON.stringify(pub.events)).not.toMatch(/SecretCivil|SecretIntrus/);
    expect(
      (
        await command(
          {
            type: "game.action",
            runId: gm.game!.runId,
            actionId: "deal",
            parameters: {},
          },
          players[0]!.token,
        )
      ).status,
    ).toBe(403);
  });
  it("serializes simultaneous votes, accepts exact retries once and rejects identity substitution", async () => {
    await action("deal");
    await action("open-vote");
    const state = gm.version,
      runId = gm.game!.runId;
    const envelopes = players.slice(0, 2).map((p, i) => ({
      commandId: randomUUID(),
      expectedVersion: state,
      command: {
        type: "game.action",
        runId,
        actionId: "vote",
        parameters: { target: players[i === 0 ? 1 : 0]!.id },
      } as LobbyAction,
    }));
    const responses = await Promise.all(
      envelopes.map((input, i) =>
        post(`/sessions/${id}/commands`, players[i]!.token, input),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const winner = responses.findIndex((r) => r.status === 200),
      loser = 1 - winner;
    expect(
      (
        await post(
          `/sessions/${id}/commands`,
          players[winner]!.token,
          envelopes[winner],
        )
      ).status,
    ).toBe(200);
    expect(
      Object.keys(store.load(id).gameRun!.play!.ballots.elimination!.votes),
    ).toHaveLength(1);
    expect(
      (await command(envelopes[loser]!.command, players[loser]!.token)).status,
    ).toBe(200);
    const substituted = {
      type: "game.player-action",
      participantId: players[2]!.id,
      actionId: "vote",
      runId,
      parameters: { target: players[0]!.id },
    } as const;
    expect((await command(substituted, players[0]!.token)).status).toBe(403);
    expect(
      (
        await command(
          {
            type: "game.action",
            runId,
            actionId: "vote",
            parameters: { target: players[2]!.id },
          },
          players[winner]!.token,
        )
      ).status,
    ).toBe(403);
    expect(
      Object.keys(store.load(id).gameRun!.play!.ballots.elimination!.votes),
    ).toHaveLength(2);
    expect(
      (
        await command({
          type: "game.action",
          runId,
          actionId: "resolve",
          parameters: {},
        })
      ).status,
    ).toBe(403);
  });
  it("supports GM delegation with normal validations, resolves victory and restarts with the same credentials", async () => {
    await action("deal");
    await action("open-vote");
    const target = Object.entries(gm.game!.management!.assignments).find(
      ([, role]) => role === "undercover",
    )![0];
    for (const p of players) {
      const destination =
        p.id === target
          ? players.find((other) => other.id !== p.id)!.id
          : target;
      await accepted({
        type: "game.player-action",
        participantId: p.id,
        runId: gm.game!.runId,
        actionId: "vote",
        parameters: { target: destination },
      });
    }
    await action("resolve");
    expect(gm.game!.play!.outcome!.id).toBe("civils-win");
    const pub = publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
    expect(pub.publicGame!.play!.outcome!.id).toBe("civils-win");
    expect(pub.publicGame!.values).toHaveLength(4);
    const oldRun = gm.game!.runId;
    await accepted({ type: "game.restart", runId: oldRun });
    expect(gm.game!.runId).not.toBe(oldRun);
    expect(gm.game!.play!.dealt).toBe(false);
    expect(gm.game!.play!.ballot).toBeUndefined();
    expect(gm.game!.play!.roster.every((p) => p.active)).toBe(true);
    for (const p of players)
      expect(
        playerSessionSchema.parse(await privateView(p.token)).participantId,
      ).toBe(p.id);
    expect(
      (
        await command({
          type: "game.action",
          runId: oldRun,
          actionId: "deal",
          parameters: {},
        })
      ).status,
    ).toBe(409);
    await action("deal");
    expect(gm.game!.play!.dealt).toBe(true);
  });
  it("reconnects a real private stream to the current ballot without leaking another participant's vote", async () => {
    await action("deal");
    await action("open-vote");
    await action("vote", players[0]!.token, { target: players[1]!.id });
    const publicView = publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
    expect(JSON.stringify(publicView)).not.toContain("Libellé privé du rôle");
    expect(publicView.events.at(-1)!.message).toBe("Invité 1 a voté.");
    const controller = new AbortController();
    const response = await fetch(`${origin}/sessions/${id}/private/events`, {
      headers: headers(players[0]!.token),
      signal: controller.signal,
    });
    expect(response.status).toBe(200);
    const reader = response.body!.getReader();
    let first = "";
    while (!first.includes("\n\n")) {
      first += new TextDecoder().decode((await reader.read()).value);
    }
    controller.abort();
    expect(first).toContain('"myVote"');
    expect(first).not.toContain('"votes":');
    const latest = playerSessionSchema.parse(
      await privateView(players[0]!.token),
    );
    expect(latest.game!.play!.ballot!.myVote).toBe(players[1]!.id);
    const other = playerSessionSchema.parse(
      await privateView(players[2]!.token),
    );
    expect(other.game!.play!.ballot!.myVote).toBeUndefined();
    expect(other.game!.play!.ballot!.voted).toHaveLength(1);
  });
  it("rejects early voting over HTTP and receipts a confirmed oral passage exactly once", async () => {
    await action("deal");
    const runId = gm.game!.runId;
    const early: LobbyAction = {
      type: "game.action",
      runId,
      actionId: "open-vote",
      parameters: {},
    };
    expect((await command(early)).status).toBe(403);
    const input = {
      commandId: randomUUID(),
      expectedVersion: gm.version,
      command: {
        type: "game.action",
        runId,
        actionId: "confirm-clue",
        parameters: {},
      } as LobbyAction,
    };
    expect((await command(input.command, gmToken, input)).status).toBe(200);
    expect((await command(input.command, gmToken, input)).status).toBe(200);
    gm = gmSessionSchema.parse(await privateView());
    expect(gm.game!.play!.turns!.completed).toHaveLength(1);
    expect((await command(input.command, players[0]!.token)).status).toBe(403);
    expect((await command(early)).status).toBe(403);
    await action("open-vote");
    expect(gm.game!.phase.id).toBe("vote");
    expect(
      store
        .load(id)
        .events.filter((e) => e.message.includes("passage de parole")),
    ).toHaveLength(8);
  });
});
