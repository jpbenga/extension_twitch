# AFTER — Join Player — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 6846916727190844173
Screen ID: 1bf51174c6304ee88082082e7700eb33
Screen title: AFTER — Join Player — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Choisir un nom reconnaissable et obtenir son propre accès joueur, sans compte.

## Existing behaviour to preserve

Nom 1–32 caractères, validation réelle et refus NAME_TAKEN. Le bouton Rejoindre la partie réutilise le POST d’inscription, les reçus d’idempotence et le stockage privé d’onglet. Une réponse incertaine garde exactement la même demande et interdit de changer son nom avant reprise. L’état nominal n’affiche pas artificiellement l’erreur dessinée dans la référence.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
