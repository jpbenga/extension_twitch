import Link from "next/link";
export default function Home() {
  return (
    <main className="session-shell intent-home">
      <header className="session-header">
        <Link className="session-brand" href="/">
          xt{" "}
          <span>
            Extension Twitch<small>STUDIO</small>
          </span>
        </Link>
      </header>
      <section className="lobby-heading">
        <span className="eyebrow">À VOUS DE JOUER</span>
        <h1>Votre prochaine émission commence ici.</h1>
        <p>
          Choisissez votre jeu. Invitez vos joueurs. Prenez les commandes du
          plateau.
        </p>
      </section>
      <nav
        className="creator-intents home-intents"
        aria-label="Que souhaitez-vous faire ?"
      >
        <Link
          className="creator-intent"
          href="/play"
          aria-labelledby="home-play"
        >
          <span aria-hidden="true">01</span>
          <div>
            <h2 id="home-play">Jouer</h2>
            <p>Lancer un jeu et animer une partie.</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          className="creator-intent"
          href="/creator"
          aria-labelledby="home-create"
        >
          <span aria-hidden="true">02</span>
          <div>
            <h2 id="home-create">Créer</h2>
            <p>Personnaliser un jeu, suivre le guide ou créer librement.</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
      </nav>
      <section className="home-secondary">
        <h2>Vous avez une invitation ?</h2>
        <p>Ouvrez le lien reçu du Game Master, ou utilisez votre code.</p>
        <Link className="secondary-button" href="/join">
          Rejoindre avec un code
        </Link>
        <details>
          <summary>Retrouver une partie en cours</summary>
          <p>
            Ouvrez votre lien privé GM ou joueur dans ce navigateur. Il conserve
            votre identité. Revenir à l’accueil n’arrête pas une partie.
          </p>
        </details>
      </section>
    </main>
  );
}
