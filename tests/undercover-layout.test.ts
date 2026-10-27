import { describe, expect, it } from "vitest";
import {
  createUndercoverLayout,
  undercoverLayoutSchema,
  layoutPresets,
  constrainWidget,
  layoutOverlaps,
  maximumUndercover,
  widgetIds,
} from "@extension-twitch/contracts/undercover-layout";
import { officialSessionSchema } from "@extension-twitch/contracts/official-games";
import {
  playerCardRects,
  releasePlayerGrid,
  constrainCard,
} from "../apps/web/src/lib/undercover-layout.js";
import { randomUUID } from "node:crypto";

describe("bounded Undercover layout and public slot geometry", () => {
  it("provides valid independent non-overlapping presets with all seven compulsory widgets", () => {
    for (const preset of layoutPresets) {
      const layout = createUndercoverLayout(preset.id);
      expect(undercoverLayoutSchema.parse(layout)).toEqual(layout);
      expect(layoutOverlaps(layout)).toEqual([]);
      expect(Object.keys(layout.widgets)).toEqual(widgetIds);
    }
    const a = createUndercoverLayout();
    a.widgets.header.x = 500;
    expect(createUndercoverLayout().widgets.header.x).toBe(24);
  });
  it("rejects outside, tiny, missing, unsafe and unknown fields instead of accepting CSS or URLs", () => {
    for (const mutate of [
      (l: ReturnType<typeof createUndercoverLayout>) => {
        l.widgets.phase.x = -1;
      },
      (l: ReturnType<typeof createUndercoverLayout>) => {
        l.widgets.phase.width = 9000;
      },
      (l: ReturnType<typeof createUndercoverLayout>) => {
        l.widgets.result.height = 50;
      },
      (l: ReturnType<typeof createUndercoverLayout>) => {
        l.players.order[0] = 1;
      },
      (l: ReturnType<typeof createUndercoverLayout>) => {
        l.players.cards[0]!.x = 99;
      },
    ]) {
      const layout = createUndercoverLayout();
      mutate(layout);
      expect(undercoverLayoutSchema.safeParse(layout).success).toBe(false);
    }
    const layout = createUndercoverLayout();
    for (const extension of [
      { schemaVersion: 2 },
      { url: "https://invalid.example" },
      { css: "position:fixed" },
    ])
      expect(
        undercoverLayoutSchema.safeParse({ ...layout, ...extension }).success,
      ).toBe(false);
    const { events: _events, ...widgets } = layout.widgets;
    expect(
      undercoverLayoutSchema.safeParse({ ...layout, widgets }).success,
    ).toBe(false);
  });
  it("clamps movement/resize within the 24px safe margin while preserving useful minimum sizes", () => {
    const r = constrainWidget("result", {
      x: -200,
      y: 9000,
      width: 10,
      height: 5000,
    });
    expect(r).toEqual({ x: 24, y: 24, width: 600, height: 1032 });
    const l = createUndercoverLayout();
    l.widgets.result = r;
    expect(undercoverLayoutSchema.safeParse(l).success).toBe(true);
  });
  it("adapts player geometry to 3–12 places, preserves order and releases a grid without moving its cards", () => {
    for (let count = 3; count <= 12; count++)
      for (const mode of ["grid", "horizontal", "vertical"] as const) {
        const l = createUndercoverLayout();
        l.players.mode = mode;
        [l.players.order[0], l.players.order[1]] = [1, 0];
        const cards = playerCardRects(l, count),
          free = releasePlayerGrid(l, count);
        expect(playerCardRects(free, count)).toEqual(cards);
        expect(undercoverLayoutSchema.safeParse(free).success).toBe(true);
        expect(cards).toHaveLength(count);
        expect(free.players.order.slice(0, 2)).toEqual([1, 0]);
      }
    expect(constrainCard({ x: 500, y: -3, width: 4, height: 2 })).toEqual({
      x: 88,
      y: 0,
      width: 12,
      height: 6,
    });
  });
  it("reports overlaps without destroying intentionally placed blocks", () => {
    const l = createUndercoverLayout();
    l.widgets.phase.x = 24;
    l.widgets.phase.y = 24;
    expect(layoutOverlaps(l)).toContain("Titre / Phase et indices");
    expect(undercoverLayoutSchema.safeParse(l).success).toBe(true);
  });
  it("keeps historical official payloads valid and accepts only a separate layout, never rules", () => {
    expect(
      officialSessionSchema.parse({ requestId: randomUUID(), settings: {} })
        .overlayLayout,
    ).toBeUndefined();
    expect(
      officialSessionSchema.parse({
        requestId: randomUUID(),
        settings: {},
        overlayLayout: createUndercoverLayout(),
      }).overlayLayout,
    ).toBeDefined();
    expect(
      officialSessionSchema.safeParse({
        requestId: randomUUID(),
        settings: { overlayLayout: createUndercoverLayout() },
      }).success,
    ).toBe(false);
  });
  it("explains the actual legal camp distribution for each player count, not a new role", () => {
    expect(
      Array.from({ length: 10 }, (_, i) => maximumUndercover(i + 3)),
    ).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
});
