"use client";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
import { nextId, references, unreachablePhases } from "../lib/creator-model";
import { Field, TextField, ValueFields } from "./creator-fields";
type Props = {
  definition: GameDefinition;
  onChange: (d: GameDefinition) => void;
  report: (message: string) => void;
};
export function RolesEditor({ definition: d, onChange, report }: Props) {
  return (
    <section>
      <h3>Participants et rôles</h3>
      <p>
        Le GM authentifié conserve son autorité serveur. Les rôles personnalisés
        sont des rôles de joueurs ; leurs permissions se règlent action par
        action.
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
      {d.roles.map((r, i) => (
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
            <TextField
              label={`Identifiant du rôle ${i + 1}`}
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
                if (window.confirm(`Supprimer le rôle « ${r.label} » ?`))
                  onChange({ ...d, roles: d.roles.filter((_, j) => j !== i) });
              }}
            >
              Supprimer le rôle {r.label}
            </button>
          )}
        </article>
      ))}
      <button
        className="secondary-button"
        disabled={d.roles.length >= 8}
        onClick={() =>
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
        }
      >
        Ajouter un rôle
      </button>
    </section>
  );
}
export function VariablesEditor({ definition: d, onChange, report }: Props) {
  return (
    <section>
      <h3>Variables</h3>
      <p>
        Les variables individuelles appartiennent au joueur qui agit. Les
        identifiants sont des références stables : les renommer ne réécrit pas
        les règles.
      </p>
      {d.variables.map((v, i) => {
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
                label={`Nom de la variable ${i + 1}`}
                value={v.label}
                onChange={(label) => update({ label })}
              />
              <TextField
                label={`Identifiant de la variable ${i + 1}`}
                value={v.id}
                max={40}
                onChange={(id) => update({ id })}
              />
              <Field label={`Portée · ${v.id}`}>
                <select
                  value={v.scope}
                  onChange={(e) =>
                    update({ scope: e.target.value as typeof v.scope })
                  }
                >
                  <option value="session">Toute la session</option>
                  <option value="participant">Chaque participant</option>
                </select>
              </Field>
              <Field label={`Visibilité · ${v.id}`}>
                <select
                  value={v.visibility}
                  onChange={(e) =>
                    update({
                      visibility: e.target.value as typeof v.visibility,
                    })
                  }
                >
                  <option value="public">Publique</option>
                  <option value="gm">GM uniquement</option>
                  <option value="owner">Ce joueur et le GM</option>
                </select>
              </Field>
            </div>
            <ValueFields
              prefix={v.id}
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
                if (window.confirm(`Supprimer la variable « ${v.label} » ?`))
                  onChange({
                    ...d,
                    variables: d.variables.filter((_, j) => j !== i),
                  });
              }}
            >
              Supprimer la variable {v.label}
            </button>
          </article>
        );
      })}
      <button
        className="secondary-button"
        disabled={d.variables.length >= 8}
        onClick={() =>
          onChange({
            ...d,
            variables: [
              ...d.variables,
              {
                id: nextId("variable", d.variables),
                label: "Nouvelle variable",
                scope: "session",
                visibility: "public",
                value: { type: "integer", min: 0, max: 100000, initial: 0 },
              },
            ],
          })
        }
      >
        Ajouter une variable
      </button>
    </section>
  );
}
export function PhasesEditor({ definition: d, onChange, report }: Props) {
  const unreachable = unreachablePhases(d);
  return (
    <section>
      <h3>Phases et transitions</h3>
      <p>
        Une transition est une action, manuelle ou conditionnée. Les transitions
        automatiques et chronomètres ne sont pas disponibles.
      </p>
      <Field label="Phase initiale">
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
          Phases sans chemin depuis le départ :{" "}
          {unreachable.map((p) => p.label).join(", ")}. Ajoutez une action de
          transition.
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
                  label={`Nom de la phase ${i + 1}`}
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
                <TextField
                  label={`Identifiant de la phase ${i + 1}`}
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
                <TextField
                  label={`Description de la phase ${i + 1}`}
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
                          "phase manquante")
                        : "reste dans cette phase"}
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
                  if (window.confirm(`Supprimer la phase « ${p.label} » ?`))
                    onChange({
                      ...d,
                      phases: d.phases.filter((_, j) => j !== i),
                    });
                }}
              >
                Supprimer la phase {p.label}
              </button>
            </article>
          </li>
        ))}
      </ol>
      <button
        className="secondary-button"
        disabled={d.phases.length >= 8}
        onClick={() =>
          onChange({
            ...d,
            phases: [
              ...d.phases,
              { id: nextId("phase", d.phases), label: "Nouvelle phase" },
            ],
          })
        }
      >
        Ajouter une phase
      </button>
    </section>
  );
}
