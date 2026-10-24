# Tester les jeux officiels depuis votre iPhone

> Parcours actualisé : [tests iPhone + ordinateur](TEST-MULTI-DEVICE-GAMES.md).
> Undercover 0.2.0 exige deux tours d’indices complets (configurables) avant chaque
> vote. Les commandes de discussion décrites ci-dessous sont historiques : confirmer
> chaque passage avant « Ouvrir les votes ».

**Livraison actuelle : Undercover, variante de démonstration jouable.**
Enchères et Qui est l’espion ne sont pas encore jouables. Leurs règles proposées
sont dans [OFFICIAL-GAMES-RULES.md](OFFICIAL-GAMES-RULES.md).

Les tests moteur et navigateur sont distincts de votre validation du gameplay.
Aucun iPhone physique, Safari iOS physique ou OBS réel n’a été testé pendant cette
livraison. La refonte 4B.1 attend également votre retour humain.

## 1. Démarrer, puis laisser le terminal ouvert

Sur le Mac, depuis le dossier du dépôt :

```sh
git fetch origin
git switch feat/official-games-playable
nvm install 24
nvm use 24
npm ci
npm run dev:lan
```

Les lignes nvm utilisent le gestionnaire déjà présent sur votre Mac. Si Node 24
et npm 11 sont déjà actifs, elles sont facultatives. Gardez vos modifications
locales avant de changer de branche ; ne supprimez pas votre base `.data`.

Si votre dossier provient d’un ZIP, les commandes `git` ne s’y appliquent pas.
Téléchargez [l’archive de cette branche](https://github.com/jpbenga/extension_twitch/archive/refs/heads/feat/official-games-playable.zip),
décompressez-la et ouvrez un terminal dans ce nouveau dossier avant les commandes
`nvm` et `npm`. L’ancienne archive 4B ne contient pas cette livraison.

Le terminal affiche une adresse. Ouvrez-la sur l’iPhone, puis ajoutez
**`/creator/play`**. Exemple si votre Mac possède toujours cette adresse :
**http://192.168.0.46:3000/creator/play**. L’adresse affichée par la commande fait foi.
Vous pouvez aussi ouvrir `/creator` et toucher **Laboratoire des jeux**.

Mac et iPhone doivent être sur le même Wi-Fi de confiance. N’utilisez pas localhost
sur l’iPhone ou dans les invitations. Ne redirigez pas ce serveur sur Internet.
Pour un cloud distant, utilisez une origine HTTPS protégée fournie par l’hébergement,
comme indiqué dans le README. Aucune connexion Twitch n’est nécessaire.

Après le démarrage, tous les essais ci-dessous passent par l’interface.

## 2. Undercover : gagner une première partie

Préconditions : page Laboratoire des jeux ouverte. Laissez **4 joueurs**, **1
Undercover** et **10 tours**. Les deux mots doivent être différents.
Les mots par défaut sont des exemples connus ; changez-les pour une vraie émission.
La discussion se fait à l’oral, par exemple sur Discord ; aucun appel vocal intégré.

| Action                                                                                                                                                                   | Résultat attendu                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Touchez **Lancer une partie de démonstration**.                                                                                                                       | Une partie indépendante est préparée avec quatre joueurs démo. Vous êtes Game Master, à l’étape Préparation.                            |
| 2. Touchez **Distribuer les mots et commencer**.                                                                                                                         | Le serveur tire les camps et distribue les mots. L’étape devient Discussion, tour 1.                                                    |
| 3. Dans **Point de vue**, choisissez **Joueur 1**, puis les autres joueurs.                                                                                              | Chaque personne voit son mot et uniquement ses informations. Son camp n’est pas indiqué.                                                |
| 4. Passez en **Spectateur**.                                                                                                                                             | Le plateau montre les joueurs et la discussion. Aucun mot secret ni camp encore caché.                                                  |
| 5. Revenez en **Game Master**. Ouvrez **Informations privées du Game Master**. Notez le nom du joueur Undercover.                                                        | Seul cet espace GM montre tous les mots et les camps. Ne partagez pas cette vue dans OBS.                                               |
| 6. Touchez **Ouvrir les votes**.                                                                                                                                         | Chaque joueur actif peut choisir un autre joueur. Le GM voit les votes attendus.                                                        |
| 7. Passez successivement dans les quatre vues joueur. Faites voter chacun contre l’Undercover identifié ; l’Undercover vote pour un autre joueur. Confirmez chaque vote. | Le joueur voit « Votre vote … est enregistré ». Le bouton disparaît. Le compteur progresse jusqu’à 4 / 4.                               |
| 8. Revenez en **Game Master → Révéler le résultat du vote**, puis confirmez.                                                                                             | Le serveur compte les voix, élimine l’Undercover et annonce **Victoire des civils**.                                                    |
| 9. Passez en **Spectateur**.                                                                                                                                             | Le décompte, l’élimination et le résultat sont visibles. Les camps et les mots sont maintenant révélés, après la fin autorisée.         |
| 10. Touchez **Recommencer le test**.                                                                                                                                     | Même définition et mêmes accès joueurs ; votes, camps tirés et résultat sont effacés. Le GM peut redistribuer pour une nouvelle partie. |

Le laboratoire permet au GM d’essayer chaque identité. Les joueurs démo ne jouent
pas seuls : vous contrôlez leurs choix. Pour une vraie discussion, utilisez les
invitations, décrites plus bas.

## 3. Undercover : vérifier les tours et les cas d’erreur

### Une victoire Undercover en deux tours

1. Recommencez, distribuez et notez **deux civils** dans les informations privées GM.
2. Au premier vote, les quatre joueurs ciblent le premier civil. Ce civil choisit
   une autre personne, puisque le vote pour soi est interdit.
3. Révélez : ce civil est éliminé, les trois autres restent en jeu. Son camp est
   public, les mots restent privés. Touchez **Commencer le tour suivant**.
4. Ouvrez les votes. Faites cibler le second civil par les trois actifs ; celui-ci
   choisit une autre personne.
5. Révélez : il reste un civil et un Undercover. Le serveur annonce **Victoire des
   Undercover**. Les joueurs éliminés ne peuvent plus voter ni être ciblés.

### Une égalité

1. Recommencez avec quatre joueurs et ouvrez les votes.
2. Faites voter Joueur 1 pour Joueur 2, Joueur 2 pour Joueur 3, Joueur 3 pour
   Joueur 4 et Joueur 4 pour Joueur 1.
3. Révélez : chaque personne a une voix, **personne n’est éliminé**.
4. Commencez le tour suivant. Une nouvelle discussion et un nouveau vote sont possibles.
   Si la limite de tours est atteinte sans victoire, le résultat est une partie nulle.

### Des actions qui doivent être empêchées

- Avant création, choisissez **2 Undercover pour 4 joueurs** : le lancement doit
  expliquer qu’il faut davantage de civils. Aucun résultat fictif ne doit apparaître.
- Pendant le vote, cherchez votre propre nom dans les candidats : il ne doit pas
  être proposé dans la variante livrée.
- Votez, puis rechargez votre vue : votre vote est conservé ; vous ne pouvez pas
  voter à nouveau. Le compteur ne doit pas augmenter une deuxième fois.
- Laissez un joueur sans vote : le GM doit voir son nom comme vote attendu et ne
  peut pas encore révéler le résultat.
- Si plusieurs personnes agissent exactement en même temps, une vue peut afficher
  « La session a changé entre-temps ». Attendez la synchronisation puis recommencez
  l’action refusée. Aucun vote ne doit être compté deux fois.
- Facultatif : dans **Vérifier les permissions (avancé)**, **Vérifier le refus d’une
  action de gestion** doit confirmer que le serveur refuse au joueur de renommer la partie.

### Si un joueur n’a plus de connexion

Le GM ouvre **Voter pour un joueur sans interface**, choisit la personne puis sa
cible. **Enregistrer ce vote délégué** applique les mêmes restrictions. Un vote déjà
enregistré ne peut pas être remplacé. Les personnes doivent avoir rejoint la partie
avant sa préparation ; cette délégation ne crée pas un nouvel inscrit.

## 4. Jouer avec de vrais participants

Préconditions : au moins trois participants, chacun avec un navigateur, et un canal
vocal pour discuter. Le GM peut utiliser son iPhone.

1. Revenez au Laboratoire des jeux. Choisissez vos mots, le nombre d’Undercover et
   la limite de tours. Ouvrez **Jouer avec de vraies personnes → Créer une partie
   avec mes invités**.
2. Copiez **Invitation des joueurs**. Envoyez ce seul lien aux participants.
3. Chacun ouvre le lien, saisit son nom et rejoint. Le GM voit les noms apparaître.
4. Attendez que tout le monde soit inscrit, puis **Préparer la partie**. Avec
   seulement deux inscrits, le serveur refuse et explique le problème ; un
   troisième peut encore rejoindre avant de réessayer.
5. **Distribuer les mots et commencer**. Chaque joueur consulte son mot sur son
   propre appareil. Discutez, ouvrez les votes et utilisez les mêmes étapes que
   dans le scénario normal.
6. Les votes et résultats doivent se synchroniser chez le GM et les spectateurs.

Conservez les liens privés de récupération des vues GM/joueur. Une invitation
n’est pas un accès GM. L’accès individuel permet de retrouver son état après une
reconnexion ; il n’existe pas encore de récupération par compte ou e-mail.

## 5. Ouvrir le plateau et préparer OBS

Depuis le laboratoire : **Point de vue → Spectateur → Ouvrir cette vue sur un autre
écran → Ouvrir la vue sélectionnée**. L’adresse publique ressemble à
`http://ADRESSE_DU_MAC:3000/sessions/<id>/public`, sans jeton privé.

Dans OBS, ajoutez une **source Navigateur** avec cette URL, largeur **1920**, hauteur
**1080**. Utilisez la page publique, jamais la régie GM ou l’accès d’un joueur.
Laissez l’application et le serveur actifs. Le fond de ce plateau est sombre ;
il ne s’agit pas de l’ancien overlay transparent fictif.

Le rendu 16:9 est vérifié dans Chromium. La configuration physique d’OBS, sa mise
en cache et son comportement sur votre machine restent à vérifier humainement.
Sur téléphone, les éléments s’adaptent en colonne pour être lisibles.

Dans un même navigateur local, utilisez le **sélecteur de point de vue**. Pour
regarder beaucoup de vues simultanément, préférez plusieurs appareils ou navigateurs
avec des profils distincts. Le HTTP local limite le nombre de flux persistants
par navigateur ; accumuler tous les onglets peut bloquer temporairement les commandes.

## 6. Personnaliser sans casser l’original

**Ma bibliothèque → Undercover → Personnaliser ce jeu → Studio avancé →
Distribution et vote** permet de changer les mots, l’effectif autorisé par les
règles, le nombre d’Undercover, la limite de tours, les options du vote et les
conditions de fin prises en charge. Les camps et actions restent éditables dans
leurs sections. Enregistrez, puis **Tester mon jeu**.

Les mots, rôles et comportements modifiés appartiennent à cette copie. La filiation
reste conservée. Une version enregistrée est privée et figée ; elle ne change pas
les parties déjà commencées. Certaines extensions structurelles demandent encore
les outils avancés : il ne s’agit pas d’un assistant universel de création de règles.

## 7. Enchères et Qui est l’espion : statut honnête

**Ces deux jeux ne sont pas livrés comme jouables dans cette verticale.** Leurs
cartes du laboratoire l’indiquent, sans bouton simulant un lancement.

- **Enchères, prochaine verticale 5B** : offres validées, budget inchangé au dépôt,
  clôture puis attribution confirmée et débit unique. La proposition de scénario
  utilise 1 000 crédits, des offres de 100 puis 150, et un refus au-dessus du budget.
  Ce scénario **n’est pas encore exécutable** dans l’application.
- **Qui est l’espion, verticale 5C** : lieu privé, questions ciblées et accusation,
  avec un résultat distinct des éliminations successives d’Undercover. Ce scénario
  **n’est pas encore exécutable**. Distribution et scrutin serviront de fondations.

Le document de règles précise les décisions manquantes. Aucun Store, paiement,
compte Twitch obligatoire ou Studio d’overlays 4C n’est ajouté.

## Votre checklist de validation humaine

- [ ] Préconditions : application lancée, Wi-Fi commun, navigateurs disponibles.
- [ ] Sur l’iPhone, démarrer et comprendre la préparation sans documentation technique.
- [ ] Côté joueur, lire seulement son mot, comprendre quand agir et confirmer son vote.
- [ ] Côté GM, repérer les votes manquants, ouvrir/résoudre un scrutin et changer de tour.
- [ ] Côté spectateur, voir le résultat synchronisé et aucune information secrète avant sa révélation.
- [ ] Vérifier égalité, élimination, victoire, partie nulle et rejeu.
- [ ] Recharger une vue et retrouver ses accès et son vote.
- [ ] Apprécier le rythme, le plaisir, les confirmations, la lisibilité et l’usage au doigt.
- [ ] Vérifier Safari iOS physique et OBS sur vos appareils.

Les tests automatisés ne cochent pas cette checklist à votre place.
