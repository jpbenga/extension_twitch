# AFTER — GM Session Settings — Desktop — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 11936034876302496963
Screen ID: 646664438643247707
Screen title: AFTER — GM Session Settings — Desktop — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Conserver son accès privé, renommer la session et retrouver les fonctions secondaires sensibles.

## Existing behaviour to preserve

UndercoverRoom propose le lien privé GM masqué/copiable, session.rename avec titre requis limité à 32 caractères, session.reset avec confirmation, et les liens publics d’aperçu/éditeur/source OBS dans Plateau. PlayPanel conserve secrets GM, journal et rejeu. ThemeControl règle la préférence privée du navigateur.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Organiser ces fonctions dans des disclosures secondaires. Conserver la différence entre rejeu et reset et les permissions serveur. Les trois apparences existantes restent Broadcast Studio, Neon Show et On Air Premium ; aucun changement du thème public OBS. Ne pas supprimer les secrets GM autorisés sous prétexte de confidentialité publique : ils sont uniquement repliés et étiquetés privés. Toutes les commandes sont verrouillées en attente, reçu incertain ou déconnexion ; le réessai réutilise l’identité de commande existante. À 1440 px : préserver le shell stable et la hiérarchie de la référence, sans grand canevas vide imposé à l’application.

## Acceptance criteria

- Le lien GM est masqué et jamais présenté comme invitation publique.
- Renommer valide le titre requis et la limite de 32 caractères, sans changer l’identité de session.
- Le reset ouvre la confirmation distincte révoquant les accès.
- Journal, informations privées, rejeu et les trois thèmes restent retrouvables ; le thème OBS ne change pas.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-5-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
