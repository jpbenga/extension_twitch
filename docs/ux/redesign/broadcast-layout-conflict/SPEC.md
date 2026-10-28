# AFTER — Broadcast Layout Conflict — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 17206795688804889669
Screen title: AFTER — Broadcast Layout Conflict — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Protéger les ajustements locaux lorsqu’une autre fenêtre a enregistré une disposition différente.

## Existing behaviour to preserve

SessionLayoutEditor compare draft.base au layout distant : un changement distant de layout avec brouillon modifié bloque la sauvegarde. Charger la version serveur exige confirmation et remplace ensuite le brouillon ; un changement de gameplay seul n’est pas un conflit.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Conserver les ajustements locaux visibles, expliquer pourquoi Enregistrer est bloqué et garder une confirmation accessible avant tout remplacement local. Ne pas ajouter Forcer l’écrasement, fusion automatique ou écrasement silencieux. Après réponse incertaine garder le circuit Réessayer de la même commande.

## Acceptance criteria

- Deux onglets provoquent un conflit uniquement si leurs layouts divergent et si le brouillon local est modifié.
- Annuler la confirmation conserve intégralement les ajustements locaux.
- Confirmer le chargement récupère la version autoritaire sans changer la partie.
- Le focus du dialogue est contenu puis rendu au déclencheur.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 900 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
