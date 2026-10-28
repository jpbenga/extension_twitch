# AFTER — Broadcast Discussion — OBS 16x9 — v3

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 15234760056600880163
Screen title: AFTER — Broadcast Discussion — OBS 16x9 — v3
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Faire reconnaître immédiatement le joueur qui donne son indice et l’avancement réel des tours oraux.

## Existing behaviour to preserve

play.turns expose round, total, current, completed, order et complete. Les passages sont confirmés par le GM, sans minuteur automatique ni saisie de l’indice côté diffusion.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Adapter le renderer React BroadcastOverlay et ses styles partagés ; ne pas reconstruire l’application à partir du HTML de maquette. Conserver exactement les sept widgets obligatoires et leur géométrie bornée, le cadre 16:9 et la transparence réelle hors panneaux. Aucune commande ni damier dans OBS. Utiliser seulement PublicSessionView provenant du flux public indépendant ; thème public de session indépendant du thème privé. Corriger la réserve connue de la maquette : la progression orale doit rester lisible dans le widget phase, sans texte coupé par sa hauteur. Prévoir le reflow du nom du joueur courant, une taille de texte adaptée et une troncature maîtrisée du nom si nécessaire, jamais de la progression utile.

## Acceptance criteria

- Le cadre 1920×1080 contient les sept widgets et ne déforme pas le ratio16:9.
- Les coins et espaces hors panneaux ont un alpha nul dans la capture navigateur ; aucun contrôle interactif ni damier.
- Aucun mot, rôle non publié, invitation, accès privé ou état GM dans les données publiques ou le DOM.
- Tour d’indices, total, joueur courant et nombre de passages confirmés restent lisibles au preset Équilibré.
- Tester un nom de32 caractères et douze participants : aucune sortie du cadre, aucun nombre de progression masqué.
- Quand complete=true, afficher Indices terminés sans inventer un changement de phase.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-transparent-1920.png).
- Cible de capture de l’application : 1920 × 1080 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
