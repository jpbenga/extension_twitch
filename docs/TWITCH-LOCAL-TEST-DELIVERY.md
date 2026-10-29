# Livraison — fondation Twitch Local Test

Base : `d274589`, branche applicative complète `feat/undercover-stream-series-tv`. Travail isolé sur `feat/twitch-local-test`. Les documents/captures non committés de l’audit précédent sont restés dans leur worktree, intacts.

## Diagnostic initial vérifié

Recherche dans les applications, contrats, scripts, tests et documentation, avant modification :

```text
TWITCH_NATIVE_EXTENSION: MISSING
TWITCH_LOCAL_TEST: MISSING
TWITCH_HOSTED_TEST: MISSING
TWITCH_AUTH: MISSING
TWITCH_EBS: MISSING
TWITCH_VIEWER_SURFACE: MISSING
```

Il existait des contrats préparatoires et une mention de futurs événements Twitch/Bits ; aucun adaptateur actif, Helper, JWT, OAuth, Viewer/Config, script HTTPS ni configuration Developer Console. Le renderer Broadcast, OBS, l’aperçu, le laboratoire et les sessions Undercover existaient réellement. Ils ne constituaient pas une extension native.

## Architecture ajoutée

```text
Twitch Local Test (iframe Panel / Mobile / Overlay)
  ├── Extension Helper officiel : onAuthorized + Configuration Service
  ├── pointeur public broadcaster : {version, sessionId, apiOrigin}
  └── BroadcastFeed → BroadcastOverlay → UndercoverTvOverlay
        │ HTTPS GET public HTTP/SSE/images, sans jeton GM/joueur
        ▼
     Passerelle locale HTTPS à liste de routes fermée
        │ boucle locale HTTP, aucun Cookie/Authorization transféré
        ▼
     API existante → SessionService → projections publiques du moteur

GM / joueurs : application LAN existante, commandes et identités inchangées
```

Le nouveau transport public partagé ne lit pas le stockage des accès privés et rejette les projections non publiques. Il reprend reconnexion, bornes de taille, watchdog et remise à zéro des effets transitoires à chaque connexion. Le renderer demeure unique ; la résolution d’images publiques accepte une origine HTTPS distincte pour les assets hébergés sur Twitch.

### Authentification et frontière d’autorité

Le Viewer attend `Twitch.ext.onAuthorized` ; la configuration est écrite par `Twitch.ext.configuration.set` dans le segment du diffuseur. La validation des droits d’écriture de cette configuration appartient au service Twitch. Le code ne présente pas la présence du Helper comme une vérification JWT de notre serveur.

**Aucun EBS privilégié, échange OAuth, secret d’extension ou vérification JWT propre n’a été ajouté**, car cette version n’effectue aucune commande de jeu depuis Twitch et n’expose que les projections déjà publiques. La passerelle est un adaptateur public, pas un mécanisme d’authentification. L’origine CORS exacte limite les lecteurs navigateur autorisés pour Hosted Test ; elle ne constitue pas une autorisation serveur.

Si des votes Twitch, droits de joueur, contrôle GM, PubSub signé ou Bits sont demandés plus tard, ils nécessiteront une frontière EBS authentifiée et une vérification serveur appropriée. Aucun de ces comportements n’est simulé ici.

## Fichiers et scripts

- `apps/twitch/` : workspace statique React, Viewer commun Panel/Mobile/Video Overlay, Config/Live Config, contrat strict du pointeur et états d’indisponibilité.
- `scripts/twitch-build.mjs` : bundle esbuild local, CSS, polices relatives et cinq entrées HTML sans scripts intégrés.
- `scripts/twitch-gateway.ts` : HTTPS, statiques explicitement autorisés et lecture HTTP/SSE/médias publics seulement ; aucune route privée ou mutation.
- `scripts/twitch-cert.mjs` : mkcert et fichiers locaux ignorés, clé de développement en mode 0600.
- `scripts/twitch-local.mjs` : vérifie certificat/adresse/ports, démarre passerelle, bundle surveillé et application LAN ; arrêt des seuls processus lancés.
- `scripts/twitch-package.mjs` : archive statique Hosted Test sans upload ni changement de statut Twitch.
- `apps/web/src/components/broadcast-feed.tsx`, `undercover-tv-overlay.tsx` et deux helpers publics : réutilisation transport/rendu et préfixe des images autorisées, sans modification de gameplay.
- `.env.example` : hôte/port locaux et Client ID public facultatif pour CORS Hosted Test. Aucun secret Twitch nécessaire.

Commandes : `twitch:cert`, `twitch:local`, `twitch:build`, `twitch:package`, `test:twitch`.

Seule nouvelle dépendance directe de construction : **esbuild**, déjà présent transitivement à la même version. Aucune bibliothèque UI, aucun service payant, aucun flux Twitch émis. Les sorties `dist/`, `.data/` et `.env.twitch.local` sont ignorées par Git.

## États disponibles et limites

- Attente, discussion, joueur actif, deux tours, vote, résolution, égalité/élimination, révélation, victoire/nul, préparation suivante et rejeu viennent du moteur existant.
- Images locales et relais temporaire existants ; pas de galerie d’images protégées ni d’hébergement permanent nouveau.
- Duo anonyme : aucun mapping d’affectations dans les projections publiques HTTP/SSE. Publication d’affectations volontaire du GM conservée.
- Aucun spectateur Twitch transformé automatiquement en joueur et aucune interaction Twitch fictive.
- Aucun nouveau modèle Partie/Manches, pause/abandon ou changement du vocabulaire de l’audit précédent : ce travail ne corrige pas ces écarts UX.
- Les layouts v1 et les personnalisations demeurent compatibles. Le nouveau Viewer montre le layout réel, pas un preset forcé.

## Local Test et Hosted Test

Le type **Panel** est le point de départ sans live ; il observe le vrai renderer mais ne mesure pas sa superposition au lecteur vidéo. Le point d’entrée `video_overlay.html` existe pour un test vidéo distinct qui peut demander un direct. Rien ne lance un stream ou un upload.

`mobile.html` est construit, mais un test Chromium mobile n’établit pas que Twitch permet Local Test mobile sur le compte/appareil. La Testing Base URI localhost ne fonctionne que sur le Mac ; le chemin LAN HTTPS nécessite une confiance de certificat sur l’appareil cible. Hosted Test sur des appareils distants requiert un backend de test HTTPS accessible, non hébergé par le ZIP Twitch.

## Sources et limites documentaires

Le site `dev.twitch.tv` a répondu à un refus d’accès réseau depuis ce runtime. Les exemples officiels Twitch ont été consultés dans Git :

- [extensions-boilerplate](https://github.com/twitchdev/extensions-boilerplate), commit `0fb19bedb1bdb24e20d0812a19b06aa84624b988`, sections Local Development et Hosted Test.
- [extensions-hello-world](https://github.com/twitchdev/extensions-hello-world), commit `78bc797cec554f777155622929d684e115ddf1e8`, entrées HTML et inclusion officielle du Helper.
- Signature Configuration Service recoupée avec les [types communautaires twitch-ext](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/twitch-ext/index.d.ts).

Ces exemples sont historiques : leurs recommandations Developer Rig et certificats auto-signés non approuvés ne sont pas reprises. Le guide donne les champs à remplir, mais leurs intitulés et la disponibilité hors ligne/mobile doivent être confirmés dans la console actuelle. Aucun écran de console authentifiée n’a été visité.

Liens documentaires à consulter depuis le Mac : [cycle de vie](https://dev.twitch.tv/docs/extensions/life-cycle/), [Helper](https://dev.twitch.tv/docs/extensions/reference/), [hébergement](https://dev.twitch.tv/docs/extensions/hosting/).

## Validation

Les résultats effectivement exécutés sont consignés à la fin de cette livraison après les vérifications. Ne pas assimiler les fixtures du Helper à une authentification Twitch réelle.

- `AUTOMATED_VERIFIED` : voir résultats ci-dessous.
- `LOCAL_RUNTIME_VERIFIED` : HTTPS et démarrage dans le Cloud ; confiance mkcert Mac à vérifier par l’utilisateur.
- `TWITCH_CONSOLE_REQUIRED` : création/sélection, types, Local Test, Configuration Service, comptes, activation et association.
- `HUMAN_TWITCH_TEST_REQUIRED` : visibilité sur la chaîne, CSP Twitch réelle, persistance de configuration chez Twitch, desktop/mobile et confort visuel.

Guides : [Twitch Local Test](TWITCH-LOCAL-TEST.md), [checklist](TWITCH-LOCAL-TEST-CHECKLIST.md). Aucun nouveau test OBS physique ou iPhone physique revendiqué. Aucune fusion, Review, Release, publication ou mise en production.

## Résultats exécutés — 29 octobre 2026

| Contrôle                                             | Résultat                                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` avec le lock final                          | Réussi.                                                                                                                             |
| `npm run check`                                      | Réussi : format, **222 tests sur 27 fichiers**, TypeScript strict, build packages/serveur/Next/Twitch.                              |
| `npm run test:twitch`                                | **9/9** : 3 scénarios sur desktop, mobile 390 px et tablette.                                                                       |
| `npm run test:stream`                                | **9/9**, trois formats : aperçu/OBS, projection, événements et reconnexion.                                                         |
| Suite TV, desktop                                    | **4/4** : états, images, transparence, noms longs, pagination et anciens layouts.                                                   |
| Suite séries, mobile                                 | **6/6** : persistance, indépendance, erreurs, conflits et progression réelle.                                                       |
| Suite layout, mobile                                 | **2/2** : réglages, interactions tactiles et autorisations.                                                                         |
| `npm run twitch:package`                             | Réussi ; 12 fichiers explicitement autorisés à la racine de l’archive et dans `home/`. Aucun secret ou serveur. Aucun upload.       |
| Lanceur sans mkcert / sans certificat                | Refus explicite avec instructions, aucun démarrage incomplet.                                                                       |
| Lanceur sur port occupé                              | Refus explicite, aucun processus existant arrêté.                                                                                   |
| `npm run twitch:local`, ports de test 3100/4100/8443 | Application LAN et passerelle démarrées ; page HTTPS 200 avec certificat vérifié, API santé correcte, TypeScript watch sans erreur. |
| Arrêt du lanceur                                     | Ports libérés, arrêt des seuls sous-processus lancés.                                                                               |

Total navigateur ciblé : **30 parcours réussis**. Les neuf parcours natifs utilisent le vrai bundle de l’extension, le vrai HTTPS, le vrai moteur, des joueurs isolés et les vraies images publiques, mais un **Helper contrôlé dans les seuls tests**. Aucune de ces réussites ne constitue une session Twitch authentifiée.

Le contrôle HTTPS Node utilise un certificat éphémère de test approuvé explicitement par le client. Les contextes Playwright acceptent seulement leur certificat de fixture non installé sur l’OS ; aucune variable globale de désactivation TLS n’a été ajoutée. La création/confiance mkcert sur macOS n’a pas été exécutée depuis le Cloud.

Les tests natifs couvrent aussi le repli sans Helper, l’attente sans association, le refus d’un lien privé, la confirmation de configuration, les images anonymes, les deux tours, les votes, une élimination avant la victoire, l’ouverture tardive sans animation historique, la préparation suivante et le rejeu. Les modifications automatiques de configuration Twitch sont simulées à la frontière du Helper uniquement, jamais sur le compte utilisateur.

Captures réelles du bundle : [inventaire des captures](screenshots/twitch-local/README.md). Elles portent `automated-helper-fixture` dans leur nom et ne montrent pas la page Twitch authentifiée. Les captures APPROVED existantes n’ont pas été modifiées.

La suite complète des anciens parcours navigateur n’a pas été relancée ; les 30 parcours ci-dessus ciblent les surfaces affectées. Les 222 tests unitaires/intégration, eux, ont tous été exécutés. Aucun changement de règles, de contrats du moteur ou de schéma SQLite.

**TWITCH_LOCAL_TEST_READY_FOR_HUMAN_VALIDATION** — les actions de Developer Console et le vrai test de chaîne restent requis.
