# Accueil — espace animateur et thème

**APPROVED.** L’utilisateur a validé visuellement les huit références finales le 29 octobre 2026. Aucune nouvelle validation humaine ni connexion Stitch n’est nécessaire pour commencer l’intégration.

## Lire en premier

1. [`APPROVAL.json`](APPROVAL.json) — registre de la validation humaine.
2. [`manifest.json`](manifest.json) — Screen IDs, liens Stitch, rôles, chemins et empreintes.
3. [`SPEC.md`](SPEC.md) — comportement à implémenter et critères d’acceptation.
4. [`HANDOFF.md`](HANDOFF.md) — raccordements aux routes, permissions et données existantes.
5. [`approved.html`](approved.html) — prototype responsive interactif ; référence de comportement, pas code React à copier.

Les huit captures finales se trouvent sous [`screens/`](screens/). La capture antérieure est conservée sous [`reference/before.png`](reference/before.png). La génération Stitch `0a4ed460215a4a298e57455110069fea` est explicitement remplacée et n’appartient pas au lot approuvé.

## Intention

L’accueil reste direct pour le joueur et la préparation Undercover, tout en donnant au Game Master un accès permanent et compact à ses préparations, à sa régie autorisée et à la diffusion. Il ne devient ni un dashboard SaaS, ni un espace compte, ni un nouveau Studio.

Le contrôle `Apparence` devient `Thème`. Une sélection s’applique immédiatement puis ferme le panneau, y compris lorsque l’utilisateur choisit le thème déjà actif. Le thème privé de l’application reste indépendant du thème public OBS.

## Limites de cet export

Cet export ne modifie aucun composant, aucune route, aucune règle métier, aucun stockage et aucune permission. Les valeurs du prototype sont des fixtures. L’intégration doit réutiliser le modèle local de séries Undercover, la validation serveur de l’accès GM et les trois thèmes existants.

`HOME_HOST_ACCESS_STATUS: APPROVED`
