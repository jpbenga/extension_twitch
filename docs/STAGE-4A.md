# Jalon 4A — Studio Créateur hybride

Base : `e39492b`, branche `feat/creator-studio-4a`. L’addendum utilisateur autorise
ce lot avant Undercover complet. Les règles des trois jeux officiels restent ouvertes.
Validation technique du lot précédent terminée — Validation humaine iPhone en attente.

## Un format, trois entrées

La bibliothèque et le moteur utilisent GameDefinition. Une variante clone une
version existante vers un nouvel identifiant de jeu et un brouillon indépendant.
Le guide est un compilateur de choix vers GameDefinition, jamais un moteur. Le
Studio avancé édite le même document. Le guide initial ne concerne qu’un compteur
collectif ; il ne prétend pas couvrir équipes, quiz ou jeux de déduction. Une
modification avancée non représentable bloque le retour au guide et conserve tout
le document. L’édition avancée du lot reste technique (JSON validé et champs simples),
pas un éditeur graphique d’expressions ou de scènes complet.

## Bibliothèque et cycle de vie

Un espace propriétaire contient jeux personnels, brouillons, versions publiées et
installations épinglées. Le catalogue serveur expose les exemples officiels du
Studio ; Undercover/Enchères/Espion restent signalés comme prévus. Un jeu installé
est une référence immuable, pas un brouillon modifiable. Une variante est un autre
jeu avec filiation exacte (identifiant/version/auteur), règles de partage et
attributions conservées. Sauvegarder change un brouillon ; publier crée une nouvelle
version, sans modifier celles déjà publiées. Les parties et les installations
conservent leur version ; aucune mise à jour automatique.

La publication de 4A fige une version dans une bibliothèque **privée**. Elle ne
publie pas sur Internet. Un futur Store sera une publication séparée, avec revue,
modération et visibilité explicite. Les métadonnées préparent source officielle /
personnelle / communautaire, auteur déclaratif et propriétaire, catégorie, tags,
effectif recommandé, compatibilité moteur, filiation, licence et permissions de
variante, dépendances d’assets, statut de publication et modération. Les règles ne
sont pas supposées couvertes par les mêmes droits que les graphismes, sons ou vidéos.

Sans comptes, le propriétaire est un espace protégé par une capacité aléatoire
32 octets dont seul le condensat est stocké. Aucun nom ou champ owner du navigateur
n’attribue de droits. La capacité de bibliothèque est distincte de celles des sessions
et ne donne pas autorité GM sur une session existante. Le lien de récupération est
privé, importé depuis un fragment puis effacé ; aucune récupération par e-mail ni
identité publique vérifiée. Réserver l’application à un réseau de confiance ou un
hébergement protégé. Aucun Store ni authentification publique n’est simulé.

## Moteur expressif borné

V1 reste exécutable sans migration. V2 ajoute un arbre d’expressions typées (valeurs,
références à soi/session/paramètres/configuration, arithmétique entière, comparaisons
et logique), gardes booléennes et valeurs d’effets calculées. Profondeur maximale 4,
collections bornées, aucun code/évaluation de texte, réseau, boucle ou effet implicite.
Les types, références, permissions et flux privés sont contrôlés à la sauvegarde
puis à l’exécution. Pas de lecture de participant arbitraire, ni d’oracle sur les
variables cachées. Les effets restent atomiques, les bornes numériques conservées.
La migration v1 vers v2 est explicite et conserve les données ; pas de rétroconversion
silencieuse. Les futures primitives ne sont pas implémentées juste pour remplir un
formulaire. Le guide ne propose que des choix exécutables par ces primitives.

## Assets, duplication et export

La définition contient des emplacements logiques ; le brouillon contient un manifest
séparé avec droits, attribution, référence facultative et état de remplacement.
Seules les références HTTPS publiques actives explicitement redistribuables sont
copiées dans une variante/publication. Les références privées, locales, désactivées
ou non redistribuables sont retirées ; la dépendance et la raison du remplacement
restent visibles. Aucun fichier n’est transféré ni résolu. Les copies utilisent les
fonds/placeholders existants. Le partage de la définition ne vaut pas autorisation
de redistribuer ses médias. Les attributions originales ne sont pas effacées.

Le manifest d’export préparatoire ne contient ni état de session, ni capacité, ni
configuration privée, ni définition brute, ni référence de stockage. Il n’est pas
encore un bundle de jeu réimportable. Le futur export complet demandera une politique
explicite sur les paramètres privés et les ressources. Le modèle de Store prévoit
fiche stable, filiation, modération et découverte de chaîne opt-in ; aucun endpoint
public ne révèle les créations privées. L’API Twitch n’est pas requise.

## Livraison et vérifications prévues

1. Contrats de bibliothèque/Store et langage v2, tests de types et confidentialité.
2. Persistance SQLite additive, capacité propriétaire, commandes idempotentes et
   conflits de version ; duplication, installation, sauvegarde, publication privée.
3. Accueil trois parcours, éditeur minimal et test d’un brouillon/version dans une
   vraie session, avec les mêmes interfaces et règles serveur que le laboratoire.
4. Tests unitaires, API, restauration et navigateur multi-appareils ; guide manuel.

Pas de Store public, assistant complet, intégration Twitch, cloud de médias ou
éditeur visuel de scènes dans ce lot. Les suites attendent une nouvelle demande.

## Bilan de ce lot

Effectif : trois entrées sous `/creator`, bibliothèque persistante privée, installation
épinglée, duplication indépendante, filiation exacte, brouillons révisés, publications
privées immuables, attestations de droits et manifest d’export préparatoire.
Le catalogue initial contient les deux exemples du Studio, pas une implémentation
des trois jeux officiels V1. Les conditions de partage de ces exemples sont des
métadonnées pédagogiques ; la politique juridique du Store reste à définir.

Le guide initial compile un compteur collectif vers v2. Un document modifié en mode
avancé reste conservé ; sa représentation guidée est vérifiée côté serveur. Le Studio
avancé est un éditeur technique JSON complété de champs simples. Ce n’est pas encore
un outil visuel complet sans programmation. Les textes de paramètres sont libres :
le créateur adapte le libellé lorsqu’il change une borne.

La préparation de test crée une vraie session et y copie la définition avant les
inscriptions. Le GM invite les joueurs puis installe cette copie avec une commande
validée. Les modifications ultérieures de bibliothèque n’affectent ni la copie
préparée ni les parties actives. Les accès bibliothèque, GM, joueur et public sont
séparés. Une réinitialisation du salon retire aussi sa définition préparée.

### Contrats futurs uniquement

`storeListingSchema` prépare jeu/version stables, auteur et propriétaire, source,
métadonnées, filiation, compatibilité, dépendances sans références privées, statut
et modération. `channelDiscoverySchema` prépare la visibilité opt-in d’un jeu publié
sur une chaîne. `moderationDecisionSchema` prépare un blocage externe à la version
immuable, y compris par asset. Aucun endpoint Store, fiche publique, modération,
installation communautaire distante, OAuth ou API Twitch n’est implémenté.

Le manifest d’export est consultable, mais n’est pas une définition exportable et
réimportable : il exclut complètement définition brute, paramètres privés, capacités
et références de stockage. Aucun média n’est résolu ou transféré. Les droits, la
redistribution et la filiation ne sont pas vérifiés juridiquement par le logiciel.

### Persistance et API

Migration SQLite additive v1→v2 : `creator_workspaces` et `creator_receipts`, dans la
même base privée que les sessions. Les anciens états et reçus de session restent
utilisables. L’espace garde au plus 16 créations, 8 versions par création et
32 installations (quotas techniques du prototype). Sauvegarde/conflit au niveau de
l’espace ; le brouillon a aussi un numéro de révision pour préserver les copies
locales. Les commandes idempotentes utilisent un identifiant et une empreinte.

Via le relais web `/api/server` (tous les accès Studio exigent le Bearer propriétaire) :

- `POST /studio/workspaces` : créer/reprendre une bibliothèque.
- `GET /studio/workspaces/:id` : bibliothèque privée et catalogue pédagogique.
- `POST /studio/workspaces/:id/commands` : installer, dupliquer, créer/enregistrer,
  appliquer le guide ou publier une version privée.
- `POST /studio/workspaces/:id/test-sessions` : préparer une session réelle ; sa
  capacité GM est distincte et aucun rôle n’est attribué depuis un champ frontend.
- `POST /studio/workspaces/:id/manifest` : projection d’export autorisée et limitée.

Les commandes de Studio sont limitées à 32 Kio, les définitions restent à 6 000 octets,
les commandes de session restent à 8 Kio. V2 autorise quatre niveaux d’opérateurs
(add/subtract/multiply/eq/lt/gte/and/or/not), sans division ni boucles. Les gardes
utilisent des variables/configurations disponibles avant la saisie ; les paramètres
d’action sont réservés aux expressions d’effets. Une erreur de garde rend l’action
indisponible ; une erreur d’effet annule tous ses effets. Les flux GM/owner vers une
sortie publique sont refusés hors révélation explicite autorisée.

### Vérifications exécutées

- `npm test` : **77 tests passants**, dont les 60 précédents. Couverture supplémentaire :
  copie/filiation, immutabilité, licences/dépendances, expressions, propriété, conflits,
  reçus, restauration SQLite et migration depuis une base de sessions v1.
- `npm run typecheck`, `npm run build`, `npm run format:check` : réussis.
- Chromium système : suite existante et trois scénarios Studio, **42 parcours passants**
  sur téléphone/tablette/desktop, puis scénario avancé supplémentaire ciblé sur les
  trois mêmes formats (**3 passants**). Les 45 cas sont dans `tests/e2e`.
- `npm run test:lab` avec Chromium système : **1 parcours passant**, laboratoire de
  développement conservé. `/lab` demeure absent en production.
- Captures du Studio et de la régie mobile inspectées. Aucun véritable iPhone,
  Safari iOS ou OBS physique testé. Les adresses distantes ne sont pas provisionnées.

Validation technique terminée — Validation humaine iPhone en attente.
Scénarios reproductibles et résultats attendus : [TEST-CREATOR.md](TEST-CREATOR.md).

Suite recommandée après retours : confort de l’éditeur et modèles guidés supplémentaires,
édition visuelle des expressions/scènes, puis conception des comptes, publication
communautaire, modération et politique d’export. Aucun de ces chantiers ne démarre
automatiquement. Les règles Undercover restent à valider séparément.
