import { expect, type Page } from "@playwright/test";
/** Open only product disclosures, retaining the old maintenance screens' routes. */
async function openPrepareSection(page: Page, name: string) {
  const panel = page.locator(`[data-prepare-option="${name}"]`);
  if (await panel.count()) {
    if ((await panel.getAttribute("open")) === null)
      await panel.locator(":scope > summary").click();
    return true;
  }
  return false;
}
export async function openUndercoverOptions(page: Page) {
  const edit = page.getByRole("button", {
    name: "Modifier les contenus",
    exact: true,
  });
  await expect(
    edit
      .or(page.getByLabel("Nom du contenu A", { exact: true }))
      .or(page.locator('[data-prepare-option="words"]'))
      .or(
        page
          .locator("summary")
          .filter({ hasText: "Mots et options supplémentaires" }),
      )
      .first(),
  ).toBeAttached();
  if (
    (await edit.count()) ||
    (await page.getByLabel("Nom du contenu A", { exact: true }).count())
  ) {
    if (await edit.count()) await edit.click();
    const options = page.locator(".series-editor-settings");
    if ((await options.getAttribute("open")) === null)
      await options.locator(":scope > summary").click();
    await openPrepareSection(page, "roles");
    return;
  }
  await expect(
    page
      .locator('[data-prepare-option="words"]')
      .or(
        page
          .locator("summary")
          .filter({ hasText: "Mots et options supplémentaires" }),
      )
      .first(),
  ).toBeAttached();
  if (await openPrepareSection(page, "words")) {
    await openPrepareSection(page, "roles");
    return;
  }
  const panel = page.locator("details").filter({
    has: page.locator("summary", {
      hasText: "Mots et options supplémentaires",
    }),
  });
  if ((await panel.count()) && (await panel.getAttribute("open")) === null)
    await panel.locator(":scope > summary").click();
}
export async function openPrepareDemo(page: Page) {
  const save = page.getByRole("button", {
    name: "Enregistrer la partie",
    exact: true,
  });
  if (await save.isVisible()) await save.click();
  // A client-side navigation may resolve its click before the destination mounts.
  await expect(
    page
      .locator('[data-prepare-option="laboratory"]')
      .or(
        page.getByRole("button", {
          name: "Lancer une partie de démonstration",
          exact: true,
        }),
      )
      .first(),
  ).toBeAttached();
  await openPrepareSection(page, "laboratory");
}
export async function launchPrepareDemo(page: Page) {
  await openPrepareDemo(page);
  await page
    .getByRole("button", {
      name: "Lancer une partie de démonstration",
      exact: true,
    })
    .click();
}
export async function openPrepareBroadcast(page: Page) {
  const editorOptions = page.locator(".series-editor-settings");
  if (
    (await editorOptions.count()) &&
    (await editorOptions.getAttribute("open")) === null
  )
    await editorOptions.locator(":scope > summary").click();
  await expect(
    page
      .locator('[data-prepare-option="broadcast"]')
      .or(page.getByText("Personnaliser l’overlay", { exact: true }))
      .first(),
  ).toBeAttached();
  if (await openPrepareSection(page, "broadcast")) return;
  await page.getByText("Personnaliser l’overlay", { exact: true }).click();
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
/** Replay is primary after the result and secondary in the access/settings screen during play. */
export async function openGmReplay(page: Page) {
  const replay = page.getByRole("button", {
    name: "Rejouer cette partie",
    exact: true,
  });
  if (await replay.isVisible()) return;
  const settings = page.locator(".gm-room-secondary .gm-settings");
  if (
    (await settings.count()) &&
    (await settings.getAttribute("open")) === null
  )
    await settings.locator(":scope > summary").click();
  await expect(replay).toBeVisible();
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

export async function openPreparedSalon(page: Page) {
  const save = page.getByRole("button", {
    name: "Enregistrer la partie",
    exact: true,
  });
  if (await save.isVisible()) await save.click();
  await page
    .getByRole("button", { name: "Ajouter à la série", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Vérifier la série", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
}
