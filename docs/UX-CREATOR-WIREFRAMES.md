# Studio Créateur — Wireframes très basse fidélité et textes actuels

> Document historique du jalon 4B. Pour l’interface actuelle, consulter
> [le bilan 4B.1](STAGE-4B1.md) et [le guide de test actuel](TEST-STUDIO-4B1.md).

Date : 23 octobre 2026. Version observée : jalon 4B, commit `f36e913`.

Objectif : permettre une analyse des écrans, des mots employés et des parcours
avant de décider des modifications. Ce document décrit l’interface existante.
Les questions d’analyse ne sont pas des changements déjà décidés.

Lecture fondée sur les composants de l’application. Ces schémas ne sont pas des
captures d’écran ni une validation de Safari sur un véritable iPhone.

## 0. Comment lire ce document

- `[Texte]` : bouton ou lien portant ce libellé.
- `[valeur____]` : champ à remplir.
- `[valeur v]` : liste déroulante.
- `[x]` / `[ ]` : case cochée / non cochée.
- `> Texte` : panneau replié ; `v Texte` : panneau ouvert.
- `{texte}` : contenu variable, par exemple le nom du jeu.
- Les valeurs Score, Mon jeu et Gagner un point servent d’exemples de contenu.
- Les libellés et textes d’aide cités sont ceux du produit actuel ; les explications
  « Fonctionnement » et « À examiner » sont ajoutées pour l’analyse.
- Les retours à la ligne sont simplifiés pour rendre le Markdown facile à copier.

### Point essentiel sur la structure actuelle

Le créateur est principalement **une seule longue page**, à l’adresse `/creator`.
Les « écrans » ci-dessous désignent souvent des blocs ou des états de cette page,
pas des pages distinctes. Le changement de section du Studio ne quitte pas `/creator`.

Sur le réseau actuellement utilisé : `http://192.168.0.46:3000/creator`.
Cette adresse peut changer si le Mac change d’adresse réseau.

La régie GM, les joueurs et le plateau de test s’ouvrent, eux, dans d’autres onglets.

## 1. Vue d’ensemble des parcours

```text
/creator
  |
  +-- Première visite : créer une bibliothèque privée
  |
  +-- Utiliser ou personnaliser un jeu existant
  |     +-- Créer une variante -> ouvrir son brouillon
  |     +-- Installer -> retrouver une version figée
  |     +-- Tester l’original -> préparer une session
  |
  +-- Créer un jeu avec un guide
  |     +-- Choisir -> Construire -> Nommer
  |     +-- Créer le brouillon guidé -> même éditeur
  |
  +-- Créer librement dans le Studio avancé
        +-- Nommer -> Créer le brouillon avancé
        +-- même éditeur

ÉDITEUR DE BROUILLON
  Général / Rôles / Variables / Actions / Conditions et effets
  Phases et transitions / Apparence / Tester / Publier
        |
        +-- Enregistrer -> conserver le brouillon
        +-- Tester -> figer une copie dans une session
        +-- Publier -> conserver une version privée immuable
```

### Les mots à distinguer

| Mot affiché                     | Ce qu’il signifie actuellement                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| Bibliothèque                    | Espace privé contenant les créations et installations.                                    |
| Brouillon                       | Définition du jeu que l’on peut encore modifier.                                          |
| Variante                        | Nouveau brouillon indépendant, issu d’une version d’un autre jeu.                         |
| Installer un jeu du catalogue   | Ajouter une référence à une version figée dans sa bibliothèque. Ne crée pas de brouillon. |
| Installer le jeu pour cet essai | Charger la définition préparée dans une session et figer ses participants.                |
| Version publiée                 | Copie immuable, encore privée. Elle n’est pas proposée dans un Store public.              |
| Session                         | Une utilisation du jeu avec un GM et des participants.                                    |
| Phase                           | Une étape pendant la partie, par exemple Collecte ou Résultat.                            |
| Paramètre d’action              | Une valeur saisie quand une personne effectue une action.                                 |
| Variable                        | Une information conservée par la partie, par exemple un score.                            |
| Condition                       | Un contrôle qui détermine si une action est autorisée.                                    |
| Effet                           | Le changement produit quand l’action est acceptée.                                        |

À examiner : ces définitions sont-elles compréhensibles sans cette explication ?
Le mot « installer » désigne actuellement deux opérations différentes.

## 2. Accueil commun du créateur

```text
+--------------------------------------------------+
| Extension Twitch                  STUDIO CRÉATEUR |
|                                         CRÉATION |
|                                                  |
| VOTRE PROCHAINE ÉMISSION COMMENCE ICI              |
| Jouez. Créez. Faites-en votre jeu.                |
|                                                  |
| Trois portes d’entrée, une même bibliothèque.     |
| Vos variantes et vos versions utilisent           |
| le moteur de vos émissions.                      |
|                                                  |
| [01 Utiliser ou personnaliser un jeu existant]    |
| Partir d’un exemple et créer une variante         |
| indépendante.                                    |
|                                                  |
| [02 Créer un jeu avec un guide]                   |
| Choisir un modèle, ses règles et sa présentation, |
| étape par étape.                                 |
|                                                  |
| [03 Créer librement dans le Studio avancé]        |
| Composer rôles, règles, actions et phases         |
| avec des formulaires.                            |
+--------------------------------------------------+
```

Fonctionnement : choisir une carte sélectionne un parcours et déplace la lecture
vers le bloc de travail. Cela ne crée pas encore un jeu. Les trois cartes restent
présentes au-dessus du contenu. Sur ordinateur, elles sont côte à côte ; sur un
petit écran, elles sont empilées.

À examiner : comprend-on immédiatement la différence entre personnaliser, créer
avec un guide et créer librement ? Le mot « jeu » évoque-t-il une partie à jouer
ou un jeu à fabriquer ?

## 3. Première visite — Bibliothèque privée

Condition d’affichage : aucun accès à une bibliothèque n’est chargé.
Ce bloc apparaît sous les trois choix de parcours.

```text
+--------------------------------------------------+
| Une bibliothèque privée, sans compte             |
|                                                  |
| Votre lien privé donne accès à vos créations.     |
| Votre nom est déclaratif, sans identité publique  |
| vérifiée. Conservez ce lien : il n’y a pas de      |
| récupération par e-mail.                         |
|                                                  |
| Nom du créateur ou de la bibliothèque             |
| [Ma bibliothèque____________________________]    |
|                                                  |
| [Créer ma bibliothèque privée]                   |
+--------------------------------------------------+
```

Après création, le message affiché est :

> Bibliothèque privée créée. Conservez votre lien de récupération.

Si un accès existe mais que son chargement échoue, le bouton proposé est :

> Réessayer l’accès à la bibliothèque

Fonctionnement : le lien privé est la clé d’accès. Le nom saisi ne crée pas un
compte vérifié. Il n’existe pas de récupération par e-mail.

À examiner : l’obligation de créer une bibliothèque avant de commencer est-elle
évidente ? « Nom déclaratif », « identité vérifiée » et « lien de récupération »
sont-ils adaptés à une première visite ?

## 4. Bibliothèque déjà ouverte — En-tête et récupération d’accès

```text
+--------------------------------------------------+
| BIBLIOTHÈQUE PERSONNELLE                          |
| {Nom de la bibliothèque}                         |
| Privée · sans compte · version {n}                |
|                                                  |
| [Actualiser la bibliothèque]                     |
|                                                  |
| > Conserver mon accès créateur                   |
|   Ce lien donne accès à tous vos brouillons.     |
|   Ne le partagez pas avec vos joueurs            |
|   ou spectateurs.                                |
|                                                  |
|   Accès privé à ma bibliothèque                   |
|   [{lien privé}_____________________________]    |
|   [Copier mon accès privé]                       |
+--------------------------------------------------+
```

Textes après copie :

- « Lien copié. »
- Si la copie automatique échoue : « Sélectionnez et copiez le lien avec le menu de votre appareil. »

Après actualisation :

> Bibliothèque actualisée. Les modifications locales de l’éditeur sont conservées.

Fonctionnement : actualiser relit les données du serveur. Cela ne remplace pas
silencieusement le travail local de l’éditeur.

À examiner : « version {n} » désigne ici la bibliothèque, pas une version publiée
d’un jeu. Cette différence n’est pas expliquée dans le libellé.

## 5. Parcours existant — Catalogue d’exemples

```text
+--------------------------------------------------+
| CATALOGUE OFFICIEL · EXEMPLES STUDIO               |
| Un point de départ pour votre émission            |
|                                                  |
| OFFICIEL · EXEMPLE                               |
| Impulsion collective                             |
| {Description du jeu}                             |
| v0.1.0 · Extension Twitch Studio · exemple        |
|                                                  |
| [Créer une variante de Impulsion collective]     |
| [Installer Impulsion collective]                 |
| [Tester l’original Impulsion collective]          |
|                                                  |
| OFFICIEL · EXEMPLE                               |
| La boîte à réponses                              |
| {Description du jeu}                             |
|                                                  |
| [Créer une variante de La boîte à réponses]      |
| [Installer La boîte à réponses]                  |
| [Tester l’original La boîte à réponses]           |
+--------------------------------------------------+
```

Texte sous le catalogue :

> Undercover, Enchères et Qui est l’espion restent prévus. Leurs règles complètes
> ne sont pas encore disponibles. Le Store communautaire est préparé dans les
> contrats ; aucun catalogue public n’est actif.

| Action             | Résultat réel                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Créer une variante | Crée et ouvre un brouillon indépendant. Le titre initial se termine par « · variante ». L’origine est conservée.  |
| Installer          | Ajoute la version à « Jeux installés — versions figées ». Le bouton devient indisponible pour cette installation. |
| Tester l’original  | Prépare une session avec la définition originale, sans nécessiter une variante.                                   |

À examiner : faut-il afficher trois actions au même niveau pour quelqu’un qui
veut simplement essayer un jeu ? Le badge « OFFICIEL » peut-il faire penser que
les trois jeux annoncés, dont Undercover, sont déjà disponibles ?

## 6. Mes brouillons et mes jeux installés

Ce bloc reste visible même si le guide ou un éditeur est ouvert plus bas.

```text
+--------------------------------------------------+
| Vos jeux et vos versions                         |
|                                                  |
| JEU PERSONNEL / VARIANTE PERSONNELLE              |
| {Titre du brouillon}                             |
| Brouillon r{n} · {n} version(s) publiée(s)         |
| [Modifier {Titre du brouillon}]                   |
|                                                  |
| Jeux installés — versions figées                  |
| {Titre} · v{version} · {origine}                   |
| [Préparer un test]                               |
| [Créer une variante du jeu installé]              |
+--------------------------------------------------+
```

État vide :

> Aucun brouillon personnel. Choisissez un parcours ci-dessus pour commencer.

Fonctionnement : « Modifier » ouvre le brouillon plus bas dans la même page.
Les versions publiées détaillées se consultent dans l’éditeur, en Général ou Publier.
L’installation seule n’ouvre pas un éditeur.

À examiner : « Vos jeux et vos versions » annonce-t-il une information plus
complète que celle réellement visible dans les cartes ? Que signifie `r{n}` ?

## 7. Guide — Étape 1 : Choisir

```text
+--------------------------------------------------+
| CRÉATION GUIDÉE · 1 / 3                           |
| Un premier jeu, pas à pas                        |
| [1. Choisir] [2. Construire] [3. Nommer]           |
|                                                  |
| Que feront vos invités ?                         |
| Modèle de départ                                 |
| [Compteur collectif — contribuer à un objectif v] |
|                                                  |
| {Explication du modèle sélectionné}              |
|                                                  |
| Participants individuels, jusqu’à 32 par session. |
| Équipes, vote à candidats et correction           |
| automatique d’un quiz ne sont pas encore          |
| disponibles.                                     |
|                                                  |
| [Étape suivante]                                 |
+--------------------------------------------------+
```

Deux choix réels :

1. « Compteur collectif — contribuer à un objectif ».
2. « Réponses privées — écrire puis révéler ».

Texte pour le compteur :

> Les joueurs apportent des points à un compteur commun. Le GM ouvre la collecte
> et clôture lorsque l’objectif est atteint.

Texte pour les réponses :

> Les joueurs envoient une réponse personnelle. Un rôle relecteur vérifie les
> statuts de réception ; seul le GM peut révéler les réponses.

Fonctionnement : les boutons numérotés permettent aussi d’aller directement à une
étape. Il n’y a pas de choix du nombre de participants ou d’équipes dans ce guide.
« Jusqu’à 32 » décrit une capacité de session, pas un réglage saisi ici.

À examiner : la différence entre choisir un modèle ici et choisir un exemple du
catalogue est-elle assez claire ? « GM », « collecte » et « relecteur » sont-ils compris ?

## 8. Guide — Étape 2 : Construire un compteur

```text
+--------------------------------------------------+
| CRÉATION GUIDÉE · 2 / 3                           |
| Un premier jeu, pas à pas                        |
| [1. Choisir] [2. Construire] [3. Nommer]           |
|                                                  |
| Quel objectif et quelles contributions ?         |
|                                                  |
| Objectif collectif (points)                      |
| [4________]                                      |
| Points maximum par contribution                  |
| [3________]                                      |
| Multiplicateur des points                        |
| [1________]                                      |
| Participation                                    |
| [Une contribution par joueur v]                  |
|                                                  |
| [Étape précédente] [Étape suivante]               |
+--------------------------------------------------+
```

Valeurs et options actuelles :

| Champ                           | Valeur initiale             | Possibilités                   |
| ------------------------------- | --------------------------- | ------------------------------ |
| Objectif collectif (points)     | 4                           | De 1 à 100.                    |
| Points maximum par contribution | 3                           | De 1 à 10.                     |
| Multiplicateur des points       | 1                           | De 1 à 5.                      |
| Participation                   | Une contribution par joueur | Ou « Contributions répétées ». |

Texte d’aide :

> Ces étapes produisent une définition réellement exécutée sur le serveur, avec
> transitions GM. Aucune règle de victoire des jeux officiels n’est supposée.

Fonctionnement : les choix sont conservés lors d’un retour à l’étape précédente
pendant ce parcours. Le compteur additionne les contributions multipliées.
Atteindre l’objectif autorise la clôture par le GM ; la fin n’est pas automatique.

À examiner : un exemple chiffré serait-il nécessaire pour comprendre le
multiplicateur ? Le texte sur le serveur aide-t-il à créer son jeu ?

## 9. Guide — Étape 2 : Construire des réponses privées

```text
+--------------------------------------------------+
| CRÉATION GUIDÉE · 2 / 3                           |
| Quelles étapes et informations privées ?          |
|                                                  |
| Préparation -> Écriture -> Vérification           |
| -> Révélation.                                   |
|                                                  |
| Une réponse texte par joueur, privée jusqu’à      |
| la révélation GM. Le rôle relecteur ne voit pas   |
| les réponses des autres. Vous pourrez modifier   |
| rôles, textes et règles dans le Studio.           |
|                                                  |
| [Étape précédente] [Étape suivante]               |
+--------------------------------------------------+
```

Fonctionnement : cette étape explique le modèle ; elle ne comporte pas de réglage.
Le texte d’aide sur la définition exécutée et les transitions GM est également présent.
Ce parcours crée une variante de « La boîte à réponses », avec sa filiation.
Le compteur guidé crée, lui, un jeu personnel sans cette filiation.

À examiner : une étape appelée « Construire » sans aucun champ est-elle
compréhensible ? Le guide parle d’Écriture/Vérification, tandis que la partie
emploie notamment Réponses privées/Relecture : faut-il harmoniser ces mots ?

## 10. Guide — Étape 3 : Nommer

```text
+--------------------------------------------------+
| CRÉATION GUIDÉE · 3 / 3                           |
| [1. Choisir] [2. Construire] [3. Nommer]           |
|                                                  |
| Quel nom pour votre émission ?                   |
| Titre du nouveau jeu                             |
| [Mon nouveau jeu____________________________]    |
|                                                  |
| Modèle : {Compteur collectif / Réponses privées}. |
| Le brouillon restera privé. Vous pourrez ensuite |
| ajuster les variables, permissions et actions     |
| dans le même Studio.                             |
|                                                  |
| [Étape précédente] [Créer le brouillon guidé]      |
+--------------------------------------------------+
```

Fonctionnement : le bouton crée le brouillon puis ouvre l’éditeur commun. Le
créateur n’est pas envoyé directement dans une partie. Le titre est limité à 80 caractères.

À examiner : la question demande le nom de l’« émission », mais le champ enregistre
le titre du « jeu ». Ces deux notions doivent-elles être séparées ?

## 11. Création avancée — Démarrage

```text
+--------------------------------------------------+
| Votre terrain de création                        |
|                                                  |
| Composez rôles, variables, actions et phases      |
| avec les formulaires. Les expressions avancées   |
| utilisent le même moteur.                        |
|                                                  |
| Titre du nouveau jeu                             |
| [Mon nouveau jeu____________________________]    |
|                                                  |
| [Créer le brouillon avancé]                      |
+--------------------------------------------------+
```

Fonctionnement : le jeu créé n’est pas vide. Il contient notamment :

- une variable publique Score, initialement à 0 ;
- une phase « En direct » ;
- une action GM « Ajouter un point » ;
- des rôles d’Animateur, Contributeur et Spectateur.

Le joueur ne dispose pas automatiquement de l’action GM. Le créateur doit ajouter
ou adapter une action et ses rôles autorisés pour faire agir les joueurs.

À examiner : ce point de départ est-il annoncé assez clairement ? Pourquoi le
même éditeur s’appelle-t-il ensuite « Personnaliser votre jeu » ?

## 12. Éditeur commun — Cadre et navigation

### Smartphone et tablette

```text
+--------------------------------------------------+
| BROUILLON INDÉPENDANT · r{n}                      |
| Personnaliser votre jeu                          |
| Brouillon enregistré                            |
| · personal · auteur déclaratif : {nom}            |
|                                                  |
| v Origine et attributions   (si variante)         |
| {Auteur} · v{version source}                     |
| {Identifiant et conditions d’origine}            |
|                                                  |
| Section du Studio                               |
| [Général v]                                     |
|                                                  |
| {Contenu de la section sélectionnée}             |
|                                                  |
| > Studio avancé — définition complète            |
| > Revenir aux choix du guide  (si disponible)     |
|                                                  |
| [Enregistrer le brouillon]                       |
| [Préparer un test du brouillon]                  |
+--------------------------------------------------+
```

### Ordinateur

```text
+-------------------------+------------------------+
| Général                 | Contenu de la section  |
| Participants et rôles    |                        |
| Variables               | Formulaires            |
| Actions                 |                        |
| Conditions et effets    | Panneaux techniques    |
| Phases et transitions   |                        |
| Apparence               | Enregistrement         |
| Tester                  |                        |
| Publier                 |                        |
+-------------------------+------------------------+
```

Les neuf intitulés ci-dessus sont les options exactes de navigation. La navigation
latérale est utilisée à partir de 1 000 px ; en dessous, le menu compact est affiché.
La barre d’enregistrement reste accessible pendant le défilement de l’éditeur.

Textes communs supplémentaires :

- État modifié : « Modifications locales non enregistrées ».
- Origine : « Cette filiation est conservée par le serveur. Les droits des médias sont distincts. »
- Si le jeu est en v1 : « Ce jeu utilise le langage v1. Les conditions composées et calculs nécessitent v2 ; la conversion conserve les règles existantes. »
- Bouton associé : « Activer les expressions v2 ».

Fonctionnement : les formulaires modifient d’abord la copie locale du brouillon.
L’enregistrement sur le serveur reste une action explicite. L’activation v2 doit
également être enregistrée. Les identifiants existants ne sont pas réécrits automatiquement.

À examiner : l’auteur, l’origine technique `personal`, la révision et le langage
v1/v2 doivent-ils apparaître aussi tôt pour un créateur débutant ?

## 13. Général

```text
+--------------------------------------------------+
| Titre du brouillon                               |
| [Mon jeu____________________________________]    |
| Description du jeu                               |
| [___________________________________________]    |
| Catégorie                                        |
| [community__________________________________]    |
| Tags (séparés par des virgules)                   |
| [___________________________________________]    |
|                                                  |
| v Paramètres des actions                         |
|   Libellé · {Nom de l’action}                    |
|   [{Nom du paramètre}_______________________]    |
|   Maximum · {Libellé du paramètre numérique}     |
|   [3________]                                    |
|                                                  |
| > Studio avancé — définition complète            |
| > Revenir aux choix du guide  (si disponible)     |
| > Assets et autorisations de partage             |
| > Droits de la définition et des règles           |
|                                                  |
| [Enregistrer le brouillon]                       |
| [Préparer un test du brouillon]                  |
|                                                  |
| Publier une version immuable                     |
| {Formulaire de publication et versions}          |
+--------------------------------------------------+
```

Texte du panneau de paramètres :

> Les libellés sont libres : ajustez-les lorsque vous changez une borne. Retrouvez
> les variables, rôles, conditions, effets et phases dans les sections du Studio.
> Les scènes graphiques restent prévues pour 4C.

Fonctionnement : titre et description correspondent au jeu. Catégorie et tags sont
modifiables, mais ne créent pas une présence dans un Store. Le panneau de paramètres
regroupe ceux des différentes actions ; il peut n’avoir aucun champ si aucune
action n’en possède. Il propose les libellés et, pour les nombres, leur maximum.
Le libellé de ce panneau est appliqué à la sortie du champ.

À examiner : pourquoi des paramètres d’action, des droits, du JSON et la publication
sont-ils tous présents dans Général ? La valeur technique « community » est-elle
adaptée à un jeu privé ? Pourquoi la même information existe-t-elle aussi dans Actions ?

## 14. Participants et rôles

```text
+--------------------------------------------------+
| Participants et rôles                            |
| {Texte d’explication des droits}                 |
|                                                  |
| Rôle attribué aux nouveaux joueurs               |
| [Contributeur v]                                 |
|                                                  |
| RÔLE DE JEU                                      |
| Nom du rôle 2                                    |
| [Contributeur_______________________________]    |
| Identifiant du rôle 2                            |
| [contributor_______________________________]     |
| Description du rôle 2                            |
| [___________________________________________]    |
| Actions autorisées : {noms ou aucune}.           |
| [Supprimer le rôle Contributeur]                 |
|                                                  |
| [Ajouter un rôle]                               |
+--------------------------------------------------+
```

Texte d’aide exact :

> Le GM authentifié conserve son autorité serveur. Les rôles personnalisés sont
> des rôles de joueurs ; leurs permissions se règlent action par action.

Badges possibles : « AUTORITÉ GM », « SPECTATEUR · LECTURE SEULE », « RÔLE DE JEU ».
Autre texte : « Les affectations de rôles ne sont pas exposées au plateau. »

Fonctionnement : un nouveau rôle est nommé « Nouveau rôle » et reçoit un identifiant
comme `role-1`. Ses autorisations sont réglées dans les actions. Un rôle encore
référencé ne peut pas être supprimé. Les rôles GM et spectateur n’ont pas de bouton
de suppression. Il n’y a pas de liste de personnes à inviter dans cette section :
les participants réels rejoignent une session, et le GM y affecte les rôles.

À examiner : le titre « Participants et rôles » laisse-t-il attendre une gestion des
personnes absente ici ? Un créateur comprend-il pourquoi ajouter un rôle ne lui
attribue aucune action ?

## 15. Variables

```text
+--------------------------------------------------+
| Variables                                        |
| {Texte sur les informations individuelles}       |
|                                                  |
| Nom de la variable 1                             |
| [Score______________________________________]    |
| Identifiant de la variable 1                     |
| [score______________________________________]    |
| Portée · score                                   |
| [Toute la session v]                             |
| Visibilité · score                               |
| [Publique v]                                     |
| Type · score                                     |
| [Nombre entier v]                                |
| Valeur initiale · score                          |
| [0________]                                      |
| Minimum · score  [0________]                     |
| Maximum · score  [100000___]                     |
|                                                  |
| [Supprimer la variable Score]                    |
| [Ajouter une variable]                          |
+--------------------------------------------------+
```

Texte d’aide exact :

> Les variables individuelles appartiennent au joueur qui agit. Les identifiants
> sont des références stables : les renommer ne réécrit pas les règles.

Options disponibles :

| Champ              | Options affichées                              |
| ------------------ | ---------------------------------------------- |
| Portée             | Toute la session ; Chaque participant.         |
| Visibilité         | Publique ; GM uniquement ; Ce joueur et le GM. |
| Type               | Nombre entier ; Texte ; Booléen.               |
| Initiale booléenne | Vrai ; Faux.                                   |

Avec Texte, les bornes numériques sont remplacées par « Longueur maximum · {id} ».
Avec Booléen, les champs de bornes disparaissent.

Fonctionnement : une variable ajoutée s’appelle « Nouvelle variable », avec un
identifiant comme `variable-1`. Elle est initialement numérique, publique, commune
à la session, à 0, entre 0 et 100 000. Changer son type remet son initiale et ses
contraintes aux valeurs par défaut de ce type. Une variable utilisée ne peut pas
être supprimée ; renommer son identifiant ne met pas à jour ses usages.

À examiner : peut-on comprendre la différence entre nom, identifiant, portée et
visibilité sans connaissances techniques ? Le changement de type et ses conséquences
sont-ils suffisamment visibles ?

## 16. Actions — Sélection et permissions

```text
+--------------------------------------------------+
| Actions                                          |
| Choisissez une action pour régler qui peut agir, |
| à quel moment et avec quels effets. Les événements|
| personnalisés ne sont pas encore disponibles.   |
|                                                  |
| [Ajouter un point] [Gagner un point]              |
| [Ajouter une action]                             |
|                                                  |
| Nom de l’action                                  |
| [Gagner un point____________________________]    |
| Identifiant de l’action                          |
| [action-1___________________________________]    |
| Description de l’action                          |
| [___________________________________________]    |
|                                                  |
| Rôles autorisés                                  |
| [ ] Animateur   [x] Contributeur                  |
|                                                  |
| Phases disponibles                               |
| [x] En direct  [ ] Résultat                       |
|                                                  |
| [ ] Demander une confirmation avant exécution    |
|                                                  |
| Paramètres à saisir                              |
| {Voir section suivante}                         |
| Conditions d’autorisation                        |
| {Voir conditions}                               |
| Effets, dans l’ordre                             |
| {Voir effets}                                   |
| Après cette action                               |
| [Rester dans la phase courante v]                |
|                                                  |
| [Supprimer cette action]                        |
+--------------------------------------------------+
```

Fonctionnement : les boutons du haut sélectionnent l’action à éditer. Une nouvelle
action est nommée « Nouvelle action », porte un identifiant comme `action-1`, autorise
le rôle joueur par défaut dans la phase initiale, et n’a ni paramètre ni effet.
Les rôles spectateurs ne sont pas proposés pour agir.

La confirmation configurée ici sera demandée **pendant la partie**, avant d’exécuter
l’action ; ce n’est pas la confirmation de sauvegarde du brouillon.

Options de « Après cette action » :

- « Rester dans la phase courante » ;
- « Aller vers {Nom de phase} » pour chaque phase existante.

À examiner : le créateur sait-il que l’action choisie ici deviendra un bouton dans
la régie ou chez les joueurs ? Une action sans effet doit-elle être expliquée ?

## 17. Actions — Paramètres à saisir

```text
+--------------------------------------------------+
| Paramètres à saisir                              |
|                                                  |
| Nom du paramètre 1                               |
| [Valeur_____________________________________]    |
| Identifiant du paramètre 1                       |
| [parametre-1________________________________]    |
| Type · paramètre 1                               |
| [Nombre entier v]                                |
| Valeur initiale · paramètre 1  [1________]        |
| Minimum · paramètre 1         [0________]        |
| Maximum · paramètre 1         [100______]        |
|                                                  |
| [Supprimer le paramètre Valeur]                  |
| [Ajouter un paramètre]                          |
+--------------------------------------------------+
```

Fonctionnement : un paramètre est un champ que la personne remplira au moment de
jouer l’action. Il n’est pas une variable conservée automatiquement. Un effet doit
l’utiliser pour modifier une information de la partie. Les types sont les mêmes
que ceux des variables. Un paramètre référencé par un effet est protégé contre
la suppression.

Exemple explicatif : pour « Contribuer », le paramètre est le nombre de points
choisi maintenant ; le total conservé par le jeu est une variable.

À examiner : cette différence est-elle expliquée dans l’écran actuel ?

## 18. Conditions et effets — Deuxième accès aux mêmes règles

```text
+--------------------------------------------------+
| Conditions et effets                             |
| {Même texte introductif que dans Actions}       |
|                                                  |
| [Ajouter un point] [Gagner un point]              |
| [Ajouter une action]                             |
|                                                  |
| Conditions d’autorisation                        |
| {Égalités et condition composée}                |
|                                                  |
| Effets, dans l’ordre                             |
| {Liste ordonnée des effets}                     |
|                                                  |
| Après cette action                               |
| [Rester dans la phase courante v]                |
| [Supprimer cette action]                        |
+--------------------------------------------------+
```

Fonctionnement : cette section édite les mêmes actions que la section Actions.
Elle cache les champs nom, description, rôles, phases et paramètres pour se
concentrer sur leurs règles. Les changements ne sont pas une deuxième définition.

À examiner : ces deux entrées doivent-elles être distinctes ? Peut-on croire que
« Conditions et effets » configure des règles globales alors que l’on édite
encore les règles d’une action sélectionnée ?

## 19. Conditions — Égalités simples

```text
+--------------------------------------------------+
| Conditions d’autorisation                        |
|                                                  |
| Toutes les égalités existantes et la condition   |
| composée doivent être satisfaites. Le rôle et    |
| la phase sont toujours contrôlés par le serveur. |
|                                                  |
| Variable de la condition 1                       |
| [A déjà participé v]                            |
| Égal à · condition 1                             |
| [Faux v]                                         |
| [Retirer la condition 1]                         |
|                                                  |
| [Ajouter une égalité]                           |
| [Ajouter une condition composée]                |
+--------------------------------------------------+
```

Fonctionnement : toutes les égalités doivent être vraies. Si une condition composée
existe aussi, elle doit également être vraie. Le bouton d’ajout de condition composée
nécessite v2. Une action n’a qu’une condition composée racine, qui peut contenir
plusieurs sous-conditions.

À examiner : pourquoi deux mécanismes de conditions apparaissent-ils en parallèle ?
Faut-il comprendre « égalité » pour créer une première règle ?

## 20. Constructeur de condition composée

Exemple explicatif : autoriser l’action si Score est inférieur à 2.

```text
+--------------------------------------------------+
| Condition d’autorisation                         |
| Source · Condition d’autorisation                |
| [Inférieur v]                                   |
|                                                  |
|   Condition d’autorisation · 1                   |
|   Source · Condition d’autorisation · 1          |
|   [Variable v]                                  |
|   Référence · Condition d’autorisation · 1       |
|   [Score (score) v]                             |
|                                                  |
|   Condition d’autorisation · 2                   |
|   Source · Condition d’autorisation · 2          |
|   [Nombre v]                                    |
|   Valeur · Condition d’autorisation · 2          |
|   [2________]                                   |
|                                                  |
| > Édition avancée de cette expression             |
| [Retirer la condition composée]                 |
+--------------------------------------------------+
```

Les mots « Source » et « Référence » ci-dessus sont bien ceux de l’interface.

Choix du menu Source :

| Groupe     | Choix affichés                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Valeurs    | Nombre ; Texte ; Vrai / faux ; Variable ; Paramètre d’émission.                                                                              |
| Opérations | Égal ; Différent ; Supérieur ; Inférieur ; Supérieur ou égal ; Inférieur ou égal ; ET ; OU ; NON ; Addition ; Soustraction ; Multiplication. |

Dans un calcul d’effet, « Entrée de l’action » est aussi disponible. Cette option
n’est pas disponible dans une condition d’autorisation.

Fonctionnement : ET et OU ouvrent deux sous-expressions ; NON en ouvre une.
Les champs sont imbriqués et leurs noms reçoivent les suffixes « · 1 », « · 2 », etc.
Les types et la profondeur sont contrôlés. Une condition doit produire Vrai ou Faux.
Un paramètre d’émission est un réglage défini pour le jeu, distinct d’une entrée
saisie quand on joue une action ; il n’a pas d’éditeur dédié complet ici.

Le panneau technique contient « JSON · {Nom de l’expression} » et le bouton
« Appliquer l’expression ». Texte affiché :

> L’arbre est conservé intégralement. Appliquer remplace uniquement cette expression.

À examiner : « Source » signifie à la fois choisir une valeur et choisir un opérateur.
Les intitulés récursifs sont-ils compréhensibles sur téléphone ? Certains comparateurs
sont réécrits en opérations équivalentes : Différent devient NON puis Égal,
Supérieur devient Inférieur avec les deux valeurs inversées, et Inférieur ou égal
utilise Supérieur ou égal avec les valeurs inversées. Ce changement visible peut
rendre la règle difficile à reconnaître après sélection.

## 21. Effets

```text
+--------------------------------------------------+
| Effets, dans l’ordre                             |
|                                                  |
| Tous les effets réussissent ensemble ou la       |
| commande entière est annulée. Pour soustraire,   |
| utilisez un incrément négatif. Révéler est        |
| réservé au GM.                                   |
|                                                  |
| Effet 1                                          |
| Opération de l’effet 1                           |
| [Ajouter / soustraire v]                         |
| Variable de l’effet 1                            |
| [Score (score) v]                                |
| Source de l’effet 1                              |
| [Valeur fixe v]                                  |
| Valeur de l’effet 1                              |
| [1________]                                      |
|                                                  |
| [Monter l’effet 1] [Descendre l’effet 1]           |
| [Supprimer l’effet 1]                            |
| [Ajouter un effet]                              |
+--------------------------------------------------+
```

Opérations réelles : « Définir une variable », « Ajouter / soustraire »,
« Révéler publiquement ».

Sources pour Définir ou Ajouter / soustraire :

- « Valeur fixe » : champ de valeur ;
- « Entrée de l’action » : choix d’un paramètre existant ;
- « Paramètre d’émission » : choix d’un réglage existant ;
- « Expression calculée (v2) » : constructeur visuel, titré « Calcul de l’effet {n} ».

Pour Révéler publiquement, les champs de source et de valeur disparaissent.
Il n’y a pas ici d’effet « Envoyer un événement personnalisé » ou de code libre.
Le passage à une autre phase se règle dans « Après cette action ».

Fonctionnement : les effets s’exécutent dans l’ordre affiché. Monter/Descendre
modifient cet ordre ; le premier ne peut pas monter et le dernier ne peut pas descendre.
Si un effet échoue, aucun effet de cette action n’est conservé. Ajouter un effet
propose initialement d’incrémenter la première variable de 1.

À examiner : comprend-on « incrément négatif » ? Le comportement transactionnel
est-il clair ? Changer l’opération ou la source remet certaines valeurs à des
valeurs initiales : faut-il rendre ce changement plus explicite ?

## 22. Phases et transitions

```text
+--------------------------------------------------+
| Phases et transitions                            |
| Une transition est une action, manuelle ou       |
| conditionnée. Les transitions automatiques et    |
| chronomètres ne sont pas disponibles.            |
|                                                  |
| Phase initiale                                   |
| [En direct v]                                    |
|                                                  |
| ÉTAPE 1 · DÉPART                                 |
| Nom de la phase 1       [En direct__________]    |
| Identifiant de la phase 1 [live_____________]     |
| Description de la phase 1 [_________________]    |
| Gagner un point -> reste dans cette phase        |
| Terminer -> Résultat                             |
| [Supprimer la phase En direct]                   |
|                                                  |
| ÉTAPE 2                                          |
| Nom de la phase 2       [Résultat___________]    |
| Identifiant de la phase 2 [phase-1__________]     |
| Description de la phase 2 [_________________]    |
| [Supprimer la phase Résultat]                    |
|                                                  |
| [Ajouter une phase]                             |
+--------------------------------------------------+
```

Fonctionnement : ajouter une phase ne crée pas la transition qui y mène. Il faut
configurer une action, ses phases disponibles et « Après cette action ». La phase
initiale ou une phase utilisée par une action/scène ne peut pas être supprimée.
Une transition peut être déclenchée par un joueur si son action l’autorise, ou par
le GM ; sa condition éventuelle est contrôlée par le moteur.

Alerte possible :

> Phases sans chemin depuis le départ : {noms}. Ajoutez une action de transition.

À examiner : faut-il expliquer dès cet écran qu’une phase supplémentaire n’est pas
automatiquement « l’étape suivante » ? La configuration des transitions, placée
dans Actions, est-elle assez facile à trouver ?

## 23. Apparence, assets et droits

```text
+--------------------------------------------------+
| Apparence                                        |
|                                                  |
| Le plateau actuel affiche les valeurs publiques. |
| Les scènes et références logiques sont conservées;|
| la composition visuelle des widgets sera         |
| disponible en 4C. Aucun contrôle ici ne modifie   |
| OBS.                                             |
|                                                  |
| > Studio avancé — définition complète            |
| > Revenir aux choix du guide  (si disponible)     |
|                                                  |
| > Assets et autorisations de partage             |
|   {Liste des ressources et de leur statut}       |
|   [Retirer la référence {id}]  (si présente)      |
|   Manifest privé des dépendances JSON             |
|   [{Texte JSON}_____________________________]    |
|   [Appliquer le manifest d’assets au brouillon]  |
|                                                  |
| > Droits de la définition et des règles           |
|   Licence de ma contribution                     |
|   [{texte}__________________________________]    |
|   Conditions des règles                         |
|   [{texte}__________________________________]    |
|   Création de variantes                         |
|   [Non autorisée pour le partage futur v]        |
+--------------------------------------------------+
```

Les panneaux Assets et Droits sont aussi présents dans Général.
Les deux options de création de variantes sont :

- « Non autorisée pour le partage futur » ;
- « Autorisée selon ces conditions ».

Texte de droits :

> Les conditions et attributions des œuvres d’origine restent applicables.
> Les déclarations ne constituent pas une vérification juridique.

Texte des assets :

> Une définition partageable ne rend pas ses médias redistribuables. Les références
> privées, locales ou sans autorisation restent des remplacements dans les copies.

Statuts possibles :

- « Manquant — remplacement nécessaire » ;
- « Privé — référence exclue des copies » ;
- « Désactivé » ;
- « Référence publique redistribuable » ;
- « Non redistribuable — remplacement nécessaire ».

Fonctionnement : il n’y a pas d’éditeur graphique d’overlay, de sélecteur de thème
ou de téléversement de média. Les références sont conservées et contrôlées ; les
médias ne sont pas rendus par ce socle. Appliquer le manifest modifie la copie locale ;
il faut ensuite enregistrer le brouillon.

À examiner : pourquoi des licences et un formulaire JSON apparaissent-ils sous
« Apparence » ? L’utilisateur comprend-il que ce panneau ne permet pas encore de
personnaliser visuellement son plateau ?

## 24. Options techniques communes et retour au guide

```text
+--------------------------------------------------+
| > Studio avancé — définition complète            |
|   Option technique secondaire. Arbres            |
|   d’expressions bornés en v2, aucun JavaScript.   |
|   Les champs non représentés par le guide        |
|   sont conservés.                                |
|                                                  |
|   Définition avancée JSON                        |
|   [{Document complet}_______________________]    |
|   Schéma v{n} valide · {n} actions                |
|   [Activer explicitement le langage v2]          |
|   (bouton si le document valide utilise v1)      |
|                                                  |
| > Revenir aux choix du guide                     |
|   {Champs du guide compteur, si compatibles}    |
|   [Appliquer les choix du guide]                |
+--------------------------------------------------+
```

Le deuxième panneau existe uniquement pour les brouillons ayant une recette de
guide compteur enregistrée. Il n’apparaît pas pour toute création guidée.

Texte quand les règles ne sont plus représentables :

> Cette configuration avancée ne peut plus être représentée par le guide. Rien
> n’est supprimé ; poursuivez dans le Studio avancé.

Texte quand l’application du guide est possible :

> Enregistrez les changements avancés avant d’appliquer le guide.

Fonctionnement : le JSON est le document commun du jeu, pas un deuxième jeu.
Un texte technique invalide est conservé ; les formulaires qui ne peuvent pas le
lire sont bloqués. Appliquer les choix du guide est une sauvegarde serveur de la
recette et de la définition générée ; ce bouton n’est donc pas seulement un retour
à une étape de navigation.

À examiner : « Studio avancé » désigne déjà un parcours entier ; pourquoi retrouve-t-on
ce nom pour le panneau JSON ? « Revenir » laisse-t-il prévoir une opération qui
régénère et enregistre les règles ?

## 25. Sauvegarde et préparation d’essai

Barre commune à toutes les sections :

```text
+--------------------------------------------------+
| [Enregistrer le brouillon]                       |
| [Préparer un test du brouillon]                  |
+--------------------------------------------------+
```

Section Tester :

```text
+--------------------------------------------------+
| Tester mon jeu                                   |
|                                                  |
| Enregistrez et figez votre brouillon dans une     |
| session indépendante. Ses actions utilisent le   |
| véritable moteur. Les nouvelles modifications   |
| ne changeront pas cet essai.                     |
|                                                  |
| [Enregistrer et tester mon jeu]                  |
|                                                  |
| Les liens GM, joueurs et plateau apparaissent    |
| dans « Votre test est prêt ». Vous pourrez       |
| continuer à éditer ici.                          |
+--------------------------------------------------+
```

| Bouton                        | Comportement                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Enregistrer le brouillon      | Valide et enregistre les modifications. Ne lance pas de partie.                                                        |
| Préparer un test du brouillon | Crée une session depuis le brouillon déjà enregistré. Indisponible si des modifications locales restent à enregistrer. |
| Enregistrer et tester mon jeu | Enregistre si nécessaire, puis prépare une session isolée. Ne lance pas encore les phases du jeu.                      |

Fonctionnement : une révision concurrente peut bloquer la sauvegarde ou la
préparation. Le test conserve la définition choisie au moment de sa création.
Les changements ultérieurs du brouillon n’y sont pas appliqués.
Les boutons sont désactivés pendant certaines requêtes ; l’enregistrement n’a pas
un libellé distinct « Enregistrement… » dans la barre actuelle.

À examiner : ces deux formulations pour préparer un essai sont-elles nécessaires ?
Un utilisateur s’attend-il à pouvoir jouer dès qu’il touche « tester » ?

## 26. Panneau « Votre test est prêt »

Ce panneau apparaît **au-dessus de la bibliothèque**, sous les choix de parcours.
La page se déplace vers ce panneau après préparation. L’éditeur reste plus bas.

```text
+--------------------------------------------------+
| ESSAI ISOLÉ · VÉRITABLE MOTEUR                     |
| Votre test est prêt                              |
|                                                  |
| Votre définition est figée pour cet essai.        |
| Invitez des participants réels, ou ajoutez deux  |
| identités fictives. Installez ensuite le jeu,     |
| puis pilotez ses actions dans la régie.          |
|                                                  |
| [Ajouter deux joueurs fictifs]                   |
| [Installer le jeu pour cet essai]                |
|                                                  |
| [Ouvrir la régie du test ↗]                      |
| [Fictif · Nova ↗]   (après ajout)                |
| [Fictif · Atlas ↗]  (après ajout)                |
| [Plateau du test ↗]                              |
|                                                  |
| Invitation du test pour un autre appareil        |
| [{lien d’invitation}_________________________]    |
| [Copier le lien]                                |
|                                                  |
| [Vérifier le refus d’une action GM]               |
| [Revenir à l’éditeur]                           |
+--------------------------------------------------+
```

Fonctionnement, dans l’ordre :

1. Ajouter les joueurs fictifs, ou faire rejoindre de vrais joueurs avec l’invitation.
2. Installer le jeu : les participants sont alors figés pour cette partie.
3. Ouvrir la régie, les joueurs et le plateau dans leurs onglets.
4. Effectuer dans la régie la première action de jeu, si le modèle en possède une.
5. Agir depuis les interfaces joueurs et observer les mises à jour.

La session est réelle ; « fictif » décrit les noms et les personnes simulées, pas
les résultats. Chaque joueur a son propre accès privé. Le bouton de contrôle tente
une opération GM avec un accès joueur pour constater son rejet ; il ne crée pas
une règle du jeu. « Revenir à l’éditeur » déplace la lecture vers le brouillon.
Il ne termine ni ne réinitialise l’essai.

Messages principaux :

- « Deux identités fictives distinctes sont inscrites par les API normales. Vous pouvez ouvrir leurs interfaces. »
- « Définition exacte installée. Ouvrez la régie pour lancer la première transition. »
- « Refus attendu (403) : le joueur ne peut pas renommer la session. »
- Pendant les opérations : « Préparation… » remplace temporairement le libellé du bouton d’installation.

Texte de bas de panneau :

> Ces liens joueurs sont privés et distincts. Conservez-les avant rechargement.
> « Rejouer cette expérience » dans la régie réinitialise les valeurs en conservant
> les joueurs. Pour figer une nouvelle définition, préparez un autre test depuis
> l’éditeur. Aucun privilège de développement n’est utilisé.

À examiner : pourquoi faut-il préparer, ajouter, installer, ouvrir puis démarrer ?
Les termes « identités », « API normales », « 403 » et « véritable moteur » aident-ils
un créateur à tester son jeu ? Le bouton de test de sécurité doit-il être aussi visible ?

## 27. Les onglets ouverts pour l’essai

Ces vues sont séparées du créateur. Les schémas ci-dessous résument uniquement
ce qui sert à comprendre le parcours d’essai ; ils ne recensent pas toute la régie.

```text
ONGLET GM                     ONGLET JOUEUR
+-------------------------+   +-------------------------+
| Connexion / phase       |   | Connexion / phase       |
| Valeurs publiques       |   | Valeurs publiques       |
| Informations privées GM |   | Ses informations privées|
| Actions autorisées GM   |   | Ses actions autorisées  |
| Affectation des rôles   |   | Champs d’une action     |
| Commandes de session    |   | [Exécuter l’action]     |
+-------------------------+   +-------------------------+

ONGLET PLATEAU
+--------------------------------------------------+
| Titre / participants / phase                     |
| Valeurs publiques et informations révélées        |
| Aucun contrôle joueur ou GM                      |
+--------------------------------------------------+
```

Les actions de jeu prennent les noms configurés dans la définition. Par exemple :
« Ouvrir la collecte », « Contribuer », « Terminer la collecte » pour le compteur.
Le joueur ne voit pas un bouton d’action qui lui est actuellement interdit.
Le serveur vérifie à nouveau une action reçue, même si son bouton était affiché.

Les contrôles existants de régie incluent « Rejouer cette expérience » et
« Réinitialiser le salon ». Le premier conserve les joueurs et remet les valeurs
et rôles à leurs valeurs initiales ; le second retire la définition et révoque les
accès des joueurs. Préparer un nouveau test depuis le créateur crée une autre session.

À examiner : est-il pratique de jongler avec plusieurs onglets sur iPhone ?
Le créateur sait-il quel bouton remet simplement l’essai à zéro ?

## 28. Publier une version privée

Le même bloc apparaît dans Publier **et dans Général**.

```text
+--------------------------------------------------+
| Publier une version immuable                     |
|                                                  |
| Elle reste privée dans votre bibliothèque.       |
| Le Store et sa modération ne sont pas ouverts.   |
|                                                  |
| Numéro de version                                |
| [1.0.0______________________________________]    |
|                                                  |
| [ ] Je déclare disposer des droits nécessaires   |
|     sur ma contribution et ses ressources.      |
|                                                  |
| [Publier cette version privée]                   |
+--------------------------------------------------+
```

Confirmation affichée :

> Figer cette version dans votre bibliothèque privée ? Elle ne pourra plus être modifiée.

Fonctionnement : le brouillon doit être enregistré et la déclaration de droits
cochée. Une version publiée ne peut plus être réécrite. Le brouillon peut continuer
à changer ; une nouvelle publication demande un autre numéro de version.
Publier n’est pas nécessaire pour tester un brouillon.

À examiner : « Publier » est-il le bon mot pour une version qui reste privée ?
Pourquoi le créateur doit-il choisir lui-même un numéro comme `1.0.0` ?

## 29. Versions publiées et manifest d’export

```text
+--------------------------------------------------+
| Versions publiées — lecture seule                |
|                                                  |
| {Titre} · v1.0.0                                 |
| Schéma {n} · {n} ressource(s) à remplacer          |
|                                                  |
| [Tester la version 1.0.0]                        |
| [Créer une variante de la version 1.0.0]          |
| [Préparer le manifest d’export 1.0.0]             |
|                                                  |
| Manifest d’export sans références privées         |
| [{Texte en lecture seule}____________________]   |
+--------------------------------------------------+
```

Texte après préparation du manifest :

> Ce manifest contient métadonnées et dépendances logiques. Ce n’est pas encore
> un export complet réimportable du jeu.

Fonctionnement : tester utilise cette version précise, même si le brouillon a
changé. Créer une variante crée un autre jeu, pas une nouvelle révision du
brouillon courant. Le manifest s’affiche dans un champ texte ; il ne constitue
pas un téléchargement complet et réimportable du jeu.

À examiner : cette fonction technique doit-elle être proposée à ce stade ?
Le mot « export » laisse-t-il croire que le jeu peut déjà être partagé et réinstallé ?

## 30. États, erreurs et confirmations

### États visibles

| Situation                              | Texte ou comportement actuel                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Modification dans l’éditeur            | « Modifications locales non enregistrées ».                                                                          |
| Brouillon chargé ou sauvegardé         | « Brouillon enregistré ».                                                                                            |
| Commande acceptée dans la bibliothèque | « Modification enregistrée. »                                                                                        |
| Préparation d’un test réussie          | « Session réelle préparée. Ouvrez la régie, invitez les joueurs puis installez la définition préparée. »             |
| Résultat de commande incertain         | « Résultat en attente. Les nouvelles modifications sont suspendues. » et bouton « Réessayer la commande du Studio ». |
| Définition invalide                    | Bloc « À corriger avant sauvegarde » et liste des problèmes.                                                         |
| Conflit d’édition                      | Message d’actualisation et conservation de la copie locale.                                                          |

Le message général de préparation de test ci-dessus mentionne une installation dans
la régie, alors que le panneau propose aussi d’installer depuis le créateur.

### Boutons d’ajout indisponibles et limites

Les boutons d’ajout sont aussi désactivés lorsque les limites suivantes sont
atteintes : 8 rôles, 8 variables, 8 phases, 8 actions, 4 paramètres par action et
6 effets par action. Certaines options sont désactivées si leur source n’existe
pas : par exemple Entrée de l’action s’il n’y a aucun paramètre. La définition
complète est limitée à 6 000 octets, même si chaque liste reste sous son maximum.
Ces raisons ne disposent pas toutes d’une explication à côté du bouton grisé.

### Conflit d’édition

```text
+--------------------------------------------------+
| La bibliothèque a changé. Actualisez-la, puis     |
| comparez votre copie locale avec le brouillon    |
| serveur.                                         |
|                                                  |
| [Actualiser la bibliothèque]                     |
|                                                  |
| Le brouillon serveur est maintenant en révision  |
| {n}. Vos modifications locales sont conservées.  |
| [Charger le brouillon serveur]                   |
|                                                  |
| > Copie locale conservée avant actualisation     |
|   Sauvegarde locale du brouillon                 |
|   [{Texte de sauvegarde}_____________________]   |
+--------------------------------------------------+
```

Si le remplacement concerne une copie locale modifiée, confirmation :

> Charger le brouillon serveur ? Votre copie locale sera conservée en sauvegarde dans cet onglet.

Il n’y a pas de fusion graphique automatique ni de bouton qui applique une fusion.
Le texte d’accompagnement indique : « Copiez les champs à réconcilier dans l’éditeur ;
aucune fusion ni suppression silencieuse. »

### Autres messages rencontrables

- « Suppression impossible : {références}. »
- « La valeur initiale doit respecter le type et les bornes. »
- « Chaque identifiant doit être unique dans sa catégorie. »
- « Condition : vérifiez les types, références et permissions de lecture. Les paramètres ne sont pas lisibles ici. »
- « La condition doit produire vrai ou faux. »
- « La visibilité personnelle nécessite une portée par participant. »
- « Référence manquante : {id} ».
- « Expression invalide ou profondeur supérieure à 4. Votre saisie reste disponible. »
- « Manifest d’assets invalide. Les références précédentes sont conservées. »
- « Le document technique comporte des changements non interprétables. Corrigez-le avant de reprendre les formulaires ; votre texte est préservé. »
- « Session indisponible. Réessayez depuis le lien GM. »
- « Ajoutez des joueurs fictifs ou invitez un participant avant installation. »
- « Stockage local indisponible : enregistrez avant de quitter l’éditeur. »

### Confirmations importantes

- Quitter un brouillon modifié : « Quitter l’éditeur ? Vos modifications locales non enregistrées resteront dans cet onglet. »
- Créer un autre brouillon : « Créer un autre brouillon ? Les modifications locales de l’éditeur restent dans cet onglet. »
- Ouvrir une variante : « Ouvrir une nouvelle variante ? Vos changements locaux restent dans cet onglet. »
- Supprimer : « Supprimer le rôle « {nom} » ? », « Supprimer la variable « {nom} » ? », « Supprimer la phase « {nom} » ? », « Supprimer l’action « {nom} » et ses effets ? », « Supprimer l’effet {n} ? ».
- Retirer une condition composée : « Retirer cette condition ? ».

Le navigateur peut afficher son propre avertissement de départ si un brouillon
est modifié. Son texte dépend du navigateur. La copie locale appartient à l’onglet,
pas à une sauvegarde de compte récupérable par e-mail. Les liens d’essai restent
en mémoire dans la page ; il faut les conserver avant de recharger.

À examiner : les messages désignent-ils précisément le champ à corriger ? Les
numéros de révision, les références, « serveur » et « copie locale » demandent-ils
une explication plus accessible ?

## 31. Pied de page commun

```text
+--------------------------------------------------+
| Créez en privé, testez avec votre régie.          |
|                                                  |
| La publication de ce jalon fige une version      |
| dans votre bibliothèque privée. Aucun Store      |
| public, transfert de média ou lien Twitch        |
| automatique. Validation humaine iPhone en attente.|
+--------------------------------------------------+
```

À examiner : ce texte de suivi du développement a-t-il sa place dans l’interface
utilisateur ? « Publication de ce jalon » peut-il être confondu avec le bouton Publier ?

## 32. Ce qui est absent et ne doit pas être supposé présent

- Undercover, Enchères et Qui est l’espion jouables de bout en bout.
- Un assistant universel permettant de composer n’importe quel jeu en quelques questions.
- La création d’équipes, des votes à candidats ou une correction automatique de quiz.
- Une interface de distribution aléatoire des secrets ou de conditions de victoire des jeux officiels.
- Des chronomètres et transitions automatiques.
- Un éditeur visuel de scènes, de calques ou de placement de widgets OBS.
- Un rendu effectif des médias référencés ou un stockage de médias utilisateurs.
- Un Store public, une recherche communautaire et une publication publique.
- Une connexion Twitch obligatoire ou des paiements Bits réels.
- Un compte utilisateur avec récupération d’accès par e-mail.

Cette liste décrit l’état de cette livraison, pas une réduction du périmètre produit futur.

## 33. Grille à copier pour l’analyse

```text
Écran / section :

Ce que je pensais pouvoir faire :

Ce que j’ai compris en lisant l’écran :

Ce qui se passe réellement après mon action :

Mot ou phrase incompréhensible :

Information qui manque :

Information trop technique ou trop tôt :

Bouton que je ne sais pas choisir :

Ce que je voudrais voir à la place :

Priorité : bloquant / gênant / secondaire
```

### Questions transversales à décider

1. Le premier écran doit-il proposer d’abord de jouer, de personnaliser ou de créer ?
2. Quel parcours recommander à une personne qui découvre le produit ?
3. Quels termes employer pour distinguer un jeu, une émission et une partie ?
4. Faut-il rapprocher « Installer », « Créer une variante » et « Tester » ou mieux expliquer leurs différences ?
5. Quelles informations techniques garder dans une zone avancée : identifiants, schémas, versions, JSON, droits ?
6. Faut-il réunir les réglages aujourd’hui répétés dans Général, Actions et Conditions et effets ?
7. Comment expliquer simplement « qui peut agir », « quand », « si » et « ce que cela change » ?
8. Comment réduire les manipulations et les onglets nécessaires pour tester sur iPhone ?
9. Comment nommer la création d’une version figée qui reste privée ?
10. Quelles actions et informations doivent rester visibles pendant le défilement sur téléphone ?

Aucune réponse à ces questions n’est considérée comme validée par ce document.

## 34. Sources de la restitution

- `apps/web/src/components/creator-studio.tsx` : accueil, bibliothèque et parcours.
- `creator-guide.tsx` et `guide-fields.tsx` : guide et textes des modèles.
- `creator-editor.tsx` et `creator-visual.tsx` : cadre commun, sections, sauvegarde.
- `creator-collections.tsx` et `creator-fields.tsx` : rôles, variables et phases.
- `creator-actions.tsx`, `creator-effects.tsx`, `expression-editor.tsx` : règles.
- `creator-parameters.tsx` : paramètres regroupés dans Général.
- `creator-assets.tsx`, `creator-versions.tsx` : assets, droits, versions, manifest.
- `creator-test.tsx`, `copy-link.tsx` et `apps/web/src/lib/use-creator.ts` : essai et états.

Ces noms servent à retrouver les textes lors d’une correction ; leur lecture
n’est pas nécessaire pour utiliser les wireframes ou remplir la grille d’analyse.
