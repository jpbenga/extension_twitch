# Livraison — préparation Undercover et broadcast TV

Branche : `feat/undercover-stream-series-tv`.
Code livré : `e173736`, après `720a1d5` et les incréments de contrats, médias et rendu.
Base : `738fb44`, descendante de l’intégration B2/B5/B6/B7 `5a7a2f2`.
Aucune fusion vers une autre branche et aucun déploiement.

Les **28 références visuelles sont approuvées humainement**. Elles ont toutes été
retrouvées dans Git et restent intactes. Le [contrôle des références](APPROVED-REFERENCE-CHECK.json)
conserve leurs chemins et empreintes. Aucun nouveau design Stitch ni accès aux credentials.

## Fonctions intégrées

**A — Préparation et séries.** Plusieurs séries nommées conservées sur l’appareil,
ajout, édition, duplication indépendante, retrait annulable, réordonnancement avec
boutons accessibles ou glisser-déposer, réutilisation d’une ancienne paire comme copie.
Les deux noms et les deux images se modifient séparément. Une image manquante se
reconnecte sans modifier l’autre et ne bloque pas les textes ou le salon.
Les préparations se retrouvent après fermeture de page ; les conflits entre onglets
conservent les modifications locales et proposent une copie séparée.

Les réglages réels sont conservés : 3–12 participants prévus, 1–5 tours (2 par défaut),
Classique, répartition, mots, limite de manches, thème public et layout. Le nombre prévu
ne devient pas la capacité du salon. Le laboratoire reste distinct.

**Salon et régie.** Ouvrir le salon ne crée pas de joueurs et ne distribue rien.
Après un résultat moteur, Partie suivante demande confirmation et conserve les accès ;
la distribution suivante reste manuelle. Rejouer conserve la préparation actuelle.
Retour à la série conserve le conducteur. Le serveur garde une seule partie active
par salon et refuse un deuxième salon pour le même propriétaire et la même série.

**Médias.** Conservation permanente dans le navigateur, relais serveur temporaire
strictement en mémoire, PNG validé et borné, expiration, nettoyage, contrôle d’accès
à chaque lecture. Un joueur ne reçoit que son contenu autorisé ; les médias absents
ou expirés laissent le texte disponible. Aucun hébergement permanent ou URL distante
récupérée par le serveur. Seule la préparation actuelle est transmise.

**B — Broadcast.** Rendu TV dans le composant partagé aperçu/OBS, capsules et apparitions
basses, fond transparent, duo sans affectations, publication des affectations après
confirmation GM, vote public limité à sa progression, résultats autorisés par le moteur.
Groupes de trois, pagination, numéros stables, focus oral et noms longs jusqu’à 12 joueurs.
Résultat durable après l’animation, pas de reprise d’effets historiques à la reconnexion,
mouvement réduit et indépendant des préférences privées.

Sept blocs et quatre presets sont conservés. Les nouveaux layouts TV portent la version 2 ;
les layouts enregistrés en version 1 gardent leur géométrie et leur renderer.

## Fichiers et contrats principaux

| Zone            | Fichiers / évolution                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrats        | `packages/contracts/src/undercover-stream.ts`, `sessions.ts`, `official-games.ts`, `undercover-layout.ts` : références de préparation, publication discriminée, médias, commandes GM, géométrie TV opt-in |
| Serveur         | `apps/server/src/undercover-stream.ts`, `temporary-media.ts`, `session-service.ts`, `session-api.ts`, `official-games.ts` : projections explicites, permissions, progression, relais mémoire              |
| Persistance     | `apps/server/src/sqlite-store.ts` : migration additive vers le schéma 3, association propriétaire/série/salon, anciennes tables et reçus conservés                                                        |
| Préparation     | `official-game-setup.tsx`, `undercover-series-studio.tsx`, `undercover-series.css` : six intentions A, navigation, erreurs, états réels et CTA mobile                                                     |
| Données locales | `undercover-series.ts`, `use-undercover-series.ts`, `undercover-series-launch.ts` : IndexedDB, copies, révisions, instantanés et reprise exacte de commande                                               |
| Régie / joueur  | `undercover-series-controls.tsx`, `gm-game-panel.tsx`, `private-content-image.tsx`, `undercover-companion.tsx` : commandes réelles et images privées                                                      |
| Rendu public    | `broadcast-overlay.tsx`, `undercover-tv-overlay.tsx`, `broadcast-tv.css`, `public-cues.ts`, `broadcast-feed.tsx` : même source de rendu et moments temporaires                                            |
| Layout / thèmes | `undercover-layout-editor.tsx`, `tokens.css` : minima par version et accents publics ; indépendance du thème privé conservée                                                                              |
| Confirmation    | `ui/feedback.tsx` : restauration du focus après réactivation asynchrone, sans voler le focus à un nouveau dialogue                                                                                        |
| Vérifications   | nouveaux tests `undercover-stream.test.ts`, `undercover-series.test.ts`, `tv-undercover.spec.ts`, `undercover-series.spec.ts` ; parcours existants adaptés au conducteur et à la visibilité contextuelle  |

Les expressions, rôles, règles Undercover et interpréteurs ne sont pas refondus.
Les nouvelles commandes de préparation/publication sont orchestrées par le service
avec l’authentification, les versions et les reçus existants ; aucun résultat de jeu
n’est calculé dans React.

## Vérifications exécutées

`npm run check` : **réussi**, format, **217 tests unitaires/intégration dans 26 fichiers**,
TypeScript strict, build des packages, serveur et Next.js de production.

**197 parcours navigateur sélectionnés réussis**, décomptés sans les répétitions :

| Suite                                                          | Parcours | Formats                             |
| -------------------------------------------------------------- | -------: | ----------------------------------- |
| Accueil                                                        |       16 | desktop, tablette, 390 px, 320 px   |
| Lobby / compagnon                                              |       16 | desktop, tablette, 390 px, 320 px   |
| Régie B5                                                       |        6 | desktop, tablette, mobile           |
| Plateau / édition B6                                           |        9 | desktop, tablette, mobile           |
| Laboratoire B7                                                 |       12 | desktop, tablette, mobile           |
| Dialogues / design system                                      |       12 | desktop, tablette, mobile           |
| Gameplay officiel Undercover                                   |       12 | desktop, tablette, mobile           |
| Aperçu, OBS et reconnexion historiques                         |        9 | desktop, tablette, mobile           |
| Layouts v1 personnalisés et conflits                           |        6 | desktop, tablette, mobile           |
| Thèmes et six expériences                                      |        9 | desktop, tablette, mobile           |
| Sessions, démos et recentrage produit                          |       42 | desktop, tablette, mobile           |
| Séries, médias, partie complète et noms de 80 caractères       |       24 | desktop, tablette, 390 px, 320 px   |
| Préparation, paramètres, erreurs, reçus incertains et stockage |       20 | desktop, tablette, 390 px, 320 px   |
| Broadcast TV réel                                              |        4 | 1920 × 1080 et réductions 390 × 220 |

Le test de focus asynchrone a également été répété sur tablette ; les captures Twitch
ont fait l’objet d’une exécution supplémentaire. Les tests utilisent les véritables
API et des bases temporaires. Certains contrôles ont été répartis entre deux worktrees
de vérification avec les mêmes sources applicatives, sur des ports séparés : aucune
modification du moteur, des permissions ou des limites de production pour faire passer les tests.

Les tests inspectent les payloads HTTP **et SSE** anonymes, l’autorisation des médias,
leur expiration, les écritures interdites, les origines, les anciennes sessions, les
reçus, la copie des préparations et le passage suivant/rejeu. Le scénario UI complet
utilise un GM, trois contextes joueurs indépendants et un spectateur.

Les anciennes assertions qui exigeaient sept panneaux affichés en permanence ont été
remplacées par les attentes TV contextuelles. Les suites de compatibilité v1 continuent
à exercer leurs anciens layouts, sans conversion automatique. Les tests de moteur
archivés sont inclus dans `npm run check`. La suite navigateur de maintenance du Studio
libre (`playwright.legacy.config.ts`) n’a pas été relancée dans cette itération.

Corrections issues des contrôles : noms de 80 caractères qui débordaient sur mobile,
messages réseau compréhensibles, compte de joueurs qui débordait d’une capsule réduite,
position du VS, résultat intermédiaire durable, réactivation du focus, copie figée du
layout d’une demande incertaine et maintien des droits lors du changement de préparation.

Commandes spécifiques de reproduction technique :

```sh
npm run check
node scripts/test-e2e.mjs --config=playwright.series.config.ts --project=desktop --project=tablet --project=mobile --project=small
npm run test:prepare
npx playwright test --config=playwright.tv.config.ts
npm run test:home
npm run test:players
npm run test:games
npm run test:stream
npm run test:layout
npm run test:ux
```

Dans cet environnement Linux, Chromium est sélectionné avec
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Les configurations B5/B6/B7
s’exécutent via le même script avec `--config=playwright.stitch-gm.config.ts`,
`playwright.stitch-broadcast.config.ts` et `playwright.stitch-lab.config.ts`.

## Captures réelles et comparaison

**58 PNG de l’application**, séparés des références approuvées.
Les exemples de contenu sont neutres ; aucune illustration protégée de la maquette
ni photo du studio n’a été embarquée dans l’application.

| Intention A        | Ordinateur                                     | Mobile complet                                |
| ------------------ | ---------------------------------------------- | --------------------------------------------- |
| A1 Préparation     | [PNG](undercover-stream-series/a1-desktop.png) | [PNG](undercover-stream-series/a1-mobile.png) |
| A2 Contenus        | [PNG](undercover-stream-series/a2-desktop.png) | [PNG](undercover-stream-series/a2-mobile.png) |
| A3 Série           | [PNG](undercover-stream-series/a3-desktop.png) | [PNG](undercover-stream-series/a3-mobile.png) |
| A4 Réutilisation   | [PNG](undercover-stream-series/a4-desktop.png) | [PNG](undercover-stream-series/a4-mobile.png) |
| A5 Image manquante | [PNG](undercover-stream-series/a5-desktop.png) | [PNG](undercover-stream-series/a5-mobile.png) |
| A6 Série prête     | [PNG](undercover-stream-series/a6-desktop.png) | [PNG](undercover-stream-series/a6-mobile.png) |

Les fichiers `a*-mobile-viewport.png` et `a*-mobile-viewport-bottom.png` montrent les
positions réelles du CTA à 390 px, en haut et après défilement. Les variantes tablette,
320 px et noms longs figurent dans le même dossier.

| État B                         | Capture OBS réelle                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| B1 Attente                     | [PNG RGBA](undercover-tv/b1-waiting-alpha.png)                                                                          |
| B2 Discussion                  | [PNG RGBA](undercover-tv/b2-discussion-alpha.png)                                                                       |
| B3 Duo anonyme                 | [PNG RGBA](undercover-tv/b3-duo-alpha.png) · [Twitch 390](undercover-tv/b3-duo-alpha-twitch390.png)                     |
| B4 Affectations publiées       | [PNG RGBA](undercover-tv/b4-assignments-alpha.png)                                                                      |
| B5 Vote                        | [PNG RGBA](undercover-tv/b5-vote-alpha.png)                                                                             |
| B6 Élimination intermédiaire   | [PNG RGBA](undercover-tv/b6-elimination-alpha.png) · [Résultat durable](undercover-tv/b6-durable-elimination-alpha.png) |
| B7 Égalité                     | [PNG RGBA](undercover-tv/b7-tie-alpha.png)                                                                              |
| B8 Révélation finale           | [PNG RGBA](undercover-tv/b8-final-reveal-alpha.png) · [Twitch 390](undercover-tv/b8-final-reveal-alpha-twitch390.png)   |
| B9 Victoire / résultat durable | [PNG RGBA](undercover-tv/b9-durable-result-alpha.png)                                                                   |
| B10 Partie suivante            | [PNG RGBA](undercover-tv/b10-next-alpha.png)                                                                            |
| B11 Douze joueurs / focus      | [PNG RGBA](undercover-tv/b11-twelve-player-focus-alpha.png)                                                             |
| B12 Affectations 1–3           | [PNG RGBA](undercover-tv/b12-first-page-alpha.png)                                                                      |
| B13 Affectations 10–12         | [PNG RGBA](undercover-tv/b13-last-page-alpha.png) · [Twitch 390](undercover-tv/b13-twitch390-alpha.png)                 |
| B14 Repli textuel              | [PNG RGBA](undercover-tv/b14-text-fallback-alpha.png)                                                                   |

La [preuve de transparence](undercover-tv/TRANSPARENCY.json) mesure les dimensions,
le canal RGBA, le pourcentage de pixels transparents et l’alpha nul au centre des
19 captures OBS/réductions. Ce sont des captures navigateur, pas un essai OBS physique.

Écarts intentionnels aux maquettes : valeurs issues de l’état réel plutôt que dates,
photos ou noms d’exemple ; réglages secondaires et QA conservés ; nom facultatif d’une
partie ; messages de stockage, reprise et conflit ; nombre de préparations réel.
Les captures de comparaison choisissent Neon Show, sans écraser les préférences
privées ou le thème public des parties existantes. Les layouts personnalisés peuvent
évidemment différer du preset de référence. Les apparitions temporaires dépendent
d’événements réels, et non d’un scénario visuel artificiel.

## Limites et validation humaine

- La série et ses images permanentes restent sur l’appareil de préparation. Le GM
  distant peut piloter et rejouer ; sélectionner la préparation suivante exige
  l’appareil d’origine. Le conducteur complet n’est pas synchronisé vers l’iPhone.
- Le laboratoire rapide historique reste indépendant de la série et de ses images.
  Le parcours série avec images se teste avec les véritables invitations et trois
  contextes joueurs distincts, comme décrit dans le guide.
- Les médias temporaires expirent après une heure sans redépôt. Le serveur unique
  garde au maximum 64 Mio / 128 images ; un redémarrage conserve les textes et perd
  les images temporaires. Le retour de la régie d’origine peut les reconnecter.
- Pas de sauvegarde cloud des préparations, de récupération après effacement du site,
  ni de collecte automatique des blobs locaux devenus inutilisés. Limites détaillées
  dans [l’architecture](../../UNDERCOVER-SERIES-BROADCAST.md).
- Aucun nouveau test physique iPhone, Safari iOS ou OBS n’est revendiqué. La validation
  visuelle des 28 références reste acquise ; la nouvelle application attend ces essais
  humains, distincts du premier workflow OBS précédemment validé.
- Enchères, espion, Store, éditeur de scènes universel, facturation et intégration
  Twitch restent hors périmètre.

[Guide simple iPhone + ordinateur + OBS](../../TEST-UNDERCOVER-SERIES-TV.md).
