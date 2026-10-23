"use client";
import { useEffect, useState } from "react";
import {
  gameDefinitionSchema,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import {
  assetDependencySchema,
  editableMetadataSchema,
  type AssetDependency,
  type CreatorGame,
  type CreatorOperation,
  type EditableMetadata,
  type StudioView,
  type GuideRecipe,
} from "@extension-twitch/contracts/creator";
import { GuideFields, initialRecipe } from "./guide-fields";
import { CreatorParameters } from "./creator-parameters";
import { CreatorVersions } from "./creator-versions";
import { CreatorAssets } from "./creator-assets";
import {
  CreatorVisual,
  studioSections,
  type StudioSection,
} from "./creator-visual";
import { definitionErrors } from "../lib/creator-model";
interface LocalEdit {
  json: string;
  metadata: EditableMetadata;
  assets: AssetDependency[];
  assetJson: string;
  baseRevision: number;
  dirty: boolean;
}
function initialEdit(game: CreatorGame, key: string): LocalEdit {
  const clean = {
    json: JSON.stringify(game.draft.definition, null, 2),
    metadata: structuredClone(game.draft.metadata),
    assets: structuredClone(game.draft.assets),
    assetJson: JSON.stringify(game.draft.assets, null, 2),
    baseRevision: game.draft.revision,
    dirty: false,
  };
  try {
    const saved = sessionStorage.getItem(key);
    if (!saved) return clean;
    const data = JSON.parse(saved) as Record<string, unknown>;
    if (
      typeof data.json !== "string" ||
      data.json.length > 32768 ||
      typeof data.baseRevision !== "number"
    )
      return clean;
    return {
      json: data.json,
      metadata: editableMetadataSchema.parse(data.metadata),
      assets: assetDependencySchema.array().max(4).parse(data.assets),
      assetJson:
        typeof data.assetJson === "string"
          ? data.assetJson
          : JSON.stringify(data.assets, null, 2),
      baseRevision: data.baseRevision,
      dirty: true,
    };
  } catch {
    return clean;
  }
}
function parseDefinition(text: string) {
  try {
    return gameDefinitionSchema.safeParse(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}
export function CreatorEditor({
  workspaceId,
  game,
  compatible,
  locked,
  send,
  prepare,
  ownerToken,
  onDirty,
  fork,
}: {
  workspaceId: string;
  game: CreatorGame;
  compatible: boolean;
  locked: boolean;
  send: (operation: CreatorOperation) => Promise<StudioView | null>;
  prepare: (id: string, version: string) => Promise<void>;
  ownerToken: string;
  onDirty: (dirty: boolean) => void;
  fork: (id: string, version: string, title: string) => Promise<void>;
}) {
  const key = `xt:creator:editor:${workspaceId}:${game.identity.id}`;
  const [local, setLocal] = useState<LocalEdit>(() => initialEdit(game, key));
  const [error, setError] = useState("");
  const [section, setSection] = useState<StudioSection>("Général");
  const [backup, setBackup] = useState(() => {
    try {
      return sessionStorage.getItem(`${key}:backup`) ?? "";
    } catch {
      return "";
    }
  });
  const [guide, setGuide] = useState<GuideRecipe>(
    game.draft.guide ?? initialRecipe,
  );
  const assetJson = local.assetJson;
  const setAssetJson = (assetJson: string) => change({ assetJson });
  const parsed = parseDefinition(local.json);
  const stale = local.baseRevision !== game.draft.revision;
  const change = (patch: Partial<LocalEdit>) =>
    setLocal((current) => ({ ...current, ...patch, dirty: true }));
  useEffect(() => {
    onDirty(local.dirty);
    try {
      if (local.dirty) sessionStorage.setItem(key, JSON.stringify(local));
      else sessionStorage.removeItem(key);
    } catch {
      setError(
        "Stockage local indisponible : enregistrez avant de quitter l’éditeur.",
      );
    }
  }, [local, key, onDirty]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (local.dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [local.dirty]);
  function loadRemote() {
    if (
      local.dirty &&
      !window.confirm(
        "Charger le brouillon serveur ? Votre copie locale sera conservée en sauvegarde dans cet onglet.",
      )
    )
      return;
    if (local.dirty) {
      const copy = JSON.stringify(local, null, 2);
      sessionStorage.setItem(`${key}:backup`, copy);
      setBackup(copy);
    }
    setLocal({
      json: JSON.stringify(game.draft.definition, null, 2),
      metadata: structuredClone(game.draft.metadata),
      assets: structuredClone(game.draft.assets),
      assetJson: JSON.stringify(game.draft.assets, null, 2),
      baseRevision: game.draft.revision,
      dirty: false,
    });
    setGuide(game.draft.guide ?? initialRecipe);
    setError("");
  }
  function setDefinition(definition: GameDefinition) {
    change({
      json: JSON.stringify(definition, null, 2),
      metadata: {
        ...local.metadata,
        title: definition.title,
        description: definition.description,
      },
    });
  }
  function editText(field: "title" | "description", value: string) {
    let json = local.json;
    try {
      const raw: unknown = JSON.parse(json);
      if (raw && typeof raw === "object" && !Array.isArray(raw))
        json = JSON.stringify({ ...raw, [field]: value }, null, 2);
    } catch {
      /* Preserve incomplete advanced text until the creator fixes it. */
    }
    change({ json, metadata: { ...local.metadata, [field]: value } });
  }
  async function save(): Promise<boolean> {
    setError("");
    if (stale) {
      setError(
        "Le serveur possède une autre révision. Votre copie reste intacte : comparez-la avant de charger la version serveur.",
      );
      return false;
    }
    try {
      const definition = gameDefinitionSchema.parse({
        ...(JSON.parse(local.json) as Record<string, unknown>),
        title: local.metadata.title,
        description: local.metadata.description,
      });
      const metadata = editableMetadataSchema.parse(local.metadata);
      const assets = assetDependencySchema
        .array()
        .max(4)
        .parse(JSON.parse(local.assetJson) as unknown);
      const next = await send({
        type: "draft.save",
        gameId: game.identity.id,
        definition,
        metadata,
        assets,
      });
      const saved = next?.workspace.games.find(
        (g) => g.identity.id === game.identity.id,
      )?.draft;
      if (saved) {
        setLocal({
          json: JSON.stringify(saved.definition, null, 2),
          metadata: saved.metadata,
          assets: saved.assets,
          assetJson: JSON.stringify(saved.assets, null, 2),
          baseRevision: saved.revision,
          dirty: false,
        });
        return true;
      }
      return false;
    } catch {
      let issues: string[] = [];
      try {
        issues = definitionErrors(JSON.parse(local.json) as unknown);
      } catch {
        /* Show a readable JSON error below. */
      }
      setError(
        issues.length
          ? issues.join(" ")
          : "Brouillon invalide : vérifiez le document avancé, les métadonnées et les droits des assets. Votre travail est conservé.",
      );
      return false;
    }
  }
  async function saveGuide() {
    const next = await send({
      type: "draft.guide",
      gameId: game.identity.id,
      guide,
    });
    const saved = next?.workspace.games.find(
      (g) => g.identity.id === game.identity.id,
    )?.draft;
    if (saved)
      setLocal({
        json: JSON.stringify(saved.definition, null, 2),
        metadata: saved.metadata,
        assets: saved.assets,
        assetJson: JSON.stringify(saved.assets, null, 2),
        baseRevision: saved.revision,
        dirty: false,
      });
  }
  return (
    <section
      className="lobby-panel creator-editor"
      id="creator-editor"
      aria-label="Éditeur de brouillon"
    >
      <span className="eyebrow">
        BROUILLON INDÉPENDANT · r{local.baseRevision}
      </span>
      <h2>Personnaliser votre jeu</h2>
      <p className="lobby-hint">
        {local.dirty
          ? "Modifications locales non enregistrées"
          : "Brouillon enregistré"}{" "}
        · {game.identity.origin} · auteur déclaratif : {game.identity.author}
      </p>
      {error && (
        <p role="alert" className="lobby-error">
          {error}
        </p>
      )}
      {stale && (
        <div className="lobby-warning">
          <p>
            Le brouillon serveur est maintenant en révision{" "}
            {game.draft.revision}. Vos modifications locales sont conservées.
          </p>
          <button
            className="secondary-button"
            disabled={locked}
            onClick={loadRemote}
          >
            Charger le brouillon serveur
          </button>
        </div>
      )}
      {backup && (
        <details>
          <summary>Copie locale conservée avant actualisation</summary>
          <label>
            Sauvegarde locale du brouillon
            <textarea
              aria-label="Sauvegarde locale du brouillon"
              rows={10}
              readOnly
              value={backup}
            />
          </label>
          <p>
            Copiez les champs à réconcilier dans l’éditeur ; aucune fusion ni
            suppression silencieuse.
          </p>
        </details>
      )}
      {game.identity.lineage.length > 0 && (
        <details open>
          <summary>Origine et attributions</summary>
          <ul>
            {game.identity.lineage.map((a, index) => (
              <li key={`${a.gameId}:${index}`}>
                {a.author} · v{a.version}
                <small className="creator-lineage-id">{a.gameId}</small>
                <small>
                  {a.definitionLicense} · {a.rulesTerms}
                </small>
              </li>
            ))}
          </ul>
          <p>
            Cette filiation est conservée par le serveur. Les droits des médias
            sont distincts.
          </p>
        </details>
      )}
      <div className="studio-layout">
        <nav className="studio-navigation" aria-label="Sections du Studio">
          {studioSections.map((name) => (
            <button
              className={section === name ? "selected" : ""}
              key={name}
              aria-pressed={section === name}
              onClick={() => {
                setSection(name);
                document
                  .getElementById("studio-workbench")
                  ?.scrollIntoView({ block: "start" });
              }}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="studio-workbench" id="studio-workbench">
          <label className="studio-mobile-menu">
            Section du Studio
            <select
              aria-label="Section du Studio"
              value={section}
              onChange={(e) => setSection(e.target.value as StudioSection)}
            >
              {studioSections.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div hidden={section !== "Général"}>
            <div className="lobby-form">
              <label>
                Titre du brouillon
                <input
                  value={local.metadata.title}
                  maxLength={80}
                  disabled={locked}
                  onChange={(e) => editText("title", e.target.value)}
                />
              </label>
              <label>
                Description du jeu
                <textarea
                  aria-label="Description du jeu"
                  rows={3}
                  maxLength={240}
                  value={local.metadata.description}
                  disabled={locked}
                  onChange={(e) => editText("description", e.target.value)}
                />
              </label>
              <label>
                Catégorie
                <input
                  value={local.metadata.category}
                  maxLength={40}
                  disabled={locked}
                  onChange={(e) =>
                    change({
                      metadata: { ...local.metadata, category: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Tags (séparés par des virgules)
                <input
                  value={local.metadata.tags.join(", ")}
                  disabled={locked}
                  onChange={(e) =>
                    change({
                      metadata: {
                        ...local.metadata,
                        tags: e.target.value.trim()
                          ? e.target.value.split(",").map((v) => v.trim())
                          : [],
                      },
                    })
                  }
                />
              </label>
            </div>
            {parsed?.success && (
              <CreatorParameters
                key={`parameters-${local.baseRevision}`}
                definition={parsed.data}
                locked={locked}
                onChange={setDefinition}
              />
            )}
          </div>
          <CreatorVisual
            json={local.json}
            initial={game.draft.definition}
            onChange={setDefinition}
            locked={locked}
            section={section}
          />
          {section === "Apparence" && (
            <section>
              <h3>Apparence</h3>
              <p>
                Le plateau actuel affiche les valeurs publiques. Les scènes et
                références logiques sont conservées ; la composition visuelle
                des widgets sera disponible en 4C. Aucun contrôle ici ne modifie
                OBS.
              </p>
            </section>
          )}
          {section === "Tester" && (
            <section>
              <h3>Tester mon jeu</h3>
              <p>
                Enregistrez et figez votre brouillon dans une session
                indépendante. Ses actions utilisent le véritable moteur. Les
                nouvelles modifications ne changeront pas cet essai.
              </p>
              <button
                className="primary-button"
                disabled={locked || stale}
                onClick={async () => {
                  if (!local.dirty || (await save()))
                    await prepare(game.identity.id, "draft");
                }}
              >
                Enregistrer et tester mon jeu
              </button>
              <p>
                Les liens GM, joueurs et plateau apparaissent dans « Votre test
                est prêt ». Vous pourrez continuer à éditer ici.
              </p>
            </section>
          )}
          <details>
            <summary>Studio avancé — définition complète</summary>
            <p>
              Option technique secondaire. Arbres d’expressions bornés en v2,
              aucun JavaScript. Les champs non représentés par le guide sont
              conservés.
            </p>
            <label>
              Définition avancée JSON
              <textarea
                aria-label="Définition avancée JSON"
                className="creator-code"
                rows={18}
                maxLength={12000}
                spellCheck={false}
                value={local.json}
                disabled={locked}
                onChange={(e) => {
                  const json = e.target.value;
                  let metadata = local.metadata;
                  try {
                    const d: unknown = JSON.parse(json);
                    if (
                      d &&
                      typeof d === "object" &&
                      "title" in d &&
                      typeof d.title === "string" &&
                      "description" in d &&
                      typeof d.description === "string"
                    )
                      metadata = {
                        ...metadata,
                        title: d.title,
                        description: d.description,
                      };
                  } catch {
                    /* Keep partial input. */
                  }
                  change({ json, metadata });
                }}
              />
            </label>
            <p className="lobby-hint">
              {parsed?.success
                ? `Schéma v${parsed.data.schemaVersion} valide · ${parsed.data.actions.length} actions`
                : "Définition incomplète ou invalide. La sauvegarde serveur sera refusée."}
            </p>
            {parsed?.success && parsed.data.schemaVersion === 1 && (
              <button
                className="secondary-button"
                disabled={locked}
                onClick={() =>
                  setDefinition({
                    ...parsed.data,
                    schemaVersion: 2,
                    engineVersion: 2,
                  })
                }
              >
                Activer explicitement le langage v2
              </button>
            )}
          </details>
          {game.draft.guide && (
            <details>
              <summary>Revenir aux choix du guide</summary>
              {!compatible ? (
                <p className="lobby-warning">
                  Cette configuration avancée ne peut plus être représentée par
                  le guide. Rien n’est supprimé ; poursuivez dans le Studio
                  avancé.
                </p>
              ) : (
                <form
                  className="lobby-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveGuide();
                  }}
                >
                  <GuideFields
                    value={guide}
                    onChange={setGuide}
                    disabled={locked || local.dirty || stale}
                  />
                  <p>
                    Enregistrez les changements avancés avant d’appliquer le
                    guide.
                  </p>
                  <button
                    className="secondary-button"
                    disabled={locked || local.dirty || stale}
                  >
                    Appliquer les choix du guide
                  </button>
                </form>
              )}
            </details>
          )}
          <div hidden={section !== "Apparence" && section !== "Général"}>
            <CreatorAssets
              assets={local.assets}
              definition={parsed?.success ? parsed.data : game.draft.definition}
              assetJson={assetJson}
              setAssetJson={setAssetJson}
              onAssets={(assets) =>
                change({ assets, assetJson: JSON.stringify(assets, null, 2) })
              }
              locked={locked}
              setError={setError}
            />
            <details>
              <summary>Droits de la définition et des règles</summary>
              <div className="lobby-form">
                <label>
                  Licence de ma contribution
                  <input
                    value={local.metadata.sharing.definitionLicense}
                    maxLength={80}
                    disabled={locked}
                    onChange={(e) =>
                      change({
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
                  Conditions des règles
                  <input
                    value={local.metadata.sharing.rulesTerms}
                    maxLength={80}
                    disabled={locked}
                    onChange={(e) =>
                      change({
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
                <label>
                  Création de variantes
                  <select
                    value={String(local.metadata.sharing.allowVariants)}
                    disabled={locked}
                    onChange={(e) =>
                      change({
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
                    <option value="false">
                      Non autorisée pour le partage futur
                    </option>
                    <option value="true">Autorisée selon ces conditions</option>
                  </select>
                </label>
              </div>
              <p>
                Les conditions et attributions des œuvres d’origine restent
                applicables. Les déclarations ne constituent pas une
                vérification juridique.
              </p>
            </details>
          </div>
          <div className="creator-save-actions">
            <button
              className="primary-button"
              disabled={locked || stale}
              onClick={() => void save()}
            >
              Enregistrer le brouillon
            </button>
            <button
              className="secondary-button"
              disabled={locked || local.dirty || stale}
              onClick={() => void prepare(game.identity.id, "draft")}
            >
              Préparer un test du brouillon
            </button>
          </div>
          <div hidden={section !== "Publier" && section !== "Général"}>
            <CreatorVersions
              game={game}
              workspaceId={workspaceId}
              ownerToken={ownerToken}
              locked={locked}
              dirty={local.dirty || stale}
              send={send}
              prepare={prepare}
              fork={fork}
              setError={setError}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
