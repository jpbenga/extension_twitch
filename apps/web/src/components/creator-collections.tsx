"use client";
import { useState } from "react";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
import { nextId, references, unreachablePhases } from "../lib/creator-model";
import { Field, TextField, ValueFields } from "./creator-fields";
type Props = {
  definition: GameDefinition;
  onChange: (d: GameDefinition) => void;
  report: (message: string) => void;
};
export function RolesEditor({ definition: d, onChange, report }: Props) {
  const [selected, setSelected] = useState(0);
  return (
    <section>
      <h2>Qui participe ?</h2>
      <p>
        Préparez les rôles de votre jeu. Les personnes rejoindront ensuite une
        partie et le Game Master leur attribuera un rôle.
      </p>
      <nav className="studio-action-tabs" aria-label="Rôles">
        {d.roles.map((r, i) => (
          <button
            className="secondary-button"
            key={i}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            {r.label}
          </button>
        ))}
      </nav>
      <p>
        Le Game Master pilote la partie. Les autres rôles correspondent aux
        joueurs. Choisissez ensuite leurs actions dans Actions.
      </p>
      <Field label="Rôle attribué aux nouveaux joueurs">
        <select
          value={d.defaultPlayerRole}
          onChange={(e) =>
            onChange({ ...d, defaultPlayerRole: e.target.value })
          }
        >
          {d.roles
            .filter((r) => r.base === "player")
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
        </select>
      </Field>
      {d.roles.map(
        (r, i) =>
          selected === i && (
            <article className="studio-card" key={i}>
              <span className="eyebrow">
                {r.base === "gm"
                  ? "AUTORITÉ GM"
                  : r.base === "spectator"
                    ? "SPECTATEUR · LECTURE SEULE"
                    : "RÔLE DE JEU"}
              </span>
              <div className="studio-grid">
                <TextField
                  label={`Nom du rôle ${i + 1}`}
                  value={r.label}
                  onChange={(label) =>
                    onChange({
                      ...d,
                      roles: d.roles.map((old, j) =>
                        j === i ? { ...r, label } : old,
                      ),
                    })
                  }
                />
                <details>
                  <summary>Référence technique</summary>
                  <TextField
                    label={`Référence du rôle ${i + 1}`}
                    value={r.id}
                    max={40}
                    onChange={(id) =>
                      onChange({
                        ...d,
                        roles: d.roles.map((old, j) =>
                          j === i ? { ...r, id } : old,
                        ),
                      })
                    }
                  />
                </details>
                <TextField
                  label={`Description du rôle ${i + 1}`}
                  value={r.description ?? ""}
                  max={240}
                  onChange={(description) =>
                    onChange({
                      ...d,
                      roles: d.roles.map((old, j) =>
                        j === i ? { ...r, description } : old,
                      ),
                    })
                  }
                />
              </div>
              <p className="lobby-hint">
                Actions autorisées :{" "}
                {d.actions
                  .filter((a) => a.roles.includes(r.id))
                  .map((a) => a.label)
                  .join(", ") || "aucune"}
                . Les affectations de rôles ne sont pas exposées au plateau.
              </p>
              {r.base === "player" && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    const refs = references(d, "role", r.id);
                    if (refs.length) {
                      report(`Suppression impossible : ${refs.join(", ")}.`);
                      return;
                    }
                    if (window.confirm(`Supprimer le rôle « ${r.label} » ?`)) {
                      setSelected(0);
                      onChange({
                        ...d,
                        roles: d.roles.filter((_, j) => j !== i),
                      });
                    }
                  }}
                >
                  Supprimer le rôle {r.label}
                </button>
              )}
            </article>
          ),
      )}
      {d.roles.length >= 8 && (
        <p>
          Vous avez atteint la limite de 8 rôles. Modifiez un rôle existant pour
          continuer.
        </p>
      )}
      <button
        className="secondary-button"
        disabled={d.roles.length >= 8}
        onClick={() => (
          setSelected(d.roles.length),
          onChange({
            ...d,
            roles: [
              ...d.roles,
              {
                id: nextId("role", d.roles),
                label: "Nouveau rôle",
                base: "player",
              },
            ],
          })
        )}
      >
        Ajouter un rôle
      </button>
    </section>
  );
}
export function VariablesEditor({ definition: d, onChange, report }: Props) {
  const [selected, setSelected] = useState(0);
  return (
    <section>
      <h2>Quelles informations conserve le jeu ?</h2>
      <p>
        Un score, un budget ou une réponse sont des données du jeu. Définissez
        leur valeur de départ et qui peut les voir.
      </p>
      <nav className="studio-action-tabs" aria-label="Données du jeu">
        {d.variables.map((v, i) => (
          <button
            className="secondary-button"
            key={i}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            {v.label}
          </button>
        ))}
      </nav>
      <p>
        Une donnée peut être commune à la partie ou propre à chaque joueur. Les
        règles d’un joueur ne peuvent modifier que ses propres données
        individuelles.
      </p>
      {d.variables.map((v, i) => {
        if (i !== selected) return null;
        const update = (patch: Partial<typeof v>) =>
          onChange({
            ...d,
            variables: d.variables.map((old, j) =>
              j === i ? { ...v, ...patch } : old,
            ),
          });
        return (
          <article className="studio-card" key={i}>
            <div className="studio-grid">
              <TextField
                label="Nom de cette donnée"
                value={v.label}
                onChange={(label) => update({ label })}
              />
              <details>
                <summary>Référence technique</summary>
                <TextField
                  label={`Référence de cette donnée`}
                  value={v.id}
                  max={40}
                  onChange={(id) => update({ id })}
                />
              </details>
              <Field label="À qui appartient cette donnée ?">
                <select
                  value={v.scope}
                  onChange={(e) =>
                    update({ scope: e.target.value as typeof v.scope })
                  }
                >
                  <option value="session">Toute la partie</option>
                  <option value="participant">Chaque participant</option>
                </select>
              </Field>
              <Field label="Qui peut voir cette information ?">
                <select
                  value={v.visibility}
                  onChange={(e) =>
                    update({
                      visibility: e.target.value as typeof v.visibility,
                    })
                  }
                >
                  <option value="public">Publique</option>
                  <option value="gm">Game Master uniquement</option>
                  <option value="owner">Ce joueur et le Game Master</option>
                </select>
              </Field>
            </div>
            <ValueFields
              prefix={v.label || "cette donnée"}
              value={v.value}
              onChange={(value) => update({ value })}
            />
            <button
              className="secondary-button"
              onClick={() => {
                const refs = references(d, "variable", v.id);
                if (refs.length) {
                  report(`Suppression impossible : ${refs.join(", ")}.`);
                  return;
                }
                if (window.confirm(`Supprimer la donnée « ${v.label} » ?`)) {
                  setSelected(0);
                  onChange({
                    ...d,
                    variables: d.variables.filter((_, j) => j !== i),
                  });
                }
              }}
            >
              Supprimer cette donnée
            </button>
          </article>
        );
      })}
      {d.variables.length >= 8 && (
        <p>
          Vous avez atteint la limite de 8 données. Modifiez une donnée
          existante pour continuer.
        </p>
      )}
      <button
        className="secondary-button"
        disabled={d.variables.length >= 8}
        onClick={() => (
          setSelected(d.variables.length),
          onChange({
            ...d,
            variables: [
              ...d.variables,
              {
                id: nextId("variable", d.variables),
                label: "Nouvelle donnée",
                scope: "session",
                visibility: "public",
                value: { type: "integer", min: 0, max: 100000, initial: 0 },
              },
            ],
          })
        )}
      >
        Ajouter une donnée
      </button>
    </section>
  );
}
export function PhasesEditor({ definition: d, onChange, report }: Props) {
  const unreachable = unreachablePhases(d);
  return (
    <section>
      <h2>Comment se déroule la partie ?</h2>
      <p>
        Créez les étapes de la partie. Dans chaque action, choisissez ensuite la
        prochaine étape. Les changements automatiques et les chronomètres ne
        sont pas encore disponibles.
      </p>
      <Field label="Par quelle étape commence la partie ?">
        <select
          value={d.initialPhase}
          onChange={(e) => onChange({ ...d, initialPhase: e.target.value })}
        >
          {d.phases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      {unreachable.length > 0 && (
        <p className="lobby-warning">
          Ces étapes ne sont reliées à aucune action de départ :{" "}
          {unreachable.map((p) => p.label).join(", ")}. Ouvrez Actions et
          choisissez la prochaine étape d’une action.
        </p>
      )}
      <ol className="phase-map">
        {d.phases.map((p, i) => (
          <li key={i}>
            <article className="studio-card">
              <span className="eyebrow">
                ÉTAPE {i + 1}
                {d.initialPhase === p.id ? " · DÉPART" : ""}
              </span>
              <div className="studio-grid">
                <TextField
                  label={`Nom de l’étape ${i + 1}`}
                  value={p.label}
                  onChange={(label) =>
                    onChange({
                      ...d,
                      phases: d.phases.map((old, j) =>
                        j === i ? { ...p, label } : old,
                      ),
                    })
                  }
                />
                <details>
                  <summary>Référence technique</summary>
                  <TextField
                    label={`Référence de l’étape ${i + 1}`}
                    value={p.id}
                    max={40}
                    onChange={(id) =>
                      onChange({
                        ...d,
                        phases: d.phases.map((old, j) =>
                          j === i ? { ...p, id } : old,
                        ),
                      })
                    }
                  />
                </details>
                <TextField
                  label={`Description de l’étape ${i + 1}`}
                  value={p.description ?? ""}
                  max={240}
                  onChange={(description) =>
                    onChange({
                      ...d,
                      phases: d.phases.map((old, j) =>
                        j === i ? { ...p, description } : old,
                      ),
                    })
                  }
                />
              </div>
              <ul>
                {d.actions
                  .filter((a) => a.phases.includes(p.id))
                  .map((a) => (
                    <li key={a.id}>
                      {a.label}
                      {a.guard || a.conditions.length
                        ? " · sous condition"
                        : ""}{" "}
                      →{" "}
                      {a.nextPhase
                        ? (d.phases.find((p) => p.id === a.nextPhase)?.label ??
                          "étape manquante")
                        : "reste à cette étape"}
                    </li>
                  ))}
              </ul>
              <button
                className="secondary-button"
                onClick={() => {
                  const refs = references(d, "phase", p.id);
                  if (refs.length) {
                    report(`Suppression impossible : ${refs.join(", ")}.`);
                    return;
                  }
                  if (window.confirm(`Supprimer l’étape « ${p.label} » ?`))
                    onChange({
                      ...d,
                      phases: d.phases.filter((_, j) => j !== i),
                    });
                }}
              >
                Supprimer cette étape
              </button>
            </article>
          </li>
        ))}
      </ol>
      {d.phases.length >= 8 && (
        <p>
          Vous avez atteint la limite de 8 étapes. Modifiez une étape existante
          pour continuer.
        </p>
      )}
      <button
        className="secondary-button"
        disabled={d.phases.length >= 8}
        onClick={() =>
          onChange({
            ...d,
            phases: [
              ...d.phases,
              { id: nextId("phase", d.phases), label: "Nouvelle étape" },
            ],
          })
        }
      >
        Ajouter une étape
      </button>
    </section>
  );
}
