import { test, expect } from "@playwright/test";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";

test("the advanced skeleton runs custom typed actions and guards while keeping GM information private", async ({
  page,
  browser,
}) => {
  const players = await browser.newContext({ viewport: page.viewportSize() });
  let gm: import("@playwright/test").Page | null = null;
  try {
    await page.goto("/creator");
    await page
      .getByRole("button", {
        name: "Créer ma bibliothèque privée",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Actualiser la bibliothèque",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Créer librement dans le Studio avancé/ })
      .click();
    await page
      .getByRole("button", { name: "Créer le brouillon avancé", exact: true })
      .click();
    await page
      .getByText("Studio avancé — définition complète", { exact: true })
      .click();
    const textarea = page.getByLabel("Définition avancée JSON", {
      exact: true,
    });
    const definition = JSON.parse(
      await textarea.inputValue(),
    ) as GameDefinition;
    definition.variables.push(
      {
        id: "enabled",
        label: "Score autorisé",
        scope: "session",
        visibility: "public",
        value: { type: "boolean", initial: false },
      },
      {
        id: "producer-note",
        label: "Note privée",
        scope: "session",
        visibility: "gm",
        value: {
          type: "text",
          maxLength: 100,
          initial: "Note confidentielle de production",
        },
      },
    );
    definition.actions[0]!.guard = { kind: "variable", id: "enabled" };
    definition.actions.push({
      id: "enable",
      label: "Autoriser le score",
      roles: ["host"],
      phases: ["live"],
      parameters: [],
      conditions: [],
      confirmation: false,
      effects: [
        {
          type: "set",
          variable: "enabled",
          value: { from: "literal", value: true },
        },
      ],
    });
    await textarea.fill(JSON.stringify(definition, null, 2));
    await page
      .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
      .click();
    await expect(page.locator(".creator-editor > .lobby-hint")).toContainText(
      "Brouillon enregistré",
    );
    await page
      .getByRole("button", {
        name: "Préparer un test du brouillon",
        exact: true,
      })
      .click();
    const [opened] = await Promise.all([
      page.waitForEvent("popup"),
      page
        .getByRole("link", { name: "Ouvrir la régie du test ↗", exact: true })
        .click(),
    ]);
    gm = opened;
    await expect(gm.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    const player = await players.newPage();
    await player.goto(
      await gm
        .getByLabel("Invitation des joueurs", { exact: true })
        .inputValue(),
    );
    await player.getByLabel("Votre nom", { exact: true }).fill("Nova avancée");
    await player
      .getByRole("button", { name: "Rejoindre la session", exact: true })
      .click();
    await expect(player.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    await gm
      .getByRole("button", {
        name: "Installer la définition préparée",
        exact: true,
      })
      .click();
    await expect(gm.locator("#game")).toContainText(
      "Note confidentielle de production",
    );
    await expect(player.locator("#game")).not.toContainText(
      "Note confidentielle de production",
    );
    await expect(gm.locator("#board")).not.toContainText(
      "Note confidentielle de production",
    );
    await expect(
      gm.getByRole("button", { name: "Ajouter un point", exact: true }),
    ).toHaveCount(0);
    await gm
      .getByRole("button", { name: "Autoriser le score", exact: true })
      .click();
    await gm
      .getByRole("button", { name: "Ajouter un point", exact: true })
      .click();
    await expect(
      player.locator("#game .game-values").getByText("1", { exact: true }),
    ).toBeVisible();
    const observer = await players.newPage();
    await observer.goto(
      await gm
        .getByLabel("Lien du plateau pour OBS ou un navigateur")
        .inputValue(),
    );
    await expect(
      observer.locator(".game-values").getByText("1", { exact: true }),
    ).toBeVisible();
    await expect(observer.locator(".game-values")).not.toContainText(
      "Note confidentielle de production",
    );
  } finally {
    await gm?.close();
    await players.close();
  }
});
