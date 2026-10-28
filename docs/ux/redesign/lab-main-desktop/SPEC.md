# AFTER — Lab Main — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 8710675424358674545
Screen ID: 64f7cbad24324dc9b84e7f38d623e521
Screen title: AFTER — Lab Main — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Tester une partie réelle depuis une seule perspective privée, avec identité visible et action de phase dominante.

## Existing behaviour to preserve

CreatorLaboratory conserve le point de vue par essai en sessionStorage. LabView utilise useSession avec la véritable audience GM, joueur inscrit ou public et monte GamePanel pour les projections privées. Les essais rapides ont de vrais joueurs de démonstration et des accès distincts.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Refondre le shell privé QA autour des panneaux B5/B4 existants. Garder les outils et accès secondaires repliés. Ne jamais partager le laboratoire comme accès participant, monter toutes les perspectives privées simultanément ou inventer des commandes. Garder les reconnections et reprises dans le panneau actif.

## Acceptance criteria

- Le contexte Laboratoire privé / QA et l’identité sélectionnée sont immédiatement visibles.
- Un changement de perspective démonte l’ancienne projection privée et utilise les permissions de la nouvelle identité.
- L’action de phase correspond aux commandes existantes ; les outils QA restent secondaires.
- Les petits textes utiles atteignent au moins 4,5:1 et la navigation clavier reste utilisable.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-7-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
