"use client";
import { useState } from "react";
import type {
  ActionDefinition,
  GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import { nextId } from "../lib/creator-model";
import { EffectsEditor } from "./creator-effects";
import { ExpressionEditor } from "./expression-editor";
import { Field, ScalarField, TextField, ValueFields } from "./creator-fields";
export function ActionsEditor({
  definition: d,
  onChange,
  focusRules = false,
}: {
  definition: GameDefinition;
  onChange: (d: GameDefinition) => void;
  focusRules?: boolean;
}) {
  const [selected, setSelected] = useState(d.actions[0]?.id ?? "");
  const index = d.actions.findIndex((a) => a.id === selected),
    a = d.actions[index];
  function update(patch: Partial<ActionDefinition>) {
    if (!a) return;
    onChange({
      ...d,
      actions: d.actions.map((old, i) =>
        i === index ? { ...a, ...patch } : old,
      ),
    });
    if (patch.id) setSelected(patch.id);
  }
  return (
    <section>
      <h3>{focusRules ? "Conditions et effets" : "Actions"}</h3>
      <p>
        Choisissez une action pour régler qui peut agir, à quel moment et avec
        quels effets. Les événements personnalisés ne sont pas encore
        disponibles.
      </p>
      <div className="studio-action-tabs">
        {d.actions.map((action) => (
          <button
            key={action.id}
            className={`secondary-button ${selected === action.id ? "selected" : ""}`}
            aria-pressed={selected === action.id}
            onClick={() => setSelected(action.id)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button
        className="secondary-button"
        disabled={d.actions.length >= 8}
        onClick={() => {
          const id = nextId("action", d.actions);
          onChange({
            ...d,
            actions: [
              ...d.actions,
              {
                id,
                label: "Nouvelle action",
                roles: [d.defaultPlayerRole],
                phases: [d.initialPhase],
                parameters: [],
                conditions: [],
                effects: [],
                confirmation: false,
              },
            ],
          });
          setSelected(id);
        }}
      >
        Ajouter une action
      </button>
      {a && (
        <article className="studio-card" key={index}>
          {!focusRules && (
            <>
              <div className="studio-grid">
                <TextField
                  label="Nom de l’action"
                  value={a.label}
                  onChange={(label) => update({ label })}
                />
                <TextField
                  label="Identifiant de l’action"
                  value={a.id}
                  max={40}
                  onChange={(id) => update({ id })}
                />
                <TextField
                  label="Description de l’action"
                  value={a.description ?? ""}
                  max={240}
                  onChange={(description) => update({ description })}
                />
              </div>
              <fieldset>
                <legend>Rôles autorisés</legend>
                {d.roles
                  .filter((r) => r.base !== "spectator")
                  .map((r) => (
                    <label className="creator-check" key={r.id}>
                      <input
                        type="checkbox"
                        checked={a.roles.includes(r.id)}
                        onChange={(e) =>
                          update({
                            roles: e.target.checked
                              ? [...a.roles, r.id]
                              : a.roles.filter((id) => id !== r.id),
                          })
                        }
                      />
                      {r.label}
                    </label>
                  ))}
              </fieldset>
              <fieldset>
                <legend>Phases disponibles</legend>
                {d.phases.map((p) => (
                  <label className="creator-check" key={p.id}>
                    <input
                      type="checkbox"
                      checked={a.phases.includes(p.id)}
                      onChange={(e) =>
                        update({
                          phases: e.target.checked
                            ? [...a.phases, p.id]
                            : a.phases.filter((id) => id !== p.id),
                        })
                      }
                    />
                    {p.label}
                  </label>
                ))}
              </fieldset>
              <label className="creator-check">
                <input
                  type="checkbox"
                  checked={a.confirmation}
                  onChange={(e) => update({ confirmation: e.target.checked })}
                />
                Demander une confirmation avant exécution
              </label>
              <h4>Paramètres à saisir</h4>
              {a.parameters.map((p, i) => {
                const change = (patch: Partial<typeof p>) =>
                  update({
                    parameters: a.parameters.map((old, j) =>
                      i === j ? { ...p, ...patch } : old,
                    ),
                  });
                return (
                  <article className="studio-card" key={i}>
                    <TextField
                      label={`Nom du paramètre ${i + 1}`}
                      value={p.label}
                      onChange={(label) => change({ label })}
                    />
                    <TextField
                      label={`Identifiant du paramètre ${i + 1}`}
                      value={p.id}
                      max={40}
                      onChange={(id) => change({ id })}
                    />
                    <ValueFields
                      prefix={`paramètre ${i + 1}`}
                      value={p.value}
                      onChange={(value) => change({ value })}
                    />
                    <button
                      className="secondary-button"
                      onClick={() => {
                        const id = p.id;
                        const inUse = a.effects.some(
                          (e) =>
                            e.type !== "reveal" &&
                            ((e.value.from === "parameter" &&
                              e.value.id === id) ||
                              (e.value.from === "expression" &&
                                JSON.stringify(e.value.expression).includes(
                                  `"id":"${id}"`,
                                ))),
                        );
                        if (inUse) {
                          window.alert(
                            "Ce paramètre est utilisé par un effet. Modifiez cet effet avant de supprimer le paramètre.",
                          );
                          return;
                        }
                        if (window.confirm(`Supprimer « ${p.label} » ?`))
                          update({
                            parameters: a.parameters.filter((_, j) => j !== i),
                          });
                      }}
                    >
                      Supprimer le paramètre {p.label}
                    </button>
                  </article>
                );
              })}
              <button
                className="secondary-button"
                disabled={a.parameters.length >= 4}
                onClick={() =>
                  update({
                    parameters: [
                      ...a.parameters,
                      {
                        id: nextId("parametre", a.parameters),
                        label: "Valeur",
                        value: {
                          type: "integer",
                          min: 0,
                          max: 100,
                          initial: 1,
                        },
                      },
                    ],
                  })
                }
              >
                Ajouter un paramètre
              </button>
            </>
          )}
          <h4>Conditions d’autorisation</h4>
          <p className="lobby-hint">
            Toutes les égalités existantes et la condition composée doivent être
            satisfaites. Le rôle et la phase sont toujours contrôlés par le
            serveur.
          </p>
          {a.conditions.map((c, i) => (
            <div className="studio-card" key={i}>
              <Field label={`Variable de la condition ${i + 1}`}>
                <select
                  value={c.variable}
                  onChange={(e) =>
                    update({
                      conditions: a.conditions.map((old, j) =>
                        j === i
                          ? {
                              variable: e.target.value,
                              equals:
                                d.variables.find((v) => v.id === e.target.value)
                                  ?.value.initial ?? false,
                            }
                          : old,
                      ),
                    })
                  }
                >
                  {d.variables.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
              <ScalarField
                label={`Égal à · condition ${i + 1}`}
                value={c.equals}
                onChange={(equals) =>
                  update({
                    conditions: a.conditions.map((old, j) =>
                      j === i ? { ...c, equals } : old,
                    ),
                  })
                }
              />
              <button
                className="secondary-button"
                onClick={() =>
                  update({ conditions: a.conditions.filter((_, j) => j !== i) })
                }
              >
                Retirer la condition {i + 1}
              </button>
            </div>
          ))}
          <div className="studio-inline">
            <button
              className="secondary-button"
              disabled={!d.variables.length || a.conditions.length >= 4}
              onClick={() =>
                update({
                  conditions: [
                    ...a.conditions,
                    {
                      variable: d.variables[0]!.id,
                      equals: d.variables[0]!.value.initial,
                    },
                  ],
                })
              }
            >
              Ajouter une égalité
            </button>
            {!a.guard && (
              <button
                className="secondary-button"
                disabled={d.schemaVersion !== 2}
                onClick={() =>
                  update({ guard: { kind: "literal", value: true } })
                }
              >
                Ajouter une condition composée
              </button>
            )}
          </div>
          {a.guard && (
            <>
              <ExpressionEditor
                label="Condition d’autorisation"
                value={a.guard}
                onChange={(guard) => update({ guard })}
                definition={d}
                action={a}
              />
              <button
                className="secondary-button"
                onClick={() => {
                  if (!window.confirm("Retirer cette condition ?")) return;
                  const { guard: _removed, ...rest } = a;
                  onChange({
                    ...d,
                    actions: d.actions.map((old, i) =>
                      i === index ? rest : old,
                    ),
                  });
                }}
              >
                Retirer la condition composée
              </button>
            </>
          )}
          <EffectsEditor
            action={a}
            definition={d}
            onChange={(effects) => update({ effects })}
          />
          <Field label="Après cette action">
            <select
              value={a.nextPhase ?? ""}
              onChange={(e) => {
                const { nextPhase: _removed, ...rest } = a;
                onChange({
                  ...d,
                  actions: d.actions.map((old, i) =>
                    i === index
                      ? {
                          ...rest,
                          ...(e.target.value
                            ? { nextPhase: e.target.value }
                            : {}),
                        }
                      : old,
                  ),
                });
              }}
            >
              <option value="">Rester dans la phase courante</option>
              {d.phases.map((p) => (
                <option key={p.id} value={p.id}>
                  Aller vers {p.label}
                </option>
              ))}
            </select>
          </Field>
          <button
            className="secondary-button"
            onClick={() => {
              if (
                window.confirm(
                  `Supprimer l’action « ${a.label} » et ses effets ?`,
                )
              ) {
                onChange({
                  ...d,
                  actions: d.actions.filter((_, i) => i !== index),
                });
                setSelected(d.actions.find((_, i) => i !== index)?.id ?? "");
              }
            }}
          >
            Supprimer cette action
          </button>
        </article>
      )}
    </section>
  );
}
