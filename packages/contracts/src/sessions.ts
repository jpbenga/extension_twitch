import { z } from "zod";
import { gameIdSchema } from "./index.js";

const displayName = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .refine((value) => !/\p{C}/u.test(value), "Caractères de contrôle interdits");
export const sessionIdSchema = z.uuid();
export const accessTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const invitationCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{12}$/);

export const createSessionSchema = z.strictObject({
  requestId: z.uuid(),
  title: displayName,
  hostName: displayName,
  gameId: gameIdSchema,
});
export const joinSessionSchema = z.strictObject({
  requestId: z.uuid(),
  name: displayName,
});

export const lobbyActionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("participant.ready"), ready: z.boolean() }),
  z.strictObject({ type: z.literal("session.rename"), title: displayName }),
  z.strictObject({ type: z.literal("session.admission"), open: z.boolean() }),
  z.strictObject({
    type: z.literal("participant.remove"),
    participantId: z.uuid(),
  }),
  z.strictObject({ type: z.literal("session.reset") }),
]);
export const lobbyCommandSchema = z.strictObject({
  commandId: z.uuid(),
  expectedVersion: z.number().int().nonnegative(),
  command: lobbyActionSchema,
});
export type LobbyAction = z.infer<typeof lobbyActionSchema>;
export type LobbyCommand = z.infer<typeof lobbyCommandSchema>;

export const lobbyEventSchema = z.strictObject({
  version: z.number().int().positive(),
  at: z.iso.datetime(),
  type: z.enum([
    "session.created",
    "participant.joined",
    "participant.ready",
    "session.rename",
    "session.admission",
    "participant.remove",
    "session.reset",
  ]),
  message: z.string(),
});
export type LobbyEvent = z.infer<typeof lobbyEventSchema>;

export const publicParticipantSchema = z.strictObject({
  id: z.uuid(),
  name: displayName,
  ready: z.boolean(),
  connected: z.boolean(),
});
const viewFields = {
  sessionId: sessionIdSchema,
  title: displayName,
  hostName: displayName,
  gameId: gameIdSchema,
  phase: z.literal("lobby"),
  version: z.number().int().positive(),
  admissionOpen: z.boolean(),
  participants: z.array(publicParticipantSchema).max(32),
  events: z.array(lobbyEventSchema).max(20),
};
export const publicSessionSchema = z.strictObject({
  ...viewFields,
  audience: z.literal("public"),
});
export const gmSessionSchema = z.strictObject({
  ...viewFields,
  audience: z.literal("gm"),
  invitationCode: invitationCodeSchema,
  joinUrl: z.url(),
  publicUrl: z.url(),
});
export const playerSessionSchema = z.strictObject({
  ...viewFields,
  audience: z.literal("player"),
  participantId: z.uuid(),
});
export const sessionViewSchema = z.discriminatedUnion("audience", [
  publicSessionSchema,
  gmSessionSchema,
  playerSessionSchema,
]);
export type PublicSessionView = z.infer<typeof publicSessionSchema>;
export type SessionView = z.infer<typeof sessionViewSchema>;
export type GmSessionView = z.infer<typeof gmSessionSchema>;
export const sessionStreamEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("session.snapshot"),
    view: sessionViewSchema,
  }),
  z.strictObject({ type: z.literal("access.revoked") }),
]);
export const sessionAccessSchema = z.strictObject({
  sessionId: sessionIdSchema,
  participantId: z.uuid().optional(),
});
export const apiErrorSchema = z.object({ error: z.string() });
