import { z } from "zod";
import {
  gameDefinitionSchema,
  assetBindingSchema,
  identifierSchema,
} from "./game-definition.js";
import { accessTokenSchema } from "./sessions.js";
const name = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((v) => !/\p{C}/u.test(v));
const version = z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/);
export const guideRecipeSchema = z.strictObject({
  kind: z.literal("collective-counter"),
  goal: z.number().int().min(1).max(100),
  pointsMax: z.number().int().min(1).max(10),
  multiplier: z.number().int().min(1).max(5),
  oncePerPlayer: z.boolean(),
});
export type GuideRecipe = z.infer<typeof guideRecipeSchema>;
export const sharingTermsSchema = z.strictObject({
  definitionLicense: name,
  rulesTerms: name,
  allowVariants: z.boolean(),
  attributionRequired: z.boolean(),
});
export const editableMetadataSchema = z.strictObject({
  title: name,
  description: z.string().max(240),
  category: identifierSchema,
  tags: z.array(name.max(24)).max(8),
  recommendedPlayers: z
    .strictObject({
      min: z.number().int().min(1).max(32),
      max: z.number().int().min(1).max(32),
    })
    .refine((v) => v.min <= v.max),
  sharing: sharingTermsSchema,
});
export type EditableMetadata = z.infer<typeof editableMetadataSchema>;
export const dependencyReasonSchema = z.enum([
  "missing",
  "private",
  "not-shareable",
  "disabled",
]);
export const assetDependencySchema = z.strictObject({
  assetId: identifierSchema,
  redistribution: z.enum(["allowed", "forbidden", "unknown"]),
  license: name,
  attribution: z.string().max(160),
  binding: assetBindingSchema.optional(),
  replacementReason: dependencyReasonSchema.optional(),
});
export type AssetDependency = z.infer<typeof assetDependencySchema>;
export const attributionSchema = z.strictObject({
  gameId: z.uuid(),
  version,
  author: name,
  definitionLicense: name,
  rulesTerms: name,
});
export const gameIdentitySchema = z.strictObject({
  id: z.uuid(),
  origin: z.enum(["official", "personal", "community"]),
  ownerId: z.uuid().nullable(),
  author: name,
  authorVerified: z.boolean(),
  lineage: z.array(attributionSchema).max(8),
  createdAt: z.iso.datetime(),
});
export const releaseSchema = z.strictObject({
  version,
  definition: gameDefinitionSchema,
  metadata: editableMetadataSchema,
  assets: z.array(assetDependencySchema).max(4),
  publishedAt: z.iso.datetime(),
  rightsAttested: z.literal(true),
});
export type GameRelease = z.infer<typeof releaseSchema>;
export const draftSchema = z.strictObject({
  revision: z.number().int().positive(),
  definition: gameDefinitionSchema,
  metadata: editableMetadataSchema,
  assets: z.array(assetDependencySchema).max(4),
  guide: guideRecipeSchema.optional(),
  updatedAt: z.iso.datetime(),
});
export type GameDraft = z.infer<typeof draftSchema>;
export const creatorGameSchema = z.strictObject({
  identity: gameIdentitySchema,
  draft: draftSchema,
  releases: z.array(releaseSchema).max(8),
});
export type CreatorGame = z.infer<typeof creatorGameSchema>;
export const publishedGameSchema = z.strictObject({
  identity: gameIdentitySchema,
  release: releaseSchema,
});
export type PublishedGame = z.infer<typeof publishedGameSchema>;
export const installationSchema = z.strictObject({
  gameId: z.uuid(),
  version,
  origin: z.enum(["official", "personal", "community"]),
  installedAt: z.iso.datetime(),
});
export const studioWorkspaceSchema = z.strictObject({
  id: z.uuid(),
  name,
  version: z.number().int().positive(),
  games: z.array(creatorGameSchema).max(16),
  installations: z.array(installationSchema).max(32),
});
export type StudioWorkspace = z.infer<typeof studioWorkspaceSchema>;
export const studioViewSchema = z.strictObject({
  workspace: studioWorkspaceSchema,
  catalog: z.array(publishedGameSchema).max(8),
  guideCompatibility: z.record(z.uuid(), z.boolean()),
});
export type StudioView = z.infer<typeof studioViewSchema>;
export const workspaceCreateSchema = z.strictObject({
  requestId: z.uuid(),
  name,
});
const source = z.strictObject({ gameId: z.uuid(), version });
export const creatorOperationSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("draft.create"),
    title: name,
    mode: z.enum(["advanced", "guided"]),
    guide: guideRecipeSchema.optional(),
  }),
  z.strictObject({ type: z.literal("draft.fork"), source, title: name }),
  z.strictObject({
    type: z.literal("draft.save"),
    gameId: z.uuid(),
    definition: gameDefinitionSchema,
    metadata: editableMetadataSchema,
    assets: z.array(assetDependencySchema).max(4),
  }),
  z.strictObject({
    type: z.literal("draft.guide"),
    gameId: z.uuid(),
    guide: guideRecipeSchema,
  }),
  z.strictObject({
    type: z.literal("draft.publish"),
    gameId: z.uuid(),
    version,
    rightsAttested: z.literal(true),
  }),
  z.strictObject({ type: z.literal("library.install"), source }),
]);
export type CreatorOperation = z.infer<typeof creatorOperationSchema>;
export const creatorCommandSchema = z.strictObject({
  commandId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  operation: creatorOperationSchema,
});
export type CreatorCommand = z.infer<typeof creatorCommandSchema>;
export const creatorTestSchema = z.strictObject({
  requestId: z.uuid(),
  sessionToken: accessTokenSchema,
  gameId: z.uuid(),
  version: z.union([version, z.literal("draft")]),
});

// Future public Store DTO: deliberately excludes definitions, bindings, workspace capabilities and sessions.
export const storeListingSchema = z.strictObject({
  gameId: z.uuid(),
  version,
  origin: z.enum(["official", "community"]),
  owner: z.strictObject({ id: z.uuid(), displayName: name }),
  creator: z.strictObject({
    id: z.uuid(),
    displayName: name,
    verified: z.boolean(),
  }),
  metadata: editableMetadataSchema,
  lineage: z.array(attributionSchema).max(8),
  compatibility: z.strictObject({
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    engineVersion: z.union([z.literal(1), z.literal(2)]),
  }),
  assets: z
    .array(
      z.strictObject({
        assetId: identifierSchema,
        kind: z.enum(["image", "audio", "video"]),
        redistribution: z.enum(["allowed", "forbidden", "unknown"]),
        replacementRequired: z.boolean(),
        attribution: z.string().max(160),
      }),
    )
    .max(4),
  publicationStatus: z.enum([
    "private",
    "pending-review",
    "published",
    "disabled",
  ]),
  moderation: z.strictObject({
    status: z.enum(["not-reviewed", "approved", "disabled"]),
    reportCount: z.number().int().nonnegative(),
  }),
  sharePath: z.string().regex(/^\/games\/[a-f0-9-]{36}$/),
});
export const channelDiscoverySchema = z
  .strictObject({
    channelId: z.string().min(1).max(64),
    enabled: z.boolean(),
    publishedGame: source.nullable(),
  })
  .refine((v) => v.enabled || v.publishedGame === null);
export const exportManifestSchema = z.strictObject({
  format: z.literal("extension-twitch-manifest"),
  formatVersion: z.literal(1),
  gameId: z.uuid(),
  version,
  title: name,
  lineage: z.array(attributionSchema).max(8),
  sharing: sharingTermsSchema,
  compatibility: z.strictObject({
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    engineVersion: z.union([z.literal(1), z.literal(2)]),
  }),
  assets: z
    .array(
      z.strictObject({
        assetId: identifierSchema,
        kind: z.enum(["image", "audio", "video"]),
        redistribution: z.enum(["allowed", "forbidden", "unknown"]),
        replacementRequired: z.boolean(),
        license: name,
        attribution: z.string().max(160),
      }),
    )
    .max(4),
});

export const creatorAccessSchema = z.strictObject({
  id: z.uuid(),
  token: accessTokenSchema,
});

export function assetDependencyStatus(
  asset: AssetDependency,
  visibility: "public" | "gm" | "owner" = "public",
): "shareable" | "missing" | "private" | "not-shareable" | "disabled" {
  if (!asset.binding) return asset.replacementReason ?? "missing";
  if (asset.binding.status === "disabled") return "disabled";
  if (
    visibility !== "public" ||
    asset.binding.access !== "public" ||
    asset.binding.provider !== "https"
  )
    return "private";
  return asset.redistribution === "allowed" ? "shareable" : "not-shareable";
}

// Future moderation override, separate from the immutable release document.
export const moderationDecisionSchema = z.strictObject({
  decisionId: z.uuid(),
  gameId: z.uuid(),
  version,
  assetId: identifierSchema.optional(),
  status: z.enum(["disabled", "restored"]),
  reason: z.enum(["rights", "abuse", "policy", "other"]),
  at: z.iso.datetime(),
});
