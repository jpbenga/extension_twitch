# Twitch Hosted Test, OBS, caméra et overlay

Ce guide sépare les surfaces qui apparaissent souvent comme un seul « live » dans
l’usage quotidien. Elles restent techniquement indépendantes :

| Surface              | Rôle                                                | Produit la caméra ? | Nécessite un direct Twitch ?                             |
| -------------------- | --------------------------------------------------- | ------------------- | -------------------------------------------------------- |
| Régie locale         | Préparer et piloter Undercover                      | Non                 | Non                                                      |
| Panneau Twitch       | Afficher le plateau sous la chaîne, dans Bio        | Non                 | Non                                                      |
| Overlay vidéo Twitch | Afficher le plateau au-dessus du lecteur Twitch     | Non                 | Oui, car il lui faut une vidéo sous laquelle s’afficher  |
| OBS                  | Composer webcam, micro, images et source navigateur | Oui                 | Seulement au moment de cliquer sur Démarrer le streaming |

L’extension Twitch ne peut pas allumer la webcam, capturer le micro ou démarrer un
direct. OBS produit la vidéo. La régie envoie les commandes au serveur ; le Panneau,
l’Overlay Twitch et la source OBS lisent tous la même projection publique.

## Parcours recommandé avant un vrai direct

1. Lancez la régie et ouvrez une vraie partie.
2. Dans OBS, créez une scène et ajoutez **Périphérique de capture vidéo** pour la
   webcam, puis la source audio voulue.
3. Ajoutez une **Source navigateur** au-dessus de la webcam. Collez le lien `/obs`
   fourni par l’onglet Plateau de la régie. Utilisez 1920 × 1080.
4. Bougez la partie depuis la régie. L’aperçu OBS doit montrer immédiatement la
   caméra et les changements publics du plateau, sans envoyer de live.
5. Quand cette composition est correcte, connectez OBS à Twitch et choisissez
   **Démarrer le streaming**. Cette action crée un véritable direct Twitch.

Cette composition OBS est visible dans l’enregistrement et la VOD. Pour tester à la
place l’Overlay vidéo natif de Twitch, activez **Overlay 1** dans le gestionnaire
d’extensions puis lancez un vrai direct depuis OBS. N’ajoutez pas simultanément le
même habillage dans OBS, sinon il apparaîtra deux fois. L’Overlay Twitch est ajouté
par le lecteur Twitch au-dessus de la vidéo ; il ne fait pas partie des pixels envoyés
par OBS.

## Une commande pour le serveur et le tunnel HTTPS

Après la première installation du certificat et de `cloudflared`, utilisez :

```bash
cd ~/extension-twitch-studio-4b
nvm use 24
npm run twitch:hosted
```

Cette commande lance `twitch:local` et un Quick Tunnel Cloudflare dans le même
terminal. Elle affiche clairement la nouvelle URL `https://…trycloudflare.com` et
l’enregistre dans `.data/twitch/current-tunnel-url.txt`. `Ctrl+C` arrête les deux.

Le tunnel utilise `--no-tls-verify` uniquement entre `cloudflared` et le certificat
de développement du Mac. L’adresse publique reste en HTTPS avec un certificat
Cloudflare valide. La passerelle exposée accepte seulement les fichiers statiques de
l’extension et les lectures publiques de session/média ; elle ne transmet ni cookie,
ni accès GM/joueur, ni commande de jeu.

### Mise à jour Twitch à chaque nouvelle URL temporaire

Un Quick Tunnel n’a pas d’adresse permanente. Après son redémarrage :

1. Ouvrez la nouvelle URL dans Chrome et vérifiez « Twitch Local Test ».
2. Dans Developer Console, repassez temporairement en **Test local**.
3. Dans **Capacités**, remplacez l’ancienne URL `trycloudflare.com` dans les domaines
   d’images, multimédias et de récupération d’URL. Enregistrez.
4. Repassez en **Test hébergé**. Aucun nouveau ZIP n’est nécessaire si le code n’a
   pas changé.
5. Dans la configuration de l’extension, remplacez **Serveur public HTTPS**, gardez
   le lien public de la partie et associez. Le message attendu est
   **Partie associée au plateau Twitch**.

Une URL stable exige un tunnel nommé et un nom de domaine géré dans un compte
Cloudflare. C’est la seule manière de supprimer la modification manuelle de la CSP à
chaque redémarrage. Le Quick Tunnel reste adapté à cette recette privée ponctuelle ;
il ne fournit aucune garantie de disponibilité et ne doit pas devenir un hébergement
de production.

## Choisir le test voulu

- **Valider le jeu et le rendu caméra + overlay sans être en direct** : utilisez
  l’aperçu OBS avec la source `/obs`. Twitch et Cloudflare ne sont pas nécessaires.
- **Valider le Panneau Twitch** : Hosted Test, tunnel actif et Panneau 1 suffisent ;
  la chaîne peut rester hors ligne.
- **Valider l’Overlay vidéo Twitch** : activez Overlay 1 et démarrez un véritable
  direct depuis OBS. La caméra vient d’OBS et les actions restent dans la régie locale.
