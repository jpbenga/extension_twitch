import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { undercoverDefinition } from "@extension-twitch/game-undercover/definition";
import {
  gameDefinitionSchema,
  type GameDefinition,
  type Scalar,
} from "@extension-twitch/contracts/game-definition";
import {
  createGameRun,
  executeGameAction,
  assignGameRole,
  projectGame,
  type GameRun,
  type SessionActor,
} from "@extension-twitch/engine";
import {
  references,
  unreachablePhases,
} from "../apps/web/src/lib/creator-model.js";
const gm = { role: "gm" } as const;
const player = (participantId: string): SessionActor => ({
  role: "player",
  participantId,
});
function setup(
  size = 4,
  configuration: Record<string, Scalar> = {},
  definition = undercoverDefinition,
) {
  const ids = Array.from({ length: size }, () => randomUUID());
  return {
    ids,
    run: createGameRun(definition, configuration, [], ids, randomUUID()),
  };
}
const act = (
  run: GameRun,
  actionId: string,
  who: SessionActor = gm,
  parameters: Record<string, Scalar> = {},
) =>
  executeGameAction(
    run,
    who,
    { runId: run.runId, actionId, parameters },
    () => 0,
  );
function completeClues(run: GameRun) {
  let r = run;
  while (r.play?.turns && r.play.turns.index < r.play.turns.order.length)
    r = act(r, "confirm-clue");
  return r;
}
const openVote = (run: GameRun) => act(completeClues(run), "open-vote");
function votesFor(run: GameRun, target: string) {
  let r = run;
  for (const id of r.play!.active)
    r = act(r, "vote", player(id), {
      target: id === target ? r.play!.active.find((p) => p !== id)! : target,
    });
  return r;
}
describe("Undercover's demonstrator executes shared declared primitives", () => {
  it("plays the configured multi-Undercover format for every roster size, with two full clue rounds before each ballot", () => {
    for (let count = 3; count <= 12; count++) {
      const minority = Math.min(5, Math.floor((count - 1) / 2));
      const { run } = setup(count, { "undercover-count": minority });
      let current = act(run, "deal");
      expect(
        Object.values(current.assignments).filter((r) => r === "undercover"),
      ).toHaveLength(minority);
      let eliminated = 0;
      while (current.phase !== "finished") {
        expect(current.play!.turns!.total).toBe(2);
        expect(() => act(current, "open-vote")).toThrow("ACTION_FORBIDDEN");
        const ready = completeClues(current);
        const target = ready.play!.active.find(
          (id) => ready.assignments[id] === "undercover",
        )!;
        current = act(votesFor(act(ready, "open-vote"), target), "resolve");
        eliminated++;
        if (current.phase !== "finished") current = act(current, "next");
      }
      expect(eliminated).toBe(minority);
      expect(current.play!.outcome!.id).toBe("civils-win");
      expect(() =>
        setup(count, { "undercover-count": minority + 1 }),
      ).toThrow();
    }
  });
  it("keeps bounded v3 separate from v1/v2, validates every role/configuration/phase/permission reference", () => {
    expect(gameDefinitionSchema.parse(undercoverDefinition).schemaVersion).toBe(
      3,
    );
    expect(
      new TextEncoder().encode(JSON.stringify(undercoverDefinition)).length,
    ).toBeLessThan(6000);
    for (const edit of [
      (d: GameDefinition) => {
        d.schemaVersion = 2;
        d.engineVersion = 2;
      },
      (d: GameDefinition) => {
        d.mechanics!.deals[0]!.majorityRole = "missing";
      },
      (d: GameDefinition) => {
        d.mechanics!.deals[0]!.privateVariable = "missing";
      },
      (d: GameDefinition) => {
        d.mechanics!.ballots[0]!.resultPhase = "missing";
      },
      (d: GameDefinition) => {
        d.mechanics!.endings[0]!.leftRole = "missing";
      },
      (d: GameDefinition) => {
        d.mechanics!.drawRevealVariables = ["missing"];
      },
      (d: GameDefinition) => {
        d.actions[0]!.roles = ["civil"];
      },
      (d: GameDefinition) => {
        d.actions[2]!.roles = ["host"];
      },
      (d: GameDefinition) => {
        d.actions[2]!.parameters = [];
      },
      (d: GameDefinition) => {
        d.actions[3]!.nextPhase = "finished";
      },
    ]) {
      const d = structuredClone(undercoverDefinition);
      edit(d);
      expect(gameDefinitionSchema.safeParse(d).success).toBe(false);
    }
    expect(
      references(undercoverDefinition, "variable", "secret-word"),
    ).toContain("Règles de partie");
    expect(unreachablePhases(undercoverDefinition)).toEqual([]);
  });
  it("checks actual roster bounds, minority proportions and distinct private values before installation", () => {
    expect(() => setup(2)).toThrow("INVALID_PLAYER_COUNT");
    expect(() => setup(13)).toThrow("INVALID_PLAYER_COUNT");
    expect(setup(3).run.play!.active).toHaveLength(3);
    expect(setup(12).run.play!.active).toHaveLength(12);
    expect(() => setup(4, { "undercover-count": 2 })).toThrow(
      "INVALID_DISTRIBUTION",
    );
    expect(() => setup(6, { "undercover-count": 0 })).toThrow(
      "INVALID_CONFIGURATION",
    );
    expect(() =>
      setup(4, { "civil-word": " Naruto ", "undercover-word": "naruto" }),
    ).toThrow("INVALID_SECRET_VALUES");
    expect(() => setup(4, { "civil-word": "" })).toThrow(
      "INVALID_SECRET_VALUES",
    );
  });
  it("distributes once on the server, gives each player just one secret and conceals camps and choices", () => {
    const { run, ids } = setup(6, {
      "undercover-count": 2,
      "civil-word": "Naruto",
      "undercover-word": "Sasuke",
    });
    const started = act(run, "deal");
    expect(
      Object.values(started.assignments).filter((r) => r === "undercover"),
    ).toHaveLength(2);
    expect(
      Object.values(started.participantValues).filter(
        (v) => v["secret-word"] === "Sasuke",
      ),
    ).toHaveLength(2);
    expect(run.play!.dealt).toBe(false);
    expect(() => act(started, "deal")).toThrow("ACTION_FORBIDDEN");
    expect(() => assignGameRole(started, gm, ids[0]!, "undercover")).toThrow(
      "ROLES_LOCKED",
    );
    for (const id of ids) {
      const own = projectGame(started, player(id));
      expect(own.role).toBeUndefined();
      expect(own.management).toBeUndefined();
      expect(own.values.map((v) => v.participantId)).toEqual([id]);
      expect(own.play!.roster.every((p) => p.role === undefined)).toBe(true);
      expect(own.values[0]!.value).toBe(
        started.participantValues[id]!["secret-word"],
      );
    }
    const pub = JSON.stringify(projectGame(started, null));
    expect(pub).not.toMatch(/Naruto|Sasuke|assignments|privateVariable/);
    expect(projectGame(started, gm).values).toHaveLength(6);
  });
  it("rejects out-of-phase, foreign, self and duplicate votes, and prevents resolving an incomplete ballot", () => {
    const { ids, run } = setup();
    expect(() =>
      act(run, "vote", player(ids[0]!), { target: ids[1]! }),
    ).toThrow("ACTION_FORBIDDEN");
    const discussion = act(run, "deal"),
      voting = openVote(discussion);
    expect(() => act(voting, "resolve")).toThrow("ACTION_FORBIDDEN");
    expect(() =>
      act(voting, "vote", player(ids[0]!), { target: ids[0]! }),
    ).toThrow("INVALID_VOTE_TARGET");
    expect(() =>
      act(voting, "vote", player(ids[0]!), { target: randomUUID() }),
    ).toThrow("INVALID_VOTE_TARGET");
    expect(() =>
      act(voting, "vote", player(randomUUID()), { target: ids[1]! }),
    ).toThrow("ACTION_FORBIDDEN");
    const voted = act(voting, "vote", player(ids[0]!), { target: ids[1]! });
    expect(() =>
      act(voted, "vote", player(ids[0]!), { target: ids[2]! }),
    ).toThrow("ACTION_FORBIDDEN");
    expect(voting.play!.ballots.elimination!.votes).toEqual({});
    expect(projectGame(voted, player(ids[0]!)).play!.ballot!.myVote).toBe(
      ids[1],
    );
    expect(
      projectGame(voted, player(ids[2]!)).play!.ballot!.myVote,
    ).toBeUndefined();
    const pub = projectGame(voted, null);
    expect(pub.play!.ballot!.voted).toEqual([ids[0]]);
    expect(pub.play!.ballot!.tallies).toEqual([]);
    expect(JSON.stringify(pub)).not.toContain('"votes":');
  });
  it("aggregates ties without elimination, progresses rounds and reaches an explicit bounded draw", () => {
    const { ids, run } = setup(4, { "round-limit": 2 });
    let r = openVote(act(run, "deal"));
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < ids.length; i++)
        r = act(r, "vote", player(ids[i]!), {
          target: ids[(i + 1) % ids.length]!,
        });
      r = act(r, "resolve");
      expect(r.play!.active).toHaveLength(4);
      expect(r.play!.ballots.elimination!.tied).toBe(true);
      if (round === 0) {
        expect(r.phase).toBe("result");
        r = openVote(act(r, "next"));
      }
    }
    expect(r.phase).toBe("finished");
    expect(r.play!.outcome!.id).toBe("round-limit");
    expect(projectGame(r, null).values).toHaveLength(4);
  });
  it("reveals only the chosen ending's authorized data, not another possible ending's secrets", () => {
    const d = structuredClone(undercoverDefinition);
    d.mechanics!.endings[0]!.revealVariables = [];
    const { run, ids } = setup(4, {}, gameDefinitionSchema.parse(d));
    let r = act(run, "deal");
    const target = ids.find((id) => r.assignments[id] === "undercover")!;
    r = act(votesFor(openVote(r), target), "resolve");
    expect(r.play!.outcome!.id).toBe("civils-win");
    expect(r.revealed).toEqual([]);
    expect(projectGame(r, null).values).toEqual([]);
    expect(projectGame(r, player(ids[0]!)).values).toHaveLength(1);
  });
  it("eliminates, reveals the eliminated camp only, excludes eliminated voters and reaches minority parity", () => {
    const { run } = setup(6, { "undercover-count": 2 });
    let r = act(run, "deal");
    const civils = Object.keys(r.assignments).filter(
      (id) => r.assignments[id] === "civil",
    );
    r = act(votesFor(openVote(r), civils[0]!), "resolve");
    expect(r.phase).toBe("result");
    expect(r.play!.active).toHaveLength(5);
    const pub = projectGame(r, null);
    expect(pub.play!.roster.find((p) => p.id === civils[0])!.role).toBe(
      "Civil",
    );
    expect(pub.values).toEqual([]);
    r = openVote(act(r, "next"));
    expect(() =>
      act(r, "vote", player(civils[0]!), { target: civils[1]! }),
    ).toThrow("ACTION_FORBIDDEN");
    expect(() =>
      act(r, "vote", player(civils[1]!), { target: civils[0]! }),
    ).toThrow("INVALID_VOTE_TARGET");
    r = act(votesFor(r, civils[1]!), "resolve");
    expect(r.play!.outcome!.id).toBe("undercover-win");
    expect(r.phase).toBe("finished");
    expect(projectGame(r, null).values).toHaveLength(6);
    expect(projectGame(r, null).play!.roster.every((p) => !!p.role)).toBe(true);
  });
  it("reaches civilian victory and restarts without previous votes, secrets or eliminations", () => {
    const { run, ids } = setup();
    let r = act(run, "deal");
    const target = ids.find((id) => r.assignments[id] === "undercover")!;
    r = act(votesFor(openVote(r), target), "resolve");
    expect(r.play!.outcome!.id).toBe("civils-win");
    expect(projectGame(r, gm).actions).toEqual([]);
    const replay = createGameRun(
      r.definition,
      r.configuration,
      r.assets,
      ids,
      randomUUID(),
    );
    expect(replay.play!.dealt).toBe(false);
    expect(replay.play!.active).toHaveLength(4);
    expect(replay.play!.ballots).toEqual({});
    expect(replay.participantValues[ids[0]!]!["secret-word"]).toBe("");
    expect(replay.revealed).toEqual([]);
    expect(() =>
      executeGameAction(replay, gm, {
        runId: r.runId,
        actionId: "deal",
        parameters: {},
      }),
    ).toThrow("STALE_GAME");
  });
  it("uses the same primitives for a renamed custom definition with different labels, self-votes and ending", () => {
    const d = structuredClone(undercoverDefinition);
    d.id = "my-secret-council";
    d.title = "Le conseil";
    d.mechanics!.ballots[0]!.allowSelfVote = true;
    d.mechanics!.endings[0]!.label = "Le conseil a découvert l’intrus";
    const { run, ids } = setup(3, {}, gameDefinitionSchema.parse(d));
    let r = openVote(act(run, "deal"));
    const target = ids.find((id) => r.assignments[id] === "undercover")!;
    for (const id of ids) r = act(r, "vote", player(id), { target });
    r = act(r, "resolve");
    expect(r.play!.outcome!.label).toBe("Le conseil a découvert l’intrus");
    expect(projectGame(r, null).definitionId).toBe("my-secret-council");
  });
  it("keeps explicit GM reveal effects usable alongside native operations without revealing undeclared secrets", () => {
    const d = structuredClone(undercoverDefinition);
    d.variables.push({
      id: "clue",
      label: "Indice public après révélation",
      scope: "session",
      visibility: "gm",
      value: { type: "text", initial: "Un indice autorisé", maxLength: 80 },
    });
    d.actions.push({
      id: "reveal-clue",
      label: "Révéler l’indice",
      confirmation: false,
      roles: ["host"],
      phases: ["discussion"],
      parameters: [],
      conditions: [],
      effects: [{ type: "reveal", variable: "clue" }],
    });
    const { run } = setup(4, {}, gameDefinitionSchema.parse(d));
    const r = act(act(run, "deal"), "reveal-clue");
    expect(projectGame(r, null).values.map((v) => v.id)).toEqual(["clue"]);
    expect(projectGame(r, null).values[0]!.value).toBe("Un indice autorisé");
  });
});

it("reuses a named ballot without distribution, minority roles, elimination or a mandatory game ending", () => {
  const d = structuredClone(undercoverDefinition);
  d.id = "player-choice";
  d.title = "Choisir un porte-parole";
  delete d.mechanics!.turns;
  delete d.mechanics!.ballots[0]!.requireTurns;
  d.actions = d.actions.filter((a) => a.id !== "confirm-clue");
  d.configuration = [];
  d.variables = [];
  d.roles = d.roles.filter((r) => r.id !== "undercover");
  d.actions = d.actions.filter((a) => a.id !== "deal");
  d.actions.find((a) => a.id === "open-vote")!.phases = [
    "preparation",
    "discussion",
  ];
  d.actions.find((a) => a.id === "vote")!.roles = ["civil"];
  d.mechanics!.deals = [];
  d.mechanics!.endings = [];
  d.mechanics!.drawRevealVariables = [];
  delete d.mechanics!.roundLimitConfiguration;
  delete d.mechanics!.drawLabel;
  delete d.mechanics!.finishedPhase;
  d.mechanics!.ballots[0]!.resolution = "select";
  d.mechanics!.minPlayers = 2;
  const { run, ids } = setup(3, {}, gameDefinitionSchema.parse(d));
  expect(assignGameRole(run, gm, ids[0]!, "civil").assignments[ids[0]!]).toBe(
    "civil",
  );
  let r = act(run, "open-vote");
  r = act(votesFor(r, ids[0]!), "resolve");
  expect(r.play!.active).toHaveLength(3);
  expect(r.play!.dealt).toBe(true);
  expect(r.play!.ballots.elimination!.selected).toBe(ids[0]);
  expect(r.play!.ballots.elimination!.eliminated).toBeUndefined();
  expect(r.play!.outcome).toBeUndefined();
  expect(projectGame(r, null).values).toEqual([]);
});

it("requires every active player's oral turn twice by default and exposes only safe progression", () => {
  const { run, ids } = setup();
  let r = act(run, "deal");
  expect(r.play!.turns!.total).toBe(2);
  for (let round = 1; round <= 2; round++) {
    for (let i = 0; i < ids.length; i++) {
      const t = projectGame(r, null).play!.turns!;
      expect(t.round).toBe(round);
      expect(t.current).toBe(ids[i]);
      expect(t.completed).toEqual(ids.slice(0, i));
      expect(t.complete).toBe(false);
      expect(projectGame(r, gm).actions.map((a) => a.id)).toEqual([
        "confirm-clue",
      ]);
      expect(() => act(r, "open-vote")).toThrow("ACTION_FORBIDDEN");
      expect(() => act(r, "confirm-clue", player(ids[i]!))).toThrow(
        "ACTION_FORBIDDEN",
      );
      const next = act(r, "confirm-clue");
      expect(r.play!.turns!.index).toBe(i); // immutable transaction input
      r = next;
    }
  }
  expect(projectGame(r, null).play!.turns!.complete).toBe(true);
  expect(projectGame(r, gm).actions.map((a) => a.id)).toEqual(["open-vote"]);
  expect(() => act(r, "confirm-clue")).toThrow("ACTION_FORBIDDEN");
  expect(act(r, "open-vote").phase).toBe("vote");
});
it("restarts clue rounds with surviving players only, and supports configurable bounds without changing old definitions", () => {
  const { run } = setup(6, { "undercover-count": 2, "clue-rounds": 3 });
  let r = act(run, "deal");
  expect(r.play!.turns!.total).toBe(3);
  const civil = r.play!.active.find((id) => r.assignments[id] === "civil")!;
  r = act(votesFor(openVote(r), civil), "resolve");
  r = act(r, "next");
  expect(r.play!.turns!.order).toEqual(r.play!.active);
  expect(r.play!.turns!.order).not.toContain(civil);
  expect(r.play!.turns!.round).toBe(1);
  expect(r.play!.turns!.index).toBe(0);
  expect(() => act(r, "open-vote")).toThrow("ACTION_FORBIDDEN");
  for (const value of [0, 6])
    expect(() => setup(4, { "clue-rounds": value })).toThrow(
      "INVALID_CONFIGURATION",
    );
  const d = structuredClone(undercoverDefinition);
  d.version = "0.1.0";
  delete d.mechanics!.turns;
  delete d.mechanics!.ballots[0]!.requireTurns;
  d.configuration = d.configuration.filter((f) => f.id !== "clue-rounds");
  d.actions = d.actions.filter((a) => a.id !== "confirm-clue");
  const old = setup(4, {}, gameDefinitionSchema.parse(d)).run;
  expect(act(act(old, "deal"), "open-vote").phase).toBe("vote");
  expect(old.definition.version).toBe("0.1.0");
});
it("validates turn references, bounds, mandatory confirmation and GM-only management", () => {
  for (const edit of [
    (d: GameDefinition) => {
      d.mechanics!.turns!.phase = "missing";
    },
    (d: GameDefinition) => {
      d.mechanics!.turns!.roundsConfiguration = "missing";
    },
    (d: GameDefinition) => {
      d.mechanics!.turns!.roundsConfiguration = "civil-word";
    },
    (d: GameDefinition) => {
      delete d.mechanics!.turns;
    },
    (d: GameDefinition) => {
      d.actions.find((a) => a.id === "confirm-clue")!.roles = ["civil"];
    },
    (d: GameDefinition) => {
      d.actions = d.actions.filter((a) => a.id !== "confirm-clue");
    },
  ]) {
    const d = structuredClone(undercoverDefinition);
    edit(d);
    expect(gameDefinitionSchema.safeParse(d).success).toBe(false);
  }
});

it("runs reusable oral turns in a different definition without hidden roles, private words or eliminations", () => {
  const d = structuredClone(undercoverDefinition);
  d.id = "round-table";
  d.title = "Tour de table";
  d.configuration = d.configuration.filter((c) => c.id === "clue-rounds");
  d.variables = [];
  d.roles = d.roles.filter((r) => r.id !== "undercover");
  d.initialPhase = "discussion";
  d.actions = d.actions.filter((a) => a.id !== "deal");
  d.actions.find((a) => a.id === "vote")!.roles = ["civil"];
  d.mechanics!.deals = [];
  d.mechanics!.endings = [];
  d.mechanics!.drawRevealVariables = [];
  delete d.mechanics!.roundLimitConfiguration;
  delete d.mechanics!.finishedPhase;
  delete d.mechanics!.drawLabel;
  d.mechanics!.minPlayers = 2;
  d.mechanics!.ballots[0]!.resolution = "select";
  const { run, ids } = setup(
    3,
    { "clue-rounds": 1 },
    gameDefinitionSchema.parse(d),
  );
  expect(run.play!.dealt).toBe(true);
  expect(run.play!.turns!.order).toEqual(ids);
  expect(() => act(run, "open-vote")).toThrow("ACTION_FORBIDDEN");
  const completed = completeClues(run);
  const r = act(votesFor(act(completed, "open-vote"), ids[0]!), "resolve");
  expect(r.play!.active).toEqual(ids);
  expect(r.play!.ballots.elimination!.selected).toBe(ids[0]);
  expect(r.play!.outcome).toBeUndefined();
  expect(projectGame(r, null).values).toEqual([]);
});

it("cannot reuse completed oral turns from a previous game round by editing the next phase", () => {
  const d = structuredClone(undercoverDefinition);
  const next = d.actions.find((a) => a.id === "next")!;
  next.operations = [{ type: "round.next", phase: "preparation" }];
  d.actions.find((a) => a.id === "open-vote")!.phases.push("preparation");
  const { run } = setup(
    6,
    { "undercover-count": 2 },
    gameDefinitionSchema.parse(d),
  );
  let r = act(run, "deal");
  const civil = r.play!.active.find((id) => r.assignments[id] === "civil")!;
  r = act(votesFor(openVote(r), civil), "resolve");
  r = act(r, "next");
  expect(r.phase).toBe("preparation");
  expect(r.play!.round).toBe(2);
  expect(() => act(r, "open-vote")).toThrow("ACTION_FORBIDDEN");
});
