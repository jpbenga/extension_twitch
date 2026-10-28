import { acceptConfirmation } from "./dialog-helpers.js";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function create(page: Page) {
  await page.goto("/sessions/new");
  await page
    .getByLabel("Nom de l’émission", { exact: true })
    .fill("Le plateau humain");
  await page.getByLabel("Votre nom de Game Master").fill("Camille");
  await page
    .getByRole("button", { name: "Créer ma session", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm$/);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  const action = await page
    .getByRole("button", { name: "Fermer les invitations", exact: true })
    .boundingBox();
  expect(action).not.toBeNull();
  if (action) {
    expect(action.height).toBeGreaterThanOrEqual(44);
    expect(action.y + action.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
  }
  return {
    joinUrl: await page
      .getByLabel("Invitation des joueurs", { exact: true })
      .inputValue(),
    publicUrl: await page
      .getByLabel("Lien du plateau pour OBS ou un navigateur")
      .inputValue(),
  };
}
async function joinPlayer(context: BrowserContext, url: string, name: string) {
  const page = await context.newPage();
  await page.goto(url);
  await page.getByLabel("Votre nom", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Rejoindre la partie", exact: true })
    .click();
  await expect(page).toHaveURL(/\/player\/[^/]+$/);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  return page;
}

test("a GM, two independent players and an observer share actual server state", async ({
  page,
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  try {
    const { joinUrl, publicUrl } = await create(page);
    await page
      .getByRole("navigation", { name: "Navigation de la session" })
      .getByRole("link", { name: "Joueurs", exact: true })
      .click();
    await expect(page).toHaveURL(/#players$/);
    await expect(page.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    const contextA = await browser.newContext({
      viewport: page.viewportSize(),
    });
    contexts.push(contextA);
    const contextB = await browser.newContext({
      viewport: page.viewportSize(),
    });
    contexts.push(contextB);
    const observerContext = await browser.newContext({
      viewport: page.viewportSize(),
    });
    contexts.push(observerContext);
    const playerA = await joinPlayer(contextA, joinUrl, "Nova");
    const playerB = await joinPlayer(contextB, joinUrl, "Atlas");
    const observer = await observerContext.newPage();
    await observer.goto(publicUrl);
    await expect(observer.locator(".real-player")).toHaveCount(2);
    await playerA
      .getByRole("button", { name: "Je suis prêt", exact: true })
      .click({ clickCount: 2, delay: 80 });
    await expect(
      page.locator(".lobby-players li").filter({ hasText: "Nova" }),
    ).toContainText("Prêt");
    await playerB.getByText("Qui participe ?", { exact: true }).click();
    await expect(
      playerB.locator(".lobby-players li").filter({ hasText: "Nova" }),
    ).toContainText("Prêt");
    await expect(
      observer.locator(".real-player").filter({ hasText: "Nova" }),
    ).toContainText("Prêt");
    await expect(
      observer.locator(".real-player").filter({ hasText: "Atlas" }),
    ).toContainText("En préparation");
    await page
      .getByLabel("Nouveau nom de l’émission")
      .fill("Un titre synchronisé");
    await page
      .getByRole("button", { name: "Renommer la session", exact: true })
      .click();
    for (const client of [page, playerA, playerB, observer]) {
      if (client === playerA || client === playerB) {
        await expect(
          client.getByText("Un titre synchronisé", { exact: true }),
        ).toBeVisible();
        await expect(
          client.locator('[data-experience="player"]'),
        ).toBeVisible();
      } else
        await expect(
          client.getByRole("heading", {
            name: "Un titre synchronisé",
            level: 1,
          }),
        ).toBeVisible();
      expect(
        await client.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    // A reload retains one identity, not a fresh registration.
    await playerA.reload();
    await expect(
      playerA.getByRole("button", {
        name: "Je ne suis plus prêt",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".lobby-players li")).toHaveCount(2);
    await expect(observer.getByRole("button")).toHaveCount(0);
    const publicState = (await (
      await observer.request.get(
        publicUrl.replace(/\/sessions\//, "/api/server/sessions/"),
      )
    ).json()) as Record<string, unknown>;
    expect(publicState.audience).toBe("public");
    expect(publicState).not.toHaveProperty("invitationCode");
    expect(publicState).not.toHaveProperty("participantId");
    const rejected = await observer.request.post(
      publicUrl
        .replace(/\/sessions\//, "/api/server/sessions/")
        .replace(/public$/, "commands"),
      {
        data: {
          commandId: "unused",
          expectedVersion: 1,
          command: { type: "session.reset" },
        },
      },
    );
    expect(rejected.status()).toBe(401);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

test("private recovery works in another browser and unrelated tabs do not inherit roles", async ({
  page,
  browser,
}) => {
  const { joinUrl } = await create(page);
  await page
    .getByText("Conserver mon accès Game Master", { exact: true })
    .click();
  const recovery = await page
    .getByLabel("Accès privé GM — ne pas partager avec les joueurs")
    .inputValue();
  const clean = await browser.newContext({ viewport: page.viewportSize() });
  try {
    const stranger = await clean.newPage();
    await stranger.goto(page.url());
    await expect(
      stranger.getByRole("heading", {
        name: "Votre accès privé est nécessaire",
      }),
    ).toBeVisible();
    await stranger.goto(recovery);
    await expect(stranger.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    expect(stranger.url()).not.toContain("#");
    // Even in the GM browser context, a generic invitation creates a player access.
    const player = await joinPlayer(
      page.context(),
      joinUrl,
      "Identité distincte",
    );
    await expect(player.locator('[data-experience="player"]')).toBeVisible();
    await expect(player.locator(".stitch-identity")).toBeVisible();
    await expect(player.locator(".stitch-identity")).toContainText(
      "Identité distincte",
    );
    await expect(
      player.getByRole("button", { name: "Réinitialiser le salon" }),
    ).toHaveCount(0);
    await expect(player.getByLabel("Invitation des joueurs")).toHaveCount(0);
    await player.close();
  } finally {
    await clean.close();
  }
});

test("a confirmed reset revokes player access and updates the existing public board", async ({
  page,
  browser,
}) => {
  const { joinUrl, publicUrl } = await create(page);
  const context = await browser.newContext({ viewport: page.viewportSize() });
  try {
    const player = await joinPlayer(context, joinUrl, "Nova");
    const observer = await context.newPage();
    await observer.goto(publicUrl);
    await expect(observer.locator(".real-player")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Réinitialiser le salon", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(page.locator(".lobby-players li")).toHaveCount(0);
    await expect(observer.locator(".real-player")).toHaveCount(0);
    await expect(player.locator(".lobby-error[role=alert]")).toContainText(
      "Votre accès a été retiré",
    );
    await expect(
      player.getByRole("button", { name: "Je suis prêt", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel("Invitation des joueurs", { exact: true }),
    ).not.toHaveValue(joinUrl);
  } finally {
    await context.close();
  }
});

test("a lost command response can be retried without a duplicate event", async ({
  page,
  browser,
}) => {
  const { joinUrl } = await create(page);
  const context = await browser.newContext({ viewport: page.viewportSize() });
  try {
    const player = await joinPlayer(context, joinUrl, "Nova");
    await player.route(
      "**/api/server/sessions/*/commands",
      async (route) => {
        await route.fetch(); // The authoritative server commits before the response is lost.
        await route.abort();
      },
      { times: 1 },
    );
    await player
      .getByRole("button", { name: "Je suis prêt", exact: true })
      .click();
    await expect(
      player.getByRole("button", {
        name: "Réessayer la commande",
        exact: true,
      }),
    ).toBeVisible();
    await player
      .getByRole("button", { name: "Réessayer la commande", exact: true })
      .click();
    await expect(
      player.getByRole("button", { name: "Je ne suis plus prêt", exact: true }),
    ).toBeEnabled();
    await expect(
      page.locator(".session-events li").filter({ hasText: "Nova est prêt." }),
    ).toHaveCount(1);
  } finally {
    await context.close();
  }
});

test("an authenticated player reconnects to the latest state after a transport failure", async ({
  page,
  browser,
}) => {
  const { joinUrl } = await create(page);
  const context = await browser.newContext({ viewport: page.viewportSize() });
  try {
    const player = await joinPlayer(context, joinUrl, "Nova");
    await player
      .getByRole("button", { name: "Je suis prêt", exact: true })
      .click();
    await expect(
      player.getByRole("button", { name: "Je ne suis plus prêt", exact: true }),
    ).toBeEnabled();
    await player.route("**/private/events", (route) => route.abort());
    await player.reload();
    await expect(player.getByTestId("session-connection")).toHaveText(
      "Reconnexion… Actions suspendues.",
    );
    await page
      .getByLabel("Nouveau nom de l’émission")
      .fill("Après reconnexion");
    await page
      .getByRole("button", { name: "Renommer la session", exact: true })
      .click();
    await player.unroute("**/private/events");
    await expect(player.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(
      player.getByText("Après reconnexion", { exact: true }),
    ).toBeVisible();
    await expect(
      player.getByRole("button", { name: "Je ne suis plus prêt", exact: true }),
    ).toBeEnabled();
    await expect(page.locator(".lobby-players li")).toHaveCount(1);
  } finally {
    await context.close();
  }
});
