import Link from "next/link";
import { officialGames } from "@extension-twitch/contracts/official-games";
export function OfficialCatalog({
  secondary = false,
}: {
  secondary?: boolean;
}) {
  const game = officialGames[0]!;
  return (
    <section className="home-game-choice" aria-label="Jeux disponibles">
      <article className="ready-game-card game-undercover">
        <div>
          <span className="eyebrow">PRÊT À JOUER · DÉDUCTION</span>
          <h2>{game.title}</h2>
          <p>{game.description}</p>
          <p className="game-card-meta">
            3–12 joueurs · indices oraux · votes · plateau OBS
          </p>
          <details>
            <summary>Découvrir le jeu</summary>
            <p>{game.concept}</p>
            <p>
              Format de démonstration jouable. Les règles et le rythme
              continuent d’être affinés avec vos retours.
            </p>
          </details>
        </div>
        <Link
          href="/play/undercover"
          className={secondary ? "secondary-button" : "primary-button"}
          aria-label="Jouer à Undercover"
        >
          Jouer à Undercover →
        </Link>
      </article>
      <div className="future-games" aria-label="Autres jeux à venir">
        {officialGames.slice(1).map((g) => (
          <article key={g.id}>
            <h2>{g.title}</h2>
            <small>À venir · NON JOUABLE</small>
          </article>
        ))}
      </div>
    </section>
  );
}
