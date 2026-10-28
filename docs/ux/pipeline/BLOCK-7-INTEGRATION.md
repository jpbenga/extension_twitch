# Bloc 7 — préparation de l’intégration Lab / QA

> Audit historique conservé. Le blocage de transfert décrit ci-dessous a été levé
> par la livraison documentaire `fbec4a5`. Voir le [bilan d’intégration actuel](BLOCK-7-DELIVERY.md).

État : **BLOCKED — références visuelles non reçues**. Base auditée : `73562c1`.
Branche isolée : `ux/block-7-lab`. Projet Stitch : `8710675424358674545`.

La validation humaine explicite du 28 octobre 2026 est acquise. Elle n’est pas
remise en question. Ce document est un audit du code et un plan d’intégration :
il ne livre pas l’interface B7 et ne remplace pas les captures APPROVED.

## Références manquantes et reprise

Le checkout contient les références B1 à B4 dans `docs/ux/redesign`, mais aucune
capture, Screen ID ou SPEC du projet B7. La recherche de son Project ID dans la
documentation ne donne pas de référence préexistante. L’orchestrateur a également
actualisé les branches distantes : aucune livraison B5/B6/B7 n’y a été identifiée.
Aucun outil MCP Stitch n’est exposé dans ce runtime pour consulter ce projet.

Pour reprendre sans nouvelle validation UX : recevoir les exports exacts par le
pont Git existant, ou disposer d’un accès Stitch opérationnel ; relever les Screen
IDs, lire chaque PNG approuvé et son HTML disponible, compléter les SPEC à partir
uniquement du comportement réel ci-dessous, puis intégrer sur cette branche.
Conserver les `approved.*` intacts ; enregistrer les captures de l’application sous
des noms `implementation-*` distincts. Aucun écran ni identifiant n’est inventé.

Le pont existant peut être utilisé sur la machine locale déjà authentifiée pour
transférer les références, sans recommencer la conception ni la validation :

```sh
stitch find screens --project 8710675424358674545 --fields id,title --format json
npm run stitch:sync -- --project 8710675424358674545 --screen <ID_APPROVED> --slug <slug> --approved
```

Les valeurs entre chevrons sont des placeholders à remplacer par les Screen IDs
réellement approuvés et un dossier explicite, pas des commandes prêtes à lancer
telles quelles. Versionner ensuite les exports et SPEC pour leur lecture dans le
Cloud. Aucun de ces appels Stitch n’a été exécuté pendant cet audit.

## Carte fonctionnelle vérifiée

| Fichier                                           | Rôle actuel et contrainte à conserver                                                                                                                                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/play/lab/[id]/page.tsx`         | Route officielle qui monte `CreatorLaboratory` avec `context="play"`. Le nom historique du composant ne signifie pas réouverture du Studio libre.                                                                                             |
| `apps/web/src/components/creator-laboratory.tsx`  | Lecture des accès locaux, choix GM/joueur/spectateur, état de connexion, comparatif, liens privés, reprise de préparation, rejeu et test de permission.                                                                                       |
| `apps/web/src/lib/creator-lab.ts`                 | Schéma strict des données de l’essai, conservation par onglet, préparation par API, commandes avec reçus, reprise après résultat réseau incertain et rejeu en plusieurs étapes persistées.                                                    |
| `apps/web/src/components/official-game-setup.tsx` | Crée la session officielle avec paramètres validés, conserve la demande incertaine, enregistre le Lab et prépare les joueurs réels de démonstration. Le mode rapide rejoint `/play/lab/<id>` ; les vrais invités rejoignent la régie normale. |
| `apps/web/src/lib/use-session.ts`                 | Charge uniquement l’identité demandée ; valide audience, session et participant sur chaque projection ; reconnexion SSE et reçu de commande incertaine.                                                                                       |
| `apps/web/src/components/game-panel.tsx`          | Vue GM/joueur incorporée au Lab, avec `hideRestart` afin de ne pas multiplier les commandes de rejeu. Le joueur Undercover utilise le compagnon B4 existant.                                                                                  |
| `apps/web/src/components/public-session.tsx`      | Perspective spectateur classique, en lecture seule ; le sélecteur du Lab n’accorde aucun droit serveur.                                                                                                                                       |
| `apps/web/src/components/broadcast-feed.tsx`      | Flux public indépendant du comparatif, transmis à `BroadcastOverlay` ; thème issu de la projection publique.                                                                                                                                  |
| `apps/web/src/components/copy-link.tsx`           | Copie des liens, y compris repli HTTP LAN ; ne pas afficher les jetons privés en clair dans la présentation ordinaire.                                                                                                                        |
| `apps/web/src/components/ui/feedback.tsx`         | Confirmation personnalisée du rejeu et feedback accessibles. Ne pas réintroduire `window.confirm`.                                                                                                                                            |

`official-games-lab.tsx` est un composant historique lié au Studio ; ce n’est pas
le point de lancement officiel à reconstruire pour B7. L’ancien `/lab` est un autre
outil de développement, réservé au mode de maintenance explicite. B7 doit conserver
le laboratoire des jeux officiels sans activer le Studio ni ses API.

## États et commandes réels

- Chargement : ouverture de l’essai, avant lecture du stockage de l’onglet.
- Accès absent : message indiquant que les accès ne sont pas dans cet onglet ;
  retour à la configuration pour un nouveau test. Aucun accès multirôle n’est
  récupéré depuis un endpoint public.
- Accès local invalide ou stockage refusé : erreur compréhensible, sans inventer
  d’accès de remplacement ni afficher le document contenant les capacités privées.
- Préparation rapide interrompue : `mode === "quick" && !ready` propose
  « Reprendre la préparation ». `prepareLab` réutilise la session, les identifiants
  de jonction et la commande en attente ; il ne crée pas un autre essai.
- Point de vue : GM, joueurs ayant un ID réel, puis spectateur. Plus de deux joueurs
  utilisent aujourd’hui un sélecteur ; sinon un contrôle segmenté. La préférence
  est conservée sous `xt:lab-perspective:<id>` et validée par rapport aux joueurs.
- Changement de perspective : `LabView` est remonté avec une clé par audience ;
  chaque `useSession` reçoit le rôle exact et vérifie la projection correspondante.
- Comparatif : `PublicMirror` monte `BroadcastFeed(id, scene=true)` avec son propre
  flux public. Le code ne fabrique pas une projection publique à partir de la vue GM.
- Accès : lien privé GM pour l’iPhone, ouverture des joueurs séparément, liens
  publics de plateau/aperçu/OBS et accès GM à l’éditeur de disposition existant.
- Rejouer : confirmation personnalisée puis `restartLab` envoie `game.restart` sur
  le run courant. Les accès sont conservés ; `restartStage` et `pending` permettent
  de reprendre une réponse incertaine sans doubler le reset. Les anciens essais
  peuvent aussi posséder `startAction`, à préserver pour leur compatibilité.
- Nouveau test : navigation vers la configuration ; ce n’est pas un rejeu du run
  courant, ni un effacement du salon existant.
- Outil QA réel : `probePlayerAccess` lit la projection du premier joueur avec son
  propre accès puis tente `session.rename`. Seul un refus 403 confirme le contrôle
  attendu ; un succès déclenche un message de défaut de sécurité. Aucun bouton QA
  inventé, pas de mutation directe d’état interne.

## Invariants de confidentialité et de périmètre

Le Lab est un contexte privilégié du testeur : son document local contient les
capacités GM et des joueurs. Il ne doit être partagé avec aucun participant. Un
joueur réel reçoit uniquement son invitation ou son propre lien privé. Les liens
GM/joueurs portent la capacité dans le fragment puis l’importent dans un stockage
indexé par session et audience. Les liens publics n’emportent aucune capacité GM.

Conserver le document du Lab et ses reçus en `sessionStorage` par onglet, sans
fusionner les accès dans une identité unique. Un rechargement ne doit pas choisir
silencieusement un autre joueur. Les commandes restent soumises aux permissions,
versions et reçus du vrai serveur SQLite/SSE. La connexion d’un spectateur ne doit
lire que les données publiques, sans invitation ni mot privé avant révélation.

La séparation QA concerne l’enveloppe du Lab, pas un prétendu serveur capable
d’usurper toutes les identités. Ne pas déplacer le sélecteur, les liens individuels
ou le test de refus dans la régie normale, le compagnon B4 ou le plateau public.

## Coordination B5/B6 et fichiers transversaux

- **B5 :** le Lab réutilise `GamePanel`/`PlayPanel`. Une adaptation GM doit rester
  compatible avec leur incorporation au Lab et l’option `hideRestart`. Ne pas
  recopier les règles GM dans une interface spéciale QA.
- **B6 :** le comparatif utilise déjà le même `BroadcastFeed`/`BroadcastOverlay`
  que l’aperçu et OBS. Conserver ce raccordement au vrai rendu à sept blocs et aux
  quatre dispositions ; ne pas reproduire un panneau statique d’une maquette B7.
- **Partagés :** `ProductFrame` via `CreatorFrame`, primitives UI, feedback,
  `copy-link`, tokens et thèmes, styles `experience.css`, `design-system.css` et
  `creator.css`, chargement global CSS, `useSession` et renderer Broadcast.
  Toute modification transversale doit être coordonnée, pas appliquée séparément
  par chaque bloc. Un style B7 dédié et limité à son enveloppe devra être préféré
  si les références le permettent.
- Les trois thèmes privés restent disponibles. Le thème du comparatif est celui
  de l’émission conservé par le serveur, jamais la préférence privée du Lab.
- Le contraste des petits libellés est une correction demandée par l’utilisateur ;
  aucune mesure de contraste de la nouvelle maquette n’est revendiquée sans export.

## Vérifications à exécuter après intégration

Les sources suivantes ont été lues ; **aucune suite de gameplay, navigateur,
TypeScript ou build n’a été exécutée pour cette préparation documentaire**.
Les résultats des jalons antérieurs ne valent pas validation de B7. L’orchestrateur
a vérifié séparément la base globale `73562c1` pendant cette itération : `npm test`
a réussi **197 tests dans 24 fichiers** et `npm run typecheck` est sorti avec le
code 0. Ces résultats concernent le code de départ inchangé, pas une nouvelle UX
B7 ni un parcours navigateur de cette intégration.

| Source / commande                                                                                                                    | Vérification attendue                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/e2e/product-focus.spec.ts`                                                                                                    | Laboratoire indépendant du Studio ; préparation avec reçu réutilisé ; anciennes routes et stockage conservés.                                                                  |
| `tests/e2e/official-games.spec.ts` / `npm run test:games`                                                                            | Trois identités distinctes, transfert privé GM vers un autre contexte, progression et rejeu réels.                                                                             |
| `tests/e2e/stream-preview.spec.ts` / `npm run test:stream`                                                                           | Comparatif public, même renderer que OBS, reconnexion sans anciens effets, absence de secrets et transparence.                                                                 |
| `tests/e2e/ux-experiences.spec.ts` / `npm run test:ux`                                                                               | Thèmes indépendants et interfaces sur petit mobile, mobile, tablette et desktop.                                                                                               |
| `tests/e2e/creator-ux.spec.ts` / `npm run test:legacy`                                                                               | Compatibilité de la reprise exacte d’essai et du rejeu après reçu perdu, uniquement dans le contexte historique explicitement activé.                                          |
| `tests/lab/official-games.spec.ts` / `npm run test:lab`                                                                              | Parcours local de développement sans erreur navigateur, Next.js ou hydratation. Cette suite active le mode de maintenance ; elle ne remplace pas les tests du produit compilé. |
| `tests/sessions.test.ts`, `tests/product-focus.test.ts`, `tests/undercover-sessions.test.ts`, `tests/undercover-persistence.test.ts` | Permissions, séparation des projections, reçus, paramètres et état conservés au redémarrage.                                                                                   |
| `npm run typecheck`, `npm run build`, `npm run format:check`                                                                         | Contrôles globaux, puis tests croisés B5/B6/B7 sur une copie d’essai sans fusion des branches livrées.                                                                         |

Ajouter des assertions de comportement pour les nouveaux regroupements : rôle
annoncé à chaque changement, accès sans fuite, reprise du même essai après perte
réseau, annulation/confirmation du rejeu, état d’accès absent, focus et clavier.
Ne pas supprimer les assertions métier sous prétexte de déplacement de contrôles.

## Plan de captures réelles

Après réception des références, associer chaque Screen ID approuvé à son état et
viewport exacts ; ne pas préjuger leur nombre. Couvrir au minimum les intentions
annoncées : GM desktop/mobile, joueur privé avec aperçu public comparatif, outils
QA/liens, confirmation du rejeu, reprise de préparation et accès locaux absents.

Utiliser de vraies parties et commandes sur une base de test isolée, sans secrets
réels visibles. Viser notamment 390 px mobile, un petit format 320 px, tablette et
desktop ; vérifier safe areas, cibles tactiles, clavier, absence de scroll horizontal
et contenu non masqué. Le comparatif mobile doit garder une perspective lisible.
Stocker les PNG `implementation-*` séparément des PNG APPROVED, puis comparer et
corriger les écarts évidents après vérifications fonctionnelles.

Aucune capture d’implémentation B7 n’est produite à ce stade. Aucun iPhone physique,
Safari/VoiceOver réel ou nouvel OBS physique n’a été testé. La validation humaine
antérieure du workflow OBS reste valable pour son parcours observé ; elle ne
constitue pas une validation de l’intégration B7 encore bloquée.
