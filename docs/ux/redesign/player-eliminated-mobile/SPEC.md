# AFTER — Player Eliminated — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 2c6d322e8a0547ff9385d0960b494ce9
Screen title: AFTER — Player Eliminated — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Suivre la partie après élimination sans récupérer le droit de vote.

## Existing behaviour to preserve

État déterminé par play.roster.active et les actions projetées. Le camp apparaît seulement si le serveur a fourni roster.role. Le joueur conserve son propre mot et son accès privé ; aucun accès aux secrets des survivants. Résultat final et victoire de camp peuvent encore concerner un joueur éliminé.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
