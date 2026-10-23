import {
  gameDefinitionSchema,
  type GameDefinition,
} from "@extension-twitch/contracts/game-definition";

// Server-side teaching examples, not official product rules or private session data.
const base = {
  schemaVersion: 1,
  engineVersion: 1,
  version: "0.1.0",
  configuration: [],
  assets: [],
  scenes: [],
  roles: [
    { id: "host", label: "Animateur", base: "gm" },
    { id: "contributor", label: "Contributeur", base: "player" },
    { id: "audience", label: "Spectateur", base: "spectator" },
  ],
  defaultPlayerRole: "contributor",
} as const;
const integer = { type: "integer", min: 0, max: 100, initial: 0 } as const;
export const collectivePulse = gameDefinitionSchema.parse({
  ...base,
  id: "collective-pulse",
  title: "Impulsion collective",
  description: "Chaque joueur contribue une fois au compteur commun.",
  phases: [
    { id: "preparation", label: "Préparation" },
    { id: "collect", label: "Collecte" },
    { id: "finished", label: "Terminé" },
  ],
  initialPhase: "preparation",
  variables: [
    {
      id: "total",
      label: "Points collectifs",
      scope: "session",
      visibility: "public",
      value: integer,
    },
    {
      id: "used",
      label: "Contribution envoyée",
      scope: "participant",
      visibility: "owner",
      value: { type: "boolean", initial: false },
    },
  ],
  actions: [
    {
      id: "open",
      label: "Ouvrir la collecte",
      roles: ["host"],
      phases: ["preparation"],
      parameters: [],
      conditions: [],
      effects: [],
      nextPhase: "collect",
    },
    {
      id: "contribute",
      label: "Contribuer",
      roles: ["contributor"],
      phases: ["collect"],
      parameters: [
        {
          id: "amount",
          label: "Points (1 à 3)",
          value: { type: "integer", min: 1, max: 3, initial: 1 },
        },
      ],
      conditions: [{ variable: "used", equals: false }],
      effects: [
        {
          type: "increment",
          variable: "total",
          value: { from: "parameter", id: "amount" },
        },
        {
          type: "set",
          variable: "used",
          value: { from: "literal", value: true },
        },
      ],
    },
    {
      id: "finish",
      confirmation: true,
      label: "Terminer la collecte",
      roles: ["host"],
      phases: ["collect"],
      parameters: [],
      conditions: [],
      effects: [],
      nextPhase: "finished",
    },
  ],
  assets: [
    {
      id: "backdrop",
      kind: "image",
      usage: "Fond du plateau",
      visibility: "public",
      fallback: "Fond Studio par défaut",
    },
  ],
  scenes: [
    {
      id: "main",
      width: 1920,
      height: 1080,
      widgets: [
        {
          id: "score",
          source: { type: "variable", id: "total" },
          x: 100,
          y: 100,
          width: 600,
          height: 200,
          color: "#ffffff",
          phases: ["collect", "finished"],
        },
      ],
    },
  ],
});
export const answerBox = gameDefinitionSchema.parse({
  ...base,
  id: "answer-box",
  title: "La boîte à réponses",
  description: "Réponses privées, relecture distincte et révélation par le GM.",
  roles: [
    ...base.roles,
    { id: "reviewer", label: "Relecteur", base: "player" },
  ],
  phases: [
    { id: "preparation", label: "Préparation" },
    { id: "write", label: "Réponses privées" },
    { id: "review", label: "Relecture" },
    { id: "revealed", label: "Révélation" },
  ],
  initialPhase: "preparation",
  configuration: [
    {
      id: "production-note",
      label: "Note de production privée",
      visibility: "gm",
      value: { type: "text", maxLength: 100, initial: "Note réservée au GM" },
    },
  ],
  variables: [
    {
      id: "answer",
      label: "Réponse",
      scope: "participant",
      visibility: "owner",
      value: { type: "text", maxLength: 120, initial: "" },
    },
    {
      id: "submitted",
      label: "Réponse reçue",
      scope: "participant",
      visibility: "public",
      value: { type: "boolean", initial: false },
    },
    {
      id: "reviewed",
      label: "Relecture terminée",
      scope: "session",
      visibility: "public",
      value: { type: "boolean", initial: false },
    },
  ],
  actions: [
    {
      id: "open",
      label: "Demander un souvenir de live",
      roles: ["host"],
      phases: ["preparation"],
      parameters: [],
      conditions: [],
      effects: [],
      nextPhase: "write",
    },
    {
      id: "answer",
      label: "Envoyer ma réponse",
      roles: ["contributor"],
      phases: ["write"],
      parameters: [
        {
          id: "text",
          label: "Votre souvenir de live",
          value: { type: "text", maxLength: 120, initial: "" },
        },
      ],
      conditions: [{ variable: "submitted", equals: false }],
      effects: [
        {
          type: "set",
          variable: "answer",
          value: { from: "parameter", id: "text" },
        },
        {
          type: "set",
          variable: "submitted",
          value: { from: "literal", value: true },
        },
      ],
    },
    {
      id: "review",
      label: "Passer en relecture",
      roles: ["host"],
      phases: ["write"],
      parameters: [],
      conditions: [],
      effects: [],
      nextPhase: "review",
    },
    {
      id: "approve",
      label: "Confirmer la relecture",
      roles: ["reviewer"],
      phases: ["review"],
      parameters: [],
      conditions: [],
      effects: [
        {
          type: "set",
          variable: "reviewed",
          value: { from: "literal", value: true },
        },
      ],
    },
    {
      id: "reveal",
      confirmation: true,
      label: "Révéler les réponses",
      roles: ["host"],
      phases: ["review"],
      parameters: [],
      conditions: [{ variable: "reviewed", equals: true }],
      effects: [{ type: "reveal", variable: "answer" }],
      nextPhase: "revealed",
    },
  ],
});
export const gameExamples: readonly GameDefinition[] = [
  collectivePulse,
  answerBox,
];
