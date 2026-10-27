import { z } from "zod";
// Versioned discovery boundary; a future authenticated adapter must use validated
// server bindings, never a GM credential or an action id supplied by the browser.
export const spectatorCapabilitiesSchema = z.strictObject({
  schemaVersion: z.literal(1),
  mode: z.literal("read-only"),
  actions: z.array(z.never()).max(0),
  nativeTwitch: z.literal("not-connected"),
  reason: z.string().min(1),
});
export const readOnlySpectators = spectatorCapabilitiesSchema.parse({
  schemaVersion: 1,
  mode: "read-only",
  actions: [],
  nativeTwitch: "not-connected",
  reason:
    "Aucune action spectateur n’est autorisée par le moteur actuel. Vous pouvez observer le plateau ; les votes sont réservés aux joueurs.",
});
