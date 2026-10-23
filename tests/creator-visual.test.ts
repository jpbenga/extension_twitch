import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  officialCatalog,
  createGameRun,
  executeGameAction,
  projectGame,
} from "@extension-twitch/engine";
import {
  gameDefinitionSchema,
  type GameDefinition,
  type Expression,
} from "@extension-twitch/contracts/game-definition";
import {
  comparison,
  definitionErrors,
  nextId,
  references,
  unreachablePhases,
} from "../apps/web/src/lib/creator-model.js";
const original = () => structuredClone(officialCatalog[0]!.release.definition);
describe("visual studio primitives use the existing contracts and interpreter", () => {
  it("finds references in nested expressions, effects, permissions and scenes without changing them", () => {
    const d = original();
    d.schemaVersion = 2;
    d.engineVersion = 2;
    const guard: Expression = {
      kind: "operator",
      operator: "and",
      args: [
        comparison(
          "gte",
          { kind: "variable", id: "total" },
          { kind: "literal", value: 0 },
        ),
        { kind: "literal", value: true },
      ],
    };
    d.actions[0]!.guard = guard;
    const before = structuredClone(d);
    expect(references(d, "variable", "total").length).toBeGreaterThan(0);
    expect(references(d, "role", d.defaultPlayerRole)).toContain(
      "Rôle joueur par défaut",
    );
    expect(references(d, "phase", d.initialPhase)).toContain("Phase initiale");
    expect(d).toEqual(before);
    expect(nextId("role", [{ id: "role-1" }, { id: "role-3" }])).toBe("role-2");
  });
  it("reports invalid types, references, bounds and inaccessible phases", () => {
    const d = original();
    d.phases.push({ id: "orphan", label: "Isolée" });
    expect(unreachablePhases(d).map((p) => p.id)).toEqual(["orphan"]);
    d.actions[0]!.nextPhase = "missing";
    expect(definitionErrors(d).join(" ")).toMatch(/étape qui n’existe plus/);
    d.variables[0]!.value = { type: "integer", min: 10, max: 1, initial: 0 };
    expect(definitionErrors(d).join(" ")).toMatch(/minimum et le maximum/);
    d.actions[0]!.effects = [
      {
        type: "set",
        variable: "missing",
        value: { from: "literal", value: 1 },
      },
    ];
    expect(definitionErrors(d).join(" ")).toMatch(/donnée qui n’existe plus/);
  });
  for (const [operator, expected] of [
    ["eq", false],
    ["ne", true],
    ["gt", true],
    ["lt", false],
    ["gte", true],
    ["lte", false],
  ] as const)
    it(`compiles ${operator} and executes it on the authoritative engine`, () => {
      const d = original();
      d.schemaVersion = 2;
      d.engineVersion = 2;
      d.actions[0]!.guard = comparison(
        operator,
        { kind: "literal", value: 3 },
        { kind: "literal", value: 2 },
      );
      const run = createGameRun(
        gameDefinitionSchema.parse(d),
        {},
        [],
        [],
        randomUUID(),
      );
      expect(
        projectGame(run, { role: "gm" }).actions.some(
          (a) => a.id === d.actions[0]!.id,
        ),
      ).toBe(expected);
    });
  it("executes a visual compound condition and ordered effects atomically, and preserves private projections", () => {
    const playerId = randomUUID();
    const d: GameDefinition = original();
    d.schemaVersion = 2;
    d.engineVersion = 2;
    d.variables.push({
      id: "secret",
      label: "Secret",
      scope: "participant",
      visibility: "owner",
      value: { type: "text", maxLength: 80, initial: "Confidentiel" },
    });
    const a = d.actions.find((a) => a.id === "contribute")!;
    a.guard = {
      kind: "operator",
      operator: "and",
      args: [
        comparison(
          "lt",
          { kind: "variable", id: "total" },
          { kind: "literal", value: 2 },
        ),
        {
          kind: "operator",
          operator: "not",
          args: [{ kind: "variable", id: "used" }],
        },
      ],
    };
    const gm = { role: "gm" } as const,
      player = { role: "player", participantId: playerId } as const;
    let run = createGameRun(
      gameDefinitionSchema.parse(d),
      {},
      [],
      [playerId],
      randomUUID(),
    );
    run = executeGameAction(run, gm, {
      runId: run.runId,
      actionId: "open",
      parameters: {},
    });
    run = executeGameAction(run, player, {
      runId: run.runId,
      actionId: "contribute",
      parameters: { amount: 2 },
    });
    expect(
      projectGame(run, gm).values.find((v) => v.id === "total")?.value,
    ).toBe(2);
    expect(projectGame(run, null).values.some((v) => v.id === "secret")).toBe(
      false,
    );
    expect(() =>
      executeGameAction(run, player, {
        runId: run.runId,
        actionId: "contribute",
        parameters: { amount: 2 },
      }),
    ).toThrow();
    expect(() =>
      executeGameAction(run, player, {
        runId: run.runId,
        actionId: "finish",
        parameters: {},
      }),
    ).toThrow();
  });
});
