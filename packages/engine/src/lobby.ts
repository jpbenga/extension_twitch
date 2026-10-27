import type { ThemeId } from "@extension-twitch/contracts/themes";
import {
  undercoverLayoutSchema,
  type UndercoverLayout,
} from "@extension-twitch/contracts/undercover-layout";
import { randomUUID } from "node:crypto";
import {
  createGameRun,
  executeGameAction,
  assignGameRole,
  projectGame,
  type GameRun,
} from "./configurable.js";
import type {
  AssetBinding,
  GameDefinition,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import type { GameId } from "@extension-twitch/contracts";
import type {
  LobbyAction,
  LobbyEvent,
  PublicSessionView,
} from "@extension-twitch/contracts/sessions";

import { SessionError, type SessionActor } from "./session-types.js";
export { SessionError, type SessionActor } from "./session-types.js";
export interface PreparedGame {
  broadcastTheme?: ThemeId;
  overlayLayout?: UndercoverLayout;
  /** Pinned product settings; absent on historical Studio snapshots. */
  configuration?: Record<string, Scalar>;
  definition: GameDefinition;
  assets: AssetBinding[];
}
export interface LobbyState {
  broadcastTheme?: ThemeId;
  overlayLayout?: UndercoverLayout;
  preparedGame?: PreparedGame;
  gameRun?: GameRun;
  id: string;
  title: string;
  hostName: string;
  gameId: GameId;
  phase: "lobby";
  version: number;
  invitationCode: string;
  admissionOpen: boolean;
  participants: { id: string; name: string; ready: boolean }[];
  events: LobbyEvent[];
}

export function recordEvent(
  state: LobbyState,
  type: LobbyEvent["type"],
  message: string,
  at: string,
): LobbyState {
  const version = state.version + 1;
  return {
    ...state,
    version,
    events: [...state.events, { version, type, message, at }].slice(-20),
  };
}

export function addParticipant(
  state: LobbyState,
  id: string,
  name: string,
  at: string,
): LobbyState {
  if (state.phase !== "lobby") throw new SessionError("WRONG_PHASE", 409);
  if (state.gameRun) throw new SessionError("GAME_RUNNING", 409);
  if (!state.admissionOpen) throw new SessionError("ADMISSION_CLOSED", 409);
  if (state.participants.length >= 32)
    throw new SessionError("LOBBY_FULL", 409);
  const normalized = (value: string) =>
    value.normalize("NFKC").toLocaleLowerCase("fr");
  if (
    state.participants.some(
      (player) => normalized(player.name) === normalized(name),
    )
  )
    throw new SessionError("NAME_TAKEN", 409);
  return recordEvent(
    {
      ...state,
      participants: [...state.participants, { id, name, ready: false }],
    },
    "participant.joined",
    `${name} a rejoint le plateau.`,
    at,
  );
}

export function decideLobby(
  state: LobbyState,
  actor: SessionActor,
  action: LobbyAction,
  context: { at: string; nextInvitationCode: string },
): LobbyState {
  if (state.phase !== "lobby") throw new SessionError("WRONG_PHASE", 409);
  if (action.type === "game.player-action") {
    if (actor.role !== "gm") throw new SessionError("FORBIDDEN", 403);
    const run = state.gameRun;
    if (!run) throw new SessionError("NO_GAME", 409);
    const operation = run.definition.actions
      .find((a) => a.id === action.actionId)
      ?.operations?.find((op) => op.type === "ballot.cast");
    if (
      operation?.type !== "ballot.cast" ||
      !run.definition.mechanics?.ballots.find((b) => b.id === operation.ballot)
        ?.allowGmProxy
    )
      throw new SessionError("ACTION_FORBIDDEN", 403);
    return recordEvent(
      {
        ...state,
        gameRun: executeGameAction(
          run,
          { role: "player", participantId: action.participantId },
          action,
        ),
      },
      "game.action",
      "Le GM a enregistré un vote pour un joueur sans interface.",
      context.at,
    );
  }
  if (action.type === "game.action") {
    if (!state.gameRun) throw new SessionError("NO_GAME", 409);
    const nextRun = executeGameAction(state.gameRun, actor, action);
    const operation = state.gameRun.definition.actions.find(
      (a) => a.id === action.actionId,
    )!.operations?.[0]?.type;
    const name =
      actor.role === "gm"
        ? "Le GM"
        : (state.participants.find((p) => p.id === actor.participantId)?.name ??
          "Un joueur");
    const notice = nextRun.play?.outcome
      ? nextRun.play.outcome.label
      : nextRun.play?.currentBallot &&
          nextRun.play.ballots[nextRun.play.currentBallot]?.status === "open" &&
          nextRun.play.ballots[nextRun.play.currentBallot]!.eligible.every(
            (id) =>
              Object.hasOwn(
                nextRun.play!.ballots[nextRun.play!.currentBallot!]!.votes,
                id,
              ),
          )
        ? "Tous les joueurs actifs ont voté."
        : operation === "deal"
          ? "Le GM a distribué les informations privées et démarré la partie."
          : operation === "turn.advance"
            ? "Le GM a confirmé un passage de parole."
            : operation === "ballot.open"
              ? "Le GM a ouvert les votes."
              : operation === "ballot.cast"
                ? `${name} a voté.`
                : operation === "ballot.resolve"
                  ? "Le GM a révélé le résultat du vote."
                  : operation === "round.next"
                    ? "Le GM a commencé la manche suivante."
                    : `${name} a effectué une action.`;
    return recordEvent(
      { ...state, gameRun: nextRun },
      action.type,
      state.gameRun.definition.mechanics
        ? notice
        : "Une action de jeu a été acceptée.",
      context.at,
    );
  }
  if (action.type === "participant.ready") {
    if (actor.role !== "player") throw new SessionError("FORBIDDEN", 403);
    const player = state.participants.find(
      (item) => item.id === actor.participantId,
    );
    if (!player) throw new SessionError("ACCESS_REVOKED", 403);
    return recordEvent(
      {
        ...state,
        participants: state.participants.map((item) =>
          item.id === player.id ? { ...item, ready: action.ready } : item,
        ),
      },
      action.type,
      `${player.name} ${action.ready ? "est prêt" : "n’est plus prêt"}.`,
      context.at,
    );
  }
  if (actor.role !== "gm") throw new SessionError("FORBIDDEN", 403);
  switch (action.type) {
    case "game.use-prepared": {
      if (!state.preparedGame) throw new SessionError("NO_GAME", 409);
      if (
        state.preparedGame.configuration &&
        action.configuration &&
        Object.entries(action.configuration).some(
          ([key, value]) => state.preparedGame!.configuration![key] !== value,
        )
      )
        throw new SessionError("INVALID_CONFIGURATION", 400);
      return decideLobby(
        state,
        actor,
        {
          type: "game.configure",
          definition: state.preparedGame.definition,
          assets: state.preparedGame.assets,
          configuration:
            state.preparedGame.configuration ?? action.configuration ?? {},
        },
        context,
      );
    }
    case "game.configure": {
      if (state.gameRun) throw new SessionError("GAME_RUNNING", 409);
      const gameRun = createGameRun(
        action.definition,
        action.configuration,
        action.assets,
        state.participants.map((p) => p.id),
        randomUUID(),
      );
      const { preparedGame: _prepared, ...base } = state;
      return recordEvent(
        {
          ...base,
          admissionOpen: false,
          gameId: gameRun.definition.id,
          gameRun,
        },
        action.type,
        "Le GM a installé une définition de jeu.",
        context.at,
      );
    }
    case "game.assign-role": {
      if (!state.gameRun) throw new SessionError("NO_GAME", 409);
      return recordEvent(
        {
          ...state,
          gameRun: assignGameRole(
            state.gameRun,
            actor,
            action.participantId,
            action.roleId,
          ),
        },
        action.type,
        "Le GM a modifié une affectation de rôle.",
        context.at,
      );
    }
    case "game.restart": {
      const run = state.gameRun;
      if (!run) throw new SessionError("NO_GAME", 409);
      if (run.runId !== action.runId) throw new SessionError("STALE_GAME", 409);
      return recordEvent(
        {
          ...state,
          gameRun: createGameRun(
            run.definition,
            run.configuration,
            run.assets,
            state.participants.map((p) => p.id),
            randomUUID(),
          ),
        },
        action.type,
        "Le GM a relancé la partie avec la même définition.",
        context.at,
      );
    }
    case "overlay.configure": {
      if (state.gameId !== "undercover")
        throw new SessionError("INVALID_CONFIGURATION", 400);
      return recordEvent(
        {
          ...state,
          overlayLayout: undercoverLayoutSchema.parse(action.layout),
        },
        action.type,
        "Le GM a enregistré la disposition du plateau.",
        context.at,
      );
    }
    case "session.rename":
      return recordEvent(
        { ...state, title: action.title },
        action.type,
        "Le GM a renommé la session.",
        context.at,
      );
    case "session.admission":
      if (state.gameRun && action.open)
        throw new SessionError("GAME_RUNNING", 409);
      return recordEvent(
        { ...state, admissionOpen: action.open },
        action.type,
        `Le GM a ${action.open ? "ouvert" : "fermé"} les invitations.`,
        context.at,
      );
    case "participant.remove": {
      if (state.gameRun) throw new SessionError("GAME_RUNNING", 409);
      const player = state.participants.find(
        (item) => item.id === action.participantId,
      );
      if (!player) throw new SessionError("PLAYER_NOT_FOUND", 404);
      return recordEvent(
        {
          ...state,
          participants: state.participants.filter(
            (item) => item.id !== player.id,
          ),
        },
        action.type,
        `${player.name} a été retiré du plateau.`,
        context.at,
      );
    }
    case "session.reset": {
      const {
        gameRun: _removed,
        preparedGame: _prepared,
        ...withoutGame
      } = state;
      return recordEvent(
        {
          ...withoutGame,
          participants: [],
          admissionOpen: true,
          invitationCode: context.nextInvitationCode,
        },
        action.type,
        "Le GM a réinitialisé le salon et renouvelé l’invitation.",
        context.at,
      );
    }
  }
}

// Construct fields explicitly: spreading authoritative state here would leak access data.
export function projectPublicSession(
  state: LobbyState,
  connected: ReadonlySet<string>,
): PublicSessionView {
  return {
    ...(state.gameRun ? { publicGame: projectGame(state.gameRun, null) } : {}),
    ...(state.overlayLayout ? { overlayLayout: state.overlayLayout } : {}),
    ...(state.broadcastTheme ? { broadcastTheme: state.broadcastTheme } : {}),
    audience: "public",
    sessionId: state.id,
    title: state.title,
    hostName: state.hostName,
    gameId: state.gameId,
    phase: state.phase,
    version: state.version,
    admissionOpen: state.admissionOpen,
    participants: state.participants.map(({ id, name, ready }) => ({
      id,
      name,
      ready,
      connected: connected.has(id),
    })),
    events: state.events.map(({ version, at, type, message }) => ({
      version,
      at,
      type,
      message,
    })),
  };
}
