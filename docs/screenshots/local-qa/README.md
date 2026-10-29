# Captures réelles — version QA convergée

Ces **16 captures** proviennent de l’application exécutée sur `qa/undercover-local-validation`, après la fusion `7838f4c` et les ajustements de lancement/recette du commit de livraison. Aucun composant visuel n’a été modifié après la fusion. Elles ne sont ni les maquettes Stitch ni une validation humaine. Les références APPROVED restent inchangées.

| Fichier                                                                                                | Surface / état réellement exécuté                                             |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [01-home.png](01-home.png)                                                                             | Accueil desktop.                                                              |
| [02-prepare.png](02-prepare.png)                                                                       | Préparation de la première manche, images neutres facultatives.               |
| [03-multi-manches.png](03-multi-manches.png)                                                           | Conducteur Test stream, trois paires indépendantes.                           |
| [04-content-editor.png](04-content-editor.png)                                                         | Édition de la première paire conservée.                                       |
| [05-lobby.png](05-lobby.png)                                                                           | Salon vide, aucune distribution automatique. Les accès à copier sont masqués. |
| [06-gm-discussion-mobile.png](06-gm-discussion-mobile.png)                                             | Vraie régie à 390 px, après distribution serveur.                             |
| [07-player-mobile.png](07-player-mobile.png)                                                           | Vue privée d’un participant dans son propre contexte.                         |
| [08-public.png](08-public.png)                                                                         | Plateau public connecté, même session.                                        |
| [09-duo-obs-alpha.png](09-duo-obs-alpha.png)                                                           | Duo public sans associations, images du relais autorisé.                      |
| [10-assignments-obs-alpha.png](10-assignments-obs-alpha.png)                                           | Associations publiées explicitement par le GM, trois cartes par groupe.       |
| [11-vote-obs-alpha.png](11-vote-obs-alpha.png)                                                         | Vote du deuxième cycle : quatre joueurs encore autorisés.                     |
| [12-final-obs-alpha.png](12-final-obs-alpha.png)                                                       | Révélation finale autorisée après élimination de l’Undercover.                |
| [13-stream-preview.png](13-stream-preview.png)                                                         | Aperçu, résultat durable et retour vers la vraie régie.                       |
| [14-advanced-layout.png](14-advanced-layout.png)                                                       | Éditeur avancé, géométrie et rendu commun.                                    |
| [15-twitch-config-automated-helper-fixture.png](15-twitch-config-automated-helper-fixture.png)         | Config native HTTPS ; **Helper contrôlé par le test**.                        |
| [15-twitch-duo-images-automated-helper-fixture.png](15-twitch-duo-images-automated-helper-fixture.png) | Viewer natif HTTPS, même Duo/Motion ; **Helper contrôlé par le test**.        |

Les quatre images `obs-alpha` sont des PNG **RGBA 1920 × 1080**, avec alpha nul au centre et plage alpha 0–255. Ouvrez-les sur un fond coloré pour vérifier la transparence ; aucun damier n’est gravé dans la source. La publication de rôles sur la capture finale correspond à la permission de révélation finale ; elle n’est pas utilisée dans le mode Duo.

Les contextes joueurs sont indépendants. Les noms sont des données de test demandées par le brief ; les illustrations sont des formes neutres générées par canvas, sans portraits protégés. Les champs de copie confidentiels sont masqués en rose. Les animations sont arrêtées uniquement pendant la capture PNG, pas dans l’application ; leurs durées/interruption sont testées séparément.

Reproduction, après `npm ci` et `npm run build`, aucun autre serveur en cours :

```bash
CAPTURE_LOCAL_QA=1 node scripts/test-e2e.mjs --config=playwright.local-qa.config.ts --project=desktop
CAPTURE_LOCAL_QA=1 npm run test:twitch
```

Dans l’environnement Cloud utilisé, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` désigne Chromium installé. Sur un poste sans navigateur Playwright, installer d’abord le navigateur de test avec `npx playwright install chromium` ; ce n’est pas nécessaire pour la recette humaine ordinaire.

[verification.json](verification.json) contient dimensions, hashes, commandes et résultats automatisés. [runtime-verification.json](runtime-verification.json) décrit les vrais lancements, l’accès LAN HTTP/SSE/médias, le HTTPS vérifié et la restriction du proxy navigateur Cloud. Ces contrôles ne prouvent aucun test iPhone, OBS physique ou Twitch authentifié.
