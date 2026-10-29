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
async function fixture(request: APIRequestContext, count = 3, limit = 10) {
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
const root = (p: Page) =>
  p.getByLabel("Overlay public de l’émission", { exact: true });
async function ready(p: Page) {
  await expect(p.getByTestId("broadcast-connection")).toHaveText("Synchronisé");
  await expect(root(p)).toHaveAttribute("data-layout-version", "2");
}
async function capture(
  p: Page,
  info: TestInfo,
  name: string,
  transparent = true,
) {
  await p.evaluate(() => document.fonts.ready);
  expect(
    await root(p)
      .locator(".tv-round > span")
      .first()
      .evaluate((e) => {
        const r = e.getBoundingClientRect(),
          p = e.parentElement!.getBoundingClientRect();
        return r.left >= p.left - 1 && r.right <= p.right + 1;
      }),
  ).toBe(true);
  const result = await p.screenshot({
    path:
      process.env.CAPTURE_TV === "1"
        ? `docs/ux/implementation/undercover-tv/${name}.png`
        : info.outputPath(`${name}.png`),
    omitBackground: transparent,
    animations: "disabled",
  });
  if (
    process.env.CAPTURE_TV === "1" &&
    ["b3-duo-alpha", "b8-final-reveal-alpha"].includes(name)
  ) {
    const viewport = p.viewportSize()!;
    await p.setViewportSize({ width: 390, height: 220 });
    await p.screenshot({
      path: `docs/ux/implementation/undercover-tv/${name}-twitch390.png`,
      omitBackground: true,
      animations: "disabled",
    });
    await p.setViewportSize(viewport);
  }
  return result;
}
async function alpha(p: Page, b: Buffer) {
  expect(b[25]).toBe(6);
  expect(
    await p.evaluate(async (data) => {
      const i = new Image();
      i.src = `data:image/png;base64,${data}`;
      await i.decode();
      const c = document.createElement("canvas");
      c.width = i.width;
      c.height = i.height;
      const x = c.getContext("2d")!;
      x.drawImage(i, 0, 0);
      return x.getImageData(960, 540, 1, 1).data[3];
    }, b.toString("base64")),
  ).toBe(0);
}
async function voteAll(f: Awaited<ReturnType<typeof fixture>>) {
  for (let i = 0; i < f.players.length; i++)
    await f.action("vote", f.players[i]!.token, {
      target: f.players[i === 0 ? 1 : 0]!.id,
    });
}

test("TV renderer uses real public HTTP/SSE from preparation to publication, missing media, votes, final result, replay and next", async ({
  page,
  browser,
  request,
}, info) => {
  const f = await fixture(request);
  await page.goto(`/sessions/${f.id}/obs`);
  await ready(page);
  expect((await f.publicView()).undercoverBroadcast?.mode).toBe("none");
  await expect(root(page)).not.toContainText(/Phare|Balise/);
  await expect(root(page).locator(".tv-lower")).toHaveCount(0);
  await alpha(page, await capture(page, info, "b1-waiting-alpha"));
  const previewContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      baseURL: new URL(page.url()).origin,
    }),
    preview = await previewContext.newPage();
  await preview.goto(`/sessions/${f.id}/stream`);
  await ready(preview);
  await f.action("deal");
  await expect(root(page)).toHaveAttribute("data-phase", "discussion");
  await expect(root(page).locator(".tv-speaker")).toContainText(
    f.players[0]!.name,
  );
  await capture(page, info, "b2-discussion-alpha");
  const g = await f.read(),
    a = g.undercoverPreparation!.contents.a,
    b = g.undercoverPreparation!.contents.b;
  await f.image(a.id);
  await f.image(b.id);
  await f.command({ type: "undercover.publish", mode: "duo" });
  await expect(root(page).locator(".tv-duo")).toHaveCount(2);
  await expect(root(preview).locator(".tv-duo")).toHaveCount(2);
  await expect(root(page).locator("[data-player]")).toHaveCount(0);
  const anon = (await f.publicView()).undercoverBroadcast!;
  expect(anon.mode).toBe("duo");
  expect(anon).not.toHaveProperty("assignments");
  expect(JSON.stringify(anon)).not.toMatch(/participantId|Civil|Undercover/);
  await alpha(page, await capture(page, info, "b3-duo-alpha"));
  const lateContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      baseURL: new URL(page.url()).origin,
    }),
    late = await lateContext.newPage();
  await late.goto(`/sessions/${f.id}/obs`);
  await ready(late);
  await expect(root(late)).toHaveAttribute(
    "data-version",
    String((await f.publicView()).version),
  );
  await expect(root(late).locator(".tv-duo")).toHaveCount(0);
  await expect(late.getByTestId("broadcast-cue")).toHaveCount(0);
  await expect(root(page).locator(".tv-duo")).toHaveCount(0, {
    timeout: 10000,
  });
  await f.command({ type: "undercover.publish", mode: "assignments" });
  await expect(root(page).locator(".tv-assignment")).toHaveCount(3);
  await expect(root(page).locator(".tv-player")).toHaveText(
    f.players.map((p, i) => `#${i + 1} ${p.name}`),
  );
  await capture(page, info, "b4-assignments-alpha");
  const removed = await request.delete(
    `/api/server/sessions/${f.id}/media/${b.id}`,
    { headers: auth(f.token) },
  );
  expect(removed.status()).toBe(200);
  await f.command({ type: "undercover.publish", mode: "duo" });
  await expect(root(page).locator(".tv-duo img")).toHaveCount(1);
  expect(
    (await root(page).locator(".tv-word").allTextContents()).sort(),
  ).toEqual(["Balise", "Phare"]);
  await capture(page, info, "b14-text-fallback-alpha");
  await f.image(b.id);
  await expect(root(page).locator(".tv-duo img")).toHaveCount(2);
  await f.clues();
  await f.action("open-vote");
  await expect(page.getByTestId("broadcast-votes")).toHaveText(
    "0 / 3 votes reçus",
  );
  await voteAll(f);
  await expect(page.getByTestId("broadcast-votes")).toHaveText(
    "3 / 3 votes reçus",
  );
  await capture(page, info, "b5-vote-alpha");
  await f.action("resolve");
  await expect(root(page).locator(".tv-final-card")).toHaveCount(3);
  await expect(root(page).locator(".tv-camp")).toHaveCount(3);
  await capture(page, info, "b8-final-reveal-alpha");
  const result = (await f.read()).game!.play!.outcome!.label;
  await expect(root(page).locator(".tv-final-card")).toHaveCount(0, {
    timeout: 11000,
  });
  await expect(root(page).locator(".tv-result-compact")).toContainText(result);
  await capture(page, info, "b9-durable-result-alpha");
  const current = (await f.read()).undercoverPreparation!.id;
  await f.command({
    type: "game.restart",
    runId: (await f.read()).game!.runId,
  });
  expect((await f.read()).undercoverPreparation!.id).toBe(current);
  await expect(root(page)).toHaveAttribute("data-phase", "preparation");
  await expect(root(page)).not.toContainText(/Phare|Balise/);
  await f.action("deal");
  await f.clues();
  await f.action("open-vote");
  await voteAll(f);
  await f.action("resolve");
  await f.command({
    type: "undercover.next",
    preparation: {
      id: randomUUID(),
      title: "Deuxième paire",
      series: { ...f.prep.series, position: 2 },
    },
    settings: {
      "civil-word": "Jardin",
      "undercover-word": "Prairie",
      "undercover-count": 1,
      "clue-rounds": 2,
      "round-limit": 10,
    },
  });
  await expect(root(page)).toHaveAttribute("data-phase", "preparation");
  await expect(root(page).locator(".tv-result")).toContainText(
    "Le Game Master prépare la suite.",
  );
  await expect(root(page)).not.toContainText(/Jardin|Prairie|Phare|Balise/);
  expect((await f.read()).game!.play!.dealt).toBe(false);
  await capture(page, info, "b10-next-alpha");
  await previewContext.close();
  await lateContext.close();
});

test("TV twelve-player grouping keeps stable places and readable long names with public focus and all four layouts", async ({
  page,
  request,
}, info) => {
  const f = await fixture(request, 12);
  await page.goto(`/sessions/${f.id}/obs`);
  await ready(page);
  await f.action("deal");
  for (let i = 0; i < 9; i++) await f.action("confirm-clue");
  await expect(root(page).locator(".tv-speaker-number")).toHaveText("10");
  await expect(root(page).locator(".tv-speaker strong")).toHaveAttribute(
    "title",
    f.players[9]!.name,
  );
  await capture(page, info, "b11-twelve-player-focus-alpha");
  await f.command({ type: "undercover.publish", mode: "assignments", page: 0 });
  await expect(root(page).locator(".tv-assignment")).toHaveCount(3);
  await expect(root(page).locator(".tv-page")).toHaveText("1–3 / 12 · 1/4");
  await capture(page, info, "b12-first-page-alpha");
  await f.command({ type: "undercover.publish", mode: "assignments", page: 3 });
  await expect(root(page).locator(".tv-page")).toHaveText("10–12 / 12 · 4/4");
  await expect(root(page).locator(".tv-player").last()).toHaveText(
    `#12 ${f.players[11]!.name}`,
  );
  expect(
    await root(page)
      .locator(".tv-player")
      .last()
      .evaluate((e) => getComputedStyle(e).textOverflow),
  ).toBe("ellipsis");
  await capture(page, info, "b13-last-page-alpha");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root(page).locator(".tv-assignment").first()).toHaveCSS(
    "animation-name",
    "tv-fade-in",
  );
  await expect(root(page).locator(".tv-assignment").first()).toHaveCSS(
    "animation-duration",
    "0.1s",
  );
  await page.setViewportSize({ width: 390, height: 220 });
  await capture(page, info, "b13-twitch390-alpha");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const preset of layoutPresets) {
    await f.command({
      type: "overlay.configure",
      layout: createUndercoverTvLayout(preset.id),
    });
    await f.command({
      type: "undercover.publish",
      mode: "assignments",
      page: 3,
    });
    await expect(root(page).locator(".tv-assignment")).toHaveCount(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("TV tied round and draw are actual server results and no vote choice or unrevealed word enters a public card", async ({
  page,
  request,
}, info) => {
  const f = await fixture(request, 3, 1);
  await page.goto(`/sessions/${f.id}/obs`);
  await ready(page);
  await f.action("deal");
  await f.clues();
  await f.action("open-vote");
  for (let i = 0; i < 3; i++)
    await f.action("vote", f.players[i]!.token, {
      target: f.players[(i + 1) % 3]!.id,
    });
  const before = await f.publicView();
  expect(JSON.stringify(before)).not.toMatch(/ownVote|Phare|Balise/);
  await expect(root(page)).not.toContainText(/Phare|Balise/);
  await f.action("resolve");
  await expect(root(page).locator(".tv-final-card")).toHaveCount(3);
  expect((await f.read()).game!.play!.ballot!.tied).toBe(true);
  expect((await f.read()).game!.play!.outcome!.label).toMatch(/nulle/i);
  await capture(page, info, "b7-draw-reveal-alpha");
});

test("intermediate elimination and tied rounds retain their durable public result after the animation", async ({
  page,
  request,
}, info) => {
  const f = await fixture(request, 5);
  await page.goto(`/sessions/${f.id}/obs`);
  await ready(page);
  await f.action("deal");
  await f.clues();
  await f.action("open-vote");
  const gm = await f.read();
  const target = Object.entries(gm.game!.management!.assignments).find(
    ([, role]) => role === "civil",
  )![0];
  for (const p of f.players)
    await f.action("vote", p.token, {
      target:
        p.id === target ? f.players.find((q) => q.id !== target)!.id : target,
    });
  await f.action("resolve");
  expect((await f.read()).game!.play!.outcome).toBeUndefined();
  await expect(root(page).locator(".tv-result")).toContainText(
    f.players.find((p) => p.id === target)!.name,
  );
  await capture(page, info, "b6-elimination-alpha");
  await expect(page.getByTestId("broadcast-cue")).toHaveCount(0, {
    timeout: 11000,
  });
  await expect(root(page).locator(".tv-compact-note")).toContainText(
    f.players.find((p) => p.id === target)!.name,
  );
  await expect(root(page)).not.toContainText(/Phare|Balise/);
  await capture(page, info, "b6-durable-elimination-alpha");
  const tie = await fixture(request, 3);
  await page.goto(`/sessions/${tie.id}/obs`);
  await ready(page);
  await tie.action("deal");
  await tie.clues();
  await tie.action("open-vote");
  for (let i = 0; i < 3; i++)
    await tie.action("vote", tie.players[i]!.token, {
      target: tie.players[(i + 1) % 3]!.id,
    });
  await tie.action("resolve");
  expect((await tie.read()).game!.play!.outcome).toBeUndefined();
  await expect(root(page).locator(".tv-result")).toContainText("Égalité");
  await capture(page, info, "b7-tie-alpha");
});
