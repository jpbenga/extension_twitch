import { z } from "zod";
import {
  identifierSchema as id,
  gameLabelSchema as label,
} from "./identifiers.js";

// Declarative, bounded building blocks. They contain references, never code.
export const mechanicsSchema = z.strictObject({
  minPlayers: z.number().int().min(1).max(12),
  maxPlayers: z.number().int().min(1).max(12),
  roundLimitConfiguration: id.optional(),
  drawLabel: label.optional(),
  drawRevealVariables: z.array(id).max(8).default([]),
  finishedPhase: id.optional(),
  deals: z
    .array(
      z.strictObject({
        id,
        majorityRole: id,
        minorityRole: id,
        minorityCountConfiguration: id,
        privateVariable: id,
        majorityValueConfiguration: id,
        minorityValueConfiguration: id,
        concealRoles: z.boolean(),
      }),
    )
    .max(1)
    .default([]),
  ballots: z
    .array(
      z.strictObject({
        id,
        resolution: z.enum(["eliminate", "select"]),
        allowSelfVote: z.boolean(),
        requireAll: z.literal(true),
        allowGmProxy: z.boolean(),
        revealEliminatedRole: z.boolean(),
        resultPhase: id,
      }),
    )
    .max(2)
    .default([]),
  endings: z
    .array(
      z.strictObject({
        id,
        label,
        leftRole: id,
        comparison: z.enum(["eq", "gte", "lte"]),
        right: z.union([
          z.strictObject({ count: z.number().int().min(0).max(12) }),
          z.strictObject({ role: id }),
        ]),
        revealVariables: z.array(id).max(8),
      }),
    )
    .max(4)
    .default([]),
});
export type Mechanics = z.infer<typeof mechanicsSchema>;
export const operationSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("deal"), deal: id }),
  z.strictObject({ type: z.literal("ballot.open"), ballot: id }),
  z.strictObject({
    type: z.literal("ballot.cast"),
    ballot: id,
    targetParameter: id,
  }),
  z.strictObject({ type: z.literal("ballot.resolve"), ballot: id }),
  z.strictObject({ type: z.literal("round.next"), phase: id }),
]);
export type GameOperation = z.infer<typeof operationSchema>;
export const playProjectionSchema = z.strictObject({
  round: z.number().int().min(0).max(30),
  dealt: z.boolean(),
  roster: z
    .array(
      z.strictObject({
        id: z.uuid(),
        active: z.boolean(),
        role: label.optional(),
      }),
    )
    .max(12),
  ballot: z
    .strictObject({
      id,
      status: z.enum(["open", "resolved"]),
      eligible: z.array(z.uuid()).max(12),
      voted: z.array(z.uuid()).max(12),
      candidates: z.array(z.uuid()).max(12),
      myVote: z.uuid().optional(),
      tallies: z
        .array(
          z.strictObject({
            participantId: z.uuid(),
            count: z.number().int().min(0).max(12),
          }),
        )
        .max(12),
      tied: z.boolean(),
      eliminated: z.uuid().optional(),
      selected: z.uuid().optional(),
      complete: z.boolean(),
      allowSelfVote: z.boolean(),
    })
    .optional(),
  outcome: z.strictObject({ id, label }).optional(),
});
