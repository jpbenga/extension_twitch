import { launchPrepareDemo } from "./undercover-helpers.js";
import { test, expect } from "@playwright/test";

test("the homepage and official catalog offer only games that really run", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Votre prochaine partie commence ici.",
  );
  await expect(
    page.getByRole("link", {
      name: /Créer|Studio avancé|Personnaliser|Publier/,
    }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("accueil.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Choisir un jeu", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Choisir un jeu",
  );
  await expect(
    page.getByRole("link", { name: "Jouer à Undercover" }),
  ).toBeVisible();
  for (const title of ["Enchères", "Qui est l’espion ?"]) {
    const card = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(card).toContainText("NON JOUABLE");
    await expect(card.getByRole("link")).toHaveCount(0);
  }
  await expect(page.locator("body")).not.toContainText(
    /JSON|expression v2|Store|Studio avancé/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("catalogue.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("retired creator URLs redirect without destroying stored drafts or exposing creation APIs", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    sessionStorage.setItem("xt:legacy-draft-example", "document à conserver"),
  );
  for (const path of [
    "/creator",
    "/creator/new",
    "/creator/library",
    "/creator/games/00000000-0000-4000-8000-000000000001",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/play$/);
  }
  await page.goto("/creator/play");
  await expect(page).toHaveURL(/\/play\/undercover$/);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("xt:legacy-draft-example"),
    ),
  ).toBe("document à conserver");
  expect(
    (
      await page.request.post("/api/server/studio/workspaces", {
        headers: { Authorization: `Bearer ${"a".repeat(43)}` },
        data: { name: "not allowed" },
      })
    ).status(),
  ).toBe(404);
  expect((await page.request.get("/api/server/game-examples")).status()).toBe(
    404,
  );
  expect((await page.request.get("/lab")).status()).toBe(404);
});

test("official settings persist, resume is authenticated and the laboratory needs no Studio workspace", async ({
  page,
}, info) => {
  const legacyRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/server/studio/")) legacyRequests.push(r.url());
  });
  await page.goto("/play/undercover");
  await expect(
    page.getByRole("radio", { name: "2 tours d’indices", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("radio", { name: "3 tours d’indices", exact: true })
    .check();
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "3 tours d’indices", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("radio", { name: "2 tours d’indices", exact: true })
    .check();
  await page.screenshot({
    path: info.outputPath("configuration.png"),
    fullPage: true,
  });
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  const labUrl = page.url();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(
    page.getByLabel("Perspective du laboratoire", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Reprendre ma partie", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Reprendre ma partie", exact: true })
    .click();
  await expect(page).toHaveURL(labUrl);
  await page
    .getByLabel("Perspective du laboratoire", { exact: true })
    .selectOption({ label: "Joueur 2" });
  await page.reload();
  await expect(page.locator(".lab-identity")).toContainText(
    "Vous incarnez Joueur 2",
  );
  await page.screenshot({
    path: info.outputPath("laboratoire.png"),
    fullPage: true,
  });
  if ((page.viewportSize()?.width ?? 0) < 1000)
    await expect(
      page.getByLabel("Afficher le plateau à côté sur ordinateur"),
    ).toBeHidden();
  expect(legacyRequests).toEqual([]);
});

test("lost preparation acknowledgements reuse the same official receipt instead of duplicating a party", async ({
  page,
}) => {
  await page.goto("/play/undercover");
  let dropped = false;
  const requests: string[] = [];
  await page.route(
    "**/api/server/official-games/undercover/sessions",
    async (route) => {
      requests.push(route.request().postData()!);
      if (!dropped) {
        dropped = true;
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    },
  );
  await launchPrepareDemo(page);
  await expect(page.locator(".series-error [role=alert]")).toContainText(
    "La préparation n’a pas été confirmée",
  );
  await page.reload();
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  expect(requests).toHaveLength(2);
  expect(requests[1]).toBe(requests[0]);
});

test("a lab created under its historical URL remains accessible without reopening the free Studio", async ({
  page,
}) => {
  await page.goto("/play/undercover");
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  const id = page.url().split("/").pop()!;
  await page.goto(`/creator/lab/${id}`);
  await expect(page).toHaveURL(new RegExp(`/play/lab/${id}$`));
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(
    page.getByRole("link", { name: "Retour à l’édition", exact: true }),
  ).toHaveCount(0);
});
