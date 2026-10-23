"use client";
import { useId } from "react";
import type {
  Expression,
  GameDefinition,
  ActionDefinition,
} from "@extension-twitch/contracts/game-definition";
import { comparison } from "../lib/creator-model";
import { describeExpression } from "../lib/creator-readable";
import { ScalarField } from "./creator-fields";
const operations = {
  eq: "est égal à",
  ne: "est différent de",
  lt: "est inférieur à",
  gt: "est supérieur à",
  gte: "est supérieur ou égal à",
  lte: "est inférieur ou égal à",
  and: "Toutes ces conditions sont vraies",
  or: "Au moins une de ces conditions est vraie",
  not: "Cette condition est fausse",
  add: "Additionner",
  subtract: "Soustraire",
  multiply: "Multiplier",
} as const;
export function ExpressionEditor({
  value,
  onChange,
  definition,
  action,
  label = "Cette condition",
  parameters = false,
  depth = 0,
}: {
  value: Expression;
  onChange: (e: Expression) => void;
  definition: GameDefinition;
  action: ActionDefinition;
  label?: string;
  parameters?: boolean;
  depth?: number;
}) {
  const fieldId = useId(),
    mode =
      value.kind === "operator"
        ? value.operator
        : value.kind === "literal"
          ? `value-${typeof value.value}`
          : value.kind;
  function choose(mode: string) {
    if (mode.startsWith("value-"))
      onChange({
        kind: "literal",
        value:
          mode === "value-number" ? 0 : mode === "value-boolean" ? true : "",
      });
    else if (
      mode === "variable" ||
      mode === "parameter" ||
      mode === "configuration"
    ) {
      const fields =
        mode === "variable"
          ? definition.variables
          : mode === "parameter"
            ? action.parameters
            : definition.configuration;
      onChange({ kind: mode, id: fields[0]?.id ?? "missing" });
    } else {
      const op = mode as keyof typeof operations,
        bool = ["and", "or", "not"].includes(op);
      const previousGroup =
        value.kind === "operator" &&
        ["and", "or", "not"].includes(value.operator);
      const args =
        value.kind === "operator" && !bool && !previousGroup ? value.args : [];
      const first: Expression = bool
        ? previousGroup && op !== "not" && value.kind === "operator"
          ? value.args[0]!
          : value
        : (args[0] ?? {
            kind: "variable",
            id: definition.variables[0]?.id ?? "missing",
          });
      const second: Expression = bool
        ? previousGroup && value.kind === "operator"
          ? (value.args[1] ?? { kind: "literal", value: true })
          : { kind: "literal", value: true }
        : (args[1] ?? { kind: "literal", value: 0 });
      if (["ne", "gt", "lte"].includes(op))
        onChange(comparison(op as "ne" | "gt" | "lte", first, second));
      else
        onChange({
          kind: "operator",
          operator: op as Extract<Expression, { kind: "operator" }>["operator"],
          args: op === "not" ? [first] : [first, second],
        });
    }
  }
  const fields =
    value.kind === "variable"
      ? definition.variables
      : value.kind === "configuration"
        ? definition.configuration
        : action.parameters;
  const group =
    value.kind === "operator" && ["and", "or", "not"].includes(value.operator);
  return (
    <fieldset className="expression-node">
      <legend>
        {group && value.kind === "operator"
          ? operations[value.operator]
          : label}
      </legend>
      {depth === 0 && (
        <p className="creator-rule-preview">
          {describeExpression(value, definition, action)}
        </p>
      )}
      <label htmlFor={fieldId}>
        {group
          ? "Combiner les conditions"
          : value.kind === "operator"
            ? "Comparer ou calculer"
            : "Choisir une information"}
        <select
          id={fieldId}
          aria-label={
            group
              ? "Combiner les conditions"
              : value.kind === "operator"
                ? "Comparer ou calculer"
                : "Choisir une information"
          }
          value={mode}
          onChange={(e) => choose(e.target.value)}
        >
          <optgroup label="Informations">
            <option value="variable" disabled={!definition.variables.length}>
              Une donnée du jeu
            </option>
            <option value="value-number">Un nombre</option>
            <option value="value-string">Un texte</option>
            <option value="value-boolean">Oui ou non</option>
            <option
              value="configuration"
              disabled={!definition.configuration.length}
            >
              Un réglage de la partie
            </option>
            {parameters && (
              <option value="parameter" disabled={!action.parameters.length}>
                La saisie du joueur
              </option>
            )}
          </optgroup>
          {depth < 4 && (
            <optgroup label="Comparer et combiner">
              {Object.entries(operations).map(([id, text]) => (
                <option key={id} value={id}>
                  {text}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      {value.kind === "literal" ? (
        <ScalarField
          label={
            typeof value.value === "boolean" ? "La valeur attendue" : "Valeur"
          }
          value={value.value}
          onChange={(value) => onChange({ kind: "literal", value })}
        />
      ) : value.kind !== "operator" ? (
        <label>
          Quelle information ?
          <select
            aria-label="Quelle information ?"
            value={value.id}
            onChange={(e) => onChange({ ...value, id: e.target.value })}
          >
            {!fields.some((f) => f.id === value.id) && (
              <option value={value.id}>Cette information n’existe plus</option>
            )}
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className={group ? "condition-branches" : "comparison-branches"}>
          {value.args.map((arg, i) => (
            <ExpressionEditor
              key={i}
              value={arg}
              definition={definition}
              action={action}
              parameters={parameters}
              depth={depth + 1}
              label={
                group
                  ? "Une condition"
                  : i === 0
                    ? "Cette information"
                    : "Avec cette valeur"
              }
              onChange={(next) =>
                onChange({
                  ...value,
                  args: value.args.map((old, j) => (i === j ? next : old)),
                })
              }
            />
          ))}
        </div>
      )}
      {depth === 4 && (
        <small>
          Pour ajouter une combinaison, simplifiez une autre partie de cette
          règle. Votre règle actuelle est conservée.
        </small>
      )}
    </fieldset>
  );
}
