import {
  acceptsValue,
  gameDefinitionSchema,
  assetBindingSchema,
  scalarRecordSchema,
  type GameDefinition,
  type Scalar,
  type AssetBinding,
  type GameProjection,
  type ActionDefinition,
} from "@extension-twitch/contracts/game-definition";
import { SessionError, type SessionActor } from "./session-types.js";

export interface GameRun {
  stateVersion: 1;
  runId: string;
  definition: GameDefinition;
  configuration: Record<string, Scalar>;
  assets: AssetBinding[];
  phase: string;
  assignments: Record<string, string>;
  sessionValues: Record<string, Scalar>;
  participantValues: Record<string, Record<string, Scalar>>;
  revealed: string[];
}
const reject = (code: string, status = 400): never => {
  throw new SessionError(code, status);
};
export function createGameRun(
  definition: GameDefinition,
  configuration: Record<string, Scalar>,
  assets: AssetBinding[],
  participantIds: string[],
  runId: string,
): GameRun {
  const parsed = gameDefinitionSchema.safeParse(definition);
  if (!parsed.success || !scalarRecordSchema.safeParse(configuration).success)
    return reject("INVALID_DEFINITION");
  const d = parsed.data;
  if (
    Object.keys(configuration).some(
      (id) => !d.configuration.some((f) => f.id === id),
    )
  )
    return reject("INVALID_CONFIGURATION");
  const config: Record<string, Scalar> = {};
  for (const field of d.configuration) {
    const value = configuration[field.id] ?? field.value.initial;
    if (!acceptsValue(field.value, value))
      return reject("INVALID_CONFIGURATION");
    config[field.id] = value;
  }
  if (
    assets.length > 4 ||
    new Set(assets.map((a) => a.assetId)).size !== assets.length
  )
    return reject("INVALID_ASSET");
  for (const asset of assets) {
    const slot = d.assets.find((a) => a.id === asset.assetId);
    if (
      !assetBindingSchema.safeParse(asset).success ||
      !slot ||
      (asset.mime && !asset.mime.startsWith(`${slot.kind}/`)) ||
      (asset.access === "public" && slot.visibility !== "public")
    )
      return reject("INVALID_ASSET");
  }
  const initial = (scope: "session" | "participant") =>
    Object.fromEntries(
      d.variables
        .filter((v) => v.scope === scope)
        .map((v) => [v.id, v.value.initial]),
    );
  return {
    stateVersion: 1,
    runId,
    definition: d,
    configuration: config,
    assets: structuredClone(assets),
    phase: d.initialPhase,
    assignments: Object.fromEntries(
      participantIds.map((id) => [id, d.defaultPlayerRole]),
    ),
    sessionValues: initial("session"),
    participantValues: Object.fromEntries(
      participantIds.map((id) => [id, initial("participant")]),
    ),
    revealed: [],
  };
}
function assertVersion(run: GameRun) {
  if (
    run.stateVersion !== 1 ||
    run.definition.schemaVersion !== 1 ||
    run.definition.engineVersion !== 1
  )
    reject("UNSUPPORTED_GAME_VERSION", 409);
}
function roleFor(run: GameRun, actor: SessionActor | null) {
  if (!actor)
    return run.definition.roles.find((r) => r.base === "spectator")?.id;
  if (actor.role === "gm")
    return run.definition.roles.find((r) => r.base === "gm")?.id;
  return run.assignments[actor.participantId];
}
function valueFor(
  run: GameRun,
  variableId: string,
  actor: SessionActor | null,
) {
  const variable = run.definition.variables.find((v) => v.id === variableId);
  if (variable?.scope === "session") return run.sessionValues[variableId];
  return actor?.role === "player"
    ? run.participantValues[actor.participantId]?.[variableId]
    : undefined;
}
function allowed(
  run: GameRun,
  action: ActionDefinition,
  actor: SessionActor | null,
) {
  const role = roleFor(run, actor);
  return (
    actor !== null &&
    role !== undefined &&
    action.roles.includes(role) &&
    action.phases.includes(run.phase) &&
    action.conditions.every(
      (c) => valueFor(run, c.variable, actor) === c.equals,
    )
  );
}
export function executeGameAction(
  run: GameRun,
  actor: SessionActor,
  input: {
    runId: string;
    actionId: string;
    parameters: Record<string, Scalar>;
  },
): GameRun {
  assertVersion(run);
  if (run.runId !== input.runId) return reject("STALE_GAME", 409);
  const action = run.definition.actions.find((a) => a.id === input.actionId);
  if (!action || !allowed(run, action, actor))
    return reject("ACTION_FORBIDDEN", 403);
  if (
    !scalarRecordSchema.safeParse(input.parameters).success ||
    Object.keys(input.parameters).length !== action.parameters.length ||
    action.parameters.some(
      (f) =>
        !Object.hasOwn(input.parameters, f.id) ||
        !acceptsValue(f.value, input.parameters[f.id]),
    )
  )
    return reject("INVALID_PARAMETERS");
  const next = structuredClone(run);
  for (const effect of action.effects) {
    if (effect.type === "reveal") {
      if (actor.role !== "gm") return reject("FORBIDDEN", 403);
      if (!next.revealed.includes(effect.variable))
        next.revealed.push(effect.variable);
      continue;
    }
    const variable = next.definition.variables.find(
      (v) => v.id === effect.variable,
    )!;
    const target =
      variable.scope === "session"
        ? next.sessionValues
        : actor.role === "player"
          ? next.participantValues[actor.participantId]
          : undefined;
    if (!target) return reject("ACCESS_REVOKED", 403);
    const value =
      effect.value.from === "literal"
        ? effect.value.value
        : effect.value.from === "parameter"
          ? input.parameters[effect.value.id]
          : next.configuration[effect.value.id];
    const current = target[variable.id];
    const updated =
      effect.type === "increment"
        ? typeof current === "number" && typeof value === "number"
          ? current + value
          : undefined
        : value;
    if (!acceptsValue(variable.value, updated))
      return reject("VALUE_OUT_OF_BOUNDS", 409);
    target[variable.id] = updated;
  }
  if (action.nextPhase) next.phase = action.nextPhase;
  return next;
}
export function assignGameRole(
  run: GameRun,
  actor: SessionActor,
  participantId: string,
  roleId: string,
): GameRun {
  assertVersion(run);
  if (actor.role !== "gm") return reject("FORBIDDEN", 403);
  if (
    !Object.hasOwn(run.assignments, participantId) ||
    !run.definition.roles.some((r) => r.id === roleId && r.base === "player")
  )
    return reject("INVALID_ROLE");
  return {
    ...run,
    assignments: { ...run.assignments, [participantId]: roleId },
  };
}
export function projectGame(
  run: GameRun,
  actor: SessionActor | null,
): GameProjection {
  assertVersion(run);
  const d = run.definition;
  const gm = actor?.role === "gm";
  const values: GameProjection["values"] = [];
  for (const v of d.variables) {
    const published = v.visibility === "public" || run.revealed.includes(v.id);
    if (v.scope === "session") {
      if (published || gm)
        values.push({
          id: v.id,
          label: v.label,
          value: run.sessionValues[v.id]!,
        });
    } else
      for (const [id, data] of Object.entries(run.participantValues)) {
        if (
          published ||
          gm ||
          (v.visibility === "owner" &&
            actor?.role === "player" &&
            actor.participantId === id)
        )
          values.push({
            id: v.id,
            label: v.label,
            participantId: id,
            value: data[v.id]!,
          });
      }
  }
  const role = roleFor(run, actor);
  return {
    runId: run.runId,
    definitionId: d.id,
    definitionVersion: d.version,
    title: d.title,
    phase: {
      id: run.phase,
      label: d.phases.find((p) => p.id === run.phase)!.label,
    },
    values,
    actions: d.actions
      .filter((a) => allowed(run, a, actor))
      .map((a) => ({
        id: a.id,
        label: a.label,
        confirmation: a.confirmation,
        parameters: structuredClone(a.parameters),
      })),
    assets: d.assets
      .filter(
        (a) =>
          a.visibility === "public" ||
          gm ||
          (a.visibility === "owner" && actor?.role === "player"),
      )
      .map((a) => ({
        id: a.id,
        kind: a.kind,
        fallback: a.fallback,
        availability:
          run.assets.find((b) => b.assetId === a.id)?.status === "disabled"
            ? "disabled"
            : run.assets.some((b) => b.assetId === a.id)
              ? "unavailable"
              : "unbound",
      })),
    ...(actor && role ? { role } : {}),
    ...(gm
      ? {
          management: {
            roles: d.roles
              .filter((r) => r.base === "player")
              .map(({ id, label }) => ({ id, label })),
            assignments: { ...run.assignments },
          },
        }
      : {}),
  };
}
