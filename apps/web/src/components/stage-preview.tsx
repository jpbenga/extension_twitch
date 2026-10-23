import { findGame, publicDemo } from "../lib/demo";
import type { GameId } from "@extension-twitch/contracts";
import { GameArt } from "./game-art";

export function StagePreview({ gameId }: { gameId: GameId }) {
  const game = findGame(gameId);
  return (
    <div className={`stage ${game.theme}`}>
      <div className="stage-grid" />
      <div className="stage-top">
        <span className="stage-brand">
          XT<span>SHOWTIME</span>
        </span>
        <span className="stage-demo">DÉMONSTRATION</span>
      </div>
      <div className="stage-center">
        <GameArt symbol={game.symbol} />
        <span className="eyebrow">LE PLATEAU EST À VOUS</span>
        <h2>{game.shortTitle}</h2>
        <p>Préparez-vous à jouer.</p>
      </div>
      <div className="stage-seats">
        {publicDemo.participants.map((participant, index) => (
          <div className="stage-seat" key={participant.id}>
            <span className={`avatar avatar-${index}`}>
              {participant.initials}
            </span>
            <span>{participant.name}</span>
          </div>
        ))}
      </div>
      <span className="stage-caption">
        APERÇU FICTIF · AUCUNE PARTIE EN COURS
      </span>
    </div>
  );
}
