# AFTER — Player Defeat — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 026dfa9c05ba496cbf836f2ec89d4c57
Screen title: AFTER — Player Defeat — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Afficher une défaite personnelle et le résultat global sans modifier les règles de victoire.

## Existing behaviour to preserve

Même calcul de présentation que la victoire, à partir de outcome et du rôle révélé. Le résultat global ne change pas. Si le rôle manque dans une ancienne projection, rester neutre avec Partie terminée. Pas de commande joueur de rejeu.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
