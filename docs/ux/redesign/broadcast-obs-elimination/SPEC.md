# AFTER — Broadcast Elimination — OBS 16x9 — v3

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 8284643245660127207
Screen title: AFTER — Broadcast Elimination — OBS 16x9 — v3
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Faire comprendre le résultat public du scrutin et l’élimination non finale.

## Existing behaviour to preserve

Le ballot résolu expose tallies, eliminated et tied. Le camp du joueur éliminé est affichable uniquement si roster.role est déjà présent dans la projection publique ; les autres camps restent secrets.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Adapter le renderer React BroadcastOverlay et ses styles partagés ; ne pas reconstruire l’application à partir du HTML de maquette. Conserver exactement les sept widgets obligatoires et leur géométrie bornée, le cadre 16:9 et la transparence réelle hors panneaux. Aucune commande ni damier dans OBS. Utiliser seulement PublicSessionView provenant du flux public indépendant ; thème public de session indépendant du thème privé. Garder les joueurs éliminés identifiables sans leur attribuer une action. Aucun bouton de manche suivante ; le GM garde cette commande.

## Acceptance criteria

- Le cadre 1920×1080 contient les sept widgets et ne déforme pas le ratio16:9.
- Les coins et espaces hors panneaux ont un alpha nul dans la capture navigateur ; aucun contrôle interactif ni damier.
- Aucun mot, rôle non publié, invitation, accès privé ou état GM dans les données publiques ou le DOM.
- Le résultat nomme le joueur réellement éliminé et ses voix publiées.
- Seul le camp déjà public est montré ; aucun décompte de camps secrets.
- Le plateau ne passe pas automatiquement à une nouvelle manche.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-transparent-1920.png).
- Cible de capture de l’application : 1920 × 1080 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
