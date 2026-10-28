# AFTER — Stream Preview — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 17913833612662065697
Screen title: AFTER — Stream Preview — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Vérifier le cadrage du rendu synchronisé sur une scène fictive avant usage OBS.

## Existing behaviour to preserve

StreamPreview propose Scène fictive et Overlay seul, un BroadcastFeed public indépendant, les outils OBS et les capacités spectateur réelles. Le décor et le damier appartiennent au shell d’aperçu.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Conserver BroadcastFeed/BroadcastOverlay partagé avec OBS et le comparatif B7. Ne pas remplacer ce canvas par une capture statique ou un faux renderer. Ouvrir/copier seulement les URLs publiques /stream et /obs ; aucun jeton GM. Garder les outils secondaires en disclosures et identifier explicitement la scène fictive.

## Acceptance criteria

- Le changement de fond ne change ni le gameplay, ni la projection, ni la géométrie du renderer.
- Le canvas conserve son ratio16:9 et le même état durable que la source OBS.
- Aucun flux Twitch réel ou contrôle spectateur fictif n’est annoncé.
- Le thème privé de l’app ne modifie pas le thème public de la session.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 900 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
