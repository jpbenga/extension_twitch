# AFTER — GM Final — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 15914122444161597271
Screen title: AFTER — GM Final — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Présenter le résultat global final et permettre un rejeu confirmé avec les mêmes accès.

## Existing behaviour to preserve

Victoire Civils, victoire Undercover ou nul à la limite des manches sont calculés par le serveur. Les révélations finales autorisées deviennent disponibles. game.restart efface votes, éliminations et résultats tout en conservant participants et accès.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Adapter le même patron aux trois résultats, sans qualifier le GM de gagnant/perdant ni inventer score, XP ou nouvelle règle. Le bouton de rejeu ouvre sa confirmation dédiée. La manche suivante n’est plus disponible. Garder les états finaux conformes à la projection. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- Vainqueur ou nul vient du serveur et toutes les révélations restent bornées à la projection.
- Le GM reste neutre, sans camp personnel.
- Rejouer ouvre un dialogue et conserve les accès après confirmation.
- Aucun CTA de manche suivante n’est offert en état terminé.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
