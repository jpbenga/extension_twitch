"use client";
import {
  assetDependencySchema,
  assetDependencyStatus,
  type AssetDependency,
} from "@extension-twitch/contracts/creator";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
const status = {
  missing: "Ressource à remplacer",
  private: "Ressource privée",
  disabled: "Ressource indisponible",
  shareable: "Ressource utilisable",
  "not-shareable": "Ressource à remplacer",
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
  setError: (text: string) => void;
}) {
  return (
    <section>
      <h2>Ressources du jeu</h2>
      <p>
        Retrouvez les images, sons ou vidéos référencés par ce jeu. Leur
        affichage et les connecteurs de stockage ne sont pas encore disponibles
        : le plateau utilise un remplacement. Aucun fichier n’est envoyé sur le
        serveur.
      </p>
      {!assets.length && (
        <p>
          Ce jeu n’a pas de ressource associée. Vous pouvez déjà tester ses
          règles.
        </p>
      )}
      <ul className="creator-assets">
        {assets.map((a) => {
          const slot = definition.assets.find((s) => s.id === a.assetId),
            state = assetDependencyStatus(a, slot?.visibility);
          return (
            <li key={a.assetId}>
              <strong>{slot?.usage ?? "Ressource du jeu"}</strong>
              <span>
                {state === "missing" && slot?.kind === "image"
                  ? "Image manquante"
                  : status[state]}
              </span>
              <details>
                <summary>Droits et attribution de cette ressource</summary>
                <p>{a.license}</p>
                <p>{a.attribution || "Attribution à préciser"}</p>
                <p>
                  Partager les règles d’un jeu n’autorise pas à partager ses
                  médias. Les ressources privées ou non redistribuables restent
                  à remplacer dans les copies.
                </p>
              </details>
              {a.binding && (
                <button
                  className="secondary-button"
                  disabled={locked}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Retirer cette référence ? Le fichier d’origine ne sera pas supprimé.",
                      )
                    )
                      return;
                    const next = assets.map((dep) => {
                      if (dep.assetId !== a.assetId) return dep;
                      const { binding: _removed, ...rest } = dep;
                      return { ...rest, replacementReason: "missing" as const };
                    });
                    onAssets(next);
                  }}
                >
                  Retirer cette référence
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <details>
        <summary>Outils avancés des ressources</summary>
        <p>
          Les références et autorisations peuvent être modifiées dans ce
          document. Enregistrez ensuite le jeu pour les conserver. Les
          références dangereuses sont refusées.
        </p>
        <label>
          Manifest privé des ressources JSON
          <textarea
            className="creator-code"
            rows={10}
            value={assetJson}
            disabled={locked}
            onChange={(e) => setAssetJson(e.target.value)}
          />
        </label>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => {
            try {
              onAssets(
                assetDependencySchema
                  .array()
                  .max(4)
                  .parse(JSON.parse(assetJson) as unknown),
              );
              setError("");
            } catch {
              setError(
                "Ces références ne sont pas valides. Corrigez le document dans Ressources ; vos références enregistrées sont conservées.",
              );
            }
          }}
        >
          Appliquer les références au jeu
        </button>
      </details>
    </section>
  );
}
