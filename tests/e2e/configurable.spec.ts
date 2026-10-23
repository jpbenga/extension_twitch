import { test, expect, type BrowserContext, type Page } from "@playwright/test";

async function create(page: Page) {
  await page.goto("/");
  await page
    .getByLabel("Nom de l’émission", { exact: true })
    .fill("Studio générique");
  await page
    .getByRole("button", { name: "Créer ma session", exact: true })
    .click();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  return {
    joinUrl: await page
      .getByLabel("Invitation des joueurs", { exact: true })
      .inputValue(),
    publicUrl: await page
      .getByLabel("Lien du plateau pour OBS ou un navigateur")
      .inputValue(),
  };
}
async function join(context: BrowserContext, url: string, name: string) {
  const p = await context.newPage();
  await p.goto(url);
  await p.getByLabel("Votre nom", { exact: true }).fill(name);
  await p
    .getByRole("button", { name: "Rejoindre la session", exact: true })
    .click();
  await expect(p.getByTestId("session-connection")).toHaveText("Synchronisé");
  return p;
}
async function click(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  await expect(button).toBeEnabled();
  await button.click();
}

test("the shared interpreter drives actual private answers, roles, reveal and replay in all viewports", async ({
  page,
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  try {
    const { joinUrl, publicUrl } = await create(page);
    for (let i = 0; i < 3; i++)
      contexts.push(
        await browser.newContext({ viewport: page.viewportSize() }),
      );
    const player = await join(contexts[0]!, joinUrl, "Nova");
    const reviewer = await join(contexts[1]!, joinUrl, "Atlas");
    const observer = await contexts[2]!.newPage();
    await observer.goto(publicUrl);
    await page.getByLabel("Exemple de définition").selectOption("answer-box");
    await click(page, "Installer l’exemple");
    await expect(player.locator("#game")).toContainText("Préparation");
    await page
      .getByText("Affecter les rôles des joueurs", { exact: true })
      .click();
    await page
      .getByLabel("Rôle de Atlas", { exact: true })
      .selectOption("reviewer");
    await reviewer.getByText("Détails du jeu", { exact: true }).click();
    await expect(reviewer.locator("#game")).toContainText(
      "Votre rôle : reviewer",
    );
    await click(page, "Demander un souvenir de live");
    await player
      .getByLabel("Votre souvenir de live")
      .fill("Un dragon violet confidentiel");
    await click(player, "Envoyer ma réponse");
    await expect(page.locator("#game .game-values")).toContainText(
      "Un dragon violet confidentiel",
    );
    await expect(reviewer.locator("#game")).not.toContainText(
      "Un dragon violet confidentiel",
    );
    await expect(observer.locator(".game-values")).not.toContainText(
      "Un dragon violet confidentiel",
    );
    await expect(page.locator("#board")).not.toContainText(
      "Un dragon violet confidentiel",
    );
    await expect(
      player.getByRole("button", { name: "Envoyer ma réponse", exact: true }),
    ).toHaveCount(0);
    await click(page, "Passer en relecture");
    await expect(
      page.getByRole("button", { name: "Révéler les réponses", exact: true }),
    ).toHaveCount(0);
    await click(reviewer, "Confirmer la relecture");
    page.once("dialog", (d) => d.accept());
    await click(page, "Révéler les réponses");
    await expect(observer.locator(".game-values")).toContainText(
      "Un dragon violet confidentiel",
    );
    await expect(observer.locator(".real-stage-header")).toContainText(
      "Révélation",
    );
    await observer.reload();
    await expect(observer.locator(".game-values")).toContainText(
      "Un dragon violet confidentiel",
    );
    for (const p of [page, player, reviewer, observer]) {
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    const button = await page
      .getByRole("button", { name: "Rejouer cette expérience", exact: true })
      .boundingBox();
    expect(button!.height).toBeGreaterThanOrEqual(44);
    page.once("dialog", (d) => d.accept());
    await click(page, "Rejouer cette expérience");
    await expect(player.locator("#game")).toContainText("Préparation");
    await expect(observer.locator(".game-values")).not.toContainText(
      "Un dragon violet confidentiel",
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("the counter uses the same generic forms and laboratory privileges are absent in production", async ({
  page,
  browser,
}) => {
  const context = await browser.newContext({ viewport: page.viewportSize() });
  try {
    const { joinUrl, publicUrl } = await create(page);
    const player = await join(context, joinUrl, "Nova");
    await click(page, "Installer l’exemple");
    await click(page, "Ouvrir la collecte");
    await player.getByLabel("Points (1 à 3)").fill("3");
    await click(player, "Contribuer");
    await expect(
      page.locator("#game .game-values").getByText("3", { exact: true }),
    ).toBeVisible();
    await expect(
      player.getByRole("button", { name: "Contribuer", exact: true }),
    ).toHaveCount(0);
    const publicPage = await context.newPage();
    await publicPage.goto(publicUrl);
    await expect(
      publicPage.locator(".game-values").getByText("3", { exact: true }),
    ).toBeVisible();
    await expect(publicPage.locator(".game-values")).toContainText(
      "média indisponible",
    );
    if (page.viewportSize()!.width >= 1000) {
      const stage = await publicPage.locator(".real-stage").boundingBox();
      expect(stage!.width / stage!.height).toBeCloseTo(16 / 9, 1);
    }
    const values = await publicPage.locator(".game-values").boundingBox();
    const stageBounds = await publicPage.locator(".real-stage").boundingBox();
    expect(values!.y + values!.height).toBeLessThanOrEqual(
      stageBounds!.y + stageBounds!.height,
    );
    await publicPage.screenshot({
      path: `test-results/generic-public-${page.viewportSize()!.width}.png`,
      fullPage: true,
    });
    page.once("dialog", (d) => d.accept());
    await click(page, "Terminer la collecte");
    await expect(publicPage.locator(".real-stage-header")).toContainText(
      "Terminé",
    );
    expect((await page.request.get("/lab")).status()).toBe(404);
  } finally {
    await context.close();
  }
});
