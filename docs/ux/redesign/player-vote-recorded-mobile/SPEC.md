# AFTER — Player Vote Submitted — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 16c09380cc8f47189db890d4b361ed7d
Screen title: AFTER — Player Vote Submitted — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Constater que son vote a été enregistré et attendre le résultat.

## Existing behaviour to preserve

Affichage seulement à réception de ballot.myVote dans la projection privée autoritaire, jamais à la simple fermeture du dialogue. Afficher la cible personnelle, voted/eligible et aucune cible des autres avant dépouillement. Le rechargement retrouve la même identité et le vote officiel. Aucun deuxième vote proposé.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
