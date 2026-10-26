"use client";
import { useConfirm } from "./ui/feedback";

import { useLegacyTools } from "./legacy-tools";
import Link from "next/link";
import { PlayPanel } from "./play-panel";
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

export { GameValues } from "./game-values";
import { GameValues } from "./game-values";
import { ActionForm } from "./game-action";

export function GamePanel({
  view,
  locked,
  send,
  hideRestart = false,
}: {
  view: SessionView;
  hideRestart?: boolean;
  locked: boolean;
  send: (action: LobbyAction) => Promise<void | boolean>;
}) {
  const legacyTools = useLegacyTools();
  const confirm = useConfirm();
  const [examples, setExamples] = useState<GameDefinition[]>([]);
  const [exampleId, setExampleId] = useState("collective-pulse");
  const [failure, setFailure] = useState("");
  const [definitionJson, setDefinitionJson] = useState("");
  useEffect(() => {
    if (!legacyTools || view.audience !== "gm" || view.game) return;
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
  }, [legacyTools, view.audience, "game" in view && view.game?.runId]);
  if (view.audience === "public") return null;
  const game = view.game;
  const install = (definition: GameDefinition) =>
    void send({
      type: "game.configure",
      definition,
      configuration: {},
      assets: [],
    });
  if (!game && !legacyTools)
    return (
      <section className="lobby-panel" id="game">
        <h2>Préparer la partie</h2>
        {view.audience === "gm" && view.preparedGame ? (
          <>
            <p>
              Invitez tous vos joueurs, puis préparez la partie avec les
              réglages choisis.
            </p>
            <button
              className="primary-button"
              disabled={locked}
              onClick={() => void send({ type: "game.use-prepared" })}
            >
              Préparer la partie
            </button>
          </>
        ) : (
          <>
            <p>
              {view.audience === "gm"
                ? "Choisissez un jeu pour préparer une nouvelle partie. Ce salon est conservé."
                : "Le Game Master prépare la partie."}
            </p>
            {view.audience === "gm" && (
              <Link href="/play" className="primary-button">
                Choisir un jeu
              </Link>
            )}
          </>
        )}
      </section>
    );
  if (game?.play)
    return (
      <PlayPanel
        view={view}
        game={game}
        locked={locked}
        send={send}
        hideRestart={hideRestart}
      />
    );
  return (
    <section className="lobby-panel" id="game" data-audience={view.audience}>
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
                  onClick={() =>
                    void confirm({
                      title: "Recommencer la partie ?",
                      description:
                        "Les votes et résultats seront effacés. Les joueurs conserveront leur accès à cette partie.",
                      consequences: [
                        "Les valeurs, étapes et rôles sont remis à leur état initial.",
                        "Les joueurs et leurs accès sont conservés.",
                      ],
                      confirmLabel: "Recommencer",
                      tone: "warning",
                      onConfirm: () =>
                        send({ type: "game.restart", runId: game.runId }),
                    })
                  }
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
