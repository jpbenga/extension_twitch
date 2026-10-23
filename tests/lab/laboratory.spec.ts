import { test, expect } from "@playwright/test";

test("development lab creates real isolated identities, exercises engine actions and verifies a denial", async ({
  page,
}) => {
  await page.goto("/lab");
  await page
    .getByRole("button", {
      name: "Créer une démonstration réelle",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Régie GM ↗", exact: true }),
  ).toBeVisible();
  const [gm] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("link", { name: "Régie GM ↗", exact: true }).click(),
  ]);
  const [player] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("link", { name: "Fictif · Nova ↗", exact: true }).click(),
  ]);
  const [second] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("link", { name: "Fictif · Atlas ↗", exact: true }).click(),
  ]);
  const [observer] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("link", { name: "Plateau public ↗", exact: true }).click(),
  ]);
  await expect(gm.getByTestId("session-connection")).toHaveText("Synchronisé");
  await expect(player.locator("#game")).toContainText("Préparation");
  await expect(second.locator("#game")).toContainText("Préparation");
  await page
    .getByRole("button", { name: "Tester une action interdite", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Refus attendu");
  await gm
    .getByRole("button", { name: "Ouvrir la collecte", exact: true })
    .click();
  await player.getByLabel("Points (1 à 3)").fill("2");
  await player.getByRole("button", { name: "Contribuer", exact: true }).click();
  await expect(
    observer.locator(".game-values").getByText("2", { exact: true }),
  ).toBeVisible();
  await expect(
    second.getByRole("button", { name: "Contribuer", exact: true }),
  ).toBeEnabled();
  expect(
    await gm.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await gm.screenshot({
    path: "test-results/lab-mobile-gm.png",
    fullPage: true,
  });
  gm.once("dialog", (d) => d.accept());
  await gm
    .getByRole("button", { name: "Rejouer cette expérience", exact: true })
    .click();
  await expect(observer.locator(".real-stage-header")).toContainText(
    "Préparation",
  );
  gm.once("dialog", (d) => d.accept());
  await gm
    .getByRole("button", { name: "Réinitialiser le salon", exact: true })
    .click();
  await expect(player.getByTestId("session-connection")).toContainText(
    "Accès indisponible",
  );
  await expect(observer.locator(".real-player")).toHaveCount(0);
  await Promise.all([
    gm.close(),
    player.close(),
    second.close(),
    observer.close(),
  ]);
});
