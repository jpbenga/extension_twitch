# AFTER — Player Round Result — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 147fe41a39e94204ac7ce52c94461224
Screen title: AFTER — Player Round Result — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Lire l’élimination publique et attendre la manche suivante.

## Existing behaviour to preserve

Utiliser uniquement le bulletin resolved, eliminated et le rôle publiquement révélé de ce joueur. Aucun mot d’un autre participant n’est révélé ici. Les décomptes sont accessibles dans Détail des votes. La prochaine manche reste une commande GM.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
