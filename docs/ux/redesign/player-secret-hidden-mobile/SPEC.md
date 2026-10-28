# AFTER — Player Secret Hidden — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 725808adc48c4cd4ac3c5c7ab8b2a31f
Screen title: AFTER — Player Secret Hidden — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Masquer son mot tout en conservant un accès explicite pour le revoir.

## Existing behaviour to preserve

Même projection privée et même commande locale de visibilité que le mot affiché. Quand le mot est masqué, la priorité va au tour oral ou au vote réellement en cours. La composition exacte est donc adaptée à la phase, sans ajouter un écran autonome sans fonction.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
