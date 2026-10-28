# AFTER — Lobby GM Empty — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: db794d2118ad4af2a111e674ae322ed8
Screen title: AFTER — Lobby GM Empty — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Inviter les participants dans un salon Undercover encore vide. Le lien d’invitation est l’action dominante.

## Existing behaviour to preserve

Vue GM authentifiée, sans publicGame. Invitation et code proviennent de joinUrl/invitationCode. Copier conserve le repli HTTP LAN existant ; Partager apparaît seulement si navigator.share est disponible. Préparer reste désactivé tant que l’effectif ne respecte pas les minimum/maximum serveur. Aucun joueur fictif n’est ajouté par cette page.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
