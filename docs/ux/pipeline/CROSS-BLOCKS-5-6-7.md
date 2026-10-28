# Intégration croisée des blocs 5, 6 et 7

> Bilan historique des vérifications avant fusion. Les trois blocs ont ensuite été
> réunis sur `integration/blocks-5-6-7`, après autorisation explicite. Voir le
> [bilan de la version intégrée](../../INTEGRATION-BLOCKS-5-6-7.md).

Les 43 références humaines APPROVED du commit `fbec4a5` ont été appliquées aux trois
worktrees en conservant leurs commits d’audit. Aucun appel Stitch n’est nécessaire.
Les `approved.png`, HTML et rendus de référence restent intacts : **129 empreintes
vérifiées par worktree, soit 387 contrôles**. Les SPEC approuvées ne sont pas réécrites.

## Organisation et périmètre

| Branche                | Propriété applicative                                         | Références / captures réelles |
| ---------------------- | ------------------------------------------------------------- | ----------------------------- |
| `ux/block-5-gm`        | Régie, carte de pilotage et confirmations GM                  | 22 / 22                       |
| `ux/block-6-broadcast` | Spectateur, renderer public, aperçu et disposition            | 14 / 14                       |
| `ux/block-7-lab`       | Enveloppe QA privée, identités et reprise d’un reçu incertain | 7 / 7                         |

Les branches restent séparées. La vérification croisée utilise une copie temporaire
sur un worktree détaché `validation-5-6-7`, **sans fusion, PR ni déploiement**. Elle
n’est pas une quatrième version publiée de l’application. Pour essayer les trois
refontes ensemble sur le Mac, il faudra autoriser une version d’assemblage ultérieure.

Les commits d’audit `26aa6b1`, `027302a`, `40bf952` sont conservés. Les anciens rapports
`BLOCK-n-INTEGRATION.md` décrivent cet audit historique ; les rapports `BLOCK-n-DELIVERY.md`
décrivent la livraison actuelle.

## Coordination des fichiers communs

- B5 conserve les commandes dans `PlayPanel` / `GmGamePanel`. B7 monte le vrai panneau
  du rôle sélectionné et ne réimplémente pas ses règles. Une seule perspective privée
  est montée ; sa clé contient l’identité, et ses requêtes utilisent le bon accès.
- B6 possède `BroadcastFeed` / `BroadcastOverlay`. Le comparatif B7 monte ce même
  renderer avec son **propre flux public**, jamais un état GM filtré dans React.
- `tokens.css` est le seul fichier applicatif modifié par B5 et B6 : B5 ajoute le
  scope `.gm-studio` à trois groupes existants ; B6 ajoute la palette publique Neon Show
  en fin de fichier. Les deux modifications ont été conservées dans la copie de test.
- Les aides de navigation et assertions navigateur communes sont identiques dans les
  trois branches. Elles ouvrent les véritables groupes d’accès, gèrent les présentations
  antérieures et approuvées, et conservent les contrôles métier. Le runner range les
  traces de chaque nouvelle suite dans un dossier distinct.
- Aucun changement du moteur, des contrats, des API serveur, de SQLite, des projections
  ou des permissions. Aucune dépendance ajoutée. La correction de reçu B7 est cliente :
  relire le reçu persisté avant une nouvelle tentative évite de rejouer une commande
  après une réponse perdue ; elle ne contourne pas l’idempotence serveur.

## Vérifications exécutées

**197 tests unitaires/intégration**, dans 24 fichiers, passent dans la copie croisée
et dans chacun des trois worktrees. TypeScript strict, formatage et build de production
passent. Les builds individuels sont remis sur l’origine serveur par défaut.

**218 parcours navigateur distincts Chromium passent**, dont 27 nouveaux pour B5–B7.
Les relances après correction ne sont pas additionnées au total.

| Suite                                                                | Parcours réussis |
| -------------------------------------------------------------------- | ---------------: |
| Sessions, Studio historique fermé et recentrage produit (`test:e2e`) |               42 |
| Jeux officiels (`test:games`)                                        |               12 |
| Dialogues / design system (`test:design`)                            |               12 |
| Six expériences / thèmes (`test:ux`)                                 |               12 |
| Accueil (`test:home`)                                                |               16 |
| Joueurs et lobby (`test:players`)                                    |               16 |
| Aperçu / OBS (`test:stream`)                                         |                9 |
| Layout Undercover (`test:layout`)                                    |                6 |
| Maintenance historique explicite (`test:legacy`)                     |               60 |
| Nouvelle régie (`playwright.stitch-gm.config.ts`)                    |                6 |
| Nouveau Broadcast (`playwright.stitch-broadcast.config.ts`)          |                9 |
| Nouveau laboratoire (`playwright.stitch-lab.config.ts`)              |               12 |
| Laboratoire en développement (`test:lab`)                            |                6 |
| **Total**                                                            |          **218** |

Les suites de production utilisent des bases SQLite temporaires et des processus
isolés par viewport ; les limites et autorisations serveur restent actives. Les
parcours font agir de vrais clients GM, joueurs distincts et public. Les vérifications
incluent refus prématuré, vote unique, deux tours oraux, résultat, rejeu, révocation,
reconnexion, thème OBS indépendant, focus des confirmations et conflits de layout.
Le laboratoire de développement contrôle aussi les erreurs navigateur/hydratation.

Les viewports sont 1440 × 1000, 768 × 1024 et 390 × 844. Les suites existantes UX,
accueil et joueurs couvrent aussi 320 × 568. Les sept captures OBS sont en RGBA
1920 × 1080, avec alpha nul hors panneaux. Les 12 noms longs (32 caractères) et les
quatre dispositions sont testés. Cela ne garantit pas la lisibilité d’un layout
arbitrairement rétréci par le GM.

Commandes nouvelles, après `npm ci` et `npm run build` :

```sh
node scripts/test-e2e.mjs --config=playwright.stitch-gm.config.ts
node scripts/test-e2e.mjs --config=playwright.stitch-broadcast.config.ts
node scripts/test-e2e.mjs --config=playwright.stitch-lab.config.ts
```

Chaque configuration nouvelle est présente dans sa branche propriétaire. Les suites
existantes conservent leurs commandes npm. Dans le Cloud, Chromium a été sélectionné
avec `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.

## Régressions identifiées et corrigées

- Le bas des réglages GM était couvert par la barre d’action mobile : réserve de place
  avec safe area. L’instruction orale héritée était masquée par une règle CSS : scope corrigé.
- Le titre des anciennes parties publiques en attente et leur indicateur de connexion
  avaient disparu : rétablis. Le lecteur intégré ne présente son indicateur que si
  son état de connexion est explicitement fourni ; le laboratoire conserve le sien,
  sans doublon ni indication fictivement connectée.
- Le laboratoire conservait un ancien callback lors d’une erreur de rejeu : reprise
  du même identifiant, corps et version de commande, testée avec réponse perdue.
- Les cartes OBS après révélation pouvaient comprimer les noms et couper les mots
  finaux : tailles adaptatives, disposition compacte des petites cartes et grille
  de révélations corrigées. Un contrôle géométrique vérifie les noms, états et
  révélations, y compris douze joueurs dans les quatre presets.
- Les anciens sélecteurs de tests pointaient des contrôles déplacés : navigation réelle
  adaptée, sans supprimer les assertions ni neutraliser les tests.

## Écarts assumés et validation humaine

- Les noms, compteurs, capacités et actions viennent du serveur, pas du contenu fictif
  Stitch. Avant distribution, le nombre de tours n’est pas réinventé lorsqu’il n’est
  pas présent dans la projection GM ; il apparaît dès que le serveur le fournit.
- Six joueurs restent disposés en **4 + 2** dans la grille automatique existante,
  plutôt qu’en six colonnes comme certaines maquettes. Les layouts enregistrés et
  leurs positions ne sont pas déplacés silencieusement.
- B7 conserve les informations privées GM et le journal repliés ; son aperçu contient
  les sept vrais widgets B6, comme demandé, au lieu du dessin simplifié Stitch.
- Le défaut d’apparence de l’application reste inchangé. Les captures utilisent Neon
  Show ; le thème public reste fixé séparément à la session.
- Aucune interaction spectateur inexistante, aucun autre jeu ni connexion Twitch
  simulés. Le laboratoire reste un outil privé de démonstration, pas une identité publique.

Les PNG `implementation-*` sont des captures navigateur réelles, séparées des artefacts
APPROVED. Les captures B7 utilisent la copie de test croisée pour montrer son intégration
avec les véritables nouveaux panneaux GM et Broadcast. Elles ne représentent pas une
branche fusionnée. Les index `block-n-captures.json` donnent chemin, dimensions et SHA-256.

**Designs validés humainement ; implémentation vérifiée techniquement.** Les nouveaux
rendus restent à vérifier sur véritable iPhone, Safari/VoiceOver et OBS réel. Le workflow
OBS précédemment validé par l’utilisateur conserve son statut pour le parcours observé.

Guide : [Tester sur iPhone, ordinateur et OBS](../../TEST-APPROVED-BLOCKS-5-6-7.md).
Résultats structurés : [cross-validation.json](cross-validation.json).
