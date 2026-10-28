# AFTER — Lab Compare — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 8710675424358674545
Screen ID: 6aba92598d7347de831c725b9082e5ae
Screen title: AFTER — Lab Compare — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Comparer le compagnon privé du joueur sélectionné à l’émission publique de la même partie.

## Existing behaviour to preserve

PublicMirror monte un BroadcastFeed indépendant avec scene. Celui-ci consomme useSession(id, public) et BroadcastOverlay ; il ne dérive pas la projection publique d’un état GM ou joueur. Le comparatif ne monte qu’une perspective privée sélectionnée.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Raccorder la colonne émission au véritable renderer B6 à sept widgets configurables, sans reproduction statique ou panneau simplifié issu du HTML. Le thème émission vient de la projection de session, indépendamment de la préférence privée. Conserver la mention scène fictive et aucun flux Twitch.

## Acceptance criteria

- Les sept widgets et les dispositions B6 sont rendus par le même BroadcastOverlay que preview/OBS.
- Le mot privé n’apparaît jamais dans la colonne publique avant la révélation autorisée.
- La projection publique est obtenue séparément et reste en lecture seule.
- Le choix d’apparence privée ne modifie ni le thème public ni le layout de la session.
- Les petits textes secondaires atteignent au moins 4,5:1 et les noms longs restent lisibles.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-7-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
