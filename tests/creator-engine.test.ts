import { randomUUID } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  gameDefinitionSchema,
  type GameDefinition,
  type Expression,
} from "@extension-twitch/contracts/game-definition";
import {
  storeListingSchema,
  exportManifestSchema,
  type StudioWorkspace,
  type CreatorOperation,
  type AssetDependency,
} from "@extension-twitch/contracts/creator";
import {
  officialCatalog,
  decideCreator,
  compileGuide,
  guideRepresentable,
  exportManifest,
  dependencyStatus,
  createGameRun,
  executeGameAction,
  projectGame,
} from "@extension-twitch/engine";
const context = () => ({ id: randomUUID(), at: "2026-10-23T12:00:00.000Z" });
const empty = (): StudioWorkspace => ({
  id: randomUUID(),
  name: "Créateur non vérifié",
  version: 1,
  games: [],
  installations: [],
});
const operate = (w: StudioWorkspace, operation: CreatorOperation) =>
  decideCreator(w, operation, context());
const fork = (w = empty()) =>
  operate(w, {
    type: "draft.fork",
    source: { gameId: officialCatalog[0]!.identity.id, version: "0.1.0" },
    title: "Ma variante",
  });
const recipe = {
  kind: "collective-counter",
  goal: 4,
  pointsMax: 3,
  multiplier: 2,
  oncePerPlayer: true,
} as const;
function save(
  w: StudioWorkspace,
  definition: GameDefinition,
  assets: AssetDependency[] = w.games[0]!.draft.assets,
) {
  const g = w.games[0]!;
  return operate(w, {
    type: "draft.save",
    gameId: g.identity.id,
    definition,
    metadata: {
      ...g.draft.metadata,
      title: definition.title,
      description: definition.description,
    },
    assets,
  });
}

describe("creator library foundations", () => {
  it("distinguishes an immutable installation from an independent variant with exact ancestry", () => {
    const source = structuredClone(officialCatalog[0]!);
    let w = operate(empty(), {
      type: "library.install",
      source: { gameId: source.identity.id, version: source.release.version },
    });
    expect(w.games).toEqual([]);
    expect(w.installations).toHaveLength(1);
    w = fork(w);
    const g = w.games[0]!;
    expect(g.identity.origin).toBe("personal");
    expect(g.identity.ownerId).toBe(w.id);
    expect(g.identity.lineage).toEqual([
      {
        gameId: source.identity.id,
        version: source.release.version,
        author: source.identity.author,
        definitionLicense: source.release.metadata.sharing.definitionLicense,
        rulesTerms: source.release.metadata.sharing.rulesTerms,
      },
    ]);
    expect(g.draft.definition.id).not.toBe(source.release.definition.id);
    const modified = structuredClone(g.draft.definition);
    modified.actions[1]!.parameters[0]!.value = {
      type: "integer",
      min: 1,
      max: 5,
      initial: 1,
    };
    const after = save(w, modified);
    expect(
      w.games[0]!.draft.definition.actions[1]!.parameters[0]!.value,
    ).not.toEqual(modified.actions[1]!.parameters[0]!.value);
    expect(after.games[0]!.draft.revision).toBe(2);
    expect(officialCatalog[0]).toEqual(source);
  });
  it("publishes immutable unique versions while drafts and later versions evolve", () => {
    let w = fork();
    const id = w.games[0]!.identity.id;
    w = operate(w, {
      type: "draft.publish",
      gameId: id,
      version: "1.0.0",
      rightsAttested: true,
    });
    const original = structuredClone(w.games[0]!.releases[0]!);
    const changed = structuredClone(w.games[0]!.draft.definition);
    changed.variables[0]!.value.initial = 10;
    w = save(w, changed);
    expect(w.games[0]!.releases[0]).toEqual(original);
    expect(() =>
      operate(w, {
        type: "draft.publish",
        gameId: id,
        version: "1.0.0",
        rightsAttested: true,
      }),
    ).toThrow("VERSION_ALREADY_PUBLISHED");
    w = operate(w, {
      type: "draft.publish",
      gameId: id,
      version: "1.1.0",
      rightsAttested: true,
    });
    expect(w.games[0]!.releases[0]).toEqual(original);
    expect(
      w.games[0]!.releases[1]!.definition.variables[0]!.value.initial,
    ).toBe(10);
    const bad = structuredClone(changed);
    bad.id = "other-id";
    expect(() => save(w, bad)).toThrow("STABLE_ID_REQUIRED");
  });
  it("copies only redistributable public resources and preserves replacement reasons and attributions", () => {
    let w = fork();
    const g = w.games[0]!;
    const d = structuredClone(g.draft.definition);
    d.assets = ["public", "private", "restricted", "disabled"].map((id) => ({
      id,
      kind: "image",
      usage: "Test",
      visibility: "public",
      fallback: "Remplacement",
    }));
    const dep = (assetId: string): AssetDependency => ({
      assetId,
      redistribution: "allowed",
      license: "Licence de test",
      attribution: "Auteur original",
      binding: {
        assetId,
        provider: "https",
        reference: "https://media.example.org/stage.png",
        access: "public",
        status: "active",
        rightsAttested: true,
        mime: "image/png",
      },
    });
    const assets = d.assets.map((a) => dep(a.id));
    assets[1]!.binding = {
      ...assets[1]!.binding!,
      provider: "browser-local",
      access: "device-only",
      reference: "private-device-handle",
    };
    assets[2]!.redistribution = "forbidden";
    assets[3]!.binding!.status = "disabled";
    const mismatched = structuredClone(assets);
    mismatched[0]!.binding!.assetId = "private";
    expect(() => save(w, d, mismatched)).toThrow("INVALID_ASSET");
    const hiddenSlot = structuredClone(d);
    hiddenSlot.assets[0]!.visibility = "gm";
    expect(() => save(w, hiddenSlot, assets)).toThrow("INVALID_ASSET");
    w = save(w, d, assets);
    w = operate(w, {
      type: "draft.publish",
      gameId: g.identity.id,
      version: "1.0.0",
      rightsAttested: true,
    });
    const release = w.games[0]!.releases[0]!;
    expect(release.assets.map((a) => dependencyStatus(a))).toEqual([
      "shareable",
      "private",
      "not-shareable",
      "disabled",
    ]);
    expect(JSON.stringify(release)).not.toContain("private-device-handle");
    const child = operate(w, {
      type: "draft.fork",
      source: { gameId: g.identity.id, version: "1.0.0" },
      title: "Sous-variante",
    }).games[1]!;
    expect(child.draft.assets[0]!.binding?.reference).toBe(
      assets[0]!.binding!.reference,
    );
    expect(child.draft.assets.slice(1).every((a) => !a.binding)).toBe(true);
    expect(child.identity.lineage).toHaveLength(2);
    expect(
      child.draft.assets.every((a) => a.attribution === "Auteur original"),
    ).toBe(true);
    const manifest = exportManifest({
      identity: w.games[0]!.identity,
      release,
    });
    expect(exportManifestSchema.safeParse(manifest).success).toBe(true);
    const serialized = JSON.stringify(manifest);
    for (const secret of [
      "private-device-handle",
      "https://media.example.org/stage.png",
      'definition"',
      "binding",
    ])
      expect(serialized).not.toContain(secret);
    expect(manifest.assets.map((a) => a.replacementRequired)).toEqual([
      false,
      true,
      true,
      true,
    ]);
  });
  it("does not treat future Store contracts as an endpoint exposing private definitions", () => {
    expect(
      storeListingSchema.safeParse({
        definition: officialCatalog[0]!.release.definition,
        token: "not-allowed",
      }).success,
    ).toBe(false);
    const source = officialCatalog[0]!;
    const listing = {
      gameId: source.identity.id,
      version: source.release.version,
      origin: "official",
      owner: { id: randomUUID(), displayName: "Studio" },
      creator: { id: randomUUID(), displayName: "Studio", verified: false },
      metadata: source.release.metadata,
      lineage: [],
      compatibility: { schemaVersion: 1, engineVersion: 1 },
      assets: [],
      publicationStatus: "private",
      moderation: { status: "not-reviewed", reportCount: 0 },
      sharePath: `/games/${source.identity.id}`,
    };
    expect(storeListingSchema.safeParse(listing).success).toBe(true);
    expect(
      storeListingSchema.safeParse({
        ...listing,
        definition: source.release.definition,
      }).success,
    ).toBe(false);
    expect(
      storeListingSchema.safeParse({ ...listing, token: "private-capability" })
        .success,
    ).toBe(false);
  });
});

describe("one bounded expression engine for the guide and advanced studio", () => {
  it("compiles executable guide choices and enforces the declared goal", () => {
    const d = compileGuide("guided-test", "Mon jeu", recipe);
    const pid = randomUUID();
    let run = createGameRun(d, {}, [], [pid], randomUUID());
    const action = (
      actionId: string,
      parameters: Record<string, number> = {},
      player = false,
    ) => {
      run = executeGameAction(
        run,
        player ? { role: "player", participantId: pid } : { role: "gm" },
        { runId: run.runId, actionId, parameters },
      );
    };
    action("open");
    expect(() => action("finish")).toThrow("ACTION_FORBIDDEN");
    action("contribute", { amount: 2 }, true);
    expect(run.sessionValues.total).toBe(4);
    action("finish");
    expect(run.phase).toBe("finished");
    expect(d.schemaVersion).toBe(2);
  });
  it("executes original and changed variant concurrently without shared values or rule changes", () => {
    const pid = randomUUID();
    const original = officialCatalog[0]!.release.definition;
    const variant = compileGuide("independent-variant", "Variante", recipe);
    let a = createGameRun(original, {}, [], [pid], randomUUID()),
      b = createGameRun(variant, {}, [], [pid], randomUUID());
    a = executeGameAction(
      a,
      { role: "gm" },
      { runId: a.runId, actionId: "open", parameters: {} },
    );
    b = executeGameAction(
      b,
      { role: "gm" },
      { runId: b.runId, actionId: "open", parameters: {} },
    );
    for (const which of ["original", "variant"]) {
      const run = which === "original" ? a : b;
      const next = executeGameAction(
        run,
        { role: "player", participantId: pid },
        { runId: run.runId, actionId: "contribute", parameters: { amount: 2 } },
      );
      if (which === "original") a = next;
      else b = next;
    }
    expect(a.sessionValues.total).toBe(2);
    expect(b.sessionValues.total).toBe(4);
  });
  it("keeps advanced edits that cannot be represented in the guide", () => {
    let w = operate(empty(), {
      type: "draft.create",
      title: "Guidé",
      mode: "guided",
      guide: recipe,
    });
    expect(guideRepresentable(w.games[0]!)).toBe(true);
    w = operate(w, {
      type: "draft.guide",
      gameId: w.games[0]!.identity.id,
      guide: { ...recipe, goal: 10 },
    });
    const d = structuredClone(w.games[0]!.draft.definition);
    d.roles[0]!.label = "Régisseur personnalisé";
    w = save(w, d);
    const before = structuredClone(w);
    expect(guideRepresentable(w.games[0]!)).toBe(false);
    expect(() =>
      operate(w, {
        type: "draft.guide",
        gameId: w.games[0]!.identity.id,
        guide: recipe,
      }),
    ).toThrow("GUIDE_NOT_REPRESENTABLE");
    expect(w).toEqual(before);
  });
  it("rejects excessive depth, invalid types, references, parameter guards and private flows", () => {
    const source = compileGuide("bounded-test", "Borné", recipe);
    const invalid = (change: (d: GameDefinition) => void) => {
      const d = structuredClone(source);
      change(d);
      return gameDefinitionSchema.safeParse(d).success;
    };
    expect(
      invalid((d) => {
        d.actions[0]!.guard = { kind: "literal", value: 7 };
      }),
    ).toBe(false);
    expect(
      invalid((d) => {
        d.actions[0]!.guard = { kind: "variable", id: "missing" };
      }),
    ).toBe(false);
    expect(
      invalid((d) => {
        d.actions[1]!.guard = { kind: "parameter", id: "amount" };
      }),
    ).toBe(false);
    expect(
      invalid((d) => {
        d.variables[0]!.visibility = "gm";
      }),
    ).toBe(false);
    expect(
      invalid((d) => {
        d.actions[1]!.effects[0] = {
          type: "increment",
          variable: "total",
          value: {
            from: "expression",
            expression: { kind: "variable", id: "used" },
          },
        };
      }),
    ).toBe(false);
    let expr: Expression = { kind: "literal", value: true };
    for (let i = 0; i < 5; i++)
      expr = { kind: "operator", operator: "not", args: [expr] };
    expect(
      invalid((d) => {
        d.actions[0]!.guard = expr;
      }),
    ).toBe(false);
    expect(
      invalid((d) => {
        d.schemaVersion = 1;
        d.engineVersion = 1;
      }),
    ).toBe(false);
  });
  it("rejects an overflowing effect atomically and treats an unavailable guard as unavailable", () => {
    const d = compileGuide("overflow-test", "Borné", recipe);
    d.actions[1]!.effects[0] = {
      type: "increment",
      variable: "total",
      value: {
        from: "expression",
        expression: {
          kind: "operator",
          operator: "multiply",
          args: [
            { kind: "literal", value: 100000 },
            { kind: "literal", value: 100000 },
          ],
        },
      },
    };
    const pid = randomUUID();
    let run = createGameRun(
      gameDefinitionSchema.parse(d),
      {},
      [],
      [pid],
      randomUUID(),
    );
    run = executeGameAction(
      run,
      { role: "gm" },
      { runId: run.runId, actionId: "open", parameters: {} },
    );
    expect(() =>
      executeGameAction(
        run,
        { role: "player", participantId: pid },
        { runId: run.runId, actionId: "contribute", parameters: { amount: 1 } },
      ),
    ).toThrow("INVALID_EXPRESSION");
    expect(run.sessionValues.total).toBe(0);
    expect(run.participantValues[pid]!.used).toBe(false);
    expect(
      projectGame(run, null).values.find((v) => v.id === "used"),
    ).toBeUndefined();
  });
});

it("combines private self conditions and public arithmetic without revealing hidden state", () => {
  const definition = compileGuide(
    "compound-test",
    "Conditions composées",
    recipe,
  );
  const action = definition.actions.find((a) => a.id === "contribute")!;
  action.conditions = [];
  action.guard = {
    kind: "operator",
    operator: "and",
    args: [
      {
        kind: "operator",
        operator: "not",
        args: [{ kind: "variable", id: "used" }],
      },
      {
        kind: "operator",
        operator: "lt",
        args: [
          { kind: "variable", id: "total" },
          { kind: "literal", value: 10 },
        ],
      },
    ],
  };
  action.effects[0] = {
    type: "set",
    variable: "total",
    value: {
      from: "expression",
      expression: {
        kind: "operator",
        operator: "add",
        args: [
          { kind: "variable", id: "total" },
          {
            kind: "operator",
            operator: "subtract",
            args: [
              { kind: "parameter", id: "amount" },
              { kind: "literal", value: 1 },
            ],
          },
        ],
      },
    },
  };
  const pid = randomUUID();
  let run = createGameRun(
    gameDefinitionSchema.parse(definition),
    {},
    [],
    [pid],
    randomUUID(),
  );
  run = executeGameAction(
    run,
    { role: "gm" },
    { runId: run.runId, actionId: "open", parameters: {} },
  );
  const player = { role: "player", participantId: pid } as const;
  run = executeGameAction(run, player, {
    runId: run.runId,
    actionId: "contribute",
    parameters: { amount: 3 },
  });
  expect(run.sessionValues.total).toBe(2);
  expect(
    projectGame(run, player).actions.some((a) => a.id === "contribute"),
  ).toBe(false);
  expect(JSON.stringify(projectGame(run, null))).not.toContain("used");
  const bad = structuredClone(definition);
  bad.variables.push({
    id: "public-flag",
    label: "Public",
    scope: "session",
    visibility: "public",
    value: { type: "boolean", initial: false },
  });
  bad.actions[1]!.effects.push({
    type: "set",
    variable: "public-flag",
    value: { from: "expression", expression: { kind: "variable", id: "used" } },
  });
  expect(gameDefinitionSchema.safeParse(bad).success).toBe(false);
});
