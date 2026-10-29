import { launchPrepareDemo } from "./undercover-helpers.js";
import {
  creatorAccessSchema,
  studioViewSchema,
} from "@extension-twitch/contracts/creator";
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
  await launchPrepareDemo(page);
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
  await completeClues(page);
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

test("an old installed official release stays visible and launches its frozen rules", async ({
  page,
}) => {
  await page.goto("/creator/library");
  await expect(
    page
      .getByRole("button", { name: "Personnaliser ce jeu", exact: true })
      .first(),
  ).toBeEnabled();
  const access = creatorAccessSchema.parse(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("xt:creator:access")!),
    ),
  );
  const path = `/api/server/studio/workspaces/${access.id}`;
  const headers = { Authorization: `Bearer ${access.token}` };
  const before = studioViewSchema.parse(
    await (await page.request.get(path, { headers })).json(),
  );
  const current = before.catalog.find(
    (g) => g.release.definition.id === "undercover",
  )!;
  // Fixture for a user who installed the previous release before this upgrade.
  const installed = await page.request.post(`${path}/commands`, {
    headers,
    data: {
      commandId: crypto.randomUUID(),
      expectedVersion: before.workspace.version,
      operation: {
        type: "library.install",
        source: { gameId: current.identity.id, version: "0.1.0" },
      },
    },
  });
  expect(installed.status()).toBe(200);
  await page.reload();
  await page.getByRole("button", { name: "Jeux ajoutés", exact: true }).click();
  const card = page.locator(".creator-list-card").filter({
    has: page.getByRole("heading", {
      name: "Undercover · variante démo",
      exact: true,
    }),
  });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(
    "Version 0.1.0 · règles historiques conservées",
  );
  await card.getByText("Autres choix", { exact: true }).click();
  await card
    .getByRole("button", { name: "Essayer avec des joueurs démo", exact: true })
    .click();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await page
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Ouvrir les votes", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#game .turn-progress")).toHaveCount(0);
});
