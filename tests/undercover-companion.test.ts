import { describe, expect, it } from "vitest";
import { supportsUndercoverCompanion } from "../apps/web/src/lib/undercover-companion.js";
describe("specialized companion keeps historical sessions on their actual game interface", () => {
  it("allows the official waiting room before installation", () => {
    expect(supportsUndercoverCompanion(undefined)).toBe(true);
  });
  it("requires a playable Undercover projection rather than a matching lobby gameId", () => {
    expect(
      supportsUndercoverCompanion({ definitionId: "collective-pulse" }),
    ).toBe(false);
    expect(supportsUndercoverCompanion({ definitionId: "undercover" })).toBe(
      false,
    );
  });
  it("keeps a different native game on its generic interface even if it has mechanics", () => {
    expect(
      supportsUndercoverCompanion({
        definitionId: "other-game",
        play: { round: 0, dealt: false, roster: [] },
      }),
    ).toBe(false);
  });
  it("supports both historical Undercover without structured turns and current Undercover", () => {
    expect(
      supportsUndercoverCompanion({
        definitionId: "undercover",
        play: { round: 0, dealt: false, roster: [] },
      }),
    ).toBe(true);
    expect(
      supportsUndercoverCompanion({
        definitionId: "undercover",
        play: {
          round: 1,
          dealt: true,
          roster: [],
          turns: {
            round: 1,
            total: 2,
            order: ["a"],
            completed: [],
            complete: false,
            current: "a",
          },
        },
      }),
    ).toBe(true);
  });
});
