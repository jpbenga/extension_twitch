# Bloc 5 — Régie Game Master : bilan d’intégration

Les 22 références APPROVED sont intégrées sur `ux/block-5-gm`.
L’audit initial et le transfert documentaire sont conservés. Aucune fusion ni aucun déploiement.
Le statut opérationnel est enregistré dans [block-5.json](block-5.json).

## Fonctionnalités effectives

La régie possède une navigation Partie / Joueurs / Plateau, une phase lisible, un
compteur de tours d’indices distinct des manches et une action dominante. Distribution,
passages oraux, ouverture des votes, progression, dépouillement, résultat et rejeu
utilisent toujours les commandes du serveur. Les joueurs non connectés restent
pilotables par délégation autorisée.

Les informations privées et le journal sont repliables. Les accès et réglages forment
un espace secondaire : renommage, accès GM, rejeu et réinitialisation ne saturent plus
la phase active. Les confirmations personnalisées de révélation, rejeu et reset gardent
leur focus, annulation, attente et erreur ; le reset destructif reste distinct du rejeu.
La barre principale mobile respecte la safe area et laisse accessibles les derniers
réglages.

Fichiers principaux : `gm-game-panel.tsx`, `undercover-room.tsx`, `play-panel.tsx`,
`game-action.tsx`, `stitch-gm.css` et les trois ajouts de scope dans `tokens.css`.
Les composants joueurs, les anciennes vues et le moteur ne sont pas remplacés.

## Vérification et captures

197 tests unitaires/intégration, TypeScript strict et build de production réussis sur
cette branche. La nouvelle suite apporte **6 parcours navigateur**, validés dans
la copie croisée. Les tests existants pertinents et la compatibilité historique sont
également vérifiés ; le [bilan croisé](CROSS-BLOCKS-5-6-7.md) détaille les **218 cas distincts**.
Aucun ancien échec n’est masqué dans ce total : les régressions ont été corrigées puis relancées.

Deux scénarios réels sur trois viewports : quatre identités joueurs distinctes,
public indépendant, refus d’ouverture prématurée, deux tours, votes, élimination et
victoire civile, puis rejeu avec accès conservés ; égalités jusqu’au nul et reset
révoquant réellement les accès (401). Les captures couvrent les onze états desktop/mobile,
y compris les trois confirmations. Les noms et totaux ne sont pas figés aux maquettes.

Les 22 images `implementation-*` sont séparées des références APPROVED. Les liens,
dimensions et empreintes sont dans [l’index des captures](block-5-captures.json).
Les limites et écarts aux maquettes sont détaillés dans le bilan croisé.

## Test humain

Suivre le [guide commun iPhone, ordinateur et OBS](../../TEST-APPROVED-BLOCKS-5-6-7.md).
Choisir Neon Show pour la comparaison visuelle ; le défaut d’apparence n’est pas changé.
Les trois branches restent séparées, leur validation croisée n’est pas une fusion publiée.
Les nouveaux rendus iPhone physique, Safari/VoiceOver et OBS réel n’ont pas été testés.

## Captures comparables

| État                       | Référence APPROVED                                               | Implémentation réelle                                                        | Dimensions  |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| gm-distribution-desktop    | [Référence](../redesign/gm-distribution-desktop/approved.png)    | [Capture](../redesign/gm-distribution-desktop/implementation-desktop.png)    | 1440 × 1053 |
| gm-distribution-mobile     | [Référence](../redesign/gm-distribution-mobile/approved.png)     | [Capture](../redesign/gm-distribution-mobile/implementation-mobile.png)      | 390 × 1273  |
| gm-discussion-desktop      | [Référence](../redesign/gm-discussion-desktop/approved.png)      | [Capture](../redesign/gm-discussion-desktop/implementation-desktop.png)      | 1440 × 1043 |
| gm-discussion-mobile       | [Référence](../redesign/gm-discussion-mobile/approved.png)       | [Capture](../redesign/gm-discussion-mobile/implementation-mobile.png)        | 390 × 1255  |
| gm-open-vote-desktop       | [Référence](../redesign/gm-open-vote-desktop/approved.png)       | [Capture](../redesign/gm-open-vote-desktop/implementation-desktop.png)       | 1440 × 1043 |
| gm-open-vote-mobile        | [Référence](../redesign/gm-open-vote-mobile/approved.png)        | [Capture](../redesign/gm-open-vote-mobile/implementation-mobile.png)         | 390 × 1254  |
| gm-vote-desktop            | [Référence](../redesign/gm-vote-desktop/approved.png)            | [Capture](../redesign/gm-vote-desktop/implementation-desktop.png)            | 1440 × 1089 |
| gm-vote-mobile             | [Référence](../redesign/gm-vote-mobile/approved.png)             | [Capture](../redesign/gm-vote-mobile/implementation-mobile.png)              | 390 × 1286  |
| gm-vote-result-desktop     | [Référence](../redesign/gm-vote-result-desktop/approved.png)     | [Capture](../redesign/gm-vote-result-desktop/implementation-desktop.png)     | 1440 × 1061 |
| gm-vote-result-mobile      | [Référence](../redesign/gm-vote-result-mobile/approved.png)      | [Capture](../redesign/gm-vote-result-mobile/implementation-mobile.png)       | 390 × 1262  |
| gm-final-desktop           | [Référence](../redesign/gm-final-desktop/approved.png)           | [Capture](../redesign/gm-final-desktop/implementation-desktop.png)           | 1440 × 1140 |
| gm-final-mobile            | [Référence](../redesign/gm-final-mobile/approved.png)            | [Capture](../redesign/gm-final-mobile/implementation-mobile.png)             | 390 × 1523  |
| gm-players-desktop         | [Référence](../redesign/gm-players-desktop/approved.png)         | [Capture](../redesign/gm-players-desktop/implementation-desktop.png)         | 1440 × 1000 |
| gm-players-mobile          | [Référence](../redesign/gm-players-mobile/approved.png)          | [Capture](../redesign/gm-players-mobile/implementation-mobile.png)           | 390 × 1255  |
| gm-settings-desktop        | [Référence](../redesign/gm-settings-desktop/approved.png)        | [Capture](../redesign/gm-settings-desktop/implementation-desktop.png)        | 1440 × 1293 |
| gm-settings-mobile         | [Référence](../redesign/gm-settings-mobile/approved.png)         | [Capture](../redesign/gm-settings-mobile/implementation-mobile.png)          | 390 × 1644  |
| gm-reveal-confirm-desktop  | [Référence](../redesign/gm-reveal-confirm-desktop/approved.png)  | [Capture](../redesign/gm-reveal-confirm-desktop/implementation-desktop.png)  | 1440 × 1089 |
| gm-reveal-confirm-mobile   | [Référence](../redesign/gm-reveal-confirm-mobile/approved.png)   | [Capture](../redesign/gm-reveal-confirm-mobile/implementation-mobile.png)    | 390 × 1286  |
| gm-restart-confirm-desktop | [Référence](../redesign/gm-restart-confirm-desktop/approved.png) | [Capture](../redesign/gm-restart-confirm-desktop/implementation-desktop.png) | 1440 × 1293 |
| gm-restart-confirm-mobile  | [Référence](../redesign/gm-restart-confirm-mobile/approved.png)  | [Capture](../redesign/gm-restart-confirm-mobile/implementation-mobile.png)   | 390 × 1644  |
| gm-reset-confirm-desktop   | [Référence](../redesign/gm-reset-confirm-desktop/approved.png)   | [Capture](../redesign/gm-reset-confirm-desktop/implementation-desktop.png)   | 1440 × 1293 |
| gm-reset-confirm-mobile    | [Référence](../redesign/gm-reset-confirm-mobile/approved.png)    | [Capture](../redesign/gm-reset-confirm-mobile/implementation-mobile.png)     | 390 × 1644  |
