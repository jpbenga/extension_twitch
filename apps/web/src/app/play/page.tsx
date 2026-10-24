import Link from "next/link";
export default function PlayPage() {
  return (
    <main className="session-shell intent-home">
      <header className="session-header">
        <Link className="session-brand" href="/">
          xt{" "}
          <span>
            Extension Twitch<small>JOUER</small>
          </span>
        </Link>
        <Link href="/creator">Créer un jeu</Link>
      </header>
      <section className="lobby-heading">
        <span className="eyebrow">VOTRE PROCHAIN PLATEAU</span>
        <h1>Choisir un jeu</h1>
        <p>
          Préparez une partie avec vos invités ou essayez seul avec des joueurs
          de démonstration.
        </p>
      </section>
      <div className="creator-catalog">
        <article className="lobby-panel official-game-card game-undercover">
          <span className="eyebrow">JOUABLE · VARIANTE DE DÉMONSTRATION</span>
          <h2>Undercover</h2>
          <p>
            Des mots secrets, deux tours d’indices et un vote pour démasquer les
            intrus.
          </p>
          <Link href="/play/undercover" className="primary-button">
            Préparer Undercover →
          </Link>
        </article>
        <article className="lobby-panel official-game-card game-auctions">
          <h2>Enchères</h2>
          <p>En préparation — ce jeu n’est pas encore jouable.</p>
        </article>
        <article className="lobby-panel official-game-card game-spy">
          <h2>Qui est l’espion ?</h2>
          <p>En préparation — ce jeu n’est pas encore jouable.</p>
        </article>
      </div>
      <details className="lobby-panel">
        <summary>Jouer à un jeu de ma bibliothèque</summary>
        <p>Retrouvez également vos créations et vos versions enregistrées.</p>
        <Link className="secondary-button" href="/creator/library?intent=play">
          Ouvrir ma bibliothèque
        </Link>
      </details>
    </main>
  );
}
