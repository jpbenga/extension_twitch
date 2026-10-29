import { randomBytes, randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";
import {
  test,
  expect,
  type Page,
  type APIRequestContext,
  type TestInfo,
} from "@playwright/test";
import {
  gmSessionSchema,
  publicSessionSchema,
  type LobbyAction,
} from "@extension-twitch/contracts/sessions";
import {
  createUndercoverTvLayout,
  layoutPresets,
} from "@extension-twitch/contracts/undercover-layout";
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
function crc(bytes: Buffer) {
  let c = 0xffffffff;
  for (const v of bytes) {
    c ^= v;
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(kind: string, data: Buffer) {
  const b = Buffer.alloc(data.length + 12);
  b.writeUInt32BE(data.length);
  b.write(kind, 4);
  data.copy(b, 8);
  b.writeUInt32BE(crc(b.subarray(4, -4)), b.length - 4);
  return b;
}
/** Neutral test image generated in memory; no licensed illustration or external URL. */
function png() {
  const w = 640,
    h = 360,
    head = Buffer.alloc(13);
  head.writeUInt32BE(w);
  head.writeUInt32BE(h, 4);
  head[8] = 8;
  head[9] = 6;
  const rows = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * (w * 4 + 1) + 1 + x * 4;
      rows[i] = 30 + Math.round(x / 6);
      rows[i + 1] = 50 + Math.round(y / 3);
      rows[i + 2] = 130;
      rows[i + 3] = 255;
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", head),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
export async function officialTvFixture(
  request: APIRequestContext,
  count = 3,
  limit = 10,
) {
  const token = randomBytes(32).toString("base64url");
  const series = {
    id: randomUUID(),
    title: "Émission QA",
    position: 1,
    total: 2,
  };
  const prep = { id: randomUUID(), title: "Première paire", series };
  const created = await request.post(
    "/api/server/official-games/undercover/sessions",
    {
      headers: auth(token),
      data: {
        requestId: randomUUID(),
        settings: {
          "civil-word": "Phare",
          "undercover-word": "Balise",
          "round-limit": limit,
        },
        preparation: prep,
        broadcastTheme: "neon-show",
        overlayLayout: createUndercoverTvLayout(),
      },
    },
  );
  expect(created.status()).toBe(201);
  const { sessionId: id } = (await created.json()) as { sessionId: string };
  const read = async () =>
    gmSessionSchema.parse(
      await (
        await request.get(`/api/server/sessions/${id}/private`, {
          headers: auth(token),
        })
      ).json(),
    );
  const first = await read(),
    players: { id: string; name: string; token: string }[] = [];
  for (let i = 0; i < count; i++) {
    const t = randomBytes(32).toString("base64url"),
      name =
        count === 12
          ? `${i + 1} Jean-Christophe de Rochefort`.slice(0, 32)
          : ["Alex", "Camille", "Noa", "Lou", "Sam", "Inès"][i]!;
    const joined = await request.post(
      `/api/server/invitations/${first.invitationCode}/join`,
      { headers: auth(t), data: { requestId: randomUUID(), name } },
    );
    expect(joined.status()).toBe(201);
    const j = (await joined.json()) as { participantId: string };
    players.push({ id: j.participantId, name, token: t });
  }
  const command = async (command: LobbyAction, t = token) => {
    const v = await read();
    const r = await request.post(`/api/server/sessions/${id}/commands`, {
      headers: auth(t),
      data: { commandId: randomUUID(), expectedVersion: v.version, command },
    });
    expect(r.status()).toBe(200);
    return read();
  };
  const action = async (
    actionId: string,
    t = token,
    parameters: Record<string, string> = {},
  ) =>
    command(
      {
        type: "game.action",
        runId: (await read()).game!.runId,
        actionId,
        parameters,
      },
      t,
    );
  const clues = async () => {
    while (!(await read()).game!.play!.turns!.complete)
      await action("confirm-clue");
  };
  const publicView = async () =>
    publicSessionSchema.parse(
      await (await request.get(`/api/server/sessions/${id}/public`)).json(),
    );
  const image = async (contentId: string) => {
    const r = await request.post(
      `/api/server/sessions/${id}/media/${contentId}`,
      { headers: { ...auth(token), "Content-Type": "image/png" }, data: png() },
    );
    expect(r.status()).toBe(200);
  };
  await command({ type: "game.use-prepared" });
  return {
    id,
    token,
    players,
    prep,
    read,
    command,
    action,
    clues,
    publicView,
    image,
  };
}
