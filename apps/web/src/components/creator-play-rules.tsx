"use client";
import type {
  GameDefinition,
  ValueSpec,
} from "@extension-twitch/contracts/game-definition";
import { PlayConfiguration } from "./play-configuration";
import { NumberInput, ScalarField, TextField } from "./creator-fields";
export function CreatorPlayRules({
  definition: d,
  onChange,
}: {
  definition: GameDefinition;
  onChange: (d: GameDefinition) => void;
}) {
  const m = d.mechanics;
  if (!m)
    return (
      <section>
        <h2>Distribution et vote</h2>
        <p>
          Ces règles sont disponibles en personnalisant le modèle Undercover
          depuis la bibliothèque. Votre jeu actuel conserve ses actions
          existantes.
        </p>
      </section>
    );
  const roles = d.roles.filter((r) => r.base === "player");
  return (
    <section className="lobby-form">
      <h2>Distribution et vote</h2>
      <p>
        Ces paramètres font partie de votre jeu. Ils sont contrôlés par le
        serveur et conservés dans les versions enregistrées.
      </p>
      <h3>Préparer les informations</h3>
      <PlayConfiguration
        definition={d}
        values={{}}
        onChange={(values) =>
          onChange({
            ...d,
            configuration: d.configuration.map((f) => ({
              ...f,
              value: {
                ...f.value,
                initial: values[f.id] ?? f.value.initial,
              } as ValueSpec,
            })),
          })
        }
      />
      <details>
        <summary>Effectif et camps</summary>
        <label>
          Joueurs minimum
          <NumberInput
            label="Joueurs minimum"
            value={m.minPlayers}
            min={m.deals.length ? 3 : 1}
            max={12}
            onChange={(minPlayers) =>
              onChange({ ...d, mechanics: { ...m, minPlayers } })
            }
          />
        </label>
        <label>
          Joueurs maximum
          <NumberInput
            label="Joueurs maximum"
            value={m.maxPlayers}
            min={m.deals.length ? 3 : 1}
            max={12}
            onChange={(maxPlayers) =>
              onChange({ ...d, mechanics: { ...m, maxPlayers } })
            }
          />
        </label>
        <p>
          Le camp minoritaire doit rester strictement moins nombreux au
          démarrage. Le tirage est effectué sur le serveur.
        </p>
      </details>
      {m.ballots.map((b, i) => (
        <fieldset className="studio-card" key={b.id}>
          <legend>Règles du vote</legend>
          <label>
            Que décide ce vote ?
            <select
              value={b.resolution}
              onChange={(e) =>
                onChange({
                  ...d,
                  mechanics: {
                    ...m,
                    ballots: m.ballots.map((old, j) =>
                      j === i
                        ? {
                            ...b,
                            resolution: e.target.value as typeof b.resolution,
                          }
                        : old,
                    ),
                  },
                })
              }
            >
              <option value="eliminate">Éliminer le joueur désigné</option>
              <option value="select">Désigner un joueur sans l’éliminer</option>
            </select>
          </label>
          {(
            [
              ["allowSelfVote", "Autoriser un joueur à voter pour lui-même"],
              [
                "allowGmProxy",
                "Permettre au GM de voter pour un joueur sans interface",
              ],
              ["revealEliminatedRole", "Révéler le camp du joueur éliminé"],
            ] as const
          ).map(([field, label]) => (
            <label className="creator-check" key={field}>
              <input
                type="checkbox"
                checked={b[field]}
                onChange={(e) =>
                  onChange({
                    ...d,
                    mechanics: {
                      ...m,
                      ballots: m.ballots.map((old, j) =>
                        j === i ? { ...b, [field]: e.target.checked } : old,
                      ),
                    },
                  })
                }
              />
              {label}
            </label>
          ))}
          <p>
            Un vote par actif ; toutes les voix sont requises. En cas d’égalité,
            personne n’est éliminé.
          </p>
        </fieldset>
      ))}
      <details>
        <summary>Quand la partie se termine-t-elle ?</summary>
        <p>
          Les conditions sont examinées dans cet ordre après le vote. Les camps
          sont révélés à la fin. Les données privées sont dévoilées seulement
          lorsque la règle de fin le prévoit. La limite de tours produit sinon
          une partie nulle.
        </p>
        {m.endings.map((e, i) => {
          const update = (patch: Partial<typeof e>) =>
            onChange({
              ...d,
              mechanics: {
                ...m,
                endings: m.endings.map((old, j) =>
                  j === i ? { ...e, ...patch } : old,
                ),
              },
            });
          return (
            <fieldset className="studio-card" key={e.id}>
              <legend>Condition de fin {i + 1}</legend>
              <TextField
                label={`Résultat annoncé ${i + 1}`}
                value={e.label}
                onChange={(label) => update({ label })}
              />
              <label>
                Compter les joueurs restants dans ce camp
                <select
                  aria-label={`Camp de la condition ${i + 1}`}
                  value={e.leftRole}
                  onChange={(event) => update({ leftRole: event.target.value })}
                >
                  {roles.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ce nombre doit être
                <select
                  aria-label={`Comparaison de la condition ${i + 1}`}
                  value={e.comparison}
                  onChange={(event) =>
                    update({
                      comparison: event.target.value as typeof e.comparison,
                    })
                  }
                >
                  <option value="eq">Égal à</option>
                  <option value="gte">Au moins égal à</option>
                  <option value="lte">Au plus égal à</option>
                </select>
              </label>
              <label>
                Comparer avec
                <select
                  aria-label={`Référence de la condition ${i + 1}`}
                  value={"role" in e.right ? "role" : "count"}
                  onChange={(event) =>
                    update({
                      right:
                        event.target.value === "role"
                          ? { role: roles[0]!.id }
                          : { count: 0 },
                    })
                  }
                >
                  <option value="count">Un nombre fixe</option>
                  <option value="role">Les joueurs d’un autre camp</option>
                </select>
              </label>
              {"role" in e.right ? (
                <label>
                  Autre camp
                  <select
                    aria-label={`Autre camp ${i + 1}`}
                    value={e.right.role}
                    onChange={(event) =>
                      update({ right: { role: event.target.value } })
                    }
                  >
                    {roles.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <ScalarField
                  label={`Nombre restant ${i + 1}`}
                  value={e.right.count}
                  onChange={(value) =>
                    update({ right: { count: Number(value) } })
                  }
                />
              )}
            </fieldset>
          );
        })}
      </details>
    </section>
  );
}
