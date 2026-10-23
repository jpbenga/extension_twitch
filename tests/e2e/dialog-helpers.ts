import { expect, type Page } from "@playwright/test";
/** Confirm the application's real DOM dialog; native navigation warnings remain browser-owned. */
export async function acceptConfirmation(page: Page, success = true) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button").first().click();
  if (success) await expect(dialog).toBeHidden();
  else {
    await expect(dialog.getByRole("alert")).toBeVisible();
    await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}
