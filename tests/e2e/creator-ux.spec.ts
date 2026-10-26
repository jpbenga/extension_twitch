import { acceptConfirmation } from "./dialog-helpers.js";
import { test, expect } from "@playwright/test";
import {
  customize,
  save,
  quickTest,
  role,
  guided,
  section,
} from "./creator-helpers.js";

test("simple personalization, repeat contributions, reload and restart use the actual pinned engine", async ({
  page,
}, info) => {
  await page.goto("/creator");
  await expect(
    page.getByRole("heading", {
      name: "Que souhaitez-vous faire ?",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("creator-home.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: /Personnaliser un jeu/ }).click();
  await page
    .getByRole("button", { name: "Personnaliser ce jeu", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Que souhaitez-vous faire ?",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.locator("textarea.creator-code")).toHaveCount(0);
  await page
    .getByLabel("Combien de points faut-il atteindre ?", { exact: true })
    .fill("10");
  await page
    .getByLabel("Combien de points un joueur peut-il donner ?", { exact: true })
    .fill("2");
  await page
    .getByLabel("Peut-il participer plusieurs fois ?", { exact: true })
    .selectOption("true");
  await page.screenshot({
    path: info.outputPath("simple-editor.png"),
    fullPage: true,
  });
  await quickTest(page);
  await role(page, "Joueur 1");
  await page.getByLabel("Points (1 à 2)").fill("2");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await expect(
    page.locator(".game-values").getByText("2", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Contribuer", exact: true }),
  ).toBeEnabled();
  await role(page, "Spectateur");
  await expect(
    page.locator(".game-values").getByText("2", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("public-test.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(
    page.getByRole("button", { name: "Terminer la collecte", exact: true }),
  ).toHaveCount(0);
  const before = await page.evaluate(() =>
    JSON.parse(
      sessionStorage.getItem(
        `xt:creator:lab:${location.pathname.split("/").at(-1)}`,
      )!,
    ).players.map((p: { id: string }) => p.id),
  );
  await page
    .getByRole("button", { name: "Recommencer le test", exact: true })
    .click();
  await acceptConfirmation(page);
  await role(page, "Spectateur");
  await expect(
    page.locator(".game-values").getByText("0", { exact: true }),
  ).toBeVisible();
  const after = await page.evaluate(() =>
    JSON.parse(
      sessionStorage.getItem(
        `xt:creator:lab:${location.pathname.split("/").at(-1)}`,
      )!,
    ).players.map((p: { id: string }) => p.id),
  );
  expect(after).toEqual(before);
  await page
    .getByRole("link", { name: "Retour à l’édition", exact: true })
    .click();
  await expect(
    page.getByLabel("Combien de points faut-il atteindre ?", { exact: true }),
  ).toHaveValue("10");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("local changes survive route navigation and a failed save without silently overwriting", async ({
  page,
}) => {
  await customize(page);
  page.on("dialog", (d) => d.accept());
  const url = page.url();
  await page
    .getByLabel("Nom du jeu", { exact: true })
    .fill("Mon travail à conserver");
  await page
    .getByLabel("Combien de points faut-il atteindre ?", { exact: true })
    .fill("9");
  await page
    .getByRole("link", { name: "Ma bibliothèque", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mes créations", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Modifier ce jeu", exact: true })
    .click();
  await expect(page.getByLabel("Nom du jeu", { exact: true })).toHaveValue(
    "Mon travail à conserver",
  );
  await page.reload();
  await expect(
    page.getByLabel("Combien de points faut-il atteindre ?", { exact: true }),
  ).toHaveValue("9");
  await page.route("**/studio/workspaces/*/commands", (route) => route.abort());
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Reprendre l’enregistrement",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Nom du jeu", { exact: true })).toHaveValue(
    "Mon travail à conserver",
  );
  await page.unroute("**/studio/workspaces/*/commands");
  await page
    .getByRole("button", { name: "Reprendre l’enregistrement", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Nom du jeu", { exact: true })).toHaveValue(
    "Mon travail à conserver",
  );
  expect(page.url()).toBe(url);
  await save(page);
});

test("a quick test resumes its exact preparation after an interrupted command", async ({
  page,
}) => {
  await customize(page);
  let dropped = false;
  await page.route("**/sessions/*/commands", async (route) => {
    const body = route.request().postDataJSON();
    if (!dropped && body.command?.type === "game.use-prepared") {
      dropped = true;
      await route.fetch(); // Server commits, but the browser does not receive the receipt.
      await route.abort();
    } else await route.continue();
  });
  await page
    .locator(".creator-save-actions")
    .getByRole("button", { name: "Tester mon jeu", exact: true })
    .click();
  await expect(page).toHaveURL(/\/creator\/lab\//);
  await expect(
    page.getByRole("button", { name: "Reprendre la préparation", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reprendre la préparation", exact: true })
    .click();
  await role(page, "Joueur 1");
  await expect(
    page.getByRole("button", { name: "Contribuer", exact: true }),
  ).toBeVisible();
  const count = await page.evaluate(async () => {
    const lab = JSON.parse(
      sessionStorage.getItem(
        `xt:creator:lab:${location.pathname.split("/").at(-1)}`,
      )!,
    );
    return (
      await (
        await fetch(`/api/server/sessions/${lab.sessionId}/private`, {
          headers: { Authorization: `Bearer ${lab.token}` },
        })
      ).json()
    ).participants.length;
  });
  expect(count).toBe(2);
  expect(dropped).toBe(true);
});

test("launching a game invites real participants without opening its editor", async ({
  page,
  browser,
}) => {
  // Retired library remains testable only in the explicit maintenance suite.
  await page.goto("/creator/library?intent=play");
  await page
    .getByRole("button", { name: "Lancer ce jeu", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/creator\/lab\//);
  const url = await page
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
  const context = await browser.newContext({ viewport: page.viewportSize() }),
    player = await context.newPage();
  await player.goto(url);
  await player.getByLabel("Votre nom", { exact: true }).fill("Camille");
  await player
    .getByRole("button", { name: "Rejoindre la session", exact: true })
    .click();
  await expect(player.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await page
    .getByRole("button", { name: "Préparer la partie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ouvrir la collecte", exact: true })
    .click();
  await player.getByLabel("Points (1 à 3)").fill("2");
  await player.getByRole("button", { name: "Contribuer", exact: true }).click();
  await role(page, "Spectateur");
  await expect(
    page.locator(".game-values").getByText("2", { exact: true }),
  ).toBeVisible();
  await context.close();
});

test("restarting after a lost opening receipt never resets the game a second time", async ({
  page,
}) => {
  await customize(page);
  await quickTest(page);
  let lost = false;
  await page.route("**/sessions/*/commands", async (route) => {
    if (!lost && route.request().postDataJSON().command?.actionId === "open") {
      lost = true;
      await route.fetch();
      await route.abort();
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Recommencer le test", exact: true })
    .click();
  await acceptConfirmation(page, false);
  await expect(
    page.getByRole("alert").filter({ hasText: /connexion|réseau/i }),
  ).toBeVisible();
  const run = () =>
    page.evaluate(async () => {
      const lab = JSON.parse(
        sessionStorage.getItem(
          `xt:creator:lab:${location.pathname.split("/").at(-1)}`,
        )!,
      );
      return (
        await (
          await fetch(`/api/server/sessions/${lab.sessionId}/private`, {
            headers: { Authorization: `Bearer ${lab.token}` },
          })
        ).json()
      ).game.runId;
    });
  const before = await run();
  await page
    .getByRole("button", { name: "Recommencer le test", exact: true })
    .click();
  await acceptConfirmation(page);
  await role(page, "Joueur 1");
  await expect(
    page.getByRole("button", { name: "Contribuer", exact: true }),
  ).toBeVisible();
  expect(await run()).toBe(before);
  expect(lost).toBe(true);
});

test("semantic errors remain editable after a reload and references are never silently removed", async ({
  page,
}) => {
  await customize(page);
  await section(page, "Données");
  await page
    .getByLabel("Maximum pour Points collectifs", { exact: true })
    .fill("-1");
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await section(page, "Données");
  await expect(
    page.getByLabel("Maximum pour Points collectifs", { exact: true }),
  ).toHaveValue("-1");
  await page
    .getByLabel("Maximum pour Points collectifs", { exact: true })
    .fill("100");
  await save(page);
  await page
    .getByRole("button", { name: "Supprimer cette donnée", exact: true })
    .click();
  await expect(page.getByText(/Suppression impossible/)).toBeVisible();
});

test("guided choices survive leaving the guide and restarting the browser page", async ({
  page,
}) => {
  await page.goto("/creator/new");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .getByLabel("Nombre de points à atteindre", { exact: true })
    .fill("12");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .getByRole("link", { name: "Ma bibliothèque", exact: true })
    .click();
  await page.getByRole("link", { name: "Créer mon jeu", exact: true }).click();
  await expect(page).toHaveURL(/\/creator\/new$/);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Combien de points un joueur peut-il donner ?",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retour", exact: true }).click();
  await expect(
    page.getByLabel("Nombre de points à atteindre", { exact: true }),
  ).toHaveValue("12");
});
