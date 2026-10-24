"use client";
import { useConfirm } from "./ui/feedback";
import { Badge } from "./ui/primitives";
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
type Send = (action: LobbyAction) => Promise<void | boolean>;
const nameFor = (view: SessionView, id: string) =>
  view.participants.find((p) => p.id === id)?.name ?? "Joueur";
function PlayHeading({ game }: { game: GameProjection }) {
  const play = game.play!;
  return (
    <div className="play-heading">
      <p className="game-phase" role="status">
        {game.phase.label}{" "}
        {play.round > 0 && <span>· Manche {play.round}</span>}
      </p>
      {game.phase.description && <p>{game.phase.description}</p>}
      <div className="phase-meta">
        <Badge
          tone={play.outcome ? "info" : !play.dealt ? "primary" : "success"}
        >
          {play.outcome
            ? "Terminé"
            : !play.dealt
              ? "En préparation"
              : "En cours"}
        </Badge>
        <Badge>
          {play.roster.filter((p) => p.active).length} joueurs actifs
        </Badge>
      </div>
      {play.turns && (
        <section
          className="turn-progress"
          data-round={play.turns.round}
          data-completed={play.turns.completed.length}
          data-complete={String(play.turns.complete)}
          data-count={play.turns.order.length}
          data-total={play.turns.total}
          aria-label="Tours de parole"
          aria-live="polite"
        >
          <strong>
            Tour d’indices {play.turns.round} / {play.turns.total}
          </strong>
          <p>
            {play.turns.complete
              ? "Tous les indices ont été donnés. Le GM peut ouvrir le vote."
              : `${play.turns.completed.length} / ${play.turns.order.length} passages confirmés dans ce tour.`}
          </p>
        </section>
      )}
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
            <span className="player-initial" aria-hidden="true">
              {nameFor(view, p.id).slice(0, 2).toLocaleUpperCase("fr")}
            </span>
            <strong>{nameFor(view, p.id)}</strong>
            <span>
              {p.active ? (play.dealt ? "En jeu" : "En attente") : "Éliminé"}
            </span>
            {play.turns && p.active && (
              <Badge
                tone={
                  play.turns.current === p.id
                    ? "warning"
                    : play.turns.completed.includes(p.id)
                      ? "success"
                      : "neutral"
                }
              >
                {play.turns.current === p.id
                  ? "À son tour"
                  : play.turns.completed.includes(p.id)
                    ? "Indice donné"
                    : "Attend son tour"}
              </Badge>
            )}
            {play.ballot?.status === "open" && p.active && (
              <Badge
                tone={play.ballot.voted.includes(p.id) ? "success" : "warning"}
              >
                {play.ballot.voted.includes(p.id) ? "A voté" : "Vote attendu"}
              </Badge>
            )}
            {
              <span className="player-presence">
                {view.participants.find((person) => person.id === p.id)
                  ?.connected
                  ? "Connecté"
                  : "Hors ligne"}
              </span>
            }
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
  const confirm = useConfirm();
  const field = action.parameters.find((p) => p.choices),
    [target, setTarget] = useState("");
  const choices = (
    field?.choices ??
    game.play?.ballot?.candidates ??
    []
  ).filter((id) => game.play?.ballot?.allowSelfVote || id !== proxy);
  const valid = choices.includes(target);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!field || !valid) return;
    const parameters: Record<string, Scalar> = Object.fromEntries(
      action.parameters.map((p) => [
        p.id,
        p.id === field.id ? target : p.value.initial,
      ]),
    );
    await confirm({
      title: "Confirmer ce vote ?",
      description: `Vous votez ${proxy ? `pour ${nameFor(view, proxy)} ` : ""}contre ${nameFor(view, target)}. Ce choix ne pourra plus être modifié.`,
      confirmLabel: "Confirmer mon vote",
      tone: "vote",
      onConfirm: () =>
        send(
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
        ),
    });
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
  const confirm = useConfirm();
  const [proxy, setProxy] = useState("");
  const play = game.play!,
    gm = view.audience === "gm",
    me = view.audience === "player" ? view.participantId : undefined;
  const active = play.roster.find((p) => p.id === me)?.active;
  const ballot = play.ballot;
  useEffect(() => setProxy(""), [play.round]);
  return (
    <section
      className="lobby-panel play-panel"
      id="game"
      data-audience={view.audience}
      data-state={
        play.outcome
          ? "finished"
          : !play.dealt
            ? "preparation"
            : ballot?.status === "open"
              ? "vote"
              : ballot?.status === "resolved"
                ? "result"
                : "active"
      }
    >
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
              Votre vote est attendu. Choisissez un joueur dans la liste
              ci-dessous.
            </p>
          )}
          {ballot?.myVote && (
            <p role="status">
              Votre vote pour {nameFor(view, ballot.myVote)} est enregistré.
            </p>
          )}
        </section>
      )}
      {play.turns?.current && (
        <p className="turn-current" role="status">
          Au tour de : <strong>{nameFor(view, play.turns.current)}</strong>.
          {gm
            ? " Écoutez son indice oral, puis confirmez son passage."
            : me === play.turns.current
              ? " C’est à vous : donnez votre indice à voix haute."
              : " Écoutez son indice, puis attendez votre tour."}
        </p>
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
          onClick={() =>
            void confirm({
              title: "Recommencer la partie ?",
              description:
                "Les votes et résultats seront effacés. Les joueurs conserveront leur accès à cette partie.",
              consequences: [
                "Les joueurs et leurs accès sont conservés.",
                "Les votes, éliminations et résultats seront effacés.",
              ],
              confirmLabel: "Recommencer",
              tone: "warning",
              onConfirm: () =>
                send({ type: "game.restart", runId: game.runId }),
            })
          }
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
