# AFTER — Invitation Unavailable — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: 4dafcc64f8c14d78b681dd92a62339cb
Screen title: AFTER — Invitation Unavailable — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Expliquer une invitation inconnue ou renouvelée et permettre de saisir une autre invitation.

## Existing behaviour to preserve

INVITATION_NOT_FOUND est connu après la tentative d’inscription existante, pas via une nouvelle API de prélecture. Le message ne doit pas apparaître pour une simple erreur réseau, un nom déjà pris ou des inscriptions fermées. Liens /join et /. Aucun accès GM ou identité joueur créé artificiellement.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
