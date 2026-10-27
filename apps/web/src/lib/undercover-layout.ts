import type { UndercoverLayout } from "@extension-twitch/contracts/undercover-layout";
/** Geometry shared by renderer and editor handles. Slots refer to registration order, never secret roles. */
export function playerCardRects(layout: UndercoverLayout, count: number) {
  const slots = layout.players.order.filter((i) => i < count);
  if (layout.players.mode === "free")
    return slots.map((i) => layout.players.cards[i]!);
  const columns =
    layout.players.mode === "vertical"
      ? 1
      : layout.players.mode === "horizontal"
        ? Math.min(6, count)
        : Math.min(4, count);
  const rows = Math.max(1, Math.ceil(count / Math.max(1, columns)));
  return slots.map((_, i) => ({
    x: ((i % columns) * 100) / columns,
    y: (Math.floor(i / columns) * 100) / rows,
    width: 100 / columns - 0.8,
    height: 100 / rows - 1.2,
  }));
}
export function releasePlayerGrid(
  layout: UndercoverLayout,
  count: number,
): UndercoverLayout {
  if (layout.players.mode === "free") return layout;
  const next = structuredClone(layout),
    cards = playerCardRects(layout, count);
  next.players.order
    .filter((i) => i < count)
    .forEach((slot, i) => {
      next.players.cards[slot] = cards[i]!;
    });
  next.players.mode = "free";
  return next;
}
export function constrainCard(r: UndercoverLayout["players"]["cards"][number]) {
  const width = Math.min(100, Math.max(12, r.width)),
    height = Math.min(100, Math.max(6, r.height));
  return {
    width,
    height,
    x: Math.max(0, Math.min(100 - width, r.x)),
    y: Math.max(0, Math.min(100 - height, r.y)),
  };
}
