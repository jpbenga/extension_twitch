"use client";
import {
  compileCounterDefinition,
  counterRecipeFor,
  type GuideRecipe,
} from "@extension-twitch/contracts/creator";
import { NumberInput } from "./creator-fields";
import type { GameDefinition } from "@extension-twitch/contracts/game-definition";
export function CreatorSimple({
  definition,
  template,
  onChange,
}: {
  definition: GameDefinition;
  template: GameDefinition;
  onChange: (d: GameDefinition) => void;
}) {
  const recipe = counterRecipeFor(definition, template);
  if (!recipe)
    return (
      <p>
        Ce jeu contient des règles personnalisées. Utilisez le Studio avancé
        pour les modifier ; elles sont intégralement conservées.
      </p>
    );
  function update(patch: Partial<GuideRecipe>) {
    if (!recipe) return;
    const next = compileCounterDefinition(
      template,
      definition.id,
      definition.title,
      { ...recipe, ...patch },
      definition.description,
    );
    next.version = definition.version;
    onChange(next);
  }
  return (
    <section className="lobby-form creator-simple">
      <h2>Vos règles en quelques questions</h2>
      <label>
        Combien de points faut-il atteindre ?
        <NumberInput
          label="Combien de points faut-il atteindre ?"
          value={recipe.goal}
          min={1}
          max={100}
          onChange={(goal) => {
            if (goal >= 1 && goal <= 100) update({ goal });
          }}
        />
      </label>
      <label>
        Combien de points un joueur peut-il donner ?
        <NumberInput
          label="Combien de points un joueur peut-il donner ?"
          value={recipe.pointsMax}
          min={1}
          max={10}
          onChange={(pointsMax) => {
            if (pointsMax >= 1 && pointsMax <= 10) update({ pointsMax });
          }}
        />
      </label>
      <label>
        Peut-il participer plusieurs fois ?
        <select
          aria-label="Peut-il participer plusieurs fois ?"
          value={String(!recipe.oncePerPlayer)}
          onChange={(e) => update({ oncePerPlayer: e.target.value !== "true" })}
        >
          <option value="false">Non, une seule contribution par joueur</option>
          <option value="true">
            Oui, autant de contributions que nécessaire
          </option>
        </select>
      </label>
      <p className="creator-rule-preview">
        Chaque joueur peut donner jusqu’à {recipe.pointsMax} points
        {recipe.oncePerPlayer ? " une seule fois" : " à chaque contribution"}.
        Le Game Master termine la collecte lorsque le total atteint{" "}
        {recipe.goal} points.
      </p>
      {recipe.multiplier !== 1 && (
        <p>
          Les contributions comptent {recipe.multiplier} fois. Ce réglage reste
          modifiable dans les options avancées.
        </p>
      )}
    </section>
  );
}
