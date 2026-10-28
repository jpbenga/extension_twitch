import { historicalBroadcastTheme } from "@extension-twitch/contracts/themes";
import type { SessionView } from "@extension-twitch/contracts/sessions";
import { GameValues } from "./game-values";
import { PlaySummary } from "./play-panel";
import { findGame } from "../lib/demo";
import {
  publicPlayerStatus,
  publicBallotResult,
  publicResult,
} from "../lib/broadcast-presentation";
import { publicEventsForRun } from "../lib/public-cues";
import "../app/brand-fonts.css";

/** Responsive reader. The 16:9 renderer remains BroadcastOverlay, not this page. */
export function PublicSession({
  view,
  standalone = false,
  connection,
}: {
  view: SessionView;
  standalone?: boolean;
  connection?: string;
}) {
  if (
    view.gameId !== "undercover" ||
    (view.publicGame && !view.publicGame.play)
  )
    return <LegacyPublicSession view={view} standalone={standalone} />;
  const game = view.publicGame;
  const play = game?.play;
  const turns = game?.phase.id === "discussion" ? play?.turns : undefined;
  const name = (id: string) =>
    view.participants.find((p) => p.id === id)?.name ?? "Joueur";
  const roster =
    play?.roster ??
    view.participants.map((p) => ({ id: p.id, active: true, role: undefined }));
  const ballot = play?.ballot;
  const Heading = standalone ? "h1" : "h3";
  const phase = turns
    ? `Tour d’indices ${turns.round} / ${turns.total}`
    : (game?.phase.label ?? "Salon d’attente");
  const events = view.audience === "public" ? publicEventsForRun(view) : [];
  return (
    <section
      className="real-stage broadcast-spectator"
      data-theme={view.broadcastTheme ?? historicalBroadcastTheme}
      aria-label="Plateau public synchronisé"
    >
      <header className="spectator-header real-stage-header">
        <strong>
          {view.gameId === "undercover"
            ? "UNDERCOVER"
            : findGame(view.gameId).title}
        </strong>
        <span className="spectator-kicker">Plateau public</span>
        <span className="spectator-sr-only">{phase}</span>
        {standalone && connection && (
          <span
            className={`spectator-connection ${connection}`}
            role="status"
            data-testid="session-connection"
          >
            <i aria-hidden="true" />
            {connection === "connected"
              ? "Synchronisé"
              : connection === "reconnecting"
                ? "Reconnexion…"
                : connection === "denied"
                  ? "Plateau indisponible"
                  : "Connexion…"}
          </span>
        )}
      </header>
      <div className="spectator-main play-summary">
        <div className="spectator-hero real-stage-title">
          <section className="spectator-card spectator-phase">
            <p className="spectator-kicker">{phase}</p>
            <Heading>
              {turns ? (
                turns.complete ? (
                  "Indices terminés"
                ) : (
                  <>
                    À <em>{name(turns.current ?? "")}</em> de donner son indice
                  </>
                )
              ) : (
                (game?.phase.label ?? view.title)
              )}
            </Heading>
            {turns && (
              <>
                <progress
                  aria-label="Passages d’indices confirmés"
                  max={Math.max(1, turns.order.length)}
                  value={turns.completed.length}
                />
                <p className="spectator-muted">
                  {turns.completed.length} / {turns.order.length} passages
                  confirmés
                </p>
              </>
            )}
            {ballot?.status === "open" && (
              <p className="spectator-muted">
                {ballot.voted.length} / {ballot.eligible.length} votes reçus
              </p>
            )}
          </section>
          <section className="spectator-card spectator-round">
            <h2>
              {play && play.round > 0
                ? `Manche ${play.round}`
                : "Avant la partie"}
            </h2>
            <p>
              {play?.dealt
                ? `${roster.filter((p) => p.active).length} joueurs actifs`
                : `${roster.length} participants`}
            </p>
            <p className="spectator-muted">{publicResult(play, name)}</p>
          </section>
        </div>
        <section>
          <h2 className="spectator-kicker">Les joueurs</h2>
          <div className="spectator-roster">
            {roster.map((p, i) => (
              <article
                className="spectator-card real-player"
                key={p.id}
                data-current={turns?.current === p.id && !turns.complete}
                data-active={p.active}
              >
                <small>{String(i + 1).padStart(2, "0")}</small>
                <strong>{name(p.id)}</strong>
                <span>{publicPlayerStatus(play, p.id, p.active)}</span>
                {p.role && <span>{p.role}</span>}
                {ballot?.status === "resolved" && (
                  <span>
                    {ballot.tallies.find((t) => t.participantId === p.id)
                      ?.count ?? 0}{" "}
                    voix
                  </span>
                )}
                {!play && (
                  <small>
                    {view.participants.find(
                      (participant) => participant.id === p.id,
                    )?.ready
                      ? "Prêt"
                      : "En préparation"}
                  </small>
                )}
              </article>
            ))}
          </div>
          {!roster.length && (
            <p className="spectator-muted">
              Le plateau attend ses premiers invités.
            </p>
          )}
        </section>
        {game &&
          (play?.outcome ||
            game.values.length > 0 ||
            game.assets.length > 0) && (
            <section
              className="spectator-card spectator-result"
              aria-live="polite"
            >
              <h2 className={play?.outcome ? "play-outcome" : undefined}>
                {play?.outcome?.label ?? "Informations publiques"}
              </h2>
              <GameValues game={game} names={view.participants} />
            </section>
          )}
        <div className="spectator-footer">
          <section className="spectator-card">
            <h2 className="spectator-kicker">Vote</h2>
            <p>
              {ballot
                ? `${ballot.voted.length} / ${ballot.eligible.length} votes reçus`
                : "Pas de vote en cours"}
            </p>
            {ballot?.status === "resolved" && (
              <p>{publicBallotResult(play, name)}</p>
            )}
          </section>
          <section className="spectator-card">
            <h2 className="spectator-kicker">Événements publics</h2>
            <ol className="spectator-events">
              {events.map((event) => (
                <li key={event.version}>
                  {event.type === "game.configure"
                    ? "Le Game Master a préparé la partie."
                    : event.message}
                </li>
              ))}
            </ol>
            {!events.length && (
              <p className="spectator-muted">
                Le Game Master prépare la partie.
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

function LegacyPublicSession({
  view,
  standalone = false,
}: {
  view: SessionView;
  standalone?: boolean;
}) {
  const game = findGame(view.gameId);
  const Heading = standalone ? "h1" : "h3";
  const ready = view.participants.filter((player) => player.ready).length;
  return (
    <section
      className={`real-stage ${game.theme} ${view.publicGame ? "has-game" : ""}`}
      data-theme={view.broadcastTheme ?? historicalBroadcastTheme}
      aria-label="Plateau public synchronisé"
    >
      <div className="real-stage-header">
        <span className="stage-brand">
          XT<span>SHOWTIME</span>
        </span>
        <span>{view.publicGame?.phase.label ?? "SALON D’ATTENTE"}</span>
      </div>
      <div className="real-stage-title">
        <span className="eyebrow">{view.publicGame?.title ?? game.title}</span>
        <Heading>{view.title}</Heading>
        <p>
          Animé par {view.hostName} ·{" "}
          {view.publicGame?.play
            ? `${view.participants.length} participants`
            : `${ready} / ${view.participants.length} prêts`}
        </p>
      </div>
      {!view.publicGame?.play && (
        <div className="real-stage-players">
          {view.participants.map((player, index) => (
            <article
              key={player.id}
              className={`real-player ${player.ready ? "is-ready" : ""}`}
            >
              <span className={`avatar avatar-${index % 6}`}>
                {[...player.name].slice(0, 2).join("").toLocaleUpperCase("fr")}
              </span>
              <strong>{player.name}</strong>
              <span>{player.ready ? "Prêt" : "En préparation"}</span>
              <small>{player.connected ? "Connecté" : "Hors ligne"}</small>
            </article>
          ))}
        </div>
      )}
      {view.publicGame?.play && (
        <PlaySummary game={view.publicGame} view={view} />
      )}
      {view.participants.length === 0 && (
        <p className="empty-lobby">Le plateau attend ses premiers invités.</p>
      )}
      {view.publicGame && (
        <GameValues game={view.publicGame} names={view.participants} />
      )}
      <p className="real-stage-caption">
        Session réelle ·{" "}
        {view.publicGame ? "expérience synchronisée" : "aucun jeu en cours"} · v
        {view.version}
      </p>
    </section>
  );
}
