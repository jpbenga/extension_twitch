"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  StudioView,
  CreatorOperation,
  GuideRecipe,
} from "@extension-twitch/contracts/creator";
import { useCreator } from "../lib/use-creator";
import { CreatorEditor } from "./creator-editor";
import { CreatorTest } from "./creator-test";
import { CreatorGuide } from "./creator-guide";
import { CopyLink } from "./copy-link";
import { initialRecipe } from "./guide-fields";

export function CreatorStudio() {
  const studio = useCreator();
  const [name, setName] = useState("Ma bibliothèque"),
    [title, setTitle] = useState("Mon nouveau jeu");
  const [path, setPath] = useState<"library" | "guided" | "advanced">(
    "library",
  );
  const [selected, setSelected] = useState<string | null>(null),
    [dirty, setDirty] = useState(false);
  const [recipe, setRecipe] = useState<GuideRecipe>(initialRecipe);
  const locked = studio.busy || studio.retryAvailable;
  function select(id: string | null) {
    if (
      dirty &&
      !window.confirm(
        "Quitter l’éditeur ? Vos modifications locales non enregistrées resteront dans cet onglet.",
      )
    )
      return;
    setDirty(false);
    setSelected(id);
  }
  async function create(
    mode: "guided" | "advanced",
    template: "counter" | "answer-box" = "counter",
  ) {
    if (
      dirty &&
      !window.confirm(
        "Créer un autre brouillon ? Les modifications locales de l’éditeur restent dans cet onglet.",
      )
    )
      return;
    const next = await studio.send(
      mode === "guided" && template === "answer-box"
        ? {
            type: "draft.fork",
            source: {
              gameId: studio.view!.catalog[1]!.identity.id,
              version: studio.view!.catalog[1]!.release.version,
            },
            title,
          }
        : {
            type: "draft.create",
            mode,
            title,
            ...(mode === "guided" ? { guide: recipe } : {}),
          },
    );
    if (next) {
      setDirty(false);
      setSelected(next.workspace.games.at(-1)!.identity.id);
    }
  }
  async function fork(gameId: string, version: string, sourceTitle: string) {
    if (
      dirty &&
      !window.confirm(
        "Ouvrir une nouvelle variante ? Vos changements locaux restent dans cet onglet.",
      )
    )
      return;
    const next = await studio.send({
      type: "draft.fork",
      source: { gameId, version },
      title: `${sourceTitle.slice(0, 65)} · variante`,
    });
    if (next) {
      setDirty(false);
      setSelected(next.workspace.games.at(-1)!.identity.id);
    }
  }
  useEffect(() => {
    if (selected)
      document
        .getElementById("creator-editor")
        ?.scrollIntoView({ block: "start" });
  }, [selected]);
  useEffect(() => {
    if (studio.testLink)
      document
        .getElementById("creator-test")
        ?.scrollIntoView({ block: "start" });
  }, [studio.testLink]);
  const game = studio.view?.workspace.games.find(
    (g) => g.identity.id === selected,
  );
  return (
    <main className="session-shell creator-shell">
      <header className="session-header">
        <Link className="session-brand" href="/">
          xt{" "}
          <span>
            Extension Twitch <small>STUDIO CRÉATEUR</small>
          </span>
        </Link>
        <span className="role-badge">CRÉATION</span>
      </header>
      <section className="lobby-heading">
        <span className="eyebrow">VOTRE PROCHAINE ÉMISSION COMMENCE ICI</span>
        <h1>Jouez. Créez. Faites-en votre jeu.</h1>
        <p>
          Trois portes d’entrée, une même bibliothèque. Vos variantes et vos
          versions utilisent le moteur de vos émissions.
        </p>
      </section>
      <nav className="creator-paths" aria-label="Parcours de création">
        {(
          [
            [
              "library",
              "01",
              "Utiliser ou personnaliser un jeu existant",
              "Partir d’un exemple et créer une variante indépendante.",
            ],
            [
              "guided",
              "02",
              "Créer un jeu avec un guide",
              "Choisir un modèle, ses règles et sa présentation, étape par étape.",
            ],
            [
              "advanced",
              "03",
              "Créer librement dans le Studio avancé",
              "Composer rôles, règles, actions et phases avec des formulaires.",
            ],
          ] as const
        ).map(([id, number, label, description]) => (
          <button
            key={id}
            className={`creator-path ${path === id ? "selected" : ""}`}
            aria-pressed={path === id}
            onClick={() => {
              setPath(id);
              document
                .getElementById("creator-workspace")
                ?.scrollIntoView({ block: "start" });
            }}
          >
            <span>{number}</span>
            <strong>{label}</strong>
            <small>{description}</small>
          </button>
        ))}
      </nav>
      {studio.error && (
        <p className="lobby-error" role="alert">
          {studio.error}
        </p>
      )}
      {studio.notice && (
        <p className="lobby-notice" role="status">
          {studio.notice}
        </p>
      )}
      {studio.retryAvailable && (
        <section className="lobby-warning">
          <p>
            Résultat en attente. Les nouvelles modifications sont suspendues.
          </p>
          <button
            className="secondary-button"
            disabled={studio.busy}
            onClick={() => void studio.send()}
          >
            Réessayer la commande du Studio
          </button>
        </section>
      )}
      {studio.testLink && (
        <CreatorTest key={studio.testLink} link={studio.testLink} />
      )}
      <div id="creator-workspace">
        {!studio.view ? (
          <section className="lobby-panel">
            <h2>Une bibliothèque privée, sans compte</h2>
            <p>
              Votre lien privé donne accès à vos créations. Votre nom est
              déclaratif, sans identité publique vérifiée. Conservez ce lien :
              il n’y a pas de récupération par e-mail.
            </p>
            {studio.access ? (
              <button
                className="secondary-button"
                disabled={locked}
                onClick={() => void studio.refresh()}
              >
                Réessayer l’accès à la bibliothèque
              </button>
            ) : (
              <form
                className="lobby-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void studio.create(name);
                }}
              >
                <label>
                  Nom du créateur ou de la bibliothèque
                  <input
                    value={name}
                    maxLength={80}
                    required
                    disabled={locked}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <button className="primary-button" disabled={locked}>
                  Créer ma bibliothèque privée
                </button>
              </form>
            )}
          </section>
        ) : (
          <>
            <section className="lobby-panel creator-library-heading">
              <div>
                <span className="eyebrow">BIBLIOTHÈQUE PERSONNELLE</span>
                <h2>{studio.view.workspace.name}</h2>
                <p className="lobby-hint">
                  Privée · sans compte · version {studio.view.workspace.version}
                </p>
              </div>
              <button
                className="secondary-button"
                disabled={locked}
                onClick={() => void studio.refresh()}
              >
                Actualiser la bibliothèque
              </button>
              <details>
                <summary>Conserver mon accès créateur</summary>
                <p>
                  Ce lien donne accès à tous vos brouillons. Ne le partagez pas
                  avec vos joueurs ou spectateurs.
                </p>
                <CopyLink
                  label="Accès privé à ma bibliothèque"
                  value={
                    studio.access
                      ? `${window.location.origin}/creator#workspace=${studio.access.id}&access=${studio.access.token}`
                      : ""
                  }
                  privateLink
                />
              </details>
            </section>
            {path === "guided" && (
              <CreatorGuide
                title={title}
                onTitle={setTitle}
                recipe={recipe}
                onRecipe={setRecipe}
                locked={locked}
                onCreate={(template) => create("guided", template)}
              />
            )}
            {path === "advanced" && (
              <section className="lobby-panel">
                <h2>Votre terrain de création</h2>
                <p>
                  Composez rôles, variables, actions et phases avec les
                  formulaires. Les expressions avancées utilisent le même
                  moteur.
                </p>
                <form
                  className="lobby-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void create("advanced");
                  }}
                >
                  <label>
                    Titre du nouveau jeu
                    <input
                      value={title}
                      maxLength={80}
                      disabled={locked}
                      required
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>
                  <button className="primary-button" disabled={locked}>
                    Créer le brouillon avancé
                  </button>
                </form>
              </section>
            )}
            {path === "library" && (
              <section className="lobby-panel">
                <span className="eyebrow">
                  CATALOGUE OFFICIEL · EXEMPLES STUDIO
                </span>
                <h2>Un point de départ pour votre émission</h2>
                <div className="creator-game-grid">
                  {studio.view.catalog.map((source) => (
                    <article
                      className="creator-game-card"
                      key={source.identity.id}
                    >
                      <span className="role-badge">OFFICIEL · EXEMPLE</span>
                      <h3>{source.release.metadata.title}</h3>
                      <p>{source.release.metadata.description}</p>
                      <small>
                        v{source.release.version} · {source.identity.author}
                      </small>
                      <button
                        className="primary-button"
                        disabled={locked}
                        onClick={() =>
                          void fork(
                            source.identity.id,
                            source.release.version,
                            source.release.metadata.title,
                          )
                        }
                      >
                        Créer une variante de {source.release.metadata.title}
                      </button>
                      <button
                        className="secondary-button"
                        disabled={
                          locked ||
                          studio.view!.workspace.installations.some(
                            (i) =>
                              i.gameId === source.identity.id &&
                              i.version === source.release.version,
                          )
                        }
                        onClick={() =>
                          void studio.send({
                            type: "library.install",
                            source: {
                              gameId: source.identity.id,
                              version: source.release.version,
                            },
                          })
                        }
                      >
                        Installer {source.release.metadata.title}
                      </button>
                      <button
                        className="secondary-button"
                        disabled={locked}
                        onClick={() =>
                          void studio.prepare(
                            source.identity.id,
                            source.release.version,
                          )
                        }
                      >
                        Tester l’original {source.release.metadata.title}
                      </button>
                    </article>
                  ))}
                </div>
                <p className="lobby-hint">
                  Undercover, Enchères et Qui est l’espion restent prévus. Leurs
                  règles complètes ne sont pas encore disponibles. Le Store
                  communautaire est préparé dans les contrats ; aucun catalogue
                  public n’est actif.
                </p>
              </section>
            )}
            <Library
              view={studio.view}
              selected={selected}
              select={select}
              prepare={studio.prepare}
              locked={locked}
              fork={fork}
            />
            {game && (
              <CreatorEditor
                key={game.identity.id}
                workspaceId={studio.view.workspace.id}
                game={game}
                compatible={
                  studio.view.guideCompatibility[game.identity.id] ?? false
                }
                locked={locked}
                send={studio.send}
                prepare={studio.prepare}
                ownerToken={studio.access!.token}
                onDirty={setDirty}
                fork={fork}
              />
            )}
          </>
        )}
      </div>
      <footer className="lobby-scope">
        <strong>Créez en privé, testez avec votre régie.</strong>
        <p>
          La publication de ce jalon fige une version dans votre bibliothèque
          privée. Aucun Store public, transfert de média ou lien Twitch
          automatique. Validation humaine iPhone en attente.
        </p>
      </footer>
    </main>
  );
}
function Library({
  view,
  selected,
  select,
  prepare,
  locked,
  fork,
}: {
  view: StudioView;
  selected: string | null;
  select: (id: string | null) => void;
  prepare: (id: string, version: string) => Promise<void>;
  locked: boolean;
  fork: (id: string, version: string, title: string) => Promise<void>;
}) {
  return (
    <section className="lobby-panel">
      <h2>Vos jeux et vos versions</h2>
      {!view.workspace.games.length && (
        <p>
          Aucun brouillon personnel. Choisissez un parcours ci-dessus pour
          commencer.
        </p>
      )}
      <div className="creator-game-grid">
        {view.workspace.games.map((g) => (
          <article
            key={g.identity.id}
            className={`creator-game-card ${selected === g.identity.id ? "selected" : ""}`}
          >
            <span className="role-badge">
              {g.identity.lineage.length
                ? "VARIANTE PERSONNELLE"
                : "JEU PERSONNEL"}
            </span>
            <h3>{g.draft.metadata.title}</h3>
            <p>
              Brouillon r{g.draft.revision} · {g.releases.length} version(s)
              publiée(s)
            </p>
            <button
              className="secondary-button"
              disabled={locked}
              onClick={() => select(g.identity.id)}
            >
              Modifier {g.draft.metadata.title}
            </button>
          </article>
        ))}
      </div>
      {view.workspace.installations.length > 0 && (
        <>
          <h3>Jeux installés — versions figées</h3>
          <ul className="creator-installations">
            {view.workspace.installations.map((i) => {
              const source = view.catalog.find(
                (c) =>
                  c.identity.id === i.gameId && c.release.version === i.version,
              );
              const personal = view.workspace.games.find(
                (g) => g.identity.id === i.gameId,
              );
              return (
                <li key={`${i.gameId}:${i.version}`}>
                  <span>
                    {source?.release.metadata.title ??
                      personal?.releases.find((r) => r.version === i.version)
                        ?.metadata.title ??
                      "Jeu installé"}{" "}
                    · v{i.version} · {i.origin}
                  </span>
                  <button
                    className="secondary-button"
                    disabled={locked}
                    onClick={() => void prepare(i.gameId, i.version)}
                  >
                    Préparer un test
                  </button>
                  <button
                    className="secondary-button"
                    disabled={locked}
                    onClick={() =>
                      void fork(
                        i.gameId,
                        i.version,
                        source?.release.metadata.title ??
                          personal?.releases.find(
                            (r) => r.version === i.version,
                          )?.metadata.title ??
                          "Jeu installé",
                      )
                    }
                  >
                    Créer une variante du jeu installé
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
