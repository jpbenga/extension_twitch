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
export function OfficialGamesLab() {
  const studio = useStudio(),
    launcher = useCreatorLaunch();
  const source = studio.view?.catalog.find(
    (g) => g.release.definition.id === "undercover",
  );
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
      "/creator/play",
      values,
      count,
    );
  }
  return (
    <CreatorFrame workspace>
      <div className="creator-page-title">
        <div>
          <span className="eyebrow">SIMULATEUR D’ÉMISSION</span>
          <h1>Laboratoire des jeux</h1>
          <p>
            Une vraie partie, plusieurs points de vue. Choisissez vos réglages
            puis animez depuis votre téléphone.
          </p>
        </div>
        <Link href="/creator" className="secondary-button">
          Retour au Studio
        </Link>
      </div>
      <section className="lobby-panel">
        <span className="eyebrow">5A · VARIANTE DE DÉMONSTRATION</span>
        <h2>Tester Undercover</h2>
        <p>
          Découvrez votre mot, discutez et votez pour démasquer les Undercover.
          Les règles de cette variante restent à valider par vos retours.
        </p>
        <details>
          <summary>Comment se déroule cette variante ?</summary>
          <p>
            Distribution secrète → discussion → vote unique → résultat. Pas de
            vote pour soi. En cas d’égalité, personne ne sort. Les civils
            gagnent après l’élimination de tous les Undercover ; les Undercover
            gagnent à la parité. Les camps sont révélés après élimination, les
            mots seulement à la fin. Le nombre de tours est borné.
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
              void start("quick");
            }}
          >
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
                : "Lancer une partie de démonstration"}
            </button>
            <details>
              <summary>Jouer avec de vraies personnes</summary>
              <p>
                Créez une partie sans joueurs fictifs. Chacun rejoint avec son
                invitation ; préparez la partie quand tout le monde est là. Les
                mêmes règles s’appliquent.
              </p>
              <button
                type="button"
                className="secondary-button"
                disabled={launcher.launching || studio.busy}
                onClick={() => void start("invite")}
              >
                Créer une partie avec mes invités
              </button>
            </details>
          </form>
        )}
      </section>
      <div className="creator-catalog">
        <article className="creator-list-card">
          <div>
            <span className="eyebrow">5B · NON JOUABLE POUR LE MOMENT</span>
            <h2>Enchères</h2>
            <p>
              La verticale devra ajouter les offres et l’attribution confirmée.
              Aucun débit ne doit intervenir au dépôt d’une mise.
            </p>
          </div>
        </article>
        <article className="creator-list-card">
          <div>
            <span className="eyebrow">5C · NON JOUABLE POUR LE MOMENT</span>
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
