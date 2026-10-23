import { acceptConfirmation } from "./dialog-helpers.js";
import {
  test as base,
  expect,
  type Page,
  type BrowserContext,
} from "@playwright/test";
import { role, section, save, publish } from "./creator-helpers.js";
const test = base.extend<{ views: (name: string) => Promise<Page> }>({
  views: async ({ browser, page }, use) => {
    const contexts: BrowserContext[] = [];
    try {
      await use(async (name) => {
        await role(page, name);
        const details = page.locator("details").filter({
          has: page.locator("summary", {
            hasText: "Ouvrir cette vue sur un autre écran",
          }),
        });
        if ((await details.getAttribute("open")) === null)
          await details.locator("summary").click();
        const href = await page
          .getByRole("link", {
            name: "Ouvrir la vue sélectionnée",
            exact: true,
          })
          .getAttribute("href");
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
  await page.goto("/creator/play");
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
  await expect(page).toHaveURL(/\/creator\/lab\//);
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
  await page
    .getByRole("button", { name: "Confirmer mon vote", exact: true })
    .click();
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
        .getByRole("button", { name: "Commencer le tour suivant", exact: true })
        .click();
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
          name: "Confirmer mon vote",
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
    one.getByRole("button", { name: "Confirmer mon vote", exact: true }),
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
    .getByRole("button", { name: "Commencer le tour suivant", exact: true })
    .click();
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

test("a personalized official definition keeps its v3 primitives, source lineage and editable real vote rules", async ({
  page,
  views,
}) => {
  await page.goto("/creator/library");
  const card = page.locator(".creator-list-card").filter({
    has: page.getByRole("heading", {
      name: "Undercover · variante démo",
      exact: true,
    }),
  });
  await card
    .getByRole("button", { name: "Personnaliser ce jeu", exact: true })
    .click();
  await page
    .getByLabel("Nom du jeu", { exact: true })
    .fill("Mon conseil secret");
  await section(page, "Distribution et vote");
  await page
    .getByLabel("Mot des civils", { exact: true })
    .fill("Mon mot privé");
  await page
    .getByLabel("Mot des Undercover", { exact: true })
    .fill("Autre information");
  await page
    .getByLabel("Autoriser un joueur à voter pour lui-même", { exact: true })
    .check();
  await save(page);
  await expect(
    page.getByText("Jeu personnalisé · origine et attributions", {
      exact: true,
    }),
  ).toBeVisible();
  await publish(page);
  await page.getByText("Outils d’export avancés", { exact: true }).click();
  await page
    .getByRole("button", { name: "Afficher le manifest d’export", exact: true })
    .click();
  const manifest = page.getByRole("textbox", {
    name: "Manifest d’export sans références privées",
    exact: true,
  });
  await expect(manifest).toHaveValue(/"engineVersion": 3/);
  await expect(manifest).not.toHaveValue(/Mon mot privé|Autre information/);
  await page
    .locator(".creator-save-actions")
    .getByRole("button", { name: "Tester mon jeu", exact: true })
    .click();
  await expect(
    page.getByLabel("Perspective du laboratoire", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Ouvrir les votes", exact: true })
    .click();
  await role(page, "Joueur 1");
  await expect(page.locator(".personal-card")).toContainText(
    /Mon mot privé|Autre information/,
  );
  await expect(
    page.getByRole("radio", { name: "Joueur démo 1", exact: true }),
  ).toBeVisible();
  await role(page, "Spectateur");
  await expect(page.locator("body")).not.toContainText("Mon mot privé");
  await expect(page.locator(".play-summary")).toContainText("Vote");
});

test("real invitees join without accounts, see a server refusal for insufficient players, then play to a public result", async ({
  page,
  browser,
  views,
}) => {
  const contexts: BrowserContext[] = [];
  try {
    await page.goto("/creator/play");
    await page
      .getByText("Jouer avec de vraies personnes", { exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Créer une partie avec mes invités",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/creator\/lab\//);
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
        .getByRole("button", { name: "Rejoindre la session", exact: true })
        .click();
      await expect(p.getByTestId("session-connection")).toHaveText(
        "Synchronisé",
      );
      if (i === 2) {
        await page
          .getByRole("button", { name: "Préparer la partie", exact: true })
          .click();
        await expect(
          page.getByRole("alert").filter({ hasText: /effectif/ }),
        ).toBeVisible();
        await expect(
          page.getByRole("heading", {
            name: "Invitez vos joueurs",
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
    const observer = await views("Spectateur");
    await role(page, "Game Master");
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
