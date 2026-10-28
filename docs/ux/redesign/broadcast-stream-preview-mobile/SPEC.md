# AFTER — Stream Preview — Mobile — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 16837080339606998775
Screen title: AFTER — Stream Preview — Mobile — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Contrôler le cadrage 16:9 et retrouver les outils OBS depuis un téléphone.

## Existing behaviour to preserve

Même StreamPreview que sur ordinateur : scène fictive/overlay seul, outils OBS repliables et URLs publiques sans droit de commande.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Adapter le shell à une main avec des cibles44px minimum et garder la miniature16:9 proportionnelle. Autoriser le scroll vertical pour les outils. Ne pas agrandir artificiellement la miniature au prix de son cadrage ; le contrôle détaillé de typographie se fait aussi en1920×1080.

## Acceptance criteria

- À390×844 le canvas reste16:9, sans scroll horizontal.
- Les commandes de fond et les disclosures sont utilisables avec des cibles44px minimum.
- Ouvrir/copier OBS utilise une URL publique sans capacité privée.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-mobile-390.png).
- Cible de capture de l’application : 390 × 844 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
