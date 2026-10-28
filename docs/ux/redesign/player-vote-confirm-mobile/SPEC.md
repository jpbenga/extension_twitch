# AFTER — Player Vote Confirmation — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 880dbcf4460349448a85f5c806b7b8a2
Screen title: AFTER — Player Vote Confirmation — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Confirmer un vote définitif ou l’annuler sans enregistrer de vote.

## Existing behaviour to preserve

Dialogue personnalisé réutilisant FeedbackProvider : focus initial sur Annuler, piégeage/restauration du focus, Échap, état asynchrone, refus et double validation protégés. Le style Stitch est une variante limitée à ce dialogue ; les confirmations GM restent inchangées. La commande validée est game.action avec les paramètres déclarés par le moteur.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
