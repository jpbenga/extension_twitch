# AFTER — Player Private Access — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: d721c7960c2246d48f7cbbef4ca47aa7
Screen title: AFTER — Player Private Access — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Retrouver le lien privé nécessaire à cette identité, sans exposer les autres joueurs.

## Existing behaviour to preserve

Affichage sans projection lors du refus d’accès, du stockage indisponible ou de la révocation. Pendant le chargement : état de connexion explicite. Les capacités restent dans les clés d’onglet par session et participant ; le fragment access est importé puis retiré de l’URL par le hook existant. Le navigateur n’invente ni récupération par compte ni nouvelle permission.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
