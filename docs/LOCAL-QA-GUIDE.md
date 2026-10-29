# Recette locale — une seule version sur Mac et smartphone

Branche à utiliser pour **tous** les essais : `qa/undercover-local-validation`.
Le guide couvre l’application et Twitch Local Test réunis. Rien n’est publié et aucun live n’est lancé.

## 1. Démarrer sur le Mac

Arrêtez l’ancien serveur avec **Ctrl+C**, puis copiez ce bloc dans Terminal :

```bash
cd ~/extension-twitch-studio-4b &&
git fetch origin &&
git switch qa/undercover-local-validation &&
git pull --ff-only &&
nvm use 24 &&
npm ci &&
npm run dev:lan
```

Gardez ce terminal ouvert. Attendez **Ready**. Le terminal affiche les adresses réelles de votre Mac, sans IP fixe à recopier d’un ancien guide.

- Sur Mac : ouvrez l’adresse Desktop affichée, ou l’adresse LAN.
- Sur iPhone : ouvrez **l’adresse LAN**, sur le même Wi-Fi. `localhost` sur l’iPhone ne désigne pas le Mac.
- Pour les préparations et images : utilisez toujours **l’adresse LAN dans le même navigateur du Mac**. `localhost` et l’adresse LAN sont deux stockages de navigateur différents. Une liste vide après changement d’adresse ne signifie pas que vos préparations ont été effacées : revenez à l’adresse initiale.
- Si un port est occupé, arrêtez l’ancien serveur. Le lanceur ne tue pas une autre application et ne change pas de port silencieusement.
- Si plusieurs adresses sont affichées, utilisez celle du Wi-Fi. L’option `PUBLIC_ORIGIN=http://ADRESSE_WIFI:3000 npm run dev:lan` permet de la choisir explicitement.

**Adresse à ouvrir :** `0.0.0.0` affiché par Next.js signifie « écouter sur le réseau » ; ce n’est pas l’adresse à utiliser dans le navigateur. Utilisez `localhost` sur Mac ou l’adresse LAN affichée. Les lanceurs locaux acceptent les commandes depuis les deux adresses ; les invitations pointent toujours vers le LAN. Si vos préparations existent déjà sous `localhost`, gardez cette adresse pour les retrouver après mise à jour, sans vider le stockage. Le téléphone utilise l’adresse LAN et le lien privé GM.

Ces serveurs sont destinés au réseau local de confiance, pas à une ouverture de ports Internet. En Cloud, l’IP privée de l’environnement n’est pas l’IP de votre Mac ; ce guide vise le lancement local ci-dessus.

## 2. Qui ouvre quoi ?

| Appareil / onglet                  | À ouvrir                                | Résultat attendu                                                                                             |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Mac, onglet principal              | Accueil puis Préparer Undercover        | Préparations et images conservées dans ce navigateur.                                                        |
| iPhone                             | Lien **privé GM** copié depuis le salon | Même régie et même session ; aucune nouvelle partie créée.                                                   |
| Mac, onglets neufs 1, 2, 3         | Même invitation, trois noms différents  | Trois identités distinctes. Ne pas dupliquer un onglet joueur connecté.                                      |
| Smartphone, onglet neuf facultatif | Invitation ou lien privé d’un joueur    | Interface joueur tactile. Ne pas rejoindre à nouveau sous un nom déjà utilisé pour récupérer un accès perdu. |
| Mac, onglet public                 | Lien du plateau public                  | Aucune information privée.                                                                                   |
| Mac, aperçu / OBS                  | Liens fournis par Plateau               | Même renderer et mêmes données publiques, avec ou sans scène fictive.                                        |

Le lien GM est confidentiel. Une invitation permet de rejoindre ; elle ne permet pas d’animer. Un lien public ne donne pas de droits de joueur ou de GM.

## 3. Smoke test : trois manches, une partie complète

Prévoyez environ 15–20 minutes pour une première exploration. Les images sont facultatives ; utilisez des fichiers que vous avez le droit d’utiliser.

### Préparer sur Mac

1. Depuis l’accueil, touchez **Préparer une partie Undercover**. Les deux contenus sont les premiers réglages visibles.
2. Pour la première manche, saisissez **Sasuke / Itachi**. Prévoyez **3 participants**, **2 tours d’indices**, mode Classique, **1 Undercover** dans les options de rôles. Ajoutez éventuellement deux images, puis **Ajouter cette manche**.
3. Nommez le contenant **Test stream**. Ajoutez **Messi / Ronaldo**, puis **Paris / Londres**. La liste doit contenir trois manches, dans cet ordre. Ces noms sont libres ; aucun portrait protégé n’est fourni par l’application.
4. Essayez Modifier, Dupliquer, Monter/Descendre et Réutiliser une ancienne manche. Une modification d’une copie ne doit pas changer l’original. Retirez ensuite la copie en confirmant, afin de retrouver trois manches.
5. Rechargez : titre, ordre et textes doivent rester présents. Retirer une image ne retire pas son texte. Si une image n’est plus disponible, Reconnecter permet de la choisir à nouveau ; cela ne doit jamais bloquer les textes ou l’ouverture du salon.
6. Depuis une manche, ouvrez **Options → Diffusion**. L’aperçu est un aperçu privé de préparation ; rien n’est publié. Les sept blocs et quatre dispositions restent sous **Ajustements avancés**. Revenez au conducteur, puis **Vérifier la partie → Ouvrir le salon**.

**Attendu :** salon vide, invitation disponible, aucun mot distribué et aucun joueur fictif ajouté automatiquement. Le nombre prévu n’impose pas une capacité du salon.

### Inviter et répartir les appareils

7. Copiez l’invitation du salon. Collez-la dans **trois nouveaux onglets** sur Mac ; rejoignez sous Alex, Camille et Noa. Chaque onglet doit garder son identité après rechargement. « Prêt » est facultatif.
8. Dans **Ma régie et mon plateau** du salon, copiez l’accès privé GM et ouvrez ce lien complet sur l’iPhone. Dans la régie, il est aussi disponible sous **Accès et réglages → Lien privé de régie**. Conservez l’onglet GM du Mac ouvert.
9. Ouvrez un onglet public sur Mac et l’aperçu d’émission. Les liens sont fournis par le salon / l’onglet **Plateau**. Avant distribution, aucun mot ou rôle secret ne doit y figurer.

### Jouer depuis l’iPhone

10. Depuis le salon, **Préparer la partie**, puis **Distribuer les mots et commencer**. Préparer ferme les inscriptions ; seule la distribution donne les mots.
11. Consultez séparément les trois joueurs. Chacun ne voit que son mot. Essayez Masquer / Révéler, puis rechargez un joueur : son identité doit être conservée.
12. Donnez des indices à voix haute, puis confirmez les passages GM : trois joueurs au premier tour, puis trois au deuxième. Le plateau doit suivre le joueur actif et le tour. Le vote n’est pas disponible avant la fin des deux tours.
13. Facultatif : dans **Contenus sur le plateau**, montrer le **Duo anonyme**. Les deux mots/images apparaissent brièvement, sans association aux joueurs. **Publier les affectations** demande une confirmation séparée et révèle volontairement les associations ; ce n’est pas le mode anonyme.
14. Ouvrez les votes. Pour obtenir une victoire reproductible, consultez les trois mots privés : deux sont identiques. Les deux joueurs ayant le même mot votent contre celui ayant le mot différent ; le troisième vote contre un des deux autres. Confirmez chaque vote.
15. Le plateau affiche 1/3, 2/3, puis 3/3, jamais les choix individuels. Le GM touche **Révéler le résultat du vote** et confirme. L’Undercover est éliminé, les civils gagnent, puis le résultat durable reste visible après l’apparition finale.

### Rejouer et avancer

16. Facultatif : **Rejouer cette manche** conserve la paire et les accès ; la distribution doit être refaite. Cela ne sélectionne pas la paire suivante. **Pour passer directement à la manche 2, ne rejouez pas ici** : continuez à l’étape 17. Si vous avez rejoué, atteignez à nouveau un résultat final avant de passer à la suivante.
17. Après un résultat final, revenez à la régie du **Mac qui conserve les préparations**, puis **Manche suivante** et confirmez. La manche 2 est sélectionnée, mais ses mots ne sont ni distribués ni révélés automatiquement. Distribuez pour commencer Messi / Ronaldo.
18. **Retour à ma partie** retrouve le conducteur. Cette navigation n’est ni une pause ni une fin de session.

La préparation complète et les images futures restent sur le Mac d’origine. Sur l’iPhone, vous pouvez animer les phases et rejouer ; le passage à une préparation future demande l’appareil qui la conserve.

## 4. Égalité, élimination intermédiaire et nouveau cycle

- À trois : Alex vote Camille, Camille vote Noa, Noa vote Alex. Dépouillez : égalité, personne éliminé. **Commencer un nouveau cycle** garde les mêmes contenus et les joueurs encore actifs.
- Pour observer une élimination avant la victoire, préparez **5 joueurs** et un Undercover. Faites éliminer un civil au premier scrutin, puis l’Undercover au suivant. Les éliminés suivent en lecture seule et ne votent plus.
- **Cycle d’élimination** = indices et vote avec la même paire. **Manche suivante** = autre paire préparée. **Tour d’indices** = un passage oral des joueurs actifs dans ce cycle.

## 5. Laboratoire et stress à douze joueurs

Le laboratoire est un outil QA distinct : il n’est pas imposé à une partie normale.

1. Depuis Préparer une manche, ouvrez **Options → Laboratoire**. Choisissez **12 joueurs de démonstration**, un Undercover, puis **Lancer une partie de démonstration**.
2. Le serveur prépare de vrais participants avec des accès distincts. Changez de perspective via le sélecteur GM / Joueur / Spectateur. Une action est envoyée avec l’identité de la perspective choisie.
3. Copiez le lien privé GM pour l’iPhone. Gardez sur Mac la perspective joueur et, si souhaité, le comparatif public.
4. Distribuez, confirmez les deux tours oraux et suivez le focus jusqu’aux joueurs 10–12. Les numéros doivent rester stables.
5. Publiez les affectations seulement pour cet essai explicite. Les groupes comptent trois cartes, avec quatre pages pour douze joueurs. Utilisez Groupe précédent / suivant ; aucune autopagination n’est promise.
6. Ouvrez le vote et votez depuis les douze perspectives. Le compteur doit rester sur une ligne, de **0/12 à 12/12**, sans changement de taille du rectangle. Essayez un nom long via les réglages participants disponibles.
7. Répétez avec 3 puis 6 joueurs si vous souhaitez comparer la densité.

Le test rapide porte sur le **brouillon courant**, sans rattachement au conducteur multi-manches. Pour tester « Manche suivante », utilisez le salon par invitations du scénario précédent. Aucune identité de laboratoire n’est exposée dans une route publique d’usurpation.

## 6. Surfaces publiques, preview, OBS et réglages

Remplacez `<id>` par la session en cours en utilisant ses liens, sans recopier un accès privé dans Twitch ou OBS.

| Surface                  | Fonction           | À observer                                                                                                                                      |
| ------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/sessions/<id>/public`  | Plateau spectateur | Informations publiques seulement, synchronisation sans recharger.                                                                               |
| `/sessions/<id>/stream`  | Aperçu d’émission  | Scène fictive facultative, même overlay, retour vers la régie pour un accès GM ; vers le laboratoire seulement avec son accès QA correspondant. |
| `/sessions/<id>/obs`     | Source OBS         | Fond réellement transparent, canevas 1920 × 1080, aucun bouton GM/joueur.                                                                       |
| `/sessions/<id>/overlay` | Éditeur avancé GM  | Sept blocs, quatre dispositions, placement/taille, sauvegarde réelle et conflits. Ce n’est pas une URL spectateur.                              |

Dans OBS, ajoutez une **Source navigateur**, collez l’URL publique `/obs`, largeur **1920**, hauteur **1080**. Placez une source Couleur/Image en dessous pour constater la transparence. Gardez l’application ouverte sur Mac ; la partie réelle alimente OBS. Aucun compte Twitch ou live n’est requis. Le premier workflow OBS a déjà été validé par l’utilisateur ; les changements de cette branche demandent un nouvel essai réel.

Pour un ancien layout v1 : il doit rester intact. Dans Diffusion, comparez l’habillage TV, choisissez Garder ma disposition ou adoptez explicitement TV. Après adoption, l’ancienne disposition peut être restaurée. Les nouvelles préparations utilisent TV v2 ; aucune ancienne géométrie n’est remplacée silencieusement.

## 7. Motion et reconnexion

- Discussion : arrivée brève du joueur actif, nom ensuite immobile.
- Duo : apparition des deux contenus puis retrait, sans association privée.
- Vote : progression publique seulement. Après tous les votes reçus, le GM dépouille ; il n’existe pas de nouvelle phase automatique « vote fermé ».
- Égalité / élimination : apparition courte, puis note durable.
- Fin : révélation autorisée puis résultat compact durable.
- Interruption : après les indices terminés, montrez un Duo puis ouvrez vite le vote. Le Duo ne doit pas réapparaître plus tard.
- Rechargez / ouvrez tardivement une source : état actuel, aucune ancienne révélation rejouée. Testez une coupure/reconnexion réseau sans créer de nouvelle identité.
- Activez **Réduire les animations** dans les réglages d’accessibilité du Mac ou de l’iPhone, puis rechargez la vue : fondu court, sans translation, stagger ou lueur. Informations et permissions identiques.

## 8. Twitch Local Test — facultatif, même branche

**Ne lancez pas deux serveurs en même temps.** Arrêtez `dev:lan` avec Ctrl+C. Twitch Local Test démarre aussi l’application LAN ; vos données serveur normales restent dans la même base par défaut.

Première fois sur Mac :

```bash
brew install mkcert
npm run twitch:cert
```

Puis :

```bash
npm run twitch:local
```

Ouvrez `https://localhost:8443/` sur Mac : la page de diagnostic doit fonctionner sans erreur TLS. `panel.html`, `mobile.html`, `video_overlay.html` et `config.html` sont les entrées de l’extension. **Ouvertes directement hors Twitch, elles attendent le Helper / l’autorisation : c’est attendu.** Aucun faux Helper n’est installé dans l’application.

Pour le vrai test Twitch, suivez les étapes de [configuration du Local Test](TWITCH-LOCAL-TEST.md#actions-humaines-twitch-requises) : compte de test, type Panel, Testing Base URI affichée, Configuration Service, installation privée et association du lien **public** de la session. Le serveur public HTTPS est l’origine imprimée par le lanceur. Aucun OAuth/secret/stream key n’est requis par notre viewer en lecture seule.

- Le Panel est le premier essai, sans imposer un live vidéo. Il ne superpose pas l’habillage au lecteur.
- Video Overlay est un test séparé pouvant nécessiter une chaîne en direct. Cette mission ne lance aucun live.
- Le Viewer charge le renderer Broadcast final et son Motion ; il ne possède pas une copie ancienne.
- Sur iPhone, gardez le GM / joueur sur l’adresse LAN HTTP. Le Viewer dans l’app Twitch est une validation distincte, soumise aux capacités Local Test mobiles et à la confiance HTTPS. `localhost:8443` ne désigne pas le Mac depuis le téléphone.
- `npm run twitch:package` fabrique uniquement l’archive Hosted Test, sans upload ni activation. **Ne pas cliquer Review, Release ou Publish.**

Les tests automatisés utilisent un Helper contrôlé dans leurs seuls contextes de test. Ils ne prouvent pas une connexion Twitch authentifiée. Sans configurer Twitch, les surfaces public / stream / OBS restent utilisables et partagent déjà le même rendu.

## 9. Consigner la recette

Utilisez [LOCAL-QA-CHECKLIST.md](LOCAL-QA-CHECKLIST.md). Notez appareil, navigateur, manche/cycle, action et résultat observé. Classez PASS, BUG, UX ou À REVOIR. Consultez [les limites connues](LOCAL-QA-KNOWN-ISSUES.md) avant de considérer une absence comme une régression.

Pause réelle, reprise, fin anticipée, clôture et abandon : **NOT_IMPLEMENTED_PENDING_PRODUCT_DECISION**. Aucun faux bouton actif ou effet serveur n’a été ajouté. Cela ne bloque pas les parcours ci-dessus.
