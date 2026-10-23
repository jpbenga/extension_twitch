import {
  gameDefinitionSchema,
  type GameDefinition,
  type Expression,
} from "@extension-twitch/contracts/game-definition";

export function nextId(prefix: string, items: { id: string }[]) {
  let n = 1;
  while (items.some((item) => item.id === `${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}
export function references(
  definition: GameDefinition,
  kind: "role" | "variable" | "phase",
  id: string,
): string[] {
  const found: string[] = [];
  const expressionUses = (value: Expression): boolean =>
    value.kind === "operator"
      ? value.args.some(expressionUses)
      : value.kind === "variable" && value.id === id;
  if (kind === "role" && definition.defaultPlayerRole === id)
    found.push("Rôle joueur par défaut");
  if (kind === "phase" && definition.initialPhase === id)
    found.push("Phase initiale");
  for (const a of definition.actions) {
    if (
      (kind === "role" && a.roles.includes(id)) ||
      (kind === "phase" && (a.phases.includes(id) || a.nextPhase === id)) ||
      (kind === "variable" &&
        (a.conditions.some((c) => c.variable === id) ||
          (a.guard && expressionUses(a.guard)) ||
          a.effects.some(
            (e) =>
              e.variable === id ||
              (e.type !== "reveal" &&
                e.value.from === "expression" &&
                expressionUses(e.value.expression)),
          )))
    )
      found.push(`Action « ${a.label} »`);
  }
  for (const scene of definition.scenes)
    if (
      scene.widgets.some((w) =>
        kind === "phase"
          ? w.phases.includes(id)
          : kind === "variable" &&
            w.source.type === "variable" &&
            w.source.id === id,
      )
    )
      found.push(`Scène « ${scene.id} »`);
  return found;
}
const messages: Record<string, string> = {
  "Incompatible engine version":
    "Les versions de schéma et de moteur doivent correspondre.",
  "Exactly one GM and spectator required":
    "Conservez exactement un rôle GM et un rôle spectateur.",
  "Invalid default player role":
    "Le rôle joueur par défaut doit exister et être un rôle joueur.",
  "Unknown initial phase": "La phase initiale doit exister.",
  "Invalid condition":
    "Une égalité référence une variable absente ou une valeur incompatible.",
  "Increment requires number":
    "L’incrément doit être un nombre entier, éventuellement négatif.",
  "Private configuration cannot be copied":
    "Un paramètre privé ne peut pas être copié vers une variable publique.",
  "Widget outside canvas": "Un widget dépasse les dimensions de sa scène.",
  "Unknown widget phase": "Un widget référence une phase absente.",
  "Unknown widget source":
    "Un widget référence une variable ou un asset absent.",
  "Invalid default or bounds":
    "La valeur initiale doit respecter le type et les bornes.",
  "Duplicate identifier":
    "Chaque identifiant doit être unique dans sa catégorie.",
  "Invalid guard expression":
    "Condition : vérifiez les types, références et permissions de lecture. Les paramètres ne sont pas lisibles ici.",
  "Guard must be boolean": "La condition doit produire vrai ou faux.",
  "Invalid effect expression":
    "Effet : vérifiez les types, références et droits de lecture.",
  "Expression type or private flow mismatch":
    "L’effet mélange des types ou rend publique une donnée privée.",
  "Private condition oracle":
    "Un rôle joueur ne peut pas lire une variable réservée au GM.",
  "Unknown or read-only action role":
    "Choisissez des rôles existants, hors spectateur (lecture seule).",
  "Unknown phase": "Une action référence une phase inexistante.",
  "Unknown effect variable": "Un effet référence une variable inexistante.",
  "Invalid literal":
    "La valeur de l’effet doit respecter les bornes de la variable.",
  "Unknown or incompatible value source":
    "La source de l’effet doit exister et avoir le type attendu.",
  "Participant effect requires self":
    "Une variable individuelle peut être modifiée uniquement par une action joueur, pour lui-même.",
  "Participant condition requires self":
    "Une condition individuelle doit être réservée aux rôles joueurs.",
  "Hidden variable mutation oracle":
    "Une variable GM peut être modifiée uniquement par une action GM.",
  "Reveal requires GM": "La révélation doit être réservée au GM.",
  "Owner variable must belong to participant":
    "La visibilité personnelle nécessite une portée par participant.",
  "Increment requires integer":
    "Seules les variables numériques peuvent être augmentées.",
  "Definition too large":
    "La définition dépasse la limite de 6 000 octets. Réduisez ses éléments.",
  "Expressions require v2":
    "Activez explicitement le langage v2 pour utiliser des expressions.",
};
export function definitionErrors(value: unknown): string[] {
  const result = gameDefinitionSchema.safeParse(value);
  return result.success
    ? []
    : [
        ...new Set(
          result.error.issues.map(
            (issue) =>
              messages[issue.message] ??
              `${issue.path.join(" › ") || "Définition"} : ${issue.code === "invalid_type" ? "type de valeur incorrect" : issue.message}`,
          ),
        ),
      ];
}
export function unreachablePhases(d: GameDefinition) {
  const seen = new Set([d.initialPhase]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of d.actions)
      if (
        a.nextPhase &&
        a.phases.some((p) => seen.has(p)) &&
        !seen.has(a.nextPhase)
      ) {
        seen.add(a.nextPhase);
        changed = true;
      }
  }
  return d.phases.filter((p) => !seen.has(p.id));
}
export function comparison(
  operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte",
  a: Expression,
  b: Expression,
): Expression {
  if (operator === "ne")
    return {
      kind: "operator",
      operator: "not",
      args: [{ kind: "operator", operator: "eq", args: [a, b] }],
    };
  if (operator === "gt")
    return { kind: "operator", operator: "lt", args: [b, a] };
  if (operator === "lte")
    return { kind: "operator", operator: "gte", args: [b, a] };
  return { kind: "operator", operator, args: [a, b] };
}
