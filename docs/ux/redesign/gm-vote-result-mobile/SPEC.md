# AFTER — GM Vote Result — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 13624688543223233419
Screen title: AFTER — GM Vote Result — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Lire le résultat du vote et, si la partie continue, lancer la manche suivante.

## Existing behaviour to preserve

La résolution publie le décompte agrégé. Le premier non ex æquo est éliminé et son camp devient public ; une égalité n’élimine personne. Hors fin autoritaire, game.action / next ouvre la manche suivante en discussion.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Réutiliser ce patron pour élimination et égalité avec la copie correspondante. Ne révéler aucun mot avant la fin. « Commencer la manche suivante » reste l’unique action dominante si next est autorisé. Harmoniser « Manche » et « Tour d’indices » ; une légende « Tour 2 » sous « Manche 2 » n’est pas à recopier. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 390 px : colonne fluide, cibles 44–48 px, champs 16 px, safe-area, aucune largeur horizontale ; le contenu doit rester accessible sous les éléments fixes et le zoom doit être autorisé.

## Acceptance criteria

- Élimination, camp public et décompte correspondent exactement au résultat serveur.
- En cas d’égalité, aucun joueur n’est affiché éliminé.
- next n’est proposé qu’en l’absence de victoire ou nul terminant la partie.
- Les mots restent privés jusqu’au résultat final.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-mobile-390.png).
- Cible de capture de l’application : 390 × 844 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
