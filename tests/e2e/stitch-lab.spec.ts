import {
  launchPrepareDemo,
  openPrepareBroadcast,
  openUndercoverOptions,
} from "./undercover-helpers.js";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { join } from "node:path";

async function createLab(page: Page, start = true) {
  await page.goto("/play/undercover");
  await page.evaluate(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.reload();
  await openUndercoverOptions(page);
  await page
    .getByLabel("Nom du contenu A", { exact: true })
    .fill("Phare confidentiel");
  await page
    .getByLabel("Nom du contenu B", { exact: true })
    .fill("Balise confidentielle");
  await openPrepareBroadcast(page);
  await page
    .getByLabel("Thème de l’émission", { exact: true })
    .selectOption("neon-show");
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  if (start) {
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await expect(page.locator("#game .turn-progress")).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: /Confirmer (?:l’indice|le passage)/ })
        .first(),
    ).toBeEnabled();
  }
  return page.url().split("/").pop()!;
}
async function section(page: Page, title: string, open = true) {
  const panel = page
    .locator("details.lab-stitch-disclosure")
    .filter({ has: page.locator(":scope > summary", { hasText: title }) });
  if ((await panel.getAttribute("open")) !== (open ? "" : null))
    await panel.locator(":scope > summary").click();
  return panel;
}
async function capture(page: Page, info: TestInfo, slug: string) {
  if (slug.endsWith("desktop") && info.project.name !== "desktop") return;
  if (slug.endsWith("mobile") && info.project.name !== "mobile") return;
  const toast = page.getByRole("button", {
    name: "Fermer la notification",
    exact: true,
  });
  if (!(await page.getByRole("dialog").count()) && (await toast.isVisible()))
    await toast.click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path:
      process.env.CAPTURE_B7 === "1"
        ? join(
            process.cwd(),
            "docs/ux/redesign",
            slug,
            `implementation-${slug.endsWith("mobile") ? "mobile" : "desktop"}.png`,
          )
        : info.outputPath(`${slug}.png`),
    fullPage: true,
    animations: "disabled",
  });
}
async function privateSnapshot(page: Page, id: string) {
  return page.evaluate(async (sessionId) => {
    const lab = JSON.parse(
      sessionStorage.getItem(`xt:creator:lab:${sessionId}`)!,
    );
    const response = await fetch(`/api/server/sessions/${sessionId}/private`, {
      headers: { Authorization: `Bearer ${lab.token}` },
    });
    const view = await response.json();
    return {
      id: view.sessionId,
      version: view.version,
      run: view.game?.runId,
      phase: view.game?.phase.id,
      participants: view.participants.map(
        (p: { id: string }) => p.id,
      ) as string[],
    };
  }, id);
}
function contrast(a: string, b: string) {
  const luminance = (colour: string) => {
    const values = colour
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const n = v / 255;
        return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
      });
    return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722;
  };
  const left = luminance(a),
    right = luminance(b);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

test("the private QA shell keeps one real identity, preserves it on reload and compares only the public renderer", async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const id = await createLab(page);
  await expect(page.locator(".lab-identity")).toContainText(
    "Vous incarnez le Game Master",
  );
  await expect(
    page
      .getByLabel("Perspective du laboratoire", { exact: true })
      .locator("option"),
  ).toHaveCount(6);
  await capture(page, info, "lab-main-desktop");
  await capture(page, info, "lab-main-mobile");
  await page
    .getByLabel("Perspective du laboratoire", { exact: true })
    .selectOption({ label: "Joueur 2" });
  await expect(page.locator(".lab-identity")).toContainText(
    "Vous incarnez Joueur 2",
  );
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(page.locator(".lab-role-view #game")).toHaveAttribute(
    "data-audience",
    "player",
  );
  await expect(
    page.locator(".lab-role-view .stitch-secret .game-values strong"),
  ).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".lab-identity")).toContainText(
    "Vous incarnez Joueur 2",
  );
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(page.locator(".lab-role-view")).toHaveCount(1);
  if (info.project.name === "desktop") {
    await page
      .getByLabel("Afficher le plateau à côté sur ordinateur", { exact: true })
      .check();
    const mirror = page.getByLabel("Plateau public comparatif", {
      exact: true,
    });
    await expect(
      mirror.locator('[data-renderer="broadcast-v1"]'),
    ).toBeVisible();
    await expect(
      mirror.locator('[data-renderer="broadcast-v1"]'),
    ).toHaveAttribute("data-layout-version", "2");
    expect(
      await mirror
        .locator("[data-widget]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-widget")),
        ),
    ).toEqual(["header", "phase", "round", "players"]);
    await expect(mirror.locator(".tv-speaker")).toContainText("Joueur démo 1");
    await expect(mirror).not.toContainText(
      /Phare confidentiel|Balise confidentielle/,
    );
    const publicResponse = await page.request.get(
      `/api/server/sessions/${id}/public`,
    );
    expect(await publicResponse.text()).not.toMatch(
      /Phare confidentiel|Balise confidentielle|preparedGame|invitationCode/,
    );
    await capture(page, info, "lab-compare-desktop");
  } else
    await expect(
      page.getByLabel("Afficher le plateau à côté sur ordinateur", {
        exact: true,
      }),
    ).toBeHidden();
  await section(page, "Accès aux vues");
  const href = await page
    .getByRole("link", { name: "Ouvrir Joueur 2 séparément", exact: true })
    .getAttribute("href");
  const isolated = await browser.newContext({
    baseURL: new URL(page.url()).origin,
  });
  try {
    const player = await isolated.newPage();
    await player.goto(href!);
    await expect(player.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(player.locator('[data-experience="laboratory"]')).toHaveCount(
      0,
    );
    await expect(
      player.getByRole("button", {
        name: "Vérifier le refus d’une action de gestion",
      }),
    ).toHaveCount(0);
    await expect(player.locator("#game")).toHaveAttribute(
      "data-audience",
      "player",
    );
  } finally {
    await isolated.close();
  }
  for (const theme of ["neon-show", "broadcast-studio", "on-air-premium"]) {
    await page
      .locator(".lab-stitch-header")
      .getByLabel("Apparence de l’application", { exact: true })
      .click();
    await page
      .locator(".lab-stitch-header")
      .getByLabel("Thème de l’application", { exact: true })
      .selectOption(theme);
    await page
      .locator(".lab-stitch-header")
      .getByLabel("Apparence de l’application", { exact: true })
      .click();
    const colours = await page
      .locator(".lab-stitch-disclosure > summary > span")
      .first()
      .evaluate((element) => ({
        foreground: getComputedStyle(element).color,
        background: getComputedStyle(element.closest("details")!)
          .backgroundColor,
      }));
    expect(
      contrast(colours.foreground, colours.background),
    ).toBeGreaterThanOrEqual(4.5);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel("Perspective du laboratoire", { exact: true })
    .selectOption("public");
  await expect(page.locator(".lab-identity")).toContainText(
    "Vous incarnez le Spectateur",
  );
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(page.locator(".lab-role-view")).not.toContainText(
    /Phare confidentiel|Balise confidentielle/,
  );
  await expect(page.locator(".lab-role-view .stitch-secret")).toHaveCount(0);
  await section(page, "Accès aux vues");
  await page
    .getByRole("button", { name: "Incarner Joueur 1", exact: true })
    .click();
  await expect(page.locator(".lab-identity")).toContainText(
    "Vous incarnez Joueur 1",
  );
  await expect(
    page.getByLabel("Perspective du laboratoire", { exact: true }),
  ).toBeFocused();
  await expect(page.locator(".lab-role-view")).toBeVisible();
  await expect(page.locator(".lab-role-view #game")).toHaveAttribute(
    "data-audience",
    "player",
  );
  expect(errors).toEqual([]);
});

test("grouped access and the QA probe use actual player permissions and never advertise a simulated success", async ({
  page,
}, info) => {
  const id = await createLab(page);
  const before = await privateSnapshot(page, id);
  await section(page, "Accès aux vues");
  await section(page, "Outils de test");
  await section(page, "Vérifier les permissions");
  await expect(page.locator(".lab-person-access")).toHaveCount(4);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "Accès correctement protégé" }),
  ).toHaveCount(0);
  const denied = page.waitForResponse(
    (r) =>
      r.url().endsWith("/commands") &&
      r.request().postDataJSON()?.command?.type === "session.rename",
  );
  await page
    .getByRole("button", {
      name: "Vérifier le refus d’une action de gestion",
      exact: true,
    })
    .click();
  expect((await denied).status()).toBe(403);
  await expect(
    page.getByRole("status").filter({ hasText: "Accès correctement protégé" }),
  ).toBeVisible();
  expect((await privateSnapshot(page, id)).version).toBe(before.version);
  await capture(page, info, "lab-access-desktop");
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/commands") &&
      r.request().postDataJSON()?.command?.type === "session.rename",
  );
  await page.route("**/api/server/sessions/*/commands", async (route) => {
    if (route.request().postDataJSON()?.command?.type === "session.rename")
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "INTERNAL_ERROR", message: "Interruption de test" },
        }),
      });
    else await route.continue();
  });
  await page
    .getByRole("button", {
      name: "Vérifier le refus d’une action de gestion",
      exact: true,
    })
    .click();
  expect((await response).status()).toBe(503);
  await expect(page.locator(".lab-stitch-probe-result")).toHaveCount(0);
  await expect(page.locator(".stitch-error[role=alert]")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("the custom restart cancels, traps focus and reuses an uncertain receipt while keeping every player access", async ({
  page,
}, info) => {
  const id = await createLab(page);
  const initial = await privateSnapshot(page, id);
  await section(page, "Outils de test");
  const restart = page.getByRole("button", {
    name: "Recommencer le test",
    exact: true,
  });
  await restart.click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading")).toHaveText("Recommencer le test ?");
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Recommencer", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await capture(page, info, "lab-restart-desktop");
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(restart).toBeFocused();
  expect((await privateSnapshot(page, id)).version).toBe(initial.version);
  let dropped = false;
  const receipts: string[] = [];
  await page.route("**/api/server/sessions/*/commands", async (route) => {
    if (route.request().postDataJSON()?.command?.type === "game.restart") {
      receipts.push(route.request().postData()!);
      if (!dropped) {
        dropped = true;
        await route.fetch();
        await route.abort("failed");
        return;
      }
    }
    await route.continue();
  });
  await restart.click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Recommencer", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog
    .getByRole("button", { name: "Recommencer", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(receipts.length).toBe(2);
  expect(receipts[0] === receipts[1]).toBe(true);
  const after = await privateSnapshot(page, id);
  expect(after.id).toBe(initial.id);
  expect(after.participants).toEqual(initial.participants);
  expect(after.phase).toBe("preparation");
  expect(after.version).toBe(initial.version + 1);
  const checks = await page.evaluate(async (sessionId) => {
    const lab = JSON.parse(
      sessionStorage.getItem(`xt:creator:lab:${sessionId}`)!,
    );
    return await Promise.all(
      lab.players.map(
        async (p: { id: string; token: string }) =>
          (
            await fetch(`/api/server/sessions/${sessionId}/private`, {
              headers: { Authorization: `Bearer ${p.token}` },
            })
          ).status,
      ),
    );
  }, id);
  expect(checks).toEqual([200, 200, 200, 200]);
  await section(page, "Outils de test", false);
  await expect(
    page.getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    }),
  ).toBeVisible();
});

test("interrupted preparation resumes the same server session and missing local access never recreates it", async ({
  page,
  browser,
}, info) => {
  await page.goto("/play/undercover");
  await page.evaluate(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.reload();
  let dropped = false;
  const requests: string[] = [];
  await page.route("**/api/server/sessions/*/commands", async (route) => {
    if (route.request().postDataJSON()?.command?.type === "game.use-prepared") {
      requests.push(route.request().postData()!);
      if (!dropped) {
        dropped = true;
        await route.fetch();
        await route.abort("failed");
        return;
      }
    }
    await route.continue();
  });
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  const id = page.url().split("/").pop()!;
  await expect(
    page.getByRole("heading", { level: 1, name: "Reprendre votre essai" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reprendre la préparation", exact: true }),
  ).toBeEnabled();
  const before = await privateSnapshot(page, id);
  await capture(page, info, "lab-resume-desktop");
  await page
    .getByRole("button", { name: "Reprendre la préparation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Laboratoire Undercover" }),
  ).toBeVisible();
  expect(requests.length).toBe(2);
  expect(requests[0] === requests[1]).toBe(true);
  const after = await privateSnapshot(page, id);
  expect(after.id).toBe(before.id);
  expect(after.participants).toEqual(before.participants);
  expect(after.version).toBe(before.version);
  const context = await browser.newContext({
    baseURL: new URL(page.url()).origin,
    viewport: page.viewportSize()!,
  });
  try {
    const fresh = await context.newPage();
    await fresh.goto(`/play/lab/${id}`);
    await expect(
      fresh.getByRole("heading", { name: "Accès à cet essai indisponible" }),
    ).toBeVisible();
    await expect(fresh.locator(".lab-role-view")).toHaveCount(0);
    await capture(fresh, info, "lab-unavailable-desktop");
    await fresh
      .getByRole("link", { name: "Retour à Undercover", exact: true })
      .click();
    await expect(fresh).toHaveURL(/\/play\/undercover$/);
  } finally {
    await context.close();
  }
  await page.reload();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
});
