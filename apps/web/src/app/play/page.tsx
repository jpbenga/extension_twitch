import Link from "next/link";
import { officialGames } from "@extension-twitch/contracts/official-games";
import { ProductFrame } from "../../components/product-frame";
export default function PlayPage() {
  return (
    <ProductFrame>
      <section className="lobby-heading">
        <span className="eyebrow">JEUX OFFICIELS</span>
        <h1>Choisir un jeu</h1>
        <p>
          Préparez une partie avec vos invités ou essayez seul en démonstration.
        </p>
      </section>
      <div className="creator-catalog official-catalog">
        {officialGames.map((game) => (
          <article
            key={game.id}
            className={`lobby-panel official-game-card game-${game.id}`}
          >
            <span className="eyebrow">
              {game.availability === "playable-demo"
                ? "JOUABLE · RÈGLES EN TEST"
                : "EN PRÉPARATION · NON JOUABLE"}
            </span>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <p className="lobby-hint">
              {game.participants} · {game.duration}
            </p>
            <details>
              <summary>Découvrir le jeu</summary>
              <p>{game.concept}</p>
              {game.features.length > 0 && (
                <ul>
                  {game.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              <p>
                Réglages :{" "}
                {game.settings.length
                  ? game.settings.join(", ")
                  : "à définir avant la mise à disposition"}
                .
              </p>
            </details>
            {game.availability === "playable-demo" && (
              <Link
                href={`/play/${game.id}`}
                className="primary-button"
                aria-label={`Jouer à ${game.title}`}
              >
                Jouer
              </Link>
            )}
          </article>
        ))}
      </div>
    </ProductFrame>
  );
}
