import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { openPrepareDemo, launchPrepareDemo } from "./undercover-helpers.js";
const primary = (page: Page) =>
  page.getByRole("button", { name: "Préparer la partie", exact: true });
async function show(page: Page, key: string) {
  const d = page.locator(`[data-prepare-option="${key}"]`);
  if ((await d.getAttribute("open")) === null)
    await d.locator(":scope > summary").click();
  return d;
}
async function start(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.goto("/play/undercover");
  await expect(primary(page)).toBeEnabled();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "neon-show");
}
async function privateView(page: Page) {
  return page.evaluate(async () => {
    const id = location.pathname.split("/")[2]!;
    const token = sessionStorage.getItem(`xt:access:${id}:gm`);
    return (
      await fetch(`/api/server/sessions/${id}/private`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();
  });
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.locator('meta[name="viewport"]').getAttribute("content"),
  ).not.toMatch(/user-scalable=no|maximum-scale=1(?:,|$)/);
  for (const el of await page
    .locator(
      ".prepare-undercover button:visible,.prepare-undercover summary:visible,.prepare-segments label",
    )
    .all())
    expect(
      (await el.boundingBox())!.height,
      await el.evaluate(
        (e) => `${e.tagName}: ${e.textContent} [${e.className}]`,
      ),
    ).toBeGreaterThanOrEqual(44);
  for (const el of await page
    .locator(
      ".prepare-undercover input:not([type=radio]):visible,.prepare-undercover select:visible",
    )
    .all())
    expect(
      await el.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(16);
}
test("approved preparation is bounded, keyboard accessible, remembers options and keeps the public theme independent", async ({
  page,
}, info) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") writes.push(r.url());
  });
  await start(page);
  await expect(
    page.getByLabel("Participants prévus", { exact: true }),
  ).toHaveValue("4");
  await expect(
    page.getByRole("radio", { name: "2 tours d’indices", exact: true }),
  ).toBeChecked();
  await fits(page);
  if (["desktop", "mobile"].includes(info.project.name)) {
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({
      path:
        process.env.CAPTURE_B2 === "1"
          ? `docs/ux/redesign/prepare-undercover-${info.project.name}/implementation-${info.project.name}.png`
          : info.outputPath(`prepare-${info.project.name}.png`),
      fullPage: true,
      animations: "disabled",
    });
  }
  const minus = page.getByRole("button", {
    name: "Diminuer le nombre de participants",
    exact: true,
  });
  const plus = page.getByRole("button", {
    name: "Augmenter le nombre de participants",
    exact: true,
  });
  await minus.click();
  await expect(minus).toBeDisabled();
  for (let n = 3; n < 12; n++) await plus.click();
  await expect(plus).toBeDisabled();
  await page.getByLabel("Participants prévus", { exact: true }).fill("6");
  const three = page.getByRole("radio", {
    name: "3 tours d’indices",
    exact: true,
  });
  await three.check();
  await expect(page.locator(".prepare-summary")).toContainText(
    "3 tours d’indices",
  );
  await show(page, "words");
  await page.getByLabel("Mot des civils", { exact: true }).fill("Océan");
  await page.getByLabel("Mot des Undercover", { exact: true }).fill("Rivière");
  await show(page, "roles");
  await page.getByLabel("Nombre d’Undercover", { exact: true }).fill("2");
  await page.getByLabel("Maximum de manches", { exact: true }).fill("12");
  await show(page, "broadcast");
  await page
    .getByLabel("Thème de l’émission", { exact: true })
    .selectOption("on-air-premium");
  await page.getByLabel("Joueurs · Hauteur", { exact: true }).fill("340");
  await page.reload();
  await expect(primary(page)).toBeEnabled();
  await expect(
    page.getByLabel("Participants prévus", { exact: true }),
  ).toHaveValue("6");
  await expect(three).toBeChecked();
  for (const key of ["words", "roles", "broadcast", "laboratory"])
    await expect(
      page.locator(`[data-prepare-option=${key}]`),
    ).not.toHaveAttribute("open", "");
  await show(page, "words");
  await expect(page.getByLabel("Mot des civils", { exact: true })).toHaveValue(
    "Océan",
  );
  await show(page, "roles");
  await expect(
    page.getByLabel("Nombre d’Undercover", { exact: true }),
  ).toHaveValue("2");
  await expect(
    page.getByLabel("Maximum de manches", { exact: true }),
  ).toHaveValue("12");
  await show(page, "broadcast");
  await expect(
    page.getByLabel("Thème de l’émission", { exact: true }),
  ).toHaveValue("on-air-premium");
  await expect(
    page.getByLabel("Joueurs · Hauteur", { exact: true }),
  ).toHaveValue("340");
  await page.getByLabel("Apparence de l’application", { exact: true }).click();
  await page
    .getByLabel("Thème de l’application", { exact: true })
    .selectOption("broadcast-studio");
  await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Overlay public de l’émission", { exact: true }),
  ).toHaveAttribute("data-theme", "on-air-premium");
  await fits(page);
  expect(writes).toEqual([]);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 390, height: 500 });
    const field = page.getByLabel("Maximum de manches", { exact: true });
    await field.focus();
    await field.scrollIntoViewIfNeeded();
    const r = (await field.boundingBox())!;
    const b = (await primary(page).boundingBox())!;
    expect(r.y + r.height).toBeLessThanOrEqual(b.y);
    expect(b.y + b.height).toBeLessThanOrEqual(500);
  }
});
test("preparing an invitation creates no fake players, does not cap the salon, and leaves distribution to the GM", async ({
  page,
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  const bodies: Record<string, unknown>[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/official-games/undercover/sessions"))
      bodies.push(r.postDataJSON());
  });
  await start(page);
  await page.getByLabel("Participants prévus", { exact: true }).fill("3");
  await primary(page).click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  await expect(page.locator("[data-experience=salon]")).toBeVisible();
  let view = await privateView(page);
  expect(view.participants).toHaveLength(0);
  expect(view.preparedGame.maximumPlayers).toBe(12);
  expect(view.game).toBeUndefined();
  for (const key of ["count", "mode", "maxParticipants"])
    expect(bodies[0]).not.toHaveProperty(key);
  const invitation = await page
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
  const players: Page[] = [];
  try {
    for (const name of ["Alex", "Lou", "Sam", "Noa"]) {
      const c = await browser.newContext({ viewport: page.viewportSize()! });
      contexts.push(c);
      const player = await c.newPage();
      players.push(player);
      await player.goto(invitation);
      await player.getByLabel("Votre nom", { exact: true }).fill(name);
      await player
        .getByRole("button", { name: "Rejoindre la partie", exact: true })
        .click();
      await expect(player.getByTestId("session-connection")).toHaveText(
        "Synchronisé",
      );
    }
    await expect
      .poll(async () => (await privateView(page)).participants.length)
      .toBe(4);
    await page
      .getByRole("button", { name: "Préparer la partie", exact: true })
      .click();
    await expect(page.locator("[data-experience=gm]")).toBeVisible();
    view = await privateView(page);
    expect(view.game.play.dealt).toBe(false);
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await expect(
      players[0]!.getByRole("button", { name: "Masquer mon mot", exact: true }),
    ).toBeVisible();
    const publicView = await (
      await page.request.get(
        `/api/server/sessions/${(await privateView(page)).sessionId}/public`,
      )
    ).json();
    expect(JSON.stringify(publicView)).not.toMatch(
      /Phare|Fusée|management|civil-word|undercover-word/,
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
test("invalid words and role ratios stay editable, a definite refusal clears its receipt, and QA remains separate", async ({
  page,
}) => {
  await start(page);
  let writes = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/official-games/undercover/sessions")) writes++;
  });
  await show(page, "words");
  await page.getByLabel("Mot des Undercover", { exact: true }).fill("PHARE");
  await primary(page).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "deux mots différents",
  );
  await expect(
    page.getByLabel("Mot des Undercover", { exact: true }),
  ).toHaveValue("PHARE");
  expect(writes).toBe(0);
  await page.getByLabel("Mot des Undercover", { exact: true }).fill("Fusée");
  await show(page, "roles");
  await page.getByLabel("Nombre d’Undercover", { exact: true }).fill("2");
  await openPrepareDemo(page);
  await page.getByLabel("Joueurs de démonstration", { exact: true }).fill("3");
  await launchPrepareDemo(page);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "moins d’Undercover",
  );
  expect(writes).toBe(0);
  await page.getByLabel("Nombre d’Undercover", { exact: true }).fill("1");
  await page.route(
    "**/api/server/official-games/undercover/sessions",
    (route) => route.fulfill({ status: 400, json: { error: "INVALID_INPUT" } }),
  );
  await primary(page).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Vérifiez les champs",
  );
  expect(
    await page.evaluate(() => sessionStorage.getItem("xt:official:pending")),
  ).toBeNull();
  await page.unroute("**/api/server/official-games/undercover/sessions");
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  const labId = page.url().split("/").pop()!;
  const lab = await page.evaluate(
    (id) => JSON.parse(sessionStorage.getItem(`xt:creator:lab:${id}`)!),
    labId,
  );
  expect(lab.players).toHaveLength(3);
  await page.goto("/play/undercover");
  await primary(page).click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  expect((await privateView(page)).participants).toHaveLength(0);
});

test("an uncertain response freezes its exact identity across edits, reload, retry and double submissions", async ({
  page,
}) => {
  await start(page);
  const requests: { body: string | null; auth: string | undefined }[] = [];
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/server/official-games/undercover/sessions",
    async (route) => {
      requests.push({
        body: route.request().postData(),
        auth: route.request().headers()["authorization"],
      });
      if (requests.length === 1) {
        await gate;
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    },
  );
  await primary(page).click();
  await expect(
    page.getByRole("button", {
      name: "Préparation de la partie…",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Participants prévus", { exact: true }),
  ).toBeDisabled();
  await page.evaluate(() => {
    const form = document.querySelector("form")!;
    form.requestSubmit();
    form.requestSubmit();
  });
  expect(requests).toHaveLength(1);
  release();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "La préparation n’a pas été confirmée",
  );
  await page.reload();
  const resume = page.getByRole("button", {
    name: "Reprendre la préparation",
    exact: true,
  });
  await expect(resume).toBeEnabled();
  await page.getByLabel("Participants prévus", { exact: true }).fill("5");
  await resume.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "restaurés",
  );
  await expect(
    page.getByLabel("Participants prévus", { exact: true }),
  ).toHaveValue("4");
  expect(requests).toHaveLength(1);
  await resume.click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
});

test("unavailable tab storage shows a useful error and never creates an untracked session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === sessionStorage)
        throw new DOMException("Unavailable", "SecurityError");
      return original.call(this, key, value);
    };
  });
  let writes = 0;
  page.on("request", (r) => {
    if (r.method() === "POST") writes++;
  });
  await start(page);
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await primary(page).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Autorisez le stockage",
  );
  expect(writes).toBe(0);
  await expect(
    page.getByLabel("Participants prévus", { exact: true }),
  ).toHaveValue("4");
});
