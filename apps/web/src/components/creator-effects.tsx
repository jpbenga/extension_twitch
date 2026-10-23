"use client";
import type {
  ActionDefinition,
  GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import { ExpressionEditor } from "./expression-editor";
import { Field, ScalarField } from "./creator-fields";
type Effect = ActionDefinition["effects"][number];
export function EffectsEditor({
  action,
  definition,
  onChange,
}: {
  action: ActionDefinition;
  definition: GameDefinition;
  onChange: (effects: Effect[]) => void;
}) {
  const effects = action.effects;
  function update(index: number, effect: Effect) {
    onChange(effects.map((old, i) => (i === index ? effect : old)));
  }
  return (
    <section>
      <h4>Effets, dans l’ordre</h4>
      <p className="lobby-hint">
        Tous les effets réussissent ensemble ou la commande entière est annulée.
        Pour soustraire, utilisez un incrément négatif. Révéler est réservé au
        GM.
      </p>
      {effects.map((effect, i) => (
        <article className="studio-card" key={i}>
          <h4>Effet {i + 1}</h4>
          <div className="studio-grid">
            <Field label={`Opération de l’effet ${i + 1}`}>
              <select
                value={effect.type}
                onChange={(e) => {
                  const type = e.target.value as Effect["type"];
                  const spec = definition.variables.find(
                    (v) => v.id === effect.variable,
                  )?.value;
                  update(
                    i,
                    type === "reveal"
                      ? { type, variable: effect.variable }
                      : {
                          type,
                          variable: effect.variable,
                          value: {
                            from: "literal",
                            value:
                              type === "increment" ? 1 : (spec?.initial ?? 0),
                          },
                        },
                  );
                }}
              >
                <option value="set">Définir une variable</option>
                <option value="increment">Ajouter / soustraire</option>
                <option value="reveal">Révéler publiquement</option>
              </select>
            </Field>
            <Field label={`Variable de l’effet ${i + 1}`}>
              <select
                value={effect.variable}
                onChange={(e) =>
                  update(i, { ...effect, variable: e.target.value })
                }
              >
                {definition.variables.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} ({v.id})
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {effect.type !== "reveal" && (
            <>
              <Field label={`Source de l’effet ${i + 1}`}>
                <select
                  value={effect.value.from}
                  onChange={(e) => {
                    const from = e.target.value;
                    update(i, {
                      ...effect,
                      value:
                        from === "literal"
                          ? {
                              from,
                              value:
                                effect.type === "increment"
                                  ? 1
                                  : (definition.variables.find(
                                      (v) => v.id === effect.variable,
                                    )?.value.initial ?? 0),
                            }
                          : from === "expression"
                            ? {
                                from,
                                expression: { kind: "literal", value: 0 },
                              }
                            : from === "parameter"
                              ? {
                                  from,
                                  id: action.parameters[0]?.id ?? "missing",
                                }
                              : {
                                  from: "configuration",
                                  id:
                                    definition.configuration[0]?.id ??
                                    "missing",
                                },
                    });
                  }}
                >
                  <option value="literal">Valeur fixe</option>
                  <option
                    value="parameter"
                    disabled={!action.parameters.length}
                  >
                    Entrée de l’action
                  </option>
                  <option
                    value="configuration"
                    disabled={!definition.configuration.length}
                  >
                    Paramètre d’émission
                  </option>
                  <option
                    value="expression"
                    disabled={definition.schemaVersion !== 2}
                  >
                    Expression calculée (v2)
                  </option>
                </select>
              </Field>
              {effect.value.from === "literal" ? (
                <ScalarField
                  label={`Valeur de l’effet ${i + 1}`}
                  value={effect.value.value}
                  onChange={(value) =>
                    update(i, { ...effect, value: { from: "literal", value } })
                  }
                />
              ) : effect.value.from === "expression" ? (
                <ExpressionEditor
                  value={effect.value.expression}
                  onChange={(expression) =>
                    update(i, {
                      ...effect,
                      value: { from: "expression", expression },
                    })
                  }
                  definition={definition}
                  action={action}
                  parameters
                  label={`Calcul de l’effet ${i + 1}`}
                />
              ) : (
                <Field label={`Référence de l’effet ${i + 1}`}>
                  <select
                    value={effect.value.id}
                    onChange={(e) =>
                      update(i, {
                        ...effect,
                        value: {
                          from:
                            effect.value.from === "parameter"
                              ? "parameter"
                              : "configuration",
                          id: e.target.value,
                        },
                      })
                    }
                  >
                    {(effect.value.from === "parameter"
                      ? action.parameters
                      : definition.configuration
                    ).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}
          <div className="studio-inline">
            <button
              className="secondary-button"
              disabled={i === 0}
              onClick={() => {
                const copy = [...effects];
                [copy[i - 1], copy[i]] = [copy[i]!, copy[i - 1]!];
                onChange(copy);
              }}
            >
              Monter l’effet {i + 1}
            </button>
            <button
              className="secondary-button"
              disabled={i === effects.length - 1}
              onClick={() => {
                const copy = [...effects];
                [copy[i], copy[i + 1]] = [copy[i + 1]!, copy[i]!];
                onChange(copy);
              }}
            >
              Descendre l’effet {i + 1}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                if (window.confirm(`Supprimer l’effet ${i + 1} ?`))
                  onChange(effects.filter((_, j) => j !== i));
              }}
            >
              Supprimer l’effet {i + 1}
            </button>
          </div>
        </article>
      ))}
      <button
        className="secondary-button"
        disabled={!definition.variables.length || effects.length >= 6}
        onClick={() =>
          onChange([
            ...effects,
            {
              type: "increment",
              variable: definition.variables[0]!.id,
              value: { from: "literal", value: 1 },
            },
          ])
        }
      >
        Ajouter un effet
      </button>
    </section>
  );
}
