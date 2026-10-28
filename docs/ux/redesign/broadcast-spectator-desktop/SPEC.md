# AFTER — Spectator Discussion — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 6480344334821852281
Screen title: AFTER — Spectator Discussion — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Permettre de suivre la partie sur le plateau public classique responsive.

## Existing behaviour to preserve

La route /sessions/:id/public utilise PublicSession, distinct de la composition BroadcastOverlay ; elle lit un état public et conserve les anciens liens.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Refondre la présentation PublicSession et les résumés partagés existants sans substituer le renderer OBS au plateau classique. Garder les informations longues consultables dans cette page responsive, la même projection publique et le thème public de session. Aucun contrôle de jeu ou faux vote Twitch.

## Acceptance criteria

- La route publique existante reste accessible sans capacité GM.
- Les phases préparation, discussion, vote et fin conservent les mêmes données publiques et protections de secrets.
- Les noms longs et douze participants restent lisibles sans débordement horizontal.
- Les libellés ne prétendent pas être connectés à Twitch.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 900 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
