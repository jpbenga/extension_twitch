import { acceptConfirmation } from "./dialog-helpers.js";
import { test, expect } from "@playwright/test";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
import {
  advanced,
  customize,
  guided,
  section,
  save,
  quickTest,
  role,
  externalView,
  json,
  publish,
  refreshEditor,
} from "./creator-helpers.js";
async function question(page: import("@playwright/test").Page, prefix: string) {
  const summary = page
    .locator(".action-question > summary")
    .filter({ hasText: prefix });
  if ((await summary.locator("..").getAttribute("open")) === null)
    await summary.click();
}

test("visual creation without JSON executes real actions across GM, isolated players and public stage", async ({
  page,
}, info) => {
  await advanced(page, "Le studio des points");
  await section(page, "Participants");
  await page
    .getByRole("button", { name: "Ajouter un rôle", exact: true })
    .click();
  await page.getByLabel("Nom du rôle 4", { exact: true }).fill("Invité VIP");
  await page
    .getByLabel("Description du rôle 4", { exact: true })
    .fill("Un rôle sans autorité administrative");
  await section(page, "Données");
  await page
    .getByRole("button", { name: "Ajouter une donnée", exact: true })
    .click();
  await page
    .getByLabel("Nom de cette donnée", { exact: true })
    .fill("Secret personnel");
  await page
    .getByLabel("Type de Secret personnel", { exact: true })
    .selectOption("text");
  await page
    .getByLabel("À qui appartient cette donnée ?", { exact: true })
    .selectOption("participant");
  await page
    .getByLabel("Qui peut voir cette information ?", { exact: true })
    .selectOption("owner");
  await page
    .getByLabel("Valeur de départ de Secret personnel", { exact: true })
    .fill("Visible uniquement à moi");
  await page.getByRole("button", { name: "Score", exact: true }).click();
  await page.getByLabel("Maximum pour Score", { exact: true }).fill("-1");
  await expect(
    page.getByText(/la valeur de départ doit respecter/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator(".save-state")).toHaveText(
    "Modifications à enregistrer",
  );
  await page.getByLabel("Maximum pour Score", { exact: true }).fill("100000");
  await section(page, "Étapes");
  await page
    .getByRole("button", { name: "Ajouter une étape", exact: true })
    .click();
  await page.getByLabel("Nom de l’étape 2", { exact: true }).fill("Résultat");
  await expect(page.getByText(/Ces étapes ne sont reliées/)).toBeVisible();
  await section(page, "Actions");
  await page
    .getByRole("button", { name: "Ajouter une action", exact: true })
    .click();
  await page
    .getByLabel("Nom du bouton", { exact: true })
    .fill("Gagner un point");
  await question(page, "5.");
  await page
    .getByRole("button", { name: "Ajouter une conséquence", exact: true })
    .click();
  await question(page, "4.");
  await page
    .getByRole("button", { name: "Ajouter une règle composée", exact: true })
    .click();
  const root = page.locator(".expression-node").first();
  await root
    .getByLabel("Comparer ou calculer", { exact: true })
    .first()
    .selectOption("and");
  const child = root
    .locator(":scope > .condition-branches > .expression-node")
    .first();
  await child
    .getByLabel(/Comparer ou calculer|Choisir une information/)
    .first()
    .selectOption("lt");
  await child.getByLabel("Valeur", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Ajouter un point", exact: true })
    .click();
  await page.getByLabel("Nom du bouton", { exact: true }).fill("Terminer");
  await question(page, "5.");
  await page
    .getByRole("button", { name: "Supprimer la conséquence 1", exact: true })
    .click();
  await acceptConfirmation(page);
  await question(page, "6.");
  await page
    .getByLabel("Après cette action", { exact: true })
    .selectOption("phase-1");
  await save(page);
  await section(page, "Données");
  await page
    .getByRole("button", { name: "Supprimer cette donnée", exact: true })
    .click();
  await expect(page.getByText(/Suppression impossible/)).toBeVisible();
  await section(page, "Tester");
  await expect(page.getByText(/Suppression impossible/)).toHaveCount(0);
  await quickTest(page);
  const gm = await externalView(page, "Game Master"),
    player = await externalView(page, "Joueur 1"),
    second = await externalView(page, "Joueur 2"),
    publicPage = await externalView(page, "Spectateur");
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
    .getByText("Vérifier les permissions (avancé)", { exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Vérifier le refus d’une action de gestion",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: /Accès correctement protégé/ }),
  ).toBeVisible();
  await gm.getByRole("button", { name: "Terminer", exact: true }).click();
  await expect(player.locator("#game .game-phase")).toContainText("Résultat");
  await expect(publicPage.locator(".real-stage-header")).toContainText(
    "Résultat",
  );
  await page
    .getByRole("link", { name: "Retour à l’édition", exact: true })
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
  await page.screenshot({ path: info.outputPath("studio-viewport.png") });
  await Promise.all([gm, player, second, publicPage].map((p) => p.close()));
});

test("a complex existing expression survives unrelated visual edits and private publication", async ({
  page,
}) => {
  await guided(page, "Mon nouveau jeu");
  const textarea = await json(page),
    d = JSON.parse(await textarea.inputValue()) as GameDefinition;
  d.actions.find((a) => a.id === "contribute")!.guard = {
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
  d.actions.find((a) => a.id === "contribute")!.effects[0] = {
    type: "increment",
    variable: "total",
    value: {
      from: "expression",
      expression: {
        kind: "operator",
        operator: "multiply",
        args: [
          { kind: "parameter", id: "amount" },
          { kind: "literal", value: 3 },
        ],
      },
    },
  };
  await textarea.fill(JSON.stringify(d));
  await save(page);
  const before = JSON.parse(await textarea.inputValue()) as GameDefinition;
  await section(page, "Participants");
  await page.getByLabel("Nom du rôle 1", { exact: true }).fill("Présentateur");
  await save(page);
  const after = JSON.parse(
    await (await json(page)).inputValue(),
  ) as GameDefinition;
  expect(after.actions).toEqual(before.actions);
  await page
    .getByRole("button", { name: "Réglages simples", exact: true })
    .click();
  await expect(
    page.getByText(/Ce jeu utilise des règles que les réglages simples/),
  ).toBeVisible();
  await publish(page);
  await expect(
    page.getByText("Mon nouveau jeu · version 1.0.0", { exact: true }),
  ).toBeVisible();
  await section(page, "Participants");
  await page
    .getByLabel("Nom du rôle 1", { exact: true })
    .fill("Autre présentateur");
  await save(page);
  await section(page, "Versions");
  await expect(
    page.getByText("Mon nouveau jeu · version 1.0.0", { exact: true }),
  ).toBeVisible();
});

test("the second guided model keeps ancestry and runs edited private answers without exposing them", async ({
  page,
}) => {
  await guided(page, "Les propositions privées", "answers");
  await expect(
    page.getByText("Jeu personnalisé · origine et attributions", {
      exact: true,
    }),
  ).toBeVisible();
  await section(page, "Actions");
  await page
    .getByRole("button", { name: "Envoyer ma réponse", exact: true })
    .click();
  await question(page, "3.");
  await page
    .getByLabel("Question affichée au joueur 1", { exact: true })
    .fill("Votre proposition");
  await save(page);
  await quickTest(page);
  const gm = await externalView(page, "Game Master"),
    player = await externalView(page, "Joueur 1"),
    other = await externalView(page, "Joueur 2"),
    publicPage = await externalView(page, "Spectateur");
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
  await role(page, "Joueur 1");
  await expect(page.locator(".lab-role-view")).toContainText(
    "La proposition privée de Nova",
  );
  await role(page, "Joueur 2");
  await expect(page.locator(".lab-role-view")).not.toContainText(
    "La proposition privée de Nova",
  );
  // Inspect the actual HTTP projections as well as rendered elements.
  const projections = await page.evaluate(async () => {
    const lab = JSON.parse(
      sessionStorage.getItem(
        `xt:creator:lab:${location.pathname.split("/").at(-1)}`,
      )!,
    );
    return Promise.all([
      fetch(`/api/server/sessions/${lab.sessionId}/private`, {
        headers: { Authorization: `Bearer ${lab.players[1].token}` },
      }).then(async (r) => ({ status: r.status, body: await r.text() })),
      fetch(`/api/server/sessions/${lab.sessionId}/public`).then((r) =>
        r
          .json()
          .then((body) => ({ status: r.status, body: JSON.stringify(body) })),
      ),
    ]);
  });
  for (const projection of projections) expect(projection.status).toBe(200);
  expect(JSON.stringify(projections)).not.toContain(
    "La proposition privée de Nova",
  );
  await Promise.all([gm, player, other, publicPage].map((p) => p.close()));
});

test("an installed v1 game becomes an independent variant with editable v2 rules and a real test", async ({
  page,
}) => {
  await page.goto("/creator/library");
  const first = page.locator(".creator-list-card").first();
  await first.getByText("Autres choix", { exact: true }).click();
  await first
    .getByRole("button", { name: "Ajouter à ma bibliothèque", exact: true })
    .click();
  await page.getByRole("button", { name: "Jeux ajoutés", exact: true }).click();
  await expect(page.locator(".creator-list-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Personnaliser ce jeu", exact: true })
    .click();
  await expect(
    page.getByText("Jeu personnalisé · origine et attributions", {
      exact: true,
    }),
  ).toBeVisible();
  await section(page, "Actions");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await question(page, "5.");
  await page
    .getByLabel("D’où vient la valeur ? Conséquence 1", { exact: true })
    .selectOption("literal");
  await page
    .getByLabel("Quantité ou valeur, conséquence 1", { exact: true })
    .fill("2");
  await question(page, "4.");
  await page
    .getByRole("button", { name: "Ajouter une règle composée", exact: true })
    .click();
  const root = page.locator(".expression-node").first();
  await root
    .getByLabel("Comparer ou calculer", { exact: true })
    .selectOption("lt");
  await root.getByLabel("Valeur", { exact: true }).fill("2");
  await save(page);
  await quickTest(page);
  await page
    .getByRole("button", { name: "Ouvrir la collecte", exact: true })
    .click();
  await role(page, "Joueur 1");
  await page.getByRole("button", { name: "Contribuer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Contribuer", exact: true }),
  ).toHaveCount(0);
  await role(page, "Spectateur");
  await expect(
    page.locator(".game-values").getByText("2", { exact: true }),
  ).toBeVisible();
});
