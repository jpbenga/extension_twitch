import type { SessionView } from "@extension-twitch/contracts/sessions";
import { GameValues } from "./game-panel";
import { findGame } from "../lib/demo";

export function PublicSession({
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
          Animé par {view.hostName} · {ready} / {view.participants.length} prêts
        </p>
      </div>
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
