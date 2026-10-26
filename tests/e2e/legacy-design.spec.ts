import type { Page } from "@playwright/test";
const widthFits = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
import { test, expect } from "@playwright/test";
import { customize, section, save } from "./creator-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";
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
