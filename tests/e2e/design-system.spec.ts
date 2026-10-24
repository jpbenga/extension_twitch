import { test, expect, type Page } from "@playwright/test";
import { customize, section, save } from "./creator-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";
async function gmView(page: Page) {
  await page.goto("/creator/play");
  await page
    .getByRole("button", {
      name: "Lancer une partie de démonstration",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Perspective du laboratoire", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Ouvrir cette vue sur un autre écran", { exact: true })
    .click();
  const href = await page
    .getByRole("link", { name: "Ouvrir la vue sélectionnée", exact: true })
    .getAttribute("href");
  await page.goto(href!);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(page.locator("#game .game-phase")).toContainText("Préparation");
}
const nav = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Navigation de la session" })
    .getByRole("link", { name, exact: true })
    .click();
const widthFits = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test("the operational room navigates by mobile sections and uses cancel-safe, focused custom replay dialogs", async ({
  page,
}, info) => {
  const native: string[] = [];
  page.on("dialog", async (d) => {
    native.push(d.type());
    await d.dismiss();
  });
  await gmView(page);
  await page.screenshot({
    path: info.outputPath("regie-preparation.png"),
    fullPage: true,
  });
  const main = page.getByRole("button", {
    name: "Distribuer les mots et commencer",
    exact: true,
  });
  await expect(main).toBeVisible();
  await expect(
    page.locator(".session-room .primary-button:visible"),
  ).toHaveCount(1);
  const bounds = await main.boundingBox();
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
  if (info.project.name === "mobile")
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height - 72,
    );
  await main.click();
  await expect(page.locator("#game")).toHaveAttribute("data-state", "active");
  await expect(
    page.getByRole("button", {
      name: "Confirmer l’indice et passer au suivant",
      exact: true,
    }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Fermer la notification", exact: true })
    .click();
  await page.screenshot({
    path: info.outputPath("regie-discussion.png"),
    fullPage: true,
  });
  await nav(page, "Joueurs");
  await expect(
    page.getByRole("link", { name: "Joueurs", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".lobby-players li")).toHaveCount(4);
  await expect(page.locator(".lobby-players li").first()).toBeVisible();
  if (info.project.name !== "desktop") await expect(main).toBeHidden();
  await nav(page, "Partie");
  const replay = page.getByRole("button", {
    name: "Rejouer cette partie",
    exact: true,
  });
  let writes = 0;
  page.on("request", (request) => {
    if (
      request.url().endsWith("/commands") &&
      request.postDataJSON()?.command?.type === "game.restart"
    )
      writes++;
  });
  await replay.click();
  const dialog = page.getByRole("dialog", {
    name: "Recommencer la partie ?",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText(/127\.0\.0\.1|192\.168\./);
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Recommencer", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await page.screenshot({ path: info.outputPath("confirmation-rejouer.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(replay).toBeFocused();
  expect(writes).toBe(0);
  await expect(page.locator("#game .game-phase")).toContainText("Discussion");
  await replay.click();
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  expect(writes).toBe(0);
  await replay.click();
  await acceptConfirmation(page);
  expect(writes).toBe(1);
  await expect(page.locator("#game .game-phase")).toContainText("Préparation");
  await expect(replay).toBeFocused();
  expect(native).toEqual([]);
  expect(await widthFits(page)).toBe(true);
});

test("a destructive reset retains its dialog on a rejected command and only revokes players after explicit confirmation", async ({
  page,
}, info) => {
  await gmView(page);
  await nav(page, "Partie");
  await page
    .getByText("Accès et réglages de la partie", { exact: true })
    .click();
  const reset = page.getByRole("button", {
    name: "Réinitialiser le salon",
    exact: true,
  });
  await reset.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Réinitialiser le salon", exact: true }),
  ).toHaveCSS("background-color", "rgb(241, 121, 164)");
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.locator(".lobby-players li")).toHaveCount(4);
  await page.route("**/api/server/sessions/*/commands", (route) =>
    route.fulfill({ status: 409, json: { error: "VERSION_CONFLICT" } }),
  );
  await reset.click();
  await dialog
    .getByRole("button", { name: "Réinitialiser le salon", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "n’a pas été confirmée",
  );
  await page.screenshot({ path: info.outputPath("confirmation-erreur.png") });
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.locator(".lobby-players li")).toHaveCount(4);
  await page.unroute("**/api/server/sessions/*/commands");
  await reset.click();
  await acceptConfirmation(page);
  await expect(page.locator(".lobby-players li")).toHaveCount(0);
  await expect(page.locator("#game")).not.toContainText("Distribuer les mots");
  expect(await widthFits(page)).toBe(true);
});

test("the shared theme fits a small phone, keeps controls legible and never exposes the development catalog in production", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.screenshot({
    path: info.outputPath("accueil.png"),
    fullPage: true,
  });
  await page.goto("/creator");
  await page.screenshot({
    path: info.outputPath("studio.png"),
    fullPage: true,
  });
  expect(await widthFits(page)).toBe(true);
  expect((await page.request.get("/design-system")).status()).toBe(404);
  await page.setViewportSize({ width: 320, height: 568 });
  await gmView(page);
  const action = page.getByRole("button", {
    name: "Distribuer les mots et commencer",
    exact: true,
  });
  await expect(action).toBeVisible();
  expect(await widthFits(page)).toBe(true);
  await page
    .getByRole("button", { name: "Rejouer cette partie", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(box!.y + box!.height).toBeLessThanOrEqual(568);
  await page.setViewportSize({ width: 320, height: 360 });
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeVisible();
  expect(await widthFits(page)).toBe(true);
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
});

test("Studio deletions keep referenced data, confirm unused data removal and preserve actual saves", async ({
  page,
}, info) => {
  await customize(page);
  await section(page, "Données");
  await page
    .getByRole("button", { name: "Ajouter une donnée", exact: true })
    .click();
  await page
    .getByLabel("Nom de cette donnée", { exact: true })
    .fill("Bonus du plateau");
  const remove = page.getByRole("button", {
    name: "Supprimer cette donnée",
    exact: true,
  });
  await remove.click();
  const dialog = page.getByRole("dialog", {
    name: "Supprimer cette donnée ?",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Conserver", exact: true }).click();
  await expect(
    page.getByLabel("Nom de cette donnée", { exact: true }),
  ).toHaveValue("Bonus du plateau");
  await remove.click();
  await acceptConfirmation(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Données du jeu" }),
  ).not.toContainText("Bonus du plateau");
  await page
    .getByRole("button", { name: "Supprimer cette donnée", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("alert").filter({ hasText: "Suppression impossible" }),
  ).toContainText("Suppression impossible");
  await save(page);
  await expect(page.locator(".ui-toast")).toContainText(
    "Modifications enregistrées",
  );
  await page.screenshot({
    path: info.outputPath("studio-donnees.png"),
    fullPage: true,
  });
  expect(await widthFits(page)).toBe(true);
});

test("Jouer stays legible on a small phone and private access copying has a real HTTP-compatible fallback", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Jouer", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Créer", exact: true }),
  ).toBeVisible();
  expect(await widthFits(page)).toBe(true);
  await page.screenshot({
    path: info.outputPath("accueil-small-phone.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Jouer", exact: true }).click();
  await page
    .getByRole("link", { name: "Préparer Undercover →", exact: true })
    .click();
  const fields = page.locator("input, select");
  for (const field of await fields.all())
    expect(
      parseFloat(await field.evaluate((e) => getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(16);
  expect(await widthFits(page)).toBe(true);
  await page
    .getByRole("button", {
      name: "Lancer une partie de démonstration",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  // A local HTTP LAN has no Clipboard API. Exercise real user-gesture copy fallback.
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    }),
  );
  await page
    .getByRole("button", {
      name: "Copier le lien privé GM pour mon iPhone",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Lien copié." }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Votre régie privée", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/#access=|Bearer /);
  expect(await widthFits(page)).toBe(true);
});
