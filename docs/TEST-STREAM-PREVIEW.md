# Tester seul une émission — iPhone, ordinateur et OBS

## Préparer les deux appareils

Dans le dossier du dépôt sur l’ordinateur, avec Node 24 et npm 11 :

```sh
git fetch origin
git switch feat/stream-preview-obs
npm ci
npm run dev:lan
```

Gardez ce terminal ouvert. iPhone et ordinateur doivent utiliser le même réseau
Wi-Fi de confiance. Sur les deux appareils, utilisez **l’adresse réseau affichée**,
par exemple `http://192.168.0.46:3000` si c’est votre adresse actuelle. N’envoyez pas
localhost à l’iPhone. Dans un cloud distant, utilisez le point d’entrée HTTPS protégé
fourni par l’hébergement ; ne redirigez pas un serveur de développement sur Internet.
Aucun compte Twitch ni flux vidéo nécessaire.

## Lancer une démonstration et ouvrir les vues

1. **Ordinateur :** Choisir un jeu → Undercover. Gardez le mode démonstration,
   choisissez **3 joueurs**, **1 Undercover** et **2 tours d’indices**.
   Touchez **Lancer une partie de démonstration**.
   **Attendu :** laboratoire privé et trois véritables identités fictives préparées.
2. Touchez **Copier le lien privé GM pour mon iPhone**, transférez ce lien à votre
   iPhone et ouvrez-le dans Safari. Ne le partagez pas avec des joueurs.
   **Attendu :** même partie, régie privée et phase Préparation.
3. **Ordinateur :** depuis le labo, ouvrez **Aperçu de l’émission**.
   **Attendu :** cadre vidéo 16:9 avec décor fictif et plateau public Synchronisé.
   Il ne s’agit pas d’un stream Twitch. Avant distribution : joueurs en attente,
   aucun mot secret, aucun camp caché.
4. Gardez le labo dans son onglet. Utilisez **Point de vue → Joueur 1 / 2 / 3** pour
   passer entre les identités, ou ouvrez leurs accès séparés. Chaque vue conserve son
   accès et n’affiche que sa propre carte. Sur ordinateur, **Afficher le plateau à côté**
   propose le même aperçu d’émission à côté du joueur sélectionné.
   **Attendu :** aucune confusion de joueur au changement ou au rechargement.

## Dérouler la partie et observer l’émission

5. **iPhone :** touchez **Distribuer les mots et commencer**.
   **Attendu dans l’aperçu :** phase Discussion, manche 1, tour d’indices 1/2,
   premier joueur indiqué et bref effet de changement de phase. Les cartes des
   joueurs sur ordinateur reçoivent chacune leur mot ; l’aperçu n’en affiche aucun.
6. Donnez oralement l’indice de chaque joueur. Après chaque passage, sur l’iPhone,
   touchez **Confirmer l’indice et passer au suivant**.
   **Attendu :** le joueur courant et le nombre de passages confirmés changent dans
   l’aperçu. Après trois passages, tour 2/2. Le vote n’est pas disponible à ce stade.
7. Confirmez les trois passages du deuxième tour.
   **Attendu :** « Indices terminés ». Touchez **Ouvrir les votes** sur l’iPhone.
   L’aperçu affiche Vote et **0 / 3 votes reçus**.
8. **Ordinateur :** choisissez chaque joueur, désignez un autre joueur, puis confirmez
   son vote. Pour une victoire reproductible, le GM peut consulter sa zone privée et
   faire voter les deux civils contre l’Undercover ; l’Undercover vote pour un civil.
   **Attendu :** compteur public 1/3, puis 2/3 et 3/3 ; badges « A voté », bref effet
   de participation. Les cibles individuelles restent cachées, aucun mot n’est révélé.
9. **iPhone :** touchez **Révéler le résultat du vote**, puis confirmez.
   **Attendu :** décompte des voix, joueur éliminé, victoire civile et effet de résultat.
   Les camps et mots ne peuvent apparaître qu’à cette révélation autorisée par la fin.
   L’effet disparaît après quelques secondes ; le résultat durable reste visible.
10. Ouvrez la source OBS après cette fin de partie.
    **Attendu :** résultat courant immédiatement visible, sans rejouer l’animation de
    victoire passée. La page n’affiche ni commandes GM ni boutons de vote joueur.
11. **iPhone :** **Rejouer cette partie**, puis Annuler.
    **Attendu :** aucun changement. Refaites l’action et confirmez.
    **Attendu :** préparation, votes/éliminations/résultat/mots remis à zéro, mêmes
    participants et accès. Distribuer démarre une nouvelle partie. Le laboratoire
    propose également Recommencer le test ; il conserve les joueurs.

Avec trois joueurs, une élimination sans égalité termine la partie. Pour plusieurs
manches, utilisez quatre joueurs et éliminez d’abord un civil : les survivants
recommencent leurs deux tours d’indices avant un nouveau scrutin. Pour une égalité
à trois, chaque joueur vote contre un joueur différent : personne ne sort et les
tours d’indices reprennent à la manche suivante.

## Transparence et source navigateur OBS

Dans l’aperçu, choisissez **Overlay seul** : le damier permet de voir les espaces
transparents. Le damier ne fait pas partie de l’overlay.

Dans OBS :

1. Ajoutez une **Source navigateur**.
2. Copiez **URL publique de l’overlay OBS** depuis l’aperçu. Sa forme est
   `http://ADRESSE-RESEAU:3000/sessions/IDENTIFIANT/obs`.
3. Définissez **largeur 1920, hauteur 1080**. Placez cette source **au-dessus** de
   votre vidéo ou de votre scène OBS. Ajustez la source au canevas 16:9 sans l’étirer.
4. Utilisez un CSS de source sans fond opaque, par exemple :

```css
html,
body {
  background: transparent !important;
  margin: 0;
  overflow: hidden;
}
```

5. Vérifiez que la vidéo reste visible autour des panneaux sombres. Désactivez, si
   vous souhaitez garder le flux connecté entre scènes, les options d’arrêt de la
   source lorsqu’elle n’est pas visible et d’actualisation automatique à l’activation.
   Si vous les activez, la source doit reprendre le bon état sans ancienne animation.
6. Refaites une transition GM et un vote : le rendu OBS doit correspondre à l’aperçu.

Rejouer conserve la même URL OBS. Créer une nouvelle démonstration crée une autre
partie : copiez alors sa nouvelle URL dans la source OBS.

N’utilisez ni le lien privé GM, ni une invitation, ni l’ancienne maquette `/overlay`
comme source réelle. Les liens d’aperçu, OBS et plateau sont publics pour cette partie :
ils ne donnent pas de droit de commande, mais ne sont pas des liens privés de visionnage.
Les panneaux restent volontairement sombres pour lire les textes sur une vidéo.

OBS doit pouvoir joindre la même adresse réseau ou HTTPS que le navigateur. En cloud,
le relais doit prendre en charge SSE sans mise en tampon ni coupure prématurée.
Une protection HTTPS d’hébergement peut nécessiter une configuration d’accès propre
à OBS ; ne transmettez pas de secrets dans l’URL pour contourner cette protection.

## Reconnexion et confidentialité

- Pour tester une coupure avec seulement ces deux appareils, **laissez l’ordinateur
  serveur connecté**. Ouvrez temporairement l’aperçu dans un autre onglet de l’iPhone,
  et choisissez Game Master dans le laboratoire du PC. Coupez le Wi-Fi de l’iPhone,
  confirmez un indice depuis le PC, puis reconnectez l’iPhone au même Wi-Fi.
  **Attendu :** après détection de la coupure, Reconnexion puis état courant synchronisé,
  aucun ancien vote ou résultat rejoué comme un événement nouveau. Revenez ensuite à
  la régie sur l’iPhone. Une coupure silencieuse peut prendre quelques dizaines de
  secondes à être détectée ; il ne faut pas rafraîchir pour obtenir la reprise.
- Pour un essai plus simple, fermez seulement l’onglet de l’aperçu sur le PC, avancez
  le GM sur l’iPhone, puis rouvrez le lien. Cela vérifie une **ouverture tardive**,
  pas une coupure de flux en cours. Ne coupez pas le Wi-Fi du PC hébergeant le serveur :
  l’iPhone ne pourrait alors plus envoyer de commandes.
- Les trois dernières lignes du journal peuvent rester visibles : c’est l’historique
  public durable, pas une animation à rejouer.
- Une action refusée, un double vote ou une commande hors phase ne doit pas augmenter
  le compteur public ni inventer un résultat. Le message de refus reste côté auteur.
- Avant la révélation finale, aucun mot secret ni camp caché dans l’aperçu/OBS. Un joueur
  éliminé ne doit pas gagner de droits supplémentaires.
- Dans **Spectateur** ou **Côté spectateur**, attendez le message indiquant qu’aucune
  action n’est autorisée. Le vote public, les Bits, le chat et les récompenses Twitch
  ne sont pas connectés. L’absence de bouton est volontaire.

## Essai OBS sans outils de développement

Le serveur `dev:lan` peut afficher le bouton des outils Next.js dans les pages,
y compris la source OBS. Ce n’est pas une commande du jeu ; aucune erreur de
développement n’est masquée par le projet. Pour un essai de diffusion propre,
arrêtez le développement puis utilisez la version compilée :

```sh
npm run build
PUBLIC_ORIGIN=http://192.168.0.46:3000 WEB_HOST=192.168.0.46 npm start
```

Remplacez les deux occurrences de l’adresse par celle affichée auparavant par
`dev:lan` si elle diffère. Le serveur Node reste privé sur 127.0.0.1:4000. Réutilisez
ensuite les mêmes liens iPhone et OBS ; la base de parties est conservée. Ne lancez
pas dev et build/start simultanément dans le même dossier. Le contrôle navigateur
livré porte sur cette version compilée ; un véritable essai OBS reste à effectuer.

## Votre checklist

- [ ] Je pilote toute la partie depuis l’iPhone.
- [ ] Je peux changer de joueur sur le PC sans mélanger les cartes privées.
- [ ] Je vois les deux tours, les votes et le résultat dans l’aperçu sans rafraîchir.
- [ ] Les textes et effets sont lisibles en diffusion 1920×1080.
- [ ] Aucun secret n’apparaît avant la révélation prévue.
- [ ] Une ouverture tardive et une reconnexion reprennent sans rejouer les anciens effets.
- [ ] Rejouer remet correctement le plateau à zéro.
- [ ] Le fond est transparent et le rendu correct dans mon véritable OBS.

Enchères et Qui est l’espion restent non jouables : aucun scénario de mises ou de
questions n’est annoncé comme livré. La miniature sur téléphone sert au cadrage ;
ouvrez le plateau classique ou l’aperçu sur grand écran pour les détails. Les noms
et valeurs très longs peuvent être tronqués dans l’overlay pour préserver le 16:9.
Aucun test physique iPhone, Safari iOS ou OBS n’est revendiqué par les tests Chromium.
