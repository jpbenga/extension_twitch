# AFTER — Lobby GM Ready — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: 231534bd93ae4a00b799377d3bab0dbb
Screen title: AFTER — Lobby GM Ready — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Même salon valide, avec les participants en priorité et une commande Préparer la partie accessible au pouce.

## Existing behaviour to preserve

Mêmes règles et droits que le desktop. La présence vient du flux SSE ; elle est distincte de ready. Les disclosures conservent retrait confirmé, ouverture/fermeture des invitations, récupération GM privée et source OBS. Pas de nouvelle règle de quorum ni de changement du moteur.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
