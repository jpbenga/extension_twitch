import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleBroadcastMoment } from "../apps/web/src/lib/broadcast-motion.js";
import {
  publicCueDuration,
  type PublicCue,
} from "../apps/web/src/lib/public-cues.js";
import {
  newSeries,
  copyPreparation,
  newPreparation,
  seriesLibrarySchema,
  newLibrary,
} from "../apps/web/src/lib/undercover-series.js";
import {
  createUndercoverLayout,
  createUndercoverTvLayout,
} from "@extension-twitch/contracts/undercover-layout";
import {
  makeSeriesAttempt,
  seriesAttemptSchema,
} from "../apps/web/src/lib/undercover-series-launch.js";
import { undercoverPreparationRefSchema } from "@extension-twitch/contracts/undercover-stream";

afterEach(() => vi.useRealTimers());
describe("approved TV moment lifecycle", () => {
  it("separates the hold from the exit and then restores durable state", () => {
    vi.useFakeTimers();
    const changes: (PublicCue | null)[] = [];
    const cue: PublicCue = {
      id: 5,
      kind: "content",
      message: "Contenus autorisés",
    };
    scheduleBroadcastMoment(cue, publicCueDuration(cue, true), 180, (c) =>
      changes.push(c),
    );
    vi.advanceTimersByTime(2599);
    expect(changes).toEqual([cue]);
    vi.advanceTimersByTime(1);
    expect(changes.at(-1)?.stage).toBe("exit");
    vi.advanceTimersByTime(180);
    expect(changes.at(-1)).toBeNull();
  });
  it("cancels an interrupted duo and never lets its obsolete timer replace a vote", () => {
    vi.useFakeTimers();
    let current: PublicCue | null = null;
    const cancel = scheduleBroadcastMoment(
      { id: 2, kind: "content", message: "Duo" },
      2600,
      180,
      (c) => (current = c),
    );
    vi.advanceTimersByTime(500);
    cancel();
    const vote: PublicCue = { id: 3, kind: "vote", message: "Vote" };
    scheduleBroadcastMoment(vote, 5000, 180, (c) => (current = c));
    vi.advanceTimersByTime(2600);
    expect(current).toEqual(vote);
  });
  it("clears pending callbacks on disconnect and uses a 100ms reduced exit", () => {
    vi.useFakeTimers();
    const changes: (PublicCue | null)[] = [];
    const cancel = scheduleBroadcastMoment(
      { id: 4, kind: "result", message: "Résultat" },
      2800,
      100,
      (c) => changes.push(c),
    );
    vi.advanceTimersByTime(2800);
    expect(changes.at(-1)?.stage).toBe("exit");
    cancel();
    const before = changes.length;
    vi.runAllTimers();
    expect(changes).toHaveLength(before);
  });
});
describe("non-destructive preparation presentation", () => {
  it("reads historical series without renaming their title, identifiers or engine cycle settings", () => {
    const old = newLibrary();
    old.series[0]!.title = "Ma série historique";
    old.series[0]!.draft.settings["round-limit"] = 7;
    const loaded = seriesLibrarySchema.parse(old);
    expect(loaded.version).toBe(1);
    expect(loaded.series[0]!.id).toBe(old.series[0]!.id);
    expect(loaded.series[0]!.title).toBe("Ma série historique");
    expect(loaded.series[0]!.draft.settings["round-limit"]).toBe(7);
    expect(newSeries().title).toBe("Ma partie Undercover");
  });
  it("copies the saved legacy layout independently while TV adoption remains explicit", () => {
    const p = newPreparation();
    p.previousOverlayLayout = createUndercoverLayout();
    p.previousOverlayLayout.widgets.header.x = 64;
    p.overlayLayout = createUndercoverTvLayout();
    p.preferredPublication = "assignments";
    const copy = copyPreparation(p);
    copy.previousOverlayLayout!.widgets.header.x = 99;
    expect(p.previousOverlayLayout.widgets.header.x).toBe(64);
    expect(copy.preferredPublication).toBe("assignments");
    expect(copy.id).not.toBe(p.id);
  });
  it("freezes the public-mode preference as GM metadata without publishing it or changing command identity on reload", () => {
    const series = newSeries(),
      p = newPreparation();
    p.preferredPublication = "assignments";
    series.preparations.push(p);
    const attempt = makeSeriesAttempt(series, p, 0, "a".repeat(43));
    const resumed = seriesAttemptSchema.parse(
      JSON.parse(JSON.stringify(attempt)),
    );
    expect(resumed.requestId).toBe(attempt.requestId);
    expect(resumed.preparation?.preferredPublication).toBe("assignments");
    expect(
      undercoverPreparationRefSchema.parse(resumed.preparation)
        .preferredPublication,
    ).toBe("assignments");
  });
});
