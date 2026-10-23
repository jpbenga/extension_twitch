"use client";
import { useEffect, useState } from "react";
import {
  assetDependencyStatus,
  exportManifestSchema,
  type CreatorGame,
  type CreatorOperation,
  type StudioView,
} from "@extension-twitch/contracts/creator";
import { post } from "../lib/session-client";
export function nextVersion(versions: string[]) {
  if (!versions.length) return "1.0.0";
  const v = versions
    .map((v) => v.split(".").map(Number))
    .sort((a, b) => b[0]! - a[0]! || b[1]! - a[1]! || b[2]! - a[2]!)[0]!;
  if (v[2]! < 999) return `${v[0]}.${v[1]}.${v[2]! + 1}`;
  if (v[1]! < 999) return `${v[0]}.${v[1]! + 1}.0`;
  return `${Math.min(999, v[0]! + 1)}.0.0`;
}
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
  send: (op: CreatorOperation) => Promise<StudioView | null>;
  prepare: (id: string, version: string) => Promise<void>;
  fork: (id: string, version: string, title: string) => Promise<void>;
  setError: (e: string) => void;
}) {
  const suggestion = nextVersion(game.releases.map((r) => r.version));
  const [version, setVersion] = useState(suggestion),
    [manual, setManual] = useState(false),
    [attested, setAttested] = useState(false),
    [manifest, setManifest] = useState("");
  useEffect(() => {
    if (!manual) setVersion(suggestion);
  }, [suggestion, manual]);
  async function exportVersion(version: string) {
    try {
      const data = exportManifestSchema.parse(
        await post(`/studio/workspaces/${workspaceId}/manifest`, ownerToken, {
          gameId: game.identity.id,
          version,
        }),
      );
      setManifest(JSON.stringify(data, null, 2));
    } catch {
      setError(
        "Les informations d’export ne sont pas disponibles. Réessayez plus tard ; votre version est conservée.",
      );
    }
  }
  async function saveVersion() {
    if (!attested || dirty || locked) return;
    if (
      !window.confirm(
        "Enregistrer cette version dans votre bibliothèque ? Vos prochaines modifications ne changeront pas cette copie.",
      )
    )
      return;
    const result = await send({
      type: "draft.publish",
      gameId: game.identity.id,
      version,
      rightsAttested: true,
    });
    if (result) {
      setAttested(false);
      setManual(false);
    }
  }
  return (
    <section>
      <h2>Versions enregistrées</h2>
      <p>
        Gardez une copie de votre jeu à un moment précis. La création en cours
        reste modifiable. Ces copies restent privées ; le partage public n’est
        pas encore disponible.
      </p>
      {dirty && (
        <p className="lobby-warning">
          Enregistrez d’abord vos dernières modifications avec le bouton
          Enregistrer.
        </p>
      )}
      <form
        className="lobby-form"
        onSubmit={(e) => {
          e.preventDefault();
          void saveVersion();
        }}
      >
        <p>Prochaine version proposée : {version}</p>
        <label className="creator-check">
          <input
            type="checkbox"
            checked={attested}
            disabled={locked}
            onChange={(e) => setAttested(e.target.checked)}
          />
          Je dispose des droits nécessaires sur ma création et ses ressources.
        </label>
        <button
          className="primary-button"
          disabled={locked || dirty || !attested || game.releases.length >= 8}
        >
          Enregistrer une version
        </button>
        <details>
          <summary>Choisir le numéro de version</summary>
          <label>
            Numéro de version
            <input
              value={version}
              pattern="[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
              onChange={(e) => {
                setManual(true);
                setVersion(e.target.value);
              }}
            />
          </label>
        </details>
      </form>
      {game.releases.length >= 8 && (
        <p>
          Ce jeu a atteint la limite de 8 versions enregistrées. Sa création en
          cours reste modifiable.
        </p>
      )}
      {game.releases.map((r) => (
        <article className="creator-list-card" key={r.version}>
          <div>
            <h3>
              {r.metadata.title} · version {r.version}
            </h3>
            <p>Cette copie ne change plus.</p>
            {r.assets.some(
              (a) =>
                assetDependencyStatus(
                  a,
                  r.definition.assets.find((s) => s.id === a.assetId)
                    ?.visibility,
                ) !== "shareable",
            ) && <p>Certaines ressources devront être remplacées.</p>}
          </div>
          <div className="studio-inline">
            <button
              className="secondary-button"
              disabled={locked}
              onClick={() => void prepare(game.identity.id, r.version)}
            >
              Tester cette version
            </button>
            <button
              className="secondary-button"
              disabled={locked}
              onClick={() =>
                void fork(game.identity.id, r.version, r.metadata.title)
              }
            >
              Personnaliser cette version
            </button>
          </div>
          <details>
            <summary>Outils d’export avancés</summary>
            <p>
              L’export complet du jeu n’est pas disponible. Vous pouvez
              consulter les métadonnées et les dépendances, sans données
              privées.
            </p>
            <button
              className="secondary-button"
              disabled={locked}
              onClick={() => void exportVersion(r.version)}
            >
              Afficher le manifest d’export
            </button>
          </details>
        </article>
      ))}
      {manifest && (
        <details open>
          <summary>Informations d’export avancées</summary>
          <label>
            Manifest d’export sans références privées
            <textarea rows={12} readOnly value={manifest} />
          </label>
          <p>Ce document ne permet pas encore de réimporter le jeu complet.</p>
        </details>
      )}
    </section>
  );
}
