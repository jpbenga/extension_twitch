"use client";

import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import type {
  GameProjection,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import type {
  GmSessionView,
  LobbyAction,
} from "@extension-twitch/contracts/sessions";
import { useConfirm } from "./ui/feedback";
import { ActionForm } from "./game-action";
import { GameValues } from "./game-values";
import "../app/stitch-gm.css";

type Send = (action: LobbyAction) => Promise<void | boolean>;
const playerName = (view: GmSessionView, id?: string) =>
  view.participants.find((p) => p.id === id)?.name ?? "Joueur";

export function gmHeading(game: GameProjection) {
  const play = game.play!;
  if (play.outcome)
    return {
      title: "Partie terminée",
      description: `La manche ${play.round} a scellé l’issue de la partie. Les révélations finales sont maintenant publiques.`,
    };
  if (!play.dealt)
    return {
      title: "Prêt à distribuer",
      description:
        "Les inscriptions sont fermées. Distribuez les mots pour commencer la partie.",
    };
  if (game.phase.id === "discussion")
    return play.turns?.complete
      ? {
          title: "Les indices sont terminés",
          description:
            "Chaque joueur actif vote une fois pour un autre joueur.",
        }
      : {
          title: "Discussion en cours",
          description:
            "Chaque joueur donne son indice oralement. Confirmez chaque passage.",
        };
  if (play.ballot?.status === "open")
    return {
      title: play.ballot.complete
        ? "Les votes sont complets"
        : "Les joueurs votent",
      description: play.ballot.complete
        ? "Tous les joueurs actifs ont voté. Vous pouvez révéler le résultat."
        : "Suivez la participation. La révélation attend tous les votes.",
    };
  return {
    title: "Résultat du vote",
    description: `Le scrutin de la manche ${play.round} a été dépouillé et révélé publiquement.`,
  };
}

export function GmDisclosure({
  title,
  children,
  className = "",
  onOpenChange,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <details
      className={`gm-disclosure ${className}`}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
    >
      <summary>
        <span>{title}</span>
        <span className="gm-disclosure-more" aria-hidden="true">
          Afficher ›
        </span>
      </summary>
      <div className="gm-disclosure-body">{children}</div>
    </details>
  );
}

export function GmRoster({
  view,
  game,
  mode = "players",
}: {
  view: GmSessionView;
  game: GameProjection;
  mode?: "players" | "game";
}) {
  const play = game.play!,
    ballot = play.ballot;
  const order =
    mode === "game" && game.phase.id === "discussion" && play.turns
      ? play.turns.order
      : view.participants.map((p) => p.id);
  const roster = order
    .map((id) => view.participants.find((p) => p.id === id))
    .filter((p) => p !== undefined);
  return (
    <section className="gm-card gm-roster-card">
      <div className="gm-card-heading">
        <h3>
          {mode === "players"
            ? "PARTICIPANTS INSCRITS"
            : !play.dealt
              ? "JOUEURS INSCRITS"
              : game.phase.id === "discussion"
                ? "ORDRE DE PASSAGE"
                : ballot?.status === "open"
                  ? "PARTICIPATION DES JOUEURS"
                  : play.outcome
                    ? "BILAN DES PARTICIPANTS"
                    : "DÉCOMPTE DES VOIX"}{" "}
          ({roster.length})
        </h3>
        <span>
          {mode === "players"
            ? "Ordre d’inscription"
            : game.phase.id === "discussion" && play.turns
              ? `Tour ${play.turns.round} sur ${play.turns.total}`
              : ""}
        </span>
      </div>
      <ul className={`${mode === "players" ? "lobby-players " : ""}gm-roster`}>
        {roster.map((person) => {
          const state = play.roster.find((p) => p.id === person.id);
          const publicRole = view.publicGame?.play?.roster.find(
            (p) => p.id === person.id,
          )?.role;
          const current =
            mode === "game" &&
            game.phase.id === "discussion" &&
            play.turns?.current === person.id;
          const completed =
            mode === "game" &&
            game.phase.id === "discussion" &&
            play.turns?.completed.includes(person.id);
          const count =
            ballot?.status === "resolved"
              ? (ballot.tallies.find((t) => t.participantId === person.id)
                  ?.count ?? 0)
              : null;
          const label = !play.dealt
            ? "Inscrit"
            : !state?.active
              ? "Éliminé"
              : mode === "game" && ballot?.status === "open"
                ? ballot.voted.includes(person.id)
                  ? "A voté"
                  : "Vote attendu"
                : current
                  ? "À son tour"
                  : completed
                    ? "Passage confirmé"
                    : mode === "game" && game.phase.id === "discussion"
                      ? "À venir"
                      : "En jeu";
          return (
            <li
              key={person.id}
              className={`${current ? "is-current" : ""} ${state && !state.active ? "is-eliminated" : ""}`}
            >
              <span className="gm-avatar" aria-hidden="true">
                {person.name.slice(0, 1).toLocaleUpperCase("fr")}
              </span>
              <div className="gm-player-name">
                <strong>{person.name}</strong>
                <small className="gm-presence">
                  <span aria-hidden="true">●</span>{" "}
                  {person.connected ? "Connecté" : "Hors ligne"}
                </small>
                {publicRole && (
                  <small className="gm-public-role">
                    Rôle public : {publicRole}
                  </small>
                )}
              </div>
              <span
                className={`gm-player-status ${current || completed || label === "A voté" ? "is-confirmed" : ""}`}
              >
                {count !== null && mode === "game" && !play.outcome
                  ? `${count} voix`
                  : label}
              </span>
            </li>
          );
        })}
      </ul>
      {!play.dealt && (
        <p className="gm-footnote">
          Rôles et mots tenus secrets. Aucun camp n’est révélé.
        </p>
      )}
    </section>
  );
}

export function GmPrivateInfo({
  view,
  game,
}: {
  view: GmSessionView;
  game: GameProjection;
}) {
  return (
    <GmDisclosure
      title="Informations privées du Game Master"
      className="gm-secrets"
    >
      <p>Gardez cette zone hors du plateau public.</p>
      <GameValues game={game} names={view.participants} />
      {game.play?.dealt ? (
        <ul>
          {Object.entries(game.management?.assignments ?? {}).map(
            ([id, role]) => (
              <li key={id}>
                {playerName(view, id)} :{" "}
                {game.management?.roles.find((r) => r.id === role)?.label ??
                  role}
              </li>
            ),
          )}
        </ul>
      ) : (
        <p>Les attributions seront disponibles après la distribution.</p>
      )}
    </GmDisclosure>
  );
}
export function GmJournal({ view }: { view: GmSessionView }) {
  return (
    <GmDisclosure title="Journal de la partie">
      <ul className="play-events">
        {view.events.map((e) => (
          <li key={e.version}>{e.message}</li>
        ))}
      </ul>
    </GmDisclosure>
  );
}
export function GmReplay({
  game,
  locked,
  send,
  primary = false,
}: {
  game: GameProjection;
  locked: boolean;
  send: Send;
  primary?: boolean;
}) {
  const confirm = useConfirm();
  return (
    <button
      className={
        primary ? "primary-button gm-primary" : "secondary-button gm-replay"
      }
      disabled={locked}
      onClick={() =>
        void confirm({
          title: "Recommencer la partie ?",
          description: "Les votes, éliminations et résultats seront effacés.",
          consequences: [
            "Les joueurs et leurs accès sont conservés. Les mots seront redistribués au prochain démarrage.",
          ],
          confirmLabel: "Recommencer",
          presentation: "stitch",
          tone: "neutral",
          onConfirm: () => send({ type: "game.restart", runId: game.runId }),
        })
      }
    >
      Rejouer cette partie
    </button>
  );
}

function GmDelegatedVote({
  view,
  game,
  locked,
  send,
}: {
  view: GmSessionView;
  game: GameProjection;
  locked: boolean;
  send: Send;
}) {
  const confirm = useConfirm();
  const [proxy, setProxy] = useState(""),
    [target, setTarget] = useState("");
  const ballot = game.play?.ballot,
    action = game.management?.proxyAction;
  useEffect(() => {
    setProxy("");
    setTarget("");
  }, [game.runId, game.play?.round]);
  if (ballot?.status !== "open" || !action) return null;
  const available = ballot.eligible.filter((id) => !ballot.voted.includes(id));
  const field = action.parameters.find((p) => p.choices);
  const choices = (field?.choices ?? ballot.candidates).filter(
    (id) => ballot.allowSelfVote || id !== proxy,
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (
      !action ||
      !field ||
      !available.includes(proxy) ||
      !choices.includes(target)
    )
      return;
    const parameters: Record<string, Scalar> = Object.fromEntries(
      action.parameters.map((p) => [
        p.id,
        p.id === field.id ? target : p.value.initial,
      ]),
    );
    await confirm({
      title: "Confirmer ce vote ?",
      description: `Vous votez pour ${playerName(view, proxy)} contre ${playerName(view, target)}. Ce choix ne pourra plus être modifié.`,
      confirmLabel: "Confirmer mon vote",
      presentation: "stitch",
      tone: "vote",
      onConfirm: () =>
        send({
          type: "game.player-action",
          participantId: proxy,
          runId: game.runId,
          actionId: action.id,
          parameters,
        }),
    });
  }
  return (
    <GmDisclosure
      title="Voter pour un joueur sans interface"
      className="gm-proxy"
    >
      <p>Le serveur applique les mêmes règles et empêche un deuxième vote.</p>
      {available.length ? (
        <form className="lobby-form" onSubmit={submit}>
          <label>
            Joueur représenté
            <select
              disabled={locked}
              aria-label="Joueur représenté"
              value={proxy}
              onChange={(e) => {
                setProxy(e.target.value);
                setTarget("");
              }}
            >
              <option value="">Choisir un joueur</option>
              {available.map((id) => (
                <option key={id} value={id}>
                  {playerName(view, id)}
                </option>
              ))}
            </select>
          </label>
          {available.includes(proxy) && (
            <fieldset className="vote-choice" disabled={locked}>
              <legend>
                {field?.label ?? "Pour qui souhaitez-vous voter ?"}
              </legend>
              <div className="vote-candidates">
                {choices.map((id) => (
                  <label className={target === id ? "selected" : ""} key={id}>
                    <input
                      type="radio"
                      name={`gm-target-${proxy}`}
                      checked={target === id}
                      onChange={() => setTarget(id)}
                    />
                    {playerName(view, id)}
                  </label>
                ))}
              </div>
              <button
                className="secondary-button"
                disabled={locked || !choices.includes(target)}
              >
                Enregistrer ce vote délégué
              </button>
            </fieldset>
          )}
        </form>
      ) : (
        <p>Tous les votes sont reçus.</p>
      )}
    </GmDisclosure>
  );
}

export function GmGamePanel({
  view,
  game,
  locked,
  send,
  hideRestart = false,
  settings,
}: {
  view: GmSessionView;
  game: GameProjection;
  locked: boolean;
  send: Send;
  hideRestart?: boolean;
  settings?: ReactNode;
}) {
  const play = game.play!,
    turns = play.turns,
    ballot = play.ballot;
  const heading = gmHeading(game),
    resolved = ballot?.status === "resolved";
  const description = !play.dealt
    ? "La distribution attribue les mots secrets de façon confidentielle. La discussion de la manche 1 commencera ensuite."
    : game.phase.id === "discussion"
      ? turns?.complete
        ? "Les tours d’indices sont terminés. Vous pouvez ouvrir les votes."
        : "Écoutez son indice, puis confirmez son passage."
      : ballot?.status === "open"
        ? ballot.complete
          ? "Tous les joueurs actifs ont voté. Vous pouvez confirmer la révélation du résultat."
          : "Attendez le vote de chaque joueur actif avant de révéler le résultat."
        : play.outcome
          ? play.outcome.label
          : ballot?.tied
            ? "Personne n’est éliminé. Les mots restent privés."
            : "Le décompte est public. Les mots restent privés jusqu’à la fin de la partie.";
  const title = !play.dealt
    ? `${view.participants.length} joueurs · Classique`
    : game.phase.id === "discussion"
      ? turns?.complete
        ? "Les indices sont terminés"
        : turns?.current
          ? playerName(view, turns.current)
          : "Discussion libre"
      : ballot?.status === "open"
        ? ballot.complete
          ? "Prêt pour la révélation"
          : "Les joueurs votent"
        : play.outcome
          ? play.outcome.label
          : ballot?.tied
            ? "Égalité : personne n’est éliminé"
            : ballot?.eliminated
              ? `${playerName(view, ballot.eliminated)} est éliminé`
              : heading.title;
  const clueRounds = game.values.find((v) => v.id === "clue-rounds")?.value;
  const finalPublic = play.outcome
    ? (view.publicGame?.values.filter((v) => v.id === "secret-word") ?? [])
    : [];
  const uniqueWords = [...new Set(finalPublic.map((v) => String(v.value)))];
  return (
    <section
      className="gm-studio gm-game play-panel is-gm is-focused"
      id="game"
      data-audience="gm"
      data-state={
        play.outcome
          ? "finished"
          : !play.dealt
            ? "preparation"
            : ballot?.status === "open"
              ? "vote"
              : resolved
                ? "result"
                : "active"
      }
    >
      <div className="gm-phase-line">
        <p className="game-phase" role="status">
          {game.phase.id === "result" ? "Résultat du vote" : game.phase.label}
          {play.round > 0 && <span> · Manche {play.round}</span>}
        </p>
        {turns && game.phase.id === "discussion" && (
          <span className="gm-chip">
            {turns.complete
              ? `${turns.total} tours terminés`
              : `Tour d’indices ${turns.round} / ${turns.total}`}
          </span>
        )}
        {ballot && (
          <span className="gm-chip">
            {ballot.voted.length} / {ballot.eligible.length} votes{" "}
            {resolved ? "exprimés" : "reçus"}
          </span>
        )}
      </div>
      <div className="gm-game-grid">
        <div className="gm-card gm-action-card">
          <div className="gm-card-heading">
            <span className="gm-kicker">
              {!play.dealt
                ? "EFFECTIF FIGÉ"
                : play.outcome
                  ? "RÉSULTAT FINAL"
                  : game.phase.id === "discussion"
                    ? turns?.complete
                      ? "TOURS D’INDICES TERMINÉS"
                      : "À SON TOUR"
                    : resolved
                      ? ballot?.tied
                        ? "ÉGALITÉ"
                        : "DÉCISION D’ÉLIMINATION"
                      : "PARTICIPATION AU VOTE"}
            </span>
            {turns && game.phase.id === "discussion" && (
              <span className="gm-chip">
                {turns.completed.length} / {turns.order.length} passages
                confirmés
              </span>
            )}
          </div>
          <h2
            className={
              play.outcome
                ? "play-outcome"
                : turns?.current
                  ? "speaker-focus"
                  : ""
            }
          >
            {title}
          </h2>
          <p className={turns?.current ? "turn-current" : undefined}>
            {turns?.current && (
              <span className="sr-only">
                Au tour de : {playerName(view, turns.current)}.{" "}
              </span>
            )}
            {description}
          </p>
          {turns && game.phase.id === "discussion" && (
            <div
              className="turn-progress gm-progress"
              data-round={turns.round}
              data-completed={turns.completed.length}
              data-complete={String(turns.complete)}
              data-count={turns.order.length}
              data-total={turns.total}
              aria-label="Tours de parole"
            >
              <progress
                aria-label="Progression du tour d’indices"
                max={turns.order.length}
                value={turns.completed.length}
              />
              <span className="gm-footnote">
                Tour d’indices {turns.round} / {turns.total}
              </span>
            </div>
          )}
          {ballot?.status === "open" && (
            <div className="gm-progress">
              <progress
                aria-label="Participation au vote"
                max={ballot.eligible.length}
                value={ballot.voted.length}
              />
              <p className="gm-footnote">
                {ballot.voted.length} / {ballot.eligible.length} votes reçus
              </p>
            </div>
          )}
          {!play.dealt && (
            <p className="gm-note">
              {view.participants.length} joueurs inscrits ·{" "}
              {typeof clueRounds === "number"
                ? `${clueRounds} tours d’indices`
                : "Mots privés"}
            </p>
          )}
          {resolved && !play.outcome && (
            <p className="gm-note">
              La partie continue avec{" "}
              {play.roster.filter((p) => p.active).length} joueurs actifs. Les
              mots restent privés.
            </p>
          )}
          {play.outcome && (
            <div className="gm-final-words">
              <h3>RÉVÉLATION AUTORISÉE DES MOTS SECRETS</h3>
              <div>
                {uniqueWords.map((word) => (
                  <article key={word}>
                    <strong>{word}</strong>
                  </article>
                ))}
              </div>
              <p className="gm-footnote">
                Ces informations sont maintenant publiques.
              </p>
            </div>
          )}
          <div
            className="gm-main-actions game-actions"
            data-has-action={
              game.actions.length > 0 || (!!play.outcome && !hideRestart)
            }
          >
            {game.actions.map((action) => (
              <ActionForm
                key={`${game.runId}:${action.id}`}
                action={action}
                runId={game.runId}
                locked={locked}
                send={send}
                stitch
              />
            ))}
            {play.outcome && !hideRestart && (
              <GmReplay game={game} send={send} locked={locked} primary />
            )}
            {!game.actions.length && !play.outcome && (
              <p className="gm-footnote">
                {ballot?.status === "open"
                  ? "La révélation attend tous les joueurs actifs."
                  : "Aucune action disponible pour le moment."}
              </p>
            )}
          </div>
          {play.outcome && (
            <p className="gm-footnote gm-replay-hint">
              Les joueurs et leurs accès seront conservés. Les mots seront
              redistribués au prochain démarrage.
            </p>
          )}
        </div>
        <GmRoster view={view} game={game} mode="game" />
      </div>
      <div className="gm-secondary">
        <GmDelegatedVote view={view} game={game} locked={locked} send={send} />
        <GmPrivateInfo view={view} game={game} />
        <GmJournal view={view} />
        {settings}
        {!hideRestart && !play.outcome && !settings && (
          <GmReplay game={game} send={send} locked={locked} />
        )}
      </div>
    </section>
  );
}
