# AFTER — GM Vote — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 6465139537118349617
Screen title: AFTER — GM Vote — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Suivre la participation au scrutin et proposer la révélation lorsque tous les votes sont reçus.

## Existing behaviour to preserve

Chaque actif vote une fois pour un autre actif, sans abstention ni modification. La projection expose éligibles et votants ; game.action / resolve exige tous les votes. Le GM peut voter par délégation via game.player-action pour un joueur éligible qui n’a pas encore voté.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Montrer reçu / éligible et « A voté » / « Vote attendu », pas les choix individuels ni les totaux par cible avant résolution. Le patron couvre vote partiel et complet ; révélation indisponible tant que partiel. Préserver le formulaire délégué réel replié, ses choix autorisés et la confirmation irréversible ; aucun parcours QA. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 390 px : colonne fluide, cibles 44–48 px, champs 16 px, safe-area, aucune largeur horizontale ; le contenu doit rester accessible sous les éléments fixes et le zoom doit être autorisé.

## Acceptance criteria

- La révélation reste impossible lorsqu’un vote manque.
- La délégation exclut les joueurs déjà votants et l’auto-vote, sans permettre un deuxième vote.
- Le vote complet donne accès à la confirmation de résolution.
- Aucune cible individuelle ni agrégation prématurée n’apparaît dans le suivi ou le plateau.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-mobile-390.png).
- Cible de capture de l’application : 390 × 844 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
