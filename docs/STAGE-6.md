# Jalon 6 — recentrage produit et inventaire de retrait

Base réelle propre : `fdacc86`, branche `feat/play-flows-multidevice`, vérifiée contre
les têtes distantes. Elle contient tous les ancêtres 4B.1, 5A et Broadcast Neon ; aucune
branche divergente plus avancée trouvée. Travail : `feat/product-focus-saas`.

## Décision et dépendances constatées

Le nouveau produit fermé remplace explicitement l’ancienne exigence de reconstruction
des jeux depuis une page blanche. Aucun travail d’éditeur, Store ou overlay avancé.
L’ancien `/play` dépendait encore du CreatorProvider : création implicite de bibliothèque,
lecture du catalogue pédagogique et préparation via `/studio/.../test-sessions`.
Le laboratoire dépend surtout de capacités et API de sessions, pas de l’éditeur.
La définition préparée contient déjà un instantané indépendant des brouillons.
On conserve cette frontière et on remplace seulement l’entrée produit.

| Fonctionnalité / code                                                    | Utilité actuelle                                | Traitement                                                                           |
| ------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Moteur `configurable`, expressions v1/v2/v3 et mécaniques                | Exécuter les jeux et anciennes parties          | Conserver, aucun moteur parallèle                                                    |
| Contrats de jeu / permissions / projections                              | Validation et confidentialité                   | Conserver                                                                            |
| SQLite sessions / accès / événements / reçus                             | État autoritaire et reprise                     | Conserver, aucune migration SQL                                                      |
| Définitions officielles Undercover 0.2 et archive 0.1                    | Versions figées des parties                     | Conserver                                                                            |
| Modules Enchères / espion                                                | Catalogue futur                                 | Conserver, non jouables                                                              |
| Studio `creator-*`, guide, éditeurs de rôles/actions/expressions         | Ancienne création libre                         | Masquer par défaut, déprécier, maintenance locale seulement                          |
| API `/studio/*`                                                          | Anciennes bibliothèques                         | Fermer par défaut, conserver le service et les tests                                 |
| Commande HTTP `game.configure` / `/game-examples`                        | Injection de définitions / exemples             | Refuser en parcours normal ; maintenance locale explicite                            |
| Bibliothèque personnelle / tables creator_workspaces et creator_receipts | Anciennes données privées                       | Conserver sans mutation automatique ; future récupération/migration accompagnée      |
| Brouillons / variantes / attributions / versions                         | Héritage à préserver                            | Conserver les blobs et révisions, ne plus proposer publication ni duplication        |
| Métadonnées Store / export                                               | Ancien futur communautaire                      | Contrats dormants, aucun nouveau développement ; suppression future après inventaire |
| Assets / manifest / droits                                               | Compatibilité et futures ressources officielles | Conserver validations, aucune résolution réseau ou média en base                     |
| Capacité propriétaire sans compte                                        | Accès historique                                | Préserver, ne pas convertir en authentification SaaS implicite                       |
| `creator-lab`, stockage xt:creator:lab                                   | Laboratoire multirôle réel                      | Réutiliser ; noms internes historiques sans migration inutile                        |
| `CreatorFrame context=play`                                              | Enveloppe de laboratoire                        | Adapter pour ne pas lire/créer de workspace                                          |
| `/play`, `/play/undercover`, `/play/lab/:id`                             | Parcours principal                              | Catalogue fermé et préparation indépendante                                          |
| `/creator`, `/creator/new`, `/creator/library`, `/creator/games/:id`     | Liens historiques d’édition                     | Rediriger vers `/play` par défaut                                                    |
| `/creator/play`, `/creator/lab/:id`                                      | Anciens liens de partie / laboratoire           | Rediriger vers les équivalents `/play`, stockage intact                              |
| Régie / joueurs / plateau / sessionStorage d’accès                       | Jouer et observer                               | Conserver, pas d’éditeur au retour à un salon vide                                   |
| Tokens Broadcast Neon / dialogues / feedback                             | Cohérence et ergonomie                          | Conserver                                                                            |
| Maquettes `/demo`, `/player`, `/overlay`                                 | Historique visuel                               | Conserver hors navigation ; toujours marquées fictives                               |
| `/lab` technique                                                         | Tests du moteur                                 | Réserver à la maintenance locale explicite, jamais production                        |
| `/sessions/new` historique                                               | Tests et anciens salons sans définition         | Conserver hors navigation principale ; ne prépare aucun jeu à lui seul               |
| `/design-system`                                                         | Validation visuelle                             | Conserver en développement seulement                                                 |
| Tests moteur, API, persistance                                           | Garanties techniques                            | Conserver ; anciens appels techniques optent explicitement pour le mode de test      |
| Tests UI Studio retiré                                                   | Compatibilité et récupération                   | Suite `test:legacy` de développement, conservée et distincte du produit              |

## Implémentation

`GET /official-games` renvoie seulement les fiches et disponibilités officielles,
sans définitions exécutables, bibliothèque ni paramètres privés de partie.
`POST /official-games/undercover/sessions` exige un Bearer aléatoire GM et un requestId,
valide un objet strict GameSettings, choisit la définition serveur 0.2.0 et prépare
l’instantané. Les paramètres sont attachés à PreparedGame.configuration, champ facultatif
additif compatible avec les anciens états. La commande normale `game.use-prepared`
installe ces réglages ; elle refuse leur modification. Le moteur vérifie à cette étape
l’effectif réel et la répartition. L’état, les accès et les reçus restent transactionnels.

Le lancement avec invités ouvre directement la régie et une préparation compacte (invitation, effectif et bouton Préparer). La démonstration ouvre le laboratoire multirôle.

Le navigateur ne transmet plus de GameDefinition pour jouer. L’API publique refuse
`game.configure`, même pour un GM. Les anciennes parties conservent leurs actions,
rejeu et définitions ; seules les nouvelles injections de règles sont fermées.
Les anciennes préparations sans réglages épinglés gardent leur ancien comportement.
Les nouveaux réglages sont des scalaires contrôlés, pas un nouveau langage de règles.

Le lancement conserve l’identifiant et le secret de la demande avant l’envoi. Une
réponse perdue est reprise exactement ; les étapes d’inscription et d’installation
réutilisent les reçus du laboratoire existant. La reprise de l’accueil vérifie réellement
la capacité GM au serveur, sans liste publique de sessions ou confiance dans le stockage.
Les réglages locaux et la dernière partie sont propres à l’onglet, pas à un compte.

## Maintenance et données

Aucune table, partie, bibliothèque, capacité ni clé de brouillon n’est supprimée.
Pas de migration forcée des anciennes créations vers le catalogue officiel. Le code
retiré de l’expérience reste dormant pour réduire les risques et conserver ses tests.
Une ancienne création non lancée ne devient pas un nouveau jeu officiel.

Pour un développeur chargé d’une récupération sur une copie privée de la base :
`LEGACY_STUDIO_ENABLED=1 npm run dev`. Ce mode doit rester local, sur une copie
sauvegardée ; il n’est pas une offre produit, un contrôle de compte ou un accès public.
Sans ce drapeau, même le développement ferme le Studio. Le serveur et Next en production
ignorent le drapeau ; `npm start` fixe explicitement NODE_ENV=production pour le serveur.
Les tests de compatibilité optent en mode local/dev, sans lever les permissions normales.
Ne pas retirer définitivement ces tables avant sauvegarde vérifiée, inventaire des
références, procédure de récupération et décision explicite sur la durée de conservation.

## Limites et suites

Seul Undercover est jouable. Son cycle et ses deux tours par défaut ne sont pas réécrits.
Pas de compte, de récupération, de facturation, de paywall fictif, de stockage de
configurations synchronisées ou de site marketing complet. Les capacités n’expirent
pas automatiquement ; ce jalon n’autorise pas une ouverture SaaS publique.
Voir SAAS-ARCHITECTURE.md, ROADMAP-COMMERCIAL.md et TEST-PRODUCT-FOCUS.md.
Les captures/tests Chromium ne valent pas validation iPhone physique, plaisir de jeu ou OBS.

## Risques de retour à une ancienne version

Les états existants sont conservés et aucune migration SQL n’est demandée. En revanche,
une ancienne application ne connaît pas forcément les nouveaux réglages épinglés d’une
préparation non encore installée, ni les nouveaux enregistrements locaux du laboratoire.
Une sauvegarde avant changement de branche reste nécessaire pour un retour arrière sur
une base contenant de nouveaux essais ; ne pas confondre compatibilité de lecture des
anciennes parties avec garantie d’exécution des nouvelles préparations par un ancien code.
Les capacités sans expiration, l’absence de comptes, le processus SSE unique et le quota
réseau partagé derrière le relais restent les principaux risques avant ouverture SaaS.

## Vérifications exécutées

Environnement : Node 24.19.0, npm 11.9.0 et Chromium système. Les processus et bases
sont isolés par format ; quotas, origines et permissions restent activés.

| Vérification                                | Résultat                                                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests unitaires / intégration               | **127 réussis**, 16 fichiers : les 118 existants conservés, 9 tests du recentrage ajoutés                                                                           |
| TypeScript strict, formatage et compilation | Réussis via `npm run check` ; compilation relancée après la correction CSS responsive                                                                               |
| `npm run test:e2e`                          | **42 réussis** : 14 parcours sur téléphone, tablette et ordinateur                                                                                                  |
| `npm run test:games`                        | **12 réussis** : 4 parties/scénarios complets sur les trois formats                                                                                                 |
| `npm run test:design`                       | **12 réussis** : 4 scénarios de dialogues, focus, erreurs et responsive sur les trois formats                                                                       |
| `npm run test:legacy`                       | **60 réussis** : les 20 scénarios de l’ancien Studio/moteur répartis sur les trois formats, en maintenance locale explicite                                         |
| `npm run test:lab`                          | **6 réussis** : outils de développement, commandes réelles, confidentialité, dialogues asynchrones et absence d’erreurs Next/hydratation sur les parcours contrôlés |

Total : **132 cas navigateur**, dont 66 sur le produit compilé et 66 sur les outils
de compatibilité/développement. Les assertions de fermeture du Studio et des outils
techniques s’exécutent en production, même avec un drapeau de maintenance laissé dans
l’environnement. Les assertions correspondantes de disponibilité locale appartiennent
à la suite de maintenance. Les tests ne sont pas supprimés parce que l’éditeur disparaît.

Les nouveaux contrôles couvrent catalogue/disponibilité, schéma strict, refus d’injection,
réglages épinglés restaurés depuis SQLite, idempotence de création, API Studio fermée,
ancienne bibliothèque intacte, ancienne partie 0.1.0 jouable, reprise GM autorisée,
réglages et identité conservés au rechargement, réponse de préparation perdue et anciens
liens redirigés. Les parties multicontextes vérifient votes, tours, égalités, victoires,
rejeu, refus prématuré, refus de commande GM par un joueur et projections privées/publiques.

Deux adaptations de test ont été nécessaires : attendre le véritable chargement
authentifié après un lien privé de récupération dans le serveur de développement,
et déplacer le contrôle 404 des outils techniques dans la suite production. Une règle
CSS historique `display: flex !important` empêchait le masquage du comparatif desktop
sur mobile ; son conflit de cascade est corrigé et vérifié sur les trois formats.
Les confirmations restent personnalisées ; aucune erreur Next n’est masquée.

Les passages ciblés de diagnostic ne sont pas comptés comme de nouveaux cas. Le workflow
CI est mis à jour mais son exécution distante n’est pas revendiquée. Aucun iPhone physique,
Safari iOS réel, OBS physique ni test humain du nouveau parcours n’est annoncé comme réussi.

## Captures de la livraison

Captures Chromium, données fictives ; les invitations sont masquées dans les images.
Les champs secrets de GM ne sont pas affichés. Elles ne constituent pas des captures
sur un iPhone physique ni une validation humaine de l’ergonomie.

| Écran                    | Téléphone                                                  | Ordinateur                                                  |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- |
| Accueil                  | [Voir](screenshots/product-focus/accueil-mobile.png)       | [Voir](screenshots/product-focus/accueil-desktop.png)       |
| Catalogue officiel       | [Voir](screenshots/product-focus/catalogue-mobile.png)     | [Voir](screenshots/product-focus/catalogue-desktop.png)     |
| Réglages Undercover      | [Voir](screenshots/product-focus/configuration-mobile.png) | [Voir](screenshots/product-focus/configuration-desktop.png) |
| Préparation avec invités | [Voir](screenshots/product-focus/preparation-mobile.png)   | [Voir](screenshots/product-focus/preparation-desktop.png)   |

La revue visuelle a aussi conduit à présenter les fiches en colonnes sur tablette
et ordinateur, au lieu de longues cartes étirées. Le parcours catalogue et l’absence
de débordement ont été revérifiés sur les trois formats après cet ajustement ; ces
passages ciblés ne sont pas ajoutés au total des cas uniques.
