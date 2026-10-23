import { randomInt } from "node:crypto";
import type {
  ActionDefinition,
  GameDefinition,
  GameProjection,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import type { GameRun } from "./configurable.js";
import { SessionError, type SessionActor } from "./session-types.js";
export interface BallotState {
  status: "open" | "resolved";
  eligible: string[];
  votes: Record<string, string>;
  tallies: { participantId: string; count: number }[];
  tied: boolean;
  eliminated?: string;
  selected?: string;
}
export interface PlayState {
  round: number;
  dealt: boolean;
  active: string[];
  revealedRoles: string[];
  ballots: Record<string, BallotState>;
  currentBallot?: string;
  outcome?: { id: string; label: string };
}
function fail(code: string, status = 409): never {
  throw new SessionError(code, status);
}
export function initializePlay(
  d: GameDefinition,
  configuration: Record<string, Scalar>,
  ids: string[],
): PlayState | undefined {
  const m = d.mechanics;
  if (!m) return;
  if (
    ids.length < m.minPlayers ||
    ids.length > m.maxPlayers ||
    new Set(ids).size !== ids.length
  )
    fail("INVALID_PLAYER_COUNT", 400);
  for (const deal of m.deals) {
    const count = configuration[deal.minorityCountConfiguration],
      majority = configuration[deal.majorityValueConfiguration],
      minority = configuration[deal.minorityValueConfiguration];
    if (typeof count !== "number" || count < 1 || count * 2 >= ids.length)
      fail("INVALID_DISTRIBUTION", 400);
    if (
      typeof majority !== "string" ||
      typeof minority !== "string" ||
      !majority.trim() ||
      !minority.trim() ||
      majority.normalize("NFKC").trim().toLocaleLowerCase("fr") ===
        minority.normalize("NFKC").trim().toLocaleLowerCase("fr")
    )
      fail("INVALID_SECRET_VALUES", 400);
  }
  return {
    round: m.deals.length ? 0 : 1,
    dealt: m.deals.length === 0,
    active: [...ids],
    revealedRoles: [],
    ballots: {},
  };
}
export function operationsAllowed(
  run: GameRun,
  action: ActionDefinition,
  actor: SessionActor | null,
) {
  if (!run.definition.mechanics) return !action.operations?.length;
  const p = run.play;
  if (!p || p.outcome) return false;
  return (action.operations ?? []).every((op) => {
    if (op.type !== "ballot.cast" && actor?.role !== "gm") return false;
    if (op.type === "deal") return !p.dealt;
    if (op.type === "round.next")
      return (
        p.dealt &&
        !!p.currentBallot &&
        p.ballots[p.currentBallot]?.status === "resolved" &&
        p.round <
          Number(
            run.configuration[
              run.definition.mechanics!.roundLimitConfiguration ?? ""
            ] ?? 30,
          )
      );
    if (op.type === "ballot.open")
      return (
        p.dealt &&
        (!p.currentBallot || p.ballots[p.currentBallot]?.status === "resolved")
      );
    const b = p.ballots[op.ballot];
    if (op.type === "ballot.cast")
      return (
        actor?.role === "player" &&
        b?.status === "open" &&
        b.eligible.includes(actor.participantId) &&
        p.active.includes(actor.participantId) &&
        !Object.hasOwn(b.votes, actor.participantId)
      );
    return (
      b?.status === "open" &&
      b.eligible.every((id) => Object.hasOwn(b.votes, id))
    );
  });
}
function conclude(run: GameRun) {
  const p = run.play!,
    m = run.definition.mechanics!;
  const count = (role: string) =>
    p.active.filter((id) => run.assignments[id] === role).length;
  let reveal: string[] = [];
  for (const ending of m.endings) {
    const left = count(ending.leftRole),
      right =
        "role" in ending.right ? count(ending.right.role) : ending.right.count;
    const matches =
      ending.comparison === "eq"
        ? left === right
        : ending.comparison === "gte"
          ? left >= right
          : left <= right;
    if (matches) {
      p.outcome = { id: ending.id, label: ending.label };
      reveal = ending.revealVariables;
      break;
    }
  }
  if (
    !p.outcome &&
    m.roundLimitConfiguration &&
    p.round >= Number(run.configuration[m.roundLimitConfiguration])
  ) {
    p.outcome = { id: "round-limit", label: m.drawLabel! };
    reveal = m.drawRevealVariables;
  }
  if (p.outcome) {
    run.phase = m.finishedPhase!;
    p.revealedRoles = Object.keys(run.assignments);
    run.revealed = [...new Set([...run.revealed, ...reveal])];
  }
}
/** Mutates only the transaction's cloned GameRun. Never called on client state. */
export function applyOperations(
  run: GameRun,
  action: ActionDefinition,
  actor: SessionActor,
  parameters: Record<string, Scalar>,
  pick: (upper: number) => number = randomInt,
) {
  const p = run.play,
    m = run.definition.mechanics;
  if (!action.operations?.length) return;
  if (!p || !m) fail("INVALID_DEFINITION", 400);
  for (const op of action.operations) {
    if (op.type !== "ballot.cast" && actor.role !== "gm")
      fail("FORBIDDEN", 403);
    switch (op.type) {
      case "deal": {
        if (p.dealt) fail("ALREADY_DISTRIBUTED");
        const deal = m.deals.find((d) => d.id === op.deal)!;
        const ids = Object.keys(run.assignments);
        for (let i = ids.length - 1; i > 0; i--) {
          const j = pick(i + 1);
          if (!Number.isInteger(j) || j < 0 || j > i)
            fail("INVALID_RANDOM_SOURCE", 500);
          [ids[i], ids[j]] = [ids[j]!, ids[i]!];
        }
        const minority = new Set(
          ids.slice(
            0,
            Number(run.configuration[deal.minorityCountConfiguration]),
          ),
        );
        for (const id of ids) {
          const special = minority.has(id);
          run.assignments[id] = special ? deal.minorityRole : deal.majorityRole;
          run.participantValues[id]![deal.privateVariable] =
            run.configuration[
              special
                ? deal.minorityValueConfiguration
                : deal.majorityValueConfiguration
            ]!;
        }
        p.dealt = true;
        p.round = 1;
        break;
      }
      case "ballot.open": {
        p.ballots[op.ballot] = {
          status: "open",
          eligible: [...p.active],
          votes: {},
          tallies: [],
          tied: false,
        };
        p.currentBallot = op.ballot;
        break;
      }
      case "ballot.cast": {
        if (actor.role !== "player") fail("FORBIDDEN", 403);
        const ballot = p.ballots[op.ballot]!,
          spec = m.ballots.find((b) => b.id === op.ballot)!;
        const target = parameters[op.targetParameter];
        if (
          typeof target !== "string" ||
          !p.active.includes(target) ||
          (!spec.allowSelfVote && target === actor.participantId)
        )
          fail("INVALID_VOTE_TARGET", 400);
        if (Object.hasOwn(ballot.votes, actor.participantId))
          fail("ALREADY_VOTED");
        ballot.votes[actor.participantId] = target;
        break;
      }
      case "ballot.resolve": {
        const ballot = p.ballots[op.ballot]!,
          spec = m.ballots.find((b) => b.id === op.ballot)!;
        if (!ballot.eligible.every((id) => Object.hasOwn(ballot.votes, id)))
          fail("VOTES_INCOMPLETE");
        ballot.tallies = p.active.map((participantId) => ({
          participantId,
          count: Object.values(ballot.votes).filter(
            (id) => id === participantId,
          ).length,
        }));
        const best = Math.max(...ballot.tallies.map((t) => t.count));
        const leaders = ballot.tallies.filter((t) => t.count === best);
        ballot.tied = leaders.length !== 1;
        if (!ballot.tied) {
          ballot.selected = leaders[0]!.participantId;
          if (spec.resolution === "eliminate") {
            ballot.eliminated = ballot.selected;
            p.active = p.active.filter((id) => id !== ballot.eliminated);
            if (spec.revealEliminatedRole)
              p.revealedRoles.push(ballot.eliminated);
          }
        }
        ballot.status = "resolved";
        run.phase = spec.resultPhase;
        conclude(run);
        break;
      }
      case "round.next":
        p.round++;
        delete p.currentBallot;
        run.phase = op.phase;
        break;
    }
  }
}
export function projectPlay(
  run: GameRun,
  actor: SessionActor | null,
): NonNullable<GameProjection["play"]> | undefined {
  const p = run.play,
    m = run.definition.mechanics;
  if (!p || !m) return;
  const b = p.currentBallot ? p.ballots[p.currentBallot] : undefined;
  const spec = m.ballots.find((b) => b.id === p.currentBallot);
  const me = actor?.role === "player" ? actor.participantId : undefined;
  return {
    round: p.round,
    dealt: p.dealt,
    roster: Object.keys(run.assignments).map((id) => ({
      id,
      active: p.active.includes(id),
      ...(p.revealedRoles.includes(id)
        ? {
            role: run.definition.roles.find(
              (r) => r.id === run.assignments[id],
            )!.label,
          }
        : {}),
    })),
    ...(b && spec
      ? {
          ballot: {
            id: p.currentBallot!,
            status: b.status,
            eligible: [...b.eligible],
            voted: Object.keys(b.votes),
            candidates: p.active.filter(
              (id) => spec.allowSelfVote || id !== me,
            ),
            ...(me && b.votes[me] ? { myVote: b.votes[me] } : {}),
            tallies: b.status === "resolved" ? structuredClone(b.tallies) : [],
            tied: b.tied,
            ...(b.eliminated ? { eliminated: b.eliminated } : {}),
            ...(b.selected ? { selected: b.selected } : {}),
            complete: b.eligible.every((id) => Object.hasOwn(b.votes, id)),
            allowSelfVote: spec.allowSelfVote,
          },
        }
      : {}),
    ...(p.outcome ? { outcome: { ...p.outcome } } : {}),
  };
}
export function projectedParameters(
  run: GameRun,
  a: ActionDefinition,
  actor: SessionActor | null,
): GameProjection["actions"][number]["parameters"] {
  const cast = a.operations?.find((op) => op.type === "ballot.cast");
  return a.parameters.map((p) => ({
    ...structuredClone(p),
    ...(cast?.type === "ballot.cast" && p.id === cast.targetParameter
      ? {
          choices: run.play!.active.filter(
            (id) =>
              run.definition.mechanics!.ballots.find(
                (b) => b.id === cast.ballot,
              )!.allowSelfVote ||
              actor?.role !== "player" ||
              id !== actor.participantId,
          ),
        }
      : {}),
  }));
}
