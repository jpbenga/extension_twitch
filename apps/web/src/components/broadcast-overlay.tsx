import type { PublicSessionView } from "@extension-twitch/contracts/sessions";
import { publicEventsForRun } from "../lib/public-cues";
import type { PublicCue } from "../lib/public-cues";
import { GameValues } from "./game-values";

/** One renderer for stream preview, comparison and OBS. Public projections only. */
export function BroadcastOverlay({
  view,
  connection,
  cue,
}: {
  view: PublicSessionView | null;
  connection: string;
  cue: PublicCue | null;
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
  return (
    <section
      className="broadcast-overlay"
      aria-label="Overlay public de l’émission"
      data-renderer="broadcast-v1"
      data-version={view?.version ?? 0}
      data-phase={game?.phase.id ?? "lobby"}
      data-run={game?.runId ?? ""}
    >
      <header className="broadcast-heading">
        <div>
          <span className="broadcast-brand">XT · SHOWTIME</span>
          <h2>{game?.title ?? view?.title ?? "Extension Twitch Studio"}</h2>
        </div>
        <span
          className={`broadcast-connection ${connection}`}
          data-testid="broadcast-connection"
        >
          {connection === "connected"
            ? "Synchronisé"
            : connection === "reconnecting"
              ? "Reconnexion…"
              : connection === "denied"
                ? "Plateau indisponible"
                : "Connexion…"}
        </span>
      </header>
      <div className="broadcast-phase">
        <strong>
          {game?.phase.label ??
            (view ? "En attente des joueurs" : "Chargement du plateau")}
        </strong>
        <span>
          {play && play.round > 0 ? `Manche ${play.round} · ` : ""}
          {play
            ? `${roster.filter((p) => p.active).length} joueurs actifs`
            : `${roster.length} participants`}
        </span>
        {play?.turns && (
          <p data-testid="broadcast-turns">
            Tour d’indices {play.turns.round} / {play.turns.total} ·{" "}
            {play.turns.complete
              ? "Indices terminés"
              : `${play.turns.completed.length} / ${play.turns.order.length} passages confirmés · Au tour de ${name(play.turns.current ?? "")}`}
          </p>
        )}
      </div>
      <div
        className="broadcast-roster"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, roster.length))}, minmax(0,1fr))`,
        }}
      >
        {roster.map((p) => (
          <article
            key={p.id}
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
      <div className="broadcast-result" aria-live="polite">
        {play?.outcome ? (
          <h3>{play.outcome.label}</h3>
        ) : ballot?.status === "open" ? (
          <p data-testid="broadcast-votes">
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
              ? "Les joueurs échangent leurs indices à voix haute."
              : view
                ? "Le Game Master prépare la partie."
                : "Chargement des informations publiques…"}
          </p>
        )}
        {game && <GameValues game={game} names={view!.participants} />}
      </div>
      <footer className="broadcast-events" aria-label="Événements publics">
        <ol>
          {view &&
            publicEventsForRun(view).map((event) => (
              <li key={event.version}>{event.message}</li>
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
