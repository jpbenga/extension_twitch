"use client";
import type {
  GameDefinition,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import { ScalarField } from "./creator-fields";
export function PlayConfiguration({
  definition,
  values,
  onChange,
}: {
  definition: GameDefinition;
  values: Record<string, Scalar>;
  onChange: (v: Record<string, Scalar>) => void;
}) {
  return (
    <div className="lobby-form">
      {definition.configuration.map((field) => (
        <div key={field.id}>
          <ScalarField
            label={field.label}
            value={values[field.id] ?? field.value.initial}
            onChange={(value) => onChange({ ...values, [field.id]: value })}
          />
          {field.value.type === "integer" && (
            <small>
              De {field.value.min} à {field.value.max}.
            </small>
          )}
          {field.visibility === "gm" && field.value.type === "text" && (
            <small>Information de préparation privée, réservée au GM.</small>
          )}
        </div>
      ))}
    </div>
  );
}
