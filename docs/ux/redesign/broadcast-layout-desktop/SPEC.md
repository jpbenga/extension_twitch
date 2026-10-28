# AFTER — Broadcast Layout Editor — Desktop — v2

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 10132472591870592947
Screen ID: 16716479521615247860
Screen title: AFTER — Broadcast Layout Editor — Desktop — v2
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Personnaliser la disposition Undercover par des réglages bornés et enregistrer une seule fois dans la partie.

## Existing behaviour to preserve

SessionLayoutEditor sépare le flux GM des données publiques du canvas et garde un brouillon sessionStorage. UndercoverLayoutEditor offre quatre presets, sept widgets, pointer/clavier/champs, cartes grid/horizontal/vertical/free et placement individuel. overlay.configure utilise permissions, version attendue et reçu existants.

## Notes

Design explicitement validé avant implémentation.

## Implementation notes

Refondre les contrôles et la hiérarchie autour d’Enregistrer la disposition sans changer le schéma. Garder les sept blocs obligatoires, les quatre presets et les minima ; aucune suppression/masquage/ajout arbitraire. Le canvas utilise BroadcastOverlay avec un override de brouillon et uniquement PublicSessionView. Conserver le retour au défaut confirmé, les chevauchements signalés, le brouillon privé, beforeunload et le réessai de commande incertaine.

## Acceptance criteria

- Chaque bloc reste dans1920×1080 avec marge24px et minimas du contrat ; aucune mutation du moteur ou de l’ordre de parole.
- Les quatre presets et quatre modes de cartes, le placement individuel et les alternatives clavier/champs restent accessibles.
- Enregistrer publie la disposition sans reset, nouvelle URL ni perte du thème public.
- Un conflit empêche l’écrasement ; le réessai conserve l’identité de commande existante.

## Reference viewport

- [Rendu de contrôle de la maquette](reference-desktop-1440.png).
- Cible de capture de l’application : 1440 × 900 px, page complète lorsque nécessaire.

Ce rendu provient du même HTML de maquette pendant la conception. Ce n’est pas une capture de l’application. Le canevas natif Stitch peut être plus grand ; ne pas reproduire ses marges vides. Pour OBS, la transparence réelle prime sur le PNG natif aplati.

## Human approval

Validation humaine explicite des Blocs 5, 6 et 7 le 28 octobre 2026. Cette référence précise est APPROVED ; les réserves documentées sont à corriger pendant l’intégration, sans nouvelle génération ou validation UX préalable. Voir [le guide commun](../BLOCKS-5-6-7.md) et [le handoff du bloc](../blocks-5-6-7/BLOCK-6-HANDOFF.md). Conserver approved.png et approved.html ; les captures réelles auront un nom implementation-* distinct.
