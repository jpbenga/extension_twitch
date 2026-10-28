# AFTER — Lab Access Unavailable — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 8710675424358674545
Screen ID: 12831149329146105505
Screen title: AFTER — Lab Access Unavailable — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Expliquer que cet onglet ne possède pas les accès locaux et orienter vers le jeu pour démarrer un nouveau test.

## Existing behaviour to preserve

readLab lit les accès d’essai depuis sessionStorage. Un stockage absent ou invalide produit une absence d’accès dans cet onglet ; cela ne prouve pas que la session serveur a été supprimée. Le contexte officiel renvoie vers la configuration Undercover.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Conserver l’explication limitée aux accès locaux et une action vers le jeu. Ne pas inventer récupération de compte, jeton, réouverture de session ou effacement serveur. Garder cet état dans le laboratoire privé, sans réactiver les routes Creator legacy fermées par défaut.

## Acceptance criteria

- Aucun secret ou faux identifiant de récupération n’est demandé ou affiché.
- Le texte ne prétend ni à une session supprimée ni à une restauration automatique des accès.
- L’action ouvre la configuration du jeu officiel ; elle ne crée pas une session avant validation du parcours normal.
- Les accès absents ou corrompus n’entraînent ni crash ni fuite de projection privée.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-7-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
