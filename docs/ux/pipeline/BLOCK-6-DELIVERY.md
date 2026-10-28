# Bloc 6 — Broadcast, spectateur et OBS : bilan d’intégration

Les 14 références APPROVED sont intégrées sur `ux/block-6-broadcast`.
L’audit initial et le transfert documentaire sont conservés. Aucune fusion ni aucun déploiement.
Le statut opérationnel est enregistré dans [block-6.json](block-6.json).

## Fonctionnalités effectives

Le spectateur possède une lecture publique dédiée. La source OBS, l’aperçu fictif,
la personnalisation de disposition et le comparatif QA utilisent le même renderer
public et les mêmes sept widgets. Les quatre dispositions, les limites géométriques,
l’ordre visuel, les modifications non enregistrées et la résolution de conflit sont conservés.

La progression orale est entièrement lisible dans le widget de phase. Les votes,
résultats autorisés, éliminations, événements publics et résultat final suivent les
projections réelles. Le dépouillement reste visible dans la carte Vote même si la
même commande termine la partie. Les thèmes privés ne recolorent jamais OBS.
La grille existante conserve son maximum de quatre colonnes : six joueurs font 4 + 2.

Fichiers principaux : `broadcast-overlay.tsx`, `broadcast-feed.tsx`, `public-session.tsx`,
`stream-preview.tsx`, `session-layout-editor.tsx`, `undercover-layout-editor.tsx`,
`session-room.tsx`, `broadcast-presentation.ts`, `broadcast.css` et la palette publique
Neon Show centralisée en fin de `tokens.css`.

## Vérification et captures

197 tests unitaires/intégration, TypeScript strict et build de production réussis sur
cette branche. La nouvelle suite apporte **9 parcours navigateur**, validés dans
la copie croisée. Les tests existants pertinents et la compatibilité historique sont
également vérifiés ; le [bilan croisé](CROSS-BLOCKS-5-6-7.md) détaille les **218 cas distincts**.
Aucun ancien échec n’est masqué dans ce total : les régressions ont été corrigées puis relancées.

Trois scénarios sur trois viewports : vraie partie à six joueurs de la préparation
au résultat, nouvelle manche, victoire, rejeu, égalités et nul ; confidentialité et
ouverture tardive OBS ; douze noms longs, leur révélation finale et les limites visibles des cartes sur quatre dispositions et trois apparences
privées ; conflit réel de layout, annulation sans perte puis chargement confirmé.
Sept PNG OBS RGBA 1920 × 1080 ont un alpha nul hors panneaux. Les quatorze captures
incluent spectateur, aperçu, réglages et confirmation de conflit.

Les 14 images `implementation-*` sont séparées des références APPROVED. Les liens,
dimensions et empreintes sont dans [l’index des captures](block-6-captures.json).
Les limites et écarts aux maquettes sont détaillés dans le bilan croisé.

## Test humain

Suivre le [guide commun iPhone, ordinateur et OBS](../../TEST-APPROVED-BLOCKS-5-6-7.md).
Choisir Neon Show pour la comparaison visuelle ; le défaut d’apparence n’est pas changé.
Les trois branches restent séparées, leur validation croisée n’est pas une fusion publiée.
Les nouveaux rendus iPhone physique, Safari/VoiceOver et OBS réel n’ont pas été testés.

## Captures comparables

| État                             | Référence APPROVED                                                     | Implémentation réelle                                                              | Dimensions  |
| -------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------- |
| broadcast-obs-preparation        | [Référence](../redesign/broadcast-obs-preparation/approved.png)        | [Capture](../redesign/broadcast-obs-preparation/implementation-obs.png)            | 1920 × 1080 |
| broadcast-obs-discussion         | [Référence](../redesign/broadcast-obs-discussion/approved.png)         | [Capture](../redesign/broadcast-obs-discussion/implementation-obs.png)             | 1920 × 1080 |
| broadcast-obs-vote               | [Référence](../redesign/broadcast-obs-vote/approved.png)               | [Capture](../redesign/broadcast-obs-vote/implementation-obs.png)                   | 1920 × 1080 |
| broadcast-obs-elimination        | [Référence](../redesign/broadcast-obs-elimination/approved.png)        | [Capture](../redesign/broadcast-obs-elimination/implementation-obs.png)            | 1920 × 1080 |
| broadcast-obs-tie                | [Référence](../redesign/broadcast-obs-tie/approved.png)                | [Capture](../redesign/broadcast-obs-tie/implementation-obs.png)                    | 1920 × 1080 |
| broadcast-obs-victory            | [Référence](../redesign/broadcast-obs-victory/approved.png)            | [Capture](../redesign/broadcast-obs-victory/implementation-obs.png)                | 1920 × 1080 |
| broadcast-obs-draw               | [Référence](../redesign/broadcast-obs-draw/approved.png)               | [Capture](../redesign/broadcast-obs-draw/implementation-obs.png)                   | 1920 × 1080 |
| broadcast-spectator-desktop      | [Référence](../redesign/broadcast-spectator-desktop/approved.png)      | [Capture](../redesign/broadcast-spectator-desktop/implementation-desktop.png)      | 1440 × 1000 |
| broadcast-spectator-mobile       | [Référence](../redesign/broadcast-spectator-mobile/approved.png)       | [Capture](../redesign/broadcast-spectator-mobile/implementation-mobile.png)        | 390 × 1366  |
| broadcast-stream-preview-desktop | [Référence](../redesign/broadcast-stream-preview-desktop/approved.png) | [Capture](../redesign/broadcast-stream-preview-desktop/implementation-desktop.png) | 1440 × 1704 |
| broadcast-stream-preview-mobile  | [Référence](../redesign/broadcast-stream-preview-mobile/approved.png)  | [Capture](../redesign/broadcast-stream-preview-mobile/implementation-mobile.png)   | 390 × 1202  |
| broadcast-layout-desktop         | [Référence](../redesign/broadcast-layout-desktop/approved.png)         | [Capture](../redesign/broadcast-layout-desktop/implementation-desktop.png)         | 1440 × 1135 |
| broadcast-layout-mobile          | [Référence](../redesign/broadcast-layout-mobile/approved.png)          | [Capture](../redesign/broadcast-layout-mobile/implementation-mobile.png)           | 390 × 1665  |
| broadcast-layout-conflict        | [Référence](../redesign/broadcast-layout-conflict/approved.png)        | [Capture](../redesign/broadcast-layout-conflict/implementation-desktop.png)        | 1440 × 1345 |
