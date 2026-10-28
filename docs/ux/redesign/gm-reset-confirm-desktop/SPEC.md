# AFTER — GM Reset Confirmation — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 1984237665935802616
Screen title: AFTER — GM Reset Confirmation — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Confirmer la réinitialisation irréversible du salon et la révocation des accès joueurs.

## Existing behaviour to preserve

UndercoverRoom ouvre une confirmation de danger avant session.reset. Les joueurs sont retirés et leurs accès révoqués ; cette action est distincte du rejeu qui conserve les accès.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Conserver une confirmation clairement nommée « Réinitialiser le salon » et une annulation simple. Ne pas employer les mots « Rejouer » ou « Recommencer » pour cette commande. Le contrôle demeure secondaire, réservé au GM, soumis aux permissions et reçus existants. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- Annuler ne retire aucun joueur et ne révoque aucun accès.
- Confirmer utilise uniquement session.reset et attend son reçu autoritaire.
- Les anciens accès joueurs sont refusés après reset.
- Le dialogue mentionne le retrait des joueurs et la révocation, distincts du rejeu.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
