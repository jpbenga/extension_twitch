"use client";
import Link from "next/link";
import { CreatorFrame } from "./creator-frame";
export function CreatorHome() {
  return (
    <CreatorFrame>
      <section className="creator-welcome">
        <span className="eyebrow">À VOUS DE JOUER</span>
        <h1>Que souhaitez-vous faire ?</h1>
        <p>Un jeu pour votre prochain direct, à votre façon.</p>
        <div className="creator-intents">
          {[
            [
              "/creator/library?intent=play",
              "01",
              "Lancer un jeu",
              "Choisir un jeu disponible et inviter mes joueurs.",
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
          Les jeux proposés sont des exemples jouables. Undercover, Enchères et
          Qui est l’espion sont encore en préparation.
        </p>
        <Link className="text-link" href="/">
          Rejoindre une partie avec une invitation
        </Link>
      </section>
    </CreatorFrame>
  );
}
