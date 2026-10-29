"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type {
  UndercoverLayout,
  WidgetId,
} from "@extension-twitch/contracts/undercover-layout";
import type { UndercoverContent } from "@extension-twitch/contracts/undercover-stream";
import type { PublicSessionView } from "@extension-twitch/contracts/sessions";
import { historicalBroadcastTheme } from "@extension-twitch/contracts/themes";
import type { PublicCue } from "../lib/public-cues";
import { publicBallotResult } from "../lib/broadcast-presentation";
import "../app/broadcast-tv.css";

/** Images are only URLs already granted by a public server projection. */
function ContentImage({
  content,
  connection,
}: {
  content: UndercoverContent;
  connection: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [content.image?.url, connection]);
  return content.image && !failed ? (
    <img
      src={content.image.url}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  ) : null;
}
function Mask() {
  return (
    <span className="tv-mask" aria-hidden="true">
      <svg viewBox="0 0 44 38" fill="none">
        <path
          d="M3 6L13 12Q22 4 31 12L41 6L37 25Q22 42 7 25Z"
          fill="currentColor"
        />
        <path
          d="M10 17L19 20L15 25L10 23ZM34 17L25 20L29 25L34 23Z"
          className="tv-mask-eyes"
        />
      </svg>
    </span>
  );
}
/** The TV layout consumes only the public projection, never a GM or player state. */
export function UndercoverTvOverlay({
  view,
  connection,
  cue,
  layout,
}: {
  view: PublicSessionView;
  connection: string;
  cue: PublicCue | null;
  layout: UndercoverLayout;
}) {
  const game = view.publicGame,
    play = game?.play,
    publication = view.undercoverBroadcast;
  const roster =
    play?.roster ??
    view.participants.map((p) => ({ id: p.id, active: true, role: undefined }));
  const ballot = play?.ballot;
  const isFinal = !!play?.outcome;
  const isVote = ballot?.status === "open";
  const discussion = game?.phase.id === "discussion";
  const name = (id: string) =>
    view.participants.find((p) => p.id === id)?.name ?? "Joueur";
  const slot = (id: string) =>
    view.participants.findIndex((p) => p.id === id) + 1;
  const speaker =
    discussion && !play?.turns?.complete ? play?.turns?.current : undefined;
  const phase = isFinal
    ? cue?.kind === "result"
      ? "Révélation"
      : "Résultat"
    : (game?.phase.label ?? "Préparation");
  const active = roster.filter((p) => p.active).length;
  const publicContents =
    publication && publication.mode !== "none" ? publication.contents : [];
  const assignments =
    publication &&
    (publication.mode === "assignments" || publication.mode === "final")
      ? publication.assignments
      : [];
  const content = (id: string) => publicContents.find((c) => c.id === id);
  const ordered = layout.players.order.flatMap((i) => {
    const p = view.participants[i];
    return p ? [p] : [];
  });
  const requestedPage =
    publication?.page ??
    Math.max(0, Math.floor((speaker ? slot(speaker) - 1 : 0) / 3));
  const pages = Math.max(1, Math.ceil(ordered.length / 3));
  const page = Math.min(pages - 1, requestedPage);
  const visiblePlayers = ordered.slice(page * 3, page * 3 + 3);
  const contentMoment =
    !isVote &&
    !isFinal &&
    (publication?.mode === "assignments" || cue?.kind === "content");
  const finalMoment =
    isFinal && (cue?.kind === "result" || cue?.kind === "content");
  const nextMoment = cue?.kind === "next";
  const resolvedMoment =
    !isFinal && ballot?.status === "resolved" && cue?.kind === "result";
  const compactLabel = isFinal
    ? play!.outcome!.label
    : publication?.transition
      ? "La prochaine manche attend le Game Master."
      : ballot?.status === "resolved"
        ? publicBallotResult(play, name)
        : undefined;
  const position = (id: WidgetId): CSSProperties => {
    const r = layout.widgets[id];
    return {
      left: `${r.x / 19.2}%`,
      top: `${r.y / 10.8}%`,
      width: `${r.width / 19.2}%`,
      height: `${r.height / 10.8}%`,
    };
  };
  const widget = (id: WidgetId, node: ReactNode, className: string) => (
    <div
      key={
        id === "phase"
          ? `${id}:${phase}:${play?.turns?.round}`
          : id === "players"
            ? `${id}:${speaker}:${play?.turns?.round}:${publication?.revision}:${page}`
            : id === "result"
              ? `${id}:${cue?.id ?? "durable"}:${page}`
              : id
      }
      data-motion-stage={cue?.stage ?? "hold"}
      data-motion-key={id}
      data-player-layout={
        id === "players" || id === "result"
          ? id === "result" && layout.players.mode === "vertical"
            ? "horizontal"
            : layout.players.mode
          : undefined
      }
      data-widget={id}
      className={className}
      style={position(id)}
    >
      {node}
    </div>
  );
  function cards(final = false) {
    return (
      <>
        {visiblePlayers.map((p) => {
          const assignment = assignments.find((a) => a.participantId === p.id);
          const item = assignment ? content(assignment.contentId) : undefined;
          const role = roster.find((r) => r.id === p.id)?.role;
          return (
            <article
              style={
                layout.players.mode === "free"
                  ? {
                      position: "absolute",
                      left: `${layout.players.cards[slot(p.id) - 1]!.x}%`,
                      top: `${layout.players.cards[slot(p.id) - 1]!.y}%`,
                      width: `${layout.players.cards[slot(p.id) - 1]!.width}%`,
                      height: `${layout.players.cards[slot(p.id) - 1]!.height}%`,
                    }
                  : undefined
              }
              className={`tv-content-card tv-assignment${final ? " tv-final-card" : ""}`}
              data-player={p.id}
              data-card-index={visiblePlayers.findIndex((v) => v.id === p.id)}
              data-active={roster.find((r) => r.id === p.id)?.active ?? true}
              key={p.id}
            >
              {item && <ContentImage content={item} connection={connection} />}
              <span className="tv-shade" />
              <span className="tv-player" title={p.name}>
                #{slot(p.id)} {p.name}
              </span>
              {item && (
                <strong className="tv-word" title={item.label}>
                  {item.label}
                </strong>
              )}
              {final && role && <span className="tv-camp">{role}</span>}
            </article>
          );
        })}
        {pages > 1 && (
          <span className="tv-page">
            {page * 3 + 1}–{Math.min((page + 1) * 3, ordered.length)} /{" "}
            {ordered.length} · {page + 1}/{pages}
          </span>
        )}
      </>
    );
  }
  return (
    <section
      className="broadcast-overlay has-layout broadcast-tv"
      aria-label="Overlay public de l’émission"
      data-theme={view.broadcastTheme ?? historicalBroadcastTheme}
      data-renderer="broadcast-v1"
      data-layout-version="2"
      data-motion={cue ? "event" : "stable"}
      data-motion-kind={cue?.kind ?? "none"}
      data-connection={connection}
      data-version={view.version}
      data-phase={game?.phase.id ?? "lobby"}
      data-run={game?.runId ?? ""}
    >
      {widget(
        "header",
        <>
          <Mask />
          <h2>UNDERCOVER</h2>
        </>,
        "tv-header tv-pill",
      )}
      {widget(
        "phase",
        <>
          <strong>{phase}</strong>
          {discussion && play?.turns && (
            <span className="tv-turn" data-testid="broadcast-turns">
              Tour {play.turns.round}/{play.turns.total}
            </span>
          )}
        </>,
        "tv-phase tv-pill",
      )}
      {widget(
        "round",
        <>
          <span
            aria-label={`${play?.dealt ? active : roster.length} joueurs ${play?.dealt ? "actifs " : ""}sur ${roster.length}`}
          >
            {play?.dealt && active !== roster.length
              ? `${active} en jeu`
              : `${roster.length} joueurs`}
          </span>
          <span className="tv-connection" data-testid="broadcast-connection">
            {connection === "connected"
              ? "Synchronisé"
              : connection === "preview"
                ? "Aperçu de préparation"
                : connection === "reconnecting"
                  ? "Reconnexion…"
                  : connection === "denied"
                    ? "Plateau indisponible"
                    : "Connexion…"}
          </span>
        </>,
        "tv-round tv-pill",
      )}
      {!contentMoment &&
        !isVote &&
        !isFinal &&
        !resolvedMoment &&
        !nextMoment &&
        speaker &&
        widget(
          "players",
          <div className="tv-event tv-speaker">
            <span className="tv-speaker-number">{slot(speaker)}</span>
            <div>
              <p>Au tour de</p>
              <strong title={name(speaker)}>{name(speaker)}</strong>
            </div>
          </div>,
          "tv-lower tv-speaker-group",
        )}
      {contentMoment &&
        publication?.mode === "duo" &&
        widget(
          "players",
          <>
            {publicContents.map((c) => (
              <article className="tv-content-card tv-duo" key={c.id}>
                <ContentImage content={c} connection={connection} />
                <span className="tv-shade" />
                <strong className="tv-word" title={c.label}>
                  {c.label}
                </strong>
              </article>
            ))}
            <span className="tv-vs" aria-hidden="true">
              VS
            </span>
          </>,
          "tv-lower tv-duo-group tv-transient",
        )}
      {contentMoment &&
        publication?.mode === "assignments" &&
        widget("players", cards(), "tv-lower tv-assignment-group")}
      {isVote &&
        widget(
          "vote",
          <div
            className="tv-event tv-vote-counter"
            data-total={ballot!.eligible.length}
          >
            <p>
              {ballot!.complete ? "Tous les votes reçus" : "Le vote est ouvert"}
            </p>
            <strong data-testid="broadcast-votes">
              {ballot!.voted.length} / {ballot!.eligible.length} votes reçus
            </strong>
            <span className="tv-vote-progress" aria-hidden="true">
              <span
                style={{
                  transform: `scaleX(${ballot!.eligible.length ? ballot!.voted.length / ballot!.eligible.length : 0})`,
                }}
              />
            </span>
          </div>,
          "tv-lower tv-vote",
        )}
      {(resolvedMoment || nextMoment || isFinal) &&
        widget(
          "result",
          finalMoment && publication?.mode === "final" ? (
            <>
              <span className="sr-only" role="status">
                {play?.outcome?.label}
              </span>
              {cards(true)}
            </>
          ) : (
            <div
              className={`tv-event${isFinal && !finalMoment ? " tv-result-compact" : ""}`}
              aria-live="polite"
            >
              {nextMoment ? (
                <>
                  <p>Manche suivante</p>
                  <strong>Le Game Master prépare la suite.</strong>
                </>
              ) : isFinal ? (
                <>
                  <p>{finalMoment ? "Manche terminée" : "Résultat final"}</p>
                  <strong className="tv-positive">{compactLabel}</strong>
                </>
              ) : (
                <>
                  <p>{ballot?.tied ? "Égalité" : "Élimination"}</p>
                  <strong>{publicBallotResult(play, name)}</strong>
                  {ballot?.eliminated &&
                    roster.find((r) => r.id === ballot.eliminated)?.role && (
                      <span className="tv-detail">
                        {roster.find((r) => r.id === ballot.eliminated)!.role}
                      </span>
                    )}
                </>
              )}
            </div>
          ),
          `tv-lower tv-result${finalMoment ? " tv-final-group" : ""}${resolvedMoment || nextMoment || finalMoment ? " tv-transient" : ""}`,
        )}
      {!(
        resolvedMoment ||
        nextMoment ||
        isFinal ||
        isVote ||
        speaker ||
        contentMoment
      ) &&
        compactLabel &&
        widget(
          "events",
          <span className="tv-event tv-compact-note">{compactLabel}</span>,
          "tv-lower",
        )}
      {cue && (
        <span
          className="broadcast-cue tv-cue-description"
          data-testid="broadcast-cue"
          data-cue-id={cue.id}
          data-kind={cue.kind}
          role="status"
        >
          {cue.message}
        </span>
      )}
    </section>
  );
}
