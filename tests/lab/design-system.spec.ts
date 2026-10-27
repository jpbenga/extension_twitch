import { test, expect } from "@playwright/test";
test("custom dialogs trap focus, cancel without effects, block the background and restore the trigger", async ({
  page,
}) => {
  const native: string[] = [];
  page.on("dialog", async (d) => {
    native.push(d.type());
    await d.dismiss();
  });
  await page.goto("/design-system");
  const trigger = page.getByRole("button", {
    name: "Confirmation neutre",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Recommencer la partie ?",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  const cancel = dialog.getByRole("button", { name: "Annuler", exact: true }),
    accept = dialog.getByRole("button", { name: "Recommencer", exact: true });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(accept).toBeFocused();
  const focus = await accept.evaluate((e) =>
    getComputedStyle(e).getPropertyValue("--color-focus").trim(),
  );
  await expect(accept).toHaveCSS(
    "outline-color",
    `rgb(${[1, 3, 5].map((i) => parseInt(focus.slice(i, i + 2), 16)).join(", ")})`,
  );
  await expect(accept).toHaveCSS("outline-width", "3px");
  await expect(accept).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Shift+Tab");
  await expect(cancel).toBeFocused();
  await page
    .getByLabel("Nom du jeu", { exact: true })
    .evaluate((e) => e.focus());
  await expect(cancel).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId("confirmation-count")).toHaveText(
    "Confirmations : 0",
  );
  await page
    .getByRole("button", { name: "Confirmation destructive", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveClass(/tone-danger/);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByTestId("confirmation-count")).toHaveText(
    "Confirmations : 1",
  );
  await expect(page.locator(".ui-toast")).toContainText("Exemple confirmé");
  expect(native).toEqual([]);
});
test("async confirmation handles loading, refuses double submissions and keeps errors recoverable", async ({
  page,
}) => {
  await page.goto("/design-system");
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let calls = 0;
  await page.route("**/api/server/health", async (route) => {
    calls++;
    await gate;
    await route.fulfill({ status: 200, json: { status: "ok" } });
  });
  const trigger = page.getByRole("button", {
    name: "Confirmation asynchrone",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Recommencer", exact: true })
    .evaluate((e) => {
      if (e instanceof HTMLButtonElement) {
        e.click();
        e.click();
      }
    });
  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeDisabled();
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect.poll(() => calls).toBe(1);
  release();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("confirmation-count")).toHaveText(
    "Confirmations : 1",
  );
  await page.unroute("**/api/server/health");
  await page.route("**/api/server/health", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await trigger.click();
  await dialog
    .getByRole("button", { name: "Recommencer", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Votre travail est conservé",
  );
  await expect(
    dialog.getByRole("button", { name: "Recommencer", exact: true }),
  ).toBeEnabled();
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId("confirmation-count")).toHaveText(
    "Confirmations : 1",
  );
});
test("semantic variants, keyboard navigation, reduced motion and short mobile dialogs use the shared tokens", async ({
  page,
}) => {
  const issues: string[] = [];
  page.on("pageerror", (e) => issues.push(e.message));
  await page.goto("/design-system");
  for (const [name, token] of [
    ["primary", "action-primary"],
    ["success", "success"],
    ["warning", "warning"],
    ["danger", "danger"],
    ["info", "info"],
  ]) {
    const color = await page.evaluate(
      (token) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(`--color-${token}`)
          .trim(),
      token!,
    );
    const rgb = `rgb(${[1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(", ")})`;
    await expect(
      page.getByRole("button", { name: name!, exact: true }),
    ).toHaveCSS("background-color", rgb);
  }
  const gm = page
    .getByRole("navigation", { name: "Exemple de navigation" })
    .getByRole("button", { name: "Game Master", exact: true });
  await gm.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByText("Vue choisie : player", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Exemple de navigation" })
      .getByRole("button", { name: "Joueur", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Action indisponible", exact: true }),
  ).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".ui-spinner").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.setViewportSize({ width: 320, height: 360 });
  await page
    .getByRole("button", { name: "Confirmation importante", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(360);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  expect(issues).toEqual([]);
});
