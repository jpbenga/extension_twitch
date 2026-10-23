import { z } from "zod";

export const officialGameIdSchema = z.enum(["undercover", "auctions", "spy"]);
export const gameIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,39}$/)
  .refine((id) => !["constructor", "prototype"].includes(id));
export type GameId = z.infer<typeof gameIdSchema>;

export const participationModeSchema = z.enum([
  "hosted",
  "connected",
  "hybrid",
]);
export type ParticipationMode = z.infer<typeof participationModeSchema>;

export const gameDescriptorSchema = z.strictObject({
  id: gameIdSchema,
  title: z.string().min(1),
  rulesStatus: z.enum(["pending-definition", "demo-playable"]),
});
export type GameDescriptor = z.infer<typeof gameDescriptorSchema>;

// This DTO intentionally has no role, word, private configuration or credentials.
// Future projections must be constructed on the server, never by hiding UI fields.
export const publicDemoSchema = z.strictObject({
  kind: z.literal("demo"),
  title: z.string().min(1),
  participants: z.array(
    z.strictObject({
      id: z.string().min(1),
      name: z.string().min(1),
      initials: z.string().min(1).max(3),
    }),
  ),
});
export type PublicDemo = z.infer<typeof publicDemoSchema>;

export const healthSchema = z.strictObject({
  status: z.literal("ok"),
  service: z.literal("extension-twitch-server"),
  mode: z.enum(["foundation", "sessions"]),
});

export const transportEventSchema = z.strictObject({
  type: z.literal("transport.ready"),
  protocolVersion: z.literal(1),
});

const identifier = z.string().min(1).max(128);

// Routing/concurrency envelope only. No game command endpoint exists in step 2.
// An actor's identity and role must come from server authentication, not this DTO.
export const commandEnvelopeSchema = z.strictObject({
  commandId: z.uuid(),
  sessionId: identifier,
  expectedVersion: z.number().int().nonnegative(),
  gameId: gameIdSchema,
  command: z.strictObject({ type: identifier, payload: z.unknown() }),
});
export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;

// Browser-originated requests can never declare a verified purchase or Bits.
export const spectatorRequestSchema = z.strictObject({
  requestId: z.uuid(),
  interactionId: identifier,
  source: z.enum(["demo", "twitch-free"]),
  payload: z.unknown(),
});
export type SpectatorRequest = z.infer<typeof spectatorRequestSchema>;

const interactionPolicyFields = {
  id: identifier,
  enabled: z.boolean(),
  effect: z.enum(["cosmetic", "gameplay"]),
  cooldownSeconds: z.number().int().nonnegative(),
  maxUsesPerSession: z.number().int().positive(),
  requiresGmApproval: z.boolean(),
};

// Future configuration contract; not an approved catalogue or a payment API.
export const interactionPolicySchema = z.discriminatedUnion("pricing", [
  z.strictObject({ ...interactionPolicyFields, pricing: z.literal("free") }),
  z.strictObject({
    ...interactionPolicyFields,
    pricing: z.literal("twitch-bits"),
    twitchProductSku: identifier,
  }),
]);
export type InteractionPolicy = z.infer<typeof interactionPolicySchema>;
