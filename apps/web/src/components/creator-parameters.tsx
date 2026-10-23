"use client";
import { useState } from "react";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
export function CreatorParameters({
  definition,
  locked,
  onChange,
}: {
  definition: GameDefinition;
  locked: boolean;
  onChange: (definition: GameDefinition) => void;
}) {
  return (
    <details open>
      <summary>Paramètres des actions</summary>
      <div className="creator-parameter-grid">
        {definition.actions.flatMap((action, index) =>
          action.parameters.map((parameter) => (
            <Parameter
              key={`${action.id}:${parameter.id}`}
              definition={definition}
              actionIndex={index}
              parameterId={parameter.id}
              locked={locked}
              onChange={onChange}
            />
          )),
        )}
      </div>
      <p className="lobby-hint">
        Les libellés sont libres : ajustez-les lorsque vous changez une borne.
        Retrouvez les variables, rôles, conditions, effets et phases dans les
        sections du Studio. Les scènes graphiques restent prévues pour 4C.
      </p>
    </details>
  );
}
function Parameter({
  definition,
  actionIndex,
  parameterId,
  locked,
  onChange,
}: {
  definition: GameDefinition;
  actionIndex: number;
  parameterId: string;
  locked: boolean;
  onChange: (definition: GameDefinition) => void;
}) {
  const action = definition.actions[actionIndex]!,
    parameter = action.parameters.find((p) => p.id === parameterId)!;
  const [label, setLabel] = useState(parameter.label);
  return (
    <div className="lobby-form">
      <label>
        Libellé · {action.label}
        <input
          aria-label={`Libellé de ${action.id}.${parameter.id}`}
          value={label}
          maxLength={80}
          disabled={locked}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            if (!label.trim()) {
              setLabel(parameter.label);
              return;
            }
            if (label === parameter.label) return;
            const copy = structuredClone(definition);
            copy.actions[actionIndex]!.parameters.find(
              (p) => p.id === parameterId,
            )!.label = label;
            onChange(copy);
          }}
        />
      </label>
      {parameter.value.type === "integer" && (
        <label>
          Maximum · {parameter.label}
          <input
            type="number"
            aria-label={`Maximum de ${action.id}.${parameter.id}`}
            value={parameter.value.max}
            min={parameter.value.min}
            max={100000}
            disabled={locked}
            onChange={(e) => {
              const copy = structuredClone(definition);
              const field = copy.actions[actionIndex]!.parameters.find(
                (p) => p.id === parameterId,
              )!;
              if (field.value.type === "integer") {
                field.value.max = Math.max(
                  field.value.min,
                  Math.min(100000, Number(e.target.value)),
                );
                field.value.initial = Math.min(
                  field.value.initial,
                  field.value.max,
                );
              }
              onChange(copy);
            }}
          />
        </label>
      )}
    </div>
  );
}
