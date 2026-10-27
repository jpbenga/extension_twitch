import { z } from "zod";
import { undercoverLayoutSchema } from "./undercover-layout.js";

/** Product settings only: no executable definition or expression is accepted. */
export const undercoverSettingsSchema = z
  .strictObject({
    "undercover-count": z.number().int().min(1).max(5).default(1),
    "civil-word": z.string().trim().min(1).max(80).default("Phare"),
    "undercover-word": z.string().trim().min(1).max(80).default("Fusée"),
    "clue-rounds": z.number().int().min(1).max(5).default(2),
    "round-limit": z.number().int().min(1).max(30).default(10),
  })
  .refine(
    (s) =>
      s["civil-word"].normalize("NFKC").toLocaleLowerCase("fr") !==
      s["undercover-word"].normalize("NFKC").toLocaleLowerCase("fr"),
    { message: "Choisissez deux mots différents.", path: ["undercover-word"] },
  );
export type UndercoverSettings = z.infer<typeof undercoverSettingsSchema>;
export const officialSessionSchema = z.strictObject({
  requestId: z.uuid(),
  settings: undercoverSettingsSchema,
  overlayLayout: undercoverLayoutSchema.optional(),
});
export const officialGameSchema = z.strictObject({
  id: z.enum(["undercover", "auctions", "spy"]),
  title: z.string(),
  description: z.string(),
  concept: z.string(),
  availability: z.enum(["playable-demo", "planned"]),
  participants: z.string(),
  duration: z.string(),
  features: z.array(z.string()),
  settings: z.array(z.string()),
});
export const officialCatalogSchema = z.array(officialGameSchema).max(20);
export const officialGames = officialCatalogSchema.parse([
  {
    id: "undercover",
    title: "Undercover",
    description: "Des mots secrets, des indices et un intrus à démasquer.",
    concept:
      "Chacun donne un indice oral, puis les joueurs votent. Éliminez les Undercover avant qu’ils deviennent majoritaires.",
    availability: "playable-demo",
    participants: "3 à 12 joueurs",
    duration: "Selon les échanges et le nombre de manches",
    features: [
      "Mots privés",
      "Deux tours d’indices par défaut",
      "Votes et éliminations",
      "Plateau synchronisé",
    ],
    settings: [
      "Mots secrets",
      "Nombre d’Undercover",
      "Tours d’indices",
      "Limite de manches",
    ],
  },
  {
    id: "auctions",
    title: "Enchères",
    description: "Gérez votre budget et remportez les lots.",
    concept:
      "Des offres contrôlées par le serveur et une attribution confirmée par le GM.",
    availability: "planned",
    participants: "À confirmer",
    duration: "À définir",
    features: [],
    settings: [],
  },
  {
    id: "spy",
    title: "Qui est l’espion ?",
    description: "Questionnez, déduisez et identifiez l’espion.",
    concept:
      "Une enquête avec des informations secrètes, distincte d’Undercover.",
    availability: "planned",
    participants: "À confirmer",
    duration: "À définir",
    features: [],
    settings: [],
  },
]);
