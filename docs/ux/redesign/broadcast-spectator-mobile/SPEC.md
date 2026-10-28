# AFTER — Spectator Discussion — Mobile — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 14539924185403909224
Screen title: AFTER — Spectator Discussion — Mobile — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Suivre sur téléphone le joueur courant et les informations publiques essentielles.

## Existing behaviour to preserve

Même PublicSession et mêmes données publiques que sur ordinateur ; les joueurs et le résumé se réorganisent de manière responsive.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Décliner la référence desktop en une colonne et garder les noms et informations complètes lisibles. Aucun petit contrôle de jeu ajouté ; le spectateur reste lecteur. Conserver les autres phases dans le même patron public.

## Acceptance criteria

- À390×844 aucune barre horizontale ni texte essentiel coupé.
- Le joueur courant, la phase et la progression restent identifiables avec un nom de32 caractères.
- Aucune donnée ni commande de joueur/GM n’est présente.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-mobile-390.png).
- Cible de capture de l’application : 390 × 844 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
