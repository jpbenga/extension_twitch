# Tester Undercover dans une extension Twitch

**Version de recette actuelle :** suivez d’abord [le guide commun Mac + iPhone](LOCAL-QA-GUIDE.md)
sur `qa/undercover-local-validation`. Les détails Twitch ci-dessous restent applicables ;
la branche historique `feat/twitch-local-test` ne contient pas à elle seule la consolidation UX/Motion.

Cette livraison prépare **Local Test**, sans Review, Release, publication ni émission vidéo. Twitch affiche les informations publiques de votre véritable partie ; la régie et les joueurs gardent leurs interfaces habituelles.

**Commencez par le type Panel.** Il permet de tester la surface d’extension sous le lecteur de la chaîne, sans faire du live vidéo le prérequis du scénario. Il ne superpose pas l’habillage à une vidéo. L’entrée Video Overlay utilise le même renderer, mais sa présence au-dessus du lecteur Twitch peut nécessiter une chaîne en direct : ce test est séparé et n’est pas déclenché ici.

Pour voir la webcam et l’habillage dans une même image, suivez le
[guide Hosted Test, OBS, caméra et overlay](TWITCH-HOSTED-WORKFLOW.md). La webcam
vient d’OBS ; l’extension ne démarre jamais elle-même un flux vidéo.

Les exemples officiels Twitch documentent cette distinction. L’affichage effectif d’une extension non publiée sur votre compte, et particulièrement dans l’application mobile Twitch, reste à vérifier humainement. Aucun compte Twitch n’a été utilisé depuis le Cloud.

## Première configuration sur votre Mac

### 1. Récupérer le code

```bash
cd ~/extension-twitch-studio-4b
git fetch origin
git switch qa/undercover-local-validation
git pull --ff-only
nvm use 24
npm ci
```

Arrêtez l’ancien `npm run dev:lan` avec Ctrl+C dans son terminal. La nouvelle commande démarre aussi l’application ; ne lancez pas deux serveurs sur les mêmes ports.

### 2. Installer le certificat local, une seule fois

Si Homebrew est déjà installé :

```bash
brew install mkcert
npm run twitch:cert
```

macOS peut demander de confirmer la confiance dans l’autorité **de développement locale**. Le script crée un certificat pour localhost et les adresses privées actuelles du Mac. Il n’envoie aucune clé et ne désactive aucun contrôle TLS. Les fichiers restent dans `.data/twitch/tls/`, ignorés par Git.

Si vous utilisez Firefox, sa configuration de confiance peut nécessiter NSS (`brew install nss`, puis relancer `npm run twitch:cert`). Pour commencer, utilisez Chrome sur le Mac.

Relancez `npm run twitch:cert` si le certificat a expiré ou si l’adresse Wi-Fi a changé et que vous l’utilisez pour Twitch.

### 3. Lancer le test local

```bash
npm run twitch:local
```

Gardez le terminal ouvert. Attendez que Next.js affiche Ready. Par défaut, il indique :

```text
Testing Base URI : https://localhost:8443/
Panel Viewer Path : panel.html
Mobile Path : mobile.html
Config Path : config.html
Live Config Path : live_config.html (facultatif)
Video Overlay Path : video_overlay.html (test vidéo séparé)
Serveur public HTTPS à associer : https://localhost:8443
GM / préparation : http://ADRESSE_WIFI_DU_MAC:3000/play/undercover
Joueurs : liens d’invitation affichés dans la régie
```

Ouvrez `https://localhost:8443/` dans Chrome : une page « Twitch Local Test » doit s’afficher **sans erreur de certificat**. Cette page confirme seulement le serveur HTTPS, pas une connexion Twitch. Une vue ouverte directement hors Twitch explique que le Helper manque ; c’est attendu.

Si le certificat n’est pas reconnu, corrigez sa confiance avec mkcert avant de poursuivre. Ne désactivez pas la vérification TLS du navigateur. Une autorisation Chrome d’accès au réseau local peut être nécessaire ; elle est distincte de la confiance du certificat.

## ACTIONS HUMAINES TWITCH REQUISES

Ces actions nécessitent votre compte. Le dépôt ne les effectue pas et ne suppose pas qu’une extension existe déjà. Les intitulés précis peuvent varier dans Developer Console.

1. Ouvrez [Twitch Developer Console — Extensions](https://dev.twitch.tv/console/extensions). Créez une extension de test ou sélectionnez la vôtre. Il s’agit d’une **Extension**, pas seulement d’une application OAuth.
2. Dans la version de développement, activez le type **Panel**. Activez le support Mobile seulement si la console le propose pour cette version et votre test.
3. Dans **Asset Hosting**, renseignez :

   | Champ              | Valeur de départ                                               |
   | ------------------ | -------------------------------------------------------------- |
   | Testing Base URI   | `https://localhost:8443/`                                      |
   | Panel Viewer Path  | `panel.html`                                                   |
   | Config Path        | `config.html`                                                  |
   | Mobile Viewer Path | `mobile.html`, si support mobile activé                        |
   | Live Config Path   | Facultatif ; `live_config.html` si vous souhaitez ce raccourci |

4. Activez **Configuration Service**. L’association entre la chaîne et la partie est conservée dans son segment `broadcaster`, sans secret ni information de jeu privée.
5. Dans les options de sécurité/CSP de l’extension, si une liste d’accès externe est demandée, autorisez `https://localhost:8443` pour les connexions et images publiques. Le script Helper doit être celui de Twitch : `https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js`. Les scripts et polices de l’extension restent dans ses assets.
6. Restez en **Local Test**. Ajoutez votre compte diffuseur et les éventuels comptes spectateurs dans les comptes de test autorisés ; ne supposez pas qu’un autre compte peut la voir.
7. Utilisez le lien d’installation de test proposé par la console. Installez l’extension sur votre chaîne de test, puis activez-la dans un emplacement **Panel** depuis la gestion des extensions de la chaîne.
8. Ouvrez sa configuration Twitch et associez une partie existante avec la procédure suivante.

**Ne cliquez pas sur Review, Release ou Publish. Aucune stream key n’est nécessaire.** Le type Panel n’équivaut pas au type Video Overlay. Si votre version n’autorise que l’Overlay et impose un direct pour l’afficher, ajoutez le type Panel pour ce workflow ; n’improvisez pas un live public.

## Associer la vraie partie

1. Ouvrez l’URL **GM / préparation** imprimée dans le terminal.
2. Préparez Undercover avec vos contenus, puis ouvrez le salon. Vous pouvez aussi utiliser la démonstration du laboratoire pour un premier essai rapide, sans ses propres images préparées.
3. Dans la régie, ouvrez **Plateau** et copiez le **lien public** du plateau ou de la source OBS. Ne copiez jamais le lien privé GM ou joueur dans Twitch.
4. Ouvrez la page **Configurer** de l’extension depuis Twitch.
5. Dans **Serveur public HTTPS**, conservez `https://localhost:8443` pour le test sur le Mac.
6. Collez le lien public dans **Lien public du plateau** et touchez **Associer cette partie**.
7. Si le Helper renvoie immédiatement la nouvelle valeur, la page affiche **Partie associée au plateau Twitch**. Sinon elle indique que l’association a été transmise : fermez puis rouvrez la configuration. Les champs rechargés et le message **Partie associée au plateau Twitch** confirment alors la valeur conservée par Configuration Service.
8. Ouvrez votre chaîne avec le compte de test autorisé et trouvez le Panel. Il doit afficher la préparation de cette session. Si votre compte/version Twitch n’affiche pas le Panel hors ligne, constatez cette limite dans la checklist ; ne lancez pas de live par défaut. La prévisualisation de la console peut aider au diagnostic sans remplacer le test sur la chaîne.

L’association contient seulement l’identifiant public de la session et l’origine HTTPS du relais. Aucune capacité GM/joueur, affectation privée ou préparation future n’est envoyée à Twitch. Vous ne devenez pas joueur parce que vous regardez ce Panel.

Si vous créez un **nouveau salon**, associez son nouveau lien. Si vous rejouez ou avancez à la préparation suivante dans le **même salon**, l’association reste valable.

## Test quotidien

Après la première installation du certificat et de l’extension :

```bash
cd ~/extension-twitch-studio-4b
nvm use 24
npm ci
npm run twitch:local
```

Le bundle Twitch se reconstruit après modification des sources. Rechargez la vue de l’extension dans Twitch pour charger le nouveau JavaScript ; ce n’est pas une promesse de hot reload dans l’iframe Twitch. La régie Next.js conserve son fonctionnement de développement habituel.

## Scénario complet : Mac + iPhone

### Préparer les perspectives

- **iPhone GM** : ouvrez le lien privé GM obtenu depuis le laboratoire ou le salon. Utilisez l’adresse Wi-Fi du Mac, jamais `localhost` depuis l’iPhone.
- **Joueurs** : utilisez les liens individuels du laboratoire, ou rejoignez avec l’invitation dans des contextes séparés. Chaque joueur dispose de son propre accès.
- **Mac Twitch** : ouvrez la chaîne de test avec le Panel et l’association correcte.
- **Mac OBS/aperçu, facultatif** : vous pouvez garder l’aperçu existant ouvert pour comparer. Aucun OBS ni vrai flux vidéo n’est requis pour le Panel.

Pour observer une élimination **avant** une fin de jeu, utilisez cinq joueurs. À trois, le premier résultat décisif peut déjà terminer la partie. Les règles restent celles d’Undercover, pas des règles adaptées à Twitch.

| Étape | Action                                                                                         | Résultat attendu dans le Panel Twitch                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Ouvrir le salon et associer son lien public.                                                   | Préparation/attente, aucun mot distribué ni affectation privée.                                                                                |
| 2     | Faire rejoindre les joueurs, puis préparer depuis le salon.                                    | Effectif public actualisé ; la distribution reste à faire.                                                                                     |
| 3     | Depuis le GM, distribuer les mots et commencer.                                                | Discussion et joueur actif ; chaque joueur voit seulement son mot dans son propre compagnon.                                                   |
| 4     | Faire les deux tours d’indices oraux ; confirmer chaque passage GM.                            | Tour et joueur actif avancent. Le vote ne devient disponible qu’après tous les indices.                                                        |
| 5     | Facultatif : publier le duo anonyme depuis les commandes de diffusion.                         | Les deux contenus et images disponibles apparaissent temporairement ; aucune relation joueur→contenu.                                          |
| 6     | Facultatif : publier les affectations, après lecture et confirmation GM.                       | Les associations deviennent publiques volontairement, par groupes de trois. N’utilisez pas ce choix pendant un test de confidentialité du duo. |
| 7     | Ouvrir les votes.                                                                              | Compteur public des votes, sans choix individuels privés.                                                                                      |
| 8     | Voter depuis chaque compagnon.                                                                 | Progression des votes ; le serveur confirme les actions.                                                                                       |
| 9     | Révéler le résultat depuis le GM.                                                              | Égalité ou élimination ; si victoire/nul atteint, révélation finale autorisée et résultat.                                                     |
| 10    | Si aucune victoire : commencer le cycle suivant, refaire indices et vote.                      | Même paire ; les éliminés ne votent plus. Le bouton actuel s’appelle « Commencer un nouveau cycle ».                                           |
| 11    | Atteindre la victoire.                                                                         | Révélation temporaire puis résultat durable. Recharger ne rejoue pas l’ancienne animation.                                                     |
| 12    | Rejouer depuis la régie, confirmer.                                                            | Préparation remise à zéro, mêmes accès joueurs, pas de secrets réaffichés automatiquement.                                                     |
| 13    | Ou choisir la préparation suivante sur l’appareil qui conserve la série, après résultat final. | Même salon, attente de distribution de la nouvelle paire ; aucune révélation anticipée.                                                        |

Les images doivent être choisies dans la préparation depuis leur appareil d’origine. Une image absente/expirée produit un repli textuel ; elle ne doit pas casser la partie. Aucune image protégée n’est fournie par le dépôt ; utilisez vos propres fichiers autorisés.

### Scénarios d’erreur

- Collez volontairement un lien privé dans la configuration : il doit être refusé, sans sauvegarde du secret dans Twitch.
- Arrêtez puis redémarrez le serveur local : la vue doit récupérer l’état courant sans rejouer les révélations passées. Une image du relais temporaire peut nécessiter une reconnexion depuis la préparation ; le texte reste utilisable.
- Essayez de voter avant l’ouverture, de voter deux fois ou d’utiliser une commande GM comme joueur : les permissions ordinaires du moteur restent actives.

## Tester le Viewer Twitch sur mobile

Le GM et les joueurs sur iPhone n’ont pas besoin d’un certificat Twitch : ils utilisent déjà l’application LAN. **Le Viewer dans l’application Twitch mobile est un test séparé**, dépendant du support mobile et de l’accès Local Test réellement offerts à votre compte/version.

`localhost` sur l’iPhone désigne l’iPhone. Si Twitch autorise ce test local mobile :

1. Notez l’adresse Wi-Fi du Mac imprimée par le lanceur.
2. Créez `.env.twitch.local` à la racine, avec une seule ligne adaptée, par exemple `TWITCH_LOCAL_HOST=192.168.0.46`. Ne copiez pas cette adresse si votre Mac en a une autre.
3. Relancez `npm run twitch:cert`, puis `npm run twitch:local`. La Testing Base URI devient `https://ADRESSE_DU_MAC:8443/`.
4. Renseignez cette URI dans Twitch et la même origine dans l’association de la partie.
5. Installez et approuvez sur l’iPhone **le certificat public de l’autorité locale mkcert**, jamais sa clé privée. Son dossier est indiqué par `mkcert -CAROOT`; le certificat public est `rootCA.pem`. Transférez seulement ce certificat via un canal local maîtrisé. iOS peut demander l’installation du profil puis l’activation de confiance dans Réglages → Général → Informations → Réglages de confiance des certificats.
6. Vérifiez dans Safari que l’URI HTTPS s’ouvre sans avertissement, puis testez l’extension dans Twitch avec un compte autorisé.

Une réussite dans Safari ne prouve pas une réussite dans le WebView de l’application Twitch. Si Local Test mobile n’est pas proposé ou n’accepte pas cette connexion, cochez **non disponible**, gardez le GM/joueurs mobiles, et prévoyez Hosted Test mobile. Ne désactivez pas TLS et n’exposez pas le développement sur Internet pour contourner cette limitation.

## Hosted Test — assets hébergés et relais temporaire

Le dépôt prépare les assets statiques :

```bash
npm run twitch:package
```

L’archive `.data/twitch/hosted-test.zip` contient les fichiers à sa racine : `panel.html`, `mobile.html`, `config.html`, `live_config.html`, `video_overlay.html`, JavaScript, CSS et polices. Aucun serveur Next.js, secret, accès privé ou base SQLite n’est inclus. La commande ne téléverse rien.

Passage manuel futur :

1. Garder la version privée avec les seuls comptes de test autorisés.
2. Choisir une origine HTTPS de **test** accessible aux appareils concernés. Le backend et le relais ne sont pas hébergés par l’upload Twitch. Une adresse localhost ne permet pas à d’autres personnes d’atteindre votre Mac.
3. Pour utiliser le relais local avec les assets hébergés et sur le même Mac, définir `TWITCH_EXTENSION_CLIENT_ID=VOTRE_CLIENT_ID_EXTENSION` dans `.env.twitch.local`, puis relancer. Cet identifiant public permet uniquement l’origine CORS exacte `https://CLIENT_ID.ext-twitch.tv`. CORS n’est pas une authentification.
4. Déclarer l’origine du relais dans les accès externes CSP de la version Twitch, pour les connexions et images. Autoriser l’accès au réseau local si le navigateur le demande ; sa disponibilité dépend des politiques Twitch et du navigateur.
5. Téléverser l’archive dans la section Files/Assets de la version, puis choisir **Hosted Test**, jamais Review ou Release.
6. Configurer l’association avec l’origine de test réellement accessible et le lien public de la session ; installer/activer pour les comptes de test et reprendre la checklist.

Le frontend peut être hébergé chez Twitch sans que le relais et le jeu le soient. Pour
une recette ponctuelle, `npm run twitch:hosted` lance le serveur local et un Quick
Tunnel Cloudflare dans le même terminal. Ce tunnel public temporaire n’expose que la
passerelle en lecture seule et change d’URL après chaque redémarrage ; suivez le
[guide Hosted Test](TWITCH-HOSTED-WORKFLOW.md). Une exploitation durable exige une
origine HTTPS stable et une configuration distincte.

## Dépannage rapide

| Message ou symptôme             | Vérifier                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Certificat absent ou non adapté | `npm run twitch:cert` et adresse actuelle.                                                                       |
| Port occupé                     | Arrêter l’ancien serveur dans son terminal ; le lanceur ne tue aucun processus existant.                         |
| Helper indisponible             | Ouvrir depuis Twitch, pas directement comme une page autonome.                                                   |
| Pas d’autorisation Twitch       | Compte de test, installation, activation et état Local Test.                                                     |
| Partie non associée             | Configurer l’extension depuis Twitch, activer Configuration Service.                                             |
| Association seulement transmise | Fermer puis rouvrir la configuration ; les champs rechargés confirment la valeur conservée par Twitch.           |
| Plateau inaccessible            | Serveur local actif, certificat reconnu, origine correcte et session existante.                                  |
| Pas de Panel sur la chaîne      | Type Panel activé, emplacement actif et compte autorisé ; noter une éventuelle restriction Twitch hors ligne.    |
| Pas de grandes cartes           | Duo/affectations non publiés ou apparition temporaire terminée ; le centre dégagé est volontaire.                |
| Ancien habillage                | Session/layout version 1 conservé ; créer une préparation TV récente sans écraser une disposition personnalisée. |
| Pas d’image après redémarrage   | Relais temporaire expiré/perdu ; reconnecter les images depuis la préparation, sans perte des mots.              |

Voir aussi [la checklist](TWITCH-LOCAL-TEST-CHECKLIST.md) et [le bilan technique](TWITCH-LOCAL-TEST-DELIVERY.md).
