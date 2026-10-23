import { z } from "zod";
import type { Scalar, ValueSpec } from "./game-definition.js";

const id = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,39}$/)
  .refine((v) => !["constructor", "prototype"].includes(v));
export type Expression =
  | { kind: "literal"; value: Scalar }
  | { kind: "variable" | "parameter" | "configuration"; id: string }
  | {
      kind: "operator";
      operator:
        | "add"
        | "subtract"
        | "multiply"
        | "eq"
        | "lt"
        | "gte"
        | "and"
        | "or"
        | "not";
      args: Expression[];
    };
const leaf = z.union([
  z.strictObject({
    kind: z.literal("literal"),
    value: z.union([
      z.string().max(240),
      z.number().int().min(-100000).max(100000),
      z.boolean(),
    ]),
  }),
  z.strictObject({
    kind: z.enum(["variable", "parameter", "configuration"]),
    id,
  }),
]);
// Construct a bounded schema rather than recursively parsing an unbounded user tree.
let bounded: z.ZodType<Expression> = leaf;
for (let depth = 0; depth < 4; depth++) {
  bounded = z.union([
    leaf,
    z.strictObject({
      kind: z.literal("operator"),
      operator: z.enum([
        "add",
        "subtract",
        "multiply",
        "eq",
        "lt",
        "gte",
        "and",
        "or",
        "not",
      ]),
      args: z.array(bounded).min(1).max(2),
    }),
  ]);
}
export const expressionSchema = bounded;
type Visibility = "public" | "gm" | "owner";
interface Field {
  id: string;
  value: ValueSpec;
}
export interface ExpressionContext {
  variables: ReadonlyArray<
    Field & { scope: "session" | "participant"; visibility: Visibility }
  >;
  configuration: ReadonlyArray<Field & { visibility: "public" | "gm" }>;
  parameters: ReadonlyArray<Field>;
  roles: ReadonlyArray<"gm" | "player" | "spectator">;
}
export interface ExpressionInfo {
  type: ValueSpec["type"];
  visibility: Visibility;
}
export function inspectExpression(
  expr: Expression,
  context: ExpressionContext,
): ExpressionInfo {
  const invalid = (): never => {
    throw new Error("Invalid expression type, reference or permission");
  };
  if (expr.kind === "literal")
    return {
      type:
        typeof expr.value === "number"
          ? "integer"
          : typeof expr.value === "boolean"
            ? "boolean"
            : "text",
      visibility: "public",
    };
  if (expr.kind !== "operator") {
    const field =
      expr.kind === "variable"
        ? context.variables.find((v) => v.id === expr.id)
        : expr.kind === "configuration"
          ? context.configuration.find((v) => v.id === expr.id)
          : context.parameters.find((v) => v.id === expr.id);
    if (!field) return invalid();
    if (
      "scope" in field &&
      field.scope === "participant" &&
      context.roles.some((r) => r !== "player")
    )
      return invalid();
    const visibility: Visibility =
      "visibility" in field &&
      (field.visibility === "gm" || field.visibility === "owner")
        ? field.visibility
        : "public";
    if (visibility === "gm" && context.roles.some((r) => r !== "gm"))
      return invalid();
    return { type: field.value.type, visibility };
  }
  const args = expr.args.map((a) => inspectExpression(a, context));
  if (args.length !== (expr.operator === "not" ? 1 : 2)) return invalid();
  const type = args[0]!.type;
  if (args.some((a) => a.type !== type)) return invalid();
  if (
    ["add", "subtract", "multiply", "lt", "gte"].includes(expr.operator) &&
    type !== "integer"
  )
    return invalid();
  if (["and", "or", "not"].includes(expr.operator) && type !== "boolean")
    return invalid();
  const privateLevels = new Set(
    args.map((a) => a.visibility).filter((v) => v !== "public"),
  );
  if (privateLevels.size > 1) return invalid();
  return {
    type: ["add", "subtract", "multiply"].includes(expr.operator)
      ? "integer"
      : "boolean",
    visibility: privateLevels.has("gm")
      ? "gm"
      : privateLevels.has("owner")
        ? "owner"
        : "public",
  };
}
