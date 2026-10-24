import { expect, type Page } from "@playwright/test";
/** Confirm each real oral turn through the normal UI and wait for its server response. */
export async function completeClues(page: Page) {
  const progress = page.locator("#game .turn-progress");
  await expect(progress).toBeVisible();
  const total = Number(await progress.getAttribute("data-total"));
  const count = Number(await progress.getAttribute("data-count"));
  for (let round = 1; round <= total; round++) {
    for (let index = 0; index < count; index++) {
      await expect(progress).toHaveAttribute("data-round", String(round));
      await expect(progress).toHaveAttribute("data-completed", String(index));
      await expect(
        page.getByRole("button", { name: "Ouvrir les votes", exact: true }),
      ).toHaveCount(0);
      const button = page.getByRole("button", {
        name: "Confirmer l’indice et passer au suivant",
        exact: true,
      });
      await expect(button).toBeEnabled();
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith("/commands") &&
          r.request().postDataJSON()?.command?.actionId === "confirm-clue",
      );
      await button.click();
      expect((await response).status()).toBe(200);
      if (index + 1 < count || round === total)
        await expect(progress).toHaveAttribute(
          "data-completed",
          String(index + 1),
        );
      else
        await expect(progress).toHaveAttribute("data-round", String(round + 1));
    }
  }
  await expect(progress).toHaveAttribute("data-complete", "true");
  await expect(
    page.getByRole("button", { name: "Ouvrir les votes", exact: true }),
  ).toBeEnabled();
}
