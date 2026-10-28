# AFTER — Player Lobby Waiting — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: 37b444362513422d99a89dd8e81821d3
Screen title: AFTER — Player Lobby Waiting — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Attendre la préparation du GM et signaler facultativement sa disponibilité.

## Existing behaviour to preserve

participant.ready est une vraie commande serveur et reste réversible avant préparation. Identité et liste viennent de la projection du joueur. Aucun mot n’est affiché avant distribution. Une partie préparée mais non distribuée possède un état d’attente distinct sans bouton de disponibilité. Le lien privé reste accessible pour récupération.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
