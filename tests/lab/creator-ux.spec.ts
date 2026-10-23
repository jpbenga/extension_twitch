import { test, expect } from "@playwright/test";
import { quickTest, role } from "../e2e/creator-helpers.js";
test("development navigation and quick play have no Next.js, hydration or browser errors", async ({
  page,
}) => {
  const issues: string[] = [];
  page.on("pageerror", (error) => issues.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      issues.push(message.text());
  });
  await page.goto("/creator");
  await page.getByRole("link", { name: /Personnaliser un jeu/ }).click();
  await page
    .getByRole("button", { name: "Personnaliser ce jeu", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Combien de points faut-il atteindre ?", { exact: true })
    .fill("10");
  await quickTest(page);
  await role(page, "Joueur 1");
  await page.getByLabel("Points (1 à 3)").fill("2");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await role(page, "Spectateur");
  await expect(
    page.locator(".game-values").getByText("2", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Retour à l’édition", exact: true })
    .click();
  await expect(page).toHaveURL(/\/creator\/games\//);
  await expect(
    page.getByLabel("Combien de points faut-il atteindre ?", { exact: true }),
  ).toHaveValue("10");
  expect(issues).toEqual([]);
});
