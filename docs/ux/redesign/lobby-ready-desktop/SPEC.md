# AFTER — Lobby GM Ready — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: 0566b56083b44eb3ab38ffad73e3b636
Screen title: AFTER — Lobby GM Ready — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Vérifier les inscrits puis préparer la partie. La préparation devient l’action dominante dès que l’effectif est valide.

## Existing behaviour to preserve

La validité utilise preparedGame.minimumPlayers/maximumPlayers, issus de la répartition serveur. Le statut Prêt est facultatif ; les hors ligne restent inscrits. game.use-prepared ferme les inscriptions et fige l’effectif, sans distribuer les mots. Le résumé affiche clueRounds depuis les métadonnées GM, jamais une valeur fictive ou les mots secrets.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
