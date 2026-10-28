# AFTER — Player Secret — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 549b058bc3b94160aa9ac6f86e355854
Screen title: AFTER — Player Secret — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Consulter uniquement son mot personnel pendant la partie.

## Existing behaviour to preserve

Le mot est sélectionné dans game.values pour le participant courant et secret-word. Aucun mot d’un autre joueur n’est recherché dans une projection GM. Le camp reste inconnu avant la révélation serveur. Masquer retire le texte du DOM visible ; le contrôle est local et ne modifie aucune règle.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
