# AFTER — Lab Access & QA — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 8710675424358674545
Screen ID: e12ac0762b674a46a71fabbd3101e379
Screen title: AFTER — Lab Access & QA — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Retrouver les accès utiles et vérifier le refus réel d’une commande de gestion envoyée par un joueur.

## Existing behaviour to preserve

Le laboratoire permet ouvrir/copier la régie, les joueurs inscrits, le plateau spectateur, l’aperçu, la source OBS et le layout Undercover. probePlayerAccess vérifie la projection du premier joueur puis envoie session.rename avec son accès : le succès du probe signifie un refus serveur 403, pas une commande localement cachée.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Grouper les accès en disclosures et garder ouvrir, copier et incarner distincts. Ne jamais afficher ou journaliser les secrets réels. Conserver le contrôle avancé ciblé et ses états busy, refus attendu, résultat inattendu et erreur réseau ; ne pas prétendre à un audit complet ou à des scénarios QA inexistants. Le résultat illustré dans Stitch ne constitue pas une exécution.

## Acceptance criteria

- Chaque lien privé cible uniquement sa véritable identité ; seules les personnes inscrites ont un accès joueur.
- Le laboratoire ne peut pas être proposé comme lien à partager aux participants.
- Le probe n’annonce un succès qu’après un refus serveur 403 et signale une acceptation inattendue.
- Les libellés et descriptions utiles atteignent au moins 4,5:1, y compris dans les disclosures.
- Aucun contrôle QA n’apparaît dans les routes GM, joueur ou spectateur normales.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-7-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
