"use client";
import { useConfirm, useToast } from "../components/ui/feedback";
import { useEffect, useRef, useState } from "react";
import {
  gameDefinitionSchema,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import {
  assetDependencySchema,
  editableMetadataSchema,
  compileCounterDefinition,
  counterRecipeFor,
  type CreatorGame,
  type EditableMetadata,
  type AssetDependency,
} from "@extension-twitch/contracts/creator";
import { useStudio } from "../components/creator-context";
import { definitionErrors } from "./creator-model";
export interface LocalCreation {
  json: string;
  metadata: EditableMetadata;
  assets: AssetDependency[];
  assetJson: string;
  baseRevision: number;
  dirty: boolean;
}
const clean = (game: CreatorGame): LocalCreation => ({
  json: JSON.stringify(game.draft.definition, null, 2),
  metadata: structuredClone(game.draft.metadata),
  assets: structuredClone(game.draft.assets),
  assetJson: JSON.stringify(game.draft.assets, null, 2),
  baseRevision: game.draft.revision,
  dirty: false,
});
export function useCreatorDraft(game: CreatorGame, workspaceId: string) {
  const confirm = useConfirm(),
    notify = useToast();
  const studio = useStudio(),
    key = `xt:creator:editor:${workspaceId}:${game.identity.id}`;
  const [local, setLocal] = useState<LocalCreation>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw) as LocalCreation;
        if (
          typeof data.json === "string" &&
          data.json.length <= 32768 &&
          typeof data.baseRevision === "number"
        )
          return {
            ...data,
            metadata: editableMetadataSchema.parse(data.metadata),
            assets: assetDependencySchema.array().max(4).parse(data.assets),
            assetJson: data.assetJson ?? JSON.stringify(data.assets),
            dirty: true,
          };
      }
    } catch {
      /* Keep the saved server creation if a cache is unreadable. */
    }
    return clean(game);
  });
  const current = useRef(local),
    sequence = useRef(0);
  const [error, setError] = useState(""),
    [backup, setBackup] = useState(() => {
      try {
        return sessionStorage.getItem(`${key}:backup`) ?? "";
      } catch {
        return "";
      }
    });
  function store(next: LocalCreation) {
    current.current = next;
    setLocal(next);
    try {
      if (next.dirty) sessionStorage.setItem(key, JSON.stringify(next));
      else sessionStorage.removeItem(key);
    } catch {
      setError(
        "Votre appareil ne peut pas conserver cette saisie. Enregistrez avant de quitter.",
      );
    }
  }
  function change(patch: Partial<LocalCreation>) {
    sequence.current++;
    store({ ...current.current, ...patch, dirty: true });
    setError("");
  }
  function definition(d: GameDefinition) {
    change({
      json: JSON.stringify(d, null, 2),
      metadata: {
        ...current.current.metadata,
        title: d.title,
        description: d.description,
      },
    });
  }
  function text(field: "title" | "description", value: string) {
    let json = current.current.json;
    try {
      json = JSON.stringify({ ...JSON.parse(json), [field]: value }, null, 2);
    } catch {
      /* Preserve incomplete technical input. */
    }
    change({ json, metadata: { ...current.current.metadata, [field]: value } });
  }
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (current.current.dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => {
    const value = current.current;
    if (!value.dirty || value.baseRevision === game.draft.revision) return;
    try {
      // A resumed receipt may be acknowledged from the shared frame. Only mark
      // the exact acknowledged contents as saved; later edits stay untouched.
      if (
        JSON.stringify(gameDefinitionSchema.parse(JSON.parse(value.json))) ===
          JSON.stringify(game.draft.definition) &&
        JSON.stringify(editableMetadataSchema.parse(value.metadata)) ===
          JSON.stringify(game.draft.metadata) &&
        JSON.stringify(
          assetDependencySchema.array().parse(JSON.parse(value.assetJson)),
        ) === JSON.stringify(game.draft.assets)
      )
        store(clean(game));
    } catch {
      /* Invalid local work remains available to correct. */
    }
  }, [game.draft.revision]);
  const stale = local.baseRevision !== game.draft.revision;
  async function save(simplify = false) {
    setError("");
    const invalid = Array.from(
      document.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(
        ".dedicated-editor input,.dedicated-editor select,.dedicated-editor textarea",
      ),
    ).find((field) => !field.disabled && !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      setError(
        "Complétez le champ signalé avant d’enregistrer. Votre saisie reste ici.",
      );
      return null;
    }
    if (stale) {
      setError(
        "Ce jeu a changé dans un autre onglet. Comparez les copies ci-dessus ; votre travail reste ici.",
      );
      return null;
    }
    const stamp = sequence.current;
    try {
      let d = gameDefinitionSchema.parse(
        JSON.parse(current.current.json) as unknown,
      );
      const metadata = editableMetadataSchema.parse(current.current.metadata);
      const assets = assetDependencySchema
        .array()
        .max(4)
        .parse(JSON.parse(current.current.assetJson) as unknown);
      const template = studio.view?.catalog.find(
        (g) => g.release.definition.id === "collective-pulse",
      )?.release.definition;
      if (simplify && template) {
        const recipe = counterRecipeFor(d, template);
        if (recipe) {
          const compiled = compileCounterDefinition(
            template,
            d.id,
            metadata.title,
            recipe,
            metadata.description,
          );
          compiled.version = d.version;
          d = compiled;
        }
      }
      if (
        !current.current.dirty &&
        JSON.stringify(d) === JSON.stringify(game.draft.definition)
      )
        return game.draft;
      const view = await studio.send({
        type: "draft.save",
        gameId: game.identity.id,
        definition: d,
        metadata,
        assets,
      });
      const saved = view?.workspace.games.find(
        (g) => g.identity.id === game.identity.id,
      );
      if (!saved) return null;
      if (sequence.current === stamp) store(clean(saved));
      else
        store({
          ...current.current,
          baseRevision: saved.draft.revision,
          dirty: true,
        });
      notify("Modifications enregistrées.");
      return saved.draft;
    } catch {
      let issues: string[] = [];
      try {
        issues = definitionErrors(JSON.parse(current.current.json) as unknown);
      } catch {
        /* Technical text remains untouched. */
      }
      setError(
        issues.join(" ") ||
          "La création ne peut pas être enregistrée. Vérifiez les champs signalés ; votre saisie est conservée.",
      );
      return null;
    }
  }
  async function loadRemote() {
    if (
      current.current.dirty &&
      !(await confirm({
        title: "Afficher la copie enregistrée ?",
        description:
          "Votre saisie sera conservée dans une copie de secours sur cet appareil.",
        confirmLabel: "Afficher la copie",
        tone: "warning",
      }))
    )
      return;
    const copy = JSON.stringify(current.current, null, 2);
    try {
      sessionStorage.setItem(`${key}:backup`, copy);
    } catch {
      /* Backup stays visible in this page. */
    }
    setBackup(copy);
    store(clean(game));
    setError("");
  }
  function keepLocal() {
    try {
      sessionStorage.setItem(
        `${key}:backup`,
        JSON.stringify(clean(game), null, 2),
      );
    } catch {
      /* Nothing is erased on the server. */
    }
    store({
      ...current.current,
      baseRevision: game.draft.revision,
      dirty: true,
    });
    setError(
      "Votre copie est conservée. Touchez Enregistrer pour appliquer vos choix.",
    );
  }
  return {
    local,
    change,
    definition,
    text,
    save,
    stale,
    error,
    setError,
    backup,
    loadRemote,
    keepLocal,
  };
}
