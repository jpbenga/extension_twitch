import type {
  ActionDefinition,
  Expression,
  GameDefinition,
} from "@extension-twitch/contracts/game-definition";
const names = {
  eq: "est égal à",
  lt: "est inférieur à",
  gte: "est supérieur ou égal à",
  add: "plus",
  subtract: "moins",
  multiply: "multiplié par",
  and: "ET",
  or: "OU",
  not: "NON",
};
export function describeExpression(
  e: Expression,
  d: GameDefinition,
  a: ActionDefinition,
): string {
  if (e.kind === "literal")
    return typeof e.value === "boolean"
      ? e.value
        ? "oui"
        : "non"
      : typeof e.value === "string"
        ? `« ${e.value} »`
        : String(e.value);
  if (e.kind !== "operator") {
    const fields =
      e.kind === "variable"
        ? d.variables
        : e.kind === "configuration"
          ? d.configuration
          : a.parameters;
    return (
      fields.find((f) => f.id === e.id)?.label ?? "une information manquante"
    );
  }
  if (e.operator === "not")
    return `l’inverse de (${e.args[0] ? describeExpression(e.args[0], d, a) : "condition manquante"})`;
  return e.args
    .map((v) =>
      v.kind === "operator"
        ? `(${describeExpression(v, d, a)})`
        : describeExpression(v, d, a),
    )
    .join(` ${names[e.operator]} `);
}
export function describeAction(a: ActionDefinition, d: GameDefinition) {
  const roles = a.roles
    .map((id) => d.roles.find((r) => r.id === id)?.label ?? "rôle manquant")
    .join(" ou ");
  const phases = a.phases
    .map((id) => d.phases.find((p) => p.id === id)?.label ?? "étape manquante")
    .join(" ou ");
  const conditions = [
    ...a.conditions.map(
      (c) =>
        `${d.variables.find((v) => v.id === c.variable)?.label ?? "Une donnée manquante"} vaut ${c.equals === false ? "non" : c.equals === true ? "oui" : c.equals}`,
    ),
    ...(a.guard ? [describeExpression(a.guard, d, a)] : []),
  ];
  const effects = a.effects.map((e) => {
    const target =
      d.variables.find((v) => v.id === e.variable)?.label ??
      "une donnée manquante";
    if (e.type === "reveal") return `révéler ${target} au public`;
    const value = e.value;
    const source =
      value.from === "literal"
        ? String(value.value)
        : value.from === "expression"
          ? describeExpression(value.expression, d, a)
          : value.from === "parameter"
            ? (a.parameters.find((p) => p.id === value.id)?.label ??
              "une saisie manquante")
            : (d.configuration.find((p) => p.id === value.id)?.label ??
              "un réglage manquant");
    return e.type === "increment"
      ? `ajouter ${source} à ${target}`
      : `remplacer ${target} par ${source}`;
  });
  return `${roles || "Aucun rôle"} peut utiliser « ${a.label} » pendant ${phases || "aucune étape"}${conditions.length ? `, si ${conditions.join(" et ")}` : ""}. ${effects.length ? `Ensuite : ${effects.join(", puis ")}.` : "Aucune donnée n’est modifiée."}${a.nextPhase ? ` Passer à ${d.phases.find((p) => p.id === a.nextPhase)?.label ?? "une étape manquante"}.` : ""}`;
}
export function expressionReferences(
  e: Expression,
  kind: "variable" | "parameter",
  id: string,
): boolean {
  return e.kind === "operator"
    ? e.args.some((a) => expressionReferences(a, kind, id))
    : e.kind === kind && e.id === id;
}

/** Readable comparison without altering either copy or interpreting its rules. */
export function ruleDifferences(local: GameDefinition, remote: GameDefinition) {
  const differences: string[] = [];
  const changed = (a: unknown, b: unknown) =>
    JSON.stringify(a) !== JSON.stringify(b);
  for (const r of remote.roles) {
    const l = local.roles.find((old) => old.id === r.id);
    if (changed(l, r))
      differences.push(
        `Rôle : ${l?.label ?? "absent ici"} → ${r.label} dans la copie enregistrée.`,
      );
  }
  for (const v of remote.variables) {
    const l = local.variables.find((old) => old.id === v.id);
    if (changed(l, v))
      differences.push(
        `Donnée ${v.label} : ${l ? "réglages différents" : "absente ici"}. Valeur de départ enregistrée : ${String(v.value.initial)}${v.value.type === "integer" ? `, limites ${v.value.min} à ${v.value.max}` : ""}.`,
      );
  }
  for (const a of remote.actions) {
    const l = local.actions.find((old) => old.id === a.id);
    if (changed(l, a)) {
      if (l) differences.push(`Sur cet appareil : ${describeAction(l, local)}`);
      differences.push(`Copie enregistrée : ${describeAction(a, remote)}`);
    }
  }
  for (const l of [...local.roles, ...local.variables, ...local.actions]) {
    if (
      ![...remote.roles, ...remote.variables, ...remote.actions].some(
        (r) => r.id === l.id,
      )
    )
      differences.push(`« ${l.label} » existe uniquement sur cet appareil.`);
  }
  if (
    changed(local.phases, remote.phases) ||
    local.initialPhase !== remote.initialPhase
  )
    differences.push(
      "Les étapes de la partie diffèrent. Consultez le détail avant de choisir une copie.",
    );
  if (
    changed(local.scenes, remote.scenes) ||
    changed(local.assets, remote.assets) ||
    changed(local.configuration, remote.configuration)
  )
    differences.push(
      "La présentation, les ressources ou les réglages de partie diffèrent. Consultez le détail avant de choisir une copie.",
    );
  return differences;
}
