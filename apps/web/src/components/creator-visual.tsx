"use client";
import { useEffect, useState } from "react";
import {
  gameDefinitionSchema,
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
  "Participants et rôles",
  "Variables",
  "Actions",
  "Conditions et effets",
  "Phases et transitions",
  "Apparence",
  "Tester",
  "Publier",
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
      const parsed = gameDefinitionSchema.safeParse(
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
    inputValid = gameDefinitionSchema.safeParse(
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
          Le document technique comporte des changements non interprétables.
          Corrigez-le avant de reprendre les formulaires ; votre texte est
          préservé.
        </p>
      )}
      {definition.schemaVersion === 1 && (
        <div className="lobby-warning">
          <p>
            Ce jeu utilise le langage v1. Les conditions composées et calculs
            nécessitent v2 ; la conversion conserve les règles existantes.
          </p>
          <button
            className="secondary-button"
            disabled={locked || divergent}
            onClick={() =>
              update({ ...definition, schemaVersion: 2, engineVersion: 2 })
            }
          >
            Activer les expressions v2
          </button>
        </div>
      )}
      <fieldset className="studio-unboxed" disabled={locked || divergent}>
        {section === "Participants et rôles" && (
          <RolesEditor
            definition={definition}
            onChange={update}
            report={setMessage}
          />
        )}{" "}
        {section === "Variables" && (
          <VariablesEditor
            definition={definition}
            onChange={update}
            report={setMessage}
          />
        )}{" "}
        {(section === "Actions" || section === "Conditions et effets") && (
          <ActionsEditor
            definition={definition}
            onChange={update}
            focusRules={section === "Conditions et effets"}
          />
        )}{" "}
        {section === "Phases et transitions" && (
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
