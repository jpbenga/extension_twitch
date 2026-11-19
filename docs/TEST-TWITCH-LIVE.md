# Valider Undercover sur un live Twitch

Ce test utilise trois sorties différentes. Ne remplacez jamais l’une par l’autre :

| Sortie        | Destination                   | Contenu                                                       |
| ------------- | ----------------------------- | ------------------------------------------------------------- |
| Régie GM      | appareil privé du Game Master | commandes et informations privées                             |
| Retour Studio | écran visible des joueurs     | caméra, déroulement public utile et chat Twitch, sans secrets |
| Programme OBS | Twitch et spectateurs         | caméra et overlay public enrichi                              |

Twitch ne reçoit que le **Programme OBS**. Le Retour Studio reste un affichage local.

## 1. Configurer la chaîne et le Retour Studio

Dans la régie GM, ouvrez **Plateau** puis saisissez le nom de la chaîne Twitch, sans
URL. Choisissez ensuite :

- **Vidéo dominante, chat masqué** ; ou
- **Vidéo + vrai chat Twitch latéral**.

Ouvrez ou copiez le **Lien du Retour Studio configuré**. En développement LAN, la
régie génère automatiquement un lien `localhost` pour cette surface locale, tandis que
les invitations joueurs gardent l’adresse Wi-Fi. Le nom de chaîne et le choix de
présentation ne modifient ni la session de jeu ni la composition OBS.

Le chat est l’embed officiel Twitch. En production, Twitch exige un domaine HTTPS et
le paramètre `parent`. Le lancement `npm run dev:lan` rend aussi le Retour Studio
accessible sur `localhost`, sans réécriture manuelle. Les cookies tiers ou les
protections du navigateur peuvent demander une connexion Twitch dans la fenêtre intégrée.

Dans le Retour Studio, choisissez **Afficher une fenêtre OBS** pour sélectionner le
projecteur d’une scène propre destinée aux joueurs, ou **Utiliser la caméra** pour un
essai direct. Cette sélection reste locale au navigateur et n’est jamais envoyée au
serveur.

Le chat d’une chaîne Twitch reste accessible lorsque la chaîne est hors ligne. Envoyer
un message de test ne démarre aucun live vidéo ; le message est néanmoins public dans
le chat de la chaîne. Le live ne commence qu’après l’action explicite **Démarrer le
streaming** dans OBS.

## 2. Préparer OBS sans risque de fuite

1. Créez une scène **LIVE TWITCH — PUBLIC**.
2. Ajoutez la caméra et la **Source OBS transparente** fournie par la régie.
3. Réglez la source navigateur sur 1920×1080.
4. Cette scène est la seule scène envoyée dans le Programme OBS.
5. Ouvrez le Retour Studio directement en plein écran sur le moniteur du plateau.

L’ouverture directe du Retour Studio est plus sûre qu’une transition OBS : il ne peut
pas être envoyé accidentellement à Twitch. Si vous devez le gérer dans OBS, utilisez un
projecteur plein écran d’une scène dédiée et ne la transitionnez jamais vers Programme.

## 3. Faire les deux tests Twitch

Dans OBS, ouvrez **Réglages > Stream**, choisissez **Twitch** puis connectez le
compte de test (recommandé) ou renseignez sa clé de stream. Cette clé reste dans
OBS : ne la copiez jamais dans la régie Undercover ni dans le lien Retour Studio.
Vérifiez ensuite que la scène **LIVE TWITCH — PUBLIC** est bien dans le Programme
avant de démarrer le stream.

### Test réseau privé

Utilisez Twitch Inspector et le mode `bandwidthtest=true`. Il valide la stabilité, le
débit, la résolution et l’encodeur, mais Twitch désactive volontairement la lecture
publique : ce test ne permet pas de juger visuellement l’overlay. Si votre version
d’OBS expose **Enable Bandwidth Test Mode**, activez cette option ; sinon ajoutez
`?bandwidthtest=true` à la fin de la clé de stream le temps de ce seul test, puis
retirez-le avant la validation visuelle.

### Validation visuelle réelle

Faites ensuite un court vrai live, de préférence sur une chaîne de test et hors des
heures habituelles. Désactivez d’abord le mode bandwidth test, cliquez sur
**Démarrer le streaming** dans OBS, puis regardez la chaîne depuis un autre appareil
ou compte :

- le spectateur doit voir la composition OBS publique et ses attributions ;
- les joueurs doivent voir le Retour Studio sans rôle, mot ou attribution privée ;
- le GM doit conserver la régie privée ;
- un message envoyé dans le chat Twitch doit apparaître dans le Retour Studio ;
- l’encodage Twitch doit préserver la lisibilité des textes et des cartes.

Twitch ne propose pas de live visuellement consultable et simultanément privé via le
mode Inspector. La validation visuelle nécessite donc un vrai live, même court.

Références officielles :

- <https://dev.twitch.tv/docs/embed/chat>
- <https://dev.twitch.tv/docs/video-broadcast/>
- <https://help.twitch.tv/s/article/guide-to-using-twitch-inspector>
