# Architecture — socle technique

Statut : choix techniques validés. Les sections initiales décrivent l’historique A ; les évolutions du moteur et du Studio figurent en fin de document. État actuel : Undercover de démonstration jouable, jalon 5A. Voir [le bilan actuel](STAGE-5.md).

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
