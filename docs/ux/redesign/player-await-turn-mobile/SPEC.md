# AFTER — Player Waiting Turn — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 3349ae11d4284917b4bd606eb1ba114e
Screen title: AFTER — Player Waiting Turn — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Comprendre qui parle et attendre son tour.

## Existing behaviour to preserve

Le joueur courant et la progression viennent de play.turns, actualisés par SSE. Les indices restent oraux ; le joueur ne confirme pas lui-même son passage. Les anciennes parties sans tours structurés restent lisibles sans fabriquer de progression.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
