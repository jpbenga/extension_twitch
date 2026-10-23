import { test, expect, type Page, type BrowserContext } from "@playwright/test";
async function createLibrary(page: Page) {
  await page.goto("/creator");
  await page
    .getByLabel("Nom du créateur ou de la bibliothèque")
    .fill("Atelier humain");
  await page
    .getByRole("button", { name: "Créer ma bibliothèque privée", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Atelier humain", exact: true }),
  ).toBeVisible();
}
async function save(page: Page) {
  await page
    .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
    .click();
  await expect(page.locator(".creator-editor > .lobby-hint")).toContainText(
    "Brouillon enregistré",
  );
}
async function openTest(page: Page, button: string) {
  await page.getByRole("button", { name: button, exact: true }).click();
  const link = page.getByRole("link", {
    name: "Ouvrir la régie du test ↗",
    exact: true,
  });
  await expect(link).toBeVisible();
  const [gm] = await Promise.all([page.waitForEvent("popup"), link.click()]);
  await expect(gm.getByTestId("session-connection")).toHaveText("Synchronisé");
  return gm;
}
async function join(context: BrowserContext, gm: Page, name: string) {
  const url = await gm
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
  const player = await context.newPage();
  await player.goto(url);
  await player.getByLabel("Votre nom", { exact: true }).fill(name);
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
  await gm
    .getByRole("button", { name: "Ouvrir la collecte", exact: true })
    .click();
  return player;
}
async function originalVariant(page: Page) {
  await page
    .getByRole("button", {
      name: "Créer une variante de Impulsion collective",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Personnaliser votre jeu", exact: true }),
  ).toBeVisible();
}

test("a creator forks, edits, publishes, and runs original and pinned variant without conflict", async ({
  page,
  browser,
}, testInfo) => {
  const contexts: BrowserContext[] = [];
  const popups: Page[] = [];
  try {
    await createLibrary(page);
    await originalVariant(page);
    await page
      .getByLabel("Titre du brouillon", { exact: true })
      .fill("Les cinq points");
    await page
      .getByLabel("Libellé de contribute.amount", { exact: true })
      .fill("Points (1 à 5)");
    await page
      .getByLabel("Maximum de contribute.amount", { exact: true })
      .fill("5");
    await save(page);
    await page.getByLabel(/Je déclare disposer des droits nécessaires/).check();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", {
        name: "Publier cette version privée",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Les cinq points · v1.0.0", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Maximum de contribute.amount", { exact: true })
      .fill("2");
    await save(page);
    const variantGm = await openTest(page, "Tester la version 1.0.0");
    popups.push(variantGm);
    const variantContext = await browser.newContext({
      viewport: page.viewportSize(),
    });
    contexts.push(variantContext);
    const variantPlayer = await join(
      variantContext,
      variantGm,
      "Nova variante",
    );
    await expect(variantPlayer.getByLabel("Points (1 à 5)")).toHaveAttribute(
      "max",
      "5",
    );
    await variantPlayer.getByLabel("Points (1 à 5)").fill("4");
    await variantPlayer
      .getByRole("button", { name: "Contribuer", exact: true })
      .click();
    await expect(
      variantGm.locator("#game .game-values").getByText("4", { exact: true }),
    ).toBeVisible();
    const originalGm = await openTest(
      page,
      "Tester l’original Impulsion collective",
    );
    popups.push(originalGm);
    const originalContext = await browser.newContext({
      viewport: page.viewportSize(),
    });
    contexts.push(originalContext);
    const originalPlayer = await join(
      originalContext,
      originalGm,
      "Nova originale",
    );
    await expect(originalPlayer.getByLabel("Points (1 à 3)")).toHaveAttribute(
      "max",
      "3",
    );
    await originalPlayer.getByLabel("Points (1 à 3)").fill("2");
    await originalPlayer
      .getByRole("button", { name: "Contribuer", exact: true })
      .click();
    await expect(
      originalGm.locator("#game .game-values").getByText("2", { exact: true }),
    ).toBeVisible();
    await expect(
      variantGm.locator("#game .game-values").getByText("4", { exact: true }),
    ).toBeVisible();
    const observer = await variantContext.newPage();
    await observer.goto(
      await variantGm
        .getByLabel("Lien du plateau pour OBS ou un navigateur")
        .inputValue(),
    );
    await expect(
      observer.locator(".game-values").getByText("4", { exact: true }),
    ).toBeVisible();
    await expect(observer.locator(".game-values")).not.toContainText(
      "Contribution envoyée",
    );
    await page
      .getByRole("button", {
        name: "Préparer le manifest d’export 1.0.0",
        exact: true,
      })
      .click();
    const manifest = JSON.parse(
      await page
        .getByLabel("Manifest d’export sans références privées")
        .inputValue(),
    ) as Record<string, unknown>;
    expect(manifest.format).toBe("extension-twitch-manifest");
    expect(manifest.definition).toBeUndefined();
    expect(manifest.ownerToken).toBeUndefined();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("creator-variant.png"),
      fullPage: true,
    });
  } finally {
    await Promise.all(popups.map((p) => p.close()));
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("guided choices execute through expressions and advanced edits survive a blocked return to the guide", async ({
  page,
  browser,
}) => {
  let context: BrowserContext | null = null;
  let gm: Page | null = null;
  try {
    await createLibrary(page);
    await page
      .getByRole("button", { name: /Créer un jeu avec un guide/ })
      .click();
    await page
      .getByRole("button", { name: "Étape suivante", exact: true })
      .click();
    await page
      .getByLabel("Multiplicateur des points", { exact: true })
      .fill("2");
    await page
      .getByRole("button", { name: "Étape suivante", exact: true })
      .click();
    await page
      .getByLabel("Titre du nouveau jeu", { exact: true })
      .fill("Objectif violet");
    await page
      .getByRole("button", { name: "Créer le brouillon guidé", exact: true })
      .click();
    await expect(
      page.getByLabel("Titre du brouillon", { exact: true }),
    ).toHaveValue("Objectif violet");
    await page
      .getByText("Studio avancé — définition complète", { exact: true })
      .click();
    const editor = page.getByLabel("Définition avancée JSON", { exact: true });
    const definition = JSON.parse(await editor.inputValue()) as {
      roles: { label: string }[];
    };
    definition.roles[0]!.label = "Régisseur personnalisé";
    await editor.fill(JSON.stringify(definition, null, 2));
    await save(page);
    await page.getByText("Revenir aux choix du guide", { exact: true }).click();
    await expect(
      page.getByText(
        /Cette configuration avancée ne peut plus être représentée par le guide/,
      ),
    ).toBeVisible();
    await expect(editor).toHaveValue(/Régisseur personnalisé/);
    gm = await openTest(page, "Préparer un test du brouillon");
    context = await browser.newContext({ viewport: page.viewportSize() });
    const player = await join(context, gm, "Nova guidée");
    await expect(
      gm.getByRole("button", { name: "Terminer la collecte", exact: true }),
    ).toHaveCount(0);
    await player.getByLabel("Points (1 à 3)").fill("2");
    await player
      .getByRole("button", { name: "Contribuer", exact: true })
      .click();
    await expect(
      gm.locator("#game .game-values").getByText("4", { exact: true }),
    ).toBeVisible();
    gm.once("dialog", (d) => d.accept());
    await gm
      .getByRole("button", { name: "Terminer la collecte", exact: true })
      .click();
    await expect(player.locator("#game .game-phase")).toContainText("Terminé");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Atelier humain", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Modifier Objectif violet", exact: true })
      .click();
    await page
      .getByText("Studio avancé — définition complète", { exact: true })
      .click();
    await expect(
      page.getByLabel("Définition avancée JSON", { exact: true }),
    ).toHaveValue(/Régisseur personnalisé/);
  } finally {
    await gm?.close();
    await context?.close();
  }
});

test("concurrent authors cannot silently overwrite drafts and private recovery does not create an account", async ({
  page,
  browser,
}) => {
  let second: Page | null = null;
  const stranger = await browser.newContext({ viewport: page.viewportSize() });
  try {
    await createLibrary(page);
    await originalVariant(page);
    await page
      .getByText("Conserver mon accès créateur", { exact: true })
      .click();
    const recovery = await page
      .getByLabel("Accès privé à ma bibliothèque", { exact: true })
      .inputValue();
    second = await page.context().newPage();
    await second.goto(recovery);
    await expect(
      second.getByRole("heading", { name: "Atelier humain", exact: true }),
    ).toBeVisible();
    await second
      .getByRole("button", {
        name: "Modifier Impulsion collective · variante",
        exact: true,
      })
      .click();
    await page
      .getByLabel("Titre du brouillon", { exact: true })
      .fill("Ma copie locale intacte");
    await second
      .getByLabel("Description du jeu", { exact: true })
      .fill("Version serveur changée depuis un deuxième onglet");
    await save(second);
    await page
      .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
      .click();
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
    await expect(
      page.getByLabel("Titre du brouillon", { exact: true }),
    ).toHaveValue("Ma copie locale intacte");
    await page
      .getByRole("button", { name: "Actualiser la bibliothèque", exact: true })
      .click();
    await expect(
      page.getByText(/Vos modifications locales sont conservées/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Enregistrer le brouillon",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Titre du brouillon", { exact: true }),
    ).toHaveValue("Ma copie locale intacte");
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", {
        name: "Charger le brouillon serveur",
        exact: true,
      })
      .click();
    await page
      .getByText("Copie locale conservée avant actualisation", { exact: true })
      .click();
    await expect(page.getByLabel("Sauvegarde locale du brouillon")).toHaveValue(
      /Ma copie locale intacte/,
    );
    const outsider = await stranger.newPage();
    await outsider.goto("/creator");
    await expect(
      outsider.getByRole("heading", {
        name: "Une bibliothèque privée, sans compte",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      outsider.getByText("Atelier humain", { exact: true }),
    ).toHaveCount(0);
    expect(second.url()).not.toContain("#access");
    expect(second.url()).not.toContain("workspace=");
  } finally {
    await second?.close();
    await stranger.close();
  }
});
