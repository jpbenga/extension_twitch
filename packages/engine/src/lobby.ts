import type { GameId } from "@extension-twitch/contracts";
import type {
  LobbyAction,
  LobbyEvent,
  PublicSessionView,
} from "@extension-twitch/contracts/sessions";

export class SessionError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}
export type SessionActor =
  { role: "gm" } | { role: "player"; participantId: string };
export interface LobbyState {
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
    case "session.rename":
      return recordEvent(
        { ...state, title: action.title },
        action.type,
        "Le GM a renommé la session.",
        context.at,
      );
    case "session.admission":
      return recordEvent(
        { ...state, admissionOpen: action.open },
        action.type,
        `Le GM a ${action.open ? "ouvert" : "fermé"} les invitations.`,
        context.at,
      );
    case "participant.remove": {
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
    case "session.reset":
      return recordEvent(
        {
          ...state,
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

// Construct fields explicitly: spreading authoritative state here would leak access data.
export function projectPublicSession(
  state: LobbyState,
  connected: ReadonlySet<string>,
): PublicSessionView {
  return {
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
