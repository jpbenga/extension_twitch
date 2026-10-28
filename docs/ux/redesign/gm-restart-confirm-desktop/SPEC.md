# AFTER — GM Replay Confirmation — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 18070633581580327668
Screen title: AFTER — GM Replay Confirmation — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Confirmer le rejeu en conservant les joueurs et leurs accès.

## Existing behaviour to preserve

Le bouton de rejeu appelle useConfirm puis game.restart avec le runId. Les votes, éliminations et résultats sont effacés ; les participants et leurs liens d’accès sont conservés. La partie revient avant distribution.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Énoncer explicitement les conséquences. Ne pas appeler session.reset et ne pas rediriger vers un nouvel essai ou une nouvelle identité. Conserver le même dialogue partagé que la régie réelle et le laboratoire quand pertinent, sans dupliquer la logique de commande. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- Annuler conserve la partie intacte.
- Confirmer envoie une seule commande game.restart avec le bon runId.
- Tous les accès et identités des participants restent valides.
- Les anciens votes et résultats disparaissent et une nouvelle distribution est nécessaire.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
