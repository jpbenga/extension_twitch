import { selectedLabHref } from "./undercover-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";
import { expect, type Page } from "@playwright/test";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
export async function bootstrap(page: Page) {
  await page.goto("/creator/library");
  await expect(
    page
      .getByRole("button", { name: "Personnaliser ce jeu", exact: true })
      .first(),
  ).toBeEnabled();
}
export async function customize(page: Page) {
  await bootstrap(page);
  await page
    .getByRole("button", { name: "Personnaliser ce jeu", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/creator\/games\//);
  await expect(page.getByLabel("Nom du jeu", { exact: true })).toHaveValue(
    /Impulsion collective/,
  );
}
export async function section(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Studio avancé", exact: true })
    .click();
  if ((page.viewportSize()?.width ?? 1440) < 1000)
    await page
      .getByLabel("Section du Studio", { exact: true })
      .selectOption({ label: name });
  else
    await page
      .getByRole("navigation", { name: "Sections du Studio" })
      .getByRole("button", { name, exact: true })
      .click();
}
export async function save(page: Page) {
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator(".save-state")).toHaveText("Tout est enregistré");
}
export async function quickTest(page: Page) {
  await page
    .locator(".creator-save-actions")
    .getByRole("button", { name: "Tester mon jeu", exact: true })
    .click();
  await expect(page).toHaveURL(/\/creator\/lab\//);
  await expect(
    page.getByRole("button", { name: "Joueur 2", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
}
export async function role(page: Page, name: string) {
  const selector = page.getByLabel("Perspective du laboratoire", {
    exact: true,
  });
  if (await selector.isVisible()) await selector.selectOption({ label: name });
  else
    await page
      .getByRole("navigation", { name: "Vue du laboratoire" })
      .getByRole("button", { name, exact: true })
      .click();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
}
export async function externalView(page: Page, name: string) {
  await role(page, name);
  const href = await selectedLabHref(page);
  const next = await page.context().newPage();
  await next.goto(href);
  await expect(
    name === "Spectateur"
      ? next.getByRole("status").first()
      : next.getByTestId("session-connection"),
  ).toHaveText("Synchronisé");
  return next;
}
export async function advanced(page: Page, title = "Mon jeu avancé") {
  await page.goto("/creator/new");
  await page
    .getByRole("button", { name: "Studio avancé", exact: true })
    .click();
  await page.getByLabel("Nom du jeu", { exact: true }).fill(title);
  await page
    .getByRole("button", { name: "Créer et ouvrir le Studio", exact: true })
    .click();
  await expect(page).toHaveURL(/\/creator\/games\//);
}
export async function guided(
  page: Page,
  title = "Mon jeu guidé",
  model = "counter",
) {
  await page.goto("/creator/new");
  await page.getByLabel("Choisissez votre point de départ").selectOption(model);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  if (model === "counter") {
    await page
      .getByLabel("Nombre de points à atteindre", { exact: true })
      .fill("4");
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await page
      .getByLabel("Maximum par contribution", { exact: true })
      .fill("3");
    await page.getByRole("button", { name: "Retour", exact: true }).click();
    await expect(
      page.getByLabel("Nombre de points à atteindre", { exact: true }),
    ).toHaveValue("4");
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(
      page.getByLabel("Maximum par contribution", { exact: true }),
    ).toHaveValue("3");
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
  }
  await page.getByLabel("Nom du jeu", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByRole("button", { name: "Créer ce jeu", exact: true }).click();
  await expect(page).toHaveURL(/\/creator\/games\//);
}
export async function json(page: Page) {
  await section(page, "Outils avancés");
  await page
    .getByText("Définition complète du jeu (JSON)", { exact: true })
    .click();
  return page.getByLabel("Définition du jeu", { exact: true });
}
export async function definition(page: Page) {
  return JSON.parse(await (await json(page)).inputValue()) as GameDefinition;
}
export async function publish(page: Page) {
  await section(page, "Versions");
  await page.getByLabel(/Je dispose des droits/).check();
  await page
    .getByRole("button", { name: "Enregistrer une version", exact: true })
    .click();
  await acceptConfirmation(page);
  await expect(
    page.getByRole("heading", { name: /· version 1.0.0/ }),
  ).toBeVisible();
}
export async function refreshEditor(page: Page) {
  await page
    .getByRole("link", { name: "Ma bibliothèque", exact: true })
    .click();
  await page
    .getByText("Mon accès privé et mes réglages", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Actualiser mes jeux", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mes créations", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Modifier ce jeu", exact: true })
    .first()
    .click();
}
