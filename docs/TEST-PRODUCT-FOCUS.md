# Tester le produit recentré — iPhone + ordinateur

## Démarrer une fois sur l’ordinateur

Dans le dossier du dépôt (Node 24 et npm 11) :

```sh
git switch feat/product-focus-saas
npm ci
npm run dev:lan
```

Gardez le terminal ouvert. Ouvrez **l’adresse réseau affichée**, par exemple
`http://192.168.0.46:3000` si c’est celle de votre réseau actuel. iPhone et ordinateur
sur le même Wi-Fi de confiance. L’adresse peut changer ; ne copiez pas localhost
sur l’iPhone. Pas de redirection de port Internet. Dans le cloud, utilisez l’adresse
HTTPS protégée fournie par votre hébergement ; l’adresse privée du serveur distant
n’est pas forcément accessible à votre iPhone. Le port Node 4000 reste privé.
Aucun compte Twitch, abonnement ou paiement nécessaire.

## Choisir et préparer

1. Sur l’ordinateur, ouvrez `/`. Attendu : **Prêt pour votre prochain live ?**, puis
   **Choisir un jeu**. Aucun parcours de création libre.
2. Touchez **Choisir un jeu**, puis **Jouer** sur Undercover. Attendu : Enchères et
   Qui est l’espion sont annoncés en préparation, sans bouton Jouer.
3. Gardez **Tester seul avec des joueurs de démonstration**, choisissez **3 joueurs**,
   **1 Undercover**, vos deux mots différents et **2 tours d’indices**.
   Attendu : seuls les paramètres du jeu sont affichés, aucun JSON.
4. Touchez **Lancer une partie de démonstration**. Attendu : laboratoire privé,
   joueurs préparés et état **Synchronisé**. Pas d’installation manuelle.
5. Touchez **Copier le lien privé GM pour mon iPhone**, transférez ce lien à votre
   propre iPhone et ouvrez-le dans Safari. Gardez le laboratoire sur l’ordinateur.
   Attendu : régie privée, même partie. Le lien public ne donne pas les droits GM.
   Le fragment secret est retiré de l’adresse après ouverture : utilisez le bouton
   de copie prévu, pas une adresse déjà nettoyée. Ne partagez pas ce lien aux joueurs.

## Jouer jusqu’au résultat

6. iPhone : touchez **Distribuer les mots et commencer**.
   Attendu : **Discussion**, tour d’indices 1/2, premier joueur nommé.
7. Ordinateur : dans **Point de vue**, choisissez Joueur 1, puis 2 et 3.
   Attendu : chaque carte montre seulement son propre mot. Il ne connaît pas encore
   son camp ; le spectateur ne voit aucun mot. Recharger conserve le joueur sélectionné.
8. Donnez oralement un indice pour chacun ; iPhone : **Confirmer l’indice et passer
   au suivant** après chaque passage. Attendu : après trois confirmations, tour 2/2.
   **Ouvrir les votes** ne doit pas encore être disponible après le seul premier tour.
9. Répétez trois passages. Attendu : six confirmations au total ; le bouton
   **Ouvrir les votes** devient disponible. Touchez-le sur l’iPhone.
10. Ordinateur : pour chaque joueur, choisissez un autre joueur et confirmez son vote.
    Attendu : confirmation personnalisée et vote enregistré. Le GM voit qui a voté,
    sans exposer les choix individuels au plateau avant dépouillement.
11. Pour une issue reproductible, utilisez les informations privées GM pour identifier
    l’Undercover : faites voter les deux civils contre lui, et l’Undercover contre un
    civil. Ces informations restent dans la zone privée GM et ne doivent pas être
    diffusées. iPhone : **Révéler le résultat du vote**, puis confirmer.
    Attendu : élimination de l’Undercover, victoire civile et révélation finale.
12. Ordinateur : sélectionnez **Spectateur** ou **Voir le plateau spectateur**.
    Attendu : décompte, résultat et révélations maintenant autorisées, même partie.
    Vous pouvez ouvrir ce lien public dans OBS, source navigateur 1920×1080 ; n’y
    utilisez jamais le lien privé GM. OBS réel reste à vérifier par vous.
13. **Rejouer cette partie** dans la régie, puis **Annuler** : l’état ne change pas.
    Recommencez et confirmez : mêmes accès, préparation et votes remis à zéro.
    Distribuez pour une nouvelle partie. **Créer un nouveau test** ouvre une autre partie,
    tandis que **Recommencer le test** conserve les participants actuels.

Avec 3 joueurs, une élimination sans égalité termine la partie (victoire civile ou
parité Undercover). Pour plusieurs manches, créez une démonstration à **4 joueurs** :
éliminez un civil d’abord, puis continuez avec les survivants. Chaque nouvelle manche
redemande ses deux tours d’indices. Pour une égalité à 3, chacun vote pour un joueur
différent : personne n’est éliminé ; la manche suivante reprend les indices.

## Avec de vrais invités

Dans `/play/undercover`, choisissez **Inviter de vrais participants**, puis créez la
partie. La régie s’ouvre directement. Partagez **Invitation des joueurs**, jamais le lien GM ni le laboratoire.
Depuis d’autres contextes privés ou navigateurs de l’ordinateur, inscrivez chaque
personne sous un nom distinct. Une fois au moins trois joueurs présents, le GM
**Prépare la partie**. La répartition doit avoir moins d’Undercover que de civils.
Les liens individuels conservent l’identité. Sur un seul navigateur, le sélecteur de
la démonstration est plus simple et évite trop de connexions persistantes HTTP locales.

## Erreurs, reprise et confidentialité

- Deux mots identiques ou plus d’Undercover que de civils : lancement refusé et réglages
  conservés, corrigez-les. Un mauvais effectif réel est aussi refusé par le serveur.
- Un joueur ne peut pas voter deux fois, pour lui-même ou avant l’ouverture ; les commandes
  GM ne sont pas proposées aux joueurs et restent refusées par le serveur.
- Coupez brièvement le réseau : état reconnexion, puis synchronisation sans rejouer les actions.
- Revenez à l’accueil depuis l’onglet GM : **Reprendre ma partie** apparaît si votre accès
  est valide et la partie n’est pas terminée. Il ouvre le laboratoire si ses accès sont
  dans cet onglet, sinon la régie. Ce n’est pas une liste synchronisée entre appareils.
- Un visiteur ouvrant l’URL du laboratoire sans ses accès locaux ne peut pas choisir une
  identité ; le plateau public ne reçoit jamais tous les mots avant la révélation finale.
- Les anciens liens de partie restent valides ; les liens d’éditeur renvoient au catalogue.
  Les anciennes créations sont conservées mais ne sont plus proposées comme jeux libres.

## Appréciation humaine

- [ ] Je comprends comment lancer le jeu sans documentation technique.
- [ ] Les champs, confirmations et commandes sont lisibles et confortables sur iPhone portrait.
- [ ] Je sais toujours quel joueur j’incarne sur l’ordinateur.
- [ ] Les deux tours avant vote et le rythme conviennent à mon émission.
- [ ] Les actions se répercutent sur l’iPhone et le plateau sans confusion.
- [ ] Reconnexion et rejeu conservent les bonnes identités.
- [ ] Je vérifie OBS et Safari réel, puis remonte tout problème observé.

Enchères et Qui est l’espion : **pas de parcours jouable livré**. Leurs propositions
sont dans OFFICIAL-GAMES-RULES.md ; ne pas essayer de contourner l’absence de bouton.
Les tests Chromium ne valident ni votre réseau personnel, ni un iPhone physique,
ni le plaisir de jeu. La première exploration iPhone antérieure a motivé ces évolutions ;
ce nouveau parcours reste à apprécier humainement.
