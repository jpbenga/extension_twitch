import { test, expect } from "@playwright/test";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
import {
  advanced,
  json,
  save,
  quickTest,
  externalView,
} from "./creator-helpers.js";

test("the advanced skeleton runs custom typed actions and guards while keeping GM information private", async ({
  page,
}) => {
  await advanced(page);
  const textarea = await json(page),
    d = JSON.parse(await textarea.inputValue()) as GameDefinition;
  d.variables.push(
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
  d.actions[0]!.guard = { kind: "variable", id: "enabled" };
  d.actions.push({
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
  await textarea.fill(JSON.stringify(d));
  await save(page);
  await quickTest(page);
  const gm = await externalView(page, "Game Master"),
    player = await externalView(page, "Joueur 1"),
    observer = await externalView(page, "Spectateur");
  await expect(gm.locator("#game")).toContainText(
    "Note confidentielle de production",
  );
  await expect(player.locator("#game")).not.toContainText(
    "Note confidentielle de production",
  );
  await expect(observer.locator("body")).not.toContainText(
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
  await expect(
    observer.locator(".game-values").getByText("1", { exact: true }),
  ).toBeVisible();
  await Promise.all([gm, player, observer].map((p) => p.close()));
});
