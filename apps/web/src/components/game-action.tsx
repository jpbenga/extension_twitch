"use client";
import { useState, type FormEvent } from "react";
import type {
  GameProjection,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import type { LobbyAction } from "@extension-twitch/contracts/sessions";
export function ActionForm({
  action,
  runId,
  locked,
  send,
}: {
  action: GameProjection["actions"][number];
  runId: string;
  locked: boolean;
  send: (action: LobbyAction) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, Scalar>>(() =>
    Object.fromEntries(action.parameters.map((p) => [p.id, p.value.initial])),
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    if (
      action.confirmation &&
      !window.confirm(
        "Confirmer cette action et les informations rendues publiques ?",
      )
    )
      return;
    void send({
      type: "game.action",
      runId,
      actionId: action.id,
      parameters: values,
    });
  }
  return (
    <form className="lobby-form game-action" onSubmit={submit}>
      {action.parameters.map((p) => (
        <label key={p.id}>
          {p.label}
          {p.value.type === "boolean" ? (
            <select
              value={String(values[p.id])}
              disabled={locked}
              onChange={(e) =>
                setValues({ ...values, [p.id]: e.target.value === "true" })
              }
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          ) : (
            <input
              type={p.value.type === "integer" ? "number" : "text"}
              required
              disabled={locked}
              value={String(values[p.id] ?? "")}
              min={p.value.type === "integer" ? p.value.min : undefined}
              max={p.value.type === "integer" ? p.value.max : undefined}
              step={p.value.type === "integer" ? 1 : undefined}
              maxLength={
                p.value.type === "text" ? p.value.maxLength : undefined
              }
              onChange={(e) =>
                setValues({
                  ...values,
                  [p.id]:
                    p.value.type === "integer"
                      ? Number(e.target.value)
                      : e.target.value,
                })
              }
            />
          )}
        </label>
      ))}
      <button className="primary-button" disabled={locked}>
        {action.label}
      </button>
    </form>
  );
}
