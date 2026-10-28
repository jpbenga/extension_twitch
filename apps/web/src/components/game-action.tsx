"use client";
import { useConfirm } from "./ui/feedback";
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
  stitch = false,
}: {
  action: GameProjection["actions"][number];
  runId: string;
  locked: boolean;
  stitch?: boolean;
  send: (action: LobbyAction) => Promise<void | boolean>;
}) {
  const confirm = useConfirm();
  const [values, setValues] = useState<Record<string, Scalar>>(() =>
    Object.fromEntries(action.parameters.map((p) => [p.id, p.value.initial])),
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    const execute = () =>
      send({
        type: "game.action",
        runId,
        actionId: action.id,
        parameters: values,
      });
    if (action.confirmation)
      await confirm({
        title: action.label + " ?",
        description: stitch
          ? "Le décompte sera publié. Le joueur seul en tête sera éliminé et son camp révélé. En cas d’égalité, personne ne sera éliminé."
          : "Les effets de cette action seront appliqués à la partie et les informations prévues pourront être révélées.",
        ...(stitch
          ? {
              consequences: [
                "Si la partie se termine, les mots et tous les camps seront révélés.",
              ],
              presentation: "stitch" as const,
            }
          : {}),
        confirmLabel: stitch ? "Révéler le résultat" : action.label,
        tone: stitch ? "neutral" : "warning",
        onConfirm: execute,
      });
    else await execute();
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
