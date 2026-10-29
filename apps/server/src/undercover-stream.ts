import { randomUUID } from "node:crypto";
import {
  createGameRun,
  recordEvent,
  SessionError,
  type LobbyState,
  type SessionActor,
} from "@extension-twitch/engine";
import type { LobbyAction } from "@extension-twitch/contracts/sessions";
import type { UndercoverSettings } from "@extension-twitch/contracts/official-games";
import type {
  UndercoverPreparationRef,
  UndercoverStreamState,
  UndercoverContent,
  UndercoverBroadcast,
} from "@extension-twitch/contracts/undercover-stream";
import type { TemporaryMediaRelay } from "./temporary-media.js";

export function makeUndercoverStream(
  preparation: UndercoverPreparationRef,
  settings: UndercoverSettings,
): UndercoverStreamState {
  return {
    preparation: structuredClone(preparation),
    contents: {
      a: { id: randomUUID(), label: settings["civil-word"] },
      b: { id: randomUUID(), label: settings["undercover-word"] },
    },
    publication: "none",
    page: 0,
    revision: 0,
    transition: false,
  };
}
export function decideUndercoverStream(
  state: LobbyState,
  actor: SessionActor,
  action: Extract<
    LobbyAction,
    { type: "undercover.publish" | "undercover.next" }
  >,
  at: string,
): LobbyState {
  if (actor.role !== "gm") throw new SessionError("FORBIDDEN", 403);
  const stream = state.undercoverStream,
    run = state.gameRun;
  if (!stream || state.gameId !== "undercover")
    throw new SessionError("NO_PREPARATION", 409);
  if (action.type === "undercover.publish") {
    if (
      action.mode !== "none" &&
      (!run?.play?.dealt ||
        (run.play.outcome &&
          !(action.mode === "assignments" && action.page !== undefined)))
    )
      throw new SessionError("WRONG_PHASE", 409);
    const current = run?.play?.turns?.order[run.play.turns.index];
    const page =
      action.page ??
      Math.floor(
        Math.max(
          0,
          state.participants.findIndex((p) => p.id === current),
        ) / 3,
      );
    if (page >= Math.max(1, Math.ceil(state.participants.length / 3)))
      throw new SessionError("INVALID_PAGE", 400);
    return recordEvent(
      {
        ...state,
        undercoverStream: {
          ...stream,
          publication: action.mode,
          page,
          revision: stream.revision + 1,
          transition: false,
        },
      },
      action.type,
      action.mode === "none"
        ? "Le GM a retiré les contenus du plateau."
        : action.mode === "duo"
          ? "Le GM a montré les deux contenus sans affectation."
          : "Le GM a publié les affectations sur le plateau.",
      at,
    );
  }
  if (!run?.play?.outcome) throw new SessionError("PARTY_NOT_FINISHED", 409);
  if (
    action.preparation.series.id !== stream.preparation.series.id ||
    action.preparation.id === stream.preparation.id ||
    action.preparation.series.position !==
      stream.preparation.series.position + 1
  )
    throw new SessionError("INVALID_SERIES_ORDER", 409);
  const gameRun = createGameRun(
    run.definition,
    action.settings,
    run.assets,
    state.participants.map((p) => p.id),
    randomUUID(),
  );
  const next = makeUndercoverStream(action.preparation, action.settings);
  next.transition = true;
  next.revision = stream.revision + 1;
  return recordEvent(
    {
      ...state,
      gameRun,
      admissionOpen: false,
      undercoverStream: next,
      ...(action.overlayLayout ? { overlayLayout: action.overlayLayout } : {}),
      ...(action.broadcastTheme
        ? { broadcastTheme: action.broadcastTheme }
        : {}),
    },
    action.type,
    "Le GM a préparé la partie suivante. La distribution reste à lancer.",
    at,
  );
}
export function projectUndercoverStream(
  state: LobbyState,
  media: TemporaryMediaRelay,
) {
  const stream = state.undercoverStream;
  if (!stream) return {};
  const content = (value: { id: string; label: string }): UndercoverContent => {
    const image = media.get(state.id, value.id);
    return {
      ...value,
      ...(image
        ? {
            image: {
              id: value.id,
              url: `/api/server/sessions/${state.id}/media/${value.id}?v=${image.digest}`,
            },
          }
        : {}),
    };
  };
  const contents = {
    a: content(stream.contents.a),
    b: content(stream.contents.b),
  };
  const common = {
    revision: stream.revision,
    page: stream.page,
    transition: stream.transition,
  };
  const play = state.gameRun?.play;
  let publicView: UndercoverBroadcast = { mode: "none", ...common };
  if (play?.dealt && (stream.publication !== "none" || play.outcome)) {
    // Random opaque IDs define order. A/B and majority/minority never enter a duo payload.
    const pair = [contents.a, contents.b].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    if (!play.outcome && stream.publication === "duo")
      publicView = { mode: "duo", ...common, contents: pair };
    else
      publicView = {
        mode: play.outcome ? "final" : "assignments",
        ...common,
        contents: pair,
        assignments: state.participants.flatMap((p, index) => {
          const word = state.gameRun?.participantValues[p.id]?.["secret-word"];
          const assigned = pair.find((c) => c.label === word);
          return assigned
            ? [{ participantId: p.id, contentId: assigned.id, slot: index + 1 }]
            : [];
        }),
      };
  }
  return {
    publicView,
    gmView: {
      ...stream.preparation,
      contents,
      publication: stream.publication,
      page: stream.page,
    },
  };
}
export function personalUndercoverContent(
  state: LobbyState,
  actor: SessionActor,
  media: TemporaryMediaRelay,
) {
  if (actor.role !== "player" || !state.gameRun?.play?.dealt) return;
  const word =
    state.gameRun.participantValues[actor.participantId]?.["secret-word"];
  const views = projectUndercoverStream(state, media);
  return (
    views.gmView &&
    Object.values(views.gmView.contents).find((c) => c.label === word)
  );
}
export function authorizeMedia(
  state: LobbyState,
  actor: SessionActor | null,
  id: string,
) {
  const stream = state.undercoverStream;
  const content =
    stream && Object.values(stream.contents).find((c) => c.id === id);
  if (!content) throw new SessionError("MEDIA_NOT_FOUND", 404);
  if (actor?.role === "gm") return;
  const play = state.gameRun?.play;
  if (
    actor?.role === "player" &&
    play?.dealt &&
    state.gameRun?.participantValues[actor.participantId]?.["secret-word"] ===
      content.label
  )
    return;
  if (play?.dealt && (stream.publication !== "none" || play.outcome)) return;
  throw new SessionError("FORBIDDEN", 403);
}
