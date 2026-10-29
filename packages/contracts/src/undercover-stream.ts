import { z } from "zod";

/** Editorial metadata for the current preparation only. Never a future series queue. */
export const undercoverPreparationRefSchema = z.strictObject({
  id: z.uuid(),
  title: z.string().trim().min(1).max(80),
  preferredPublication: z.enum(["none", "duo", "assignments"]).optional(),
  series: z
    .strictObject({
      id: z.uuid(),
      title: z.string().trim().min(1).max(80),
      position: z.number().int().min(1).max(100),
      total: z.number().int().min(1).max(100),
    })
    .refine((s) => s.position <= s.total, "Position hors de la série"),
});
export type UndercoverPreparationRef = z.infer<
  typeof undercoverPreparationRefSchema
>;
export const undercoverImageSchema = z.strictObject({
  id: z.uuid(),
  url: z
    .string()
    .regex(
      /^\/api\/server\/sessions\/[a-f0-9-]{36}\/media\/[a-f0-9-]{36}(?:\?v=[a-f0-9]{12})?$/,
    ),
});
export const undercoverContentSchema = z.strictObject({
  id: z.uuid(),
  label: z.string().min(1).max(80),
  image: undercoverImageSchema.optional(),
});
export type UndercoverContent = z.infer<typeof undercoverContentSchema>;
export const undercoverPublicationSchema = z.enum([
  "none",
  "duo",
  "assignments",
]);
const presentationFields = {
  revision: z.number().int().nonnegative(),
  page: z.number().int().min(0).max(3),
  transition: z.boolean(),
};
const publicContents = z.array(undercoverContentSchema).length(2);
const publicAssignments = z
  .array(
    z.strictObject({
      participantId: z.uuid(),
      contentId: z.uuid(),
      slot: z.number().int().min(1).max(32),
    }),
  )
  .max(32);
/** Structural separation, not UI filtering: anonymous messages cannot carry a mapping. */
export const undercoverBroadcastSchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("none"), ...presentationFields }),
  z.strictObject({
    mode: z.literal("duo"),
    ...presentationFields,
    contents: publicContents,
  }),
  z.strictObject({
    mode: z.literal("assignments"),
    ...presentationFields,
    contents: publicContents,
    assignments: publicAssignments,
  }),
  z.strictObject({
    mode: z.literal("final"),
    ...presentationFields,
    contents: publicContents,
    assignments: publicAssignments,
  }),
]);
export type UndercoverBroadcast = z.infer<typeof undercoverBroadcastSchema>;
export const undercoverPreparedViewSchema =
  undercoverPreparationRefSchema.extend({
    contents: z.strictObject({
      a: undercoverContentSchema,
      b: undercoverContentSchema,
    }),
    publication: undercoverPublicationSchema,
    page: z.number().int().min(0).max(3),
  });
export type UndercoverPreparedView = z.infer<
  typeof undercoverPreparedViewSchema
>;
/** Private authoritative editorial state. Binary media never enters SQLite. */
export interface UndercoverStreamState {
  preparation: UndercoverPreparationRef;
  contents: {
    a: { id: string; label: string };
    b: { id: string; label: string };
  };
  publication: z.infer<typeof undercoverPublicationSchema>;
  page: number;
  revision: number;
  transition: boolean;
}
export const UNDERCOVER_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const UNDERCOVER_IMAGE_MAX_DIMENSION = 1600;
export const UNDERCOVER_MEDIA_TTL_MS = 60 * 60 * 1000;
