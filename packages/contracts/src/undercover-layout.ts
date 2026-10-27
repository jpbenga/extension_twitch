import { z } from "zod";

export const widgetIds = [
  "header",
  "phase",
  "round",
  "players",
  "vote",
  "result",
  "events",
] as const;
export type WidgetId = (typeof widgetIds)[number];
export const widgetLabels: Record<WidgetId, string> = {
  header: "Titre",
  phase: "Phase et indices",
  round: "Manche",
  players: "Joueurs",
  vote: "Progression du vote",
  result: "Résultat",
  events: "Événements publics",
};
export const widgetMinimums: Record<
  WidgetId,
  { width: number; height: number }
> = {
  header: { width: 480, height: 100 },
  phase: { width: 480, height: 140 },
  round: { width: 280, height: 100 },
  players: { width: 480, height: 220 },
  vote: { width: 320, height: 100 },
  result: { width: 600, height: 200 },
  events: { width: 480, height: 120 },
};
const rectSchema = z
  .strictObject({
    x: z.number().int().min(24).max(1896),
    y: z.number().int().min(24).max(1056),
    width: z.number().int().min(100).max(1872),
    height: z.number().int().min(80).max(1032),
  })
  .refine(
    (r) => r.x + r.width <= 1896 && r.y + r.height <= 1056,
    "Le bloc doit rester dans la zone de sécurité.",
  );
export type LayoutRect = z.infer<typeof rectSchema>;
const cardSchema = z
  .strictObject({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    width: z.number().min(12).max(100),
    height: z.number().min(6).max(100),
  })
  .refine(
    (r) => r.x + r.width <= 100.001 && r.y + r.height <= 100.001,
    "La carte doit rester dans le groupe joueurs.",
  );
export const undercoverLayoutSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    gameId: z.literal("undercover"),
    widgets: z.strictObject({
      header: rectSchema,
      phase: rectSchema,
      round: rectSchema,
      players: rectSchema,
      vote: rectSchema,
      result: rectSchema,
      events: rectSchema,
    }),
    players: z.strictObject({
      mode: z.enum(["grid", "horizontal", "vertical", "free"]),
      order: z
        .array(z.number().int().min(0).max(11))
        .length(12)
        .refine(
          (a) => new Set(a).size === 12,
          "Chaque place doit apparaître une seule fois.",
        ),
      cards: z.array(cardSchema).length(12),
    }),
  })
  .superRefine((v, ctx) => {
    for (const id of widgetIds) {
      const r = v.widgets[id],
        min = widgetMinimums[id];
      if (r.width < min.width || r.height < min.height)
        ctx.addIssue({
          code: "custom",
          path: ["widgets", id],
          message: "Ce bloc est trop petit pour rester lisible.",
        });
    }
  });
export type UndercoverLayout = z.infer<typeof undercoverLayoutSchema>;
const rect = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
});
const base = (): UndercoverLayout => ({
  schemaVersion: 1,
  gameId: "undercover",
  widgets: {
    header: rect(24, 24, 1872, 110),
    phase: rect(24, 154, 1380, 140),
    round: rect(1424, 154, 472, 140),
    players: rect(24, 314, 1872, 320),
    vote: rect(24, 654, 550, 220),
    result: rect(594, 654, 1302, 220),
    events: rect(24, 894, 1872, 162),
  },
  players: {
    mode: "grid",
    order: Array.from({ length: 12 }, (_, i) => i),
    cards: Array.from({ length: 12 }, (_, i) => ({
      x: (i % 6) * 16.66,
      y: Math.floor(i / 6) * 50,
      width: 16,
      height: 48,
    })),
  },
});
export const layoutPresets = [
  { id: "balanced", label: "Équilibré" },
  { id: "bottom", label: "Joueurs en bas" },
  { id: "lateral", label: "Joueurs à gauche" },
  { id: "centered", label: "Centré" },
] as const;
export type LayoutPreset = (typeof layoutPresets)[number]["id"];
export function createUndercoverLayout(
  preset: LayoutPreset = "balanced",
): UndercoverLayout {
  const l = base();
  if (preset === "bottom") {
    l.widgets.players = rect(24, 714, 1872, 220);
    l.widgets.vote = rect(24, 314, 550, 220);
    l.widgets.result = rect(594, 314, 1302, 380);
    l.widgets.events = rect(24, 936, 1872, 120);
  }
  if (preset === "lateral") {
    l.widgets.players = rect(24, 314, 600, 742);
    l.widgets.vote = rect(644, 314, 1252, 140);
    l.widgets.result = rect(644, 474, 1252, 382);
    l.widgets.events = rect(644, 876, 1252, 180);
    l.players.mode = "vertical";
  }
  if (preset === "centered") {
    l.widgets.header = rect(264, 24, 1392, 110);
    l.widgets.phase = rect(264, 154, 1000, 140);
    l.widgets.round = rect(1284, 154, 372, 140);
    l.widgets.players = rect(264, 314, 1392, 320);
    l.widgets.vote = rect(264, 654, 360, 220);
    l.widgets.result = rect(644, 654, 1012, 220);
    l.widgets.events = rect(264, 894, 1392, 162);
  }
  return undercoverLayoutSchema.parse(l);
}
/** Pure bounds helper, also used by keyboard/numeric and pointer edits. */
export function constrainWidget(id: WidgetId, r: LayoutRect): LayoutRect {
  const min = widgetMinimums[id];
  const width = Math.max(min.width, Math.min(1872, Math.round(r.width)));
  const height = Math.max(min.height, Math.min(1032, Math.round(r.height)));
  return {
    width,
    height,
    x: Math.max(24, Math.min(1896 - width, Math.round(r.x))),
    y: Math.max(24, Math.min(1056 - height, Math.round(r.y))),
  };
}
export function layoutOverlaps(l: UndercoverLayout): string[] {
  return widgetIds.flatMap((a, i) =>
    widgetIds.slice(i + 1).flatMap((b) => {
      const r = l.widgets[a],
        s = l.widgets[b];
      return r.x < s.x + s.width &&
        r.x + r.width > s.x &&
        r.y < s.y + s.height &&
        r.y + r.height > s.y
        ? [`${widgetLabels[a]} / ${widgetLabels[b]}`]
        : [];
    }),
  );
}
/** Strictly fewer Undercover than civilians; no special role is currently implemented. */
export function maximumUndercover(players: number) {
  return Math.max(0, Math.min(5, Math.floor((players - 1) / 2)));
}
