# AFTER — GM Distribution — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 4748605395910424442
Screen title: AFTER — GM Distribution — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Distribuer les mots et démarrer la partie Undercover avec l’effectif déjà préparé.

## Existing behaviour to preserve

Après game.use-prepared, l’effectif est figé mais aucun mot n’est encore distribué. La commande game.action / deal distribue aléatoirement et atomiquement côté serveur puis ouvre la discussion.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Conserver une seule action dominante « Distribuer les mots et commencer ». Ne pas la confondre avec « Préparer la partie » du Bloc 3. Le GM n’appartient à aucun camp. Utiliser les actions autorisées de la projection et les reçus existants, sans reproduire de logique de distribution dans le navigateur. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- Les inscrits restent identiques et les inscriptions fermées.
- Un seul envoi de deal déclenche la distribution et la discussion autoritaires.
- Les informations privées sont repliées et le plateau ne reçoit aucun secret.
- La navigation Partie / Joueurs / Plateau et les fonctions secondaires restent accessibles.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
