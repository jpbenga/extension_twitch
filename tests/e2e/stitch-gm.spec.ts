import { randomBytes, randomUUID } from "node:crypto";
import {
  test,
  expect,
  type Page,
  type APIRequestContext,
  type Browser,
  type TestInfo,
  type BrowserContext,
} from "@playwright/test";
import {
  gmSessionSchema,
  sessionAccessSchema,
} from "@extension-twitch/contracts/sessions";
import { acceptConfirmation } from "./dialog-helpers.js";

type Player = { id: string; token: string; name: string; page: Page };
async function fixture(
  request: APIRequestContext,
  browser: Browser,
  gm: Page,
  baseURL: string,
  roundLimit = 10,
) {
  const token = randomBytes(32).toString("base64url");
  const created = await request.post(
    "/api/server/official-games/undercover/sessions",
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        requestId: randomUUID(),
        settings: {
          "civil-word": "Phare QA",
          "undercover-word": "Balise QA",
          "clue-rounds": 2,
          "round-limit": roundLimit,
        },
      },
    },
  );
  expect(created.status()).toBe(201);
  const access = sessionAccessSchema.parse(await created.json()),
    id = access.sessionId;
  const read = async () =>
    gmSessionSchema.parse(
      await (
        await request.get(`/api/server/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json(),
    );
  const initial = await read();
  const players: Player[] = [],
    contexts: BrowserContext[] = [];
  for (const name of ["Alex", "Lou", "Sam", "Noa"]) {
    const playerToken = randomBytes(32).toString("base64url");
    const joined = await request.post(
      `/api/server/invitations/${initial.invitationCode}/join`,
      {
        headers: { Authorization: `Bearer ${playerToken}` },
        data: { requestId: randomUUID(), name },
      },
    );
    expect(joined.status()).toBe(201);
    const playerId = sessionAccessSchema.parse(
      await joined.json(),
    ).participantId!;
    const context = await browser.newContext({ viewport: gm.viewportSize()! });
    contexts.push(context);
    const page = await context.newPage();
    players.push({ id: playerId, token: playerToken, name, page });
  }
  const state = await read();
  const installed = await request.post(`/api/server/sessions/${id}/commands`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      commandId: randomUUID(),
      expectedVersion: state.version,
      command: { type: "game.use-prepared" },
    },
  });
  expect(installed.status()).toBe(200);
  await gm.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await gm.goto(`${baseURL}/sessions/${id}/gm#access=${token}`);
  await expect(gm.getByTestId("session-connection")).toHaveText("Synchronisé");
  for (const p of players) {
    await p.page.goto(
      `${baseURL}/sessions/${id}/player/${p.id}#access=${p.token}`,
    );
    await expect(p.page.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
  }
  const observerContext = await browser.newContext({
    viewport: gm.viewportSize()!,
  });
  contexts.push(observerContext);
  const observer = await observerContext.newPage();
  await observer.goto(`${baseURL}/sessions/${id}/public`);
  await expect(observer.getByRole("status").first()).toContainText(
    "Synchronisé",
  );
  return {
    id,
    token,
    read,
    players,
    observer,
    close: () => Promise.all(contexts.map((c) => c.close())),
  };
}
async function shot(page: Page, info: TestInfo, state: string) {
  const close = page.getByRole("button", {
    name: "Fermer la notification",
    exact: true,
  });
  const dialogOpen = await page.getByRole("dialog").isVisible();
  if (!dialogOpen && (await close.isVisible())) await close.click();
  if (!dialogOpen) {
    for (const action of await page
      .getByRole("button", {
        name: /^(Distribuer les mots et commencer|Confirmer l’indice et passer au suivant|Ouvrir les votes|Commencer un nouveau cycle|Rejouer cette manche|Renommer la session)$/,
      })
      .all())
      await expect(action).toBeEnabled();
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
  }
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: info.outputPath(`gm-${state}-${info.project.name}.png`),
    fullPage: true,
  });
}
async function clues(page: Page) {
  const progress = page.locator("#game .turn-progress");
  while ((await progress.getAttribute("data-complete")) !== "true") {
    const before = await progress.getAttribute("data-completed");
    const next = page.getByRole("button", {
      name: "Confirmer l’indice et passer au suivant",
      exact: true,
    });
    await expect(next).toBeEnabled();
    await next.click();
    await expect
      .poll(() => progress.getAttribute("data-completed"))
      .not.toBe(before);
  }
  await expect(
    page.getByRole("button", { name: "Ouvrir les votes", exact: true }),
  ).toBeEnabled();
}
async function cast(player: Player, name: string) {
  await expect(
    player.page.getByRole("radio", { name, exact: true }),
  ).toBeVisible();
  await player.page.getByRole("radio", { name, exact: true }).check();
  await player.page.getByRole("button", { name: "Voter", exact: true }).click();
  await acceptConfirmation(player.page);
  await expect(
    player.page
      .getByRole("status")
      .filter({ hasText: `Votre vote pour ${name}` }),
  ).toBeVisible();
}
async function resolve(page: Page) {
  await expect(
    page.getByRole("button", {
      name: "Révéler le résultat du vote",
      exact: true,
    }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
    .click();
  await acceptConfirmation(page);
}
async function settings(page: Page) {
  const detail = page.locator(".gm-room-secondary .gm-settings");
  if ((await detail.getAttribute("open")) === null)
    await detail.locator("summary").click();
  return detail;
}

test("approved GM views execute two rounds, public results, final victory and replay with isolated real players", async ({
  page,
  request,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(120_000);
  const f = await fixture(request, browser, page, baseURL!);
  try {
    await shot(page, info, "distribution");
    const detail = await settings(page);
    await page
      .getByLabel("Nouveau nom de l’émission", { exact: true })
      .fill("Soirée Undercover");
    await page
      .getByRole("button", { name: "Renommer la session", exact: true })
      .click();
    await expect
      .poll(async () => (await f.read()).title)
      .toBe("Soirée Undercover");
    await expect(detail.locator('input[type="password"]')).toHaveCount(1);
    await shot(page, info, "settings");
    await detail
      .getByRole("button", { name: "Rejouer cette manche", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Les joueurs et leurs accès sont conservés",
    );
    await shot(page, info, "restart-confirm");
    await page.keyboard.press("Escape");
    await detail
      .getByRole("button", { name: "Réinitialiser le salon", exact: true })
      .click();
    await shot(page, info, "reset-confirm");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Annuler", exact: true })
      .click();
    await detail
      .getByRole("button", { name: "Revenir à la partie", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await expect(page.locator("#game .game-phase")).toContainText("Discussion");
    const dealt = await f.read(),
      roles = dealt.game!.management!.assignments;
    const civil = f.players.filter((p) => roles[p.id] === "civil"),
      undercover = f.players.find((p) => roles[p.id] === "undercover")!;
    await expect(f.observer.locator("body")).not.toContainText(
      /Phare QA|Balise QA/,
    );
    await page
      .getByRole("button", {
        name: "Confirmer l’indice et passer au suivant",
        exact: true,
      })
      .click();
    await expect(page.locator("#game .turn-progress")).toHaveAttribute(
      "data-completed",
      "1",
    );
    await shot(page, info, "discussion");
    const early = await request.post(`/api/server/sessions/${f.id}/commands`, {
      headers: { Authorization: `Bearer ${f.token}` },
      data: {
        commandId: randomUUID(),
        expectedVersion: (await f.read()).version,
        command: {
          type: "game.action",
          runId: dealt.game!.runId,
          actionId: "open-vote",
          parameters: {},
        },
      },
    });
    expect([403, 409]).toContain(early.status());
    await page
      .getByRole("navigation", { name: "Navigation de la session" })
      .getByRole("link", { name: "Joueurs", exact: true })
      .click();
    await expect(
      page.locator(".experience-pane:not([hidden]) .gm-roster li"),
    ).toHaveCount(4);
    await shot(page, info, "players");
    await page
      .getByRole("navigation", { name: "Navigation de la session" })
      .getByRole("link", { name: "Partie", exact: true })
      .click();
    await clues(page);
    await shot(page, info, "open-vote");
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    await cast(civil[1]!, civil[0]!.name);
    await expect(page.locator("#game")).toContainText("1 / 4 votes reçus");
    await expect(
      page.getByRole("button", {
        name: "Révéler le résultat du vote",
        exact: true,
      }),
    ).toHaveCount(0);
    await shot(page, info, "vote-partial");
    for (const p of f.players.filter((p) => p.id !== civil[1]!.id))
      await cast(p, p.id === civil[0]!.id ? undercover.name : civil[0]!.name);
    await expect(page.locator("#game")).toContainText("4 / 4 votes reçus");
    await shot(page, info, "vote");
    await page
      .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
      .click();
    await shot(page, info, "reveal-confirm");
    await page.keyboard.press("Escape");
    await expect(page.locator("#game")).toHaveAttribute("data-state", "vote");
    await resolve(page);
    await expect(page.locator("#game")).toHaveAttribute("data-state", "result");
    await expect(page.locator("#game h2").first()).toContainText(
      `${civil[0]!.name} est éliminé`,
    );
    await expect(f.observer.locator("body")).not.toContainText(
      /Phare QA|Balise QA/,
    );
    await shot(page, info, "vote-result");
    await page
      .getByRole("button", {
        name: "Commencer un nouveau cycle",
        exact: true,
      })
      .click();
    await expect(page.locator("#game .game-phase")).toContainText(
      "Cycle d’élimination 2",
    );
    await expect(page.locator("#game .turn-progress")).toHaveAttribute(
      "data-count",
      "3",
    );
    await clues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    const active = f.players.filter((p) => p.id !== civil[0]!.id);
    for (const p of active)
      await cast(p, p.id === undercover.id ? civil[1]!.name : undercover.name);
    await resolve(page);
    await expect(page.locator("#game .play-outcome")).toContainText(
      "Victoire des civils",
    );
    await expect(f.observer.locator("body")).toContainText("Phare QA");
    await expect(f.observer.locator("body")).toContainText("Balise QA");
    await shot(page, info, "final");
    await expect(
      page.getByRole("button", {
        name: "Commencer un nouveau cycle",
        exact: true,
      }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Rejouer cette manche", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(page.locator("#game")).toHaveAttribute(
      "data-state",
      "preparation",
    );
    for (const p of f.players) {
      const response = await request.get(
        `/api/server/sessions/${f.id}/private`,
        { headers: { Authorization: `Bearer ${p.token}` } },
      );
      expect(response.status()).toBe(200);
    }
    await f.players[0]!.page.reload();
    await expect(
      f.players[0]!.page.getByTestId("session-connection"),
    ).toHaveText("Synchronisé");
    await expect(f.observer.locator("body")).not.toContainText(
      /Phare QA|Balise QA/,
    );
  } finally {
    await f.close();
  }
});

test("GM preserves a tied round, reaches a server draw and revokes players only after confirmed salon reset", async ({
  page,
  request,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(90_000);
  const f = await fixture(request, browser, page, baseURL!, 2);
  try {
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await clues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    for (let i = 0; i < f.players.length; i++)
      await cast(f.players[i]!, f.players[(i + 1) % f.players.length]!.name);
    await resolve(page);
    await expect(page.locator("#game")).toContainText("Égalité");
    await expect(page.locator("#game .gm-roster .is-eliminated")).toHaveCount(
      0,
    );
    await shot(page, info, "tie");
    await page
      .getByRole("button", {
        name: "Commencer un nouveau cycle",
        exact: true,
      })
      .click();
    await clues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    for (let i = 0; i < f.players.length; i++)
      await cast(f.players[i]!, f.players[(i + 1) % f.players.length]!.name);
    await resolve(page);
    await expect(page.locator("#game .play-outcome")).toContainText(
      "Partie nulle",
    );
    await shot(page, info, "draw");
    const detail = await settings(page);
    await detail
      .getByRole("button", { name: "Réinitialiser le salon", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect.poll(async () => (await f.read()).participants.length).toBe(0);
    for (const p of f.players) {
      const response = await request.get(
        `/api/server/sessions/${f.id}/private`,
        { headers: { Authorization: `Bearer ${p.token}` } },
      );
      expect(response.status()).toBe(401);
    }
  } finally {
    await f.close();
  }
});
