"use client";
import { useEffect, useState } from "react";
import type {
  LobbyAction,
  SessionView,
} from "@extension-twitch/contracts/sessions";
import type {
  GameProjection,
  Scalar,
} from "@extension-twitch/contracts/game-definition";
import { ThemeControl } from "./application-theme";
import { CopyLink } from "./copy-link";
import { HomeIcon } from "./home-icon";
import { LobbyRoster } from "./stitch-lobby";
import {
  SessionFeedback,
  StitchDisclosure,
  StitchHeader,
  type SessionFeedbackProps,
} from "./stitch-frame";
import { useConfirm } from "./ui/feedback";

type PlayerView = Extract<SessionView, { audience: "player" }>;
type Send = (action?: LobbyAction) => Promise<boolean | void>;
const playerName = (view: PlayerView, id?: string) =>
  view.participants.find((p) => p.id === id)?.name ?? "Joueur";

export function UndercoverCompanion({
  view,
  locked,
  send,
  privateUrl,
  feedback,
  embedded = false,
}: {
  view: PlayerView;
  locked: boolean;
  send: Send;
  privateUrl?: string;
  feedback?: Omit<SessionFeedbackProps, "send">;
  embedded?: boolean;
}) {
  const Tag = embedded ? "div" : "main";
  const me = view.participants.find((p) => p.id === view.participantId);
  return (
    <Tag
      className={`stitch-page stitch-companion ${embedded ? "stitch-embedded" : ""}`}
      data-experience="player"
    >
      <div className="stitch-phone">
        <StitchHeader name={me?.name ?? "Joueur"} />
        {feedback && (
          <SessionFeedback
            {...feedback}
            send={async () => (await send()) !== false}
          />
        )}
        {view.game?.play ? (
          <CompanionGame
            key={view.game.runId}
            view={view}
            game={view.game}
            locked={locked}
            send={send}
          />
        ) : (
          <>
            <section className="stitch-waiting">
              {view.title !== "Undercover" && (
                <p className="stitch-hint">
                  <span>{view.title}</span>
                </p>
              )}
              <h1>
                {me?.ready ? "Vous êtes prêt." : "Bienvenue dans la partie"}
              </h1>
              <p>Le Game Master prépare la partie. Votre mot apparaîtra ici.</p>
              <StitchDisclosure title="Qui participe ?">
                <LobbyRoster view={view} />
              </StitchDisclosure>
            </section>
            <div className="stitch-ready-action">
              <button
                className={`stitch-button ${me?.ready ? "" : "stitch-primary"}`}
                disabled={locked}
                onClick={() =>
                  void send({ type: "participant.ready", ready: !me?.ready })
                }
              >
                {me?.ready ? "Je ne suis plus prêt" : "Je suis prêt"}
              </button>
              <p className="stitch-hint">
                Ce statut est facultatif. Vous pouvez changer d’avis tant que le
                Game Master prépare la partie.
              </p>
            </div>
          </>
        )}
        <footer className="stitch-companion-tools">
          {privateUrl && (
            <StitchDisclosure title="Conserver mon accès joueur" icon="lock">
              <CopyLink
                label="Lien privé joueur — ne pas partager"
                value={privateUrl}
                privateLink
              />
            </StitchDisclosure>
          )}
          <ThemeControl icon={<HomeIcon name="palette" />} />
        </footer>
      </div>
    </Tag>
  );
}

function CompanionGame({
  view,
  game,
  locked,
  send,
}: {
  view: PlayerView;
  game: GameProjection;
  locked: boolean;
  send: Send;
}) {
  const [wordVisible, setWordVisible] = useState(true);
  const play = game.play!;
  const me = play.roster.find((p) => p.id === view.participantId);
  const ballot = play.ballot;
  const ownWord = game.values.find(
    (v) => v.id === "secret-word" && v.participantId === view.participantId,
  );
  const outcome = play.outcome;
  const voting = ballot?.status === "open";
  const result = ballot?.status === "resolved";
  const showingWord =
    play.dealt && wordVisible && !voting && !result && !outcome && me?.active;
  const phase =
    play.turns && game.phase.id === "discussion"
      ? `Manche ${play.round} · Tour d’indices ${play.turns.round} sur ${play.turns.total}`
      : play.round
        ? `Manche ${play.round} · ${game.phase.label}`
        : game.phase.label;
  const personalCard = !outcome && (
    <section
      className={`personal-card stitch-card stitch-secret ${showingWord ? "stitch-secret-full" : "stitch-secret-compact"}`}
      aria-label="Votre carte privée"
    >
      {!play.dealt ? (
        <>
          <h2>Votre mot apparaîtra ici</h2>
          <p>Le GM va vous distribuer vos informations.</p>
        </>
      ) : (
        <>
          <div>
            {wordVisible ? (
              <>
                <h2>Votre mot secret</h2>
                {showingWord && <p>Gardez-le pour vous.</p>}
                <div className="game-values" aria-label="Informations de jeu">
                  {ownWord && (
                    <article>
                      <span className="sr-only">{ownWord.label}</span>
                      <strong>{String(ownWord.value)}</strong>
                    </article>
                  )}
                </div>
              </>
            ) : (
              <p>
                <HomeIcon name="hidden" />
                Votre mot est masqué
              </p>
            )}
            {me?.active === false && (
              <small>Vous êtes éliminé. Vous ne votez plus.</small>
            )}
          </div>
          <button
            className={`stitch-button ${showingWord ? "stitch-primary" : ""}`}
            type="button"
            aria-expanded={wordVisible}
            onClick={() => setWordVisible(!wordVisible)}
          >
            <HomeIcon name={wordVisible ? "hidden" : "eye"} />
            {wordVisible ? "Masquer mon mot" : "Voir mon mot"}
          </button>
        </>
      )}
    </section>
  );
  return (
    <section
      id="game"
      className="stitch-player-game"
      data-audience="player"
      data-state={
        outcome
          ? "finished"
          : !play.dealt
            ? "preparation"
            : voting
              ? "vote"
              : result
                ? "result"
                : "active"
      }
    >
      <p className="game-phase stitch-phase" role="status">
        <span className="sr-only">{game.phase.label} · </span>
        {phase}
      </p>
      <div className="stitch-player-main">
        {outcome ? (
          <FinalResult view={view} game={game} />
        ) : !play.dealt ? (
          <>
            <div className="stitch-waiting">
              <h1>La partie se prépare</h1>
              <p>Le Game Master va distribuer les mots secrets.</p>
            </div>
            {personalCard}
          </>
        ) : (
          <>
            {voting && me?.active ? (
              ballot.myVote ? (
                <div className="stitch-card stitch-result" role="status">
                  <span className="stitch-symbol">
                    <HomeIcon name="check" />
                  </span>
                  <h1>Vote enregistré</h1>
                  <p>
                    Votre vote pour{" "}
                    <strong>{playerName(view, ballot.myVote)}</strong> est
                    enregistré.
                  </p>
                  <p>En attente du résultat.</p>
                  <p className="stitch-vote-count">
                    {ballot.voted.length} votes reçus sur{" "}
                    {ballot.eligible.length}
                  </p>
                </div>
              ) : (
                <PlayerVote
                  key={`${game.runId}:${play.round}`}
                  view={view}
                  game={game}
                  locked={locked}
                  send={send}
                />
              )
            ) : result ? (
              <RoundResult view={view} game={game} />
            ) : me?.active === false ? (
              <div className="stitch-card stitch-result">
                <span className="stitch-symbol">
                  <HomeIcon name="ban" />
                </span>
                <h1>Vous êtes éliminé</h1>
                {me.role && (
                  <span className="stitch-pill">Votre camp : {me.role}</span>
                )}
                <p>Vous pouvez suivre la partie, mais vous ne votez plus.</p>
              </div>
            ) : null}
            {showingWord && personalCard}
            {!voting && !result && (
              <TurnCard
                view={view}
                game={game}
                compact={!!showingWord || me?.active === false}
              />
            )}
            {!showingWord && personalCard}
          </>
        )}
      </div>
      <div className="stitch-player-details">
        {result && (
          <StitchDisclosure title="Détail des votes" icon="chart">
            <Tallies view={view} game={game} />
          </StitchDisclosure>
        )}
        <StitchDisclosure
          title={outcome ? "Voir les joueurs" : "Suivre la partie"}
        >
          <p>
            {play.roster.filter((p) => p.active).length} joueurs actifs ·{" "}
            {game.phase.label}
          </p>
          <ul className="stitch-roster">
            {play.roster.map((p) => (
              <li key={p.id}>
                <span className="stitch-avatar" aria-hidden="true">
                  {playerName(view, p.id).slice(0, 1)}
                </span>
                <div>
                  <strong>{playerName(view, p.id)}</strong>
                  <small>
                    {p.active ? "En jeu" : "Éliminé"}
                    {p.role ? ` · ${p.role}` : ""}
                  </small>
                </div>
                {voting && ballot.eligible.includes(p.id) && (
                  <span className="stitch-pill">
                    {ballot.voted.includes(p.id) ? "A voté" : "Vote attendu"}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <ol className="stitch-events">
            {view.events.slice(-5).map((e) => (
              <li key={e.version}>{e.message}</li>
            ))}
          </ol>
        </StitchDisclosure>
      </div>
    </section>
  );
}

function TurnCard({
  view,
  game,
  compact,
}: {
  view: PlayerView;
  game: GameProjection;
  compact: boolean;
}) {
  const turns = game.play!.turns;
  const mine = turns?.current === view.participantId;
  const title = !turns
    ? "Discussion libre"
    : mine
      ? "À vous de jouer"
      : turns?.current
        ? `Au tour de ${playerName(view, turns.current)}`
        : "Les indices sont terminés";
  return (
    <section
      className={`stitch-card stitch-turn ${compact ? "stitch-turn-compact" : ""}`}
    >
      <span className="stitch-symbol">
        <HomeIcon name={mine ? "mic" : "audio"} />
      </span>
      <div>
        <h1>{title}</h1>
        <p className="turn-current">
          {turns?.current && (
            <span className="sr-only">
              Au tour de : {playerName(view, turns.current)}.{" "}
            </span>
          )}
          {!turns
            ? "Échangez vos indices à voix haute. Le Game Master ouvrira le vote."
            : mine
              ? "C’est à vous : donnez votre indice à voix haute."
              : turns?.current
                ? "Écoutez son indice, puis attendez votre tour."
                : "Le Game Master ouvrira le vote."}
        </p>
        {mine && (
          <p className="stitch-hint">Le Game Master confirme votre passage.</p>
        )}
      </div>
    </section>
  );
}

function PlayerVote({
  view,
  game,
  locked,
  send,
}: {
  view: PlayerView;
  game: GameProjection;
  locked: boolean;
  send: Send;
}) {
  const confirm = useConfirm();
  const [target, setTarget] = useState("");
  const action = game.actions.find((a) => a.parameters.some((p) => p.choices));
  const field = action?.parameters.find((p) => p.choices);
  const choices = field?.choices ?? [];
  useEffect(() => {
    if (!choices.includes(target)) setTarget("");
  }, [choices, target]);
  if (!action || !field)
    return (
      <div className="stitch-card stitch-result">
        <h1>Votes en cours</h1>
        <p>Aucune action disponible pour vous à cette étape.</p>
      </div>
    );
  return (
    <form
      className="stitch-vote"
      onSubmit={(e) => {
        e.preventDefault();
        if (locked || !choices.includes(target)) return;
        const parameters: Record<string, Scalar> = Object.fromEntries(
          action.parameters.map((p) => [
            p.id,
            p.id === field.id ? target : p.value.initial,
          ]),
        );
        void confirm({
          title: "Confirmer ce vote ?",
          description: `Vous votez contre ${playerName(view, target)}. Ce choix ne pourra plus être modifié.`,
          confirmLabel: "Confirmer mon vote",
          tone: "vote",
          presentation: "stitch",
          onConfirm: () =>
            send({
              type: "game.action",
              runId: game.runId,
              actionId: action.id,
              parameters,
            }),
        });
      }}
    >
      <h1>Qui souhaitez-vous éliminer ?</h1>
      <p>Un seul choix. Votre vote sera définitif.</p>
      <fieldset disabled={locked} className="vote-choice">
        <legend className="sr-only">Pour qui souhaitez-vous voter ?</legend>
        <div className="stitch-candidates">
          {choices.map((id) => (
            <label key={id} className={id === target ? "selected" : ""}>
              <span className="stitch-avatar" aria-hidden="true">
                {playerName(view, id).slice(0, 1)}
              </span>
              <span>{playerName(view, id)}</span>
              <input
                type="radio"
                name="vote-target"
                value={id}
                aria-label={playerName(view, id)}
                checked={target === id}
                onChange={() => setTarget(id)}
              />
            </label>
          ))}
        </div>
        <button
          className="stitch-button stitch-primary"
          disabled={locked || !choices.includes(target)}
        >
          Voter
        </button>
      </fieldset>
    </form>
  );
}
function Tallies({ view, game }: { view: PlayerView; game: GameProjection }) {
  return (
    <div className="stitch-tallies">
      {game.play!.ballot?.tallies.map((t) => (
        <p key={t.participantId}>
          <span>{playerName(view, t.participantId)}</span>
          <strong>{t.count} voix</strong>
        </p>
      ))}
    </div>
  );
}
function RoundResult({
  view,
  game,
}: {
  view: PlayerView;
  game: GameProjection;
}) {
  const ballot = game.play!.ballot!;
  const eliminated = game.play!.roster.find((p) => p.id === ballot.eliminated);
  return (
    <div className="stitch-card stitch-result play-vote-result" role="status">
      <span className="stitch-symbol">
        <HomeIcon name={ballot.tied ? "equal" : "ban"} />
      </span>
      <h1>
        {ballot.tied
          ? "Égalité"
          : ballot.eliminated
            ? `${playerName(view, ballot.eliminated)} est éliminé.`
            : "Résultat du vote"}
      </h1>
      {eliminated?.role && (
        <span className="stitch-pill">Camp révélé : {eliminated.role}</span>
      )}
      <p>{ballot.tied ? "Personne n’est éliminé." : "La partie continue."}</p>
      <p>Le Game Master lancera la prochaine manche.</p>
    </div>
  );
}
function FinalResult({
  view,
  game,
}: {
  view: PlayerView;
  game: GameProjection;
}) {
  const play = game.play!,
    outcome = play.outcome!;
  const me = play.roster.find((p) => p.id === view.participantId);
  const draw = outcome.id === "round-limit";
  const won =
    me?.role &&
    ((outcome.id === "civils-win" && me.role === "Civil") ||
      (outcome.id === "undercover-win" && me.role === "Undercover"));
  return (
    <div
      className="stitch-card stitch-result stitch-final play-outcome"
      role="status"
    >
      <span className="stitch-symbol">
        <HomeIcon
          name={draw ? "equal" : won ? "trophy" : me?.role ? "sad" : "info"}
        />
      </span>
      <h1>
        {draw
          ? "Partie nulle"
          : me?.role
            ? won
              ? "Vous avez gagné !"
              : "Vous avez perdu"
            : "Partie terminée"}
      </h1>
      <h2 className={draw ? "stitch-draw-reason" : undefined}>
        {outcome.label}
      </h2>
      {me?.role && <span className="stitch-pill">Votre camp : {me.role}</span>}
      <section className="stitch-final-words">
        <h3>MOTS DE LA PARTIE</h3>
        <div>
          {["Civil", "Undercover"].map((role) => {
            const person = play.roster.find((p) => p.role === role);
            const word = game.values.find(
              (v) => v.id === "secret-word" && v.participantId === person?.id,
            );
            return word ? (
              <article key={role}>
                <span>{role === "Civil" ? "Civils" : "Undercover"}</span>
                <strong>{String(word.value)}</strong>
              </article>
            ) : null;
          })}
        </div>
      </section>
      <p>Le Game Master peut préparer une nouvelle partie.</p>
    </div>
  );
}
