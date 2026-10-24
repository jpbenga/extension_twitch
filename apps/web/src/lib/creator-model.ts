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
  const m = definition.mechanics;
  if (
    m &&
    ((kind === "variable" &&
      (m.deals.some((d) => d.privateVariable === id) ||
        m.drawRevealVariables.includes(id) ||
        m.endings.some((e) => e.revealVariables.includes(id)))) ||
      (kind === "role" &&
        (m.deals.some((d) => d.majorityRole === id || d.minorityRole === id) ||
          m.endings.some(
            (e) =>
              e.leftRole === id || ("role" in e.right && e.right.role === id),
          ))) ||
      (kind === "phase" &&
        (m.finishedPhase === id ||
          m.turns?.phase === id ||
          m.ballots.some((b) => b.resultPhase === id) ||
          definition.actions.some((a) =>
            a.operations?.some(
              (op) => op.type === "round.next" && op.phase === id,
            ),
          ))))
  )
    found.push("Règles de partie");
  return found;
}
const messages: Record<string, string> = {
  "Invalid turn sequence":
    "Choisissez une étape existante et un nombre public de tours d’indices entre 1 et 5.",
  "Missing turn advance action":
    "Ajoutez une action GM pour confirmer le passage de parole dans l’étape d’indices.",
  "Missing turn sequence":
    "Ce vote attend des tours de parole qui ne sont pas configurés.",
  "Invalid turn action":
    "La confirmation d’un indice doit rester une action GM dans l’étape des tours de parole.",
  "Unknown ending phase":
    "Choisissez une étape de fin existante dans les règles de partie.",
  "Mechanics require v3":
    "La distribution et le vote demandent le format de règles récent. Conservez le format du modèle lorsque vous le personnalisez.",
  "Invalid player limits":
    "Le nombre minimal de joueurs doit être inférieur ou égal au maximum (de 3 à 12).",
  "Invalid deal roles":
    "Les camps de la distribution doivent être deux rôles joueurs distincts, dont le rôle attribué au départ.",
  "Invalid private distribution":
    "La distribution doit relier deux mots privés du GM à une donnée personnelle privée. Vérifiez Distribution et vote.",
  "Invalid round configuration":
    "Le nombre de tours doit utiliser un réglage entier compris entre 1 et 30.",
  "Invalid distribution count":
    "Le nombre de rôles minoritaires doit utiliser un réglage entier positif compatible avec l’effectif.",
  "Management operation requires GM":
    "Cette opération de gestion doit être réservée au Game Master dans Actions.",
  "Ballot requires player target":
    "Un vote demande un rôle joueur et un champ de choix de joueur valide.",
  "Conflicting transition":
    "La résolution choisit elle-même l’étape suivante. Retirez l’autre changement d’étape dans cette action.",
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
    "Dans Données ou dans un champ d’action, la valeur de départ doit respecter le type, le minimum et le maximum choisis.",
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
  "Unknown phase":
    "Une action utilise une étape qui n’existe plus. Ouvrez Actions et choisissez une étape existante.",
  "Unknown effect variable":
    "Une règle utilise une donnée qui n’existe plus. Ouvrez Actions pour choisir une autre donnée dans les conséquences.",
  "Invalid literal":
    "La valeur de l’effet doit respecter les bornes de la variable.",
  "Unknown or incompatible value source":
    "La source de l’effet doit exister et avoir le type attendu.",
  "Participant effect requires self":
    "Une donnée individuelle peut être modifiée par un joueur pour lui-même. Dans Actions, réservez cette conséquence aux rôles joueurs.",
  "Participant condition requires self":
    "Une condition sur la donnée personnelle d’un joueur doit être réservée aux rôles joueurs dans Actions.",
  "Hidden variable mutation oracle":
    "Cette information est réservée au Game Master. Dans Actions, réservez sa modification au Game Master.",
  "Reveal requires GM": "La révélation doit être réservée au GM.",
  "Owner variable must belong to participant":
    "Dans Données, choisissez Chaque participant pour une information visible uniquement par ce joueur et le Game Master.",
  "Increment requires integer":
    "Pour ajouter ou retirer une quantité, choisissez une donnée de type Nombre entier dans les conséquences de l’action.",
  "Definition too large":
    "Ce jeu contient trop de règles ou de textes pour cette version du Studio. Raccourcissez des descriptions ou simplifiez une action.",
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
    for (const action of d.actions) {
      if (!action.phases.some((p) => seen.has(p))) continue;
      const targets = [
        ...(action.nextPhase ? [action.nextPhase] : []),
        ...(action.operations ?? []).flatMap((op) =>
          op.type === "round.next"
            ? [op.phase]
            : op.type === "ballot.resolve"
              ? [
                  d.mechanics?.ballots.find((b) => b.id === op.ballot)
                    ?.resultPhase,
                  d.mechanics?.finishedPhase,
                ].filter((p): p is string => !!p)
              : [],
        ),
      ];
      for (const target of targets)
        if (!seen.has(target)) {
          seen.add(target);
          changed = true;
        }
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
