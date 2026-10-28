# AFTER — Player Vote — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: f75d1996ef274c2ba9f0c4e6a8eb4c11
Screen title: AFTER — Player Vote — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Choisir une cible autorisée puis demander confirmation de son vote.

## Existing behaviour to preserve

Les candidats et paramètres viennent de game.actions, non d’une liste de droits reconstruite côté client. Le joueur éliminé n’a pas de formulaire. Voter ne modifie pas encore la partie : le dialogue précède game.action. Le serveur contrôle phase, cible, unicité et version.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
