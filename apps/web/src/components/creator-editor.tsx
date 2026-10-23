"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  gameDefinitionSchema,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import {
  counterRecipeFor,
  type CreatorGame,
} from "@extension-twitch/contracts/creator";
import { useStudio } from "./creator-context";
import { CreatorFrame } from "./creator-frame";
import { useCreatorDraft } from "../lib/use-creator-draft";
import { useCreatorLaunch } from "../lib/use-creator-launch";
import { CreatorSimple } from "./creator-simple";
import {
  CreatorVisual,
  studioSections,
  type StudioSection,
} from "./creator-visual";
import { ruleDifferences } from "../lib/creator-readable";
import { NumberInput } from "./creator-fields";
import { CreatorAssets } from "./creator-assets";
import { CreatorVersions } from "./creator-versions";
export function CreatorEditorPage({ id }: { id: string }) {
  const studio = useStudio(),
    game = studio.view?.workspace.games.find((g) => g.identity.id === id);
  return (
    <CreatorFrame workspace>
      {game && studio.view ? (
        <Editor
          key={game.identity.id}
          game={game}
          workspaceId={studio.view.workspace.id}
        />
      ) : studio.view ? (
        <p>
          Ce jeu ne se trouve pas dans votre bibliothèque.{" "}
          <Link href="/creator/library">Retrouver mes jeux</Link>
        </p>
      ) : null}
    </CreatorFrame>
  );
}
function Editor({
  game,
  workspaceId,
}: {
  game: CreatorGame;
  workspaceId: string;
}) {
  const studio = useStudio(),
    draft = useCreatorDraft(game, workspaceId),
    { local } = draft,
    launcher = useCreatorLaunch();
  const [section, setSection] = useState<StudioSection>("Général"),
    [advanced, setAdvanced] = useState(false),
    [compare, setCompare] = useState(false);
  const parsed = (() => {
    try {
      return gameDefinitionSchema.safeParse(JSON.parse(local.json) as unknown);
    } catch {
      return null;
    }
  })();
  const template = studio.view?.catalog.find(
    (g) => g.release.definition.id === "collective-pulse",
  )?.release.definition;
  const canSimplify = !!(
    template &&
    parsed?.success &&
    counterRecipeFor(parsed.data, template)
  );
  const locked = studio.busy || studio.retryAvailable || launcher.launching;
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const delta = viewport
        ? window.innerHeight - viewport.height - viewport.offsetTop
        : 0;
      document.documentElement.style.setProperty(
        "--creator-keyboard-offset",
        delta > 120 ? `${delta}px` : "0px",
      );
    };
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty(
        "--creator-keyboard-offset",
      );
    };
  }, []);
  async function test(mode: "quick" | "invite" = "quick") {
    const saved = await draft.save(!advanced && canSimplify);
    if (saved)
      await launcher.launch(game.identity.id, "draft", saved.definition, mode);
  }
  async function fork(id: string, version: string, title: string) {
    const next = await studio.send({
      type: "draft.fork",
      source: { gameId: id, version },
      title: `${title.slice(0, 62)} · personnalisé`,
    });
    if (next)
      window.location.assign(
        `/creator/games/${next.workspace.games.at(-1)!.identity.id}`,
      );
  }
  const select = (name: StudioSection) => {
    setAdvanced(true);
    setSection(name);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <section
      className="creator-editor dedicated-editor"
      aria-label="Éditeur de jeu"
      id="creator-editor"
    >
      <header className="editor-heading">
        <Link className="text-link" href="/creator/library?tab=mine">
          ← Mes jeux
        </Link>
        <h1>{local.metadata.title || "Votre jeu"}</h1>
        <p className="save-state" role="status">
          {locked
            ? "En cours…"
            : local.dirty
              ? "Modifications à enregistrer"
              : "Tout est enregistré"}
        </p>
        {game.identity.lineage.length > 0 && (
          <details>
            <summary>Jeu personnalisé · origine et attributions</summary>
            <p>Votre jeu est indépendant. L’original reste inchangé.</p>
            <ul>
              {game.identity.lineage.map((a, i) => (
                <li key={i}>
                  {a.author} · version {a.version}
                  <small>
                    {a.definitionLicense} · {a.rulesTerms}
                  </small>
                </li>
              ))}
            </ul>
          </details>
        )}
      </header>
      {(draft.error || launcher.failure) && (
        <p role="alert" className="lobby-error">
          {draft.error || launcher.failure}
        </p>
      )}
      {(draft.stale || compare) && (
        <section className="lobby-warning">
          <h2>Deux copies de ce jeu</h2>
          <p>
            Ce jeu a été modifié dans un autre onglet. Vos changements sont
            conservés. Comparez avant de choisir la copie à garder.
          </p>
          <button
            className="secondary-button"
            disabled={locked}
            onClick={async () => {
              await studio.refresh();
              setCompare(true);
            }}
          >
            Comparer les changements
          </button>
          {compare && (
            <>
              <div className="creator-compare">
                <section>
                  <h3>Sur cet appareil</h3>
                  <p>{local.metadata.title}</p>
                  <p>{local.metadata.description}</p>
                  <p>
                    {parsed?.success
                      ? `${parsed.data.actions.length} actions, ${parsed.data.variables.length} données`
                      : "Saisie à corriger"}
                  </p>
                </section>
                <section>
                  <h3>Copie enregistrée</h3>
                  <p>{game.draft.metadata.title}</p>
                  <p>{game.draft.metadata.description}</p>
                  <p>
                    {game.draft.definition.actions.length} actions,{" "}
                    {game.draft.definition.variables.length} données
                  </p>
                </section>
              </div>
              {parsed?.success && (
                <ul>
                  {ruleDifferences(parsed.data, game.draft.definition).map(
                    (text, i) => (
                      <li key={i}>{text}</li>
                    ),
                  )}
                </ul>
              )}
              <p>
                Les outils techniques ci-dessous permettent de comparer les
                règles complètes.
              </p>
              <details>
                <summary>Comparer les règles en détail</summary>
                <label>
                  Ma copie
                  <textarea rows={10} readOnly value={local.json} />
                </label>
                <label>
                  Copie enregistrée
                  <textarea
                    rows={10}
                    readOnly
                    value={JSON.stringify(game.draft.definition, null, 2)}
                  />
                </label>
              </details>
              <button
                className="secondary-button"
                onClick={() => {
                  draft.keepLocal();
                  setCompare(false);
                }}
              >
                Continuer avec ma copie
              </button>
            </>
          )}
          <button
            className="secondary-button"
            disabled={locked}
            onClick={() => {
              draft.loadRemote();
              setCompare(false);
            }}
          >
            Charger la copie enregistrée
          </button>
        </section>
      )}
      <div className="editor-mode">
        <button
          className="secondary-button"
          aria-pressed={!advanced}
          onClick={() => {
            setAdvanced(false);
            setSection("Général");
          }}
        >
          Réglages simples
        </button>
        <button
          className="secondary-button"
          aria-pressed={advanced}
          onClick={() => setAdvanced(true)}
        >
          Studio avancé
        </button>
      </div>
      <div className={advanced ? "studio-layout" : "simple-layout"}>
        {advanced && (
          <>
            <nav className="studio-navigation" aria-label="Sections du Studio">
              {studioSections.map((name) => (
                <button
                  key={name}
                  className={section === name ? "selected" : ""}
                  onClick={() => select(name)}
                >
                  {name}
                </button>
              ))}
            </nav>
            <label className="studio-mobile-menu">
              Modifier
              <select
                aria-label="Section du Studio"
                value={section}
                onChange={(e) => select(e.target.value as StudioSection)}
              >
                {studioSections.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <div className="studio-workbench" id="studio-workbench">
          <fieldset className="studio-unboxed" disabled={locked}>
            {(!advanced || section === "Général") && (
              <section className="lobby-form">
                <h2>Présentez votre jeu</h2>
                <label>
                  Nom du jeu
                  <input
                    value={local.metadata.title}
                    maxLength={80}
                    onChange={(e) => draft.text("title", e.target.value)}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    aria-label="Description"
                    value={local.metadata.description}
                    maxLength={240}
                    rows={3}
                    onChange={(e) => draft.text("description", e.target.value)}
                  />
                </label>
                {advanced && (
                  <details>
                    <summary>Joueurs conseillés et classement</summary>
                    <p>
                      Ces nombres indiquent le public conseillé pour ce jeu ;
                      ils ne changent pas les règles de la partie.
                    </p>
                    <label>
                      Nombre minimum conseillé
                      <NumberInput
                        label="Nombre minimum conseillé"
                        value={local.metadata.recommendedPlayers.min}
                        min={1}
                        max={32}
                        onChange={(min) =>
                          draft.change({
                            metadata: {
                              ...local.metadata,
                              recommendedPlayers: {
                                ...local.metadata.recommendedPlayers,
                                min,
                              },
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Nombre maximum conseillé
                      <NumberInput
                        label="Nombre maximum conseillé"
                        value={local.metadata.recommendedPlayers.max}
                        min={1}
                        max={32}
                        onChange={(max) =>
                          draft.change({
                            metadata: {
                              ...local.metadata,
                              recommendedPlayers: {
                                ...local.metadata.recommendedPlayers,
                                max,
                              },
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Catégorie
                      <input
                        value={local.metadata.category}
                        onChange={(e) =>
                          draft.change({
                            metadata: {
                              ...local.metadata,
                              category: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Mots-clés, séparés par des virgules
                      <input
                        value={local.metadata.tags.join(", ")}
                        onChange={(e) =>
                          draft.change({
                            metadata: {
                              ...local.metadata,
                              tags: e.target.value
                                ? e.target.value.split(",").map((t) => t.trim())
                                : [],
                            },
                          })
                        }
                      />
                    </label>
                  </details>
                )}
              </section>
            )}
            {!advanced &&
              (canSimplify && template && parsed?.success ? (
                <CreatorSimple
                  definition={parsed.data}
                  template={template}
                  onChange={draft.definition}
                />
              ) : (
                <section>
                  <h2>Des règles personnalisées</h2>
                  <p>
                    Ce jeu utilise des règles que les réglages simples ne
                    peuvent pas représenter. Elles restent intactes. Ouvrez le
                    Studio avancé pour les modifier.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setAdvanced(true)}
                  >
                    Modifier les règles dans le Studio
                  </button>
                </section>
              ))}
            {advanced && (
              <CreatorVisual
                json={local.json}
                initial={game.draft.definition}
                onChange={draft.definition}
                locked={locked}
                section={section}
              />
            )}
            {advanced && section === "Apparence" && (
              <section>
                <h2>Le plateau de votre jeu</h2>
                <p>
                  Le plateau affiche les informations publiques de la partie.
                  Vous pouvez le vérifier dans le laboratoire. Le placement des
                  éléments et la personnalisation graphique ne sont pas encore
                  disponibles.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => void test()}
                >
                  Voir le plateau en test
                </button>
              </section>
            )}
            {advanced && section === "Ressources" && (
              <CreatorAssets
                assets={local.assets}
                definition={
                  parsed?.success ? parsed.data : game.draft.definition
                }
                assetJson={local.assetJson}
                setAssetJson={(assetJson) => draft.change({ assetJson })}
                onAssets={(assets) =>
                  draft.change({
                    assets,
                    assetJson: JSON.stringify(assets, null, 2),
                  })
                }
                locked={locked}
                setError={draft.setError}
              />
            )}
            {advanced && section === "Partage" && (
              <section className="lobby-form">
                <h2>Autorisations de partage</h2>
                <p>
                  Votre jeu reste privé. Le partage public n’est pas encore
                  disponible. Ces choix conservent les droits et attributions
                  pour la suite.
                </p>
                <label>
                  Licence de ma contribution
                  <input
                    value={local.metadata.sharing.definitionLicense}
                    onChange={(e) =>
                      draft.change({
                        metadata: {
                          ...local.metadata,
                          sharing: {
                            ...local.metadata.sharing,
                            definitionLicense: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Conditions d’utilisation des règles
                  <input
                    value={local.metadata.sharing.rulesTerms}
                    onChange={(e) =>
                      draft.change({
                        metadata: {
                          ...local.metadata,
                          sharing: {
                            ...local.metadata.sharing,
                            rulesTerms: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
                <label className="creator-check">
                  <input
                    type="checkbox"
                    checked={local.metadata.sharing.attributionRequired}
                    onChange={(e) =>
                      draft.change({
                        metadata: {
                          ...local.metadata,
                          sharing: {
                            ...local.metadata.sharing,
                            attributionRequired: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  Demander l’attribution de ma contribution
                </label>
                <label>
                  Autoriser de futurs jeux personnalisés à partir du mien
                  <select
                    value={String(local.metadata.sharing.allowVariants)}
                    onChange={(e) =>
                      draft.change({
                        metadata: {
                          ...local.metadata,
                          sharing: {
                            ...local.metadata.sharing,
                            allowVariants: e.target.value === "true",
                          },
                        },
                      })
                    }
                  >
                    <option value="false">Pas pour le moment</option>
                    <option value="true">Oui, selon ces conditions</option>
                  </select>
                </label>
              </section>
            )}
            {advanced && section === "Tester" && (
              <section>
                <h2>Comment voulez-vous essayer ce jeu ?</h2>
                <p>
                  Le test rapide prépare deux joueurs de démonstration. Vous
                  pourrez passer d’un rôle à l’autre et vérifier le plateau dans
                  le laboratoire.
                </p>
                <button className="primary-button" onClick={() => void test()}>
                  Tester mon jeu
                </button>
                <h3>Avec de vraies personnes</h3>
                <p>
                  Créez une partie séparée, envoyez l’invitation, puis préparez
                  la partie quand tout le monde a rejoint.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => void test("invite")}
                >
                  Tester avec mes invités
                </button>
              </section>
            )}
            {advanced && section === "Versions" && (
              <CreatorVersions
                game={game}
                workspaceId={workspaceId}
                ownerToken={studio.access!.token}
                locked={locked}
                dirty={local.dirty || draft.stale}
                send={studio.send}
                prepare={async (id, version) => {
                  const release = game.releases.find(
                    (r) => r.version === version,
                  );
                  if (release)
                    await launcher.launch(id, version, release.definition);
                }}
                fork={fork}
                setError={draft.setError}
              />
            )}
            {advanced && section === "Outils avancés" && (
              <section>
                <h2>Outils techniques</h2>
                <p>
                  Ces outils donnent accès au document complet du jeu. Les
                  règles existantes sont conservées quand vous utilisez les
                  formulaires.
                </p>
                <details>
                  <summary>Définition complète du jeu (JSON)</summary>
                  <label>
                    Définition du jeu
                    <textarea
                      className="creator-code"
                      aria-label="Définition du jeu"
                      rows={18}
                      value={local.json}
                      onChange={(e) => {
                        const json = e.target.value;
                        let metadata = local.metadata;
                        try {
                          const d = JSON.parse(json) as GameDefinition;
                          if (
                            typeof d.title === "string" &&
                            typeof d.description === "string"
                          )
                            metadata = {
                              ...metadata,
                              title: d.title,
                              description: d.description,
                            };
                        } catch {
                          /* Preserve incomplete text. */
                        }
                        draft.change({ json, metadata });
                      }}
                    />
                  </label>
                </details>
                {parsed?.success && (
                  <p>
                    Format de règles : {parsed.data.schemaVersion}. Référence :{" "}
                    {parsed.data.id}.
                  </p>
                )}
                {backupBlock(draft.backup)}
              </section>
            )}
          </fieldset>
        </div>
      </div>
      <div className="creator-save-actions" aria-label="Commandes de création">
        <button
          className="secondary-button"
          disabled={locked || draft.stale}
          aria-busy={studio.busy}
          onClick={() => void draft.save(!advanced && canSimplify)}
        >
          {studio.busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          className="primary-button"
          disabled={locked || draft.stale}
          aria-busy={launcher.launching}
          onClick={() => void test()}
        >
          {launcher.launching ? "Préparation du test…" : "Tester mon jeu"}
        </button>
      </div>
    </section>
  );
}
function backupBlock(text: string) {
  return text ? (
    <details>
      <summary>Copie de secours conservée</summary>
      <textarea aria-label="Copie de secours" rows={10} readOnly value={text} />
    </details>
  ) : null;
}
