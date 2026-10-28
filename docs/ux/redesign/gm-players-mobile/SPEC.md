# AFTER — GM Players — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 16290725861665464450
Screen title: AFTER — GM Players — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Vérifier l’effectif, l’état de jeu et la présence réseau pendant la partie.

## Existing behaviour to preserve

L’onglet Joueurs lit les participants inscrits, leur présence et l’état actif/éliminé de la projection publique. L’effectif reste figé pendant la partie ; les états de connexion ne constituent ni un vote ni un indice.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Distinguer inscrit, connecté/hors ligne et en jeu/éliminé. Préserver les identités réelles et l’ordre métier. Aucun ajout, retrait, réordre ou vote depuis cette liste. L’accès au vote délégué reste dans le patron Vote. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 390 px : colonne fluide, cibles 44–48 px, champs 16 px, safe-area, aucune largeur horizontale ; le contenu doit rester accessible sous les éléments fixes et le zoom doit être autorisé.

## Acceptance criteria

- Un joueur hors ligne reste inscrit et conserve son état de jeu.
- Aucun changement de présence ne confirme un indice ou un vote.
- Le nombre affiché correspond aux participants réels.
- La navigation Partie / Joueurs / Plateau reste identique aux autres écrans GM.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-mobile-390.png).
- Cible de capture de l’application : 390 × 844 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
