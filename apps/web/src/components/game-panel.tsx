"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  gameDefinitionSchema,
  gameExamplesSchema,
  type GameProjection,
  type Scalar,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import type {
  LobbyAction,
  SessionView,
} from "@extension-twitch/contracts/sessions";

export function GameValues({
  game,
  names,
}: {
  game: GameProjection;
  names: SessionView["participants"];
}) {
  return (
    <div className="game-values" aria-label="Informations de jeu">
      {game.values.map((v) => (
        <article key={`${v.id}:${v.participantId ?? "session"}`}>
          <span>
            {v.label}
            {v.participantId
              ? ` · ${names.find((p) => p.id === v.participantId)?.name ?? "Joueur"}`
              : ""}
          </span>
          <strong>
            {typeof v.value === "boolean"
              ? v.value
                ? "Oui"
                : "Non"
              : String(v.value) || "—"}
          </strong>
        </article>
      ))}
      {game.assets.map((a) => (
        <p className="asset-fallback" key={a.id}>
          {a.fallback} ·{" "}
          {a.availability === "disabled"
            ? "référence désactivée"
            : "média indisponible"}
        </p>
      ))}
    </div>
  );
}

function ActionForm({
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

export function GamePanel({
  view,
  locked,
  send,
  hideRestart = false,
}: {
  view: SessionView;
  hideRestart?: boolean;
  locked: boolean;
  send: (action: LobbyAction) => Promise<void>;
}) {
  const [examples, setExamples] = useState<GameDefinition[]>([]);
  const [exampleId, setExampleId] = useState("collective-pulse");
  const [failure, setFailure] = useState("");
  const [definitionJson, setDefinitionJson] = useState("");
  useEffect(() => {
    if (view.audience !== "gm" || view.game) return;
    const controller = new AbortController();
    void fetch("/api/server/game-examples", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<unknown>;
      })
      .then((data) => setExamples(gameExamplesSchema.parse(data)))
      .catch(() => {
        if (!controller.signal.aborted)
          setFailure("Catalogue indisponible. Rechargez la page.");
      });
    return () => controller.abort();
  }, [view.audience, "game" in view && view.game?.runId]);
  if (view.audience === "public") return null;
  const game = view.game;
  const install = (definition: GameDefinition) =>
    void send({
      type: "game.configure",
      definition,
      configuration: {},
      assets: [],
    });
  return (
    <section className="lobby-panel" id="game">
      <span className="eyebrow">PARTIE · EXEMPLE CONFIGURABLE</span>
      <h2>{game?.title ?? "Installer une expérience"}</h2>
      {failure && (
        <p role="alert" className="lobby-error">
          {failure}
        </p>
      )}
      {!game && view.audience === "gm" && (
        <>
          <p>
            Invitez les joueurs avant l’installation. L’effectif est ensuite
            figé jusqu’à la réinitialisation du salon. Ces exemples ne sont pas
            les jeux officiels.
          </p>
          {view.preparedGame && (
            <div className="lobby-notice">
              <strong>
                Définition préparée : {view.preparedGame.title} · v
                {view.preparedGame.definitionVersion}
              </strong>
              <p>
                Invitez tous les joueurs avant l’installation. Cette copie reste
                indépendante du brouillon.
              </p>
              <button
                className="primary-button"
                disabled={locked}
                onClick={() => void send({ type: "game.use-prepared" })}
              >
                Installer la définition préparée
              </button>
            </div>
          )}
          <form
            className="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              const d = examples.find((d) => d.id === exampleId);
              if (d) install(d);
            }}
          >
            <label>
              Exemple de définition
              <select
                disabled={locked}
                value={exampleId}
                onChange={(e) => setExampleId(e.target.value)}
              >
                {examples.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              disabled={locked || !examples.length}
            >
              Installer l’exemple
            </button>
          </form>
          <details>
            <summary>Importer une définition JSON (outil technique)</summary>
            <p>
              Schémas v1/v2 bornés. Aucun code exécuté. Les paramètres utilisent
              leurs valeurs par défaut.
            </p>
            <form
              className="lobby-form"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const d = gameDefinitionSchema.parse(
                    JSON.parse(definitionJson) as unknown,
                  );
                  setFailure("");
                  install(d);
                } catch {
                  setFailure(
                    "Définition invalide : vérifiez la version, les références et les bornes.",
                  );
                }
              }}
            >
              <label>
                Définition JSON
                <textarea
                  rows={8}
                  maxLength={6000}
                  value={definitionJson}
                  onChange={(e) => setDefinitionJson(e.target.value)}
                  disabled={locked}
                  required
                />
              </label>
              <button className="secondary-button" disabled={locked}>
                Installer le JSON
              </button>
            </form>
          </details>
        </>
      )}
      {!game && view.audience === "player" && (
        <p>Le GM prépare l’expérience.</p>
      )}
      {game && (
        <>
          <p className="game-phase" role="status">
            Étape : <strong>{game.phase.label}</strong>
          </p>
          <details className="game-technical">
            <summary>Détails du jeu</summary>
            <p className="lobby-hint">
              Définition {game.definitionId} · v{game.definitionVersion}
              {game.role ? ` · Votre rôle : ${game.role}` : ""}
            </p>
          </details>
          <div className="game-actions">
            {game.actions.map((a) => (
              <ActionForm
                key={`${game.runId}:${a.id}`}
                action={a}
                runId={game.runId}
                locked={locked}
                send={send}
              />
            ))}
          </div>
          <GameValues game={game} names={view.participants} />
          {!game.actions.length && (
            <p>Aucune action disponible pour vous à cette étape.</p>
          )}
          {view.audience === "gm" && game.management && (
            <>
              <details>
                <summary>Affecter les rôles des joueurs</summary>
                {view.participants.map((p) => (
                  <label className="role-assignment" key={p.id}>
                    Rôle de {p.name}
                    <select
                      aria-label={`Rôle de ${p.name}`}
                      disabled={locked}
                      value={game.management?.assignments[p.id]}
                      onChange={(e) =>
                        void send({
                          type: "game.assign-role",
                          participantId: p.id,
                          roleId: e.target.value,
                        })
                      }
                    >
                      {game.management?.roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </details>
              {!hideRestart && (
                <button
                  className="secondary-button"
                  disabled={locked}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Relancer cette définition ? Les valeurs, les phases et les rôles affectés seront réinitialisés ; les accès joueurs seront conservés.",
                      )
                    )
                      void send({ type: "game.restart", runId: game.runId });
                  }}
                >
                  Rejouer cette expérience
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
