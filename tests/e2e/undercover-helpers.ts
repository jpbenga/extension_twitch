import { expect, type Page } from "@playwright/test";
/** Open only product disclosures, retaining the old maintenance screens' routes. */
export async function openUndercoverOptions(page: Page) {
  const panel = page.locator("details").filter({
    has: page.locator("summary", {
      hasText: "Mots et options supplémentaires",
    }),
  });
  if ((await panel.count()) && (await panel.getAttribute("open")) === null)
    await panel.locator(":scope > summary").click();
}
export async function openLabAccess(page: Page) {
  const panel = page.locator("details").filter({
    has: page.locator("summary", {
      hasText: /iPhone, OBS et accès aux différentes vues|Accès aux vues/,
    }),
  });
  if ((await panel.count()) && (await panel.getAttribute("open")) === null)
    await panel.locator(":scope > summary").click();
}
/** Open the real access panel in the official lab and the preserved maintenance lab. */
export async function selectedLabHref(page: Page) {
  await openLabAccess(page);
  const legacy = page.locator("details").filter({
    has: page.locator("summary", {
      hasText: "Ouvrir cette vue sur un autre écran",
    }),
  });
  if ((await legacy.count()) && (await legacy.getAttribute("open")) === null)
    await legacy.locator(":scope > summary").click();
  const link = page.getByRole("link", {
    name: "Ouvrir la vue sélectionnée",
    exact: true,
  });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  return href!;
}
export async function openLabPlayers(page: Page) {
  await openLabAccess(page);
  const panel = page.locator("details").filter({
    has: page.locator("summary", {
      hasText: "Accès individuels des joueurs de démonstration",
    }),
  });
  if ((await panel.count()) && (await panel.getAttribute("open")) === null)
    await panel.locator(":scope > summary").click();
}
export async function openLabTools(page: Page) {
  const panel = page.locator("details").filter({
    has: page.locator("summary", { hasText: "Outils de test" }),
  });
  if ((await panel.count()) && (await panel.getAttribute("open")) === null)
    await panel.locator(":scope > summary").click();
}
export async function openBroadcastHelp(page: Page) {
  const panel = page.locator("details").filter({
    has: page.locator("summary", {
      hasText: "Participation des spectateurs",
    }),
  });
  if ((await panel.count()) && (await panel.getAttribute("open")) === null)
    await panel.locator(":scope > summary").click();
}
