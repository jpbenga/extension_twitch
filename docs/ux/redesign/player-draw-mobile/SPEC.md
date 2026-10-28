# AFTER — Player Draw — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: ae43a10e39e148cda52565235f80429d
Screen title: AFTER — Player Draw — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Afficher le nul réel causé par la limite de manches.

## Existing behaviour to preserve

Le moteur publie outcome.id = round-limit ; ne pas supposer un identifiant draw. Afficher le résultat global et les révélations finales fournies. Ce n’est ni une victoire ni une défaite personnelle. Aucun passage automatique à une nouvelle partie.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
