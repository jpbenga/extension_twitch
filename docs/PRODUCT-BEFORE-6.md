> Archive historique, remplacée par PRODUCT.md au jalon 6. Ne constitue plus la vision active.

# Extension Twitch — Cahier des charges produit

Version : 0.8

Statut : Vision produit et cadrage initial

Nom du dépôt : extension_twitch

## 1. Présentation du projet

Extension Twitch est une plateforme SaaS destinée aux streamers qui organisent des jeux interactifs en direct avec leurs invités et leurs spectateurs.

L’objectif est de transformer des émissions Twitch en véritables expériences de jeu télévisé, grâce à :

- Une régie professionnelle pour le Game Master (GM).
- Des overlays visuels intégrés à OBS.
- Une extension Twitch permettant au public d’interagir.
- Des interfaces individuelles pour les joueurs.
- Un moteur de jeu central synchronisant les participants, les règles et les événements.
- Des interactions gratuites et payantes utilisant notamment les Bits Twitch.

La plateforme doit permettre aux créateurs de produire des émissions de qualité sans disposer d’une équipe technique ou de développement.

## 2. Public cible

### Utilisateurs principaux

Game Master : prépare les émissions, configure les règles, importe les contenus et pilote les parties.

Streamer : diffuse l’émission sur Twitch. Le streamer et le Game Master peuvent être la même personne ou deux personnes différentes.

Joueurs : participent aux jeux, depuis Discord ou tout autre environnement vocal, avec ou sans interface individuelle.

Spectateurs : regardent l’émission et participent via le chat Twitch ou l’extension interactive.

### Positionnement

La plateforme vise d’abord les créateurs organisant des émissions communautaires autour des mangas, des animés et de la culture populaire.

Elle doit néanmoins être suffisamment générique pour accueillir d’autres thèmes et de nouveaux jeux.

## 3. Jeux prévus pour la V1

La V1 doit comprendre trois jeux jouables.

### 3.1 Undercover

Le Game Master organise une partie dans laquelle les participants reçoivent des informations secrètes et doivent identifier les joueurs ayant un rôle différent.

Fonctionnalités attendues :

- Configuration du nombre de joueurs.
- Configuration du nombre d’Undercover.
- Distribution de mots, noms ou personnages secrets.
- Gestion des rôles.
- Phases de discussion et de vote.
- Élimination des participants.
- Révélation des rôles.
- Gestion des conditions de victoire.
- Affichage des informations publiques dans l’overlay.
- Participation éventuelle du chat.

Exemple de configuration : six participants, quatre recevant « Naruto » et deux recevant « Sasuke ».

Les règles exactes, les variantes et les conditions de victoire seront spécifiées avant l’implémentation complète.

### 3.2 Enchères de personnages

Les participants disposent de budgets fictifs et enchérissent pour acquérir des personnages présentés par le Game Master.

Fonctionnalités attendues :

- Nombre de joueurs configurable.
- Budgets initiaux personnalisables.
- Catalogue de personnages.
- Images associées aux personnages.
- Ordre de présentation configurable.
- Enchères et incréments configurables.
- Chronomètres facultatifs.
- Attribution des personnages.
- Historique des transactions.
- Gestion des scores et des conditions de victoire.
- Annulation et correction des actions.

Règle essentielle : le budget d’un joueur est débité uniquement lorsque l’achat est confirmé, et non lorsqu’il propose une enchère.

Les interactions Twitch pourront modifier certains paramètres du jeu lorsque le Game Master les autorise.

### 3.3 Qui est l’espion ?

Jeu de déduction reposant sur la distribution d’informations secrètes et l’identification d’un ou plusieurs espions.

Fonctionnalités attendues :

- Nombre de joueurs configurable.
- Nombre d’espions configurable.
- Distribution d’informations et de rôles secrets.
- Gestion des phases de jeu.
- Questions et indices.
- Votes et éliminations.
- Révélations.
- Conditions de victoire configurables.
- Interactions possibles avec les spectateurs.

Les règles précises devront être définies avec soin afin de distinguer clairement ce jeu d’Undercover.

## 4. Modes de participation

La plateforme doit prendre en charge trois modes.

### Mode animé

Le Game Master contrôle les actions des participants depuis sa régie.

Les joueurs n’ont pas besoin de téléphone ou de compte sur la plateforme.

Les informations secrètes doivent pouvoir être communiquées par un moyen confidentiel adapté.

### Mode connecté

Les joueurs rejoignent une session via un lien ou un QR code.

Ils peuvent notamment :

- Consulter leurs informations secrètes.
- Participer aux votes.
- Effectuer les actions autorisées par le jeu.
- Consulter leur état individuel.

L’interface doit fonctionner dans un navigateur mobile.

### Mode hybride

Certains joueurs utilisent leur interface individuelle, tandis que le Game Master contrôle les actions des autres.

Le moteur de jeu doit traiter ces deux types de participation de manière cohérente.

## 5. Régie Game Master

La régie est l’interface principale de pilotage.

Elle doit permettre de :

- Créer et préparer une émission.
- Choisir un jeu.
- Configurer ses règles.
- Ajouter et modifier les participants.
- Importer des listes de personnages.
- Ajouter des images.
- Préparer des thèmes et des overlays.
- Démarrer, suspendre et terminer une partie.
- Déclencher les événements de jeu.
- Gérer les votes, scores, budgets et chronomètres.
- Autoriser ou désactiver les interactions du public.
- Corriger certaines erreurs et annuler des actions.
- Consulter un historique des événements.

### Support technique

La régie sera initialement développée comme une application web responsive et installable (PWA).

Elle doit fonctionner sur ordinateur, tablette et téléphone.

La publication sur l’App Store et Google Play pourra être étudiée ultérieurement.

## 6. Overlays OBS

Les overlays constituent la présentation publique des jeux.

Ils doivent permettre d’afficher :

- Les personnages et leurs images.
- Les noms des participants.
- Les budgets et scores.
- Les enchères en cours.
- Les chronomètres.
- Les votes et résultats.
- Les phases du jeu.
- Les événements déclenchés par les spectateurs.
- Les animations et révélations.

Les overlays doivent être intégrables dans OBS via une source navigateur.

Ils doivent proposer une personnalisation visuelle : thèmes, couleurs, typographies, positions et visibilité des éléments, selon les capacités définies pour chaque jeu.

Le rendu doit être adapté à la diffusion vidéo, notamment au format 16:9.

Les informations secrètes ne doivent jamais être exposées dans un overlay public avant leur révélation.

## 7. Extension Twitch et interactions spectateurs

Une extension Twitch officielle fait partie de l’architecture cible.

Elle doit permettre aux spectateurs de participer à l’émission.

### Interactions gratuites

Exemples :

- Votes.
- Sondages.
- Choix collectifs.
- Participation à certains événements.
- Consultation des informations publiques du jeu.

### Interactions payantes

Certaines actions pourront être déclenchées avec des Bits Twitch, selon les mécanismes et règles autorisés par Twitch.

Deux catégories doivent pouvoir coexister :

Interactions cosmétiques ou événementielles : animations, effets spéciaux, choix d’un prochain événement, contraintes humoristiques.

Interactions affectant le gameplay : modification d’un budget fictif, changement de chronomètre, déclenchement d’une règle spéciale ou attribution d’un avantage.

### Contrôle du Game Master

Le GM doit pouvoir :

- Activer ou désactiver chaque interaction.
- Définir les interactions disponibles pour un jeu.
- Choisir parmi les prix autorisés et configurés dans Twitch.
- Fixer des limites d’utilisation.
- Définir des délais entre les actions.
- Exiger une validation avant certaines exécutions.
- Désactiver toutes les interactions payantes.

Le système doit prévenir les abus, les doubles exécutions et les conflits entre événements.

Les interactions doivent respecter les conditions et restrictions de Twitch.

Les paiements réels ne seront pas implémentés pendant l’initialisation technique du projet.

## 8. Moteur de jeu central

Le moteur de jeu est un composant serveur partagé entre toutes les interfaces.

Il constitue la source de vérité de chaque session.

Il doit gérer :

- Les sessions et leurs états.
- Les participants et leurs permissions.
- Les configurations.
- Les règles communes.
- Les événements.
- Les transitions entre phases.
- Les scores et budgets.
- Les chronomètres.
- Les interactions spectateurs.
- L’historique.
- La sauvegarde et la reprise des parties.

Chaque jeu doit disposer de son propre module de règles.

Les interfaces ne doivent pas modifier directement l’état autoritaire d’une partie.

Elles envoient des commandes au moteur, qui les valide, applique les changements et diffuse les mises à jour.

### Synchronisation

Les interfaces suivantes doivent pouvoir rester synchronisées :

- Régie Game Master.
- Overlay OBS.
- Extension Twitch.
- Interfaces individuelles des joueurs.

Les communications temps réel devront être intégrées dans l’architecture.

### Sécurité

Les données secrètes doivent être transmises uniquement aux utilisateurs autorisés.

Les transactions payantes doivent être vérifiées côté serveur.

Une même transaction ne doit jamais produire plusieurs fois son effet.

Les commandes sensibles doivent être soumises à des contrôles de permission.

## 9. Gestion des contenus

Le Game Master doit pouvoir préparer ses contenus avant une émission.

Fonctionnalités envisagées :

- Création de bibliothèques de personnages.
- Importation de listes.
- Ajout d’images.
- Association de personnages à des jeux.
- Réutilisation des contenus entre émissions.
- Organisation en collections ou catégories.

La plateforme ne fournira pas de bibliothèque officielle d’images de personnages protégés.

Les utilisateurs pourront importer leurs propres images, sous réserve des règles d’utilisation du service et des droits applicables.

Des procédures de signalement et de retrait des contenus devront être prévues avant l’ouverture publique.

## 10. Mode démonstration

Le projet doit proposer un environnement de démonstration sans connexion Twitch obligatoire.

Il doit permettre de :

- Simuler plusieurs participants.
- Lancer une partie.
- Piloter le jeu depuis une régie.
- Visualiser un overlay.
- Simuler des votes et interactions spectateurs.
- Tester les changements d’état.
- Vérifier le comportement des interfaces.

Ce mode sera utilisé pendant le développement et pour présenter le produit aux créateurs pilotes.

## 11. Stratégie de lancement

### Phase 1 — Développement

Construire une première version fonctionnelle avec les trois jeux, la régie, les overlays et les mécanismes d’interaction essentiels.

### Phase 2 — Collaboration pilote privée

Proposer à Diki, Reyes et Nisha une collaboration gratuite d’environ un mois.

Cette collaboration doit leur permettre d’améliorer la qualité de leurs émissions et au développeur de tester la plateforme en situation réelle.

Il ne s’agit pas d’une offre d’essai gratuite destinée au public.

Les créateurs seront contactés lorsqu’une première version fonctionnelle pourra être présentée.

### Phase 3 — Préinscriptions

Pendant la période pilote, mettre en ligne un site présentant la plateforme et permettant aux créateurs intéressés de rejoindre une liste d’attente.

### Phase 4 — Ouverture commerciale

Lancer les abonnements après validation de la fiabilité du produit et des retours des premiers utilisateurs.

## 12. Modèle économique envisagé

Deux sources de revenus sont envisagées :

1. Abonnement payé par les streamers pour utiliser la plateforme.
2. Revenus développeur issus des interactions Bits dans l’extension Twitch, conformément aux conditions applicables.

Le prix de l’abonnement n’est pas encore défini.

Il n’est pas prévu d’augmenter automatiquement le prix de l’abonnement du seul fait de l’ajout des interactions Bits.

Le modèle tarifaire définitif sera décidé après les tests et l’étude des coûts.

## 13. Principes de conception

- Les trois jeux font partie du périmètre V1.
- Les règles doivent être largement configurables.
- Le Game Master conserve le contrôle de l’émission.
- Le chat doit être impliqué sans rendre toutes les interactions payantes.
- Les interactions Bits doivent être prises en compte dans l’architecture dès le départ.
- L’expérience visuelle doit être de qualité professionnelle.
- L’application doit être simple à utiliser pendant un live.
- Les informations secrètes doivent être protégées.
- Les erreurs de manipulation doivent pouvoir être corrigées lorsque cela est possible.
- L’architecture doit permettre l’ajout de nouveaux jeux.

## 14. Points restant à définir

Les sujets suivants nécessitent des décisions complémentaires :

- Règles détaillées et variantes des trois jeux.
- Conditions de victoire et systèmes de scores.
- Catalogue précis des interactions Bits.
- Limites d’équilibrage des interactions payantes.
- Personnalisation avancée des overlays.
- Gestion des comptes et des équipes.
- Hébergement et infrastructure de production.
- Stockage des images.
- Tarification des abonnements.
- Conditions de la collaboration pilote.
- Fonctionnalités nécessaires avant l’ouverture commerciale.

Ces points ne doivent pas être considérés comme déjà validés.

Ce document constitue la référence fonctionnelle initiale du projet. Il doit être mis à jour à mesure que les décisions produit sont prises.

15. Évolution validée — Studio configurable

Extension Twitch Studio est un moteur et un studio de création de jeux interactifs
pour des créateurs sans compétences en programmation. Undercover, Enchères et Qui
est l’espion restent les trois jeux officiels de la V1 ; ils utiliseront les mêmes
primitives configurables que les créations utilisateurs. La liste officielle pourra
s’agrandir. Les mécanismes communs ne doivent pas être recodés pour chaque jeu.

Le modèle distingue définition réutilisable et versionnée, configuration d’émission,
état d’une partie et événements. Le langage déclaratif est limité et validé ; aucun
JavaScript utilisateur n’est exécuté. Les sessions commencées gardent leur définition.
La personnalisation des rôles, permissions, actions, phases, scènes et overlays sera
progressive. Le studio et la régie restent mobile-first, avec priorité à l’iPhone.

Les assets utilisent des identifiants logiques indépendants du stockage. Priorité
aux références externes ou locales (Bring Your Own Storage), sans transfert de
média implicite ni stockage de fichiers en SQLite. Les accès privés et les droits
doivent être respectés. Voir docs/CONFIGURABLE-ENGINE.md et docs/ASSETS.md.

Le socle générique et le laboratoire peuvent progresser avant validation physique
sur iPhone. Statut du jalon A : Validation technique terminée — Validation humaine
iPhone en attente. Les règles détaillées des jeux officiels restent à définir.

16. Studio Créateur hybride — addendum validé

Trois parcours complémentaires : utiliser/personnaliser un jeu existant, créer
avec un guide, créer librement dans le Studio avancé. Même format de définition,
bibliothèque et moteur. Le guide ne doit pas supprimer les choix avancés qu’il ne
sait pas représenter. Les variantes sont indépendantes et conservent origine,
version, auteur et attributions. Distinguer installation, duplication, modification
de brouillon et publication immuable. Une partie active conserve sa version.

Préparer un Store communautaire avec jeux officiels/personnels/communautaires,
propriété, licences, filiation, métadonnées, manifest de dépendances et modération.
La découverte depuis Twitch sera explicite et optionnelle, sans exposer les jeux
privés. Les droits sur définitions, règles, graphismes, audio/vidéo et références
privées sont distincts ; partager un jeu ne rend pas tous ses assets partageables.

Le jalon 4A implémente les fondations et un parcours humain minimal ; il ne construit
pas le Store public, l’assistant complet ou Twitch. Voir docs/STAGE-4A.md.
Validation humaine iPhone en attente.

17. Studio Créateur visuel hybride — périmètre 4B

Les trois parcours produisent le même format : variante indépendante, guide
progressif, Studio avancé visuel. L’édition principale utilise des formulaires de
rôles, variables typées, actions, expressions, effets et phases. Le JSON reste
secondaire et les configurations avancées ne sont jamais supprimées par le guide.
Les essais figent une définition dans une session réelle isolée, avec accès GM,
joueurs et plateau public. La publication demeure privée et immuable. Aucun Store
public, nouveau moteur, paiement ou stockage de médias. L’Overlay Studio graphique
appartient à 4C et n’est pas commencé automatiquement. Voir docs/STAGE-4B.md et
docs/TEST-STUDIO-4B.md. Validation humaine iPhone en attente.

18. Refonte ergonomique du Studio — jalon 4B.1

Un jeu définit des règles réutilisables ; une partie les exécute avec des participants ;
une émission peut contenir plusieurs parties. Séparer accueil, bibliothèque,
éditeur et laboratoire. Distinguer Lancer, Personnaliser, Enregistrer, Tester et
Enregistrer une version. Les copies figées restent privées.

Les parcours ordinaires posent des questions en langage courant. Les références,
JSON, manifests et versions du langage restent secondaires. Les saisies, conditions
et conséquences d’une action sont regroupées dans son éditeur. Les réglages simples
ne remplacent jamais des règles avancées non représentables. Aucun moteur parallèle.
Le test rapide utilise les API, les permissions et les projections réelles avec
identités de démonstration distinctes. Le test avec invitations reste séparé.

Retour reçu : Premier test humain iPhone effectué — refonte ergonomique nécessaire.
Ce statut remplace l’attente indiquée pour le Studio dans les historiques précédents.
La refonte 4B.1 et les parcours complets restent à valider humainement. Safari iOS sur
d’autres appareils, OBS et les jeux officiels complets ne sont pas déclarés validés.
Voir docs/STAGE-4B1.md et docs/TEST-STUDIO-4B1.md. Ne pas commencer 4C automatiquement.

19. Gameplay réel — jalon 5, verticale 5A

Priorité aux parties complètes. Le jalon autorise des variantes de démonstration
explicites lorsque les règles définitives sont ouvertes. Voir OFFICIAL-GAMES-RULES.md.
Undercover dispose d’une verticale jouable avec 3 à 12 joueurs, distribution privée,
votes, égalités, éliminations, victoire et rejeu, sur des primitives déclaratives
partagées v3. Les définitions et sessions v1/v2 restent prises en charge.
Les interfaces et le laboratoire utilisent les API, permissions, SQLite et SSE réels.

Enchères et Qui est l’espion restent des verticales à livrer, pas des jeux terminés.
La règle ferme des enchères (débit uniquement à l’attribution confirmée) est conservée.
Leur prochaine implémentation réutilisera les primitives adaptées, sans copier
Undercover ni créer des moteurs indépendants. 4C et le Store sont reportés.
Les tests moteur, navigateur et la validation humaine iPhone/OBS sont distincts.
Le plaisir de jeu, le rythme, les variantes et l’ergonomie restent à apprécier.

20. Direction artistique validée — Broadcast Neon équilibré

Un design system commun à l’accueil, au Studio, à la régie, aux joueurs, au
laboratoire et au plateau. Violet pour la création, menthe pour la participation
et la réussite, ambre pour l’attention/enchères, corail pour votes et destruction
avec des libellés distincts, bleu pour informations publiques et plateau. Surfaces
sombres sobres, contrastes accessibles, focus visible, cibles tactiles confortables
et respect du mouvement réduit. Les confirmations applicatives sont personnalisées,
expliquent leurs conséquences et empêchent les doubles soumissions. Les alertes
de sécurité et de sortie non enregistrée du navigateur restent sous son contrôle.
La régie en portrait donne priorité au jeu, à sa phase et aux commandes, avec
safe areas et détails secondaires repliables. Les couleurs ne remplacent pas
permissions, projections ou règles. Aucun changement de gameplay, Store ou 4C.
Voir docs/DESIGN-SYSTEM.md et docs/TEST-BROADCAST-NEON.md. Les observations iPhone
antérieures motivent cette livraison ; la refonte reste à valider sur appareil réel.

21. Refonte globale validée — parcours et tours d’indices

Séparer Jouer (choisir/préparer un jeu), Créer (bibliothèque, personnalisation,
guide et Studio) et Régie (Partie, Joueurs, Plateau). Préserver Broadcast Neon et
les confirmations personnalisées, réduire les options permanentes de gestion.

Undercover utilise par défaut deux tours d’indices oraux complets avant chaque
vote. Le nombre est configurable ; chaque actif parle à son tour et le GM confirme
le passage. Le serveur interdit le vote prématuré. À la manche suivante, reprendre
avec les survivants ; rejouer conserve les accès. Voir OFFICIAL-GAMES-RULES.md.
Les parties déjà commencées conservent leur définition, sans migration silencieuse.

Le laboratoire doit permettre à une personne d’être GM sur iPhone, plusieurs joueurs
sur ordinateur et observateur du plateau, avec identités séparées et vraies commandes.
Les jeux officiels doivent progresser vers la reconstruction depuis une création
vide ; l’audit distingue ce but de la simple exécution de primitives déclaratives.
Enchères et Qui est l’espion ne sont toujours pas livrés comme jeux jouables.
Voir OFFICIAL-GAMES-CONFIGURABILITY.md et TEST-MULTI-DEVICE-GAMES.md.

Statut humain : première exploration iPhone du Studio et d’Undercover effectuée ;
vote trop précoce constaté et refonte ergonomique demandée. Les nouveaux parcours,
Safari sur appareil réel, tests physiques iPhone + ordinateur, gameplay et OBS restent
à valider par l’utilisateur. Aucune validation physique n’est déduite de Chromium.
