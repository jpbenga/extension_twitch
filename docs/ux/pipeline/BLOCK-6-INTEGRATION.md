# Bloc 6 — préparation de l’intégration Broadcast / Spectateur / OBS

État : **BLOCKED**, base `73562c1`, branche `ux/block-6-broadcast`.
Projet Stitch approuvé humainement : `10132472591870592947`.
Audit réalisé le 28 octobre 2026, sans modification de l’application.

La validation UX est acquise. Le blocage concerne uniquement la disponibilité des
références : aucun export ni Screen ID de ce projet dans `docs/ux` de cette base.
Le registre `docs/ux/redesign/SCREENS.md` contient les Blocs 1 à 4 seulement.
Les anciennes captures `docs/screenshots` documentent l’existant ; elles ne sont
pas les références APPROVED du Bloc 6 et ne doivent jamais leur être substituées.
L’orchestrateur a également constaté l’absence d’outils MCP Stitch utilisables.

## Fichiers et comportements réels

| Zone                     | Fichiers                                                                                                                                        | Comportement à conserver                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renderer public partagé  | `apps/web/src/components/broadcast-overlay.tsx`, `broadcast-feed.tsx`, `apps/web/src/app/broadcast.css`                                         | `BroadcastFeed` ouvre `useSession(id, "public")`, vérifie audience et identifiant, puis transmet exclusivement cette projection à `BroadcastOverlay`. Même composant pour aperçu, OBS et comparatif du laboratoire.                                                 |
| Source OBS               | `apps/web/src/app/sessions/[id]/obs/page.tsx`                                                                                                   | Monte uniquement le flux public dans `.obs-output`, sans commande, shell GM ou outil QA. Le CSS rend `html` et `body` transparents et centre un cadre strictement 16:9.                                                                                             |
| Aperçu d’émission        | `apps/web/src/components/stream-preview.tsx`, route `sessions/[id]/stream`                                                                      | Scène fictive ou damier de contrôle autour du véritable renderer. Lien OBS public, explication 1920 × 1080, découverte des interactions spectateur en lecture seule. Aucun flux Twitch réel.                                                                        |
| Spectateur classique     | `apps/web/src/components/public-session.tsx`, `session-room.tsx`, route `sessions/[id]/public`                                                  | `/public` est une interface publique historique distincte du renderer de diffusion. Préserver ses liens, son état et son absence de commandes GM ; ne pas prétendre qu’elle utilise déjà `BroadcastOverlay`.                                                        |
| Éditeur par partie       | `apps/web/src/components/session-layout-editor.tsx`                                                                                             | Capacité GM pour enregistrer ; flux public indépendant pour le canvas. Brouillon et base en `sessionStorage`, avertissement de fermeture, comparaison avec la disposition distante, conflit bloquant sans écrasement silencieux, reprise d’une commande incertaine. |
| Manipulation du layout   | `apps/web/src/components/undercover-layout-editor.tsx`, `apps/web/src/lib/undercover-layout.ts`                                                 | Déplacement et redimensionnement par Pointer Events, clavier et champs numériques ; retour au défaut confirmé ; ordre visuel des places indépendant des rôles et de la parole.                                                                                      |
| Modèle de layout         | `packages/contracts/src/undercover-layout.ts`                                                                                                   | Sept widgets obligatoires, quatre presets, géométrie bornée et aucune injection HTML/CSS/URL. Conserver le schéma et les layouts persistés.                                                                                                                         |
| Projection et sauvegarde | `packages/engine/src/lobby.ts`, `apps/server/src/session-service.ts`, `apps/server/src/official-games.ts`, `packages/contracts/src/sessions.ts` | Commande `overlay.configure` réservée au GM, validation, transaction, version attendue et reçu existants. `overlayLayout` et `broadcastTheme` sont copiés explicitement dans la projection publique.                                                                |
| Effets éphémères         | `apps/web/src/lib/public-cues.ts`, `broadcast-feed.tsx`                                                                                         | Première connexion et nouvelle époque SSE établissent une base sans animation historique. Présence seule et versions anciennes ignorées. Effet expirant après 2,6 s ; journal borné aux trois derniers événements de la partie courante.                            |
| Thèmes                   | `packages/contracts/src/themes.ts`, `apps/web/src/app/tokens.css`, `application-theme.tsx`                                                      | Broadcast Studio, Neon Show et On Air Premium. Le thème de diffusion vient de la session, avec repli historique ; la préférence privée du navigateur ne recolore pas OBS.                                                                                           |

Le renderer montre déjà : préparation, tour d’indices et joueur courant, manche,
actifs/éliminés, progression publique des votes, décompte une fois résolu, égalité,
élimination et résultat final. Les rôles ne sont affichés que s’ils sont présents
dans la projection publique autoritaire. Les mots ne doivent jamais être ajoutés
à partir d’un état GM ou joueur pour remplir une maquette.

## Sept blocs et quatre dispositions

Widgets : `header`, `phase`, `round`, `players`, `vote`, `result`, `events`.
Libellés : Titre, Phase et indices, Manche, Joueurs, Progression du vote, Résultat,
Événements publics. Presets : Équilibré, Joueurs en bas, Joueurs à gauche, Centré.

Le cadre de référence est de 1920 × 1080 avec marge de sécurité de 24 px. Les
cartes sont liées aux places d’inscription 1–12, jamais aux camps secrets.
Les modes grille, horizontal, vertical et libre sont déjà exécutés par le même
renderer. La sauvegarde applique le layout à la même URL OBS ; rejouer conserve
la disposition et les accès selon les règles existantes.

## Points de contrôle demandés par l’utilisateur

**Progression orale tronquée.** Le code rend bien le tour d’indices, le nom de
l’orateur et le nombre de passages confirmés. Le bloc `phase` possède une hauteur
minimale de 140 px ; le titre mesure `1.9cqw`, le corps `1.3cqw`, et tous les
widgets positionnés ont `overflow: hidden` dans `broadcast.css`. Un nom long qui
revient à la ligne peut donc augmenter la hauteur utile au-delà du rectangle.
C’est une piste vérifiable dans le code, pas un diagnostic visuel confirmé sur
les maquettes manquantes. Il faut mesurer le contenu aux quatre presets puis
adapter sa composition sans déplacer ou agrandir silencieusement les layouts
déjà enregistrés.

**Noms longs.** Les cartes de joueurs en layout utilisent explicitement
`white-space: nowrap`, `text-overflow: ellipsis` et `overflow: hidden`. L’audit
confirme donc une troncature possible, pas l’acceptabilité du résultat à l’antenne.
Prévoir des noms à la limite réelle, 3 et 12 participants, les quatre presets et
un rectangle de taille minimale. Conserver le nom complet dans les vues de
lecture adaptées sans introduire d’information privée dans le rendu public.

**Transparence.** Un fond uni dans un PNG Stitch ne doit pas devenir le fond de
la source. Seuls les panneaux publics sont opaques ou semi-opaques. Tester
l’alpha réel hors panneaux et un arrière-plan contrasté dans l’aperçu.

**Manipulation réaliste.** Préserver les alternatives numériques et clavier au
glissement, les bornes, les sept blocs et l’alerte de chevauchement. Vérifier la
petite taille du canvas mobile sans promettre le confort d’un éditeur desktop.

## Coordination transverse requise

- `BroadcastOverlay`, `BroadcastFeed` et `broadcast.css` : responsabilité de
  rendu B6, consommation B7. Le laboratoire doit intégrer le même composant.
- `tokens.css`, `brand-fonts.css`, `globals.css`, `ProductFrame` et primitives UI :
  partagés avec B1–B5/B7. Toute modification doit être arbitrée par l’orchestrateur,
  avec sélecteurs scoped et vérification des trois thèmes.
- `use-session.ts`, contrats et moteur : invariants à conserver, pas de réécriture
  de transport, de projection ou de gameplay pour cette intégration visuelle.
- `package.json`, configurations Next/Playwright et helpers de tests : changements
  communs à coordonner, notamment les ports des suites et leur exécution séquentielle.

Aucun fichier transverse n’a été modifié par cet audit. Aucune branche fusionnée,
aucun déploiement et aucun nouveau design créé.

## Tests existants identifiés, non exécutés dans cet audit

| Sources                                                       | Vérifications pertinentes                                                                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/public-cues.test.ts`                                   | Ouverture tardive, événement unique, reconnexion, présence, désordre de versions, reset et journal courant.                                                      |
| `tests/undercover-layout.test.ts`                             | Sept blocs, quatre presets indépendants, géométrie et bornes, ordre et cartes, entrées dangereuses refusées.                                                     |
| `tests/themes.test.ts`, `tests/home-themes.test.ts`           | Identifiants officiels et contrastes des palettes ; non-régression des surfaces B1–B4.                                                                           |
| `tests/e2e/stream-preview.spec.ts` / `npm run test:stream`    | Partie réelle multi-contextes jusqu’au résultat, rendu identique aperçu/OBS, confidentialité, transparence 1920 × 1080, reconnexion et spectateur lecture seule. |
| `tests/e2e/undercover-layout.spec.ts` / `npm run test:layout` | Préparation, manipulation réelle, douze cartes, sauvegarde, contexte GM distinct, conflit et conservation au rejeu.                                              |
| `npm run test:ux`, `test:games`, `test:players`, `test:home`  | Thèmes et parcours, règles Undercover, compagnon et accueil à préserver.                                                                                         |

Après intégration : formatage ciblé, tests unitaires/intégration, TypeScript strict,
build et suites navigateur pertinentes, puis contrôle global coordonné. Ces étapes
ne sont pas déclarées réussies par ce document ; aucune suite métier ou navigateur
n’a été relancée pour une intégration qui n’a pas encore commencé.

L’orchestrateur a vérifié séparément la base commune `73562c1` : `npm test`
**197/197 tests** sur 24 fichiers, puis `npm run typecheck` avec code de sortie 0.
Ces résultats concernent uniquement l’application existante ; ils ne valident
aucune nouvelle interface B6. Dans ce worktree, les deux documents ont été
formatés avec Prettier, le JSON a été parsé et `git diff --check` a réussi.

## Captures à produire après réception des références

Le pont Git existant permet de débloquer ce travail sans nouvelle validation UX.
Sur le Mac déjà authentifié, relever les références du projet en lecture seule :

```sh
stitch find screens --project 10132472591870592947 --fields id,title --format json
```

Puis synchroniser chaque écran précis déjà approuvé avec un slug distinct :

```sh
npm run stitch:sync -- --project 10132472591870592947 --screen <ID_APPROVED> --slug <slug> --approved
```

Relire les captures, conserver les Screen IDs et les rapports/SPEC, puis committer
et pousser les exports pour les rendre disponibles au Cloud. La commande ne doit
pas sélectionner arbitrairement un écran depuis sa date ou son titre. Aucun accès
Google, jeton ou diagnostic d’authentification ne doit être ajouté au dépôt.

Associer chaque état au vrai Screen ID synchronisé et à sa capture APPROVED,
jamais à un identifiant inventé. Capturer avec les commandes du vrai serveur :

1. OBS 1920 × 1080 : préparation, joueur courant et progression des indices,
   participation au vote, élimination, égalité, victoire et partie nulle.
2. Spectateur : desktop et mobile 390 px ; vérifier lecture seule et noms longs.
3. Aperçu : desktop/mobile, scène fictive puis overlay seul ; comparer le DOM
   durable avec la source OBS recevant le même état public.
4. Layout : desktop/mobile, chaque preset, déplacement/redimensionnement réel,
   sauvegarde et conflit entre deux accès GM distincts.

Produire `implementation-desktop.png`, `implementation-mobile.png` et les états
OBS nommés explicitement, dans les dossiers des références correspondantes.
Garder les exports `approved.*` intacts et vérifier les différences avant livraison.
Ne pas publier de jetons ou liens privés dans les captures.

Un test Chromium de transparence ou de source navigateur n’est pas un test OBS
physique. Le workflow OBS antérieur validé humainement reste acquis ; les nouveaux
layouts et rendus B6 ne disposent pas encore d’une validation d’implémentation.

**BLOCK_6: BLOCKED** — réception des références APPROVED nécessaire, sans nouvelle
validation UX demandée.
