import { test, expect, type Page } from "@playwright/test";
import {
  openPreparedSalon,
  openPrepareDemo,
  launchPrepareDemo,
  openPrepareBroadcast,
} from "./undercover-helpers.js";
const alert = (p: Page) => p.locator("main [role=alert]");
const add = (p: Page) =>
  p.getByRole("button", { name: "Ajouter cette manche", exact: true });
async function start(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.goto("/play/undercover");
  await expect(add(page)).toBeEnabled();
}
async function options(page: Page, key: string) {
  if (key === "broadcast") {
    await openPrepareBroadcast(page);
    return;
  }
  const outer = page.locator(".consolidation-options");
  await expect(outer).toBeAttached();
  if ((await outer.count()) && (await outer.getAttribute("open")) === null)
    await outer.locator(":scope > summary").click();
  const d = page.locator(`[data-prepare-option="${key}"]`);
  if ((await d.getAttribute("open")) === null)
    await d.locator(":scope > summary").click();
}
async function ready(page: Page) {
  await add(page).click();
  await page
    .getByRole("button", { name: "Vérifier la partie", exact: true })
    .click();
}
async function fit(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.locator('meta[name="viewport"]').getAttribute("content"),
  ).not.toMatch(/user-scalable=no|maximum-scale=1(?:,|$)/);
  for (const e of await page
    .locator(
      ".series-studio button:visible,.series-studio summary:visible,.series-studio a:visible",
    )
    .all())
    expect(
      (await e.boundingBox())!.height,
      (await e.textContent()) ?? "control",
    ).toBeGreaterThanOrEqual(44);
  for (const e of await page
    .locator(
      ".series-studio input:not([type=radio]):not([type=file]):visible,.series-studio select:visible",
    )
    .all())
    expect(
      await e.evaluate((x) => parseFloat(getComputedStyle(x).fontSize)),
    ).toBeGreaterThanOrEqual(16);
}
async function privateView(page: Page) {
  return page.evaluate(async () => {
    const id = location.pathname.split("/")[2]!;
    return (
      await fetch(`/api/server/sessions/${id}/private`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${id}:gm`)}`,
        },
      })
    ).json();
  });
}
test("preparation remains bounded, touch and keyboard accessible, remembers options and keeps broadcast appearance independent", async ({
  page,
}, info) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") writes.push(r.url());
  });
  await start(page);
  await fit(page);
  const count = page.getByLabel("Participants prévus", { exact: true });
  await expect(count).toHaveValue("4");
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
  await count.fill("13");
  await add(page).click();
  await expect(alert(page)).toContainText("3 à 12 participants");
  await expect(count).toHaveValue("13");
  await count.fill("6");
  await page
    .getByRole("radio", { name: "3 tours d’indices", exact: true })
    .check();
  await options(page, "roles");
  await page.getByLabel("Nombre d’Undercover", { exact: true }).fill("2");
  await page.getByLabel("Maximum de cycles", { exact: true }).fill("12");
  await options(page, "broadcast");
  await page
    .getByLabel("Thème de l’émission", { exact: true })
    .selectOption("on-air-premium");
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("players");
  await page.getByLabel("Joueurs · Hauteur", { exact: true }).fill("340");
  await expect(page.locator(".series-save-state")).toHaveText(
    "Enregistré sur cet appareil",
  );
  await page.reload();
  await page.goto("/play/undercover?view=prepare");
  await expect(count).toHaveValue("6");
  await expect(
    page.getByRole("radio", { name: "3 tours d’indices", exact: true }),
  ).toBeChecked();
  for (const key of ["roles", "broadcast", "laboratory"])
    await expect(
      page.locator(`[data-prepare-option=${key}]`),
    ).not.toHaveAttribute("open", "");
  await options(page, "roles");
  await expect(
    page.getByLabel("Nombre d’Undercover", { exact: true }),
  ).toHaveValue("2");
  await expect(
    page.getByLabel("Maximum de cycles", { exact: true }),
  ).toHaveValue("12");
  await options(page, "broadcast");
  await expect(
    page.getByLabel("Thème de l’émission", { exact: true }),
  ).toHaveValue("on-air-premium");
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("players");
  await expect(
    page.getByLabel("Joueurs · Hauteur", { exact: true }),
  ).toHaveValue("340");
  await page.getByLabel("Apparence de l’application", { exact: true }).click();
  await page
    .getByLabel("Thème de l’application", { exact: true })
    .selectOption("broadcast-studio");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", {
      name: "Overlay public de l’émission",
      exact: true,
    }),
  ).toHaveAttribute("data-theme", "on-air-premium");
  await fit(page);
  expect(writes).toEqual([]);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 390, height: 500 });
    await page.goto("/play/undercover?view=prepare");
    await options(page, "roles");
    const field = page.getByLabel("Maximum de cycles", { exact: true });
    await field.focus();
    await field.scrollIntoViewIfNeeded();
    const r = (await field.boundingBox())!,
      b = (await add(page).boundingBox())!;
    expect(r.y + r.height).toBeLessThanOrEqual(b.y);
    expect(b.y + b.height).toBeLessThanOrEqual(500);
  }
});
test("planned count is not salon capacity, invitations create no fake participants and preparation never deals words", async ({
  page,
  browser,
}) => {
  await start(page);
  await page.getByLabel("Participants prévus", { exact: true }).fill("3");
  await openPreparedSalon(page);
  const initial = await privateView(page);
  expect(initial.participants).toHaveLength(0);
  expect(initial.game).toBeUndefined();
  const invitation = await page
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
  const contexts = [];
  try {
    for (let i = 0; i < 5; i++) {
      const c = await browser.newContext();
      contexts.push(c);
      const p = await c.newPage();
      await p.goto(invitation);
      await p.getByLabel("Votre nom", { exact: true }).fill(`Invité ${i + 1}`);
      await p
        .getByRole("button", { name: "Rejoindre la partie", exact: true })
        .click();
      await expect(p.getByTestId("session-connection")).toHaveText(
        "Synchronisé",
      );
    }
    expect((await privateView(page)).participants).toHaveLength(5);
    await page
      .getByRole("button", { name: "Préparer la partie", exact: true })
      .click();
    expect((await privateView(page)).game.play.dealt).toBe(false);
    const pub = await (
      await page.request.get(`/api/server/sessions/${initial.sessionId}/public`)
    ).json();
    expect(JSON.stringify(pub)).not.toMatch(
      /Phare|Fusée|civil-word|undercover-word|management/,
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
test("invalid names and role ratio stay editable, a definite refusal clears its receipt, and QA stays separate", async ({
  page,
}) => {
  await start(page);
  let writes = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/official-games/undercover/sessions")) writes++;
  });
  const secondary = page.locator(".consolidation-options");
  if (
    (await secondary.count()) &&
    (await secondary.getAttribute("open")) === null
  )
    await secondary.locator(":scope > summary").click();
  await page
    .getByRole("button", { name: "Modifier les contenus", exact: true })
    .click();
  await page.getByLabel("Nom du contenu B", { exact: true }).fill("PHARE");
  await page
    .getByRole("button", { name: "Enregistrer la manche", exact: true })
    .click();
  await expect(alert(page)).toContainText("deux noms différents");
  expect(writes).toBe(0);
  await page.getByLabel("Nom du contenu B", { exact: true }).fill("Fusée");
  await page
    .getByRole("button", { name: "Enregistrer la manche", exact: true })
    .click();
  await options(page, "roles");
  await page.getByLabel("Nombre d’Undercover", { exact: true }).fill("2");
  await openPrepareDemo(page);
  await page.getByLabel("Joueurs de démonstration", { exact: true }).fill("3");
  await launchPrepareDemo(page);
  await expect(alert(page)).toContainText("moins d’Undercover");
  expect(writes).toBe(0);
  await options(page, "roles");
  await page.getByLabel("Nombre d’Undercover", { exact: true }).fill("1");
  await ready(page);
  await page.route("**/api/server/official-games/undercover/sessions", (r) =>
    r.fulfill({ status: 400, json: { error: "INVALID_INPUT" } }),
  );
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .click();
  await expect(alert(page)).toContainText("Vérifiez les champs");
  expect(
    await page.evaluate(() => sessionStorage.getItem("xt:official:pending")),
  ).toBeNull();
  await page.unroute("**/api/server/official-games/undercover/sessions");
  await page.goto("/play/undercover?view=prepare");
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
});
test("uncertain response retains exactly its identity through reload, changed local preparation, retry and double clicks", async ({
  page,
}) => {
  await start(page);
  await ready(page);
  const requests: { body: string | null; auth: string | undefined }[] = [];
  await page.route(
    "**/api/server/official-games/undercover/sessions",
    async (route) => {
      requests.push({
        body: route.request().postData(),
        auth: route.request().headers()["authorization"],
      });
      if (requests.length === 1) {
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    },
  );
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .dblclick();
  await expect(alert(page)).toContainText("n’a pas été confirmée");
  expect(requests).toHaveLength(1);
  await page.reload();
  const resume = page.getByRole("button", {
    name: "Reprendre la préparation",
    exact: true,
  });
  await expect(resume).toBeEnabled();
  await page
    .getByRole("button", { name: "‹ Ma partie Undercover", exact: true })
    .click();
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .getByLabel("Nom du contenu A", { exact: true })
    .fill("Modification après coup");
  await page
    .getByRole("button", { name: "Enregistrer la manche", exact: true })
    .click();
  await resume.click();
  await expect(alert(page)).toContainText("restaurés");
  expect(requests).toHaveLength(1);
  await resume.click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
  expect((await privateView(page)).undercoverPreparation.contents.a.label).toBe(
    "Phare",
  );
});
test("unavailable tab storage prevents an untracked session while durable local edits remain available", async ({
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
  await ready(page);
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .click();
  await expect(alert(page)).toContainText("Autorisez le stockage");
  expect(writes).toBe(0);
  await page
    .getByRole("button", { name: "‹ Ma partie Undercover", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(1);
});
