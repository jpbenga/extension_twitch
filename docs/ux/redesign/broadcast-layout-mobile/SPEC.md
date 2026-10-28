# AFTER — Broadcast Layout Editor — Mobile — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 14317748143534499916
Screen title: AFTER — Broadcast Layout Editor — Mobile — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Ajuster sur téléphone la même disposition avec des champs tactiles précis.

## Existing behaviour to preserve

Même schéma, brouillon, sauvegarde et renderer public que l’éditeur desktop. Les champs numériques et bornes offrent une alternative aux gestes sur miniature.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Prioriser la sélection de bloc et les champs tactiles plutôt qu’exiger le drag sur un petit canvas. Conserver toutes les capacités existantes sans densité technique inutile. Inputs16px minimum, cibles44px minimum, état non enregistré explicite et action principale accessible. Ne pas créer un éditeur de scènes.

## Acceptance criteria

- À390×844 aucun débordement horizontal ; champs16px minimum et cibles44px minimum.
- Les bornes sont appliquées à chaque édition et les sept widgets ne peuvent être retirés.
- La sauvegarde utilise le même overlay.configure et met à jour OBS sans réinitialiser la partie.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-mobile-390.png).
- Cible de capture de l’application : 390 × 844 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
