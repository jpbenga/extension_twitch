# AFTER — GM Open Vote — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 3619269997911621594
Screen title: AFTER — GM Open Vote — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Ouvrir le scrutin lorsque tous les tours d’indices requis sont terminés.

## Existing behaviour to preserve

game.action / open-vote ouvre le scrutin et passe en phase vote. Le moteur refuse toute ouverture avant l’achèvement des tours d’indices configurés.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

L’action « Ouvrir les votes » devient dominante uniquement quand la projection l’autorise. Afficher une progression terminée et des libellés distinguant manche et tours d’indices. Ne pas ajouter de bouton de contournement ou de vote anticipé. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- L’ouverture reste refusée avant tous les passages requis.
- Après le dernier passage, open-vote est disponible et crée le scrutin autoritaire.
- Le vote s’ouvre pour les seuls joueurs actifs éligibles.
- Les états réseau verrouillent l’envoi sans perdre les données de la partie.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
