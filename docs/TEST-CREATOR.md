> Guide historique conservé. Pour le produit recentré du jalon 6, suivre [TEST-PRODUCT-FOCUS.md](TEST-PRODUCT-FOCUS.md). Les anciennes interfaces de création sont retirées du parcours courant, sans suppression de données.

# Validation humaine — Studio Créateur 4A

> Guide historique 4A. Le Studio dispose maintenant d’éditeurs visuels et d’un
> assistant en étapes : suivre [le guide 4B](TEST-STUDIO-4B.md) pour les parcours actuels.

**Validation humaine iPhone en attente.** Chromium aux formats téléphone, tablette
et ordinateur ne constitue pas un test Safari iOS ni un essai OBS physique.

## Préconditions et liens

Node.js 24, npm 11, ordinateur macOS/Linux et iPhone sur le même Wi-Fi privé :

```sh
git fetch origin
git switch feat/creator-studio-4a
npm ci
npm run dev:lan
```

Ouvrir **l’adresse privée affichée par le script**, suivie de `/creator`. L’accueil
`/` propose aussi un lien « Ouvrir le Studio Créateur ». Ne pas envoyer localhost
à un autre appareil. Voir [le guide réseau](TEST-IPHONE.md) pour le choix de l’IP,
le pare-feu et les contraintes d’un hébergement cloud distant. Aucun point d’entrée
Internet ni tunnel n’est provisionné par ce lot. Utiliser un réseau de confiance ou
un hébergement HTTPS protégé, avec relais SSE et port Node privé.

Créer « Ma bibliothèque » avec votre nom déclaratif. Ouvrir **Conserver mon accès
créateur** et conserver personnellement le lien privé. Il donne accès aux brouillons
et versions de cette bibliothèque, pas aux comptes Twitch. Le nom n’est pas vérifié.
Le secret est conservé dans l’onglet (`sessionStorage`) ; un autre appareil utilise
le lien privé. Ne jamais le partager avec les joueurs. Sans ce lien, pas de
récupération par e-mail. Les créations restent en SQLite après fermeture du serveur.

## Checklist 1 — Variante et version publiée

**Préconditions :** bibliothèque privée ouverte sur l’iPhone, un deuxième navigateur
pour le joueur et un troisième onglet pour le plateau.

- [ ] Choisir **Utiliser ou personnaliser un jeu existant**. Installer « Impulsion collective » : elle apparaît dans les jeux installés, sans créer de brouillon modifiable.
- [ ] Toucher **Créer une variante de Impulsion collective**. Vérifier son nom, son nouvel identifiant dans le JSON et l’attribution à l’exemple d’origine v0.1.0.
- [ ] Saisir un **Titre du brouillon** personnel. Dans les paramètres d’actions, changer le libellé de la contribution en « Points (1 à 5) » et le maximum en 5. Quitter le champ pour appliquer le libellé, puis **Enregistrer le brouillon**.
- [ ] Déclarer disposer des droits nécessaires, choisir 1.0.0 puis **Publier cette version privée**, confirmer. Elle apparaît en lecture seule ; elle n’est pas publiée dans un Store.
- [ ] Modifier le maximum du brouillon en 2 et enregistrer. La version 1.0.0 conserve les anciennes règles.
- [ ] Toucher **Tester la version 1.0.0**, puis **Ouvrir la régie du test**. Conserver le lien GM et partager seulement son **Invitation des joueurs**.
- [ ] Depuis le deuxième navigateur, rejoindre comme Nova. Inviter tous les autres joueurs avant l’étape suivante.
- [ ] Depuis l’iPhone GM, **Installer la définition préparée**, puis **Ouvrir la collecte**. L’effectif est alors figé.
- [ ] Depuis Nova, contribuer avec 4. Le compteur devient 4 dans la régie et sur son plateau public (lien OBS fourni par le GM).
- [ ] Depuis le Studio, **Tester l’original Impulsion collective** ; ouvrir une autre régie et y inscrire un autre joueur. Son maximum reste 3, son compteur reste indépendant.

**Attendu créateur :** variante sauvegardée et filiation conservée, publication
immuable malgré les changements du brouillon. **Attendu GM :** commandes réelles,
compteur synchronisé, aucune dépendance à l’éditeur pour animer. **Attendu joueur :**
maximum 5 dans la version publiée, une contribution par partie. **Attendu spectateur :**
compteur et participants, pas les marqueurs privés « Contribution envoyée ».

**Appréciation humaine :** distinction installation/variante/brouillon/publication,
taille des contrôles tactiles, clarté des confirmations et facilité à passer du
Studio à la régie. L’édition avancée de ce lot reste un outil technique.

## Checklist 2 — Guide vers Studio avancé sans perte

- [ ] Sur l’iPhone, choisir **Créer un jeu avec un guide**. Le guide actuel est limité au compteur collectif : objectif 4, maximum 3, multiplicateur 2, une contribution par joueur.
- [ ] Créer le brouillon guidé. Ouvrir **Studio avancé — définition complète** : la définition v2 contient les mêmes actions/phases et une expression de multiplication.
- [ ] Pour vérifier le maintien des données avancées, modifier le libellé du rôle host dans le JSON, par exemple « Régisseur personnalisé », puis enregistrer.
- [ ] Ouvrir **Revenir aux choix du guide**. Le guide doit annoncer que ce document ne peut plus être représenté ; le libellé personnalisé et le JSON sont conservés.
- [ ] **Préparer un test du brouillon**, ouvrir la régie, inscrire Nova, installer la définition préparée, ouvrir la collecte.
- [ ] Avant une contribution, **Terminer la collecte** n’est pas disponible. Nova contribue avec 2 : le compteur devient 4. Le GM peut alors terminer et confirmer.
- [ ] Recharger le Studio et rouvrir le brouillon : le libellé avancé persiste.

**Attendu GM :** la garde déclarative réserve la fin à l’objectif atteint.
**Attendu joueur :** 2 points saisis produisent 4 via l’expression serveur.
**Attendu spectateur :** même compteur et phase Terminé ; aucune action de gestion.
**Appréciation humaine :** compréhension de l’objectif, des limites du guide et du
refus de retour, lisibilité du JSON et des retours de validation. L’assistant complet
multi-genres, les équipes et l’éditeur graphique ne sont pas fournis.

## Checklist 3 — Conflit, confidentialité et récupération

- [ ] Ouvrir le lien privé créateur dans un deuxième navigateur/onglet et modifier le même brouillon.
- [ ] Dans l’iPhone, garder un changement non enregistré. Enregistrer un autre changement depuis le deuxième navigateur, puis tenter d’enregistrer sur l’iPhone.
- [ ] Le serveur refuse le conflit. **Actualiser la bibliothèque** conserve la copie locale et montre la nouvelle révision. La sauvegarde reste bloquée tant que les versions ne sont pas réconciliées.
- [ ] **Charger le brouillon serveur**, confirmer ; retrouver la copie précédente sous **Copie locale conservée avant actualisation**. Copier manuellement les champs à réconcilier, aucune fusion automatique.
- [ ] Dans un navigateur sans le lien privé, ouvrir `/creator` : aucune création personnelle n’est visible. Un nom identique ne donne pas accès à la bibliothèque existante.
- [ ] Arrêter le serveur (`Ctrl+C`), relancer avec la même base et ouvrir le lien privé : brouillons, publications et installations restent disponibles.

**Appréciation humaine :** compréhension de la copie locale, du conflit et des accès.
La capacité n’expire pas automatiquement et ne représente pas une authentification
commerciale. Conserver une copie privée du dossier `.data`, serveur arrêté, si besoin.

## Checklist 4 — Assets et export préparatoire

**Préconditions :** brouillon avec l’emplacement `backdrop` hérité de l’exemple.
L’état initial est « Manquant » ; aucun fichier ni compte cloud n’est nécessaire.

- [ ] Ouvrir **Assets et autorisations de partage**. Dans le manifest JSON, remplacer son entrée par l’exemple ci-dessous, puis appliquer et enregistrer.
- [ ] Publier une nouvelle version 1.1.0 et en créer une variante. La variante indique une ressource privée à remplacer et ne possède pas la référence locale.
- [ ] Préparer le manifest d’export de 1.1.0. Il contient droits, attribution et dépendance logique ; ni référence de stockage, ni configuration privée, ni accès de bibliothèque/session, ni définition brute.
- [ ] Le plateau utilise le remplacement visuel ; aucun média n’est chargé.

```json
[
  {
    "assetId": "backdrop",
    "redistribution": "forbidden",
    "license": "Média privé — pas de redistribution",
    "attribution": "Mon attribution de test",
    "binding": {
      "assetId": "backdrop",
      "provider": "browser-local",
      "reference": "local-demo-handle",
      "access": "device-only",
      "status": "active",
      "rightsAttested": true,
      "mime": "image/png"
    }
  }
]
```

La référence est un identifiant opaque de démonstration, pas un fichier accessible.
Pour comparer, une référence HTTPS publique syntaxiquement autorisée et marquée
redistribuable sera conservée dans la copie, mais jamais récupérée. Le manifest
préparatoire d’export n’est pas un bundle réimportable. Les droits déclarés ne sont
pas une validation juridique. La modération et le Store restent des contrats futurs.

## Remonter un résultat

Indiquer appareil/navigateur, checklist, action et résultat observé/attendu. Ne pas
joindre de lien privé, base de données ou capture révélant une capacité d’accès.
Les parcours physiques Safari iOS et OBS restent à valider par un humain.
