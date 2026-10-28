import type { GameProjection } from "@extension-twitch/contracts/game-definition";

/** Historical sessions can use a different definition despite their lobby gameId. */
export function supportsUndercoverCompanion(
  game: Pick<GameProjection, "definitionId" | "play"> | undefined,
) {
  return !game || (game.definitionId === "undercover" && !!game.play);
}
