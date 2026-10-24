# Jouer seul avec un iPhone et un ordinateur

Ce guide teste les vraies règles et les vrais accès. Pas de Twitch, JSON ou
installation manuelle de définition. **Undercover est disponible ; Enchères et
Qui est l’espion ne sont pas encore jouables.**

## Démarrer une seule fois sur l’ordinateur

Dans le dossier du projet, avec Node 24 et npm 11 :

```sh
git fetch origin
git switch feat/play-flows-multidevice
npm ci
npm run dev:lan
```

Gardez le terminal ouvert. Il affiche une adresse comme `http://192.168.0.46:3000`.
Utilisez **l’adresse réellement affichée**, sur les deux appareils connectés au
même Wi-Fi de confiance. Une adresse `localhost` désigne l’appareil qui l’ouvre :
elle ne permet pas à l’iPhone de joindre le serveur de l’ordinateur.
Si macOS demande l’accès au réseau local, autorisez-le pour ce test. Vérifiez
l’adresse Wi-Fi et le pare-feu si l’iPhone ne répond pas. Pas de redirection de port
sur la box et pas de tunnel public sans protection.

Dans le cloud, l’adresse privée du conteneur n’est généralement pas accessible à
l’iPhone. Utilisez l’URL **HTTPS protégée** fournie par votre hébergeur, avec
`PUBLIC_ORIGIN` configuré sur cette origine et un relais qui laisse passer SSE.
Le serveur Node reste privé. `dev:lan` est fait pour un ordinateur sur votre Wi-Fi,
pas pour exposer un serveur cloud. Détails : [TEST-IPHONE.md](TEST-IPHONE.md).

Une ancienne partie conserve ses anciennes règles. Pour les deux tours d’indices,
créez une **nouvelle démonstration** avec cette branche ; le rejeu d’une ancienne
partie 0.1.0 ne la convertit pas en 0.2.0.

## Préparer les deux appareils

1. Sur l’ordinateur, ouvrez l’adresse affichée. Touchez **Jouer**.
   → Vous voyez les jeux disponibles, séparés du Studio Créateur.
2. Choisissez **Préparer Undercover**.
   → Les règles proposées sont indiquées comme variante de démonstration.
3. Gardez « Tester seul avec des joueurs de démonstration », choisissez **3 joueurs**,
   **1 Undercover**, **2 tours d’indices**. Gardez les mots proposés.
4. Touchez **Lancer une partie de démonstration**.
   → La partie, ses trois joueurs et leurs accès distincts sont prêts. Aucune
   opération « installer la définition » n’est à faire.
5. Touchez **Copier le lien privé GM pour mon iPhone**. Envoyez ce lien à votre
   propre iPhone (par exemple par AirDrop ou votre messagerie personnelle).
   → Le message « Lien copié » apparaît. Ce lien donne le contrôle : ne l’envoyez
   pas à un joueur. Il n’est pas une invitation publique.
6. Sur l’iPhone, ouvrez ce lien dans Safari.
   → La régie affiche Undercover, Préparation, trois joueurs et **Synchronisé**.
   Le fragment privé disparaît de l’adresse après import. Conservez la copie privée
   d’origine, car copier la barre d’adresse après import ne copie plus l’accès.
7. Gardez le laboratoire ouvert sur l’ordinateur. Son menu **Point de vue** permet
   de choisir Joueur 1, Joueur 2, Joueur 3 ou Spectateur.
   → « Mode test — Vous incarnez Joueur 2 » confirme votre perspective.

Les joueurs fictifs non consultés peuvent afficher « Hors ligne » : ils restent
inscrits. Choisir leur vue les connecte réellement ; ils ne sont pas des robots
qui votent automatiquement.

Le laboratoire conserve les accès dans **cet onglet**. Un autre appareil ouvrant
uniquement l’URL du laboratoire n’obtient aucun accès. Pour ce parcours seul à deux
appareils, créez donc le laboratoire sur l’ordinateur puis transférez seulement le
lien GM à l’iPhone. Si vous avez créé la démonstration sur l’iPhone, vous pouvez
copier chaque lien joueur depuis « Accès individuels… » vers l’ordinateur ; le
sélecteur complet n’est pas transféré automatiquement. Il n’existe pas de récupération
par compte ou e-mail.

Si la copie automatique est indisponible sur votre Wi-Fi HTTP, faites un appui long
sur **Ouvrir la régie sur cet appareil**, puis copiez son lien avec le menu Safari.
Chaque joueur dispose aussi d’un lien d’ouverture individuel dans « Accès individuels
des joueurs de démonstration ». Aucun jeton brut n’est affiché dans les textes.

## Test 1 — Undercover complet

| Action                                                                                                   | Résultat attendu                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sur l’iPhone, toucher **Distribuer les mots et commencer**                                               | Discussion, tour d’indices 1 / 2, premier joueur désigné. Le vote n’est pas disponible.                                                                                              |
| Sur l’ordinateur, choisir Joueur 1 puis Joueur 2 puis Joueur 3                                           | Chacun voit une seule carte privée contenant son mot. Le joueur ignore son camp à ce stade. Ne confondez pas la consultation volontaire successive du testeur avec une vue publique. |
| Recharger Joueur 2 dans le laboratoire                                                                   | Le même joueur reste sélectionné et conserve sa propre carte.                                                                                                                        |
| Dire un premier indice oral pour le joueur désigné                                                       | Aucun texte à saisir. Le serveur attend la confirmation du GM.                                                                                                                       |
| Sur l’iPhone, toucher **Confirmer l’indice et passer au suivant** après chaque indice                    | Le joueur suivant est désigné, le précédent est marqué « Indice donné ». Après les trois joueurs, tour 2 / 2. Toujours pas de vote.                                                  |
| Donner un deuxième indice par joueur et confirmer ses trois passages                                     | Les tours sont complets. **Ouvrir les votes** apparaît seulement maintenant.                                                                                                         |
| Sur l’iPhone, toucher **Ouvrir les votes**                                                               | Le GM voit les votes attendus. Les joueurs voient des candidats actifs.                                                                                                              |
| Sur l’ordinateur, Joueur 1 : choisir Joueur démo 2, puis confirmer le vote dans le dialogue personnalisé | Le vote est enregistré. Impossible de voter à nouveau ; le choix individuel n’est pas affiché au spectateur.                                                                         |
| Joueur 2 : voter contre Joueur démo 1 ; Joueur 3 : voter contre Joueur démo 1                            | Le GM voit 3 / 3 votes reçus.                                                                                                                                                        |
| Passer en vue Spectateur, puis sur l’iPhone toucher **Révéler le résultat du vote** et confirmer         | Joueur démo 1 est éliminé avec 2 voix. Le même résultat apparaît sur les deux appareils.                                                                                             |
| Lire le résultat final                                                                                   | Avec 3 joueurs, cette élimination décide toujours une victoire : civils si l’intrus a été éliminé, Undercover sinon (parité). Les mots et camps sont alors révélés volontairement.   |
| Sur l’iPhone, toucher **Rejouer cette partie**, puis Annuler                                             | Rien ne change. Aucun dialogue système avec adresse IP.                                                                                                                              |
| Toucher à nouveau Rejouer, puis **Recommencer**                                                          | Retour en préparation, mêmes joueurs et accès ; votes, éliminations et résultat effacés. Redistribuer pour repartir.                                                                 |

**Pour vérifier plusieurs manches :** créez un nouveau test avec **4 joueurs**.
Le GM peut regarder « Informations privées du Game Master » pour choisir
volontairement un civil comme cible de test. Faites voter les autres contre lui,
et lui contre un autre. Après dépouillement : un civil éliminé, aucune victoire
(2 civils / 1 Undercover). Touchez **Commencer la manche suivante**. Deux tours
complets recommencent avec **3 actifs**, puis un nouveau vote décide la victoire.
L’éliminé reste en lecture seule et ne figure plus parmi les candidats.

**Erreur à essayer :** pendant le vote, consultez un joueur qui a déjà voté : son
bouton a disparu. Un éliminé ne peut pas voter et un joueur ne peut pas distribuer
les mots. Dans le laboratoire, « Vérifier les permissions (avancé) » permet aussi
un vrai essai de commande GM sous accès joueur : le serveur doit la refuser.

**Égalité :** avec 3 joueurs, votez 1→2, 2→3, 3→1. Après révélation, personne ne
sort. Le GM ouvre une nouvelle manche avec deux tours d’indices. La limite de
manches évite une boucle infinie : une partie nulle est annoncée si elle est atteinte.

## Voir plusieurs perspectives sur l’ordinateur

Le **sélecteur** est recommandé : une seule connexion privée à la fois, aucun
mélange d’identité, changement de vue explicite. Vous pouvez cocher **Afficher le
plateau à côté sur ordinateur** : il utilise sa propre projection publique serveur.
Sur iPhone, une seule perspective est affichée. Le lien **Voir le plateau spectateur**
ouvre la vue publique seule, également adaptée à OBS.

Pour des fenêtres séparées, « Accès individuels… » propose **Ouvrir Joueur 1
séparément**, etc. Ces liens importent les capacités indépendantes, indexées par
joueur. Un rechargement ne transforme pas Joueur 1 en Joueur 2. N’ouvrez pas un grand
nombre d’onglets : en HTTP local, le navigateur limite les connexions simultanées
à une même origine. Fermez les vues inutiles si une synchronisation attend. Le
sélecteur et l’aperçu public évitent cette limite. Les tests automatisés utilisent,
eux, de vrais contextes isolés pour GM, chaque joueur et spectateur.

## Test 2 — Enchères

**Non disponible. Ne pas marquer ce parcours validé.** Le catalogue affiche le
statut non jouable. La future verticale devra vérifier 1 000 crédits initiaux,
mises 100 puis 150, refus d’une offre hors budget, concurrence, clôture et attribution
confirmée avec débit unique, lot suivant et classement. Ces montants restent une
proposition, pas une définition exécutée. Aucun bouton de démonstration fictif.

## Test 3 — Qui est l’espion ?

**Non disponible. Ne pas marquer ce parcours validé.** À livrer : attribution
secrète, questions ciblées et réponses selon les règles retenues, accusation,
révélation et victoire distinctes des éliminations Undercover. Sa carte ne lance
pas une copie renommée d’Undercover.

## Test 4 — Synchronisation et récupération

1. Votez depuis une perspective joueur sur l’ordinateur.
   → L’iPhone affiche un vote reçu ; le plateau montre le même nombre.
2. Depuis l’iPhone, terminez le vote quand tous ont voté.
   → Le résultat arrive sur l’ordinateur et les actions disponibles changent.
3. Rechargez la vue joueur.
   → Même identité, même vote, pas de seconde soumission.
4. Coupez brièvement le réseau de l’iPhone, puis reconnectez-le.
   → Reconnexion affichée, commandes suspendues puis état courant retrouvé.
   Une coupure ne compte jamais comme un indice ou un vote.
5. En cas d’acquittement incertain, utilisez **Réessayer mon action** ou
   **Réessayer la commande**. → La même commande est reprise sans double effet.
6. Revenez à l’accueil via le logo, puis rouvrez le lien privé GM conservé.
   → La partie continue. L’accueil n’envoie aucune commande d’arrêt.

Si le serveur doit redémarrer, relancez-le avec la même base SQLite. Les parties,
votes et passages confirmés sont persistants ; la présence réseau est recalculée.
Ne supprimez pas `.data/sessions.sqlite` pour recommencer un test.

## Test 5 — Confidentialité

- Un joueur n’affiche que sa carte, jamais les mots d’autrui avant la fin.
- Le spectateur n’a aucune carte secrète, aucun contrôle GM ou sélecteur d’identités.
- Le journal public ne contient ni mots ni votes individuels.
- Un éliminé conserve sa carte et son accès en lecture ; aucune permission nouvelle.
- Changer de perspective puis recharger conserve le joueur choisi.
- Le sélecteur complet appartient au testeur GM qui a créé le laboratoire ; il ne
  doit jamais être partagé comme invitation d’un vrai joueur.

## Avec de vrais invités

Dans Préparer Undercover, choisissez **Inviter de vrais participants** puis
**Créer une partie avec mes invités**. Copiez l’**Invitation des joueurs**, distincte
du lien GM. Chaque invité choisit son nom dans son propre navigateur. Le GM touche
**Préparer la partie** seulement quand 3 à 12 personnes sont présentes, puis distribue.
L’invitation est fermée à la préparation. Les accès démo ne sont pas nécessaires.

**Recommencer le test** garde les joueurs et remet les règles à leur état initial.
**Créer un nouveau test** prépare une autre partie, configurable, indépendante.
**Réinitialiser le salon** (réglages de la régie) retire tous les joueurs et révoque
leurs accès après confirmation destructive : ce n’est pas la commande de rejeu.

## Appréciation humaine et OBS

À remplir sur vos appareils : lisibilité en portrait, confort au pouce, clavier et
barres Safari, copie des liens, compréhension de l’identité active, rythme des deux
tours, intérêt des mots et équilibre des victoires. Aucun de ces points n’est validé
par la seule réussite de Chromium. Premier test humain iPhone effectué sur l’ancien
Studio et Undercover ; refonte et nouveau déroulement à valider par l’utilisateur.

Pour OBS, ouvrez le **lien public** dans une source navigateur en 1920 × 1080,
jamais le lien GM/joueur/laboratoire. Le plateau est sombre, pas un éditeur de scènes
ou une garantie de transparence. Le rendu navigateur est vérifiable ; OBS physique,
Safari iOS et les parcours iPhone + PC réels restent à tester par l’utilisateur.
