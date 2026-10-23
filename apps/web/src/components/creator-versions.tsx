"use client";
import { useState } from "react";
import {
  assetDependencyStatus,
  exportManifestSchema,
  type CreatorGame,
  type CreatorOperation,
  type StudioView,
} from "@extension-twitch/contracts/creator";
import { post } from "../lib/session-client";
export function CreatorVersions({
  game,
  workspaceId,
  ownerToken,
  locked,
  dirty,
  send,
  prepare,
  fork,
  setError,
}: {
  game: CreatorGame;
  workspaceId: string;
  ownerToken: string;
  locked: boolean;
  dirty: boolean;
  send: (operation: CreatorOperation) => Promise<StudioView | null>;
  prepare: (id: string, version: string) => Promise<void>;
  fork: (id: string, version: string, title: string) => Promise<void>;
  setError: (message: string) => void;
}) {
  const [version, setVersion] = useState("1.0.0"),
    [attested, setAttested] = useState(false),
    [manifest, setManifest] = useState("");
  async function exportVersion(releaseVersion: string) {
    try {
      const data = exportManifestSchema.parse(
        await post(`/studio/workspaces/${workspaceId}/manifest`, ownerToken, {
          gameId: game.identity.id,
          version: releaseVersion,
        }),
      );
      setManifest(JSON.stringify(data, null, 2));
    } catch {
      setError(
        "Manifest indisponible. Aucun export complet de définition n’a été produit.",
      );
    }
  }
  return (
    <>
      {" "}
      <section className="creator-publication">
        <h3>Publier une version immuable</h3>
        <p>
          Elle reste privée dans votre bibliothèque. Le Store et sa modération
          ne sont pas ouverts.
        </p>
        <form
          className="lobby-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              window.confirm(
                "Figer cette version dans votre bibliothèque privée ? Elle ne pourra plus être modifiée.",
              )
            )
              void send({
                type: "draft.publish",
                gameId: game.identity.id,
                version,
                rightsAttested: true,
              });
          }}
        >
          <label>
            Numéro de version
            <input
              value={version}
              pattern="[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
              disabled={locked}
              onChange={(e) => setVersion(e.target.value)}
              required
            />
          </label>
          <label className="creator-check">
            <input
              type="checkbox"
              checked={attested}
              disabled={locked}
              onChange={(e) => setAttested(e.target.checked)}
            />
            Je déclare disposer des droits nécessaires sur ma contribution et
            ses ressources.
          </label>
          <button
            className="primary-button"
            disabled={locked || dirty || !attested}
          >
            Publier cette version privée
          </button>
        </form>
      </section>
      {game.releases.length > 0 && (
        <>
          <h3>Versions publiées — lecture seule</h3>
          <div className="creator-game-grid">
            {game.releases.map((r) => (
              <article className="creator-game-card" key={r.version}>
                <strong>
                  {r.metadata.title} · v{r.version}
                </strong>
                <p>
                  Schéma {r.definition.schemaVersion} ·{" "}
                  {
                    r.assets.filter(
                      (a) =>
                        assetDependencyStatus(
                          a,
                          r.definition.assets.find(
                            (slot) => slot.id === a.assetId,
                          )?.visibility,
                        ) !== "shareable",
                    ).length
                  }{" "}
                  ressource(s) à remplacer
                </p>
                <button
                  className="secondary-button"
                  disabled={locked}
                  onClick={() => void prepare(game.identity.id, r.version)}
                >
                  Tester la version {r.version}
                </button>
                <button
                  className="secondary-button"
                  disabled={locked}
                  onClick={() =>
                    void fork(game.identity.id, r.version, r.metadata.title)
                  }
                >
                  Créer une variante de la version {r.version}
                </button>
                <button
                  className="secondary-button"
                  disabled={locked}
                  onClick={() => void exportVersion(r.version)}
                >
                  Préparer le manifest d’export {r.version}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {manifest && (
        <div>
          <label>
            Manifest d’export sans références privées
            <textarea
              aria-label="Manifest d’export sans références privées"
              className="creator-code"
              rows={12}
              readOnly
              value={manifest}
            />
          </label>
          <p>
            Ce manifest contient métadonnées et dépendances logiques. Ce n’est
            pas encore un export complet réimportable du jeu.
          </p>
        </div>
      )}
    </>
  );
}
