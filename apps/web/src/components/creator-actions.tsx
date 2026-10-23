"use client";
import { useState } from "react";
import type {
  ActionDefinition,
  GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import { nextId } from "../lib/creator-model";
import { describeAction, expressionReferences } from "../lib/creator-readable";
import { EffectsEditor } from "./creator-effects";
import { ExpressionEditor } from "./expression-editor";
import { TextField, ValueFields, ScalarField } from "./creator-fields";
export function ActionsEditor({
  definition: d,
  onChange,
}: {
  definition: GameDefinition;
  onChange: (d: GameDefinition) => void;
}) {
  const [selected, setSelected] = useState(d.actions[0]?.id ?? "");
  const index = d.actions.findIndex((a) => a.id === selected),
    a = d.actions[index];
  function replace(action: ActionDefinition) {
    const expression =
      !!action.guard ||
      action.effects.some(
        (e) => e.type !== "reveal" && e.value.from === "expression",
      );
    onChange({
      ...d,
      ...(expression && d.schemaVersion === 1
        ? { schemaVersion: 2 as const, engineVersion: 2 as const }
        : {}),
      actions: d.actions.map((old, i) => (i === index ? action : old)),
    });
    if (action.id !== a?.id) setSelected(action.id);
  }
  function update(patch: Partial<ActionDefinition>) {
    if (a) replace({ ...a, ...patch });
  }
  return (
    <section>
      <h2>Que peuvent faire les joueurs ?</h2>
      <p>
        Chaque action devient un bouton pour les personnes autorisées.
        Choisissez qui peut l’utiliser, à quel moment, et ce que cela change.
      </p>
      <nav className="studio-action-tabs" aria-label="Actions du jeu">
        {d.actions.map((action) => (
          <button
            className="secondary-button"
            key={action.id}
            aria-pressed={selected === action.id}
            onClick={() => setSelected(action.id)}
          >
            {action.label}
          </button>
        ))}
      </nav>
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
      {d.actions.length >= 8 && (
        <p>
          Votre jeu contient déjà 8 actions. Modifiez une action existante ou
          supprimez-en une pour en ajouter une autre.
        </p>
      )}
      {a && (
        <article className="studio-card" key={index}>
          <TextField
            label="Nom du bouton"
            value={a.label}
            onChange={(label) => update({ label })}
          />
          <TextField
            label="À quoi sert cette action ?"
            value={a.description ?? ""}
            max={240}
            onChange={(description) => update({ description })}
          />
          <p className="creator-rule-preview" aria-label="Résumé de la règle">
            {describeAction(a, d)}
          </p>
          {a.operations?.length && (
            <p className="lobby-hint">
              Cette action utilise les règles de distribution ou de vote. Leurs
              paramètres sont dans Distribution et vote. Ses opérations sont
              conservées lors de vos autres modifications.
            </p>
          )}
          <details open className="action-question">
            <summary>1. Qui peut effectuer cette action ?</summary>
            <p>
              Le Game Master pilote la partie ; les rôles de joueurs agissent
              pour eux-mêmes.
            </p>
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
          </details>
          <details className="action-question">
            <summary>2. À quel moment ?</summary>
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
          </details>
          <details className="action-question">
            <summary>3. Que doit saisir le joueur ?</summary>
            {!a.parameters.length && (
              <p>
                Un appui sur le bouton suffit. Ajoutez un champ si le joueur
                doit écrire une réponse ou choisir une quantité.
              </p>
            )}
            {a.parameters.map((p, i) => {
              const change = (patch: Partial<typeof p>) =>
                update({
                  parameters: a.parameters.map((old, j) =>
                    i === j ? { ...p, ...patch } : old,
                  ),
                });
              return (
                <fieldset className="studio-card" key={i}>
                  <legend>Champ {i + 1}</legend>
                  <TextField
                    label={`Question affichée au joueur ${i + 1}`}
                    value={p.label}
                    onChange={(label) => change({ label })}
                  />
                  <ValueFields
                    prefix={p.label || "ce champ"}
                    value={p.value}
                    onChange={(value) => change({ value })}
                  />
                  <details>
                    <summary>Référence technique du champ</summary>
                    <TextField
                      label={`Référence du champ ${i + 1}`}
                      value={p.id}
                      max={40}
                      onChange={(id) => change({ id })}
                    />
                  </details>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (
                        a.effects.some(
                          (e) =>
                            e.type !== "reveal" &&
                            ((e.value.from === "parameter" &&
                              e.value.id === p.id) ||
                              (e.value.from === "expression" &&
                                expressionReferences(
                                  e.value.expression,
                                  "parameter",
                                  p.id,
                                ))),
                        )
                      ) {
                        window.alert(
                          "Une conséquence utilise cette saisie. Modifiez-la avant de supprimer le champ.",
                        );
                        return;
                      }
                      if (window.confirm("Supprimer ce champ de saisie ?"))
                        update({
                          parameters: a.parameters.filter((_, j) => i !== j),
                        });
                    }}
                  >
                    Supprimer ce champ
                  </button>
                </fieldset>
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
                      id: nextId("champ", a.parameters),
                      label: "Valeur à donner",
                      value: { type: "integer", min: 0, max: 100, initial: 1 },
                    },
                  ],
                })
              }
            >
              Ajouter un champ à remplir
            </button>
            {a.parameters.length >= 4 && (
              <p>Cette action a atteint la limite de 4 champs.</p>
            )}
          </details>
          <details className="action-question">
            <summary>4. Quand cette action est-elle possible ?</summary>
            <p>
              Les personnes et étapes choisies ci-dessus sont toujours
              contrôlées. Ajoutez une condition pour limiter davantage cette
              action. Toutes les règles affichées doivent être satisfaites.
            </p>
            {!a.conditions.length && !a.guard && (
              <p>Aucune condition supplémentaire.</p>
            )}
            {a.conditions.map((c, i) => (
              <fieldset className="studio-card" key={i}>
                <legend>Une information doit avoir cette valeur</legend>
                <label>
                  Cette donnée
                  <select
                    aria-label="Cette donnée"
                    value={c.variable}
                    onChange={(e) =>
                      update({
                        conditions: a.conditions.map((old, j) =>
                          j === i
                            ? {
                                variable: e.target.value,
                                equals:
                                  d.variables.find(
                                    (v) => v.id === e.target.value,
                                  )?.value.initial ?? false,
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
                </label>
                <ScalarField
                  label="Doit être égale à"
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
                    update({
                      conditions: a.conditions.filter((_, j) => j !== i),
                    })
                  }
                >
                  Retirer cette condition
                </button>
              </fieldset>
            ))}
            {a.guard && (
              <>
                <ExpressionEditor
                  value={a.guard}
                  onChange={(guard) => update({ guard })}
                  definition={d}
                  action={a}
                />
                <button
                  className="secondary-button"
                  onClick={() => {
                    if (window.confirm("Retirer cette condition ?")) {
                      const { guard: _removed, ...next } = a;
                      replace(next);
                    }
                  }}
                >
                  Retirer la règle composée
                </button>
              </>
            )}
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
                Vérifier la valeur d’une donnée
              </button>
              {!a.guard && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    update({
                      guard: {
                        kind: "operator",
                        operator: "eq",
                        args: [
                          d.variables[0]
                            ? { kind: "variable", id: d.variables[0].id }
                            : { kind: "literal", value: true },
                          {
                            kind: "literal",
                            value: d.variables[0]?.value.initial ?? true,
                          },
                        ],
                      },
                    })
                  }
                >
                  Ajouter une règle composée
                </button>
              )}
            </div>
            {a.conditions.length >= 4 && (
              <p>
                Vous avez déjà 4 vérifications simples. Une règle composée
                permet de combiner les conditions.
              </p>
            )}
          </details>
          <details className="action-question">
            <summary>5. Que se passe-t-il ensuite ?</summary>
            <EffectsEditor
              action={a}
              definition={d}
              onChange={(effects) => update({ effects })}
            />
          </details>
          <details className="action-question">
            <summary>6. Quelle est la prochaine étape ?</summary>
            <label>
              Après cette action
              <select
                aria-label="Après cette action"
                value={a.nextPhase ?? ""}
                onChange={(e) => {
                  const { nextPhase: _old, ...next } = a;
                  replace({
                    ...next,
                    ...(e.target.value ? { nextPhase: e.target.value } : {}),
                  });
                }}
              >
                <option value="">Rester à cette étape</option>
                {d.phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    Passer à {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="creator-check">
              <input
                type="checkbox"
                checked={a.confirmation}
                onChange={(e) => update({ confirmation: e.target.checked })}
              />
              Demander confirmation avant de jouer cette action
            </label>
          </details>
          <details>
            <summary>Référence technique de l’action</summary>
            <TextField
              label="Référence de l’action"
              value={a.id}
              max={40}
              onChange={(id) => update({ id })}
            />
          </details>
          <button
            className="secondary-button"
            onClick={() => {
              if (
                window.confirm(
                  `Supprimer « ${a.label} » et toutes ses conséquences ?`,
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
