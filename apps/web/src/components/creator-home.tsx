"use client";
import Link from "next/link";
import { CreatorFrame } from "./creator-frame";
export function CreatorHome() {
  return (
    <CreatorFrame>
      <section className="creator-welcome">
        <span className="eyebrow">STUDIO CRÉATEUR</span>
        <h1>Que souhaitez-vous faire ?</h1>
        <p>
          Personnalisez un jeu ou inventez le vôtre. Pour animer une partie,
          ouvrez l’espace Jouer.
        </p>
        <div className="creator-intents">
          {[
            [
              "/creator/library",
              "01",
              "Ma bibliothèque",
              "Retrouver mes créations et mes versions enregistrées.",
            ],
            [
              "/creator/library?intent=customize",
              "02",
              "Personnaliser un jeu",
              "Changer quelques règles d’un jeu existant.",
            ],
            [
              "/creator/new",
              "03",
              "Créer mon jeu",
              "Me laisser guider ou créer librement.",
            ],
          ].map(([url, n, title, description]) => (
            <Link className="creator-intent" key={url} href={url!}>
              <span>{n}</span>
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        <p className="lobby-hint">
          Undercover dispose d’une variante de démonstration jouable. Enchères
          et Qui est l’espion restent en préparation.
        </p>
        <Link className="primary-button" href="/play">
          Jouer ou tester Undercover
        </Link>
        <Link className="text-link" href="/">
          Retour à l’accueil
        </Link>
      </section>
    </CreatorFrame>
  );
}
