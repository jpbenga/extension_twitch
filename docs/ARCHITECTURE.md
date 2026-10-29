# Architecture — socle technique

Statut actuel : jalon 6, catalogue fermé. [Architecture SaaS cible](SAAS-ARCHITECTURE.md) et [inventaire de retrait](STAGE-6.md) prévalent sur les orientations historiques de création libre ci-dessous. Aucun compte ni abonnement implémenté.

Historique : choix techniques validés. Les sections initiales décrivent l’historique A ; les évolutions du moteur et du Studio figurent en fin de document. État actuel : Undercover de démonstration jouable, jalon 5A. Voir [le bilan actuel](STAGE-5.md).

## Choix validés

- TypeScript strict, npm workspaces et Node.js 24 LTS. Aucun orchestrateur de monorepo supplémentaire.
- Next.js / React pour une régie unique responsive et les routes d’aperçu overlay et joueur.
- Un processus serveur Node.js distinct pour le futur état autoritaire et les connexions persistantes.
- Un moteur indépendant des composants visuels ; trois modules autonomes, sans dépendances entre jeux.
- SQLite pour le développement initial, derrière un contrat de dépôt permettant une migration ultérieure.

Les options de persistance de production, d’authentification et d’hébergement ne sont pas décidées.

## Dépendances et frontières

```text
web ────────────────> contracts + descripteurs publics des jeux
  │ HTTP / SSE (via un relais Next.js de même origine)
  ▼
server ─────────────> contracts
  │ commandes identifiées et validées
  ▼
engine (salon actif ; modules de règles à implémenter)
  │ décisions sans accès aux interfaces ni à la base
  ▼
SqliteStore : transaction état + événement + reçu de commande
```

`contracts` contient Zod pour valider les données aux frontières. Le transport conserve les primitives HTTP Node.js sans framework supplémentaire. Les commandes passent par HTTP et SSE diffuse des instantanés de session projetés selon l’accès. Chaque connexion reçoit immédiatement l’état récent ; après une coupure, le client se reconnecte sans rejouer de mutations. Le lecteur SSE utilise `fetch` pour envoyer le jeton en en-tête, sans secret dans une URL de requête. Les tailles de message, corps de requête, fréquence des écritures et connexions par session sont limitées.

SQLite utilise le module `node:sqlite` de Node.js 24, WAL, des transactions `BEGIN IMMEDIATE` et une migration versionnée. Le serveur lit et vérifie la version dans la même transaction que l’écriture de l’état, de l’événement et du reçu d’idempotence. Une erreur annule l’ensemble. Les identifiants répétés avec le même contenu ne reproduisent pas leur effet ; un contenu différent sous le même identifiant est refusé. Les clients sont informés après validation de l’écriture. Le code SQL est isolé dans `apps/server/src/sqlite-store.ts` pour permettre un autre adaptateur ultérieurement. Un seul processus Node diffuse les événements à ce stade.

Les accès sans compte sont des capacités individuelles : le navigateur génère 32 octets cryptographiquement aléatoires pour une inscription, conserve ce secret dans son onglet et le transmet en en-tête d’autorisation. Le serveur attribue le rôle et l’identifiant selon l’opération autorisée et stocke uniquement un condensat SHA-256 du jeton. Le nom affiché est déclaratif et ne prouve pas l’identité civile. Les reprises de création/inscription réutilisent le même secret et identifiant pour éviter les doubles inscriptions. Aucun rôle de cookie ou de corps JSON n’est accepté. Un lien privé de récupération importe son fragment dans `sessionStorage` puis efface ce fragment de l’adresse ; un changement de fragment dans une page déjà ouverte est aussi pris en charge. Les accès sont indexés par session, rôle et participant afin d’isoler plusieurs identités du même navigateur.

Les invitations et liens publics sont distincts des accès privés. Les cookies d’un éventuel proxy d’accès sont envoyés sur la même origine, mais le moteur ne les utilise pas pour identifier les rôles. Les mutations avec une origine navigateur différente de `PUBLIC_ORIGIN` sont rejetées. Les réponses privées ne sont pas mises en cache, les données d’accès ne sont pas journalisées, les liens ne transmettent pas de référent et les secrets ne sont jamais renvoyés dans les vues publiques. Une réinitialisation renouvelle l’invitation et révoque les accès joueurs tout en conservant l’accès GM et le lien public. Le journal est conservé.

Les packages de jeu n’exposent aujourd’hui que leurs descripteurs. Lorsque des règles et états privés y seront ajoutés, conserver une entrée publique séparée pour les métadonnées ; ne pas importer de code contenant des secrets dans les composants clients. `engine` est destiné au serveur uniquement et n’est pas une dépendance de l’application web.

Le compilateur produit les packages et le serveur dans `dist`. Next.js compile ensuite l’application. `npm run dev` reconstruit les packages avant le lancement et surveille leurs sources. Une modification des contrats peut nécessiter une reconnexion ou un redémarrage du serveur pendant le développement.

## Moteur de salon actif et contrats des futurs jeux

- `CommandEnvelope` : identifiant de commande, session, version attendue et jeu. L’enveloppe n’attribue aucun rôle ; l’identité viendra de l’authentification serveur.
- `GameModule` : configuration, décision, réduction des événements et projections. Aucun module concret ne l’implémente tant que les règles ne sont pas définies.
- `SessionRepository` : contrat générique préparatoire pour les futurs états de jeu. Le salon A dispose déjà de son adaptateur transactionnel `SqliteStore` et de son coordinateur `SessionService` ; le contrat générique ne doit pas être présenté comme une implémentation de règles de jeu.
- DTO de démonstration public strict pour les maquettes historiques ; schémas distincts `publicSessionSchema`, `playerSessionSchema`, `gmSessionSchema` pour les sessions réelles. Le serveur construit chaque projection explicitement ; l’interface ne filtre pas un état privé reçu par erreur.
- `SpectatorRequest` : simulation et interactions gratuites. Ce contrat ne reçoit aucune preuve d’achat.
- `InteractionPolicy` : activation GM, effet cosmétique ou gameplay, limites, délai, approbation et référence produit Twitch pour un futur tarif Bits. Aucun catalogue ni prix n’est validé.
- `VerifiedBitsReceipt` : frontière typée serveur, sans constructeur ni adaptateur actif. Le typage ne constitue pas une preuve cryptographique. La vérification réelle devra authentifier le reçu et vérifier canal, produit, validité et unicité.

Les commandes de salon sont sérialisées dans le processus et protégées par leur transaction SQLite et leur version attendue. La présence est calculée à partir de toutes les connexions actives d’un joueur ; elle n’est pas restaurée artificiellement depuis le disque. La fermeture du serveur nettoie les abonnements avant fermeture de la base. Les futurs jeux devront réutiliser ces garanties. Une transaction Twitch devra être enregistrée avec son effet dans la même transaction de base ; aucune transaction Twitch n’est implémentée aujourd’hui.

## Démonstration et identité visuelle

Une seule régie pour les trois tailles d’écran : navigation compacte entre session, joueurs et plateau, commandes tactiles et barre d’action GM inférieure. La maquette historique conserve sa navigation latérale. Palette sombre, accents violet, ambre et menthe, motifs de plateau et illustrations SVG originales. Aucune image protégée, police distante ou ressource payante.

Les anciennes maquettes sont conservées sous `/demo`, `/player` et `/overlay`. Leur sélection reste locale et leurs participants fictifs. Le nouvel accueil crée des sessions réelles ; la régie, le compagnon et le plateau utilisent les API et flux autorisés. Le salon public n’a aucun contrôle interactif. Les démarrages de partie et règles absentes ne sont pas représentés comme fonctionnels. Le plateau réel est adapté à OBS et à une lecture mobile ; la variante transparente reste pour l’instant celle de l’ancien overlay fictif.

La régie affiche l’état réel du transport SSE et sa reconnexion automatique. `Cache-Control: no-transform` évite que la compression d’un relais retarde les événements. Un futur déploiement devra aussi désactiver la mise en tampon SSE et adapter les délais de connexion.

## Hors périmètre et décisions ouvertes

Le jalon A gère les sessions et leur persistance, pas une partie jouable. La distribution des rôles, les phases de jeu, votes, scores, budgets et victoires restent à implémenter après validation des règles. Le laboratoire connecté et les privilèges de simulation sont absents. La PWA, les comptes, l’import de contenus et la véritable extension Twitch sont ultérieurs. Les accès ne disposent pas encore d’expiration automatique ou de récupération de compte ; conserver les liens privés et réserver cette livraison aux tests locaux ou à un hébergement HTTPS protégé.

Avant les règles : définir les phases, égalités, victoires, modalités de vote, différences entre Undercover et espion, clôture et annulation des enchères. La règle déjà validée demeure : une enchère proposée ne débite rien, l’attribution confirmée seule déclenche le débit.

Avant les intégrations : définir les permissions GM/streamer, invitations, remise confidentielle des informations en mode animé, actions annulables, catalogue d’interactions, règles Twitch applicables et équilibrage. Les paiements réels nécessitent une demande explicite et une validation de conception.

## Évolution : studio configurable

La décision [Moteur configurable](CONFIGURABLE-ENGINE.md) remplace la liste fermée
des jeux et les moteurs de règles spécialisés lorsque des primitives communes
suffisent. Les sessions, SQLite, SSE et capacités de A sont conservés. Les trois
modules officiels actuels restent des métadonnées, pas des jeux jouables.
Voir aussi [Assets BYOS](ASSETS.md).

## Studio Créateur 4A

[La décision 4A](STAGE-4A.md) complète le socle : bibliothèque, variantes, versions
privées et expressions v2 bornées. SQLite passe en version 2 avec deux tables
additives de bibliothèque/reçus ; les sessions restent inchangées hors définition
préparée facultative et commande GM d’installation. Aucune création personnelle
n’est publiée automatiquement. [Guide manuel](TEST-CREATOR.md).

## Studio visuel 4B

[La décision 4B](STAGE-4B.md) ajoute des formulaires sur le même GameDefinition,
sans nouvel interpréteur ni nouvelle table. Les descriptions facultatives de
rôles/actions/phases restent des métadonnées. Le test de brouillon accepte une
révision attendue facultative, vérifiée avant création pour éviter une course avec
une édition concurrente. Les deux joueurs fictifs utilisent les inscriptions et
permissions normales, sans route de privilèges serveur. [Parcours humains](TEST-STUDIO-4B.md).

## Jeux jouables 5A

Le module Undercover expose son descripteur public par l’entrée habituelle, et sa
définition serveur par `@extension-twitch/game-undercover/definition`. Le catalogue
du moteur importe cette dernière ; le navigateur n’importe ni le moteur ni une
définition contenant la configuration privée de la partie. La seule dépendance
ajoutée est interne au workspace, sans dépendance entre les trois modules de jeux.

Les primitives v3 de distribution, vote, élimination et résultat sont interprétées
dans `engine/mechanics.ts`, dans la transaction existante du GameRun. Elles ne
consultent pas l’identifiant Undercover pour prendre une décision. La projection
publique et chaque projection individuelle sont toujours construites côté serveur.
Les composants de cartes/vote/résultat utilisent leurs seules données autorisées.
Voir [les contrats v3](CONFIGURABLE-ENGINE.md#évolution-5a--primitives-de-gameplay-v3).

`/creator/play` orchestre les API normales : création, invitations individuelles,
préparation puis commandes authentifiées. Le sélecteur de vue du laboratoire
n’ouvre qu’un contexte de rôle à la fois. Il appartient au GM qui possède déjà les
informations de gestion ; ce n’est pas un outil privilégié distribué aux spectateurs.
`/lab` reste exclusivement en développement. Aucun contournement de permissions ou
endpoint de simulation réservé au développement n’est exposé en production.

En HTTP local, ouvrir de nombreux onglets SSE sous un même contexte de navigateur
peut épuiser son quota de connexions persistantes. Utiliser le sélecteur du laboratoire
ou des appareils/profils séparés. Les tests multi-rôles isolent réellement les
contextes de navigateur comme des appareils distincts ; les protections de débit,
d’origine et d’idempotence restent actives.

Enchères et Qui est l’espion conservent leurs modules publics et leur place dans la
V1 ; ils ne sont pas encore jouables. Leurs hypothèses sont documentées, sans moteur
parallèle ni promesse d’implémentation. L’Overlay Studio et le Store sont reportés.

## Broadcast Neon — couche d’interface

Le [design system](DESIGN-SYSTEM.md) complète le socle 5A sans modifier le moteur,
le serveur ou les contrats métier. `tokens.css` centralise la palette ; les layouts
existants emploient ses variables et `design-system.css` harmonise les contrôles.
Les primitives React restent légères, avec HTML natif pour les formulaires et un
`dialog` stylé ouvert par `showModal()` pour le plan modal et l’inertie. Un provider
racine gère choix, opérations asynchrones, verrou d’envoi, erreurs et notifications.
Une fermeture de dialogue ne remplace jamais l’acquittement et le reçu serveur.
Le hook client de commande renvoie aussi un résultat booléen pour conserver la
confirmation ouverte en cas de refus ; les payloads et protections HTTP sont inchangés.

Les sections mobiles de régie conservent leurs champs montés et leurs liens/fragments,
mais n’affichent qu’un espace de pilotage à la fois pendant une partie. Le plateau
continue d’utiliser les projections publiques uniquement. Le catalogue `/design-system`
est réservé au développement et absent en production. Voir [la validation iPhone](TEST-BROADCAST-NEON.md).

## Refonte globale — Jouer, Créer, Régie, test multi-appareils

Base vérifiée : `b277c56`, descendante de `512d936` (Undercover) et `26b0202`
(Studio 4B.1). Aucun retour à une branche ancienne. Les tokens et dialogues Broadcast
Neon sont conservés, ainsi que les droits, brouillons, variantes et SQLite/SSE.

- `/` présente Jouer et Créer, plus un accès secondaire aux invitations.
- `/play` choisit le jeu ; `/play/undercover` règle la partie et choisit démonstration
  ou vrais invités. Le launcher réutilise l’accès propriétaire et les API de
  préparation existantes, sans présenter le Studio à l’utilisateur qui veut jouer.
- `/play/lab/[id]` garde les capacités des joueurs fictifs dans l’onglet qui l’a
  préparé. Il propose copie du lien GM pour un autre appareil et vues individuelles.
- `/creator` et ses routes restent l’espace de création. Les anciens liens
  `/creator/play` et `/creator/lab/[id]` fonctionnent avec les composants communs.
- `/sessions/[id]/gm` est la régie, avec Partie / Joueurs / Plateau pendant le jeu.
  Les réglages sont repliés dans Partie. Les anciens fragments `#session`, `#game`,
  `#players`, `#board` restent reconnus. Le logo n’envoie aucune commande d’arrêt.
- `/join` accepte un code ; `/join/[code]` inscrit le participant. `/sessions/new`
  conserve l’ancien formulaire de salon pour les tests du moteur et les usages
  préparatoires. Ce salon seul ne promet pas un jeu terminé.

Le laboratoire monte une seule projection privée à la fois, avec une clé React
session + identité. La perspective sélectionnée est persistée par session dans le
stockage de l’onglet et vérifiée contre les participants connus. Le panneau public
comparatif optionnel lit une **projection publique indépendante**, jamais un sous-
ensemble calculé depuis les données GM. Chaque onglet individuel importe sa propre
capacité ; `noopener noreferrer` évite la relation d’ouverture et la transmission
de référent. Aucun endpoint d’usurpation, de simulation ou de collecte des secrets
n’est ajouté. Un laboratoire sans ses capacités locales n’affiche aucun sélecteur.

Le contexte de test multirôle est privé au GM. Il n’est pas accessible depuis les
invitations ou vues publiques. Le laboratoire Créateur/Jouer utilise uniquement les
opérations normales et reste disponible au propriétaire en mode compilé ; `/lab`
et `/design-system`, qui sont des outils de développement, restent absents en
production. Ce sont des restrictions différentes, explicitement conservées.

Les tours d’indices sont une extension additive v3 : `mechanics.turns` lie un nombre
public de répétitions et une étape. `turn.advance` est une action GM, `requireTurns`
bloque l’ouverture d’un scrutin. L’entrée dans cette étape initialise la séquence
sur les actifs et une nouvelle manche la recommence. Ni identifiant Undercover,
ni compte local React ne détermine ces règles. Le suivi, les votes et les reçus
partagent le même snapshot transactionnel SQLite. L’absence du champ conserve le
comportement historique. Undercover 0.1.0 reste résoluble, 0.2.0 est le modèle courant.

L’audit [de configurabilité](OFFICIAL-GAMES-CONFIGURABILITY.md) distingue exécution,
édition et reconstruction sans JSON. La création visuelle de toutes les structures
natives depuis zéro reste à faire. Le [guide multi-appareils](TEST-MULTI-DEVICE-GAMES.md)
explique les limites HTTP/SSE, la copie privée et le parcours iPhone GM + ordinateur.

Les installations officielles historiques disposent d’une liste privée facultative
`StudioView.archivedInstallations`, distincte du catalogue courant. Le serveur la
résout à partir des seules installations du propriétaire ; la bibliothèque l’utilise
uniquement dans « Jeux ajoutés », avec la version et la mention de règles conservées.
Cela évite de faire disparaître une installation 0.1.0 lors de la sortie 0.2.0,
sans la dupliquer dans le catalogue ni migrer son contenu. Aucun changement SQL.

## Jalon 6 — entrée produit indépendante et conservation

Le web `/play` n’utilise plus CreatorProvider. Les fiches publiques sont partagées par
le contrat `official-games`, sans GameDefinition client ni valeurs privées de session.
L’API officielle choisit la définition serveur, valide les réglages et copie les
réglages dans PreparedGame.configuration. Ce champ optionnel ne modifie pas les
anciennes préparations ; les nouvelles parties refusent des substitutions de paramètres.
Le moteur contrôle toujours l’effectif réel au moment d’installer. Aucune migration SQL.

`/studio/*`, `/game-examples` et la commande HTTP `game.configure` sont fermés par défaut.
Le mode local de compatibilité est explicite et impossible via le démarrage production.
Les GameRuns déjà persistés et les commandes de gameplay restent pris en charge.
Les anciens liens d’éditeur vont au catalogue, les liens de laboratoire vont à `/play/lab`.
Le laboratoire lit ses propres capacités, pas la bibliothèque. Les données Studio et
ses tests restent conservés ; ce n’est pas une suppression de schémas ou de tables.
La reprise d’accueil consulte une référence d’onglet et fait vérifier l’accès GM par
le serveur ; elle ne liste pas les sessions d’autres personnes. Sans compte, elle
ne promet pas de récupération interappareils. Voir TEST-PRODUCT-FOCUS.md.

## Aperçu d’émission partagé

Voir [STREAM-PREVIEW.md](STREAM-PREVIEW.md). `/sessions/:id/stream` et `/sessions/:id/obs`
utilisent le même BroadcastFeed/BroadcastOverlay, de même que le comparatif du laboratoire.
Ils ne chargent que le SSE public ; la scène fictive appartient au wrapper d’aperçu,
pas au rendu de jeu. Le flux fournit une époque de connexion pour établir une base
sans animer l’historique. Aucun changement de règles, de tables ou d’accès privés.
Les capacités spectateur sont découvertes via un endpoint public versionné mais restent
vides, conformément aux permissions du moteur actuel. Aucun dispatcher Twitch actif.

## Jalon 7 — layout de diffusion Undercover

[Décision ciblée](UNDERCOVER-LAYOUT.md) : schéma de rectangles strict versionné,
champ optionnel de session et commande GM `overlay.configure`. SQLite et SSE sont
conservés, aucune nouvelle table ni migration des définitions/règles. Le même
BroadcastOverlay reçoit le layout public enregistré ou la copie locale de l’éditeur.
Sept blocs obligatoires et places joueurs indépendantes des camps, aucune source
privée/CSS/script utilisateur. Le guide de test conserve le workflow OBS validé.

## Jalon 8 — séparation de présentation et thème d’émission

[Décisions UX](UX-REDESIGN-DECISIONS.md). UndercoverRoom sépare salon/régie/compagnon,
avec les mêmes hooks de commande et composants de gameplay. Le laboratoire conserve
une projection privée à la fois et un flux public indépendant. Aucun nouveau moteur.
`broadcastTheme?` est un enum officiel validé dans la création, conservé dans le blob
SQLite et explicitement projeté au public. Le défaut historique est déterministe ;
aucun endpoint de préférence locale ne modifie une partie active. La préférence
ApplicationTheme est locale au navigateur. Le renderer scope ses tokens selon le
thème serveur, y compris dans l’éditeur de layout. Aucune migration SQL destructrice.

## Extension native — Local Test en lecture seule

Le workspace `apps/twitch` produit les entrées statiques Panel/Mobile/Video Overlay
et Config/Live Config. Elles chargent le Helper Twitch officiel, attendent son
autorisation et utilisent Configuration Service pour conserver uniquement un
pointeur public vers la session et son origine HTTPS. Le même BroadcastFeed/Overlay
que l’aperçu et OBS consomme les projections publiques et les images autorisées.
La passerelle HTTPS locale n’autorise que les lectures publiques ; elle ne relaie
aucun Cookie/Authorization, mutation, accès GM/joueur ou route arbitraire.

Ce Viewer ne nécessite pas d’EBS privilégié, de JWT vérifié par notre serveur ou de
secret d’extension : aucune commande Twitch n’est exécutée. Un tel besoin imposerait
une nouvelle frontière authentifiée, non simulée ici. Le type Panel est le point
d’entrée sans live ; la vérification d’un Overlay sur la vidéo est séparée. Voir
[TWITCH-LOCAL-TEST.md](TWITCH-LOCAL-TEST.md) et le bilan associé pour les limites de
Local Test, du mobile, du Hosted Test et de l’environnement Cloud.
