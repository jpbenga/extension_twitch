"use client";
import {
  assetDependencySchema,
  assetDependencyStatus,
  type AssetDependency,
} from "@extension-twitch/contracts/creator";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
const reasonLabel = {
  missing: "Manquant — remplacement nécessaire",
  private: "Privé — référence exclue des copies",
  disabled: "Désactivé",
  shareable: "Référence publique redistribuable",
  "not-shareable": "Non redistribuable — remplacement nécessaire",
};
export function CreatorAssets({
  assets,
  definition,
  assetJson,
  setAssetJson,
  onAssets,
  locked,
  setError,
}: {
  assets: AssetDependency[];
  definition: GameDefinition;
  assetJson: string;
  setAssetJson: (text: string) => void;
  onAssets: (assets: AssetDependency[]) => void;
  locked: boolean;
  setError: (message: string) => void;
}) {
  return (
    <details>
      <summary>Assets et autorisations de partage</summary>
      <p>
        Une définition partageable ne rend pas ses médias redistribuables. Les
        références privées, locales ou sans autorisation restent des
        remplacements dans les copies.
      </p>
      <ul className="creator-assets">
        {assets.map((a) => (
          <li key={a.assetId}>
            <strong>{a.assetId}</strong>
            <span>
              {
                reasonLabel[
                  assetDependencyStatus(
                    a,
                    definition.assets.find((slot) => slot.id === a.assetId)
                      ?.visibility,
                  )
                ]
              }
            </span>
            <small>
              {a.attribution || "Attribution à préciser"} · {a.license}
            </small>
            {a.binding && (
              <button
                className="secondary-button"
                disabled={locked}
                onClick={() => {
                  const nextAssets = assets.map((dep) => {
                    if (dep.assetId !== a.assetId) return dep;
                    const { binding: _removed, ...rest } = dep;
                    return { ...rest, replacementReason: "missing" as const };
                  });
                  onAssets(nextAssets);
                  setAssetJson(JSON.stringify(nextAssets, null, 2));
                }}
              >
                Retirer la référence {a.assetId}
              </button>
            )}
          </li>
        ))}
      </ul>
      <label>
        Manifest privé des dépendances JSON
        <textarea
          aria-label="Manifest privé des dépendances JSON"
          className="creator-code"
          rows={8}
          value={assetJson}
          maxLength={8192}
          spellCheck={false}
          disabled={locked}
          onChange={(e) => setAssetJson(e.target.value)}
        />
      </label>
      <button
        className="secondary-button"
        disabled={locked}
        onClick={() => {
          try {
            const assets = assetDependencySchema
              .array()
              .max(4)
              .parse(JSON.parse(assetJson) as unknown);
            onAssets(assets);
            setError("");
          } catch {
            setError(
              "Manifest d’assets invalide. Les références précédentes sont conservées.",
            );
          }
        }}
      >
        Appliquer le manifest d’assets au brouillon
      </button>
    </details>
  );
}
