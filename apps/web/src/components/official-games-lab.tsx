"use client";
import { useState } from "react";
import Link from "next/link";
import {
  acceptsValue,
  type Scalar,
} from "@extension-twitch/contracts/game-definition";
import { CreatorFrame } from "./creator-frame";
import { useStudio } from "./creator-context";
import { useCreatorLaunch } from "../lib/use-creator-launch";
import { PlayConfiguration } from "./play-configuration";
import { NumberInput } from "./creator-fields";
export function OfficialGamesLab({
  context = "creator",
}: {
  context?: "creator" | "play";
}) {
  const studio = useStudio(),
    launcher = useCreatorLaunch();
  const source = studio.view?.catalog.find(
    (g) => g.release.definition.id === "undercover",
  );
  const [mode, setMode] = useState<"quick" | "invite">("quick");
  const [values, setValues] = useState<Record<string, Scalar>>({}),
    [count, setCount] = useState(4),
    [error, setError] = useState("");
  async function start(mode: "quick" | "invite") {
    if (!source) return;
    const d = source.release.definition;
    if (
      d.configuration.some(
        (f) => !acceptsValue(f.value, values[f.id] ?? f.value.initial),
      )
    ) {
      setError(
        "Vérifiez les limites indiquées sous les champs. Votre configuration reste ici.",
      );
      return;
    }
    const m = d.mechanics!,
      deal = m.deals[0]!;
    const value = (id: string) =>
      values[id] ?? d.configuration.find((c) => c.id === id)!.value.initial;
    if (
      String(value(deal.majorityValueConfiguration))
        .normalize("NFKC")
        .trim()
        .toLocaleLowerCase("fr") ===
        String(value(deal.minorityValueConfiguration))
          .normalize("NFKC")
          .trim()
          .toLocaleLowerCase("fr") ||
      !String(value(deal.majorityValueConfiguration)).trim() ||
      !String(value(deal.minorityValueConfiguration)).trim()
    ) {
      setError("Choisissez deux mots différents et non vides.");
      return;
    }
    if (
      mode === "quick" &&
      (count < m.minPlayers ||
        count > m.maxPlayers ||
        Number(value(deal.minorityCountConfiguration)) * 2 >= count)
    ) {
      setError(
        "Prévoyez de 3 à 12 joueurs, avec moins d’Undercover que de civils.",
      );
      return;
    }
    setError("");
    await launcher.launch(
      source.identity.id,
      source.release.version,
      d,
      mode,
      context === "play" ? "/play/undercover" : "/creator/play",
      values,
      count,
    );
  }
  return (
    <CreatorFrame workspace context={context}>
      <div className="creator-page-title">
        <div>
          <span className="eyebrow">JOUER · PRÉPARER UNE PARTIE</span>
          <h1>
            {context === "play"
              ? "Préparer Undercover"
              : "Laboratoire des jeux"}
          </h1>
          <p>
            Une vraie partie, plusieurs points de vue. Choisissez vos réglages
            puis animez depuis votre téléphone.
          </p>
        </div>
        <Link
          href={context === "play" ? "/play" : "/creator"}
          className="secondary-button"
        >
          {context === "play" ? "Changer de jeu" : "Retour au Studio"}
        </Link>
      </div>
      <section className="lobby-panel official-game-card game-undercover">
        <span className="eyebrow">VARIANTE DE DÉMONSTRATION</span>
        <h2>Tester Undercover</h2>
        <p>
          Découvrez votre mot, discutez et votez pour démasquer les Undercover.
          Les règles de cette variante restent à valider par vos retours.
        </p>
        <details>
          <summary>Comment se déroule cette variante ?</summary>
          <p>
            Distribution secrète → tours d’indices oraux (2 par défaut) → vote
            unique → résultat. Pas de vote pour soi. En cas d’égalité, personne
            ne sort. Les civils gagnent après l’élimination de tous les
            Undercover ; les Undercover gagnent à la parité. Les camps sont
            révélés après élimination, les mots seulement à la fin. Le nombre de
            manches est borné.
          </p>
        </details>
        {(error || launcher.failure) && (
          <p className="lobby-error" role="alert">
            {error || launcher.failure}
          </p>
        )}
        {source && (
          <form
            className="lobby-form"
            onSubmit={(e) => {
              e.preventDefault();
              void start(mode);
            }}
          >
            <label>
              Comment souhaitez-vous jouer ?
              <select
                aria-label="Comment souhaitez-vous jouer ?"
                value={mode}
                onChange={(e) => setMode(e.target.value as "quick" | "invite")}
              >
                <option value="quick">
                  Tester seul avec des joueurs de démonstration
                </option>
                <option value="invite">Inviter de vrais participants</option>
              </select>
            </label>
            {mode === "quick" && (
              <label>
                Joueurs de démonstration
                <NumberInput
                  label="Joueurs de démonstration"
                  value={count}
                  min={3}
                  max={12}
                  onChange={setCount}
                />
              </label>
            )}
            {mode === "invite" && (
              <p>
                Chacun reçoit une invitation. Vous préparez la partie quand tous
                les joueurs sont présents.
              </p>
            )}
            <PlayConfiguration
              definition={source.release.definition}
              values={values}
              onChange={setValues}
            />
            <button
              className="primary-button"
              disabled={launcher.launching || studio.busy}
              aria-busy={launcher.launching}
            >
              {launcher.launching
                ? "Préparation de la partie…"
                : mode === "quick"
                  ? "Lancer une partie de démonstration"
                  : "Créer une partie avec mes invités"}
            </button>
          </form>
        )}
      </section>
      <div className="creator-catalog">
        <article className="creator-list-card official-game-card game-auctions">
          <div>
            <span className="eyebrow">NON JOUABLE POUR LE MOMENT</span>
            <h2>Enchères</h2>
            <p>
              La verticale devra ajouter les offres et l’attribution confirmée.
              Aucun débit ne doit intervenir au dépôt d’une mise.
            </p>
          </div>
        </article>
        <article className="creator-list-card official-game-card game-spy">
          <div>
            <span className="eyebrow">NON JOUABLE POUR LE MOMENT</span>
            <h2>Qui est l’espion ?</h2>
            <p>
              Une expérience de questions et de déduction distincte d’Undercover
              est prévue. Ses règles restent à valider.
            </p>
          </div>
        </article>
      </div>
    </CreatorFrame>
  );
}
