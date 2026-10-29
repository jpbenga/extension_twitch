import type { PublicSessionView } from "@extension-twitch/contracts/sessions";
export interface PublicCursor {
  epoch: number;
  view: PublicSessionView;
}
export interface PublicCue {
  id: number;
  stage?: "exit";
  message: string;
  kind: "phase" | "vote" | "result" | "event" | "content" | "next";
}
/** A new connection establishes a baseline. Never play its history or presence-only snapshots. */
export function nextPublicCue(
  previous: PublicCursor | null,
  view: PublicSessionView,
  epoch: number,
): { cursor: PublicCursor; cue: PublicCue | null } {
  const cursor = { epoch, view };
  if (!previous || previous.epoch !== epoch) return { cursor, cue: null };
  if (view.version <= previous.view.version)
    return { cursor: previous, cue: null };
  const event = view.events.find((e) => e.version === view.version);
  if (!event) return { cursor, cue: null };
  const before = previous.view.publicGame,
    after = view.publicGame;
  const play = after?.play;
  let message = event.message,
    kind: PublicCue["kind"] = "event";
  if (event.type === "undercover.next") {
    message = "La prochaine manche attend le Game Master.";
    kind = "next";
  } else if (event.type === "undercover.publish") {
    message =
      view.undercoverBroadcast?.mode === "none"
        ? "Les contenus ont été retirés du plateau."
        : "Les contenus autorisés sont affichés.";
    kind = view.undercoverBroadcast?.mode === "none" ? "event" : "content";
  } else if (event.type === "game.restart" || event.type === "session.reset")
    message = "La partie a été réinitialisée.";
  else if (play?.outcome && !before?.play?.outcome) {
    message = play.outcome.label;
    kind = "result";
  } else if (
    play?.ballot?.status === "resolved" &&
    before?.play?.ballot?.status === "open"
  ) {
    message = play.ballot.tied
      ? "Égalité : personne n’est éliminé."
      : "Le résultat du vote est révélé.";
    kind = "result";
  } else if (after?.phase.id !== before?.phase.id && after) {
    message = after.phase.label;
    kind = "phase";
  } else if (
    play?.ballot?.status === "open" &&
    play.ballot.voted.length > (before?.play?.ballot?.voted.length ?? 0)
  ) {
    message = "Un vote a été enregistré.";
    kind = "vote";
  }
  return { cursor, cue: { id: view.version, message, kind } };
}

/** Keep the server journal intact, but show only the current preparation/run on air. */
export function publicEventsForRun(view: PublicSessionView) {
  const boundary =
    [...view.events]
      .reverse()
      .find((event) =>
        [
          "game.configure",
          "game.restart",
          "session.reset",
          "undercover.next",
        ].includes(event.type),
      )?.version ?? 0;
  return view.events.filter((event) => event.version >= boundary).slice(-3);
}

/** Longer lower thirds belong only to opt-in TV layouts, not archived overlays. */
export function publicCueDuration(cue: PublicCue, tv = false, final = false) {
  if (!tv) return 2600;
  return cue.kind === "content"
    ? 2600
    : cue.kind === "result"
      ? final
        ? 2800
        : 2400
      : cue.kind === "next"
        ? 2200
        : 2600;
}
