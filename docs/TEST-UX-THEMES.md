# Tester les nouvelles interfaces et les trois thèmes

Le parcours de jeu et la scène OBS précédents ont été validés par votre essai.
Cette livraison change leur présentation. **La nouvelle ergonomie attend votre retour.**
Aucun compte Twitch, abonnement ou nouveau matériel nécessaire.

## Démarrer comme d’habitude

Depuis le dossier du projet, avec Node 24 et npm 11 :

```sh
npm ci
npm run dev:lan
```

Gardez le terminal ouvert. Sur le Mac **et** l’iPhone, utilisez l’adresse réseau
qu’il affiche, sur le même Wi-Fi de confiance. N’utilisez pas localhost dans les liens
transmis à l’iPhone. Ne redirigez pas ce serveur de développement vers Internet.

## 1. Découvrir et préparer — ordinateur

1. Ouvrez l’accueil : **Undercover** et **Jouer à Undercover** doivent être visibles.
   Une partie retrouvée dans cet onglet propose d’abord **Reprendre ma partie**.
2. Touchez Jouer à Undercover. Choisissez le test seul, puis 3 joueurs.
3. Gardez **2 tours d’indices**. Le résumé doit indiquer 2 civils et 1 Undercover.
4. Ouvrez **Mots et options supplémentaires** pour changer les mots ou la répartition.
   Aucun rôle blanc ou mode supplémentaire n’est présenté comme disponible.
5. Ouvrez **Personnaliser l’overlay**. Choisissez un **Thème de l’émission**, puis une
   disposition si vous le souhaitez. Le cadre change immédiatement pour ce choix.
6. Lancez la démonstration. Le laboratoire prépare de véritables accès joueurs.

Résultat : vous n’avez pas eu à ouvrir d’éditeur de règles ou saisir de données techniques.
Les options restent les mêmes qu’avant, mais les plus rares sont repliées.

## 2. Distinguer les deux réglages d’apparence

**Apparence → Thème de l’application**, dans l’en-tête :

- Broadcast Studio : turquoise et bleu, ambiance régie.
- Neon Show : violet et rose, ambiance jeu télévisé.
- On Air Premium : champagne et graphite.

Essayez les trois. Les textes, boutons et erreurs doivent rester lisibles.
Rechargez la page : votre préférence doit être conservée **dans ce navigateur**.
Elle ne suit pas votre iPhone automatiquement et ne nécessite aucun compte.
Les onglets du même navigateur peuvent reprendre ce choix.

**Thème de l’émission**, dans la préparation Undercover :

- Il est enregistré avec la partie, puis conservé pendant le jeu et après Rejouer.
- Il est utilisé par l’aperçu, la personnalisation du layout et la source OBS.
- Changer Apparence sur le GM ne doit **jamais** recolorer cette source OBS.
- Pour essayer un autre thème d’émission, créez une nouvelle partie.
- Une ancienne partie sans choix enregistré garde Neon Show, proche de son identité initiale.

Si le navigateur refuse le stockage, l’application l’indique : le thème peut être
appliqué dans l’onglet, mais sa conservation après fermeture n’est pas garantie.

## 3. Répéter seul — iPhone GM, ordinateur joueurs et OBS

1. Dans le laboratoire du Mac, utilisez **Copier le lien privé GM pour mon iPhone**.
   Ouvrez ce lien sur l’iPhone. Gardez le laboratoire sur le Mac.
2. Sur l’iPhone, repérez **Partie / Joueurs / Plateau**. Une seule section doit être
   affichée. Vous pouvez revenir à l’accueil sans arrêter la partie.
3. Distribuez les mots. La régie doit mettre en avant le joueur qui parle, le tour
   d’indices et la progression. La prochaine action doit être facile à trouver.
4. Sur le Mac, choisissez Joueur 1, puis Joueur 2, puis Joueur 3 dans le sélecteur.
   Le bandeau indique toujours la personne incarnée. Chacun voit son propre mot.
5. Essayez **Masquer mon mot**, puis **Voir mon mot**. Le masquage sert à préserver
   votre écran des regards, pas à changer les permissions de la partie.
6. Depuis l’iPhone, confirmez les trois passages du premier tour, puis du deuxième.
   Les indices restent oraux. Le vote ne doit pas être disponible plus tôt.
7. Ouvrez le vote. Chaque joueur du Mac sélectionne un autre joueur puis confirme.
   Pendant cette phase, la liste de vote est prioritaire dans son interface.
8. Révélez le résultat depuis la régie. À trois joueurs, une élimination sans égalité
   donne une victoire. Une égalité permet une nouvelle manche.
9. Rejouez et confirmez. Les accès et le thème d’émission restent valides ; les mots
   seront redistribués au prochain démarrage.

Dans le laboratoire, **iPhone, OBS et accès aux différentes vues** regroupe les liens
secondaires, dont l’ouverture de la régie séparée et la personnalisation du layout.
**Recommencer le test** conserve les joueurs. Créer un nouveau test crée une autre partie.
Les accès individuels et les diagnostics restent disponibles dans leurs sections repliées.

## 4. Voir l’émission et vérifier OBS

1. Depuis le laboratoire, ouvrez **Aperçu de l’émission**. Il montre le vrai plateau
   dans une scène fictive ; aucune vidéo Twitch n’est lue ou émise.
2. Essayez **Overlay seul** : le damier vérifie la transparence, sans faire partie du rendu OBS.
3. Ouvrez **Utiliser ce plateau dans OBS**, puis copiez l’URL de l’overlay.
4. Dans la scène OBS déjà préparée, collez cette URL dans la source Navigateur,
   largeur 1920, hauteur 1080. Gardez un fond coloré derrière pour vérifier la transparence.
5. Jouez les indices et votes : les mêmes informations publiques doivent se mettre à jour.
6. Changez le thème de l’application sur l’iPhone. Le plateau OBS doit garder son thème.
7. Fermez puis rouvrez la source : elle retrouve l’état actuel sans ancienne animation.

Les contrôles GM et les mots non révélés doivent rester absents de l’émission.
Les spectateurs sont toujours en lecture seule. La section **Participation des spectateurs**
l’explique ; elle ne simule ni votes Twitch ni Bits.
Pour reprendre les détails d’installation OBS déjà validés : [guide OBS](TEST-STREAM-PREVIEW.md).

## 5. Essayer le salon avec des invités

1. Préparez Undercover en choisissant **Inviter de vrais participants**.
2. Le salon affiche les inscrits et le nombre actuellement connecté.
3. Copiez l’invitation publique sur l’autre appareil ou dans des contextes distincts
   du Mac. Chaque inscription reçoit son accès individuel. N’utilisez jamais le lien GM.
4. Les joueurs peuvent se déclarer Prêts. Ce statut est un repère : il n’est pas obligatoire.
5. Une fois l’effectif valide, touchez **Préparer la partie** : les inscriptions ferment.
6. Vous entrez dans la régie, puis **Distribuer les mots et commencer** lance le jeu.

Avec deux Undercover, il faut au moins cinq joueurs. Le salon doit annoncer cet effectif
et empêcher une préparation prématurée ; le serveur contrôle encore les règles.
Le partage natif n’est proposé que si votre navigateur le permet. En HTTP local, utilisez
la copie du lien si le bouton Partager n’est pas disponible.

## Votre checklist de validation

- [ ] Je sais immédiatement où commencer depuis l’accueil.
- [ ] Je comprends mes réglages sans ouvrir toutes les options.
- [ ] Le salon distingue inscrit, connecté et Prêt.
- [ ] Sur l’iPhone, je repère le joueur actif et la prochaine action.
- [ ] Le joueur voit son mot et sa consigne, sans onglets de gestion.
- [ ] La liste de vote est simple à utiliser au doigt.
- [ ] Dans le laboratoire, je sais toujours qui j’incarne.
- [ ] Les trois thèmes sont lisibles ; mon choix reste après rechargement.
- [ ] Changer le thème privé ne modifie pas OBS.
- [ ] Le plateau garde les positions personnalisées du jalon 7.
- [ ] Je termine une partie et rejoue sans perdre mes accès.

À apprécier sur votre matériel : confort au pouce, clavier Safari, rythme des notifications,
lisibilité sur la vidéo finale et préférence artistique. Les captures et tests Chromium ne
remplacent pas cet essai physique.
