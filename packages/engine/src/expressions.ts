import type {
  Expression,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import { SessionError } from "./session-types.js";

export function evaluateExpression(
  expr: Expression,
  resolve: (
    kind: "variable" | "parameter" | "configuration",
    id: string,
  ) => Scalar | undefined,
): Scalar {
  if (expr.kind === "literal") return expr.value;
  if (expr.kind !== "operator") {
    const value = resolve(expr.kind, expr.id);
    if (value === undefined)
      throw new SessionError("EXPRESSION_UNAVAILABLE", 409);
    return value;
  }
  const values = expr.args.map((a) => evaluateExpression(a, resolve));
  const a = values[0],
    b = values[1];
  if (expr.operator === "eq") return a === b;
  if (expr.operator === "not" && typeof a === "boolean") return !a;
  if (typeof a === "boolean" && typeof b === "boolean") {
    if (expr.operator === "and") return a && b;
    if (expr.operator === "or") return a || b;
  }
  if (typeof a === "number" && typeof b === "number") {
    if (expr.operator === "lt") return a < b;
    if (expr.operator === "gte") return a >= b;
    const value =
      expr.operator === "add"
        ? a + b
        : expr.operator === "subtract"
          ? a - b
          : expr.operator === "multiply"
            ? a * b
            : NaN;
    if (Number.isSafeInteger(value) && Math.abs(value) <= 100000) return value;
  }
  throw new SessionError("INVALID_EXPRESSION", 409);
}
