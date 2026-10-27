import { historicalBroadcastTheme } from "@extension-twitch/contracts/themes";
import type { CSSProperties } from "react";
import {
  createUndercoverLayout,
  type UndercoverLayout,
  type WidgetId,
} from "@extension-twitch/contracts/undercover-layout";
import { playerCardRects } from "../lib/undercover-layout";
import type { PublicSessionView } from "@extension-twitch/contracts/sessions";
import { publicEventsForRun } from "../lib/public-cues";
import type { PublicCue } from "../lib/public-cues";
import { GameValues } from "./game-values";

/** One renderer for stream preview, comparison and OBS. Public projections only. */
export function BroadcastOverlay({
  view,
  connection,
  cue,
  layout: override,
}: {
  view: PublicSessionView | null;
  connection: string;
  cue: PublicCue | null;
  layout?: UndercoverLayout;
}) {
  const game = view?.publicGame,
    play = game?.play;
  const name = (id: string) =>
    view?.participants.find((p) => p.id === id)?.name ?? "Joueur";
  const roster =
    play?.roster ??
    view?.participants.map((p) => ({
      id: p.id,
      active: true,
      role: undefined,
    })) ??
    [];
  const ballot = play?.ballot;
  const layout =
    override ??
    view?.overlayLayout ??
    (view?.gameId === "undercover" ? createUndercoverLayout() : undefined);
  const widget = (id: WidgetId) => ({
    "data-widget": id,
    style: layout
      ? ({
          left: `${layout.widgets[id].x / 19.2}%`,
          top: `${layout.widgets[id].y / 10.8}%`,
          width: `${layout.widgets[id].width / 19.2}%`,
          height: `${layout.widgets[id].height / 10.8}%`,
        } as CSSProperties)
      : undefined,
  });
  const ordered = layout
    ? layout.players.order.flatMap((i) => (roster[i] ? [roster[i]!] : []))
    : roster;
  const cards = layout ? playerCardRects(layout, roster.length) : [];

  return (
    <section
      className={`broadcast-overlay ${layout ? "has-layout" : ""}`}
      aria-label="Overlay public de l’émission"
      data-theme={view?.broadcastTheme ?? historicalBroadcastTheme}
      data-renderer="broadcast-v1"
      data-version={view?.version ?? 0}
      data-phase={game?.phase.id ?? "lobby"}
      data-run={game?.runId ?? ""}
    >
      <header className="broadcast-heading" {...widget("header")}>
        <div>
          <span className="broadcast-brand">XT · SHOWTIME</span>
          <h2>{game?.title ?? view?.title ?? "Extension Twitch Studio"}</h2>
        </div>
        <span
          className={`broadcast-connection ${connection}`}
          data-testid="broadcast-connection"
        >
          {connection === "preview"
            ? "Aperçu de préparation"
            : connection === "connected"
              ? "Synchronisé"
              : connection === "reconnecting"
                ? "Reconnexion…"
                : connection === "denied"
                  ? "Plateau indisponible"
                  : "Connexion…"}
        </span>
      </header>
      <div className="broadcast-phase" {...widget("phase")}>
        <strong>
          {play?.turns && game?.phase.id === "discussion"
            ? `Tour d’indices ${play.turns.round} / ${play.turns.total}`
            : (game?.phase.label ??
              (view ? "En attente des joueurs" : "Chargement du plateau"))}
        </strong>
        {!layout && (
          <span>
            {play && play.round > 0 ? `Manche ${play.round} · ` : ""}
            {play
              ? `${roster.filter((p) => p.active).length} joueurs actifs`
              : `${roster.length} participants`}
          </span>
        )}
        {play?.turns && game?.phase.id === "discussion" && (
          <p data-testid="broadcast-turns">
            {play.turns.complete ? (
              "Indices terminés"
            ) : (
              <>
                <span className="broadcast-speaker">
                  Au tour de {name(play.turns.current ?? "")}
                </span>
                {play.turns.completed.length} / {play.turns.order.length}{" "}
                passages confirmés
              </>
            )}
          </p>
        )}
      </div>
      {layout && (
        <div className="broadcast-round" {...widget("round")}>
          <strong>
            {play && play.round > 0
              ? `Manche ${play.round}`
              : "Avant la partie"}
          </strong>
          <span>
            {play?.dealt
              ? `${roster.filter((p) => p.active).length} joueurs actifs`
              : `${roster.length} participants`}
          </span>
        </div>
      )}
      <div
        {...widget("players")}
        className="broadcast-roster"
        style={
          layout
            ? widget("players").style
            : {
                gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, roster.length))}, minmax(0,1fr))`,
              }
        }
      >
        {ordered.map((p, i) => (
          <article
            key={p.id}
            style={
              layout && cards[i]
                ? {
                    left: `${cards[i]!.x}%`,
                    top: `${cards[i]!.y}%`,
                    width: `${cards[i]!.width}%`,
                    height: `${cards[i]!.height}%`,
                    fontSize: `${Math.max(0.65, Math.min(1.4, ((layout.widgets.players.height * cards[i]!.height) / 100 / 1920) * 18))}cqw`,
                  }
                : undefined
            }
            data-player={p.id}
            data-active={p.active}
            className={!p.active ? "broadcast-eliminated" : ""}
          >
            <strong>{name(p.id)}</strong>
            <span>
              {!p.active
                ? "Éliminé"
                : ballot?.status === "open"
                  ? ballot.voted.includes(p.id)
                    ? "A voté"
                    : "Vote attendu"
                  : play?.turns?.current === p.id
                    ? "À son tour"
                    : play?.turns?.completed.includes(p.id)
                      ? "Indice donné"
                      : play?.dealt
                        ? "En jeu"
                        : "En attente"}
            </span>
            {p.role && <small>{p.role}</small>}
            {ballot?.status === "resolved" && (
              <span>
                {ballot.tallies.find((t) => t.participantId === p.id)?.count ??
                  0}{" "}
                voix
              </span>
            )}
          </article>
        ))}
      </div>
      {layout && (
        <div className="broadcast-vote" {...widget("vote")}>
          <strong>Vote</strong>
          <p data-testid="broadcast-votes">
            {ballot
              ? `${ballot.voted.length} / ${ballot.eligible.length} votes reçus`
              : "Pas de vote en cours"}
          </p>
        </div>
      )}
      <div
        className="broadcast-result"
        {...widget("result")}
        aria-live="polite"
      >
        {play?.outcome ? (
          <h3>{play.outcome.label}</h3>
        ) : ballot?.status === "open" ? (
          <p data-testid={layout ? undefined : "broadcast-votes"}>
            {ballot.voted.length} / {ballot.eligible.length} votes reçus
          </p>
        ) : ballot?.status === "resolved" ? (
          <p>
            {ballot.tied
              ? "Égalité : personne n’est éliminé."
              : ballot.eliminated
                ? `${name(ballot.eliminated)} est éliminé.`
                : "Scrutin terminé."}
          </p>
        ) : (
          <p>
            {play?.dealt
              ? "Les indices sont donnés à voix haute."
              : view
                ? "Le Game Master prépare la partie."
                : "Chargement des informations publiques…"}
          </p>
        )}
        {game && (
          <GameValues game={game} names={view!.participants} compactNames />
        )}
      </div>
      <footer
        className="broadcast-events"
        {...widget("events")}
        aria-label="Événements publics"
      >
        <ol>
          {view &&
            publicEventsForRun(view).map((event) => (
              <li key={event.version}>
                {event.type === "game.configure"
                  ? "Le Game Master a préparé la partie."
                  : event.message}
              </li>
            ))}
        </ol>
      </footer>
      {cue && (
        <div
          className="broadcast-cue"
          data-testid="broadcast-cue"
          data-cue-id={cue.id}
          data-kind={cue.kind}
          key={cue.id}
          role="status"
        >
          {cue.message}
        </div>
      )}
    </section>
  );
}
