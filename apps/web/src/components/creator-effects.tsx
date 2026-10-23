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
      <h4>Les conséquences de cette action</h4>
      <p className="lobby-hint">
        Les conséquences sont appliquées dans cet ordre. Si l’une échoue, aucun
        changement n’est conservé. Pour retirer des points, utilisez un nombre
        négatif. Seul le Game Master peut révéler une information privée.
      </p>
      {effects.map((effect, i) => (
        <article className="studio-card" key={i}>
          <h4>Conséquence {i + 1}</h4>
          <div className="studio-grid">
            <Field label={`Que faut-il faire ? Conséquence ${i + 1}`}>
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
                <option value="set">Remplacer une valeur</option>
                <option value="increment">
                  Ajouter ou retirer une quantité
                </option>
                <option value="reveal">Révéler publiquement</option>
              </select>
            </Field>
            <Field label={`Quelle donnée modifier ? Conséquence ${i + 1}`}>
              <select
                value={effect.variable}
                onChange={(e) =>
                  update(i, { ...effect, variable: e.target.value })
                }
              >
                {definition.variables.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {effect.type !== "reveal" && (
            <>
              <Field label={`D’où vient la valeur ? Conséquence ${i + 1}`}>
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
                    La saisie du joueur
                  </option>
                  <option
                    value="configuration"
                    disabled={!definition.configuration.length}
                  >
                    Un réglage de la partie
                  </option>
                  <option value="expression">Un calcul</option>
                </select>
              </Field>
              {effect.value.from === "literal" ? (
                <ScalarField
                  label={`Quantité ou valeur, conséquence ${i + 1}`}
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
                  label={`Calcul de la conséquence ${i + 1}`}
                />
              ) : (
                <Field
                  label={`Quelle saisie ou quel réglage ? Conséquence ${i + 1}`}
                >
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
              Monter la conséquence {i + 1}
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
              Descendre la conséquence {i + 1}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                if (window.confirm(`Supprimer la conséquence ${i + 1} ?`))
                  onChange(effects.filter((_, j) => j !== i));
              }}
            >
              Supprimer la conséquence {i + 1}
            </button>
          </div>
        </article>
      ))}
      {!definition.variables.length && (
        <p>Ajoutez d’abord une donnée dans Données pour pouvoir la modifier.</p>
      )}
      {effects.length >= 6 && (
        <p>
          Cette action contient déjà 6 conséquences. Modifiez-les ou regroupez
          vos règles.
        </p>
      )}
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
        Ajouter une conséquence
      </button>
    </section>
  );
}
