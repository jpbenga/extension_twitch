# AFTER — Player Victory — Mobile — v1

<!-- stitch:reference:start -->

Status: APPROVED

## Stitch

Project ID: 16851612906193292413
Screen ID: 5452e2f8463549c49365d57ae993fc19
Screen title: AFTER — Player Victory — Mobile — v1
CLI version: 0.12.0

## Reference

- [approved.png](approved.png)
- [approved.html](approved.html)

Validation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.
<!-- stitch:reference:end -->

## Functional intent

Afficher une victoire personnelle accompagnée du résultat global et des révélations autorisées.

## Existing behaviour to preserve

Le texte personnel compare uniquement outcome.id aux camps révélés dans roster.role. Ne jamais déduire le camp du mot. Le résultat global du serveur reste affiché. Les mots et camps finaux sont ceux de la projection autorisée, après victoire ; un joueur éliminé peut gagner avec son camp. Seul le GM relance.

## Notes

Design explicitement validé avant implémentation.

## Contraintes communes

Référence visuelle APPROVED conservée sans modification. La maquette ne crée pas
de nouvelle permission. Préserver les trois thèmes existants, leur préférence locale
et l’indépendance du thème OBS. Chargement, erreurs et reconnexion restent réels ;
les commandes sont suspendues si le flux est déconnecté ou une réponse incertaine.
Voir [le bilan d’intégration](../LOBBY-PLAYER-IMPLEMENTATION.md) pour les écarts,
les captures réelles et les scénarios de validation.
