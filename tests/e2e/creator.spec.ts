import { test, expect } from "@playwright/test";
import {
  customize,
  save,
  section,
  publish,
  quickTest,
  role,
  externalView,
  guided,
  json,
  refreshEditor,
} from "./creator-helpers.js";

test("a creator forks, edits, publishes, and runs original and pinned variant without conflict", async ({
  page,
}, info) => {
  await customize(page);
  await page.getByLabel("Nom du jeu", { exact: true }).fill("Les cinq points");
  await page
    .getByLabel("Combien de points un joueur peut-il donner ?", { exact: true })
    .fill("5");
  await save(page);
  await publish(page);
  await expect(
    page.getByText("Les cinq points · version 1.0.0", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Réglages simples", exact: true })
    .click();
  await page
    .getByLabel("Combien de points un joueur peut-il donner ?", { exact: true })
    .fill("2");
  await save(page);
  await section(page, "Versions");
  await page
    .getByRole("button", { name: "Tester cette version", exact: true })
    .click();
  await expect(page).toHaveURL(/\/creator\/lab\//);
  const variantGm = await externalView(page, "Game Master");
  await role(page, "Joueur 1");
  await expect(page.getByLabel("Points (1 à 5)")).toHaveAttribute("max", "5");
  await page.getByLabel("Points (1 à 5)").fill("4");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await expect(
    variantGm.locator("#game .game-values").getByText("4", { exact: true }),
  ).toBeVisible();
  const observer = await externalView(page, "Spectateur");
  await expect(
    observer.locator(".game-values").getByText("4", { exact: true }),
  ).toBeVisible();
  await expect(observer.locator(".game-values")).not.toContainText(
    "Contribution envoyée",
  );
  await page
    .getByRole("link", { name: "Retour à l’édition", exact: true })
    .click();
  await section(page, "Versions");
  await page.getByText("Outils d’export avancés", { exact: true }).click();
  await page
    .getByRole("button", { name: "Afficher le manifest d’export", exact: true })
    .click();
  const manifest = JSON.parse(
    await page
      .getByLabel("Manifest d’export sans références privées")
      .inputValue(),
  );
  expect(manifest.format).toBe("extension-twitch-manifest");
  expect(manifest.definition).toBeUndefined();
  expect(manifest.ownerToken).toBeUndefined();
  await page
    .getByRole("link", { name: "Ma bibliothèque", exact: true })
    .click();
  const card = page.locator(".creator-list-card").first();
  await card.getByText("Autres choix", { exact: true }).click();
  await card
    .getByRole("button", { name: "Essayer avec des joueurs démo", exact: true })
    .click();
  await expect(page).toHaveURL(/\/creator\/lab\//);
  await role(page, "Joueur 1");
  await expect(page.getByLabel("Points (1 à 3)")).toHaveAttribute("max", "3");
  await page.getByLabel("Points (1 à 3)").fill("2");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await role(page, "Spectateur");
  await expect(
    page.locator(".game-values").getByText("2", { exact: true }),
  ).toBeVisible();
  await expect(
    variantGm.locator("#game .game-values").getByText("4", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("creator-lab.png"),
    fullPage: true,
  });
  await variantGm.close();
  await observer.close();
});

test("guided choices execute through expressions and advanced edits survive a blocked return to simple editing", async ({
  page,
}) => {
  await guided(page, "Objectif violet");
  const textarea = await json(page);
  const d = JSON.parse(await textarea.inputValue());
  d.roles[0].label = "Régisseur personnalisé";
  d.actions.find(
    (a: { id: string }) => a.id === "contribute",
  ).effects[0].value.expression.args[1].value = 2;
  await textarea.fill(JSON.stringify(d));
  await save(page);
  await page
    .getByRole("button", { name: "Réglages simples", exact: true })
    .click();
  await expect(
    page.getByText(/Ce jeu utilise des règles que les réglages simples/),
  ).toBeVisible();
  await quickTest(page);
  await expect(
    page.getByRole("button", { name: "Terminer la collecte", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Ouvrir la collecte", exact: true })
    .click();
  await role(page, "Joueur 1");
  await page.getByLabel("Points (1 à 3)").fill("2");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await role(page, "Game Master");
  await expect(
    page.locator("#game .game-values").getByText("4", { exact: true }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Terminer la collecte", exact: true })
    .click();
  await role(page, "Joueur 1");
  await expect(page.locator(".game-phase")).toContainText("Terminé");
  await page
    .getByRole("link", { name: "Retour à l’édition", exact: true })
    .click();
  await expect(page).toHaveURL(/\/creator\/games\//);
  await page.reload();
  await expect(await json(page)).toHaveValue(/Régisseur personnalisé/);
});

test("concurrent authors cannot silently overwrite drafts and private recovery does not create an account", async ({
  page,
  browser,
}) => {
  await customize(page);
  const editorUrl = page.url();
  await page
    .getByRole("link", { name: "Ma bibliothèque", exact: true })
    .click();
  await page
    .getByText("Mon accès privé et mes réglages", { exact: true })
    .click();
  const recovery = await page
    .getByLabel("Mon lien privé", { exact: true })
    .inputValue();
  const second = await page.context().newPage();
  await second.goto(recovery);
  await second.goto(editorUrl);
  await page.goto(editorUrl);
  await page
    .getByLabel("Nom du jeu", { exact: true })
    .fill("Ma copie locale intacte");
  await second
    .getByLabel("Description", { exact: true })
    .fill("Version serveur changée depuis un deuxième onglet");
  await save(second);
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /autre onglet/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Nom du jeu", { exact: true })).toHaveValue(
    "Ma copie locale intacte",
  );
  await refreshEditor(page);
  await page
    .getByRole("button", { name: "Comparer les changements", exact: true })
    .click();
  await expect(
    page.getByText("Version serveur changée depuis un deuxième onglet", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enregistrer", exact: true }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Charger la copie enregistrée", exact: true })
    .click();
  await section(page, "Outils avancés");
  await page.getByText("Copie de secours conservée", { exact: true }).click();
  await expect(
    page.getByLabel("Copie de secours", { exact: true }),
  ).toHaveValue(/Ma copie locale intacte/);
  const stranger = await browser.newContext();
  const outsider = await stranger.newPage();
  await outsider.goto(editorUrl);
  await expect(
    outsider.getByText(/Ce jeu ne se trouve pas dans votre bibliothèque/),
  ).toBeVisible();
  await expect(
    outsider.getByText("Ma copie locale intacte", { exact: true }),
  ).toHaveCount(0);
  expect(second.url()).not.toContain("access=");
  expect(second.url()).not.toContain("workspace=");
  await second.close();
  await stranger.close();
});
