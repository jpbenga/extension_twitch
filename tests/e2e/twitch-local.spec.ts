import {
  test,
  expect,
  type Browser,
  type Page,
  type APIRequestContext,
  type TestInfo,
} from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { AddressInfo } from "node:net";
import { createTwitchGateway } from "../../scripts/twitch-gateway.ts";
import {
  gmSessionSchema,
  type LobbyAction,
} from "@extension-twitch/contracts/sessions";
import { undercoverSettingsSchema } from "@extension-twitch/contracts/official-games";
import { createUndercoverTvLayout } from "@extension-twitch/contracts/undercover-layout";
import { completeClues } from "./turn-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";
let directory: string,
  gateway: ReturnType<typeof createTwitchGateway>,
  origin: string;
const helperUrl =
  "https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js";
test.beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), "xt-twitch-browser-"));
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      join(directory, "key.pem"),
      "-out",
      join(directory, "cert.pem"),
      "-days",
      "1",
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { stdio: "ignore" },
  );
  gateway = createTwitchGateway({
    tls: {
      key: readFileSync(join(directory, "key.pem")),
      cert: readFileSync(join(directory, "cert.pem")),
    },
    upstream: "http://127.0.0.1:4000",
    dist: resolve("apps/twitch/dist"),
  });
  await new Promise<void>((r) => gateway.listen(0, "127.0.0.1", r));
  origin = `https://127.0.0.1:${(gateway.address() as AddressInfo).port}`;
});
test.afterAll(async () => {
  await new Promise<void>((r) => {
    gateway.close(() => r());
    gateway.closeAllConnections();
  });
  rmSync(directory, { recursive: true, force: true });
});
async function native(
  browser: Browser,
  info: TestInfo,
  configuration: unknown,
  helper = true,
) {
  // This exemption is scoped to the generated test-only certificate/context, never the developer launcher.
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: info.project.use.viewport ?? { width: 1440, height: 1000 },
  });
  await context.route(helperUrl, (route) =>
    helper
      ? route.fulfill({
          contentType: "text/javascript",
          body: `
    // Automated boundary fixture; this file is never shipped in the extension.
    let callback=()=>{};
    const configuration={broadcaster:${configuration === null ? "undefined" : JSON.stringify({ version: "1", content: JSON.stringify(configuration) })},onChanged(cb){callback=cb;queueMicrotask(cb)},set(segment,version,content){configuration.broadcaster={version,content};queueMicrotask(callback)}};
    window.Twitch={ext:{configuration,onAuthorized(cb){queueMicrotask(()=>cb({channelId:"123",clientId:"fixture"}))}}};
  `,
        })
      : route.abort(),
  );
  return { context, page: await context.newPage() };
}
async function fixture(request: APIRequestContext, count = 5) {
  const token = randomBytes(32).toString("base64url"),
    auth = { Authorization: `Bearer ${token}` };
  const prep = {
    id: randomUUID(),
    title: "Paire Twitch",
    series: { id: randomUUID(), title: "Test privé", position: 1, total: 2 },
  };
  const r = await request.post(
    "/api/server/official-games/undercover/sessions",
    {
      headers: auth,
      data: {
        requestId: randomUUID(),
        settings: {},
        preparation: prep,
        overlayLayout: createUndercoverTvLayout(),
      },
    },
  );
  expect(r.status()).toBe(201);
  const id = ((await r.json()) as { sessionId: string }).sessionId;
  const read = async () =>
    gmSessionSchema.parse(
      await (
        await request.get(`/api/server/sessions/${id}/private`, {
          headers: auth,
        })
      ).json(),
    );
  const first = await read(),
    players = [] as { id: string; name: string; token: string }[];
  for (let i = 0; i < count; i++) {
    const t = randomBytes(32).toString("base64url"),
      name = ["Alex", "Camille", "Noa", "Lou", "Sam"][i]!;
    const j = await request.post(
      `/api/server/invitations/${first.invitationCode}/join`,
      {
        headers: { Authorization: `Bearer ${t}` },
        data: { requestId: randomUUID(), name },
      },
    );
    expect(j.status()).toBe(201);
    players.push({
      id: ((await j.json()) as { participantId: string }).participantId,
      name,
      token: t,
    });
  }
  const command = async (command: LobbyAction, t = token) => {
    const v = await read();
    const r = await request.post(`/api/server/sessions/${id}/commands`, {
      headers: { Authorization: `Bearer ${t}` },
      data: { commandId: randomUUID(), expectedVersion: v.version, command },
    });
    expect(r.status()).toBe(200);
    return read();
  };
  const action = async (actionId: string) =>
    command({
      type: "game.action",
      runId: (await read()).game!.runId,
      actionId,
      parameters: {},
    });
  await command({ type: "game.use-prepared" });
  return { id, token, prep, players, command, action, read };
}
async function screenshot(p: Page, info: TestInfo, name: string) {
  await expect
    .poll(() =>
      p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({
    path:
      process.env.CAPTURE_TWITCH === "1"
        ? `docs/screenshots/twitch-local/${name}-${info.project.name}.png`
        : info.outputPath(`${name}.png`),
    omitBackground: true,
    fullPage: true,
    animations: "disabled",
  });
}
test("native entry points fail clearly without Twitch Helper and wait without a configured party", async ({
  browser,
}, info) => {
  const a = await native(browser, info, null, false);
  await a.page.goto(`${origin}/panel.html`);
  await expect(a.page.getByRole("status")).toContainText(
    "Helper Twitch n’est pas disponible",
  );
  await a.context.close();
  const b = await native(browser, info, null);
  await b.page.goto(`${origin}/mobile.html`);
  await expect(b.page.getByRole("status")).toContainText("pas encore associé");
  await b.context.close();
});
test("configuration rejects private links and persists only a public pointer through the helper boundary", async ({
  browser,
  request,
}, info) => {
  const f = await fixture(request, 3),
    n = await native(browser, info, null);
  await n.page.goto(`${origin}/config.html`);
  await n.page.getByLabel("Serveur public HTTPS").fill(origin);
  await n.page
    .getByLabel("Lien public du plateau")
    .fill(`http://127.0.0.1:3000/sessions/${f.id}/gm#access=invalid-fixture`);
  await n.page
    .getByRole("button", { name: "Associer cette partie", exact: true })
    .click();
  await expect(n.page.getByRole("status")).toContainText(
    "Lien public uniquement",
  );
  await n.page
    .getByLabel("Lien public du plateau")
    .fill(`http://127.0.0.1:3000/sessions/${f.id}/public`);
  await n.page
    .getByRole("button", { name: "Associer cette partie", exact: true })
    .click();
  await expect(n.page.getByRole("status")).toHaveText(
    "Partie associée au plateau Twitch.",
  );
  await screenshot(n.page, info, "config-automated-helper-fixture");
  await n.context.close();
});
test("real Undercover commands update native viewer, images, elimination, victory, reconnect, next preparation and replay", async ({
  browser,
  request,
}, info) => {
  const f = await fixture(request),
    nativeView = await native(browser, info, {
      version: 1,
      sessionId: f.id,
      apiOrigin: origin,
    });
  const n = nativeView.page;
  await n.goto(`${origin}/panel.html`);
  await expect(n.getByTestId("broadcast-connection")).toHaveText("Synchronisé");
  const errors: string[] = [];
  n.on("pageerror", (e) => errors.push(e.message));
  const gc = await browser.newContext({ baseURL: "http://127.0.0.1:3000" }),
    gm = await gc.newPage();
  await gm.goto(`/sessions/${f.id}/gm#access=${f.token}`);
  await expect(gm.getByTestId("session-connection")).toHaveText("Synchronisé");
  const playerContexts = await Promise.all(
    f.players.map(() =>
      browser.newContext({ baseURL: "http://127.0.0.1:3000" }),
    ),
  );
  const players = await Promise.all(playerContexts.map((c) => c.newPage()));
  for (let i = 0; i < players.length; i++)
    await players[i]!.goto(
      `/sessions/${f.id}/player/${f.players[i]!.id}#access=${f.players[i]!.token}`,
    );
  await screenshot(n, info, "waiting-automated-helper-fixture");
  await gm
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await expect(
    n.getByLabel("Overlay public de l’émission", { exact: true }),
  ).toHaveAttribute("data-phase", "discussion");
  await expect(n.locator(".tv-assignment,.tv-duo")).toHaveCount(0);
  const privateView = await f.read();
  const image = Buffer.from(
    await gm.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const x = c.getContext("2d")!;
      x.fillStyle = "#38dcc8";
      x.fillRect(0, 0, 64, 64);
      return c.toDataURL("image/png").split(",")[1]!;
    }),
    "base64",
  );
  const contents = privateView.undercoverPreparation!.contents;
  for (const c of [contents.a, contents.b])
    expect(
      (
        await request.post(`/api/server/sessions/${f.id}/media/${c.id}`, {
          headers: {
            Authorization: `Bearer ${f.token}`,
            "Content-Type": "image/png",
          },
          data: image,
        })
      ).status(),
    ).toBe(200);
  await f.command({ type: "undercover.publish", mode: "duo" });
  await expect(n.locator(".tv-duo")).toHaveCount(2);
  await expect(n.locator(".tv-duo").first()).toHaveCSS(
    "animation-name",
    "tv-duo-a",
  );
  await expect(n.locator(".tv-duo").first()).toHaveCSS(
    "animation-duration",
    "0.24s",
  );
  await expect(n.locator(".tv-duo img")).toHaveCount(2);
  await expect
    .poll(() =>
      n
        .locator(".tv-duo img")
        .evaluateAll((images) =>
          images.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(n.locator(".tv-assignment")).toHaveCount(0);
  await screenshot(n, info, "duo-images-automated-helper-fixture");
  const viewport = n.viewportSize()!;
  await n.setViewportSize({ width: 320, height: 180 });
  await screenshot(n, info, "small-panel-automated-helper-fixture");
  await n.setViewportSize(viewport);
  await f.command({ type: "undercover.publish", mode: "none" });
  await completeClues(gm);
  await gm
    .getByRole("button", { name: "Ouvrir les votes", exact: true })
    .click();
  await expect(n.getByTestId("broadcast-votes")).toContainText("0 / 5");
  const civilian = Object.entries(
    privateView.game!.management!.assignments!,
  ).find(([, role]) => role === "civil")![0];
  async function voteRound(target: string) {
    const active = (await f.read())
      .game!.play!.roster.filter((p) => p.active)
      .map((p) => p.id);
    for (let i = 0; i < f.players.length; i++) {
      const p = f.players[i]!;
      if (!active.includes(p.id)) continue;
      const t = f.players.find(
        (q) =>
          q.id ===
          (p.id === target ? active.find((id) => id !== target) : target),
      )!;
      await players[i]!.getByRole("radio", {
        name: t.name,
        exact: true,
      }).check();
      await players[i]!.getByRole("button", {
        name: "Voter",
        exact: true,
      }).click();
      await acceptConfirmation(players[i]!);
      await expect(
        players[i]!.getByRole("status").filter({ hasText: /Votre vote pour/ }),
      ).toBeVisible();
    }
    await gm
      .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
      .click();
    await acceptConfirmation(gm);
  }
  await voteRound(civilian);
  await expect(
    n.locator(".tv-event").filter({ hasText: "Élimination" }),
  ).toBeVisible();
  await screenshot(n, info, "elimination-automated-helper-fixture");
  await gm
    .getByRole("button", { name: "Commencer un nouveau cycle", exact: true })
    .click();
  await completeClues(gm);
  await gm
    .getByRole("button", { name: "Ouvrir les votes", exact: true })
    .click();
  const enemy = Object.entries(
    (await f.read()).game!.management!.assignments!,
  ).find(([, role]) => role === "undercover")![0];
  await voteRound(enemy);
  await expect(n.locator(".tv-assignment")).toHaveCount(3);
  await screenshot(n, info, "victory-automated-helper-fixture");
  await n.reload();
  await expect(n.getByTestId("broadcast-connection")).toHaveText("Synchronisé");
  await expect(n.locator(".tv-result-compact")).toBeVisible();
  await expect(n.locator(".tv-assignment")).toHaveCount(0);
  const second = await native(browser, info, {
    version: 1,
    sessionId: f.id,
    apiOrigin: origin,
  });
  await second.page.goto(`${origin}/video_overlay.html`);
  await expect(second.page.locator(".tv-result-compact")).toHaveText(
    (await n.locator(".tv-result-compact").textContent()) ?? "",
  );
  await f.command({
    type: "undercover.next",
    settings: undercoverSettingsSchema.parse({
      "civil-word": "Train",
      "undercover-word": "Tram",
    }),
    preparation: {
      id: randomUUID(),
      title: "Paire suivante",
      series: { ...f.prep.series, position: 2 },
    },
    overlayLayout: createUndercoverTvLayout(),
  });
  await expect(
    n.getByLabel("Overlay public de l’émission", { exact: true }),
  ).toHaveAttribute("data-phase", "preparation");
  await expect(n.locator(".tv-duo,.tv-assignment")).toHaveCount(0);
  await expect(n.locator("main")).not.toContainText("Train");
  await f.action("deal");
  await expect(
    n.getByLabel("Overlay public de l’émission", { exact: true }),
  ).toHaveAttribute("data-phase", "discussion");
  await f.command({
    type: "game.restart",
    runId: (await f.read()).game!.runId,
  });
  await expect(
    n.getByLabel("Overlay public de l’émission", { exact: true }),
  ).toHaveAttribute("data-phase", "preparation");
  expect(errors).toEqual([]);
  await Promise.all(
    [...playerContexts, gc, nativeView.context, second.context].map((c) =>
      c.close(),
    ),
  );
});
