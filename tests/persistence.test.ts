import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setTimeout as pause } from "node:timers/promises";
import { answerBox } from "@extension-twitch/engine";
import { expect, it } from "vitest";
import {
  gmSessionSchema,
  sessionAccessSchema,
  sessionStreamEventSchema,
  sessionViewSchema,
} from "@extension-twitch/contracts/sessions";

it("restores sessions, credentials, journal and command receipts after an actual server process restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "xt-session-restart-"));
  const database = join(directory, "sessions.sqlite");
  const reservation = createServer();
  await new Promise<void>((resolve) =>
    reservation.listen(0, "127.0.0.1", resolve),
  );
  const address = reservation.address();
  if (!address || typeof address === "string") throw new Error("Missing port");
  const port = address.port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const origin = `http://127.0.0.1:${port}`;
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
        /* child is starting */
      }
      if (child.exitCode !== null)
        throw new Error("Server process failed to start");
      await pause(40);
    }
    throw new Error("Server process did not become ready");
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const processToStop = child;
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => processToStop.kill("SIGKILL"), 3000);
      processToStop.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
      processToStop.kill("SIGTERM");
    });
    child = null;
  }
  const gmToken = randomBytes(32).toString("base64url"),
    playerToken = randomBytes(32).toString("base64url");
  const headers = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });
  const post = (path: string, token: string, value: unknown) =>
    fetch(`${origin}${path}`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(value),
    });
  try {
    await start();
    const created = sessionAccessSchema.parse(
      await (
        await post("/sessions", gmToken, {
          requestId: randomUUID(),
          title: "Persistante",
          hostName: "GM",
          gameId: "undercover",
        })
      ).json(),
    );
    const gm = gmSessionSchema.parse(
      await (
        await fetch(`${origin}/sessions/${created.sessionId}/private`, {
          headers: headers(gmToken),
        })
      ).json(),
    );
    const joined = sessionAccessSchema.parse(
      await (
        await post(`/invitations/${gm.invitationCode}/join`, playerToken, {
          requestId: randomUUID(),
          name: "Nova",
        })
      ).json(),
    );
    const command = {
      commandId: randomUUID(),
      expectedVersion: 2,
      command: { type: "participant.ready", ready: true },
    };
    expect(
      (
        await post(
          `/sessions/${created.sessionId}/commands`,
          playerToken,
          command,
        )
      ).status,
    ).toBe(200);
    await stop();
    expect(statSync(database).mode & 0o777).toBe(0o600);
    const disk = readFileSync(database).toString("utf8");
    expect(disk).not.toContain(gmToken);
    expect(disk).not.toContain(playerToken);
    await start();
    const restored = sessionViewSchema.parse(
      await (
        await fetch(`${origin}/sessions/${created.sessionId}/private`, {
          headers: headers(playerToken),
        })
      ).json(),
    );
    expect(restored.audience).toBe("player");
    expect(restored.version).toBe(3);
    expect(restored.participants[0]).toMatchObject({
      id: joined.participantId,
      name: "Nova",
      ready: true,
      connected: false,
    });
    expect(restored.events.map((event) => event.type)).toEqual([
      "session.created",
      "participant.joined",
      "participant.ready",
    ]);
    const replay = await post(
      `/sessions/${created.sessionId}/commands`,
      playerToken,
      command,
    );
    expect(replay.status).toBe(200);
    expect(sessionViewSchema.parse(await replay.json()).version).toBe(3);
    const controller = new AbortController();
    const response = await fetch(
      `${origin}/sessions/${created.sessionId}/private/events`,
      { headers: headers(playerToken), signal: controller.signal },
    );
    const reader = response.body!.getReader();
    const first = await reader.read();
    const data = new TextDecoder()
      .decode(first.value)
      .split("\n")
      .find((line) => line.startsWith("data: "))!;
    const message = sessionStreamEventSchema.parse(
      JSON.parse(data.slice(6)) as unknown,
    );
    expect(message.type).toBe("session.snapshot");
    if (message.type === "session.snapshot")
      expect(message.view.participants[0]?.connected).toBe(true);
    controller.abort();
    expect(
      (
        await post(`/sessions/${created.sessionId}/commands`, gmToken, {
          commandId: randomUUID(),
          expectedVersion: 3,
          command: { type: "session.admission", open: false },
        })
      ).status,
    ).toBe(200);
    // Upgrade the restored A session in place, then restart the real process again.
    const commandPath = `/sessions/${created.sessionId}/commands`;
    const sendGame = async (
      token: string,
      command: unknown,
      expectedVersion: number,
    ) => {
      const envelope = { commandId: randomUUID(), expectedVersion, command };
      const response = await post(commandPath, token, envelope);
      expect(response.status).toBe(200);
      return { view: sessionViewSchema.parse(await response.json()), envelope };
    };
    const configured = await sendGame(
      gmToken,
      {
        type: "game.configure",
        definition: answerBox,
        configuration: {},
        assets: [],
      },
      4,
    );
    const runId = configured.view.publicGame!.runId;
    await sendGame(
      gmToken,
      { type: "game.action", runId, actionId: "open", parameters: {} },
      5,
    );
    const answered = await sendGame(
      playerToken,
      {
        type: "game.action",
        runId,
        actionId: "answer",
        parameters: { text: "Réponse persistée privée" },
      },
      6,
    );
    await stop();
    await start();
    const resumed = sessionViewSchema.parse(
      await (
        await fetch(`${origin}/sessions/${created.sessionId}/private`, {
          headers: headers(playerToken),
        })
      ).json(),
    );
    expect(resumed.version).toBe(7);
    expect(resumed.publicGame?.runId).toBe(runId);
    expect(JSON.stringify(resumed)).toContain("Réponse persistée privée");
    const observer = sessionViewSchema.parse(
      await (
        await fetch(`${origin}/sessions/${created.sessionId}/public`)
      ).json(),
    );
    expect(JSON.stringify(observer)).not.toContain("Réponse persistée privée");
    const repeated = await post(commandPath, playerToken, answered.envelope);
    expect(repeated.status).toBe(200);
    expect(sessionViewSchema.parse(await repeated.json()).version).toBe(7);
  } finally {
    await stop();
    rmSync(directory, { recursive: true, force: true });
  }
}, 15000);
