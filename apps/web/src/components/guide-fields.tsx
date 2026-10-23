"use client";
import type { GuideRecipe } from "@extension-twitch/contracts/creator";
export const initialRecipe: GuideRecipe = {
  kind: "collective-counter",
  goal: 4,
  pointsMax: 3,
  multiplier: 1,
  oncePerPlayer: true,
};
export function GuideFields({
  value,
  onChange,
  disabled,
}: {
  value: GuideRecipe;
  onChange: (recipe: GuideRecipe) => void;
  disabled: boolean;
}) {
  return (
    <>
      <label>
        Objectif collectif (points)
        <input
          type="number"
          min={1}
          max={100}
          required
          value={value.goal}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, goal: Number(e.target.value) })}
        />
      </label>
      <label>
        Points maximum par contribution
        <input
          type="number"
          min={1}
          max={10}
          required
          value={value.pointsMax}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, pointsMax: Number(e.target.value) })
          }
        />
      </label>
      <label>
        Multiplicateur des points
        <input
          type="number"
          min={1}
          max={5}
          required
          value={value.multiplier}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, multiplier: Number(e.target.value) })
          }
        />
      </label>
      <label>
        Participation
        <select
          value={String(value.oncePerPlayer)}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, oncePerPlayer: e.target.value === "true" })
          }
        >
          <option value="true">Une contribution par joueur</option>
          <option value="false">Contributions répétées</option>
        </select>
      </label>
    </>
  );
}
