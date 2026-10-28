# Version intégrée — blocs 5, 6 et 7

Branche : `integration/blocks-5-6-7`. État applicatif commun :
`905b647aedd4a6e78b8144938e72199cd71c4eae`.
Les changements ultérieurs de cette livraison concernent uniquement la documentation.
Aucune fusion vers `main` ou une branche de production, aucun déploiement.

## État constaté avant les fusions

Après récupération explicite de toutes les branches distantes, les branches locales
et GitHub correspondaient exactement aux trois livraisons :

| Bloc                | Branche                | Commit    |
| ------------------- | ---------------------- | --------- |
| 5 — Régie GM        | `ux/block-5-gm`        | `25466ca` |
| 6 — Broadcast / OBS | `ux/block-6-broadcast` | `b8bd7ea` |
| 7 — Laboratoire     | `ux/block-7-lab`       | `8688a4c` |

Aucune branche locale ou distante ne contenait les trois commits. Aucun commit
accessible ne contenait les trois nouveaux modules applicatifs. Les trois worktrees
de livraison étaient propres. Leur base commune réelle était `73562c1`, pas `main`.

Une copie commune existait déjà dans le worktree détaché `validation-5-6-7`, dont le
HEAD était le commit documentaire `fbec4a5`. Ses changements applicatifs n’étaient pas
committés : ce n’était donc pas une branche récupérable sur le Mac. Les 18 empreintes
applicatives correspondent au bilan des tests croisés précédents. Cette preuve a été
vérifiée avant toute fusion ; la nouvelle branche rend maintenant cet état récupérable
et reproductible par Git.

## Fusions réalisées

Branche créée depuis `73562c1d95023df104da186e0489c23bcda28401`, puis fusions avec
`--no-ff`, dans l’ordre demandé :

| Étape | Source       | Commit de fusion |
| ----- | ------------ | ---------------- |
| 1     | B5 `25466ca` | `4782a30`        |
| 2     | B6 `b8bd7ea` | `754441f`        |
| 3     | B7 `8688a4c` | `905b647`        |

**Aucun conflit manuel.** Git a réconcilié automatiquement `tokens.css` : les trois
scopes GM de B5 et la palette publique Neon Show de B6 sont conservés. Les aides de
navigation des tests et les documents communs identiques ont été réunis automatiquement.
Aucun choix global « ours/theirs », aucun changement fonctionnel supplémentaire.

Les trois commits livrés et leurs commits d’audit restent dans l’historique. Les
18 empreintes applicatives de la fusion correspondent exactement à la copie commune
précédemment testée. Moteur, contrats, API serveur, dépendances et stockage restent
inchangés par rapport à la base commune. Les données locales existantes ne sont pas migrées
ou supprimées.

## Vérifications

Après chaque fusion : 197 tests unitaires/intégration, TypeScript strict et build
réussis. Contrôles navigateur intermédiaires :

- Après B5 : 6 parcours GM et 12 parcours design/confirmations réussis.
- Après B6 : 9 parcours Broadcast et 2 parcours GM desktop réussis.
- Après B7 : relance globale sur l’état commun versionné.

**197 tests unitaires/intégration et 218 cas navigateur Chromium réussis.**
TypeScript strict et les builds de production passent après chacune des trois fusions.
Les relances et contrôles intermédiaires ne sont pas ajoutés aux 218 cas distincts.

| Suite globale      | Cas réussis |
| ------------------ | ----------: |
| `e2e`              |          42 |
| `games`            |          12 |
| `design`           |          12 |
| `ux`               |          12 |
| `home`             |          16 |
| `players`          |          16 |
| `stream`           |           9 |
| `layout`           |           6 |
| `stitch-gm`        |           6 |
| `stitch-broadcast` |           9 |
| `stitch-lab`       |          12 |
| `legacy`           |          60 |
| `lab-dev`          |           6 |
| **Total**          |     **218** |

Les tests globaux utilisent le worktree principal d’intégration et trois copies
Git détachées sur le même commit `905b647`. Les copies ont leurs propres ports,
processus et bases SQLite ; les configurations de ports sont temporaires et ignorées
par Git. Les commandes et assertions d’origine sont conservées. Une exécution
séquentielle normale reste possible sur la branche avec les scripts npm existants
et les trois configurations `playwright.stitch-*.config.ts`.

Le premier passage parallèle de la maintenance historique a rencontré quatre
échecs de délai (5 ou 30 secondes). Cette suite a été relancée seule, avec sa configuration
originale, sans modifier les assertions, les délais ou le code de l’application.
Résultat final : **60 / 60 réussis**. Les quatre délais initiaux sont conservés
dans le bilan structuré ; les relances ne gonflent pas le total.

Les références APPROVED et les 43 captures d’implémentation des blocs sont conservées.
Les nouveaux rendus iPhone physique, Safari/VoiceOver et OBS réel restent à valider.
Le workflow OBS humain précédemment validé conserve son statut pour le parcours observé.

## Lancer sur le Mac et l’iPhone

Arrêter l’ancien serveur avec **Ctrl+C**, puis copier ce bloc dans le Terminal :

```sh
cd ~/extension-twitch-studio-4b &&
git fetch origin &&
git switch integration/blocks-5-6-7 &&
git pull --ff-only &&
nvm use 24 &&
npm ci &&
npm run dev:lan
```

Le terminal doit rester ouvert. Ouvrir l’adresse LAN qu’il affiche sur le Mac et
l’iPhone, connectés au même Wi-Fi de confiance. Choisir Neon Show dans Apparence
pour comparer avec les maquettes ; le thème OBS est réglé séparément pour la partie.

Depuis Undercover, lancer une démonstration, garder le laboratoire sur le Mac et
copier le lien privé GM pour l’iPhone. Les vues joueurs et spectateur sont accessibles
depuis « Accès aux vues ». Ne pas partager le lien GM ou le laboratoire avec un joueur.

[Guide complet iPhone, ordinateur et OBS](TEST-APPROVED-BLOCKS-5-6-7.md) ·
[Résultats structurés et audit](ux/pipeline/integration-blocks-5-6-7.json).
