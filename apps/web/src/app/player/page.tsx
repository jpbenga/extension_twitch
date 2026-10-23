import Link from "next/link";
import { Icon } from "../../components/icon";

export default function PlayerPreview() {
  return (
    <main className="player-page">
      <div className="player-card">
        <span className="demo-badge">Mode démonstration</span>
        <span className="player-illustration">
          <Icon name="people" />
        </span>
        <span className="eyebrow">VOTRE PLACE VOUS ATTEND</span>
        <h1>Bienvenue sur le plateau.</h1>
        <p>Votre interface individuelle prendra vie ici.</p>
        <div className="player-placeholder">
          <span className="avatar avatar-0">NO</span>
          <strong>Nova</strong>
          <span>Participant fictif</span>
        </div>
        <p>
          Aucune information secrète distribuée. Les invitations et les actions
          de jeu seront ajoutées après validation du moteur.
        </p>
        <Link className="primary-button" href="/">
          Retour à la régie
          <Icon name="arrow" />
        </Link>
      </div>
    </main>
  );
}
