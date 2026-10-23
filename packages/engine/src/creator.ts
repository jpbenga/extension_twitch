import {
  gameDefinitionSchema,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";
import {
  assetDependencyStatus as dependencyStatus,
  compileCounterDefinition,
  exportManifestSchema,
  creatorOperationSchema,
  type AssetDependency,
  type CreatorGame,
  type EditableMetadata,
  type GuideRecipe,
  type PublishedGame,
  type StudioWorkspace,
  type CreatorOperation,
} from "@extension-twitch/contracts/creator";
import { undercoverDefinition } from "@extension-twitch/game-undercover/definition";
import { collectivePulse, answerBox } from "./examples.js";
import { SessionError } from "./session-types.js";

export function metadataFor(definition: GameDefinition): EditableMetadata {
  return {
    title: definition.title,
    description: definition.description,
    category: "community",
    tags: [],
    recommendedPlayers: { min: 1, max: 8 },
    sharing: {
      definitionLicense: "Privé — droits à préciser",
      rulesTerms: "Droits sur les règles à préciser",
      allowVariants: false,
      attributionRequired: true,
    },
  };
}
const platformAuthor = "Extension Twitch Studio · exemple";
export const officialCatalog: readonly PublishedGame[] = [
  collectivePulse,
  answerBox,
  undercoverDefinition,
].map((definition, index) => ({
  identity: {
    id: `10000000-0000-4000-8000-00000000000${index + 1}`,
    origin: "official",
    ownerId: null,
    author: platformAuthor,
    authorVerified: false,
    lineage: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  release: {
    version: definition.version,
    definition: structuredClone(definition),
    metadata: {
      ...metadataFor(definition),
      category: definition.mechanics ? "official-games" : "studio-examples",
      ...(definition.mechanics
        ? {
            recommendedPlayers: {
              min: definition.mechanics.minPlayers,
              max: definition.mechanics.maxPlayers,
            },
          }
        : {}),
      sharing: {
        definitionLicense: "Exemple de démonstration — copie autorisée",
        rulesTerms: "Exemple de démonstration — variantes autorisées",
        allowVariants: true,
        attributionRequired: true,
      },
    },
    assets: definition.assets.map((a) => ({
      assetId: a.id,
      redistribution: "unknown",
      license: "Aucun média fourni",
      attribution: "",
      replacementReason: "missing",
    })),
    publishedAt: "2026-01-01T00:00:00.000Z",
    rightsAttested: true,
  },
}));
export { dependencyStatus };
export function shareableAssets(
  assets: AssetDependency[],
  definition: GameDefinition,
): AssetDependency[] {
  return assets.map((a) => {
    const status = dependencyStatus(
      a,
      definition.assets.find((slot) => slot.id === a.assetId)?.visibility ??
        "gm",
    );
    if (status === "shareable") {
      const { replacementReason: _removed, ...copy } = structuredClone(a);
      return copy;
    }
    const { binding: _private, ...metadata } = structuredClone(a);
    return { ...metadata, replacementReason: status };
  });
}
export function compileGuide(
  id: string,
  title: string,
  recipe: GuideRecipe,
): GameDefinition {
  return compileCounterDefinition(collectivePulse, id, title, recipe);
}
export function guideRepresentable(game: CreatorGame): boolean {
  if (!game.draft.guide) return false;
  const compiled = compileGuide(
    game.draft.definition.id,
    game.draft.definition.title,
    game.draft.guide,
  );
  compiled.version = game.draft.definition.version;
  return JSON.stringify(compiled) === JSON.stringify(game.draft.definition);
}
function validateAssets(definition: GameDefinition, assets: AssetDependency[]) {
  if (
    new Set(assets.map((a) => a.assetId)).size !== assets.length ||
    assets.some(
      (a) =>
        !definition.assets.some(
          (slot) =>
            slot.id === a.assetId &&
            (!a.binding ||
              a.binding.access !== "public" ||
              slot.visibility === "public") &&
            (!a.binding || a.binding.assetId === a.assetId) &&
            (!a.binding?.mime || a.binding.mime.startsWith(`${slot.kind}/`)),
        ),
    )
  )
    throw new SessionError("INVALID_ASSET");
  return definition.assets.map(
    (slot) =>
      assets.find((a) => a.assetId === slot.id) ?? {
        assetId: slot.id,
        redistribution: "unknown" as const,
        license: "Droits à préciser",
        attribution: "",
        replacementReason: "missing" as const,
      },
  );
}
export function findRelease(
  workspace: StudioWorkspace,
  gameId: string,
  version: string,
): PublishedGame {
  const official = officialCatalog.find(
    (g) => g.identity.id === gameId && g.release.version === version,
  );
  if (official) return structuredClone(official);
  const game = workspace.games.find((g) => g.identity.id === gameId);
  const release = game?.releases.find((r) => r.version === version);
  if (!game || !release) throw new SessionError("RELEASE_NOT_FOUND", 404);
  return {
    identity: structuredClone(game.identity),
    release: structuredClone(release),
  };
}
export function decideCreator(
  workspace: StudioWorkspace,
  operation: CreatorOperation,
  context: { id: string; at: string },
): StudioWorkspace {
  operation = creatorOperationSchema.parse(operation);
  const next = structuredClone(workspace);
  const selected =
    "gameId" in operation
      ? next.games.find((g) => g.identity.id === operation.gameId)
      : undefined;
  const requireSelected = (): CreatorGame => {
    if (!selected || selected.identity.ownerId !== workspace.id)
      throw new SessionError("GAME_NOT_FOUND", 404);
    return selected;
  };
  if (operation.type === "draft.create" || operation.type === "draft.fork") {
    if (next.games.length >= 16) throw new SessionError("LIBRARY_FULL", 409);
    const definitionId = `g-${context.id}`;
    let definition: GameDefinition,
      metadata: EditableMetadata,
      assets: AssetDependency[] = [],
      lineage: CreatorGame["identity"]["lineage"] = [];
    if (operation.type === "draft.fork") {
      const source = findRelease(
        workspace,
        operation.source.gameId,
        operation.source.version,
      );
      if (
        source.identity.ownerId !== workspace.id &&
        !source.release.metadata.sharing.allowVariants
      )
        throw new SessionError("VARIANT_FORBIDDEN", 403);
      if (source.identity.lineage.length >= 8)
        throw new SessionError("LINEAGE_LIMIT", 409);
      definition = structuredClone(source.release.definition);
      definition.id = definitionId;
      definition.title = operation.title;
      definition.version = "0.1.0";
      metadata = {
        ...structuredClone(source.release.metadata),
        title: operation.title,
      };
      assets = shareableAssets(
        source.release.assets,
        source.release.definition,
      );
      lineage = [
        ...structuredClone(source.identity.lineage),
        {
          gameId: source.identity.id,
          version: source.release.version,
          author: source.identity.author,
          definitionLicense: source.release.metadata.sharing.definitionLicense,
          rulesTerms: source.release.metadata.sharing.rulesTerms,
        },
      ];
    } else if (operation.mode === "guided") {
      if (!operation.guide) throw new SessionError("GUIDE_REQUIRED");
      definition = compileGuide(definitionId, operation.title, operation.guide);
      metadata = metadataFor(definition);
    } else {
      definition = gameDefinitionSchema.parse({
        ...structuredClone(collectivePulse),
        schemaVersion: 2,
        engineVersion: 2,
        id: definitionId,
        title: operation.title,
        description: "Création personnelle",
        assets: [],
        scenes: [],
        variables: [
          {
            id: "score",
            label: "Score",
            scope: "session",
            visibility: "public",
            value: { type: "integer", min: 0, max: 100000, initial: 0 },
          },
        ],
        phases: [{ id: "live", label: "En direct" }],
        initialPhase: "live",
        actions: [
          {
            id: "score",
            label: "Ajouter un point",
            roles: ["host"],
            phases: ["live"],
            parameters: [],
            conditions: [],
            effects: [
              {
                type: "increment",
                variable: "score",
                value: { from: "literal", value: 1 },
              },
            ],
          },
        ],
      });
      metadata = metadataFor(definition);
    }
    next.games.push({
      identity: {
        id: context.id,
        origin: "personal",
        ownerId: workspace.id,
        author: workspace.name,
        authorVerified: false,
        lineage,
        createdAt: context.at,
      },
      draft: {
        revision: 1,
        definition,
        metadata,
        assets: validateAssets(definition, assets),
        ...(operation.type === "draft.create" &&
        operation.mode === "guided" &&
        operation.guide
          ? { guide: operation.guide }
          : {}),
        updatedAt: context.at,
      },
      releases: [],
    });
  } else if (operation.type === "draft.save") {
    const game = requireSelected();
    if (operation.definition.id !== game.draft.definition.id)
      throw new SessionError("STABLE_ID_REQUIRED");
    game.draft = {
      ...game.draft,
      definition: gameDefinitionSchema.parse({
        ...operation.definition,
        title: operation.metadata.title,
        description: operation.metadata.description,
      }),
      metadata: structuredClone(operation.metadata),
      assets: validateAssets(operation.definition, operation.assets),
      revision: game.draft.revision + 1,
      updatedAt: context.at,
    };
  } else if (operation.type === "draft.guide") {
    const game = requireSelected();
    if (!guideRepresentable(game))
      throw new SessionError("GUIDE_NOT_REPRESENTABLE", 409);
    const definition = compileGuide(
      game.draft.definition.id,
      game.draft.definition.title,
      operation.guide,
    );
    definition.version = game.draft.definition.version;
    game.draft = {
      ...game.draft,
      definition,
      guide: structuredClone(operation.guide),
      revision: game.draft.revision + 1,
      updatedAt: context.at,
    };
    game.draft.metadata.description = game.draft.definition.description;
  } else if (operation.type === "draft.publish") {
    const game = requireSelected();
    if (game.releases.length >= 8) throw new SessionError("RELEASE_LIMIT", 409);
    if (game.releases.some((r) => r.version === operation.version))
      throw new SessionError("VERSION_ALREADY_PUBLISHED", 409);
    game.releases.push({
      version: operation.version,
      definition: gameDefinitionSchema.parse({
        ...game.draft.definition,
        version: operation.version,
      }),
      metadata: structuredClone(game.draft.metadata),
      assets: shareableAssets(game.draft.assets, game.draft.definition),
      publishedAt: context.at,
      rightsAttested: true,
    });
  } else if (operation.type === "library.install") {
    const source = findRelease(
      workspace,
      operation.source.gameId,
      operation.source.version,
    );
    if (
      next.installations.some(
        (i) =>
          i.gameId === source.identity.id &&
          i.version === source.release.version,
      )
    )
      throw new SessionError("ALREADY_INSTALLED", 409);
    if (next.installations.length >= 32)
      throw new SessionError("LIBRARY_FULL", 409);
    next.installations.push({
      gameId: source.identity.id,
      version: source.release.version,
      origin: source.identity.origin,
      installedAt: context.at,
    });
  }
  return { ...next, version: workspace.version + 1 };
}
export function exportManifest(source: PublishedGame) {
  return exportManifestSchema.parse({
    format: "extension-twitch-manifest",
    formatVersion: 1,
    gameId: source.identity.id,
    version: source.release.version,
    title: source.release.metadata.title,
    lineage: structuredClone(source.identity.lineage),
    sharing: structuredClone(source.release.metadata.sharing),
    compatibility: {
      schemaVersion: source.release.definition.schemaVersion,
      engineVersion: source.release.definition.engineVersion,
    },
    assets: source.release.definition.assets.map((slot) => {
      const dep = source.release.assets.find((a) => a.assetId === slot.id);
      return {
        assetId: slot.id,
        kind: slot.kind,
        redistribution: dep?.redistribution ?? "unknown",
        replacementRequired: !dep || dependencyStatus(dep) !== "shareable",
        license: dep?.license ?? "Droits à préciser",
        attribution: dep?.attribution ?? "",
      };
    }),
  });
}
