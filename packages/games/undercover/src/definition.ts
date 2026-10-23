import { gameDefinitionSchema } from "@extension-twitch/contracts/game-definition";
// Teaching variant only. Decisions and future alternatives: docs/OFFICIAL-GAMES-RULES.md.
export const undercoverDefinition = gameDefinitionSchema.parse({
  schemaVersion: 3,
  engineVersion: 3,
  id: "undercover",
  version: "0.1.0",
  title: "Undercover · variante démo",
  description:
    "Mots privés, discussion, vote unique et élimination. Règles de démonstration à valider ensemble.",
  configuration: [
    {
      id: "undercover-count",
      label: "Nombre d’Undercover",
      visibility: "gm",
      value: { type: "integer", min: 1, max: 5, initial: 1 },
    },
    {
      id: "civil-word",
      label: "Mot des civils",
      visibility: "gm",
      value: { type: "text", maxLength: 80, initial: "Phare" },
    },
    {
      id: "undercover-word",
      label: "Mot des Undercover",
      visibility: "gm",
      value: { type: "text", maxLength: 80, initial: "Fusée" },
    },
    {
      id: "round-limit",
      label: "Maximum de tours",
      visibility: "public",
      value: { type: "integer", min: 1, max: 30, initial: 10 },
    },
  ],
  roles: [
    { id: "host", label: "Game Master", base: "gm" },
    { id: "civil", label: "Civil", base: "player" },
    { id: "undercover", label: "Undercover", base: "player" },
    { id: "audience", label: "Spectateur", base: "spectator" },
  ],
  defaultPlayerRole: "civil",
  variables: [
    {
      id: "secret-word",
      label: "Votre mot secret",
      scope: "participant",
      visibility: "owner",
      value: { type: "text", maxLength: 80, initial: "" },
    },
  ],
  phases: [
    {
      id: "preparation",
      label: "Préparation",
      description: "Vérifiez les joueurs, puis distribuez les mots secrets.",
    },
    {
      id: "discussion",
      label: "Discussion",
      description:
        "Décrivez votre mot sans le prononcer, puis cherchez les intrus.",
    },
    {
      id: "vote",
      label: "Vote",
      description:
        "Chaque joueur actif choisit un autre joueur. Le vote ne peut plus être modifié.",
    },
    {
      id: "result",
      label: "Résultat du tour",
      description:
        "Consultez le décompte et l’élimination, puis commencez un nouveau tour.",
    },
    {
      id: "finished",
      label: "Partie terminée",
      description:
        "Le résultat et les informations secrètes sont maintenant révélés.",
    },
  ],
  initialPhase: "preparation",
  actions: [
    {
      id: "deal",
      label: "Distribuer les mots et commencer",
      roles: ["host"],
      phases: ["preparation"],
      parameters: [],
      conditions: [],
      effects: [],
      operations: [{ type: "deal", deal: "words" }],
      nextPhase: "discussion",
    },
    {
      id: "open-vote",
      label: "Ouvrir les votes",
      roles: ["host"],
      phases: ["discussion"],
      parameters: [],
      conditions: [],
      effects: [],
      operations: [{ type: "ballot.open", ballot: "elimination" }],
      nextPhase: "vote",
    },
    {
      id: "vote",
      label: "Confirmer mon vote",
      roles: ["civil", "undercover"],
      phases: ["vote"],
      parameters: [
        {
          id: "target",
          label: "Qui souhaitez-vous éliminer ?",
          value: { type: "text", maxLength: 36, initial: "" },
        },
      ],
      conditions: [],
      effects: [],
      operations: [
        {
          type: "ballot.cast",
          ballot: "elimination",
          targetParameter: "target",
        },
      ],
    },
    {
      id: "resolve",
      label: "Révéler le résultat du vote",
      roles: ["host"],
      phases: ["vote"],
      parameters: [],
      conditions: [],
      effects: [],
      operations: [{ type: "ballot.resolve", ballot: "elimination" }],
      confirmation: true,
    },
    {
      id: "next",
      label: "Commencer le tour suivant",
      roles: ["host"],
      phases: ["result"],
      parameters: [],
      conditions: [],
      effects: [],
      operations: [{ type: "round.next", phase: "discussion" }],
    },
  ],
  mechanics: {
    minPlayers: 3,
    maxPlayers: 12,
    roundLimitConfiguration: "round-limit",
    drawLabel: "Partie nulle · limite de tours atteinte",
    drawRevealVariables: ["secret-word"],
    finishedPhase: "finished",
    deals: [
      {
        id: "words",
        majorityRole: "civil",
        minorityRole: "undercover",
        minorityCountConfiguration: "undercover-count",
        privateVariable: "secret-word",
        majorityValueConfiguration: "civil-word",
        minorityValueConfiguration: "undercover-word",
        concealRoles: true,
      },
    ],
    ballots: [
      {
        id: "elimination",
        resolution: "eliminate",
        allowSelfVote: false,
        requireAll: true,
        allowGmProxy: true,
        revealEliminatedRole: true,
        resultPhase: "result",
      },
    ],
    endings: [
      {
        id: "civils-win",
        label: "Victoire des civils",
        leftRole: "undercover",
        comparison: "eq",
        right: { count: 0 },
        revealVariables: ["secret-word"],
      },
      {
        id: "undercover-win",
        label: "Victoire des Undercover",
        leftRole: "undercover",
        comparison: "gte",
        right: { role: "civil" },
        revealVariables: ["secret-word"],
      },
    ],
  },
  assets: [],
  scenes: [],
});
