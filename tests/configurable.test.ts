import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  gameDefinitionSchema,
  assetBindingSchema,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import {
  answerBox,
  collectivePulse,
  createGameRun,
  executeGameAction,
  assignGameRole,
  projectGame,
  type GameRun,
  type SessionActor,
} from "@extension-twitch/engine";
const gm = { role: "gm" } as const;
const one = randomUUID(),
  two = randomUUID();
const actor = (participantId = one): SessionActor => ({
  role: "player",
  participantId,
});
const start = (d = collectivePulse) =>
  createGameRun(d, {}, [], [one, two], randomUUID());
const act = (
  run: GameRun,
  who: SessionActor,
  actionId: string,
  parameters: Record<string, string | number | boolean> = {},
) => executeGameAction(run, who, { runId: run.runId, actionId, parameters });
const edit = (change: (d: GameDefinition) => void) => {
  const d = structuredClone(collectivePulse);
  change(d);
  return gameDefinitionSchema.safeParse(d).success;
};

describe("versioned declarative definitions", () => {
  it("supports genuinely different roles, actions and phases, beyond the official game identifiers", () => {
    expect(gameDefinitionSchema.parse(collectivePulse).id).toBe(
      "collective-pulse",
    );
    expect(answerBox.roles.length).toBeGreaterThan(
      collectivePulse.roles.length,
    );
    expect(answerBox.phases.length).not.toBe(collectivePulse.phases.length);
    expect(answerBox.actions.some((a) => a.id === "answer")).toBe(true);
  });
  it("rejects code, unknown versions, duplicate IDs, broken references and unbounded data", () => {
    expect(
      gameDefinitionSchema.safeParse({ ...collectivePulse, schemaVersion: 2 })
        .success,
    ).toBe(false);
    expect(
      gameDefinitionSchema.safeParse({
        ...collectivePulse,
        script: "process.exit()",
      }).success,
    ).toBe(false);
    expect(
      edit((d) => {
        d.roles.push(d.roles[0]!);
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.actions[0]!.nextPhase = "missing";
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.defaultPlayerRole = "host";
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.actions[0]!.roles = ["audience"];
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.variables[0]!.value = {
          type: "integer",
          min: 10,
          max: 0,
          initial: 0,
        };
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.variables[0]!.id = "constructor";
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.scenes[0]!.widgets[0]!.source.id = "unknown";
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.scenes[0]!.widgets[0]!.x = 1900;
      }),
    ).toBe(false);
  });
  it("rejects invisible conditions, player revelations and hidden config flowing into public variables", () => {
    expect(
      edit((d) => {
        d.variables[1]!.visibility = "gm";
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.actions[1]!.effects = [{ type: "reveal", variable: "used" }];
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.variables[0]!.visibility = "gm";
        d.actions[1]!.conditions = [];
      }),
    ).toBe(false);
    expect(
      edit((d) => {
        d.configuration = [
          {
            id: "hidden",
            label: "Secret",
            visibility: "gm",
            value: { type: "integer", min: 0, max: 100, initial: 5 },
          },
        ];
        d.actions[1]!.effects = [
          {
            type: "set",
            variable: "total",
            value: { from: "configuration", id: "hidden" },
          },
        ];
      }),
    ).toBe(false);
  });
});

describe("shared interpreter", () => {
  it("pins a separate definition and validates chosen configuration", () => {
    const definition = structuredClone(answerBox);
    const config = { "production-note": "Secret de production" };
    const run = createGameRun(definition, config, [], [one, two], randomUUID());
    definition.title = "Changed catalogue";
    config["production-note"] = "Changed choice";
    expect(run.definition.title).toBe(answerBox.title);
    expect(run.configuration["production-note"]).toBe("Secret de production");
    expect(() =>
      createGameRun(
        answerBox,
        { "production-note": false },
        [],
        [one],
        randomUUID(),
      ),
    ).toThrow("INVALID_CONFIGURATION");
    expect(() =>
      createGameRun(answerBox, { unknown: 5 }, [], [one], randomUUID()),
    ).toThrow("INVALID_CONFIGURATION");
  });
  it("enforces roles, phases, exact parameters, bounds and one contribution without mutation", () => {
    const prep = start();
    expect(() => act(prep, actor(), "contribute", { amount: 1 })).toThrow(
      "ACTION_FORBIDDEN",
    );
    expect(() => act(prep, actor(), "open")).toThrow("ACTION_FORBIDDEN");
    const run = act(prep, gm, "open");
    expect(prep.phase).toBe("preparation");
    expect(() => act(run, actor(), "contribute", { amount: 4 })).toThrow(
      "INVALID_PARAMETERS",
    );
    expect(() =>
      act(run, actor(), "contribute", { amount: 1, role: "host" }),
    ).toThrow("INVALID_PARAMETERS");
    const contributed = act(run, actor(), "contribute", { amount: 3 });
    expect(contributed.sessionValues.total).toBe(3);
    expect(run.sessionValues.total).toBe(0);
    expect(() =>
      act(contributed, actor(), "contribute", { amount: 1 }),
    ).toThrow("ACTION_FORBIDDEN");
    expect(() =>
      act(run, actor(randomUUID()), "contribute", { amount: 1 }),
    ).toThrow("ACTION_FORBIDDEN");
    expect(projectGame(contributed, null).actions).toEqual([]);
    expect(act(contributed, gm, "finish").phase).toBe("finished");
  });
  it("rolls back all effects when an effect exceeds a bound", () => {
    const definition = structuredClone(collectivePulse);
    definition.actions[1]!.effects.reverse(); // A successful private write precedes the failing increment.
    let run = act(start(definition), gm, "open");
    run = { ...run, sessionValues: { total: 100 } };
    expect(() => act(run, actor(), "contribute", { amount: 1 })).toThrow(
      "VALUE_OUT_OF_BOUNDS",
    );
    expect(run.participantValues[one]?.used).toBe(false);
    expect(run.sessionValues.total).toBe(100);
  });
  it("protects private answers and assignments until an explicit GM reveal", () => {
    let run = start(answerBox);
    run = assignGameRole(run, gm, two, "reviewer");
    expect(() => assignGameRole(run, actor(), one, "reviewer")).toThrow(
      "FORBIDDEN",
    );
    expect(() => assignGameRole(run, gm, one, "host")).toThrow("INVALID_ROLE");
    run = act(run, gm, "open");
    run = act(run, actor(), "answer", { text: "Mon souvenir confidentiel" });
    expect(JSON.stringify(projectGame(run, null))).not.toContain(
      "Mon souvenir confidentiel",
    );
    expect(JSON.stringify(projectGame(run, actor(two)))).not.toContain(
      "Mon souvenir confidentiel",
    );
    expect(JSON.stringify(projectGame(run, actor()))).toContain(
      "Mon souvenir confidentiel",
    );
    expect(JSON.stringify(projectGame(run, gm))).toContain(
      "Mon souvenir confidentiel",
    );
    for (const a of [null, actor(), actor(two)]) {
      const projection = projectGame(run, a);
      expect(projection.management).toBeUndefined();
      expect(JSON.stringify(projection)).not.toContain("Note réservée au GM");
    }
    run = act(run, gm, "review");
    expect(() => act(run, gm, "reveal")).toThrow("ACTION_FORBIDDEN");
    expect(() => act(run, actor(), "approve")).toThrow("ACTION_FORBIDDEN");
    run = act(run, actor(two), "approve");
    run = act(run, gm, "reveal");
    expect(run.phase).toBe("revealed");
    expect(JSON.stringify(projectGame(run, null))).toContain(
      "Mon souvenir confidentiel",
    );
  });
  it("rejects commands from old runs and unsupported persisted state versions", () => {
    const run = start();
    expect(() =>
      executeGameAction(run, gm, {
        runId: randomUUID(),
        actionId: "open",
        parameters: {},
      }),
    ).toThrow("STALE_GAME");
    expect(() =>
      projectGame({ ...run, stateVersion: 2 } as unknown as GameRun, null),
    ).toThrow("UNSUPPORTED_GAME_VERSION");
  });
});

describe("logical assets", () => {
  const binding = {
    assetId: "backdrop",
    provider: "https",
    reference: "https://media.example.org/stage.png",
    access: "public",
    status: "active",
    rightsAttested: true,
    mime: "image/png",
  } as const;
  it("separates providers from definitions and never projects storage references", () => {
    const run = createGameRun(
      collectivePulse,
      {},
      [binding],
      [one],
      randomUUID(),
    );
    for (const a of [null, gm, actor()]) {
      const view = projectGame(run, a);
      expect(view.assets[0]?.availability).toBe("unavailable");
      expect(JSON.stringify(view)).not.toContain(binding.reference);
      expect(JSON.stringify(view)).not.toContain("https");
    }
    expect(
      projectGame(
        createGameRun(
          collectivePulse,
          {},
          [{ ...binding, status: "disabled" }],
          [one],
          randomUUID(),
        ),
        null,
      ).assets[0]?.availability,
    ).toBe("disabled");
    expect(projectGame(start(), null).assets[0]?.availability).toBe("unbound");
    expect(() =>
      createGameRun(
        collectivePulse,
        {},
        [{ ...binding, assetId: "missing" }],
        [],
        randomUUID(),
      ),
    ).toThrow("INVALID_ASSET");
    expect(() =>
      createGameRun(
        collectivePulse,
        {},
        [{ ...binding, mime: "audio/ogg" }],
        [],
        randomUUID(),
      ),
    ).toThrow("INVALID_ASSET");
  });
  it("rejects active content, credentials, local URLs, tokens, paths and unacknowledged rights", () => {
    for (const reference of [
      "javascript:alert(1)",
      "data:image/png;base64,abc",
      "http://host.example/x",
      "https://127.0.0.1/a",
      "https://[::1]/a",
      "https://server.local/a",
      "https://me:pass@media.example.org/x",
      "https://media.example.org/x?token=private",
      "https://media.example.org/x#private",
    ])
      expect(
        assetBindingSchema.safeParse({ ...binding, reference }).success,
      ).toBe(false);
    expect(
      assetBindingSchema.safeParse({ ...binding, mime: "image/svg+xml" })
        .success,
    ).toBe(false);
    expect(
      assetBindingSchema.safeParse({ ...binding, rightsAttested: false })
        .success,
    ).toBe(false);
    expect(
      assetBindingSchema.safeParse({
        ...binding,
        provider: "browser-local",
        reference: "/Users/me/image.png",
        access: "device-only",
      }).success,
    ).toBe(false);
    expect(
      assetBindingSchema.safeParse({
        ...binding,
        provider: "browser-local",
        reference: "device-handle-1",
        access: "device-only",
      }).success,
    ).toBe(true);
  });
});
