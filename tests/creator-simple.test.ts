import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  compileCounterDefinition,
  counterRecipeFor,
  type GuideRecipe,
} from "@extension-twitch/contracts/creator";
import {
  officialCatalog,
  createGameRun,
  executeGameAction,
  projectGame,
} from "@extension-twitch/engine";
const template = officialCatalog[0]!.release.definition;
const recipe: GuideRecipe = {
  kind: "collective-counter",
  goal: 10,
  pointsMax: 2,
  multiplier: 1,
  oncePerPlayer: false,
};
describe("simple authoring uses the common executable definition", () => {
  it("changes the actual goal, maximum and repeat rule without modifying the original", () => {
    const before = structuredClone(template);
    const d = compileCounterDefinition(
      template,
      "my-counter",
      "Mon compteur",
      recipe,
      "Ma description",
    );
    expect(counterRecipeFor(d, template)).toEqual(recipe);
    expect(d.description).toBe("Ma description");
    const id = randomUUID(),
      gm = { role: "gm" } as const,
      player = { role: "player", participantId: id } as const;
    let run = createGameRun(d, {}, [], [id], randomUUID());
    run = executeGameAction(run, gm, {
      runId: run.runId,
      actionId: "open",
      parameters: {},
    });
    expect(() =>
      executeGameAction(run, player, {
        runId: run.runId,
        actionId: "contribute",
        parameters: { amount: 3 },
      }),
    ).toThrow();
    for (let i = 0; i < 5; i++) {
      expect(projectGame(run, gm).actions.some((a) => a.id === "finish")).toBe(
        false,
      );
      run = executeGameAction(run, player, {
        runId: run.runId,
        actionId: "contribute",
        parameters: { amount: 2 },
      });
    }
    expect(
      projectGame(run, null).values.find((v) => v.id === "total")?.value,
    ).toBe(10);
    run = executeGameAction(run, gm, {
      runId: run.runId,
      actionId: "finish",
      parameters: {},
    });
    expect(run.phase).toBe("finished");
    expect(template).toEqual(before);
  });
  it("recognizes supported choices but preserves unknown guards, roles, resources and private data", () => {
    expect(counterRecipeFor(template, template)).toMatchObject({
      goal: 4,
      pointsMax: 3,
      oncePerPlayer: true,
    });
    for (const mutate of [
      (d: typeof template) => {
        d.roles[0]!.label = "Régisseur";
      },
      (d: typeof template) => {
        d.actions[1]!.guard = { kind: "literal", value: true };
      },
      (d: typeof template) => {
        d.variables.push({
          id: "secret",
          label: "Secret",
          scope: "participant",
          visibility: "owner",
          value: { type: "text", initial: "Privé", maxLength: 20 },
        });
      },
      (d: typeof template) => {
        d.assets[0]!.fallback = "Mon fond";
      },
      (d: typeof template) => {
        d.scenes[0]!.widgets[0]!.color = "#000000";
      },
    ]) {
      const d = compileCounterDefinition(
        template,
        "my-counter",
        "Titre",
        recipe,
      );
      mutate(d);
      const before = structuredClone(d);
      expect(counterRecipeFor(d, template)).toBeNull();
      expect(d).toEqual(before);
    }
  });
  it("validates bounded choices and retains single contribution permissions", () => {
    expect(() =>
      compileCounterDefinition(template, "my-counter", "Titre", {
        ...recipe,
        goal: 0,
      }),
    ).toThrow();
    const d = compileCounterDefinition(template, "my-counter", "Titre", {
      ...recipe,
      oncePerPlayer: true,
    });
    const id = randomUUID(),
      player = { role: "player", participantId: id } as const;
    let run = createGameRun(d, {}, [], [id], randomUUID());
    run = executeGameAction(
      run,
      { role: "gm" },
      { runId: run.runId, actionId: "open", parameters: {} },
    );
    run = executeGameAction(run, player, {
      runId: run.runId,
      actionId: "contribute",
      parameters: { amount: 2 },
    });
    expect(() =>
      executeGameAction(run, player, {
        runId: run.runId,
        actionId: "contribute",
        parameters: { amount: 1 },
      }),
    ).toThrow();
    expect(projectGame(run, null).values.map((v) => v.id)).not.toContain(
      "used",
    );
  });
});
