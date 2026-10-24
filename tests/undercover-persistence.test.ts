import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setTimeout as pause } from "node:timers/promises";
import { expect, it } from "vitest";
import { undercoverDefinition } from "@extension-twitch/game-undercover/definition";
import {
  gmSessionSchema,
  playerSessionSchema,
  publicSessionSchema,
  type LobbyAction,
} from "@extension-twitch/contracts/sessions";
it("restores a real Undercover deal, private partial ballot, receipts and final outcome across process restarts", async () => {
  const dir = mkdtempSync(join(tmpdir(), "xt-undercover-restart-")),
    database = join(dir, "sessions.sqlite");
  const reservation = createServer();
  await new Promise<void>((resolve) =>
    reservation.listen(0, "127.0.0.1", resolve),
  );
  const address = reservation.address();
  if (!address || typeof address === "string") throw new Error("Missing port");
  const port = address.port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const origin = `http://127.0.0.1:${port}`,
    gmToken = randomBytes(32).toString("base64url");
  let child: ChildProcess | null = null;
  async function start() {
    child = spawn(
      process.execPath,
      ["--import", "tsx", "apps/server/src/index.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          SERVER_HOST: "127.0.0.1",
          SERVER_PORT: String(port),
          DATABASE_PATH: database,
          PUBLIC_ORIGIN: "http://127.0.0.1:3000",
        },
        stdio: "ignore",
      },
    );
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      try {
        if ((await fetch(`${origin}/health`)).ok) return;
      } catch {
        /* Starting. */
      }
      if (child.exitCode !== null) throw new Error("Server failed");
      await pause(30);
    }
    throw new Error("Server timeout");
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const p = child;
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => p.kill("SIGKILL"), 3000);
      p.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
      p.kill("SIGTERM");
    });
    child = null;
  }
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
  let id = "";
  const view = async () =>
    gmSessionSchema.parse(
      await (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: headers(gmToken),
        })
      ).json(),
    );
  const command = async (action: LobbyAction, token = gmToken) => {
    const current = await view();
    const input = {
      commandId: randomUUID(),
      expectedVersion: current.version,
      command: action,
    };
    expect((await post(`/sessions/${id}/commands`, token, input)).status).toBe(
      200,
    );
    return input;
  };
  try {
    await start();
    id = (
      (await (
        await post("/sessions", gmToken, {
          requestId: randomUUID(),
          title: "Reprise Undercover",
          hostName: "GM",
          gameId: "undercover",
        })
      ).json()) as { sessionId: string }
    ).sessionId;
    const initial = await view(),
      players: { id: string; token: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const token = randomBytes(32).toString("base64url"),
        joined = (await (
          await post(`/invitations/${initial.invitationCode}/join`, token, {
            requestId: randomUUID(),
            name: `Joueur ${i + 1}`,
          })
        ).json()) as { participantId: string };
      players.push({ id: joined.participantId, token });
    }
    await command({
      type: "game.configure",
      definition: undercoverDefinition,
      configuration: {
        "civil-word": "Secret persistant civil",
        "undercover-word": "Secret persistant intrus",
      },
      assets: [],
    });
    const runId = (await view()).game!.runId;
    await command({
      type: "game.action",
      runId,
      actionId: "deal",
      parameters: {},
    });
    await command({
      type: "game.action",
      runId,
      actionId: "confirm-clue",
      parameters: {},
    });
    const partialTurns = (await view()).game!.play!.turns!;
    await stop();
    await start();
    expect((await view()).game!.play!.turns).toEqual(partialTurns);
    while (!(await view()).game!.play!.turns!.complete)
      await command({
        type: "game.action",
        runId,
        actionId: "confirm-clue",
        parameters: {},
      });
    await command({
      type: "game.action",
      runId,
      actionId: "open-vote",
      parameters: {},
    });
    const before = await view(),
      target = Object.entries(before.game!.management!.assignments).find(
        ([, r]) => r === "undercover",
      )![0];
    const destination = (participantId: string) =>
      participantId === target
        ? players.find((p) => p.id !== target)!.id
        : target;
    const receipt = await command(
      {
        type: "game.action",
        runId,
        actionId: "vote",
        parameters: { target: destination(players[0]!.id) },
      },
      players[0]!.token,
    );
    const snapshot = (await view()).game!;
    await stop();
    await start();
    const restored = (await view()).game!;
    expect(restored.runId).toBe(runId);
    expect(restored.management!.assignments).toEqual(
      snapshot.management!.assignments,
    );
    expect(restored.values).toEqual(snapshot.values);
    expect(restored.play!.ballot!.voted).toEqual([players[0]!.id]);
    expect(
      (await post(`/sessions/${id}/commands`, players[0]!.token, receipt))
        .status,
    ).toBe(200);
    expect((await view()).game!.play!.ballot!.voted).toHaveLength(1);
    const own = playerSessionSchema.parse(
      await (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: headers(players[0]!.token),
        })
      ).json(),
    );
    expect(own.game!.values).toHaveLength(1);
    expect(own.game!.play!.ballot!.myVote).toBe(destination(players[0]!.id));
    let publicView = publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
    expect(JSON.stringify(publicView)).not.toMatch(
      /Secret persistant civil|Secret persistant intrus/,
    );
    for (const p of players.slice(1))
      await command(
        {
          type: "game.action",
          runId,
          actionId: "vote",
          parameters: { target: destination(p.id) },
        },
        p.token,
      );
    await command({
      type: "game.action",
      runId,
      actionId: "resolve",
      parameters: {},
    });
    await stop();
    await start();
    publicView = publicSessionSchema.parse(
      await (await fetch(`${origin}/sessions/${id}/public`)).json(),
    );
    expect(publicView.publicGame!.play!.outcome!.id).toBe("civils-win");
    expect(publicView.publicGame!.values).toHaveLength(4);
    await command({ type: "game.restart", runId });
    expect((await view()).game!.play!.dealt).toBe(false);
  } finally {
    await stop();
    rmSync(dir, { recursive: true, force: true });
  }
}, 15_000);
