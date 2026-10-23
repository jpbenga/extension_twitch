"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { PublishedGame } from "@extension-twitch/contracts/creator";
import { CreatorFrame } from "./creator-frame";
import { useStudio } from "./creator-context";
import { CopyLink } from "./copy-link";
import { useCreatorLaunch } from "../lib/use-creator-launch";
export function CreatorLibrary() {
  const studio = useStudio(),
    router = useRouter(),
    params = useSearchParams(),
    play = params.get("intent") === "play";
  const { launch, launching, failure } = useCreatorLaunch();
  const [filter, setFilter] = useState(
    params.get("tab") === "mine" ? "mine" : "available",
  );
  const locked = studio.busy || studio.retryAvailable || launching;
  async function customize(source: PublishedGame) {
    const next = await studio.send({
      type: "draft.fork",
      source: { gameId: source.identity.id, version: source.release.version },
      title: `${source.release.metadata.title.slice(0, 62)} · personnalisé`,
    });
    if (next)
      router.push(`/creator/games/${next.workspace.games.at(-1)!.identity.id}`);
  }
  const installed = studio.view?.workspace.installations ?? [];
  const sources = (studio.view?.catalog ?? []).concat(
    studio.view?.workspace.games.flatMap((g) =>
      g.releases.map((release) => ({ identity: g.identity, release })),
    ) ?? [],
  );
  const shown =
    filter === "added"
      ? sources.filter((g) =>
          installed.some(
            (i) =>
              i.gameId === g.identity.id && i.version === g.release.version,
          ),
        )
      : (studio.view?.catalog ?? []);
  return (
    <CreatorFrame workspace>
      <div className="creator-page-title">
        <div>
          <span className="eyebrow">VOTRE BIBLIOTHÈQUE</span>
          <h1>
            {play
              ? "Quel jeu voulez-vous lancer ?"
              : "Choisissez votre point de départ"}
          </h1>
          <p>
            {play
              ? "Préparez une partie et invitez vos joueurs."
              : "Personnalisez un exemple ou retrouvez vos créations."}
          </p>
        </div>
        <Link className="secondary-button" href="/creator/new">
          Créer mon jeu
        </Link>
      </div>
      {failure && (
        <p role="alert" className="lobby-error">
          {failure}
        </p>
      )}
      <nav className="creator-tabs" aria-label="Bibliothèque">
        {[
          ["available", "Jeux disponibles"],
          ["added", "Jeux ajoutés"],
          ["mine", "Mes créations"],
        ].map(([id, label]) => (
          <button
            key={id}
            className="secondary-button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id!)}
          >
            {label}
          </button>
        ))}
      </nav>
      {filter !== "mine" ? (
        <>
          <p className="lobby-hint">
            Exemples du Studio et variante Undercover jouable. Enchères et Qui
            est l’espion restent en préparation.
          </p>
          <div className="creator-catalog">
            {shown.map((g) => (
              <article
                className="creator-list-card"
                key={`${g.identity.id}:${g.release.version}`}
              >
                <div>
                  <span className="eyebrow">
                    {g.release.definition.mechanics
                      ? "JEU OFFICIEL · VARIANTE DÉMO"
                      : g.identity.origin === "official"
                        ? "EXEMPLE JOUABLE"
                        : "VERSION PERSONNELLE"}
                  </span>
                  <h2>{g.release.metadata.title}</h2>
                  <p>{g.release.metadata.description}</p>
                </div>
                <div className="studio-inline">
                  <button
                    className="primary-button"
                    disabled={locked}
                    onClick={() =>
                      play
                        ? void launch(
                            g.identity.id,
                            g.release.version,
                            g.release.definition,
                            "invite",
                            "/creator/library",
                          )
                        : void customize(g)
                    }
                  >
                    {play ? "Lancer ce jeu" : "Personnaliser ce jeu"}
                  </button>
                  <details>
                    <summary>Autres choix</summary>
                    <button
                      className="secondary-button"
                      disabled={locked}
                      onClick={() =>
                        void (play
                          ? customize(g)
                          : launch(
                              g.identity.id,
                              g.release.version,
                              g.release.definition,
                              "invite",
                              "/creator/library",
                            ))
                      }
                    >
                      {play ? "Personnaliser ce jeu" : "Lancer ce jeu"}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={locked}
                      onClick={() =>
                        void launch(
                          g.identity.id,
                          g.release.version,
                          g.release.definition,
                          "quick",
                          "/creator/library",
                        )
                      }
                    >
                      Essayer avec des joueurs démo
                    </button>
                    <button
                      className="secondary-button"
                      disabled={
                        locked ||
                        installed.some(
                          (i) =>
                            i.gameId === g.identity.id &&
                            i.version === g.release.version,
                        )
                      }
                      onClick={() =>
                        void studio.send({
                          type: "library.install",
                          source: {
                            gameId: g.identity.id,
                            version: g.release.version,
                          },
                        })
                      }
                    >
                      {installed.some(
                        (i) =>
                          i.gameId === g.identity.id &&
                          i.version === g.release.version,
                      )
                        ? "Déjà dans ma bibliothèque"
                        : "Ajouter à ma bibliothèque"}
                    </button>
                  </details>
                </div>
              </article>
            ))}
          </div>
          {!shown.length && (
            <p>
              Aucun jeu ajouté. Retrouvez les exemples dans Jeux disponibles.
            </p>
          )}
        </>
      ) : (
        <div className="creator-catalog">
          {studio.view?.workspace.games.map((g) => (
            <article className="creator-list-card" key={g.identity.id}>
              <div>
                <span className="eyebrow">
                  {g.identity.lineage.length
                    ? "JEU PERSONNALISÉ"
                    : "CRÉATION PERSONNELLE"}{" "}
                  · EN COURS
                </span>
                <h2>{g.draft.metadata.title}</h2>
                <p>
                  {g.releases.length
                    ? `${g.releases.length} version(s) enregistrée(s)`
                    : "Votre création est modifiable."}
                </p>
              </div>
              <Link
                className="primary-button"
                href={`/creator/games/${g.identity.id}`}
              >
                Modifier ce jeu
              </Link>
            </article>
          ))}
          {!studio.view?.workspace.games.length && (
            <p>
              Aucune création pour le moment. Choisissez un exemple à
              personnaliser ou créez votre jeu.
            </p>
          )}
        </div>
      )}
      <details className="creator-private">
        <summary>Mon accès privé et mes réglages</summary>
        <p>
          Conservez ce lien pour retrouver vos jeux sur un autre appareil. Il
          permet de les modifier : gardez-le pour vous.
        </p>
        {studio.access && (
          <CopyLink
            label="Mon lien privé"
            value={`${window.location.origin}/creator#workspace=${studio.access.id}&access=${studio.access.token}`}
            privateLink
          />
        )}
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => void studio.refresh()}
        >
          Actualiser mes jeux
        </button>
        <p className="lobby-hint">
          Sans compte, la récupération par e-mail n’est pas disponible.
        </p>
      </details>
    </CreatorFrame>
  );
}
