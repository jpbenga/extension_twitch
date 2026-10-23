"use client";
import { useEffect, useState, type FormEvent } from "react";
import type {
  GameProjection,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import type {
  LobbyAction,
  SessionView,
} from "@extension-twitch/contracts/sessions";
import { ActionForm } from "./game-action";
import { GameValues } from "./game-values";
type Send = (action: LobbyAction) => Promise<void>;
const nameFor = (view: SessionView, id: string) =>
  view.participants.find((p) => p.id === id)?.name ?? "Joueur";
function PlayHeading({ game }: { game: GameProjection }) {
  const play = game.play!;
  return (
    <div className="play-heading">
      {" "}
      <p className="game-phase" role="status">
        {game.phase.label} {play.round > 0 && <span>· Tour {play.round}</span>}
      </p>
      {game.phase.description && <p>{game.phase.description}</p>}
      {play.outcome && (
        <div className="play-outcome" role="status">
          <span className="eyebrow">RÉSULTAT FINAL</span>
          <h2>{play.outcome.label}</h2>
        </div>
      )}
    </div>
  );
}
export function PlaySummary({
  game,
  view,
  hideHeading = false,
}: {
  game: GameProjection;
  view: SessionView;
  hideHeading?: boolean;
}) {
  const play = game.play!;
  return (
    <div className="play-summary">
      {!hideHeading && <PlayHeading game={game} />}
      <div className="play-roster">
        {play.roster.map((p) => (
          <article className={p.active ? "" : "is-eliminated"} key={p.id}>
            <strong>{nameFor(view, p.id)}</strong>
            <span>{p.active ? "En jeu" : "Éliminé"}</span>
            {p.role && <small>{p.role}</small>}
          </article>
        ))}
      </div>
      {play.ballot && (
        <section className="play-vote-result">
          <h3>
            {play.ballot.status === "open"
              ? "Votes en cours"
              : "Résultat du vote"}
          </h3>
          {play.ballot.status === "open" ? (
            <>
              <p>
                {play.ballot.voted.length} / {play.ballot.eligible.length} votes
                reçus
              </p>
              <ul className="play-vote-progress">
                {play.ballot.eligible.map((id) => (
                  <li key={id}>
                    {nameFor(view, id)} ·{" "}
                    {play.ballot!.voted.includes(id)
                      ? "A voté"
                      : "Vote attendu"}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div className="play-tallies">
                {play.ballot.tallies.map((t) => (
                  <p key={t.participantId}>
                    <span>{nameFor(view, t.participantId)}</span>
                    <strong>{t.count} voix</strong>
                  </p>
                ))}
              </div>
              <p>
                {play.ballot.tied
                  ? "Égalité : personne n’est éliminé."
                  : play.ballot.eliminated
                    ? `${nameFor(view, play.ballot.eliminated)} est éliminé.`
                    : play.ballot.selected
                      ? `Choix du vote : ${nameFor(view, play.ballot.selected)}.`
                      : "Aucune élimination."}
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
function ChoiceAction({
  action,
  game,
  view,
  locked,
  send,
  proxy,
}: {
  action: GameProjection["actions"][number];
  game: GameProjection;
  view: SessionView;
  locked: boolean;
  send: Send;
  proxy?: string;
}) {
  const field = action.parameters.find((p) => p.choices),
    [target, setTarget] = useState("");
  const choices = (
    field?.choices ??
    game.play?.ballot?.candidates ??
    []
  ).filter((id) => game.play?.ballot?.allowSelfVote || id !== proxy);
  const valid = choices.includes(target);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!field || !valid) return;
    const parameters: Record<string, Scalar> = Object.fromEntries(
      action.parameters.map((p) => [
        p.id,
        p.id === field.id ? target : p.value.initial,
      ]),
    );
    if (
      window.confirm(
        `Confirmer le vote ${proxy ? `de ${nameFor(view, proxy)} ` : ""}pour ${nameFor(view, target)} ? Ce vote ne pourra plus être modifié.`,
      )
    )
      void send(
        proxy
          ? {
              type: "game.player-action",
              participantId: proxy,
              runId: game.runId,
              actionId: action.id,
              parameters,
            }
          : {
              type: "game.action",
              runId: game.runId,
              actionId: action.id,
              parameters,
            },
      );
  }
  return (
    <form className="lobby-form" onSubmit={submit}>
      <fieldset className="vote-choice" disabled={locked}>
        <legend>{field?.label ?? "Pour qui souhaitez-vous voter ?"}</legend>
        <div className="vote-candidates">
          {choices.map((id) => (
            <label className={target === id ? "selected" : ""} key={id}>
              <input
                type="radio"
                name={`target-${proxy ?? "self"}`}
                checked={target === id}
                onChange={() => setTarget(id)}
              />
              {nameFor(view, id)}
            </label>
          ))}
        </div>
        <button className="primary-button" disabled={!valid || locked}>
          {proxy ? "Enregistrer ce vote délégué" : action.label}
        </button>
      </fieldset>
    </form>
  );
}
export function PlayPanel({
  view,
  game,
  locked,
  send,
  hideRestart = false,
}: {
  hideRestart?: boolean;
  view: SessionView;
  game: GameProjection;
  locked: boolean;
  send: Send;
}) {
  const [proxy, setProxy] = useState("");
  const play = game.play!,
    gm = view.audience === "gm",
    me = view.audience === "player" ? view.participantId : undefined;
  const active = play.roster.find((p) => p.id === me)?.active;
  const ballot = play.ballot;
  useEffect(() => setProxy(""), [play.round]);
  return (
    <section className="lobby-panel play-panel" id="game">
      <span className="eyebrow">PARTIE RÉELLE · VARIANTE DE DÉMONSTRATION</span>
      <h2>{game.title}</h2>
      <PlayHeading game={game} />
      {me && (
        <section className="personal-card" aria-label="Votre carte privée">
          <span className="eyebrow">
            {play.outcome ? "RÉVÉLATION FINALE" : "POUR VOUS UNIQUEMENT"}
          </span>
          <GameValues game={game} names={view.participants} />
          {!play.dealt && <p>Le GM va vous distribuer vos informations.</p>}
          {play.dealt && !active && (
            <p>
              Vous êtes éliminé. Vous pouvez suivre la partie mais ne votez
              plus.
            </p>
          )}
          {ballot?.status === "open" && active && !ballot.myVote && (
            <p>
              Votre vote est attendu. Choisissez un autre joueur ci-dessous.
            </p>
          )}
          {ballot?.myVote && (
            <p role="status">
              Votre vote pour {nameFor(view, ballot.myVote)} est enregistré.
            </p>
          )}
        </section>
      )}
      <div className="game-actions">
        {game.actions.map((a) =>
          a.parameters.some((p) => p.choices) ? (
            <ChoiceAction
              key={`${game.runId}:${play.round}:${a.id}`}
              action={a}
              game={game}
              view={view}
              locked={locked}
              send={send}
            />
          ) : (
            <ActionForm
              key={`${game.runId}:${a.id}`}
              action={a}
              runId={game.runId}
              locked={locked}
              send={send}
            />
          ),
        )}
      </div>
      {gm ? (
        <PlaySummary game={game} view={view} hideHeading />
      ) : (
        <details>
          <summary>Suivre les joueurs et le vote</summary>
          <PlaySummary game={game} view={view} hideHeading />
        </details>
      )}
      {gm && (
        <>
          {ballot?.status === "open" && !ballot.complete && (
            <p className="lobby-hint">
              Tous les joueurs actifs doivent voter avant de révéler le
              résultat.
            </p>
          )}
          <details className="gm-secrets">
            <summary>Informations privées du Game Master</summary>
            <p>Gardez cette zone hors du plateau public.</p>
            <GameValues game={game} names={view.participants} />
            {play.dealt && (
              <ul>
                {Object.entries(game.management?.assignments ?? {}).map(
                  ([id, role]) => (
                    <li key={id}>
                      {nameFor(view, id)} :{" "}
                      {game.management?.roles.find((r) => r.id === role)
                        ?.label ?? role}
                    </li>
                  ),
                )}
              </ul>
            )}
          </details>
          {ballot?.status === "open" && game.management?.proxyAction && (
            <details>
              <summary>Voter pour un joueur sans interface</summary>
              <p>
                Choisissez le joueur puis sa cible. Le serveur applique les
                mêmes restrictions et empêche un deuxième vote.
              </p>
              <label>
                Joueur représenté
                <select
                  aria-label="Joueur représenté"
                  value={proxy}
                  onChange={(e) => setProxy(e.target.value)}
                >
                  <option value="">Choisir un joueur</option>
                  {ballot.eligible
                    .filter((id) => !ballot.voted.includes(id))
                    .map((id) => (
                      <option key={id} value={id}>
                        {nameFor(view, id)}
                      </option>
                    ))}
                </select>
              </label>
              {proxy &&
                ballot.eligible.includes(proxy) &&
                !ballot.voted.includes(proxy) && (
                  <ChoiceAction
                    key={`${play.round}:${proxy}`}
                    action={game.management.proxyAction}
                    game={game}
                    view={view}
                    locked={locked}
                    send={send}
                    proxy={proxy}
                  />
                )}
            </details>
          )}
        </>
      )}
      {gm && !hideRestart && (
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => {
            if (
              window.confirm(
                "Recommencer avec les mêmes joueurs ? Les votes et résultats seront effacés ; les accès sont conservés.",
              )
            )
              void send({ type: "game.restart", runId: game.runId });
          }}
        >
          Rejouer cette partie
        </button>
      )}
      <details>
        <summary>Journal de la partie</summary>
        <ul className="play-events">
          {view.events.map((e) => (
            <li key={e.version}>{e.message}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
