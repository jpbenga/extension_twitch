import { describe, it, expect } from "vitest";
import {
  publicSessionSchema,
  type PublicSessionView,
} from "@extension-twitch/contracts/sessions";
import {
  nextPublicCue,
  publicCueDuration,
  publicEventsForRun,
} from "../apps/web/src/lib/public-cues.js";
const snapshot = (
  version: number,
  type = "session.created",
): PublicSessionView =>
  publicSessionSchema.parse({
    sessionId: "00000000-0000-4000-8000-000000000001",
    title: "Test",
    hostName: "GM",
    gameId: "undercover",
    phase: "lobby",
    version,
    audience: "public",
    admissionOpen: true,
    participants: [],
    events: [
      {
        version,
        at: "2026-10-27T12:00:00.000Z",
        type,
        message: `Événement public ${version}`,
      },
    ],
  });
describe("public broadcast animation cursor", () => {
  it("does not animate the initial public history, including a late opening", () =>
    expect(nextPublicCue(null, snapshot(18), 1).cue).toBeNull());
  it("animates a newly committed public event once", () => {
    const first = nextPublicCue(null, snapshot(1), 1);
    const next = nextPublicCue(first.cursor, snapshot(2), 1);
    expect(next.cue).toEqual({
      id: 2,
      message: "Événement public 2",
      kind: "event",
    });
    expect(nextPublicCue(next.cursor, snapshot(2), 1).cue).toBeNull();
  });
  it("never replays events after reconnecting even if several commands occurred offline", () => {
    const first = nextPublicCue(null, snapshot(1), 1);
    const next = nextPublicCue(first.cursor, snapshot(9), 2);
    expect(next.cue).toBeNull();
    expect(next.cursor.view.version).toBe(9);
    expect(nextPublicCue(next.cursor, snapshot(10), 2).cue?.id).toBe(10);
  });
  it("ignores presence-only and out-of-order snapshots without moving backwards", () => {
    const first = nextPublicCue(null, snapshot(4), 1);
    for (const version of [4, 3]) {
      const next = nextPublicCue(first.cursor, snapshot(version), 1);
      expect(next.cue).toBeNull();
      expect(next.cursor).toBe(first.cursor);
    }
  });
  it("uses only the latest new event instead of queuing a missed history", () => {
    const first = nextPublicCue(null, snapshot(1), 1);
    const view = snapshot(5);
    view.events = [
      ...snapshot(3).events,
      ...snapshot(4).events,
      ...view.events,
    ];
    expect(nextPublicCue(first.cursor, view, 1).cue?.id).toBe(5);
  });
  it("does not invent an animation when no event matches the snapshot version", () => {
    const first = nextPublicCue(null, snapshot(1), 1);
    const view = snapshot(3);
    view.events = snapshot(2).events;
    expect(nextPublicCue(first.cursor, view, 1).cue).toBeNull();
  });
  it("represents a real reset as a reset, without replaying a previous result", () => {
    const first = nextPublicCue(null, snapshot(20), 1);
    expect(
      nextPublicCue(first.cursor, snapshot(21, "game.restart"), 1).cue?.message,
    ).toBe("La partie a été réinitialisée.");
  });
});

it("starts the on-air public journal at replay without deleting server history", () => {
  const view = snapshot(10, "game.restart");
  view.events = [...snapshot(8).events, ...snapshot(9).events, ...view.events];
  expect(publicEventsForRun(view).map((event) => event.version)).toEqual([10]);
  expect(view.events).toHaveLength(3);
});
it("keeps the last three public events of the current run", () => {
  const view = snapshot(8);
  view.events = [
    ...snapshot(1, "game.configure").events,
    ...snapshot(4).events,
    ...snapshot(5).events,
    ...snapshot(7).events,
    ...view.events,
  ];
  expect(publicEventsForRun(view).map((event) => event.version)).toEqual([
    5, 7, 8,
  ]);
});

it("publishes a live TV content moment only once and never replays it on reconnect", () => {
  const first = nextPublicCue(null, snapshot(1), 1);
  const view = snapshot(2, "undercover.publish");
  view.undercoverBroadcast = {
    mode: "duo",
    revision: 1,
    page: 0,
    transition: false,
    contents: [
      { id: "00000000-0000-4000-8000-000000000002", label: "Phare" },
      { id: "00000000-0000-4000-8000-000000000003", label: "Balise" },
    ],
  };
  const next = nextPublicCue(first.cursor, view, 1);
  expect(next.cue?.kind).toBe("content");
  expect(publicCueDuration(next.cue!, true)).toBe(8000);
  expect(publicCueDuration(next.cue!, false)).toBe(2600);
  expect(nextPublicCue(next.cursor, view, 1).cue).toBeNull();
  expect(nextPublicCue(next.cursor, view, 2).cue).toBeNull();
  expect(nextPublicCue(null, view, 1).cue).toBeNull();
});
it("keeps a next preparation transition separate from disclosure and preserves historical timing", () => {
  const first = nextPublicCue(null, snapshot(1), 1);
  const view = snapshot(2, "undercover.next");
  view.undercoverBroadcast = {
    mode: "none",
    revision: 0,
    page: 0,
    transition: true,
  };
  const next = nextPublicCue(first.cursor, view, 1).cue!;
  expect(next.kind).toBe("next");
  expect(next.message).toBe("La prochaine partie attend le Game Master.");
  expect(publicCueDuration(next, true)).toBe(5000);
  expect(publicCueDuration({ ...next, kind: "result" }, true)).toBe(9000);
  expect(publicCueDuration({ ...next, kind: "result" }, false)).toBe(2600);
  expect(view.undercoverBroadcast).not.toHaveProperty("contents");
});
it("does not animate a hidden publication as if it had revealed content", () => {
  const first = nextPublicCue(null, snapshot(1), 1);
  const view = snapshot(2, "undercover.publish");
  view.undercoverBroadcast = {
    mode: "none",
    revision: 2,
    page: 0,
    transition: false,
  };
  const cue = nextPublicCue(first.cursor, view, 1).cue!;
  expect(cue.kind).toBe("event");
  expect(cue.message).toContain("retirés");
});
