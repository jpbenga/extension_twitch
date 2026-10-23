"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorFrame } from "./creator-frame";
import { useStudio } from "./creator-context";
import { guideRecipeSchema } from "@extension-twitch/contracts/creator";
import { NumberInput } from "./creator-fields";
import { initialRecipe } from "./guide-fields";
export function CreatorNew() {
  const studio = useStudio(),
    router = useRouter();
  const [advanced, setAdvanced] = useState(false),
    [step, setStep] = useState(0),
    [model, setModel] = useState("counter"),
    [recipe, setRecipe] = useState(initialRecipe),
    [title, setTitle] = useState("Mon jeu");
  const [issue, setIssue] = useState("");
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("xt:creator:new");
      if (raw) {
        const saved = JSON.parse(raw);
        const recipe = guideRecipeSchema.parse(saved.recipe);
        if (
          typeof saved.title === "string" &&
          saved.title.length <= 80 &&
          ["counter", "answers"].includes(saved.model) &&
          Number.isInteger(saved.step) &&
          saved.step >= 0 &&
          saved.step < (saved.model === "counter" ? 6 : 3)
        ) {
          setRecipe(recipe);
          setTitle(saved.title);
          setModel(saved.model);
          setStep(saved.step);
          setAdvanced(saved.advanced === true);
        }
      }
    } catch {
      /* A malformed local guide never changes a saved game. */
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (restored) {
      try {
        sessionStorage.setItem(
          "xt:creator:new",
          JSON.stringify({ advanced, step, model, recipe, title }),
        );
      } catch {
        setIssue(
          "Votre appareil ne peut pas conserver ces choix. Terminez la création avant de quitter.",
        );
      }
    }
  }, [restored, advanced, step, model, recipe, title]);

  const questions =
    model === "counter"
      ? [
          "Que feront vos joueurs ?",
          "Combien de points faut-il atteindre ?",
          "Combien de points un joueur peut-il donner ?",
          "Peut-il participer plusieurs fois ?",
          "Quel nom donner à ce jeu ?",
          "Votre jeu est prêt à être créé",
        ]
      : [
          "Que feront vos joueurs ?",
          "Quel nom donner à ce jeu ?",
          "Votre jeu est prêt à être créé",
        ];
  const nameStep = model === "counter" ? 4 : 1,
    last = questions.length - 1;
  async function create() {
    setIssue("");
    const source = studio.view?.catalog.find(
      (g) => g.release.definition.id === "answer-box",
    );
    if (!advanced && model === "answers" && !source) {
      setIssue(
        "Cet exemple n’est pas disponible. Choisissez le compteur ou réessayez.",
      );
      return;
    }
    const view = await studio.send(
      advanced
        ? { type: "draft.create", mode: "advanced", title }
        : model === "counter"
          ? { type: "draft.create", mode: "guided", title, guide: recipe }
          : {
              type: "draft.fork",
              source: {
                gameId: source!.identity.id,
                version: source!.release.version,
              },
              title,
            },
    );
    if (view) {
      sessionStorage.removeItem("xt:creator:new");
      router.push(`/creator/games/${view.workspace.games.at(-1)!.identity.id}`);
    }
  }
  return (
    <CreatorFrame workspace>
      <div className="creator-page-title">
        <div>
          <span className="eyebrow">VOTRE NOUVEAU JEU</span>
          <h1>Créer mon jeu</h1>
        </div>
      </div>
      {issue && (
        <p role="alert" className="lobby-error">
          {issue}
        </p>
      )}
      <nav className="creator-tabs" aria-label="Méthode de création">
        <button
          className="secondary-button"
          aria-pressed={!advanced}
          onClick={() => setAdvanced(false)}
        >
          Me laisser guider
        </button>
        <button
          className="secondary-button"
          aria-pressed={advanced}
          onClick={() => setAdvanced(true)}
        >
          Studio avancé
        </button>
      </nav>
      {advanced ? (
        <section className="lobby-panel lobby-form">
          <h2>Construisez vos propres règles</h2>
          <p>
            Commencez avec un score et un bouton pour le Game Master, puis
            choisissez qui participe, les données à conserver et les actions
            possibles.
          </p>
          <label>
            Nom du jeu
            <input
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <button
            className="primary-button"
            disabled={studio.busy || !title.trim()}
            onClick={() => void create()}
          >
            Créer et ouvrir le Studio
          </button>
        </section>
      ) : (
        <section className="lobby-panel creator-wizard">
          <p className="eyebrow">
            ÉTAPE {step + 1} SUR {questions.length}
          </p>
          <progress
            max={questions.length}
            value={step + 1}
            aria-label="Progression de la création"
          />
          <h2>{questions[step]}</h2>
          <form
            className="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (step === last) void create();
              else setStep(step + 1);
            }}
          >
            {step === 0 ? (
              <>
                <label>
                  Choisissez votre point de départ
                  <select
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setStep(0);
                    }}
                  >
                    <option value="counter">
                      Atteindre un objectif ensemble
                    </option>
                    <option value="answers">
                      Écrire une réponse et la révéler
                    </option>
                  </select>
                </label>
                <p>
                  {model === "counter"
                    ? "Les joueurs apportent des points. Vous décidez quand commencer et terminez la collecte une fois l’objectif atteint."
                    : "Chaque joueur écrit une réponse privée. Vous décidez quand la révéler. Un rôle de relecteur est prévu pour confirmer la réception des réponses."}
                </p>
                <small>
                  Deux exemples exécutables. Équipes, votes complexes et quiz
                  automatiques ne sont pas encore disponibles.
                </small>
              </>
            ) : step === nameStep ? (
              <label>
                Nom du jeu
                <input
                  value={title}
                  maxLength={80}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
            ) : step === last ? (
              <div className="creator-recap">
                <h3>{title}</h3>
                {model === "counter" ? (
                  <ul>
                    <li>Objectif : {recipe.goal} points</li>
                    <li>Jusqu’à {recipe.pointsMax} points par contribution</li>
                    <li>
                      {recipe.oncePerPlayer
                        ? "Une contribution par joueur"
                        : "Les joueurs peuvent participer plusieurs fois"}
                    </li>
                  </ul>
                ) : (
                  <p>
                    Les réponses restent privées jusqu’à votre révélation. Vous
                    pourrez personnaliser les étapes et les actions dans le
                    Studio.
                  </p>
                )}
                <p>
                  Vous pourrez modifier ce jeu et le tester avant de l’utiliser
                  en direct.
                </p>
              </div>
            ) : step === 1 ? (
              <label>
                Nombre de points à atteindre
                <input
                  aria-label="Nombre de points à atteindre"
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={recipe.goal}
                  onChange={(e) =>
                    setRecipe({ ...recipe, goal: Number(e.target.value) })
                  }
                />
              </label>
            ) : step === 2 ? (
              <label>
                Maximum par contribution
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={recipe.pointsMax}
                  onChange={(e) =>
                    setRecipe({ ...recipe, pointsMax: Number(e.target.value) })
                  }
                />
              </label>
            ) : (
              <label>
                Participation
                <select
                  value={String(!recipe.oncePerPlayer)}
                  onChange={(e) =>
                    setRecipe({
                      ...recipe,
                      oncePerPlayer: e.target.value !== "true",
                    })
                  }
                >
                  <option value="false">Une fois par joueur</option>
                  <option value="true">Plusieurs fois</option>
                </select>
              </label>
            )}
            <div className="studio-inline">
              {step > 0 && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setStep(step - 1)}
                >
                  Retour
                </button>
              )}
              <button
                className="primary-button"
                disabled={studio.busy || studio.retryAvailable}
              >
                {step === last ? "Créer ce jeu" : "Continuer"}
              </button>
            </div>
          </form>
        </section>
      )}
    </CreatorFrame>
  );
}
