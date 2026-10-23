"use client";
import { useState } from "react";
import type { GuideRecipe } from "@extension-twitch/contracts/creator";
import { GuideFields } from "./guide-fields";
export function CreatorGuide({
  title,
  onTitle,
  recipe,
  onRecipe,
  locked,
  onCreate,
}: {
  title: string;
  onTitle: (v: string) => void;
  recipe: GuideRecipe;
  onRecipe: (r: GuideRecipe) => void;
  locked: boolean;
  onCreate: (template: "counter" | "answer-box") => Promise<void>;
}) {
  const [step, setStep] = useState(0),
    [template, setTemplate] = useState<"counter" | "answer-box">("counter");
  return (
    <section className="lobby-panel creator-guide">
      <span className="eyebrow">CRÉATION GUIDÉE · {step + 1} / 3</span>
      <h2>Un premier jeu, pas à pas</h2>
      <ol className="guide-progress">
        {["Choisir", "Construire", "Nommer"].map((name, i) => (
          <li key={name} aria-current={step === i ? "step" : undefined}>
            <button className="secondary-button" onClick={() => setStep(i)}>
              {i + 1}. {name}
            </button>
          </li>
        ))}
      </ol>
      <form
        className="lobby-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 2) setStep(step + 1);
          else void onCreate(template);
        }}
      >
        {step === 0 && (
          <>
            <h3>Que feront vos invités ?</h3>
            <label>
              Modèle de départ
              <select
                aria-label="Modèle de départ"
                value={template}
                onChange={(e) => setTemplate(e.target.value as typeof template)}
                disabled={locked}
              >
                <option value="counter">
                  Compteur collectif — contribuer à un objectif
                </option>
                <option value="answer-box">
                  Réponses privées — écrire puis révéler
                </option>
              </select>
            </label>
            <p>
              {template === "counter"
                ? "Les joueurs apportent des points à un compteur commun. Le GM ouvre la collecte et clôture lorsque l’objectif est atteint."
                : "Les joueurs envoient une réponse personnelle. Un rôle relecteur vérifie les statuts de réception ; seul le GM peut révéler les réponses."}
            </p>
            <p className="lobby-hint">
              Participants individuels, jusqu’à 32 par session. Équipes, vote à
              candidats et correction automatique d’un quiz ne sont pas encore
              disponibles.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <h3>
              {template === "counter"
                ? "Quel objectif et quelles contributions ?"
                : "Quelles étapes et informations privées ?"}
            </h3>
            {template === "counter" ? (
              <GuideFields
                value={recipe}
                onChange={onRecipe}
                disabled={locked}
              />
            ) : (
              <p>
                Préparation → Écriture → Vérification → Révélation. Une réponse
                texte par joueur, privée jusqu’à la révélation GM. Le rôle
                relecteur ne voit pas les réponses des autres. Vous pourrez
                modifier rôles, textes et règles dans le Studio.
              </p>
            )}
            <p className="lobby-hint">
              Ces étapes produisent une définition réellement exécutée sur le
              serveur, avec transitions GM. Aucune règle de victoire des jeux
              officiels n’est supposée.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h3>Quel nom pour votre émission ?</h3>
            <label>
              Titre du nouveau jeu
              <input
                value={title}
                maxLength={80}
                required
                disabled={locked}
                onChange={(e) => onTitle(e.target.value)}
              />
            </label>
            <p>
              Modèle :{" "}
              {template === "counter"
                ? "Compteur collectif"
                : "Réponses privées"}
              . Le brouillon restera privé. Vous pourrez ensuite ajuster les
              variables, permissions et actions dans le même Studio.
            </p>
          </>
        )}
        <div className="studio-inline">
          {step > 0 && (
            <button
              type="button"
              className="secondary-button"
              disabled={locked}
              onClick={() => setStep(step - 1)}
            >
              Étape précédente
            </button>
          )}
          <button className="primary-button" disabled={locked}>
            {step === 2 ? "Créer le brouillon guidé" : "Étape suivante"}
          </button>
        </div>
      </form>
    </section>
  );
}
