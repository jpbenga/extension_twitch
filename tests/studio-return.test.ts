import { randomBytes, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../apps/server/src/app.js";
import { SessionService } from "../apps/server/src/session-service.js";
import { SqliteStore } from "../apps/server/src/sqlite-store.js";
import { StudioReturnCanvas } from "../apps/web/src/components/studio-return-canvas.js";
import {
  gmSessionSchema,
  sessionAccessSchema,
  studioSessionSchema,
  type LobbyAction,
} from "@extension-twitch/contracts/sessions";

const token = () => randomBytes(32).toString("base64url");

describe("Undercover studio return projection", () => {
  let store: SqliteStore;
  let service: SessionService;
  let server: ReturnType<typeof createApp>;
  let origin: string;
  let owner: string;
  let id: string;

  async function post(path: string, access: string, body: unknown) {
    return fetch(origin + path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
  async function gm() {
    return gmSessionSchema.parse(
      await (
        await fetch(`${origin}/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${owner}` },
        })
      ).json(),
    );
  }
  async function command(action: LobbyAction) {
    const view = await gm();
    const response = await post(`/sessions/${id}/commands`, owner, {
      commandId: randomUUID(),
      expectedVersion: view.version,
      command: action,
    });
    expect(response.status).toBe(200);
  }
  async function studio() {
    const response = await fetch(`${origin}/sessions/${id}/studio`);
    expect(response.status).toBe(200);
    return studioSessionSchema.parse(await response.json());
  }

  beforeEach(async () => {
    store = new SqliteStore(":memory:");
    service = new SessionService(store, "http://127.0.0.1:3000");
    server = createApp(service);
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    owner = token();
    const created = await post("/official-games/undercover/sessions", owner, {
      requestId: randomUUID(),
      settings: { "undercover-count": 1 },
      preparation: {
        id: randomUUID(),
        title: "Paire de répétition",
        preferredPublication: "none",
        series: {
          id: randomUUID(),
          title: "Conducteur Studio",
          position: 1,
          total: 1,
        },
      },
    });
    expect(created.status).toBe(201);
    id = sessionAccessSchema.parse(await created.json()).sessionId;
    const invitation = (await gm()).invitationCode;
    for (const name of ["Élodie", "Thomas", "Maya"]) {
      const joined = await post(`/invitations/${invitation}/join`, token(), {
        requestId: randomUUID(),
        name,
      });
      expect(joined.status).toBe(201);
    }
    await command({ type: "game.use-prepared" });
    await command({
      type: "game.action",
      runId: (await gm()).game!.runId,
      actionId: "deal",
      parameters: {},
    });
  });

  afterEach(async () => {
    service.shutdown();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
    store.close();
  });

  it("omits secrets, roles, GM fields and individual votes from payload, serialized data and HTML before reveal", async () => {
    const authoritative = store.load(id);
    const secretWords = Object.values(authoritative.gameRun!.participantValues)
      .map((values) => values["secret-word"])
      .filter((value): value is string => typeof value === "string");
    const view = await studio();
    const serialized = JSON.stringify(view);
    expect(view.audience).toBe("studio");
    expect(serialized).not.toMatch(
      /undercoverBroadcast|publicGame|events|broadcastTheme|overlayLayout|invitationCode|management|assignments|values|"role"|voted|myVote|tallies/,
    );
    for (const privateValue of secretWords)
      expect(serialized).not.toContain(privateValue);
    const html = renderToStaticMarkup(
      createElement(StudioReturnCanvas, { view, connection: "connected" }),
    );
    expect(html).not.toMatch(
      /undercoverBroadcast|assignments|secret-word|data-role|voted|myVote|tallies/,
    );
    for (const privateValue of secretWords)
      expect(html).not.toContain(privateValue);
  });

  it("exposes only the global vote count, then publishes durable reveal cards after the server outcome", async () => {
    const runId = (await gm()).game!.runId;
    for (let passage = 0; passage < 6; passage++)
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
    const authoritative = store.load(id);
    const undercover = Object.entries(authoritative.gameRun!.assignments).find(
      ([, role]) => role === "undercover",
    )![0];
    const civil = authoritative.participants.find(
      (participant) => participant.id !== undercover,
    )!.id;
    for (const participant of authoritative.participants)
      await command({
        type: "game.player-action",
        participantId: participant.id,
        runId,
        actionId: "vote",
        parameters: {
          target: participant.id === undercover ? civil : undercover,
        },
      });
    const voting = await studio();
    expect(voting.studioGame?.ballot).toMatchObject({ received: 3, total: 3 });
    expect(JSON.stringify(voting)).not.toMatch(/"voted"|"myVote"|"tallies"/);
    await command({
      type: "game.action",
      runId,
      actionId: "resolve",
      parameters: {},
    });
    const broadcast = service.view(id, null, "public");
    expect(broadcast.audience).toBe("public");
    if (broadcast.audience === "public")
      expect(broadcast.undercoverBroadcast?.mode).toBe("final");
    const revealed = await studio();
    expect(revealed.studioGame?.outcome).toBeDefined();
    expect(revealed.studioGame?.reveal).toHaveLength(3);
    expect(revealed.studioGame?.reveal?.map((card) => card.role)).toContain(
      "Undercover",
    );
    expect(
      renderToStaticMarkup(
        createElement(StudioReturnCanvas, {
          view: revealed,
          connection: "connected",
        }),
      ),
    ).toContain("Cet écran reste affiché jusqu’à l’action du Game Master");
  });
});
