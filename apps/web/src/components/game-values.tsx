import type { GameProjection } from "@extension-twitch/contracts/game-definition";
import type { SessionView } from "@extension-twitch/contracts/sessions";
export function GameValues({
  game,
  names,
  compactNames = false,
}: {
  game: GameProjection;
  names: SessionView["participants"];
  compactNames?: boolean;
}) {
  return (
    <div className="game-values" aria-label="Informations de jeu">
      {game.values.map((v) => (
        <article key={`${v.id}:${v.participantId ?? "session"}`}>
          <span title={v.label}>
            {compactNames && v.participantId ? (
              (names.find((p) => p.id === v.participantId)?.name ?? "Joueur")
            ) : (
              <>
                {v.label}
                {v.participantId
                  ? ` · ${names.find((p) => p.id === v.participantId)?.name ?? "Joueur"}`
                  : ""}
              </>
            )}
          </span>
          <strong>
            {typeof v.value === "boolean"
              ? v.value
                ? "Oui"
                : "Non"
              : String(v.value) || "—"}
          </strong>
        </article>
      ))}
      {game.assets.map((a) => (
        <p className="asset-fallback" key={a.id}>
          {a.fallback} ·{" "}
          {a.availability === "disabled"
            ? "référence désactivée"
            : "média indisponible"}
        </p>
      ))}
    </div>
  );
}
