# Bloc 5 — audit initial et suivi d’intégration GM

> Audit historique conservé. Le blocage de transfert décrit ci-dessous a été levé
> par la livraison documentaire `fbec4a5`. Voir le [bilan d’intégration actuel](BLOCK-5-DELIVERY.md).

**Mise à jour après transfert** : les 22 références APPROVED sont maintenant disponibles au commit `de673b1`. Le checkpoint UI est en TESTING, avec 197 tests unitaires/intégration et TypeScript strict réussis. Les tests navigateur et captures sont en cours ; aucun statut READY_TO_MERGE revendiqué. Le bilan final suivra dans ce document.

La section suivante conserve l’audit antérieur au transfert ; son blocage documentaire est résolu.

État historique : **BLOCKED**, et non livré. Branche `ux/block-5-gm`, base `73562c1`.
La validation humaine du projet Stitch `11936034876302496963` est acquise dans la
demande du 28 octobre 2026. Aucun nouveau design ni nouvel accord UX n’est demandé.

## Références manquantes

Le registre `docs/ux/redesign/SCREENS.md` et les dossiers APPROVED disponibles
contiennent les blocs 1 à 4. La recherche du Project ID B5 dans `docs/ux` ne retourne
aucune référence. Les captures, HTML disponibles, Screen IDs et SPEC de B5 restent
donc à recevoir via le pont Git existant ou un véritable accès Stitch.

L’orchestrateur a actualisé les branches distantes sans y trouver les nouveaux
exports. Aucun outil MCP Stitch appelable n’est exposé au sous-agent. Les captures
historiques `docs/screenshots/ux8` décrivent un BEFORE ; elles ne remplacent pas les
nouvelles références APPROVED. Aucun PNG, Screen ID ou résultat visuel n’est fabriqué.

## Carte des fichiers et frontières

| Fichier                                                             | Usage réel / décision d’intégration                                                                                                                                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/components/undercover-room.tsx`                       | Enveloppe GM normale : titre, état, navigation Partie / Joueurs / Plateau, présence, accès privés et reset. Préserver le routage vers `StitchLobby` avant installation et le compagnon joueur B4.           |
| `apps/web/src/components/game-panel.tsx`                            | Aiguille les jeux réels vers `PlayPanel` ; également utilisé par le laboratoire et les anciennes définitions. Ne pas appliquer une refonte GM aveuglément à tous ses appels.                                |
| `apps/web/src/components/play-panel.tsx`                            | Action serveur, orateur courant, tours d’indices, progression, vote, résultats, secrets GM repliés, vote délégué, rejeu et journal. Composant partagé avec le laboratoire et les présentations historiques. |
| `apps/web/src/components/game-action.tsx`                           | Transforme les actions autorisées de la projection en commandes ; confirmation lorsque `action.confirmation` est vraie. Partagé avec les jeux déclaratifs.                                                  |
| `apps/web/src/lib/use-session.ts`                                   | Identité, SSE, reconnexion, version, commande en attente persistée et reçu de rejeu. À conserver sans réécriture pour une modification visuelle.                                                            |
| `apps/web/src/components/ui/feedback.tsx`                           | Dialogue accessible partagé : focus, annulation, opération asynchrone, erreurs et double soumission. Toute extension exige coordination B5/B7 et non une copie du composant.                                |
| `apps/web/src/components/broadcast-feed.tsx`                        | Aperçu de l’onglet Plateau, alimenté par son propre flux public. Renderer et projection relèvent de B6.                                                                                                     |
| `apps/web/src/components/application-theme.tsx`                     | Préférence privée d’application ; ne doit jamais changer le thème de l’émission.                                                                                                                            |
| `apps/web/src/app/tokens.css`, `stitch-surfaces.css`, `globals.css` | Styles transversaux. Coordonner une éventuelle extension GM des tokens et règles de dialogue ; préserver les blocs 1 à 4 et la portée publique OBS.                                                         |
| `packages/games/undercover/src/definition.ts`                       | Autorité déclarative 0.2.0 : actions, phases et mécaniques. Aucun changement de règle nécessaire pour l’intégration B5.                                                                                     |

Les contrats, le serveur SQLite/SSE et le moteur ne sont pas modifiés par cette
préparation. Le laboratoire pourra réutiliser la présentation opérationnelle GM,
mais ses accès et outils QA resteront dans B7.

## États et gestes actuellement exécutables

| État réel                          | Geste GM et commande                                                  | Contraintes à préserver                                                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Salon, avant installation          | `game.use-prepared` depuis le salon B3                                | Préparer fige l’effectif et ferme les inscriptions ; ne distribue pas encore les mots. Ne pas refondre B3.                                                                 |
| `preparation`                      | « Distribuer les mots et commencer » : `game.action`, action `deal`   | Distribution secrète aléatoire côté serveur, passage en `discussion`.                                                                                                      |
| `discussion` avec tours en cours   | « Confirmer l’indice et passer au suivant » : action `confirm-clue`   | Indice oral ; la commande GM confirme le passage du joueur courant. Aucun bouton joueur ne fait avancer ce tour.                                                           |
| Tous les tours d’indices terminés  | « Ouvrir les votes » : action `open-vote`                             | Action disponible et autorisée seulement après les tours prévus ; le serveur refuse un vote prématuré.                                                                     |
| `vote` incomplet                   | Consulter `ballot.voted` / `eligible`                                 | Afficher la participation, pas des résultats finaux prématurés. Le GM peut voter pour un participant sans interface par `game.player-action`, selon les mêmes validations. |
| `vote` complet                     | « Révéler le résultat du vote » : action `resolve`, avec confirmation | Attend tous les votes. Décompte, élimination éventuelle, rôle éliminé autorisé et victoire calculés côté serveur.                                                          |
| `result` sans victoire             | « Commencer la manche suivante » : action `next`                      | L’égalité n’élimine personne. Le prochain cycle utilise uniquement les joueurs actifs.                                                                                     |
| `finished`                         | Résultat global de la projection, puis « Rejouer cette partie »       | Victoire civile / Undercover ou nul à la limite de manches. Pas de gagnant déduit par l’interface.                                                                         |
| Rejeu, également possible en cours | `game.restart` avec `runId`, confirmation personnalisée               | Efface votes, éliminations et résultats ; conserve joueurs et accès ; redistribue au prochain démarrage.                                                                   |
| Accès / réglages secondaires       | Copie du lien privé GM ; `session.rename`                             | Ne pas afficher le jeton en clair ni partager ce lien comme invitation joueur.                                                                                             |
| Reset salon                        | `session.reset`, confirmation destructive                             | Retire les joueurs et révoque leurs accès, renouvelle l’invitation ; opération distincte du rejeu.                                                                         |

Les actions disponibles doivent continuer à provenir de `game.actions`, filtrées
par le serveur, plutôt que d’un scénario local. Les indices privés restent dans
la projection du destinataire ; les secrets GM restent dans une zone explicitement
privée, jamais dans le flux public de l’onglet Plateau.

## Tour d’indices et manche : correction de vocabulaire à réaliser

Le code distingue déjà `play.round` (manche de discussion/vote/élimination) et
`play.turns.round` (tour d’indices à l’intérieur de cette manche). `PlayHeading`
affiche « Manche N » et « Tour d’indices N / total ». Les libellés de la définition
contiennent encore « Résultat du tour », « nouveau tour » et « limite de tours ».
L’intégration devra harmoniser les textes de présentation selon cette distinction,
sans modifier les compteurs, les phases ou la définition immuable des parties
existantes. L’incohérence des maquettes « Tour 2 / Manche 2 » ne justifie pas une
nouvelle génération Stitch.

## États techniques indispensables, même hors maquette

- Connexion initiale, synchronisation, reconnexion et accès refusé restent visibles
  avec un libellé ; aucune présence ne sera inventée à partir de la seule inscription.
- `busy`, commande en attente ou connexion interrompue verrouillent les actions.
  Réessayer renvoie la même commande persistée ; ne pas créer un nouvel identifiant
  pour contourner l’idempotence.
- Les anciens fragments `#session` sont ramenés à Partie ; les fragments Partie,
  Joueurs et Plateau restent utilisables. Revenir à l’accueil n’arrête pas la partie.
- Les anciennes définitions 0.1.0 sans tours conservent leur comportement : ne pas
  fabriquer de progression orale obligatoire à partir de la maquette 0.2.0.
- Les trois thèmes d’application restent disponibles, indépendamment du thème
  serveur de l’émission, y compris après rejeu.

## Vérifications prévues après réception des références

Sources de tests existantes inspectées, **sans exécution revendiquée** dans cet audit :

- `tests/undercover.test.ts` : tours complets, refus prématuré, survivants,
  configuration, compatibilité ancienne et règles de victoire.
- `tests/undercover-sessions.test.ts` : distribution et projections isolées,
  simultanéité, idempotence, délégation GM, rejeu avec mêmes accès et reconnexion.
- `tests/undercover-persistence.test.ts` : restauration et commandes après reprise.
- `tests/e2e/official-games.spec.ts` : partie réelle multi-contextes jusqu’à la
  victoire, égalité, vote délégué et rejeu.
- `tests/e2e/design-system.spec.ts` : navigation opérationnelle, annulation et focus
  du dialogue de rejeu, reset rejeté puis confirmé, mobile et copie privée.
- `tests/e2e/ux-experiences.spec.ts` : thèmes séparés, six expériences et stockage
  indisponible. Les suites accueil et joueurs protègent les blocs 1 à 4.

Après intégration : tests unitaires/intégration pertinents, parcours `test:games`,
`test:design`, `test:ux`, régression accueil/joueurs, TypeScript strict, build et
formatage. Coordonner les ports et sorties des suites navigateur entre worktrees.
Les nombres historiques de tests réussis ne valent pas une nouvelle exécution.

## Captures et comparaison à effectuer

Préparation/distribution, tour d’indices 1 puis 2, vote incomplet puis complet,
confirmation de révélation, résultat intermédiaire, manche suivante, victoire et
nul, joueurs/présence, accès/réglages, confirmation de rejeu et reset. Associer chaque
capture à son Screen ID réel dès réception des références.

Utiliser `implementation-desktop.png` et `implementation-mobile.png` dans des
dossiers distincts de scénario si nécessaire. Vérifier environ 390 px, petit mobile,
tablette et desktop : aucun débordement horizontal, cibles tactiles confortables,
safe areas, CTA visibles, dialogue ouvert et navigation clavier. Ne pas écraser
les fichiers `approved.*`. Aucune capture d’intégration B5 n’est produite ici.

Un test Chromium ne prouve ni Safari sur iPhone physique, ni VoiceOver, ni OBS réel.
La validation humaine du workflow OBS précédent reste acquise pour le parcours
observé ; elle ne s’étend pas à une interface B5 qui n’a pas encore été intégrée.

## Reprise du travail

Recevoir les exports approuvés et leurs identifiants par Git, ou rétablir un outil
Stitch authentifié accessible, suffit pour reprendre : compléter les SPEC depuis
le comportement ci-dessus, comparer les références, puis intégrer/tester dans ce
worktree. Aucune fusion, aucun déploiement et aucune nouvelle validation UX ne sont
nécessaires pour commencer cette intégration autorisée.

Sur la machine déjà authentifiée, cette lecture donne les IDs exacts du projet :

```sh
stitch find screens --project 11936034876302496963 --fields id,title --format json
```

Pour chaque référence approuvée, le pont existant conserve capture et HTML disponible :

```sh
npm run stitch:sync -- --project 11936034876302496963 --screen <ID_APPROVED> --slug <slug> --approved
```

Les placeholders doivent être remplacés par les véritables identifiants et dossiers.
La validation humaine est déjà acquise ; seul le transfert des artefacts manque.
