import Link from "next/link";
import { ProductFrame } from "../components/product-frame";
import { ResumeSession } from "../components/resume-session";
export default function Home() {
  return (
    <ProductFrame catalogLink={false}>
      <section className="lobby-heading">
        <span className="eyebrow">VOTRE PROCHAIN LIVE</span>
        <h1>Prêt pour votre prochain live ?</h1>
        <p>
          Un jeu, quelques réglages et vos joueurs. Animez depuis votre
          téléphone.
        </p>
      </section>
      <ResumeSession />
      <section className="home-secondary">
        <h2>Vous êtes invité ?</h2>
        <Link className="text-link" href="/join">
          Rejoindre avec un code
        </Link>
        <details>
          <summary>Retrouver un accès sur un autre appareil</summary>
          <p>
            Ouvrez votre lien privé GM ou joueur. Les parties sont conservées
            sur le serveur ; revenir à l’accueil ne les arrête pas. Aucun compte
            ni récupération par e-mail n’est disponible pour le moment.
          </p>
        </details>
      </section>
    </ProductFrame>
  );
}
