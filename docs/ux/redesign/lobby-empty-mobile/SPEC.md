# AFTER — Lobby GM Empty — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: 16288864668823604838
Screen title: AFTER — Lobby GM Empty — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Même salon vide, en une colonne avec des commandes tactiles et une préparation encore indisponible.

## Existing behaviour to preserve

Mêmes données, droits et commandes que le desktop. Aucun défilement horizontal. Le panneau de préparation occupe sa place dans le flux et devient sticky en bas ; safe areas conservées. Le compteur indique les inscrits, pas les personnes en ligne.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
