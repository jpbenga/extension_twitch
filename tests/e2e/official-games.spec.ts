import {
  openUndercoverOptions,
  openLabAccess,
  selectedLabHref,
  openLabPlayers,
  openLabTools,
  openBroadcastHelp,
} from "./undercover-helpers.js";
import {
  gmSessionSchema,
  playerSessionSchema,
  publicSessionSchema,
} from "@extension-twitch/contracts/sessions";
import { completeClues } from "./turn-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";
import {
  test as base,
  expect,
  type Page,
  type BrowserContext,
} from "@playwright/test";
import { role } from "./creator-helpers.js";
const test = base.extend<{ views: (name: string) => Promise<Page> }>({
  views: async ({ browser, page }, use) => {
    const contexts: BrowserContext[] = [];
    try {
      await use(async (name) => {
        await role(page, name);
        const href = await selectedLabHref(page);
        const context = await browser.newContext({
          viewport: page.viewportSize(),
        });
        contexts.push(context);
        const next = await context.newPage();
        await next.goto(href!);
        await expect(
          name === "Spectateur"
            ? next.getByRole("status").first()
            : next.getByTestId("session-connection"),
        ).toHaveText("Synchronisé");
        return next;
      });
    } finally {
      await Promise.all(contexts.map((c) => c.close()));
    }
  },
});
async function demo(page: Page) {
  await page.goto("/play/undercover");
  await openUndercoverOptions(page);
  await page
    .getByLabel("Mot des civils", { exact: true })
    .fill("Mot civil de test");
  await page
    .getByLabel("Mot des Undercover", { exact: true })
    .fill("Mot intrus de test");
  await page
    .getByRole("button", {
      name: "Lancer une partie de démonstration",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(
    page.getByLabel("Perspective du laboratoire", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await page
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await expect(page.locator("#game .game-phase")).toContainText("Discussion");
}
async function vote(page: Page, target: string) {
  await page.getByRole("radio", { name: target, exact: true }).check();
  await page.getByRole("button", { name: "Voter", exact: true }).click();
  await acceptConfirmation(page);
  await expect(
    page.getByRole("status").filter({ hasText: /Votre vote pour/ }),
  ).toBeVisible();
}
async function resolve(gm: Page) {
  await gm
    .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
    .click();
  await acceptConfirmation(gm);
}

test("Undercover plays several real rounds to a final victory, with private cards, elimination, public tally and replay", async ({
  page,
  views,
}, info) => {
  await demo(page);
  const gm = await views("Game Master");
  await gm
    .getByText("Informations privées du Game Master", { exact: true })
    .click();
  const civilianNames = (
    await gm
      .locator(".gm-secrets li")
      .filter({ hasText: /: Civil$/ })
      .allTextContents()
  ).map((t) => t.split(" : ")[0]!);
  expect(civilianNames).toHaveLength(3);
  const players: Page[] = [];
  for (let i = 1; i <= 4; i++) players.push(await views(`Joueur ${i}`));
  const observer = await views("Spectateur");
  await gm.screenshot({
    path: info.outputPath("undercover-gm.png"),
    fullPage: true,
  });
  await players[0]!
    .locator("#game")
    .evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await players[0]!.screenshot({
    path: info.outputPath("undercover-player.png"),
  });
  await expect(observer.locator("body")).not.toContainText("Mot civil de test");
  await expect(observer.locator(".real-stage-title")).toContainText(
    "4 participants",
  );
  await expect(
    players[0]!.getByRole("button", { name: "Je suis prêt", exact: true }),
  ).toHaveCount(0);
  await expect(observer.locator("body")).not.toContainText(
    "Mot intrus de test",
  );
  for (const p of players) {
    await expect(p.locator(".personal-card .game-values article")).toHaveCount(
      1,
    );
    await expect(p.locator(".personal-card")).toContainText(
      /Mot civil de test|Mot intrus de test/,
    );
  }
  for (let round = 0; round < 2; round++) {
    if (round)
      await gm
        .getByRole("button", {
          name: "Commencer la manche suivante",
          exact: true,
        })
        .click();
    await completeClues(gm);
    await gm
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    const active = Array.from(
      { length: 4 },
      (_, i) => `Joueur démo ${i + 1}`,
    ).filter((n) => round === 0 || n !== civilianNames[0]);
    const target = civilianNames[round]!;
    for (let i = 0; i < players.length; i++) {
      const name = `Joueur démo ${i + 1}`;
      if (!active.includes(name)) continue;
      await vote(
        players[i]!,
        name === target ? active.find((n) => n !== name)! : target,
      );
    }
    await expect(gm.locator("#game")).toContainText(
      `${active.length} / ${active.length} votes reçus`,
    );
    await resolve(gm);
    await expect(observer.locator(".play-summary")).toContainText(
      `${target} est éliminé.`,
    );
    if (round === 0) {
      await expect(observer.locator("body")).not.toContainText(
        "Mot civil de test",
      );
      const eliminated =
        players[Number(target.replace("Joueur démo ", "")) - 1]!;
      await expect(eliminated.locator(".personal-card")).toContainText(
        "Vous êtes éliminé",
      );
      await expect(
        eliminated.getByRole("button", {
          name: "Voter",
          exact: true,
        }),
      ).toHaveCount(0);
    }
  }
  await expect(observer.locator(".play-outcome")).toContainText(
    "Victoire des Undercover",
  );
  await expect(observer.locator(".game-values")).toContainText(
    "Mot civil de test",
  );
  await expect(observer.locator(".game-values")).toContainText(
    "Mot intrus de test",
  );
  await page.screenshot({
    path: info.outputPath("undercover-mobile-lab.png"),
    fullPage: true,
  });
  if (info.project.name === "desktop") {
    await observer.setViewportSize({ width: 1920, height: 1080 });
    const dimensions = await observer.locator(".real-stage").evaluate((el) => ({
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
      overflows: el.scrollHeight > el.clientHeight + 1,
    }));
    expect(dimensions.width / dimensions.height).toBeCloseTo(16 / 9, 1);
    expect(dimensions.overflows).toBe(false);
  }
  await observer.screenshot({
    path: info.outputPath("undercover-public-final.png"),
    fullPage: true,
  });
  await openLabTools(page);
  await page
    .getByRole("button", { name: "Recommencer le test", exact: true })
    .click();
  await acceptConfirmation(page);
  await role(page, "Joueur 1");
  await expect(page.locator(".personal-card")).toContainText(
    "Le GM va vous distribuer",
  );
  await expect(page.locator(".play-outcome")).toHaveCount(0);
  await role(page, "Game Master");
  await page
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await expect(page.locator("#game .game-phase")).toContainText("Discussion");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await Promise.all([...players, gm, observer].map((p) => p.close()));
});

test("ties, a disconnected player's return and GM delegation use the same private ballot and finish with civilian victory", async ({
  page,
  views,
}) => {
  await demo(page);
  const gm = await views("Game Master"),
    one = await views("Joueur 1"),
    observer = await views("Spectateur");
  await completeClues(gm);
  await gm
    .getByRole("button", { name: "Ouvrir les votes", exact: true })
    .click();
  await expect(
    one.getByRole("radio", { name: "Joueur démo 1", exact: true }),
  ).toHaveCount(0);
  await vote(one, "Joueur démo 2");
  await one.reload();
  await expect(one.getByTestId("session-connection")).toHaveText("Synchronisé");
  await expect(
    one
      .getByRole("status")
      .filter({ hasText: /Votre vote pour Joueur démo 2/ }),
  ).toBeVisible();
  await expect(
    one.getByRole("button", { name: "Voter", exact: true }),
  ).toHaveCount(0);
  await gm
    .getByText("Voter pour un joueur sans interface", { exact: true })
    .click();
  async function delegated(from: string, to: string) {
    await gm
      .getByLabel("Joueur représenté", { exact: true })
      .selectOption({ label: from });
    await gm.getByRole("radio", { name: to, exact: true }).check();
    await gm
      .getByRole("button", { name: "Enregistrer ce vote délégué", exact: true })
      .click();
    await acceptConfirmation(gm);
    await expect(
      gm.getByRole("button", {
        name: "Enregistrer ce vote délégué",
        exact: true,
      }),
    ).toHaveCount(0);
  }
  await delegated("Joueur démo 2", "Joueur démo 3");
  await delegated("Joueur démo 3", "Joueur démo 4");
  await delegated("Joueur démo 4", "Joueur démo 1");
  await resolve(gm);
  await expect(observer.locator(".play-vote-result")).toContainText(
    "Égalité : personne n’est éliminé.",
  );
  await expect(observer.locator(".is-eliminated")).toHaveCount(0);
  await gm
    .getByText("Informations privées du Game Master", { exact: true })
    .click();
  const target = (await gm
    .locator(".gm-secrets li")
    .filter({ hasText: /: Undercover$/ })
    .textContent())!.split(" : ")[0]!;
  await gm
    .getByRole("button", { name: "Commencer la manche suivante", exact: true })
    .click();
  await completeClues(gm);
  await gm
    .getByRole("button", { name: "Ouvrir les votes", exact: true })
    .click();
  await gm
    .getByText("Voter pour un joueur sans interface", { exact: true })
    .click();
  for (let i = 1; i <= 4; i++) {
    const name = `Joueur démo ${i}`;
    await delegated(
      name,
      name === target ? (i === 1 ? "Joueur démo 2" : "Joueur démo 1") : target,
    );
  }
  await resolve(gm);
  await expect(observer.locator(".play-outcome")).toContainText(
    "Victoire des civils",
  );
  await expect(gm.locator("#game .game-phase")).toContainText(
    "Partie terminée",
  );
  await gm
    .getByRole("button", { name: "Rejouer cette partie", exact: true })
    .click();
  await acceptConfirmation(gm);
  await expect(one.locator(".personal-card")).toContainText(
    "Le GM va vous distribuer",
  );
  await Promise.all([gm, one, observer].map((p) => p.close()));
});

test("real invitees join without accounts, see a server refusal for insufficient players, then play to a public result", async ({
  page,
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  try {
    await page.goto("/play/undercover");
    await page
      .getByLabel("Comment souhaitez-vous jouer ?", { exact: true })
      .selectOption("invite");
    await page
      .getByRole("button", {
        name: "Créer une partie avec mes invités",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm$/);
    const invitation = await page
      .getByLabel("Invitation des joueurs", { exact: true })
      .inputValue();
    const players: Page[] = [];
    for (let i = 1; i <= 3; i++) {
      const context = await browser.newContext({
        viewport: page.viewportSize(),
      });
      contexts.push(context);
      const p = await context.newPage();
      players.push(p);
      await p.goto(invitation);
      await p.getByLabel("Votre nom", { exact: true }).fill(`Invité réel ${i}`);
      await p
        .getByRole("button", { name: "Rejoindre la partie", exact: true })
        .click();
      await expect(p.getByTestId("session-connection")).toHaveText(
        "Synchronisé",
      );
      if (i === 2) {
        await expect(
          page.getByRole("button", { name: "Préparer la partie", exact: true }),
        ).toBeDisabled();
        const refusal = await page.evaluate(async () => {
          const id = location.pathname.split("/")[2]!;
          const token = sessionStorage.getItem(`xt:access:${id}:gm`)!;
          const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          };
          const view = await (
            await fetch(`/api/server/sessions/${id}/private`, { headers })
          ).json();
          const response = await fetch(`/api/server/sessions/${id}/commands`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              commandId: crypto.randomUUID(),
              expectedVersion: view.version,
              command: { type: "game.use-prepared" },
            }),
          });
          return { status: response.status, body: await response.json() };
        });
        expect(refusal).toEqual({
          status: 400,
          body: { error: "INVALID_PLAYER_COUNT" },
        });
        await expect(
          page.getByRole("heading", {
            name: "Votre salon",
            exact: true,
          }),
        ).toBeVisible();
      }
    }
    await page
      .getByRole("button", { name: "Préparer la partie", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await page
      .getByText("Informations privées du Game Master", { exact: true })
      .click();
    const target = (await page
      .locator(".gm-secrets li")
      .filter({ hasText: /: Undercover$/ })
      .textContent())!.split(" : ")[0]!;
    const observerContext = await browser.newContext({
      viewport: page.viewportSize(),
    });
    contexts.push(observerContext);
    const observer = await observerContext.newPage();
    await observer.goto(page.url().replace(/\/gm(?:#.*)?$/, "/public"));
    await completeClues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    for (let i = 1; i <= 3; i++)
      await vote(
        players[i - 1]!,
        target === `Invité réel ${i}`
          ? i === 1
            ? "Invité réel 2"
            : "Invité réel 1"
          : target,
      );
    await resolve(page);
    await expect(observer.locator(".play-outcome")).toContainText(
      "Victoire des civils",
    );
    await expect(players[0]!.locator("#game .game-phase")).toContainText(
      "Partie terminée",
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("Jouer separates creation, prepares three isolated players and transfers the GM access to another device", async ({
  page,
  browser,
}, info) => {
  const contexts: BrowserContext[] = [];
  try {
    await page.goto("/");
    await page
      .getByRole("link", { name: "Choisir un jeu", exact: true })
      .click();
    await expect(page).toHaveURL(/\/play$/);
    await page
      .getByRole("link", { name: "Jouer à Undercover", exact: true })
      .click();
    await expect(page).toHaveURL(/\/play\/undercover$/);
    await expect(
      page.getByLabel("Tours d’indices avant chaque vote", { exact: true }),
    ).toHaveValue("2");
    await page
      .getByLabel("Joueurs de démonstration", { exact: true })
      .fill("3");
    await page
      .getByRole("button", {
        name: "Lancer une partie de démonstration",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/play\/lab\//);
    const labUrl = page.url();
    await role(page, "Joueur 2");
    await page.reload();
    await expect(page.locator(".lab-identity")).toContainText(
      "Vous incarnez Joueur 2",
    );
    await expect(page.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    await page
      .getByRole("button", {
        name: "Copier le lien privé GM pour mon iPhone",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Lien copié." }),
    ).toBeVisible();
    const gmLink = await page.evaluate(() => navigator.clipboard.readText());
    expect(new URL(gmLink).origin).toBe(new URL(page.url()).origin);
    expect(gmLink).toContain("#access=");
    const gmContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    contexts.push(gmContext);
    const gm = await gmContext.newPage();
    await gm.goto(gmLink);
    await expect(gm.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(gm).not.toHaveURL(/#access=/);
    await expect(
      gm
        .getByRole("navigation", { name: "Navigation de la session" })
        .getByRole("link"),
    ).toHaveText(["Partie", "Joueurs", "Plateau"]);
    await gm
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    const sessionId = new URL(labUrl).pathname.split("/").at(-1)!;
    const token = new URL(gmLink).hash.split("=")[1]!;
    const privateState = gmSessionSchema.parse(
      await (
        await gm.request.get(`/api/server/sessions/${sessionId}/private`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json(),
    );
    const denied = await gm.request.post(
      `/api/server/sessions/${sessionId}/commands`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          commandId: crypto.randomUUID(),
          expectedVersion: privateState.version,
          command: {
            type: "game.action",
            runId: privateState.game!.runId,
            actionId: "open-vote",
            parameters: {},
          },
        },
      },
    );
    expect(denied.status()).toBe(403);
    expect(await denied.json()).toEqual({ error: "ACTION_FORBIDDEN" });
    await expect(page.locator(".turn-current")).toContainText(
      "Au tour de : Joueur démo 1",
    );
    await expect(page.locator(".turn-current")).toContainText(
      "attendez votre tour",
    );
    await expect(page.locator(".turn-current")).not.toContainText(
      "C’est à vous",
    );
    await openLabPlayers(page);
    const players: Page[] = [];
    for (let i = 1; i <= 3; i++) {
      const href = await page
        .getByRole("link", {
          name: `Ouvrir Joueur ${i} séparément`,
          exact: true,
        })
        .getAttribute("href");
      const context = await browser.newContext({
        viewport: page.viewportSize(),
      });
      contexts.push(context);
      const p = await context.newPage();
      players.push(p);
      await p.goto(href!);
      await expect(p.getByTestId("session-connection")).toHaveText(
        "Synchronisé",
      );
      await expect(
        p.locator(".personal-card .game-values article"),
      ).toHaveCount(1);
      const own = playerSessionSchema.parse(
        await (
          await p.request.get(`/api/server/sessions/${sessionId}/private`, {
            headers: { Authorization: `Bearer ${href!.split("#access=")[1]}` },
          })
        ).json(),
      );
      expect(own.game!.values.map((v) => v.participantId)).toEqual([
        own.participantId,
      ]);
      expect(own.game!.management).toBeUndefined();
      const forbidden = await p.request.post(
        `/api/server/sessions/${sessionId}/commands`,
        {
          headers: { Authorization: `Bearer ${href!.split("#access=")[1]}` },
          data: {
            commandId: crypto.randomUUID(),
            expectedVersion: own.version,
            command: { type: "session.rename", title: "Usurpation" },
          },
        },
      );
      expect(forbidden.status()).toBe(403);
      await p.reload();
      await expect(
        p.locator(".personal-card .game-values article"),
      ).toHaveCount(1);
      if (i === 1)
        await p.screenshot({
          path: info.outputPath("multidevice-joueur.png"),
          fullPage: true,
        });
    }
    const observerContext = await browser.newContext({
      viewport: page.viewportSize(),
    });
    contexts.push(observerContext);
    const observer = await observerContext.newPage();
    await observer.goto(`/sessions/${sessionId}/public`);
    const publicState = publicSessionSchema.parse(
      await (
        await observer.request.get(`/api/server/sessions/${sessionId}/public`)
      ).json(),
    );
    expect(publicState.publicGame!.values).toEqual([]);
    expect(publicState.publicGame!.management).toBeUndefined();
    expect(JSON.stringify(publicState)).not.toMatch(
      /Phare|Fusée|secret-word|assignments/,
    );
    const intruder = await observerContext.newPage();
    await intruder.goto(labUrl);
    await expect(
      intruder.getByText(/Les accès à cet essai ne sont pas dans cet onglet/),
    ).toBeVisible();
    await expect(
      intruder.getByLabel("Perspective du laboratoire", { exact: true }),
    ).toHaveCount(0);
    await intruder.close();
    if (info.project.name === "desktop") {
      await page
        .getByLabel("Afficher le plateau à côté sur ordinateur", {
          exact: true,
        })
        .check();
      await expect(page.getByLabel("Plateau public comparatif")).toBeVisible();
      await expect(
        page.getByLabel("Plateau public comparatif").locator(".game-values"),
      ).not.toContainText(/Phare|Fusée/);
      await page.screenshot({
        path: info.outputPath("multidevice-comparison.png"),
        fullPage: true,
      });
    }
    await completeClues(gm);
    await expect(observer.locator(".turn-progress")).toHaveAttribute(
      "data-complete",
      "true",
    );
    await gm
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    await vote(players[0]!, "Joueur démo 2");
    await vote(players[1]!, "Joueur démo 1");
    await vote(players[2]!, "Joueur démo 1");
    await resolve(gm);
    await expect(observer.locator(".play-outcome")).toContainText(
      /Victoire des civils|Victoire des Undercover/,
    );
    await expect(gm.locator("#game .play-outcome")).toContainText(/Victoire/);
    await gm.screenshot({
      path: info.outputPath("multidevice-gm-mobile.png"),
      fullPage: true,
    });
    await gm
      .getByRole("button", { name: "Rejouer cette partie", exact: true })
      .click();
    await acceptConfirmation(gm);
    for (const p of players)
      await expect(p.locator(".personal-card")).toContainText(
        "Le GM va vous distribuer",
      );
    await expect(observer.locator(".play-outcome")).toHaveCount(0);
    for (const p of [gm, page, ...players, observer])
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
