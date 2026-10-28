# AFTER — Lab Main — Mobile — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 8710675424358674545
Screen ID: 20b629654f334e3ab4f56ab000ccedaa
Screen title: AFTER — Lab Main — Mobile — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Utiliser le même laboratoire sur téléphone, avec une perspective unique et des actions accessibles à une main.

## Existing behaviour to preserve

La vue responsive conserve le sélecteur GM, joueurs réellement inscrits et spectateur, ainsi que les accès privés pour ouvrir une régie ou une vue individuelle sur un autre appareil.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Réutiliser le shell et les mêmes panneaux fonctionnels que sur desktop. Ne pas forcer le comparatif côte à côte sur mobile. Préserver l’identité visible, le défilement vertical, les messages de connexion et les accès regroupés sans afficher les longues URL privées.

## Acceptance criteria

- Aucun débordement horizontal à 390 px.
- Cibles tactiles d’au moins 44 px, champs d’au moins 16 px et zoom navigateur autorisé.
- CTA et messages ne sont pas masqués par les éléments fixes ou les safe areas.
- Le choix de perspective et les accès individuels restent utilisables sans exposer les secrets des autres rôles.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-mobile-390.png).
- Cible de capture de l’application : 390 × 844 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-7-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
