"use client";
import { useEffect, useState } from "react";
import {
  gameDefinitionStructureSchema,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import { definitionErrors } from "../lib/creator-model";
import {
  RolesEditor,
  VariablesEditor,
  PhasesEditor,
} from "./creator-collections";
import { ActionsEditor } from "./creator-actions";
export const studioSections = [
  "Général",
  "Participants",
  "Données",
  "Actions",
  "Étapes",
  "Apparence",
  "Ressources",
  "Versions",
  "Partage",
  "Tester",
  "Outils avancés",
] as const;
export type StudioSection = (typeof studioSections)[number];
export function CreatorVisual({
  json,
  initial,
  onChange,
  locked,
  section,
}: {
  json: string;
  initial: GameDefinition;
  onChange: (d: GameDefinition) => void;
  locked: boolean;
  section: StudioSection;
}) {
  const [definition, setDefinition] = useState(initial),
    [message, setMessage] = useState("");
  useEffect(() => {
    setMessage("");
  }, [section]);
  useEffect(() => {
    try {
      const parsed = gameDefinitionStructureSchema.safeParse(
        JSON.parse(json) as unknown,
      );
      if (parsed.success) setDefinition(parsed.data);
    } catch {
      /* Incomplete JSON is preserved, never normalized by the visual editor. */
    }
  }, [json]);
  const ownJSON = JSON.stringify(definition),
    inputJSON = (() => {
      try {
        return JSON.stringify(JSON.parse(json) as unknown);
      } catch {
        return "";
      }
    })();
  // Invalid intermediate visual values stay editable. Invalid external JSON must be repaired explicitly.
  let inputValid = false;
  try {
    inputValid = gameDefinitionStructureSchema.safeParse(
      JSON.parse(json) as unknown,
    ).success;
  } catch {
    /* Preserve the raw text. */
  }
  const divergent = ownJSON !== inputJSON && !inputValid;
  const update = (d: GameDefinition) => {
    setDefinition(d);
    setMessage("");
    onChange(d);
  };
  const errors = definitionErrors(
    divergent
      ? (() => {
          try {
            return JSON.parse(json) as unknown;
          } catch {
            return null;
          }
        })()
      : definition,
  );
  return (
    <div className="studio-visual">
      {errors.length > 0 && (
        <div role="alert" className="lobby-warning">
          <strong>À corriger avant sauvegarde</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {message && (
        <p role="alert" className="lobby-warning">
          {message}
        </p>
      )}
      {divergent && (
        <p className="lobby-warning">
          Le document complet contient une saisie que les formulaires ne peuvent
          pas lire. Votre travail est conservé. Ouvrez Outils avancés pour le
          corriger.
        </p>
      )}
      <fieldset className="studio-unboxed" disabled={locked || divergent}>
        {section === "Participants" && (
          <RolesEditor
            definition={definition}
            onChange={update}
            report={setMessage}
          />
        )}{" "}
        {section === "Données" && (
          <VariablesEditor
            definition={definition}
            onChange={update}
            report={setMessage}
          />
        )}{" "}
        {section === "Actions" && (
          <ActionsEditor definition={definition} onChange={update} />
        )}{" "}
        {section === "Étapes" && (
          <PhasesEditor
            definition={definition}
            onChange={update}
            report={setMessage}
          />
        )}
      </fieldset>
    </div>
  );
}
