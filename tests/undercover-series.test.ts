import { describe, expect, it } from "vitest";
import {
  copyPreparation,
  movePreparation,
  newLibrary,
  newPreparation,
  newSeries,
  preparationName,
  seriesLibrarySchema,
  validatedPreparation,
} from "../apps/web/src/lib/undercover-series";
import { makeSeriesAttempt } from "../apps/web/src/lib/undercover-series-launch";
import { randomToken } from "../apps/web/src/lib/session-client";

describe("durable Undercover editorial preparations", () => {
  it("keeps the actual defaults and validates text independently of optional images", () => {
    const preparation = newPreparation();
    expect(preparation.count).toBe(4);
    expect(preparation.settings["clue-rounds"]).toBe(2);
    expect(preparation.overlayLayout.schemaVersion).toBe(2);
    expect(validatedPreparation(preparation)["civil-word"]).toBe("Phare");
    preparation.contents.a.imageId = "ca975f40-0e60-4e3c-b091-2e597ac63ffd";
    expect(() => validatedPreparation(preparation)).not.toThrow();
    preparation.contents.b.name = preparation.contents.a.name;
    expect(() => validatedPreparation(preparation)).toThrow();
  });
  it("duplicates editable names and settings without mutating the source or its images", () => {
    const source = newPreparation();
    source.contents.a.imageId = "ca975f40-0e60-4e3c-b091-2e597ac63ffd";
    const copied = copyPreparation(source);
    copied.contents.a.name = "Océan";
    copied.contents.b.name = "Rivière";
    delete copied.contents.a.imageId;
    copied.settings["clue-rounds"] = 4;
    expect(copied.id).not.toBe(source.id);
    expect(source.contents.a.name).toBe("Phare");
    expect(source.contents.a.imageId).toBeTruthy();
    expect(source.settings["clue-rounds"]).toBe(2);
    expect(preparationName(copied)).toBe("Océan / Rivière");
  });
  it("reorders only the conductor and keeps identities and invalid bounds stable", () => {
    const series = newSeries();
    series.preparations = [
      newPreparation(),
      newPreparation(),
      newPreparation(),
    ];
    const ids = series.preparations.map((p) => p.id);
    const reordered = movePreparation(series, 0, 2);
    expect(reordered.preparations.map((p) => p.id)).toEqual([
      ids[1],
      ids[2],
      ids[0],
    ]);
    expect(series.preparations.map((p) => p.id)).toEqual(ids);
    expect(movePreparation(series, 0, -1)).toBe(series);
    expect(movePreparation(series, 2, 3)).toBe(series);
  });
  it("reuses a history entry as a clean independent preparation with no archival fields", () => {
    const historical = {
      ...newPreparation(),
      seriesTitle: "Mon émission précédente",
    };
    const copy = copyPreparation(historical);
    expect(copy).not.toHaveProperty("seriesTitle");
    copy.contents.a.name = "Vallée";
    expect(historical.contents.a.name).toBe("Phare");
    const library = newLibrary();
    library.history.push(historical);
    library.series[0]!.preparations.push(copy);
    expect(seriesLibrarySchema.parse(library).history[0]!.seriesTitle).toBe(
      "Mon émission précédente",
    );
  });
  it("freezes only the active preparation when opening a salon, never future contents", () => {
    const series = newSeries();
    const preparation = newPreparation();
    const future = newPreparation();
    future.contents.a.name = "Futur secret non diffusé";
    series.preparations.push(preparation, future);
    const attempt = makeSeriesAttempt(series, preparation, 0, randomToken());
    preparation.contents.a.name = "Modification ultérieure";
    expect(attempt.snapshot!.contents.a.name).toBe("Phare");
    expect(attempt.settings["civil-word"]).toBe("Phare");
    expect(attempt.preparation!.series).toEqual({
      id: series.id,
      title: series.title,
      position: 1,
      total: 2,
    });
    expect(JSON.stringify(attempt)).not.toContain("Futur secret non diffusé");
    expect(attempt).not.toHaveProperty("capacity");
  });
});
