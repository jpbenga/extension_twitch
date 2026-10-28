# AFTER — GM Reveal Confirmation — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 8576805565582557266
Screen title: AFTER — GM Reveal Confirmation — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Confirmer la publication irréversible du résultat d’un scrutin complet.

## Existing behaviour to preserve

L’action resolve a confirmation: true et passe par le système useConfirm / ActionForm existant. Elle ne peut être exécutée qu’après participation complète. Le serveur décide élimination, égalité, révélation du camp et éventuelle fin.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Conserver le dialogue accessible partagé et une action d’annulation sans effet. Expliquer la publication et les révélations autorisées sans promettre la fin ou une élimination en cas d’égalité. Ce dialogue n’autorise pas la diffusion des mots avant la fin. Ne pas utiliser window.confirm. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- Annuler ne produit aucune commande.
- Confirmer envoie une seule commande resolve via le reçu existant.
- Le dialogue n’est pas un moyen de contourner un scrutin incomplet.
- Focus, Escape, retour de focus et verrouillage pendant envoi restent accessibles.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
