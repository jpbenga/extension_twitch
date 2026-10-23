import { publicDemoSchema, type GameId } from "@extension-twitch/contracts";
import { undercover } from "@extension-twitch/game-undercover";
import { auctions } from "@extension-twitch/game-auctions";
import { spy } from "@extension-twitch/game-spy";

export const games = [
  {
    ...undercover,
    shortTitle: "Undercover",
    category: "BLUFF & DÉDUCTION",
    description: "Un mot. Des regards. Et quelqu’un qui cache son jeu.",
    symbol: "diamond",
    theme: "violet",
  },
  {
    ...auctions,
    shortTitle: "Enchères",
    category: "STRATÉGIE & AUDACE",
    description: "Des personnages à convoiter. Un budget à défendre.",
    symbol: "auction",
    theme: "amber",
  },
  {
    ...spy,
    shortTitle: "Qui est l’espion ?",
    category: "MYSTÈRE & INTUITION",
    description: "Les bonnes questions font tomber les masques.",
    symbol: "eye",
    theme: "mint",
  },
] as const;

export function findGame(id: GameId) {
  return (
    games.find((game) => game.id === id) ?? {
      ...games[0],
      id,
      title: "Expérience personnalisée",
      shortTitle: "Studio",
    }
  );
}

// Deliberately public fixture, shared by visual previews only. No game state.
export const publicDemo = publicDemoSchema.parse({
  kind: "demo",
  title: "Le rendez-vous du vendredi",
  participants: [
    { id: "p1", name: "Nova", initials: "NO" },
    { id: "p2", name: "Atlas", initials: "AT" },
    { id: "p3", name: "Echo", initials: "EC" },
    { id: "p4", name: "Pixel", initials: "PI" },
    { id: "p5", name: "Luna", initials: "LU" },
    { id: "p6", name: "Orion", initials: "OR" },
  ],
});
