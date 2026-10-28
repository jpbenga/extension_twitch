import type { GameProjection } from "@extension-twitch/contracts/game-definition";

type PublicPlay = GameProjection["play"];
/** Presentation of existing public state only; no rule, transition or result is calculated here. */
export function publicPlayerStatus(
  play: PublicPlay,
  id: string,
  active: boolean,
) {
  if (!active) return "Éliminé";
  if (play?.ballot?.status === "open")
    return play.ballot.voted.includes(id) ? "A voté" : "Vote attendu";
  if (play?.turns?.current === id && !play.turns.complete) return "À son tour";
  if (play?.turns?.completed.includes(id)) return "Indice donné";
  return play?.dealt ? "En jeu" : "En attente";
}
export function publicResult(play: PublicPlay, name: (id: string) => string) {
  if (play?.outcome) return play.outcome.label;
  const ballot = play?.ballot;
  if (ballot?.status === "open") return "Les votes sont en cours.";
  if (ballot?.status === "resolved")
    return ballot.tied
      ? "Égalité : personne n’est éliminé."
      : ballot.eliminated
        ? `${name(ballot.eliminated)} est éliminé.`
        : "Scrutin terminé.";
  return play?.dealt
    ? "Les indices sont donnés à voix haute."
    : "Le Game Master prépare la partie.";
}
