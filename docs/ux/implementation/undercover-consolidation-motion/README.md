# Captures réelles — consolidation Undercover et Motion TV

Ces PNG proviennent de l’application exécutée en mode production et de véritables sessions temporaires du serveur. Ils ne sont pas des exports Stitch. Les références immuables restent dans `docs/ux/redesign/undercover-consolidation` et `undercover-tv-motion`.

Les images de test sont neutres et générées dans le navigateur ou en mémoire. Les noms et parties sont fictifs. Les champs d’accès privés sont masqués dans les captures UI. Aucun jeton utilisable n’est publié dans ce dossier.

- Desktop : 1440 × 1000, tablette : 768 × 1024, mobile : 390 × 844, captures complètes et viewport.
- OBS : 1920 × 1080 RGBA ; réduction Twitch : 390 × 220. Le fond est réellement transparent, sans décor ni damier.
- Thème privé Neon Show pour comparer les AC. Les préférences privées restent indépendantes du thème public.
- Captures Motion : état issu de l’API réelle, animations terminées pour obtenir un PNG lisible. Les durées, décalages, interruptions et reduced motion sont vérifiés dans les tests ; un PNG fixe ne prouve pas seul le mouvement.

## Comparaison avec les références

Contenus A/B d’abord, cartes réordonnées, mode Classique et options repliées ; le conducteur et la vérification restent des listes. La diffusion simple est séparée de l’éditeur. L’adoption présente les deux rendus avant un choix explicite. Le menu secondaire s’ajoute à B5, qui reste complet.

Les différences utiles sont documentées : textes et images fictifs, contrôles tactiles conservés, état de sauvegarde réel, nombre de manches variable, ancienne disposition rendue véritablement dans AC8. La miniature AC7 ne prétend pas avoir distribué des rôles. Les fiches Motion sont des storyboards : seule la zone TV se compare à la source OBS, sans leur légende de conception.

| État                  | Desktop                                | Mobile                                |
| --------------------- | -------------------------------------- | ------------------------------------- |
| Préparation AC1       | [Voir](ac1-desktop.png)                | [Voir](ac1-mobile.png)                |
| Conducteur AC2        | [Voir](ac2-desktop.png)                | [Voir](ac2-mobile.png)                |
| Édition AC3           | [Voir](ac3-desktop.png)                | [Voir](ac3-mobile.png)                |
| Réutilisation AC4     | [Voir](ac4-desktop.png)                | [Voir](ac4-mobile.png)                |
| Image manquante AC5   | [Voir](ac5-desktop.png)                | [Voir](ac5-mobile.png)                |
| Vérification AC6      | [Voir](ac6-desktop.png)                | [Voir](ac6-mobile.png)                |
| Diffusion TV AC7      | [Voir](ac7-desktop.png)                | [Voir](ac7-mobile.png)                |
| Adoption AC8          | [Voir](ac8-desktop.png)                | [Voir](ac8-mobile.png)                |
| Menu supporté AC9     | [Voir](ac9-supported-menu-desktop.png) | [Voir](ac9-supported-menu-mobile.png) |
| Retrait confirmé AC14 | [Voir](ac14-desktop.png)               | [Voir](ac14-mobile.png)               |

Les variantes `*-tablet.png` et `*-mobile-viewport.png` complètent ces vues. `ac7-legacy-*` montre la disposition historique avant adoption.

## Preuves TV

- [Duo normal](motion-duo-3-normal-alpha.png) et [réduit](motion-duo-3-reduced-alpha.png).
- [Trois affectations](motion-assignments-3-normal-alpha.png), [six joueurs](motion-assignments-6-last-normal-alpha.png), [douze joueurs / noms longs](motion-assignments-12-last-normal-alpha.png).
- Douze votes : [zéro](motion-vote-12-zero-normal-alpha.png), [douze](motion-vote-12-complete-normal-alpha.png), [réduction Twitch](motion-vote12-twitch390-normal-alpha.png).
- [Révélation finale autorisée](motion-final-normal-alpha.png), [ouverture tardive / résultat durable](motion-late-result-normal-alpha.png).
- Chaque cas possède une variante reduced motion. Le [manifeste](capture-manifest.json) donne dimensions, canal RGBA, pixels transparents, alpha central et SHA-256.

Les tests TV existants couvrent aussi l’élimination intermédiaire, l’égalité, le rejeu, la manche suivante, les images relayées et les quatre layouts. Les captures applicatives de ces cas restent dans les sorties Playwright de leur suite, séparées de ces références.

## Vérifications exécutées

- `npm run check` : **224 tests unitaires/intégration**, formatage, TypeScript strict et build production réussis.
- **215 parcours Chromium réussis**, cumulés ci-dessous, sur bases temporaires et identités isolées.
- 82 captures réelles ; 34 PNG alpha vérifiés (canal RGBA, centre transparent et pixels visibles).
- Versions et commandes détaillées : [verification.json](verification.json).

| Suite                                     | Parcours réussis |
| ----------------------------------------- | ---------------: |
| Sessions et accueil historique            |               42 |
| Consolidation AC                          |                9 |
| Motion normal/réduit 3/6/12               |                6 |
| Préparation et erreurs                    |               20 |
| Conducteur et médias                      |               24 |
| Régie B5                                  |                6 |
| Lobby et compagnons joueurs               |               16 |
| Layouts historiques                       |                6 |
| Dialogues et design system                |               12 |
| Accueil approuvé                          |               16 |
| Laboratoire B7                            |               12 |
| TV v2 et médias relayés                   |                4 |
| Aperçu, OBS, reconnexion                  |                9 |
| Expériences et thèmes                     |               12 |
| Gameplay officiel et accès interappareils |               12 |
| Broadcast B6 et conflits                  |                9 |

Les anciens sélecteurs ont été adaptés à l’édition des contenus en premier, aux écrans dédiés et aux libellés Manche/Cycle ; les assertions de moteur, résultats et confidentialité sont conservées. Un fondu de sortie touchant le HUD durable a été corrigé et testé : le compteur et les affectations ne disparaissent pas à la fin d’un simple cue. Les contrôles de rendu incluent l’absence de débordement, les cibles de 44 px, champs de 16 px, safe-area, noms de 80 caractères, douze joueurs et la réduction Twitch.

## Limite de validation

Tests automatisés Chromium et inspection des captures. Aucune nouvelle validation iPhone/Safari physique, OBS réel ou Twitch authentifié revendiquée. L’approbation visuelle des références est acquise ; l’essai humain de cette implémentation est le prochain contrôle.
