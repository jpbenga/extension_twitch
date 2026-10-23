import { expect, test } from "@playwright/test";

test("the same studio works on each viewport and connects to the Node server", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "À vous de jouer.",
  );
  await expect(
    page.getByText("Mode démonstration", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Serveur disponible");
  await expect(
    page.getByRole("button", { name: /BLUFF & DÉDUCTION/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /STRATÉGIE & AUDACE/ }).click();
  await expect(
    page.getByRole("button", { name: /STRATÉGIE & AUDACE/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".setup-detail strong").last()).toHaveText(
    "Enchères",
  );
  await expect(
    page.getByRole("link", { name: "Ouvrir l’overlay démo" }),
  ).toHaveAttribute("href", "/overlay?game=auctions");
  await page.getByRole("button", { name: "Animé", exact: true }).click();
  await expect(
    page.getByText("Vous pilotez les actions depuis la régie."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const center = await page.locator(".stage-center").boundingBox();
  const seats = await page.locator(".stage-seats").boundingBox();
  expect(center).not.toBeNull();
  expect(seats).not.toBeNull();
  if (center && seats) {
    expect(center.y + center.height).toBeLessThanOrEqual(seats.y);
  }
  expect(errors).toEqual([]);
});

test("overlay is a public, noninteractive 16:9 demo for all three games", async ({
  page,
}) => {
  for (const [id, title] of [
    ["undercover", "Undercover"],
    ["auctions", "Enchères"],
    ["spy", "Qui est l’espion ?"],
  ]) {
    await page.goto(`/overlay?game=${id}`);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      title ?? "",
    );
    await expect(page.locator(".stage-seat")).toHaveCount(6);
    await expect(page.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("link")).toHaveCount(0);
    const stage = await page.locator(".stage").boundingBox();
    expect(stage).not.toBeNull();
    if (stage) expect(stage.width / stage.height).toBeCloseTo(16 / 9, 1);
    await expect(
      page.getByText("APERÇU FICTIF · AUCUNE PARTIE EN COURS"),
    ).toBeVisible();
  }
  await page.goto("/overlay?game=invalid&transparent=1");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    "Undercover",
  );
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe("rgba(0, 0, 0, 0)");
});

test("player preview clearly identifies its limitations", async ({ page }) => {
  await page.goto("/player");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Bienvenue sur le plateau.",
  );
  await expect(
    page.getByText(/Aucune information secrète distribuée/),
  ).toBeVisible();
  await page.getByRole("link", { name: "Retour à la régie" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "À vous de jouer.",
  );
});

test("server disconnection is reported and reconnection recovers", async ({
  page,
}) => {
  await page.route("**/api/server/events", (route) => route.abort());
  await page.goto("/demo");
  await expect(page.getByRole("status")).toHaveText("Reconnexion au serveur…");
  await page.unroute("**/api/server/events");
  await expect(page.getByRole("status")).toHaveText("Serveur disponible", {
    timeout: 15_000,
  });
});
