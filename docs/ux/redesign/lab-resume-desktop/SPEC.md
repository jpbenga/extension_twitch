# AFTER — Lab Resume Preparation — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 8710675424358674545
Screen ID: 15365f53b46e46b5932eeb5d6b1041f7
Screen title: AFTER — Lab Resume Preparation — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Reprendre une préparation interrompue dans le même essai, sans recréer la partie ni dupliquer les inscriptions.

## Existing behaviour to preserve

prepareLab persiste chaque joueur de démonstration et son requestId, réutilise les inscriptions ayant déjà un identifiant, puis game.use-prepared et l’éventuelle action initiale. labCommand conserve le même commandId et expectedVersion après résultat réseau incertain ; une erreur définitive autorise une nouvelle commande.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Réutiliser run(prepareLab), le verrou de requête en vol et le stockage existant. Présenter Reprendre la préparation comme seule action dominante. Garder le lien nouveau test secondaire et distinct. Ne pas effacer les reçus ou générer de nouvelles identités pour rendre l’écran plus simple.

## Acceptance criteria

- La reprise conserve le même identifiant de session et les joueurs déjà inscrits.
- Une réponse perdue réutilise les reçus/idempotence existants et ne duplique ni inscription ni action.
- Le bouton est verrouillé pendant la requête ; l’erreur réseau explique la possibilité de reprendre.
- Après succès, le laboratoire retrouve le shell de l’essai actif sans création automatique d’une autre session.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 1000 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-7-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
