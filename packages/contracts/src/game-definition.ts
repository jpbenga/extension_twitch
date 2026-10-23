import { z } from "zod";
import { expressionSchema, inspectExpression } from "./expressions.js";
export {
  expressionSchema,
  inspectExpression,
  type Expression,
} from "./expressions.js";

export const identifierSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,39}$/)
  .refine((id) => !["constructor", "prototype"].includes(id));
const label = z.string().trim().min(1).max(80);
export const scalarSchema = z.union([
  z.string().max(240),
  z.number().int().min(-100000).max(100000),
  z.boolean(),
]);
export type Scalar = z.infer<typeof scalarSchema>;
export const valueSpecSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("integer"),
    min: z.number().int().min(-100000),
    max: z.number().int().max(100000),
    initial: z.number().int(),
  }),
  z.strictObject({
    type: z.literal("text"),
    maxLength: z.number().int().min(1).max(240),
    initial: z.string().max(240),
  }),
  z.strictObject({ type: z.literal("boolean"), initial: z.boolean() }),
]);
export type ValueSpec = z.infer<typeof valueSpecSchema>;
export function acceptsValue(spec: ValueSpec, value: unknown): value is Scalar {
  if (spec.type === "integer")
    return (
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= spec.min &&
      value <= spec.max
    );
  if (spec.type === "text")
    return (
      typeof value === "string" &&
      value.length <= spec.maxLength &&
      !/\p{C}/u.test(value)
    );
  return typeof value === "boolean";
}
const field = z.strictObject({
  id: identifierSchema,
  label,
  value: valueSpecSchema,
});
const source = z.discriminatedUnion("from", [
  z.strictObject({ from: z.literal("literal"), value: scalarSchema }),
  z.strictObject({
    from: z.literal("expression"),
    expression: expressionSchema,
  }),
  z.strictObject({ from: z.literal("parameter"), id: identifierSchema }),
  z.strictObject({ from: z.literal("configuration"), id: identifierSchema }),
]);
const effect = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("set"),
    variable: identifierSchema,
    value: source,
  }),
  z.strictObject({
    type: z.literal("increment"),
    variable: identifierSchema,
    value: source,
  }),
  z.strictObject({ type: z.literal("reveal"), variable: identifierSchema }),
]);
export const actionDefinitionSchema = z.strictObject({
  id: identifierSchema,
  label,
  description: z.string().max(240).optional(),
  roles: z.array(identifierSchema).min(1).max(8),
  phases: z.array(identifierSchema).min(1).max(8),
  parameters: z.array(field).max(4),
  conditions: z
    .array(z.strictObject({ variable: identifierSchema, equals: scalarSchema }))
    .max(4),
  effects: z.array(effect).max(6),
  guard: expressionSchema.optional(),
  confirmation: z.boolean().default(false),
  nextPhase: identifierSchema.optional(),
});
const visibility = z.enum(["public", "gm", "owner"]);
const assetSlot = z.strictObject({
  id: identifierSchema,
  kind: z.enum(["image", "video", "audio"]),
  usage: label,
  visibility,
  fallback: label,
});
const widget = z.strictObject({
  id: identifierSchema,
  source: z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("variable"), id: identifierSchema }),
    z.strictObject({ type: z.literal("asset"), id: identifierSchema }),
  ]),
  x: z.number().int().min(0).max(3840),
  y: z.number().int().min(0).max(2160),
  width: z.number().int().min(1).max(3840),
  height: z.number().int().min(1).max(2160),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  phases: z.array(identifierSchema).min(1).max(8),
});
const rawDefinition = z.strictObject({
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  engineVersion: z.union([z.literal(1), z.literal(2)]),
  id: identifierSchema,
  version: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/),
  title: label,
  description: z.string().max(240),
  configuration: z
    .array(field.extend({ visibility: z.enum(["public", "gm"]) }))
    .max(8),
  roles: z
    .array(
      z.strictObject({
        id: identifierSchema,
        label,
        description: z.string().max(240).optional(),
        base: z.enum(["gm", "player", "spectator"]),
      }),
    )
    .min(3)
    .max(8),
  defaultPlayerRole: identifierSchema,
  variables: z
    .array(
      field.extend({ scope: z.enum(["session", "participant"]), visibility }),
    )
    .max(8),
  phases: z
    .array(
      z.strictObject({
        id: identifierSchema,
        label,
        description: z.string().max(240).optional(),
      }),
    )
    .min(1)
    .max(8),
  initialPhase: identifierSchema,
  actions: z.array(actionDefinitionSchema).max(8),
  assets: z.array(assetSlot).max(4),
  scenes: z
    .array(
      z.strictObject({
        id: identifierSchema,
        width: z.number().int().min(320).max(3840),
        height: z.number().int().min(180).max(2160),
        widgets: z.array(widget).max(8),
      }),
    )
    .max(4),
});
export const gameDefinitionSchema = rawDefinition.superRefine((d, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  if (d.schemaVersion !== d.engineVersion) fail("Incompatible engine version");
  if (new TextEncoder().encode(JSON.stringify(d)).length > 6000)
    fail("Definition too large");
  const unique = (items: { id: string }[]) => {
    if (new Set(items.map((x) => x.id)).size !== items.length)
      fail("Duplicate identifier");
  };
  [
    d.roles,
    d.configuration,
    d.variables,
    d.phases,
    d.actions,
    d.assets,
    d.scenes,
  ].forEach(unique);
  const fields = [
    ...d.configuration,
    ...d.variables,
    ...d.actions.flatMap((a) => a.parameters),
  ];
  for (const f of fields)
    if (!acceptsValue(f.value, f.value.initial))
      fail("Invalid default or bounds");
  if (
    d.roles.filter((r) => r.base === "gm").length !== 1 ||
    d.roles.filter((r) => r.base === "spectator").length !== 1
  )
    fail("Exactly one GM and spectator required");
  if (!d.roles.some((r) => r.id === d.defaultPlayerRole && r.base === "player"))
    fail("Invalid default player role");
  if (!d.phases.some((p) => p.id === d.initialPhase))
    fail("Unknown initial phase");
  for (const v of d.variables)
    if (v.visibility === "owner" && v.scope !== "participant")
      fail("Owner variable must belong to participant");
  for (const a of d.actions) {
    unique(a.parameters);
    const roles = a.roles.map((id) => d.roles.find((r) => r.id === id));
    if (roles.some((r) => !r || r.base === "spectator"))
      fail("Unknown or read-only action role");
    const expressionContext = {
      variables: d.variables,
      configuration: d.configuration,
      parameters: a.parameters,
      roles: roles.flatMap((r) => (r ? [r.base] : [])),
    };
    if (a.guard) {
      if (d.schemaVersion !== 2) fail("Expressions require v2");
      try {
        if (
          inspectExpression(a.guard, { ...expressionContext, parameters: [] })
            .type !== "boolean"
        )
          fail("Guard must be boolean");
      } catch {
        fail("Invalid guard expression");
      }
    }
    if (
      a.phases.some((id) => !d.phases.some((p) => p.id === id)) ||
      (a.nextPhase && !d.phases.some((p) => p.id === a.nextPhase))
    )
      fail("Unknown phase");
    for (const c of a.conditions) {
      const v = d.variables.find((v) => v.id === c.variable);
      if (!v || !acceptsValue(v.value, c.equals)) fail("Invalid condition");
      else if (v.visibility === "gm" && roles.some((r) => r?.base !== "gm"))
        fail("Private condition oracle");
      else if (
        v.scope === "participant" &&
        roles.some((r) => r?.base !== "player")
      )
        fail("Participant condition requires self");
    }
    for (const e of a.effects) {
      const v = d.variables.find((v) => v.id === e.variable);
      if (!v) {
        fail("Unknown effect variable");
        continue;
      }
      if (e.type === "reveal") {
        if (roles.some((r) => r?.base !== "gm")) fail("Reveal requires GM");
        continue;
      }
      if (v.scope === "participant" && roles.some((r) => r?.base !== "player"))
        fail("Participant effect requires self");
      if (v.visibility === "gm" && roles.some((r) => r?.base !== "gm"))
        fail("Hidden variable mutation oracle");
      if (e.type === "increment" && v.value.type !== "integer")
        fail("Increment requires integer");
      if (e.value.from === "expression") {
        if (d.schemaVersion !== 2) fail("Expressions require v2");
        try {
          const info = inspectExpression(e.value.expression, expressionContext);
          if (
            info.type !== v.value.type ||
            (info.visibility !== "public" && info.visibility !== v.visibility)
          )
            fail("Expression type or private flow mismatch");
        } catch {
          fail("Invalid effect expression");
        }
      } else if (e.value.from === "literal") {
        if (e.type === "set" && !acceptsValue(v.value, e.value.value))
          fail("Invalid literal");
        if (e.type === "increment" && typeof e.value.value !== "number")
          fail("Increment requires number");
      } else {
        const sourceId = e.value.id;
        const f =
          e.value.from === "parameter"
            ? a.parameters.find((p) => p.id === sourceId)
            : d.configuration.find((p) => p.id === sourceId);
        if (!f || f.value.type !== v.value.type)
          fail("Unknown or incompatible value source");
        if (
          e.value.from === "configuration" &&
          f &&
          "visibility" in f &&
          f.visibility === "gm" &&
          v.visibility !== "gm"
        )
          fail("Private configuration cannot be copied");
      }
    }
  }
  for (const scene of d.scenes) {
    unique(scene.widgets);
    for (const w of scene.widgets) {
      if (w.x + w.width > scene.width || w.y + w.height > scene.height)
        fail("Widget outside canvas");
      if (w.phases.some((id) => !d.phases.some((p) => p.id === id)))
        fail("Unknown widget phase");
      if (
        w.source.type === "variable"
          ? !d.variables.some((v) => v.id === w.source.id)
          : !d.assets.some((a) => a.id === w.source.id)
      )
        fail("Unknown widget source");
    }
  }
});
export type GameDefinition = z.infer<typeof gameDefinitionSchema>;
export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;
export const scalarRecordSchema = z
  .record(identifierSchema, scalarSchema)
  .refine((v) => Object.keys(v).length <= 8);

export const assetBindingSchema = z
  .strictObject({
    assetId: identifierSchema,
    provider: z.enum(["browser-local", "https", "cloud-connector"]),
    reference: z.string().min(1).max(512),
    access: z.enum(["device-only", "public", "private"]),
    status: z.enum(["active", "disabled"]),
    rightsAttested: z.literal(true),
    size: z.number().int().nonnegative().max(100000000).optional(),
    mime: z
      .enum([
        "image/png",
        "image/jpeg",
        "image/webp",
        "video/mp4",
        "audio/mpeg",
        "audio/ogg",
      ])
      .optional(),
  })
  .superRefine((a, ctx) => {
    const fail = () =>
      ctx.addIssue({ code: "custom", message: "Unsafe asset reference" });
    if (a.provider !== "https") {
      if (
        !/^[a-zA-Z0-9_-]{1,128}$/.test(a.reference) ||
        (a.provider === "browser-local" && a.access !== "device-only")
      )
        fail();
      return;
    }
    try {
      const u = new URL(a.reference);
      const h = u.hostname.toLowerCase();
      // No fetching: this is a conservative syntax policy, not DNS/redirect validation.
      if (
        u.protocol !== "https:" ||
        u.username ||
        u.password ||
        u.search ||
        u.hash ||
        u.port ||
        !h.includes(".") ||
        /[\[\]:]/.test(h) ||
        /^\d+(\.\d+)*$/.test(h) ||
        /(^|\.)(localhost|local|internal|test|invalid)$/.test(h) ||
        a.access !== "public"
      )
        fail();
    } catch {
      fail();
    }
  });
export type AssetBinding = z.infer<typeof assetBindingSchema>;

const projectedValue = z.strictObject({
  id: identifierSchema,
  label,
  participantId: z.uuid().optional(),
  value: scalarSchema,
});
export const gameProjectionSchema = z.strictObject({
  runId: z.uuid(),
  definitionId: identifierSchema,
  definitionVersion: z.string(),
  title: label,
  phase: z.strictObject({ id: identifierSchema, label }),
  values: z.array(projectedValue).max(264),
  actions: z
    .array(
      z.strictObject({
        id: identifierSchema,
        label,
        confirmation: z.boolean(),
        parameters: z.array(field).max(4),
      }),
    )
    .max(8),
  assets: z
    .array(
      z.strictObject({
        id: identifierSchema,
        kind: z.enum(["image", "video", "audio"]),
        fallback: label,
        availability: z.enum(["unbound", "unavailable", "disabled"]),
      }),
    )
    .max(4),
  role: identifierSchema.optional(),
  management: z
    .strictObject({
      roles: z.array(z.strictObject({ id: identifierSchema, label })).max(8),
      assignments: z.record(z.uuid(), identifierSchema),
    })
    .optional(),
});
export type GameProjection = z.infer<typeof gameProjectionSchema>;

export const gameExamplesSchema = z.array(gameDefinitionSchema).max(8);
