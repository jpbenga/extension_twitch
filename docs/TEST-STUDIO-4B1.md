# Essayer le nouveau Studio sur iPhone

**Premier test humain iPhone effectué — refonte ergonomique nécessaire.**
Ce retour concerne l’ancien Studio. Cette refonte attend votre appréciation :
nous n’avons pas testé un iPhone physique, Safari iOS ou OBS pendant cette livraison.

## Ouvrir l’application

Sur le Mac, dans le dossier du projet, utilisez Node 24 et npm 11 :

```sh
cd ~/extension-twitch-studio-4b
git fetch origin
git switch feat/creator-studio-ux-4b1
nvm install 24
nvm use 24
npm ci
npm run dev:lan
```

Si votre dossier porte un autre nom, adaptez seulement la première ligne. Les deux
lignes `nvm` utilisent le gestionnaire Node déjà présent sur votre Mac ; elles ne
sont pas nécessaires si Node 24 et npm 11 sont déjà actifs.
Ne changez pas de branche avec des modifications locales non sauvegardées.
Le terminal affiche une adresse réseau : ouvrez cette adresse sur l’iPhone,
puis ajoutez `/creator`. Exemple sur le réseau précédemment utilisé :
**http://192.168.0.46:3000/creator**. L’adresse peut changer : celle affichée par
la commande fait foi. Laissez le terminal ouvert.

Mac et iPhone doivent utiliser le même Wi-Fi de confiance. N’utilisez pas localhost
sur l’iPhone ou dans une invitation. Autorisez l’application dans le pare-feu du Mac
si nécessaire. Ne redirigez pas le port sur Internet. Dans un cloud distant, utilisez
l’accès HTTPS protégé de l’hébergement et la configuration décrite dans le README.

La bibliothèque privée se prépare automatiquement. Conservez **Ma bibliothèque →
Mon accès privé et mes réglages → Mon lien privé** pour retrouver vos jeux sur un
autre appareil. Ce lien permet de modifier vos créations : ne l’envoyez pas aux joueurs.
Il n’existe pas encore de récupération par e-mail.

## Premier essai — personnaliser et voir le résultat

| Touchez ou modifiez                                                | Résultat attendu                                                                                            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1. À l’accueil, **Personnaliser un jeu**.                          | Deux exemples jouables apparaissent. Undercover n’est pas encore un jeu complet disponible.                 |
| 2. Pour **Impulsion collective**, **Personnaliser ce jeu**.        | L’éditeur s’ouvre directement. L’original reste inchangé.                                                   |
| 3. Donnez un nom à votre jeu. Changez l’objectif de **4 à 10**.    | Le nom et le résumé de vos règles changent.                                                                 |
| 4. Contribution maximale : **2**. Participation répétée : **Oui**. | Un joueur peut contribuer plusieurs fois ; cela permet d’atteindre 10 avec les deux joueurs démo.           |
| 5. **Tester mon jeu**, dans la barre du bas.                       | Le jeu est enregistré. Une partie d’essai se prépare avec deux joueurs démo. Aucune installation manuelle.  |
| 6. **Joueur 1**, saisissez **2**, puis **Contribuer**.             | Points collectifs : **2**. La commande a été exécutée par le serveur.                                       |
| 7. **Spectateur**.                                                 | Le plateau affiche **2** ; aucune donnée personnelle « Contribution envoyée » n’apparaît.                   |
| 8. **Game Master**.                                                | Le total est **2**. Terminer la collecte n’est pas encore proposé car l’objectif est 10.                    |
| 9. Faites quatre autres contributions de 2 depuis Joueur 1.        | Le total atteint **10**.                                                                                    |
| 10. **Game Master → Terminer la collecte**, puis confirmez.        | L’étape devient **Terminé**, les contributions disparaissent côté joueur.                                   |
| 11. **Recommencer le test**.                                       | Total **0**, collecte ouverte, mêmes joueurs et mêmes accès.                                                |
| 12. **Retour à l’édition**.                                        | Votre titre et vos réglages sont conservés. Vous pouvez les modifier et lancer un nouveau test indépendant. |

Dans **Vérifier les permissions (avancé)**, le bouton **Vérifier le refus d’une
action de gestion** doit confirmer que le serveur refuse au joueur de renommer
la partie. Ce contrôle utilise réellement son accès joueur.

Vous pouvez toucher **Enregistrer** sans lancer de test. **Tout est enregistré**
confirme la sauvegarde. En cas de connexion interrompue, reprenez l’opération
proposée ; ne supprimez pas vos accès.

## Créer avec le guide

1. Accueil → **Créer mon jeu → Me laisser guider**.
2. Choisissez **Atteindre un objectif ensemble**, puis **Continuer**.
3. Choisissez l’objectif, le maximum par contribution, puis la participation répétée.
   **Retour** permet de revoir vos réponses sans les perdre.
4. Donnez un nom au jeu, vérifiez le récapitulatif, puis **Créer ce jeu**.
5. Vous arrivez dans le même éditeur. **Tester mon jeu** fonctionne comme ci-dessus.
6. Pour continuer plus loin, ouvrez **Studio avancé**. Si vous ajoutez des règles
   incompatibles avec les réglages simples, elles restent intactes ; l’interface vous l’explique.

Le second modèle, **Écrire une réponse et la révéler**, crée un vrai jeu de réponses
privées. Dans le test, le GM ouvre les réponses avec **Demander un souvenir de live**.
Joueur 1 écrit une réponse ; Joueur 2 et Spectateur ne doivent pas la voir. Pour
révéler : attribuez **Relecteur** à Joueur démo 2 dans les rôles du GM, **Passer en
relecture**, faites **Confirmer la relecture** depuis Joueur 2, puis **Révéler les
réponses** depuis le GM. Le plateau peut alors afficher les réponses autorisées.
Ce modèle ne corrige pas automatiquement des quiz et ne calcule pas de gagnant.

## Composer une action dans le Studio avancé

1. Accueil → **Créer mon jeu → Studio avancé**. Nommez votre jeu, puis **Créer et ouvrir le Studio**.
2. Ouvrez **Studio avancé** dans l’éditeur. Sur iPhone, le menu **Modifier** change de section.
3. Dans **Données**, un score existe déjà, avec une valeur de départ de 0.
   Vous pouvez ajouter une autre donnée ; seules celles choisies dans les actions changeront.
4. Dans **Actions**, touchez **Ajouter une action**, puis nommez le bouton **Gagner un point**.
5. Vérifiez **Qui peut effectuer cette action ?** : **Contributeur** doit être coché.
   Dans **À quel moment ?**, gardez **En direct**.
6. Ouvrez **Quand cette action est-elle possible ? → Ajouter une règle composée**.
   Choisissez **est inférieur à** et remplacez la valeur **0** par **2**.
   Le résumé indique que le score doit être inférieur à 2.
7. Dans **Que se passe-t-il ensuite ? → Ajouter une conséquence**, gardez **Score**,
   **Ajouter ou retirer une quantité**, valeur **1**.
8. Touchez **Tester mon jeu → Joueur 1 → Gagner un point** : le score passe à **1**.
   Une deuxième action porte le score à **2**, puis le bouton disparaît pour les joueurs.
9. **Spectateur** doit montrer le score **2**. **Retour à l’édition** retrouve vos règles.

Les conditions, conséquences et saisies restent dans l’action concernée. Les options
techniques sont facultatives. Il n’est pas nécessaire d’écrire du JSON.

## Enregistrer une version et retrouver ses jeux

1. **Enregistrer**, puis **Studio avancé → Versions**.
2. Cochez la déclaration de droits, puis **Enregistrer une version** et confirmez.
3. Une version **1.0.0** apparaît. Elle reste privée, même si vous continuez à modifier le jeu.
4. **Ma bibliothèque → Mes créations → Modifier ce jeu** retrouve la création et ses versions.
   **Jeux ajoutés** contient les exemples ou versions ajoutés explicitement à votre bibliothèque.
5. Une version enregistrée possède ses propres commandes **Tester cette version** et
   **Personnaliser cette version**. Le Store public et le partage public restent absents.

## Essayer avec une vraie personne et un autre appareil

Ce parcours est distinct des deux joueurs démo :

1. Accueil → **Lancer un jeu → Lancer ce jeu** pour Impulsion collective.
   Ou, depuis votre création : **Studio avancé → Tester → Tester avec mes invités**.
2. Copiez **Invitation des joueurs** et envoyez ce seul lien au deuxième appareil.
3. L’autre personne ouvre le lien, choisit son nom, puis rejoint. Son nom apparaît chez le GM.
4. Quand tous les joueurs sont présents : **Préparer la partie → Ouvrir la collecte**.
5. Le joueur contribue. Le total se met à jour chez le GM et dans **Spectateur**.
6. Pour un plateau séparé, sélectionnez **Spectateur → Ouvrir cette vue sur un autre écran →
   Ouvrir la vue sélectionnée**. Le lien public `/sessions/<id>/public` convient à un navigateur ou à OBS.

Le laboratoire donne aussi accès à des vues séparées pour le GM et chaque joueur démo.
Gardez les liens privés pour la personne concernée. Le lien du laboratoire seul ne
transfère pas ses accès à un autre navigateur. L’espace multi-rôles est réservé au GM
qui contrôle les identités démo : ce n’est pas une page à partager avec les joueurs.

## Checklist de votre validation

Préconditions : application lancée, Wi-Fi commun, deux navigateurs ou appareils.

- [ ] Sur iPhone, identifier spontanément Lancer / Personnaliser / Créer.
- [ ] Modifier l’objectif et voir un résultat réel sans JSON ni documentation technique.
- [ ] Enregistrer et Tester restent accessibles ; aucun champ caché sous le clavier.
- [ ] En portrait, aucun défilement horizontal ; texte lisible, boutons faciles à toucher.
- [ ] Le deuxième joueur voit ses actions et ses propres informations, jamais celles d’un autre.
- [ ] Le GM et le spectateur observent le même total après une contribution.
- [ ] Quitter l’éditeur, revenir puis recharger conserve les modifications non enregistrées.
- [ ] En ouvrant le lien privé dans deux onglets, une modification concurrente produit une explication,
      une comparaison et un choix explicite. Aucune copie n’est écrasée automatiquement.
- [ ] Après une coupure réseau brève, la reconnexion et la reprise restent compréhensibles.
- [ ] Donner votre appréciation : mots confus, règle difficile à comprendre, bouton mal placé, étape inutile.

Si le badge Next.js **Issue** apparaît, ouvrez-le et conservez son message exact ainsi
que la page concernée. Un avertissement de navigation lié au défilement fluide a été
corrigé ; cela ne permet pas d’identifier avec certitude le badge de votre premier essai.

## Limites de cette livraison

Le test rapide contient deux joueurs démo, pas des robots qui répondent seuls.
Le GM déclenche les étapes des jeux personnalisés ; seule la collecte du compteur
reconnu est ouverte automatiquement dans le test rapide. L’effectif est figé une fois
la partie préparée. Le guide ne crée ni équipes ni votes complexes ni quiz automatique.
Undercover, Enchères et Qui est l’espion ne sont pas encore des jeux complets jouables.
Les ressources restent des références avec remplacements : aucun média n’est téléversé
ou rendu par un nouvel éditeur OBS. Les accès sont des liens privés sans compte utilisateur.
Les changements sont conservés dans l’onglet et côté serveur après sauvegarde ; fermer
définitivement l’onglet ou effacer ses données peut perdre une saisie non enregistrée et ses accès.
