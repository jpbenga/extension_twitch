"use client";
import Link from "next/link";
import { ProductFrame } from "./product-frame";
import { ResumeSession } from "./resume-session";
import { OfficialCatalog } from "./official-catalog";
export function Welcome() {
  return (
    <ProductFrame>
      <section className="lobby-heading">
        <span className="eyebrow">VOTRE PROCHAIN LIVE</span>
        <h1>Prêt pour votre prochain live ?</h1>
        <p>Choisissez votre jeu. Retrouvez vos invités. À vous l’antenne.</p>
      </section>
      <ResumeSession showCatalogLink={false}>
        {(recent) => <OfficialCatalog secondary={recent} />}
      </ResumeSession>
      <section className="home-secondary">
        <h2>Vous êtes invité ?</h2>
        <Link className="text-link" href="/join">
          Rejoindre avec un code
        </Link>
        <details>
          <summary>Retrouver un accès sur un autre appareil</summary>
          <p>
            Ouvrez votre lien privé GM ou joueur. Revenir à l’accueil n’arrête
            pas la partie. Aucun compte ni récupération par e-mail pour le
            moment.
          </p>
        </details>
      </section>
    </ProductFrame>
  );
}
