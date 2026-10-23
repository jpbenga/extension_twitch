"use client";
import { useState } from "react";
import {
  expressionSchema,
  type Expression,
  type GameDefinition,
  type ActionDefinition,
} from "@extension-twitch/contracts/game-definition";
import { comparison } from "../lib/creator-model";
import { Field, ScalarField } from "./creator-fields";
const operators = {
  eq: "Égal",
  ne: "Différent",
  gt: "Supérieur",
  lt: "Inférieur",
  gte: "Supérieur ou égal",
  lte: "Inférieur ou égal",
  and: "ET",
  or: "OU",
  not: "NON",
  add: "Addition",
  subtract: "Soustraction",
  multiply: "Multiplication",
} as const;
type Operator = keyof typeof operators;
const literal = (value: number | boolean = 0): Expression => ({
  kind: "literal",
  value,
});
export function ExpressionEditor({
  value,
  onChange,
  definition,
  action,
  label = "Expression",
  parameters = false,
  depth = 0,
}: {
  value: Expression;
  onChange: (v: Expression) => void;
  definition: GameDefinition;
  action: ActionDefinition;
  label?: string;
  parameters?: boolean;
  depth?: number;
}) {
  const [advanced, setAdvanced] = useState(false),
    [text, setText] = useState(""),
    [error, setError] = useState("");
  const mode =
    value.kind === "operator"
      ? value.operator
      : value.kind === "literal"
        ? `literal-${typeof value.value}`
        : value.kind;
  function choose(mode: string) {
    if (mode.startsWith("literal-"))
      onChange({
        kind: "literal",
        value:
          mode === "literal-number"
            ? 0
            : mode === "literal-boolean"
              ? true
              : "",
      });
    else if (
      mode === "variable" ||
      mode === "configuration" ||
      mode === "parameter"
    )
      onChange({
        kind: mode,
        id:
          (mode === "variable"
            ? definition.variables
            : mode === "configuration"
              ? definition.configuration
              : action.parameters)[0]?.id ?? "missing",
      });
    else {
      const op = mode as Operator;
      const bool = ["and", "or", "not"].includes(op);
      const args = value.kind === "operator" ? value.args : [];
      const a = args[0] ?? literal(bool ? true : 0),
        b = args[1] ?? literal(bool ? true : 0);
      onChange(
        ["ne", "gt", "lte"].includes(op)
          ? comparison(op as "ne" | "gt" | "lte", a, b)
          : {
              kind: "operator",
              operator: op as Extract<
                Expression,
                { kind: "operator" }
              >["operator"],
              args: op === "not" ? [a] : [a, b],
            },
      );
    }
  }
  const sources =
    value.kind === "variable"
      ? definition.variables
      : value.kind === "configuration"
        ? definition.configuration
        : action.parameters;
  return (
    <fieldset className="expression-node">
      <legend>{label}</legend>
      <Field label={`Source · ${label}`}>
        <select
          aria-label={`Source · ${label}`}
          value={mode}
          onChange={(e) => choose(e.target.value)}
        >
          <optgroup label="Valeurs">
            <option value="literal-number">Nombre</option>
            <option value="literal-string">Texte</option>
            <option value="literal-boolean">Vrai / faux</option>
            <option value="variable" disabled={!definition.variables.length}>
              Variable
            </option>
            <option
              value="configuration"
              disabled={!definition.configuration.length}
            >
              Paramètre d’émission
            </option>
            {parameters && (
              <option value="parameter" disabled={!action.parameters.length}>
                Entrée de l’action
              </option>
            )}
          </optgroup>
          {depth < 4 && (
            <optgroup label="Opérations">
              {Object.entries(operators).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </Field>
      {value.kind === "literal" ? (
        <ScalarField
          label={`Valeur · ${label}`}
          value={value.value}
          onChange={(value) => onChange({ kind: "literal", value })}
        />
      ) : value.kind !== "operator" ? (
        <Field label={`Référence · ${label}`}>
          <select
            aria-label={`Référence · ${label}`}
            value={value.id}
            onChange={(e) => onChange({ ...value, id: e.target.value })}
          >
            {!sources.some((s) => s.id === value.id) && (
              <option value={value.id}>Référence manquante : {value.id}</option>
            )}
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.id})
              </option>
            ))}
          </select>
        </Field>
      ) : (
        value.args.map((arg, i) => (
          <ExpressionEditor
            key={i}
            value={arg}
            onChange={(next) =>
              onChange({
                ...value,
                args: value.args.map((old, j) => (j === i ? next : old)),
              })
            }
            definition={definition}
            action={action}
            parameters={parameters}
            label={`${label} · ${i + 1}`}
            depth={depth + 1}
          />
        ))
      )}
      {depth === 0 && (
        <details
          onToggle={(e) => {
            if (e.currentTarget.open) {
              setAdvanced(true);
              setText(JSON.stringify(value, null, 2));
            }
          }}
        >
          <summary>Édition avancée de cette expression</summary>
          {advanced && (
            <>
              <p>
                L’arbre est conservé intégralement. Appliquer remplace
                uniquement cette expression.
              </p>
              <textarea
                aria-label={`JSON · ${label}`}
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  try {
                    onChange(
                      expressionSchema.parse(JSON.parse(text) as unknown),
                    );
                    setError("");
                  } catch {
                    setError(
                      "Expression invalide ou profondeur supérieure à 4. Votre saisie reste disponible.",
                    );
                  }
                }}
              >
                Appliquer l’expression
              </button>
              {error && <p role="alert">{error}</p>}
            </>
          )}
        </details>
      )}
    </fieldset>
  );
}
