import { z } from "zod";
export const themeIdSchema = z.enum([
  "broadcast-studio",
  "neon-show",
  "on-air-premium",
]);
export type ThemeId = z.infer<typeof themeIdSchema>;
export const applicationDefaultTheme: ThemeId = "broadcast-studio";
/** Old parties retain the violet broadcast identity; never inherit a viewer's preference. */
export const historicalBroadcastTheme: ThemeId = "neon-show";
export const officialThemes: ReadonlyArray<{
  id: ThemeId;
  name: string;
  description: string;
}> = [
  {
    id: "broadcast-studio",
    name: "Broadcast Studio",
    description: "Turquoise et bleu · régie professionnelle",
  },
  {
    id: "neon-show",
    name: "Neon Show",
    description: "Violet et rose · énergie jeu télévisé",
  },
  {
    id: "on-air-premium",
    name: "On Air Premium",
    description: "Champagne et graphite · élégance sobre",
  },
];
