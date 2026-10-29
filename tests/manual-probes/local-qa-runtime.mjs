/** Real launcher/LAN/HTTPS probe. Uses a temporary database, never the user's sessions. */
import assert from "node:assert/strict";
import { createUndercoverTvLayout } from "@extension-twitch/contracts/undercover-layout";
import { spawn } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  createWriteStream,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import { request } from "node:https";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { privateAddresses } from "../../scripts/twitch-environment.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(resolve(root, "package.json"));
const { chromium } = require("@playwright/test");
const dir = mkdtempSync(join(tmpdir(), "xt-local-qa-"));
const ip = privateAddresses()[0];
assert(ip, "A private LAN interface is required");
const lan = `http://${ip}:3100`,
  desktop = "http://localhost:3100";
const ca = readFileSync(
  process.env.LOCAL_QA_CA_CERT ?? "missing-public-test-ca",
);
const records = {
  lanInterface: ip,
  webPort: 3100,
  apiPort: 4100,
  twitchPort: 8443,
  physicalIphone: false,
  physicalObs: false,
  authenticatedTwitch: false,
  checks: {},
};
let child, browser, currentPage;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function start(script) {
  const log = createWriteStream(
    join(dir, script.replaceAll(":", "-") + ".log"),
  );
  child = spawn("npm", ["run", script], {
    cwd: root,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PORT: "3100",
      SERVER_PORT: "4100",
      TWITCH_LOCAL_HOST: "localhost",
      TWITCH_LOCAL_PORT: "8443",
      PUBLIC_ORIGIN: lan,
      DATABASE_PATH: join(dir, "sessions.sqlite"),
    },
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  return child;
}
async function waitReady(url) {
  const end = Date.now() + 120000;
  while (Date.now() < end) {
    if (child?.exitCode !== null)
      throw new Error("Launcher exited before Ready; inspect local probe log");
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error("Launcher readiness timed out");
}
async function available(port, host) {
  await new Promise((ok, no) => {
    const s = createServer();
    s.once("error", no);
    s.listen(port, host, () => s.close(ok));
  });
}
async function stop() {
  if (!child) return;
  const p = child;
  child = undefined;
  if (p.exitCode === null) {
    process.kill(-p.pid, "SIGINT");
    await Promise.race([
      new Promise((r) => p.once("exit", r)),
      sleep(15000).then(() => {
        throw new Error("Launcher did not exit after SIGINT");
      }),
    ]);
  }
  for (const port of [3100, 4100, 8443]) await available(port, "127.0.0.1");
}
async function post(path, token, data) {
  const r = await fetch(`${lan}/api/server${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  assert(r.ok, `POST ${path.split("/")[1]} failed: ${r.status}`);
  return r.json();
}
async function httpsGet(path, sse = false) {
  return new Promise((ok, no) => {
    const r = request(`https://localhost:8443${path}`, { ca }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        body += c;
        if (sse && body.includes("\n\n")) {
          ok({ status: res.statusCode, body });
          r.destroy();
        }
      });
      res.on("end", () => ok({ status: res.statusCode, body }));
    });
    r.on("error", no);
    r.setTimeout(10000, () => r.destroy(new Error("HTTPS timeout")));
    r.end();
  });
}
try {
  const held = createServer();
  await new Promise((r) => held.listen(3100, "0.0.0.0", r));
  try {
    const guard = spawn("npm", ["run", "dev:lan"], {
      cwd: root,
      env: {
        ...process.env,
        PUBLIC_ORIGIN: lan,
        PORT: "3100",
        SERVER_PORT: "4100",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    guard.stdout.on("data", (c) => (output += c));
    guard.stderr.on("data", (c) => (output += c));
    const code = await new Promise((ok, no) => {
      const timer = setTimeout(() => {
        guard.kill();
        no(new Error("Port guard timed out"));
      }, 10000);
      guard.on("exit", (c) => {
        clearTimeout(timer);
        ok(c);
      });
      guard.on("error", no);
    });
    assert.equal(code, 1);
    assert.match(output, /Un port est déjà occupé/);
    assert(held.listening);
    records.checks.portOccupiedRefusedWithoutKillingExistingListener = true;
  } finally {
    await new Promise((r) => held.close(r));
  }
  start("dev:lan");
  await waitReady(`${lan}/api/server/health`);
  for (const base of [desktop, lan])
    for (const route of ["/", "/play/undercover", "/join"])
      assert.equal((await fetch(base + route)).status, 200);
  records.checks.lanAndLocalhostPages = true;
  const token = randomBytes(32).toString("base64url");
  const created = await post("/official-games/undercover/sessions", token, {
    requestId: randomUUID(),
    settings: {},
    overlayLayout: createUndercoverTvLayout(),
    preparation: {
      id: randomUUID(),
      title: "Sasuke / Itachi",
      series: { id: randomUUID(), title: "Test stream", position: 1, total: 3 },
    },
  });
  const id = created.sessionId;
  const read = async () => {
    const r = await fetch(`${lan}/api/server/sessions/${id}/private`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(r.status, 200);
    return r.json();
  };
  let v = await read();
  assert(v.publicUrl.startsWith(lan));
  assert.equal(v.participants.length, 0);
  assert.equal(v.game, undefined);
  const actors = [];
  for (const name of ["Alex", "Camille", "Noa"]) {
    const t = randomBytes(32).toString("base64url");
    const p = await post(`/invitations/${v.invitationCode}/join`, t, {
      requestId: randomUUID(),
      name,
    });
    actors.push({ ...p, token: t });
  }
  const command = async (command) => {
    v = await read();
    await post(`/sessions/${id}/commands`, token, {
      commandId: randomUUID(),
      expectedVersion: v.version,
      command,
    });
    return read();
  };
  await command({ type: "game.use-prepared" });
  v = await read();
  assert.equal(v.game.play.dealt, false);
  const runId = v.game.runId;
  await command({
    type: "game.action",
    runId,
    actionId: "deal",
    parameters: {},
  });
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? "/usr/bin/chromium",
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const p = await context.newPage();
  currentPage = p;
  p.on("pageerror", (e) =>
    console.log("Browser error:", e.message.slice(0, 200)),
  );
  // Reproduce the actual browser Origin header: GET-only localhost probes cannot catch this regression.
  await p.goto(`${desktop}/play/undercover`);
  await p.getByLabel("Nom du contenu A", { exact: true }).fill("Alias local A");
  await p.getByLabel("Nom du contenu B", { exact: true }).fill("Alias local B");
  const localImage = Buffer.from(
    await p.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 24;
      c.height = 24;
      c.getContext("2d").fillRect(0, 0, 24, 24);
      return c.toDataURL().split(",")[1];
    }),
    "base64",
  );
  await p.getByLabel("Image du contenu A", { exact: true }).setInputFiles({
    name: "neutral.png",
    mimeType: "image/png",
    buffer: localImage,
  });
  await p
    .getByRole("button", { name: "Ajouter cette manche", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Vérifier la partie", exact: true })
    .click();
  await p.getByRole("button", { name: "Ouvrir le salon", exact: true }).click();
  await p.waitForURL(/\/sessions\/[^/]+\/gm$/);
  assert.equal(new URL(p.url()).origin, desktop);
  const localView = await p.evaluate(async () => {
    const sessionId = location.pathname.split("/")[2];
    const r = await fetch(`/api/server/sessions/${sessionId}/private`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${sessionId}:gm`)}`,
      },
    });
    return r.json();
  });
  assert(localView.publicUrl.startsWith(lan));
  assert.equal(localView.participants.length, 0);
  assert.equal(localView.game, undefined);
  assert(localView.undercoverPreparation.contents.a.image);
  const mediaStatus = await p.evaluate(async (url) => {
    const sessionId = location.pathname.split("/")[2];
    return (
      await fetch(url, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${sessionId}:gm`)}`,
        },
      })
    ).status;
  }, localView.undercoverPreparation.contents.a.image.url);
  assert.equal(mediaStatus, 200);
  await p.goto(`${desktop}/play/undercover?view=series`);
  await p
    .getByRole("button", { name: "Modifier", exact: true })
    .first()
    .click();
  assert.equal(
    await p.getByLabel("Nom du contenu A", { exact: true }).inputValue(),
    "Alias local A",
  );
  assert.equal(
    await p.getByLabel("Nom du contenu B", { exact: true }).inputValue(),
    "Alias local B",
  );
  assert.equal(
    await p
      .getByRole("button", { name: "Retirer l’image A", exact: true })
      .count(),
    1,
  );
  records.checks.localhostBrowserCanOpenSalonWithCanonicalLanOrigin = true;
  records.checks.localhostPreparationAndImagePreserved = true;
  const response = await p.goto(
    `${lan}/sessions/${id}/player/${actors[0].participantId}#access=${actors[0].token}`,
  );
  let browserOrigin = lan;
  if (
    response?.status() === 403 &&
    (await p.locator("body").textContent())?.includes("Domain forbidden")
  ) {
    // Cloud browser proxy restriction: do not bypass it. HTTP/SSE LAN checks below still use the local runtime client.
    records.lanBrowserState = "BLOCKED_BY_CLOUD_PROXY";
    browserOrigin = desktop;
    await p.goto(
      `${desktop}/sessions/${id}/player/${actors[0].participantId}#access=${actors[0].token}`,
    );
  } else records.lanBrowserState = "PASS";
  await p.waitForFunction(
    () =>
      document.querySelector('[data-testid="session-connection"]')
        ?.textContent === "Synchronisé",
    undefined,
    { timeout: 20000 },
  );
  assert(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await p.goto(`${browserOrigin}/sessions/${id}/obs`);
  await p.waitForFunction(
    () =>
      document.querySelector('[data-testid="broadcast-connection"]')
        ?.textContent === "Synchronisé",
    undefined,
    { timeout: 20000 },
  );
  const image = Buffer.from(
    await p.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const x = c.getContext("2d");
      x.fillStyle = "#b396ff";
      x.fillRect(0, 0, 32, 32);
      return c.toDataURL().split(",")[1];
    }),
    "base64",
  );
  const contentIds = Object.values(
    (await read()).undercoverPreparation.contents,
  ).map((c) => c.id);
  async function upload() {
    for (const cid of contentIds) {
      const r = await fetch(`${lan}/api/server/sessions/${id}/media/${cid}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "image/png",
        },
        body: image,
      });
      assert.equal(r.status, 200);
    }
  }
  await upload();
  assert(
    (await fetch(`${lan}/api/server/sessions/${id}/media/${contentIds[0]}`))
      .status >= 400,
  );
  await command({ type: "undercover.publish", mode: "duo" });
  await p.locator(".tv-duo").first().waitFor();
  records.checks.mobileChromiumAndLiveSse = true;
  await context.close();
  await browser.close();
  browser = undefined;
  const ctrl = new AbortController();
  const s = await fetch(`${lan}/api/server/sessions/${id}/public/events`, {
    signal: ctrl.signal,
  });
  const reader = s.body.getReader();
  let pending = "";
  async function nextLanView() {
    while (true) {
      const end = pending.indexOf("\n\n");
      if (end >= 0) {
        const frame = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (frame.startsWith("data: ")) return JSON.parse(frame.slice(6)).view;
      } else {
        const chunk = await reader.read();
        assert(!chunk.done, "LAN SSE closed unexpectedly");
        pending += new TextDecoder().decode(chunk.value);
      }
    }
  }
  const timeout = setTimeout(() => ctrl.abort(), 15000);
  try {
    const snapshot = await nextLanView();
    assert.equal(snapshot.audience, "public");
    assert.equal(snapshot.undercoverBroadcast.mode, "duo");
    assert(!("assignments" in snapshot.undercoverBroadcast));
    assert(!JSON.stringify(snapshot).includes(token));
    records.checks.anonymousLanSse = true;
    for (const c of snapshot.undercoverBroadcast.contents)
      assert.equal((await fetch(`${lan}${c.image.url}`)).status, 200);
    records.checks.authorizedLanMedia = true;
    await command({ type: "undercover.publish", mode: "none" });
    let changed = await nextLanView();
    while (changed.version <= snapshot.version) changed = await nextLanView();
    assert.equal(changed.undercoverBroadcast.mode, "none");
    records.checks.liveLanSseUpdate = true;
  } finally {
    clearTimeout(timeout);
    ctrl.abort();
  }
  await command({ type: "undercover.publish", mode: "duo" });

  await stop();
  records.checks.lanShutdownReleasesPorts = true;
  start("twitch:local");
  await waitReady(`${lan}/api/server/health`);
  assert.equal((await read()).game.runId, runId);
  records.checks.sqliteRestartAndPrivateCapability = true;
  const twitchLocalCreate = await fetch(
    `${desktop}/api/server/official-games/undercover/sessions`,
    {
      method: "POST",
      headers: {
        Origin: desktop,
        Authorization: `Bearer ${randomBytes(32).toString("base64url")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId: randomUUID(), settings: {} }),
    },
  );
  assert.equal(twitchLocalCreate.status, 201);
  records.checks.localhostMutationUnderTwitchLauncher = true;

  for (const path of [
    "/",
    "/panel.html",
    "/config.html",
    "/mobile.html",
    "/video_overlay.html",
  ])
    assert.equal((await httpsGet(path)).status, 200);
  await upload(); // Relay storage is temporary; the current GM reconnects the same authorized image after restart.
  const pub = await httpsGet(`/api/server/sessions/${id}/public`);
  assert.equal(pub.status, 200);
  assert.equal(JSON.parse(pub.body).audience, "public");
  for (const c of JSON.parse(pub.body).undercoverBroadcast.contents)
    assert.equal((await httpsGet(c.image.url)).status, 200);
  records.checks.authorizedHttpsMedia = true;

  assert(!pub.body.includes(token));
  assert.equal(
    (await httpsGet(`/api/server/sessions/${id}/private`)).status,
    404,
  );
  const hs = await httpsGet(`/api/server/sessions/${id}/public/events`, true);
  assert.equal(hs.status, 200);
  assert.equal(
    JSON.parse(hs.body.split("data: ")[1].split("\n\n")[0]).view
      .undercoverBroadcast.mode,
    "duo",
  );
  const css = await httpsGet("/viewer.css");
  assert(css.body.includes("tv-duo-a"));
  assert(css.body.includes("tv-transient"));
  assert(css.body.includes("prefers-reduced-motion"));
  records.checks.trustedHttpsViewerConfigAndFinalMotion = true;
  records.checks.publicOnlyHttpsHttpAndSse = true;
  await stop();
  records.checks.twitchShutdownReleasesPorts = true;
  writeFileSync(
    resolve(root, "docs/screenshots/local-qa/runtime-verification.json"),
    JSON.stringify(records, null, 2) + "\n",
  );
  console.log(JSON.stringify(records, null, 2));
} catch (error) {
  if (currentPage && !currentPage.isClosed()) {
    console.log(
      "Browser alert:",
      await currentPage
        .locator('[role="alert"],[data-testid="session-connection"]')
        .allTextContents(),
    );
    await currentPage.screenshot({
      path: "/tmp/xt-qa-runtime-failure.png",
      mask: [currentPage.locator("input")],
    });
  }
  for (const name of ["dev-lan.log", "twitch-local.log"]) {
    try {
      writeFileSync(`/tmp/xt-qa-${name}`, readFileSync(join(dir, name)));
    } catch {}
  }
  throw error;
} finally {
  if (browser) await browser.close();
  await stop();
  rmSync(dir, { recursive: true, force: true });
}
