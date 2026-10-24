# Tester les sessions depuis un iPhone

> Ce guide conserve les scénarios historiques du salon. Pour **jouer à Undercover
> avec iPhone + ordinateur**, utiliser [le guide actuel](TEST-MULTI-DEVICE-GAMES.md).
> Premier test humain iPhone du Studio et d’Undercover effectué ; cette nouvelle
> refonte, les parcours physiques complets et OBS restent à valider.
> Pour les nouveaux exemples et le laboratoire : [guide configurable](TEST-CONFIGURABLE.md).

## Préconditions et lancement sur le réseau local

Utiliser un ordinateur macOS/Linux avec Node.js 24.x, npm 11.x et ce dépôt sur `feat/play-flows-multidevice`. L’iPhone et l’ordinateur doivent être connectés au même réseau Wi-Fi de confiance. Les réseaux invités peuvent interdire les communications entre appareils ; un VPN peut sélectionner une mauvaise interface.

Depuis la racine du dépôt :

```sh
git fetch origin
git switch feat/play-flows-multidevice
npm ci
npm run dev:lan
```

Le script affiche **« Régie sur le réseau local : … »** suivi de l’adresse privée réelle de l’ordinateur, par exemple une adresse du réseau `192.168.x.x` ou `10.x.x.x`. Ouvrir **l’adresse affichée** dans Safari sur l’iPhone. Le script configure `PUBLIC_ORIGIN`, l’origine de développement et l’interface d’écoute web. Le serveur Node reste sur la boucle locale ; seul le port web est accessible depuis le réseau.

Si le cache npm du compte n’est pas accessible dans le cloud, utiliser `npm ci --cache /workspace/.cache/npm`.

S’il existe plusieurs interfaces, choisir l’adresse Wi-Fi dans les réglages réseau de l’ordinateur, puis relancer explicitement (remplacer l’adresse par la vôtre) :

```sh
PUBLIC_ORIGIN=http://192.168.1.42:3000 npm run dev:lan
```

Ne pas saisir `localhost` sur l’iPhone et ne pas l’envoyer aux joueurs : ce nom désigne leur propre appareil. Autoriser le port web dans le pare-feu de l’ordinateur sur ce réseau privé si nécessaire. Le script refuse les origines Internet et les adresses absentes de l’ordinateur. Ne pas configurer de redirection de port sur le routeur ; le HTTP local est réservé à un réseau de confiance, car les accès privés transitent sans chiffrement réseau.

`Ctrl+C` arrête tous les processus. Les données sont conservées dans `.data/sessions.sqlite` ; relancer la même commande les restaure. Le script ne génère aucun secret Twitch et n’utilise aucun service externe.

## Cas d’un environnement cloud distant

Une adresse privée du conteneur cloud n’est généralement pas accessible depuis le Wi-Fi de l’iPhone. Cet espace d’onboarding ne fournit pas de prévisualisation web utilisable pour cette livraison. Pour un test immédiat sur votre téléphone, exécuter le dépôt sur un ordinateur du même réseau comme ci-dessus.

Pour tester sur un hébergement distant, il faut d’abord un point d’entrée **HTTPS protégé par l’hébergement** et accessible aux invités, avec authentification en amont et support SSE. Ne pas exposer directement le serveur Next de développement à Internet. Une fois ce point d’entrée configuré, exporter son origine dans `PUBLIC_ORIGIN`, garder `SERVER_ORIGIN` dirigé vers le serveur Node privé et lancer le web sur l’interface interne attendue par l’hébergement (`WEB_HOST`). `PUBLIC_ORIGIN` est aussi ajouté aux hôtes de développement autorisés par Next.js. Le proxy doit préserver les en-têtes d’autorisation, ne pas mettre les réponses privées en cache et ne pas mettre les flux SSE en tampon. Les cookies de l’éventuel contrôle d’accès de l’hébergeur sont envoyés aux requêtes de même origine ; ils ne définissent pas les rôles de jeu.

La création d’accès anonymes n’est pas une authentification de compte ni une protection suffisante pour une ouverture publique commerciale. Aucun déploiement Internet ou accès distant protégé n’est provisionné par ce jalon.

## Checklist 1 — Création et invitation

**Préconditions :** application lancée, iPhone et deuxième appareil ayant accès à l’adresse affichée.

- [ ] Sur l’iPhone, ouvrir l’accueil, saisir le nom de l’émission et votre nom de GM, sélectionner Undercover et toucher **Créer ma session**.
- [ ] Dans la régie, vérifier **Synchronisé**, zéro joueur et le salon d’attente.
- [ ] Ouvrir **Conserver mon accès Game Master**, copier le lien privé et le conserver personnellement. Ce lien contrôle la session ; l’invitation des joueurs est un autre lien.
- [ ] Copier **Invitation des joueurs** et l’envoyer au deuxième appareil. Sur HTTP local, si la copie automatique n’est pas disponible, sélectionner le champ et utiliser le menu Copier d’iOS.
- [ ] Sur le deuxième appareil, ouvrir l’invitation, saisir « Nova » puis **Rejoindre la session**.
- [ ] Dans un autre navigateur ou onglet, utiliser la même invitation pour inscrire « Atlas ». Chaque inscription doit avoir son nom et son accès propre.

**Attendu GM :** deux noms apparaissent sans rechargement. **Attendu joueur :** chacun voit son nom et son bouton personnel. **Attendu spectateur :** ouvrir le lien du plateau fourni par le GM ; les deux noms sont publics, sans invitation, accès GM ni données privées.

**À apprécier humainement :** lisibilité, clavier iOS, facilité à distinguer lien privé et invitation, taille des boutons et accès aux actions sans défilement excessif.

## Checklist 2 — Préparation synchronisée

- [ ] Depuis Nova, toucher **Je suis prêt**. Vérifier immédiatement l’état sur la régie de l’iPhone, chez Atlas et sur le plateau.
- [ ] Vérifier qu’Atlas reste **En préparation**, puis changer son état séparément.
- [ ] Depuis l’iPhone GM, saisir un **Nouveau nom de l’émission** et toucher **Renommer la session**. Le nouveau titre doit apparaître dans toutes les vues.
- [ ] Sur le GM, fermer les invitations depuis la barre inférieure. Dans un nouvel onglet, tenter une nouvelle inscription : elle doit être refusée avec une explication. Rouvrir les invitations et réessayer.
- [ ] Recharger Nova : même identité, même état prêt, pas de joueur supplémentaire. Les indicateurs doivent revenir à **Synchronisé**.
- [ ] Fermer les onglets de Nova : le GM doit la voir hors ligne. Revenir avec son lien privé restaure sa présence et son état.

**Attendu GM :** journal et états cohérents. **Attendu joueurs :** leur bouton change uniquement leur propre état. **Attendu spectateur :** mêmes titre, noms et états prêts, sans commandes. Une indication de présence « connecté » signifie qu’au moins un flux de cette identité est ouvert ; les navigateurs mobiles peuvent retarder la détection d’un onglet suspendu.

**À apprécier humainement :** délai perçu, compréhension de « prêt », lisibilité du plateau en portrait et comportement lorsque Safari passe en arrière-plan.

## Checklist 3 — Permissions, retrait et remise à zéro

- [ ] Dans un navigateur sans votre accès privé, ouvrir le chemin de la régie GM sans son fragment privé : l’accès doit être refusé.
- [ ] Ouvrir ensuite votre lien privé GM dans ce navigateur : la régie doit se rétablir. Le fragment privé doit disparaître de la barre d’adresse après son import dans l’onglet.
- [ ] Depuis l’iPhone GM, retirer Nova et confirmer. Son interface ouverte doit annoncer que son accès a été retiré ; elle ne doit plus pouvoir changer d’état.
- [ ] Toucher **Réinitialiser le salon** et confirmer. Tous les joueurs doivent disparaître du GM et du plateau ; tous leurs anciens accès sont révoqués.
- [ ] Vérifier que le lien public et l’accès GM fonctionnent toujours, mais que l’invitation a changé. L’ancienne invitation ne doit plus inscrire de joueur.
- [ ] Partager la nouvelle invitation et inscrire à nouveau Nova. Le nom peut être réutilisé et un nouvel accès individuel est créé. Le journal conserve les événements précédents : la remise à zéro n’est pas une suppression de l’historique.

**À apprécier humainement :** clarté des confirmations, du refus d’accès et de la nécessité de repartager l’invitation.

## Checklist 4 — Incident et récupération

- [ ] Conserver les liens privés GM et joueur, puis arrêter le serveur sur l’ordinateur avec `Ctrl+C`.
- [ ] Vérifier la reconnexion affichée. Les actions doivent être suspendues pendant l’indisponibilité.
- [ ] Relancer `npm run dev:lan` avec la même adresse et la même base. Les vues doivent retrouver le titre, les joueurs, états et journal. La présence redevient active à mesure que les clients se reconnectent.
- [ ] Si une commande est indiquée en attente, utiliser **Réessayer la commande** : elle doit être confirmée sans deuxième événement identique.

En cas de changement d’adresse Wi-Fi, mettre à jour `PUBLIC_ORIGIN` puis ouvrir les liens avec la nouvelle origine. Les chemins et fragments d’accès restent valables avec la même base ; les données de stockage de l’ancien onglet ne migrent pas automatiquement entre origines. Garder les liens privés en lieu sûr. Sans compte, il n’existe pas encore de récupération par e-mail ; un accès GM perdu et non conservé exige une nouvelle session.

Sauvegarde technique : arrêter le serveur puis copier **tout le dossier `.data`**, le conserver de manière privée et le restaurer serveur arrêté. Ne pas committer de base, fichier WAL, lien privé ou trace navigateur d’une vraie session. La base contient notamment les noms et invitations ; les jetons d’accès y sont stockés sous forme de condensats. Ne pas effacer `.data` pour un essai normal : utiliser la remise à zéro depuis la régie.

## Ce que cette livraison ne teste pas encore

Cette section décrit les limites historiques du salon initial. La version actuelle propose Undercover jouable avec mots privés, deux tours d’indices, votes et victoire ; voir le guide actuel. Le laboratoire et ses participants fictifs utilisent désormais les vrais mécanismes : voir le guide configurable. Pas de Bits, connexion Twitch, import d’images ou PWA installable. Les anciennes maquettes sont accessibles séparément sous `/demo`, `/player` et `/overlay?game=undercover`.

Les tests automatisés utilisent Chromium sur trois formats d’écran ; ils ne certifient ni Safari iOS ni un iPhone physique. La poursuite du socle et du laboratoire est autorisée sans attendre le test physique. Retour attendu : résultats des checklists, problèmes ergonomiques, ambiguïtés et appréciation du parcours. Les règles proposées pour C restent à valider.
