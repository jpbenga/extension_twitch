# AFTER — GM Discussion — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 14255636269363992144
Screen title: AFTER — GM Discussion — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Identifier le joueur courant et confirmer son passage oral, puis passer au suivant.

## Existing behaviour to preserve

Le moteur expose l’ordre, le joueur courant, les passages confirmés et le tour d’indices. game.action / confirm-clue avance après un indice oral. Deux tours sont prévus par défaut, configurables de 1 à 5 ; le dernier passage permet ensuite d’ouvrir le vote.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Mettre le joueur courant et la progression au premier plan. Aucun microphone, champ d’indice, compte à rebours ni confirmation automatique liée à la présence. Distinguer « Manche N » de « Tour d’indices N / total » ; corriger Tour 2 / Manche 2 dans la copie de production sans nouvelle maquette. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- Le bouton confirme uniquement le passage courant via confirm-clue.
- Ordre et progression se mettent à jour depuis la projection après réponse serveur.
- Le second tour réutilise le même patron ; aucun vote n’est ouvert prématurément.
- Le journal et les informations privées GM demeurent disponibles en disclosures.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
