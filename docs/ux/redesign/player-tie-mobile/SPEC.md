# AFTER — Player Tied Vote — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 12bbffa4198e4aba81425eaacf35111a
Screen title: AFTER — Player Tied Vote — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Comprendre qu’une égalité n’élimine personne et attendre la suite.

## Existing behaviour to preserve

Égalité issue de ballot.tied, sans revote ou départage inventé. Les décomptes sont ceux du serveur. Si la limite de manches produit déjà un nul, afficher le résultat final plutôt qu’une attente fictive de manche suivante.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
