import type { Page } from "@playwright/test";
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
      hasText: "iPhone, OBS et accès aux différentes vues",
    }),
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
