# Tester la série Undercover et son émission

Ces parcours utilisent de vraies parties. Aucun compte Twitch n’est nécessaire.
Les nouvelles interfaces restent à essayer sur votre iPhone et dans votre OBS réel.
Votre validation positive du précédent workflow OBS est conservée.

## Démarrer

Dans le dossier de l’application, avec Node 24 et npm 11 :

```sh
nvm use 24
npm ci
npm run dev:lan
```

Gardez ce terminal ouvert. Sur l’ordinateur puis l’iPhone, ouvrez l’adresse affichée,
par exemple `http://192.168.0.46:3000` si c’est bien celle de votre réseau actuel.
Les deux appareils doivent être sur le même réseau de confiance. Ne publiez pas ce
serveur de développement directement sur Internet.

## Préparer deux parties sur l’ordinateur

1. Depuis l’accueil, choisissez **Préparer une partie Undercover**.
   Vous voyez les participants prévus, 2 tours d’indices et Classique.
2. Touchez **Modifier les contenus**. Nommez A « Phare » et B « Balise ».
   Choisissez deux images personnelles si vous le souhaitez.
   Chaque nom et chaque image se modifient séparément.
3. Touchez **Enregistrer la partie**, puis **Ajouter à la série**.
   La paire apparaît dans votre conducteur, sans créer de salon.
4. Nommez la série « Mon émission ». Ajoutez une deuxième partie « Jardin / Prairie ».
   Les paramètres secondaires sont repliés ; le nombre prévu ne limite pas les inscriptions.
5. Essayez Monter/Descendre, Dupliquer et Retirer puis Annuler le retrait.
   Les copies changent indépendamment ; les boutons remplacent le glisser-déposer.
6. Fermez puis rouvrez `/play/undercover` dans le même navigateur.
   Les préparations et images sont conservées.
7. Choisissez **Vérifier la série**, puis **Ouvrir le salon**.
   Résultat : salon vide, invitation disponible, aucun mot distribué.

Préparez et lancez cette série depuis le même appareil pour conserver vos images.
Une image indisponible ne bloque pas les textes ni l’ouverture. **Reconnecter** permet
de la choisir à nouveau. N’effacez pas les données du site pour simuler cette erreur :
cela effacerait aussi vos préparations locales.

## Jouer seul avec ordinateur et iPhone

1. Dans le salon de l’ordinateur, copiez l’invitation des joueurs.
2. Ouvrez trois contextes indépendants : profils de navigateur distincts ou navigateurs
   différents. Inscrivez Alex, Camille et Noa. Conservez leurs pages et liens privés.
   Ne partagez pas un même accès joueur entre ces contextes.
3. Copiez le **lien privé de régie** vers votre iPhone. Ce lien est confidentiel ;
   il ne remplace pas l’invitation publique.
4. Depuis la régie iPhone, **Préparer la partie**, puis **Distribuer les mots et commencer**.
   Chaque joueur voit uniquement son mot et son éventuelle image.
5. Sur l’ordinateur de préparation, gardez aussi la régie ouverte : elle rend les images
   de la partie courante disponibles aux autres appareils.
6. Donnez oralement un indice par joueur. Sur l’iPhone, confirmez chacun des trois
   passages, deux fois. Le vote n’est disponible qu’après les deux tours complets.
7. Ouvrez les votes. Dans chaque page joueur, choisissez un autre joueur, touchez
   **Voter**, puis confirmez. Les votes ne sont plus modifiables.
8. Lorsque les trois ont voté, révélez le résultat depuis la régie et confirmez.
   Une élimination et un résultat final apparaissent avec trois joueurs.

Pour tester rapidement les anciennes fonctions sans vrais invités, **Tester avec le
laboratoire** reste disponible dans la préparation. Cet essai indépendant ne lance pas
le conducteur des séries ; le parcours ci-dessus teste les séries et leurs images.

## Observer l’émission et OBS

1. Ouvrez **Plateau** dans la régie, puis l’aperçu d’émission ou la source OBS.
   L’aperçu ajoute un contexte fictif ; il utilise le véritable état serveur.
2. Dans OBS, ajoutez une **Source navigateur**, collez l’URL dédiée `/sessions/<id>/obs`
   fournie par l’application, largeur **1920**, hauteur **1080**.
3. Placez la source au-dessus d’une image ou d’une vidéo dans votre scène.
   Le centre doit laisser voir ce fond. Aucun décor de démonstration ne doit apparaître
   dans la source OBS elle-même.
4. Pendant les indices, vérifiez la phase, le tour et le joueur actif.
5. Dans la régie, ouvrez **Contenus sur le plateau**, puis **Montrer le duo anonyme**.
   Deux cartes apparaissent temporairement, sans noms de joueurs ni camps.
6. Essayez **Publier les affectations** : une confirmation explique la révélation.
   Après accord seulement, les relations joueur→contenu deviennent publiques.
   Ne le faites pas dans une vraie partie si cette révélation gâche votre jeu.
7. Pendant le vote, l’overlay affiche « 0 / 3 », puis « 3 / 3 votes reçus ».
   Il ne montre pas qui a voté pour qui.
8. Après la révélation finale, les associations autorisées apparaissent, puis un résultat
   compact reste lisible. Ouvrez une autre source tardivement : elle récupère l’état
   actuel sans rejouer les anciens effets.

Les cartes disparaissent après quelques secondes pour dégager les visages. Vous pouvez
les montrer de nouveau depuis la régie pendant une partie. Avec 4–12 joueurs, les
associations se consultent par groupes de trois ; vérifiez la pagination et les noms longs.

## Suite, rejeu et retour

- Sur **l’ordinateur qui prépare la série**, touchez **Partie suivante**, puis confirmez.
  Les mêmes joueurs conservent leurs accès. « Jardin / Prairie » est préparée mais reste
  secrète ; distribuez explicitement pour commencer.
- Depuis l’iPhone, vous pouvez toujours piloter et rejouer la partie courante. La liste
  des préparations n’est pas transférée à l’iPhone : le passage suivant demande
  l’appareil d’origine.
- **Rejouer cette partie** reprend la même préparation, sans avancer la série.
- **Retour à la série** conserve le conducteur. **Reprendre la partie** retrouve son salon.
- **Réinitialiser le salon** est différent : les joueurs sont retirés et leurs accès révoqués.

## Erreurs à essayer sans danger

- Deux noms identiques : l’enregistrement doit expliquer comment les corriger.
- Fichier invalide : l’image est refusée, les noms restent modifiables.
- Deux onglets modifient une même série : le second signale le conflit. Conservez ses
  changements dans une nouvelle série plutôt que d’écraser l’autre.
- Connexion interrompue pendant l’ouverture : **Reprendre la préparation** réutilise la
  même demande. Si vous avez modifié la paire entre-temps, ses valeurs initiales sont
  d’abord restaurées, puis vous pouvez reprendre.
- Serveur redémarré ou appareil de préparation fermé longtemps : une image peut ne plus
  être disponible temporairement. Les textes et la partie restent jouables. Revenez à
  la régie sur l’appareil d’origine pour reconnecter les images.

Sur iPhone, vérifiez spécialement les boutons bas, le clavier, les champs à 16 px,
les zones de sécurité Safari et l’absence de défilement horizontal. Ces contrôles
humains sont distincts des captures et parcours Chromium automatisés.
