# AFTER — Lab Restart Confirmation — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 8710675424358674545
Screen ID: 466000430ac54eacab2ae45c89eac5dd
Screen title: AFTER — Lab Restart Confirmation — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Confirmer le rejeu de la même partie en conservant la session, les identités et les accès.

## Existing behaviour to preserve

restartLab appelle game.restart sur le run courant et conserve les étapes et reçus en cas de résultat incertain. Le helper peut réexécuter startAction si elle est configurée ; pour Undercover officiel, le retour en préparation requiert une nouvelle distribution par le GM.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Utiliser le dialogue de confirmation partagé accessible plutôt qu’un confirm natif. Expliquer l’effacement des votes et résultats et la conservation des accès. Ne pas confondre avec le reset salon B5 qui retire les joueurs et révoque les accès. Ne pas promettre une redistribution automatique.

## Acceptance criteria

- Annuler ne déclenche aucune commande.
- Confirmer une fois conserve la session, les identités et les liens joueur.
- Le double clic et la reprise d’une réponse perdue ne réinitialisent pas deux fois le jeu.
- Le retour Undercover correspond à la préparation réelle et laisse la nouvelle distribution au GM.
- Le dialogue gère focus, retour de focus, clavier et état occupé.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-7-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
