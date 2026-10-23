import { test, expect } from "@playwright/test";
import { role } from "../e2e/creator-helpers.js";
test("Undercover's real mobile lab has no development, hydration or browser errors", async ({
  page,
}) => {
  const issues: string[] = [];
  page.on("pageerror", (e) => issues.push(e.message));
  page.on("console", (m) => {
    if (["warning", "error"].includes(m.type())) issues.push(m.text());
  });
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
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Ouvrir les votes", exact: true })
    .click();
  await role(page, "Joueur 1");
  await page.getByRole("radio").first().check();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Confirmer mon vote", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: /Votre vote pour/ }),
  ).toBeVisible();
  await role(page, "Spectateur");
  await expect(page.locator(".play-vote-result")).toContainText(
    "1 / 4 votes reçus",
  );
  await expect(page.locator(".game-values")).not.toContainText("Phare");
  expect(issues).toEqual([]);
});
