import { test, expect, type Page } from "@playwright/test";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
async function bootstrap(page: Page) {
  await page.goto("/creator");
  await page
    .getByRole("button", { name: "Créer ma bibliothèque privée", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Actualiser la bibliothèque",
      exact: true,
    }),
  ).toBeVisible();
}
async function section(page: Page, name: string) {
  if ((page.viewportSize()?.width ?? 1440) < 1000)
    await page
      .getByLabel("Section du Studio", { exact: true })
      .selectOption(name);
  else
    await page
      .getByRole("navigation", { name: "Sections du Studio" })
      .getByRole("button", { name, exact: true })
      .click();
}
async function save(page: Page) {
  await page
    .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
    .click();
  await expect(page.locator(".creator-editor > .lobby-hint")).toContainText(
    "Brouillon enregistré",
  );
}
async function popup(page: Page, name: string) {
  const [next] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("link", { name, exact: true }).click(),
  ]);
  await expect(next.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  return next;
}
test("visual creation without JSON executes real actions across GM, isolated players and public stage", async ({
  page,
}, info) => {
  await bootstrap(page);
  await page
    .getByRole("button", { name: /Créer librement dans le Studio avancé/ })
    .click();
  await page
    .getByLabel("Titre du nouveau jeu", { exact: true })
    .fill("Le studio des points");
  await page
    .getByRole("button", { name: "Créer le brouillon avancé", exact: true })
    .click();
  await section(page, "Participants et rôles");
  await page
    .getByRole("button", { name: "Ajouter un rôle", exact: true })
    .click();
  await page.getByLabel("Nom du rôle 4", { exact: true }).fill("Invité VIP");
  await page
    .getByLabel("Description du rôle 4", { exact: true })
    .fill("Un rôle de jeu sans autorité administrative");
  await section(page, "Variables");
  await page
    .getByRole("button", { name: "Ajouter une variable", exact: true })
    .click();
  await page
    .getByLabel("Nom de la variable 2", { exact: true })
    .fill("Secret personnel");
  await page
    .getByLabel("Type · variable-1", { exact: true })
    .selectOption("text");
  await page
    .getByLabel("Portée · variable-1", { exact: true })
    .selectOption("participant");
  await page
    .getByLabel("Visibilité · variable-1", { exact: true })
    .selectOption("owner");
  await page
    .getByLabel("Valeur initiale · variable-1", { exact: true })
    .fill("Visible uniquement à moi");
  await page.getByLabel("Maximum · score", { exact: true }).fill("-1");
  await expect(
    page.getByText(/La valeur initiale doit respecter/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
    .click();
  await expect(page.locator(".creator-editor > .lobby-hint")).toContainText(
    "Modifications locales",
  );
  await page.getByLabel("Maximum · score", { exact: true }).fill("100000");
  await section(page, "Phases et transitions");
  await page
    .getByRole("button", { name: "Ajouter une phase", exact: true })
    .click();
  await page.getByLabel("Nom de la phase 2", { exact: true }).fill("Résultat");
  await expect(page.getByText(/Phases sans chemin/)).toBeVisible();
  await section(page, "Actions");
  await page
    .getByRole("button", { name: "Ajouter une action", exact: true })
    .click();
  await page
    .getByLabel("Nom de l’action", { exact: true })
    .fill("Gagner un point");
  await page
    .getByRole("button", { name: "Ajouter un effet", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Ajouter une condition composée",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Source · Condition d’autorisation", { exact: true })
    .selectOption("and");
  await page
    .getByLabel("Source · Condition d’autorisation · 1", { exact: true })
    .selectOption("lt");
  await page
    .getByLabel("Source · Condition d’autorisation · 1 · 1", { exact: true })
    .selectOption("variable");
  await page
    .getByLabel("Référence · Condition d’autorisation · 1 · 1", { exact: true })
    .selectOption("score");
  await page
    .getByLabel("Valeur · Condition d’autorisation · 1 · 2", { exact: true })
    .fill("2");
  await page
    .getByRole("button", { name: "Ajouter un point", exact: true })
    .click();
  await page.getByLabel("Nom de l’action", { exact: true }).fill("Terminer");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Supprimer l’effet 1", exact: true })
    .click();
  await page
    .getByLabel("Après cette action", { exact: true })
    .selectOption("phase-1");
  await save(page);
  await section(page, "Variables");
  await page
    .getByRole("button", { name: "Supprimer la variable Score", exact: true })
    .click();
  await expect(page.getByText(/Suppression impossible/)).toBeVisible();
  await section(page, "Tester");
  await expect(page.getByText(/Suppression impossible/)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Enregistrer et tester mon jeu", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajouter deux joueurs fictifs", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Fictif · Atlas ↗", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Installer le jeu pour cet essai",
      exact: true,
    })
    .click();
  const gm = await popup(page, "Ouvrir la régie du test ↗");
  const player = await popup(page, "Fictif · Nova ↗");
  const second = await popup(page, "Fictif · Atlas ↗");
  const publicPage = await page.context().newPage();
  await publicPage.goto(
    (await page
      .getByRole("link", { name: "Plateau du test ↗", exact: true })
      .getAttribute("href")) ?? "",
  );
  await expect(player.locator("#game")).toContainText(
    "Visible uniquement à moi",
  );
  await expect(publicPage.locator("body")).not.toContainText(
    "Visible uniquement à moi",
  );
  await player
    .getByRole("button", { name: "Gagner un point", exact: true })
    .click();
  await expect(
    gm.locator("#game .game-values").getByText("1", { exact: true }),
  ).toBeVisible();
  await expect(
    publicPage.locator(".game-values").getByText("1", { exact: true }),
  ).toBeVisible();
  await second
    .getByRole("button", { name: "Gagner un point", exact: true })
    .click();
  await expect(
    player.getByRole("button", { name: "Gagner un point", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Vérifier le refus d’une action GM",
      exact: true,
    })
    .click();
  await expect(page.getByText(/Refus attendu \(403\)/)).toBeVisible();
  await gm.getByRole("button", { name: "Terminer", exact: true }).click();
  await expect(player.locator("#game .game-phase")).toContainText("Résultat");
  await expect(publicPage.locator(".real-stage-header")).toContainText(
    "Résultat",
  );
  await page
    .getByRole("button", { name: "Revenir à l’éditeur", exact: true })
    .click();
  await section(page, "Actions");
  await expect(
    page.getByRole("button", { name: "Gagner un point", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("studio-visual.png"),
    fullPage: true,
  });
  await page
    .locator("#studio-workbench")
    .evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.screenshot({ path: info.outputPath("studio-viewport.png") });
  await Promise.all([gm, player, second, publicPage].map((p) => p.close()));
});

test("a complex existing expression survives unrelated visual edits and private publication", async ({
  page,
}) => {
  await bootstrap(page);
  await page
    .getByRole("button", { name: /Créer un jeu avec un guide/ })
    .click();
  await page
    .getByRole("button", { name: "Étape suivante", exact: true })
    .click();
  await page.getByLabel("Multiplicateur des points", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Étape précédente", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Étape suivante", exact: true })
    .click();
  await expect(
    page.getByLabel("Multiplicateur des points", { exact: true }),
  ).toHaveValue("3");
  await page
    .getByRole("button", { name: "Étape suivante", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Créer le brouillon guidé", exact: true })
    .click();
  await page
    .getByText("Studio avancé — définition complète", { exact: true })
    .click();
  const editor = page.getByLabel("Définition avancée JSON", { exact: true });
  // Seed a previously authored deep expression through the normal owner API.
  // The UI must preserve this exact tree while changing an unrelated role.
  await page.evaluate(async () => {
    const access = JSON.parse(sessionStorage.getItem("xt:creator:access")!) as {
      id: string;
      token: string;
    };
    const path = `/api/server/studio/workspaces/${access.id}`;
    const headers = {
      Authorization: `Bearer ${access.token}`,
      "Content-Type": "application/json",
    };
    const view = (await (await fetch(path, { headers })).json()) as {
      workspace: {
        version: number;
        games: {
          identity: { id: string };
          draft: {
            definition: GameDefinition;
            metadata: unknown;
            assets: unknown;
          };
        }[];
      };
    };
    const game = view.workspace.games[0]!;
    game.draft.definition.actions.find((a) => a.id === "contribute")!.guard = {
      kind: "operator",
      operator: "and",
      args: [
        {
          kind: "operator",
          operator: "not",
          args: [
            {
              kind: "operator",
              operator: "eq",
              args: [
                { kind: "variable", id: "total" },
                { kind: "literal", value: -1 },
              ],
            },
          ],
        },
        {
          kind: "operator",
          operator: "gte",
          args: [
            { kind: "variable", id: "total" },
            { kind: "literal", value: 0 },
          ],
        },
      ],
    };
    const result = await fetch(`${path}/commands`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        commandId: crypto.randomUUID(),
        expectedVersion: view.workspace.version,
        operation: {
          type: "draft.save",
          gameId: game.identity.id,
          definition: game.draft.definition,
          metadata: game.draft.metadata,
          assets: game.draft.assets,
        },
      }),
    });
    if (!result.ok) throw new Error("Could not seed the existing expression");
  });
  await page
    .getByRole("button", { name: "Actualiser la bibliothèque", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Charger le brouillon serveur", exact: true })
    .click();
  const before = JSON.parse(await editor.inputValue()) as GameDefinition;
  await section(page, "Participants et rôles");
  await page.getByLabel("Nom du rôle 1", { exact: true }).fill("Présentateur");
  await save(page);
  const after = JSON.parse(await editor.inputValue()) as GameDefinition;
  expect(after.actions).toEqual(before.actions);
  await page.getByText("Revenir aux choix du guide", { exact: true }).click();
  await expect(
    page.getByText(/Cette configuration avancée ne peut plus être représentée/),
  ).toBeVisible();
  await section(page, "Publier");
  await page.getByLabel(/Je déclare disposer des droits/).check();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Publier cette version privée", exact: true })
    .click();
  await expect(
    page.getByText("Mon nouveau jeu · v1.0.0", { exact: true }),
  ).toBeVisible();
  await section(page, "Participants et rôles");
  await page
    .getByLabel("Nom du rôle 1", { exact: true })
    .fill("Autre présentateur");
  await save(page);
  await section(page, "Publier");
  await expect(
    page.getByText("Mon nouveau jeu · v1.0.0", { exact: true }),
  ).toBeVisible();
});

test("the second guided model keeps ancestry and runs edited private answers without exposing them", async ({
  page,
}) => {
  await bootstrap(page);
  await page
    .getByRole("button", { name: /Créer un jeu avec un guide/ })
    .click();
  await page
    .getByLabel("Modèle de départ", { exact: true })
    .selectOption("answer-box");
  await page
    .getByRole("button", { name: "Étape suivante", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Étape suivante", exact: true })
    .click();
  await page
    .getByLabel("Titre du nouveau jeu", { exact: true })
    .fill("Les propositions privées");
  await page
    .getByRole("button", { name: "Créer le brouillon guidé", exact: true })
    .click();
  await expect(
    page.getByText("Origine et attributions", { exact: true }),
  ).toBeVisible();
  await section(page, "Actions");
  await page
    .getByRole("button", { name: "Envoyer ma réponse", exact: true })
    .click();
  await page
    .getByLabel("Nom du paramètre 1", { exact: true })
    .fill("Votre proposition");
  await save(page);
  await section(page, "Tester");
  await page
    .getByRole("button", { name: "Enregistrer et tester mon jeu", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajouter deux joueurs fictifs", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Fictif · Atlas ↗", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Installer le jeu pour cet essai",
      exact: true,
    })
    .click();
  const gm = await popup(page, "Ouvrir la régie du test ↗");
  const player = await popup(page, "Fictif · Nova ↗");
  const other = await popup(page, "Fictif · Atlas ↗");
  const publicPage = await page.context().newPage();
  await publicPage.goto(
    (await page
      .getByRole("link", { name: "Plateau du test ↗", exact: true })
      .getAttribute("href")) ?? "",
  );
  await gm
    .getByRole("button", { name: "Demander un souvenir de live", exact: true })
    .click();
  await player
    .getByLabel("Votre proposition", { exact: true })
    .fill("La proposition privée de Nova");
  await player
    .getByRole("button", { name: "Envoyer ma réponse", exact: true })
    .click();
  await expect(gm.locator("#game .game-values")).toContainText(
    "La proposition privée de Nova",
  );
  await expect(other.locator("#game .game-values")).not.toContainText(
    "La proposition privée de Nova",
  );
  await expect(publicPage.locator("body")).not.toContainText(
    "La proposition privée de Nova",
  );
  await expect(
    player.getByRole("button", { name: "Envoyer ma réponse", exact: true }),
  ).toHaveCount(0);
  await Promise.all([gm, player, other, publicPage].map((p) => p.close()));
});

test("an installed v1 game becomes an independent variant with editable v2 rules and a real test", async ({
  page,
}) => {
  await bootstrap(page);
  await page
    .getByRole("button", {
      name: "Installer Impulsion collective",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Créer une variante du jeu installé",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Origine et attributions", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Activer les expressions v2", exact: true })
    .click();
  await section(page, "Actions");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await page
    .getByLabel("Source de l’effet 1", { exact: true })
    .selectOption("literal");
  await page.getByLabel("Valeur de l’effet 1", { exact: true }).fill("2");
  await page
    .getByRole("button", {
      name: "Ajouter une condition composée",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Source · Condition d’autorisation", { exact: true })
    .selectOption("lt");
  await page
    .getByLabel("Source · Condition d’autorisation · 1", { exact: true })
    .selectOption("variable");
  await page
    .getByLabel("Référence · Condition d’autorisation · 1", { exact: true })
    .selectOption("total");
  await page
    .getByLabel("Valeur · Condition d’autorisation · 2", { exact: true })
    .fill("2");
  await save(page);
  await section(page, "Tester");
  await page
    .getByRole("button", { name: "Enregistrer et tester mon jeu", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajouter deux joueurs fictifs", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Fictif · Atlas ↗", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Installer le jeu pour cet essai",
      exact: true,
    })
    .click();
  const gm = await popup(page, "Ouvrir la régie du test ↗");
  const player = await popup(page, "Fictif · Nova ↗");
  await gm
    .getByRole("button", { name: "Ouvrir la collecte", exact: true })
    .click();
  await player.getByRole("button", { name: "Contribuer", exact: true }).click();
  await expect(
    gm.locator("#game .game-values").getByText("2", { exact: true }),
  ).toBeVisible();
  await expect(
    player.getByRole("button", { name: "Contribuer", exact: true }),
  ).toHaveCount(0);
  await gm.close();
  await player.close();
});
