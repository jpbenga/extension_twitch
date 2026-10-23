# Extension Twitch

Socle d’une plateforme de jeux interactifs pour les émissions Twitch : régie Game Master, overlays OBS, interfaces joueurs et, à terme, extension spectateur.

**État : étape 3, jalon A.** Sessions réelles persistées dans SQLite, accès privés GM/joueurs et plateau public synchronisé. Les trois jeux sont structurés mais ne sont pas encore jouables. Aucun compte Twitch, paiement ou service payant n’est requis. Le laboratoire, les règles Undercover et les jalons B/C/D attendent une nouvelle validation.

## Démarrer

Prérequis : **Node.js 24.x et npm 11.x** (voir `.nvmrc` et `package.json`). Depuis la racine du dépôt :

```sh
npm ci
npm run dev
```

Dans le cloud, si le cache npm du compte n’est pas accessible :

```sh
npm ci --cache /workspace/.cache/npm
npm run dev
```

Le processus de développement compile les packages partagés puis lance leur surveillance, le serveur Node.js et Next.js. `Ctrl+C` arrête l’ensemble. Les données sont conservées dans `.data/sessions.sqlite`, jamais dans Git. Les compilations partagées sont régénérées depuis les sources ; ne pas modifier les dossiers `dist`.

**Pour tester depuis un iPhone sur le même Wi-Fi que l’ordinateur :**

```sh
npm run dev:lan
```

Ouvrir l’adresse privée affichée par cette commande. Elle configure les invitations avec l’adresse réseau réelle. Voir [le guide iPhone et ses checklists](docs/TEST-IPHONE.md) pour les vues GM, joueur, spectateur et la récupération après incident. Le cloud distant nécessite un point d’entrée HTTPS protégé fourni par l’hébergement ; aucune exposition Internet n’est créée ici.

| Adresse locale                                 | Usage                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Port 3000, `/`                                 | Création d’une session ou saisie d’une invitation                                                             |
| `/sessions/<id>/gm`                            | Régie réelle, accès privé requis                                                                              |
| `/join/<code>`                                 | Inscription sans compte, avec nom individuel                                                                  |
| `/sessions/<id>/player/<participantId>`        | Compagnon individuel, accès privé requis                                                                      |
| `/sessions/<id>/public`                        | Plateau synchronisé, pour OBS ou un navigateur                                                                |
| `/demo`, `/player`, `/overlay?game=undercover` | Anciennes maquettes fictives ; `auctions`, `spy` et `transparent=1` restent disponibles pour l’overlay fictif |
| Port 4000, `/health`                           | Contrôle de disponibilité du serveur                                                                          |
| Port 4000, `/events`                           | Sonde SSE de transport, sans état de jeu                                                                      |

Le serveur Node écoute par défaut sur `127.0.0.1:4000` et Next.js sur `127.0.0.1:3000`. Le web relaie `/api/server/*` vers le serveur : le port Node doit rester privé. `dev:lan` ouvre uniquement l’interface privée choisie pour le web. Ne pas exposer le serveur de développement directement sur Internet.

Les variables facultatives sont décrites dans `.env.example`. Aucune copie de fichier n’est nécessaire. Exporter les variables dans le shell avant le lancement ; le serveur Node ne charge pas automatiquement de fichier `.env`. Pour déplacer le serveur :

```sh
SERVER_PORT=4010 SERVER_ORIGIN=http://127.0.0.1:4010 npm run dev
```

`PORT` change le port web et `PUBLIC_ORIGIN` doit alors correspondre à son origine accessible. `SERVER_HOST` change l’interface d’écoute du serveur, `WEB_HOST` celle du web. `DATABASE_PATH` change le fichier SQLite (par défaut `.data/sessions.sqlite` à la racine du dépôt). Les origines HTTP publiques non locales sont refusées ; utiliser HTTPS pour un hébergement distant. En mode compilé, `SERVER_ORIGIN` est pris en compte lors de `npm run build` : reconstruire si cette destination change.

`PUBLIC_ORIGIN` fournit aussi à Next.js son hôte autorisé en développement. Pour des hôtes supplémentaires, exporter `DEV_ALLOWED_ORIGINS` sans protocole, port ni chemin, séparés par des virgules. Aucun domaine Internet n’est autorisé par défaut. Aucun secret de rôle ne doit être ajouté à ces variables.

## Vérifier

```sh
npm test                # contrats, moteur, HTTP/SSE, concurrence et redémarrage réel
npm run typecheck       # packages, serveur, application, tests et configurations TS
npm run build           # packages, serveur et application optimisée
npm run format:check    # conventions de formatage
```

Tests navigateur (la compilation doit déjà être effectuée, ports 3000 et 4000 libres) :

```sh
npx playwright install chromium
npm run test:e2e
```

Dans cet environnement cloud, Chromium est déjà installé :

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright démarre et arrête les deux services compilés avec une base temporaire distincte de vos sessions. Les parcours utilisent un GM, plusieurs identités et un spectateur sur des formats téléphone, tablette et ordinateur, ainsi que les anciennes maquettes. Ils ne remplacent pas un test Safari iOS sur appareil réel. Pour lancer manuellement la version compilée : `npm run build`, puis `npm start`.

## Structure

```text
apps/
  web/                   Next.js / React, trois interfaces et anciennes maquettes
  server/                API HTTP/SSE, identification, transactions SQLite
packages/
  contracts/             Schémas Zod et types partagés
  engine/                Moteur de salon indépendant et contrats des futurs jeux
  games/
    undercover/          Descripteur ; règles à définir
    auctions/            Descripteur ; règles à définir
    spy/                 Descripteur ; règles à définir
tests/
  contracts.test.ts      Frontières des données et validation des entrées
  server.test.ts         Intégration HTTP/SSE et configuration
  sessions.test.ts       Accès, commandes, projections, concurrence et SSE
  persistence.test.ts    Arrêt et redémarrage d’un vrai processus serveur
  e2e/                   Parcours multi-identités sur trois tailles d’écran
scripts/
  dev-lan.mjs            Lancement Wi-Fi avec origine réseau appropriée
docs/
  PRODUCT.md             Cahier des charges fourni, version 0.1
  ARCHITECTURE.md         Décisions techniques et limites du socle
  STAGE-3.md              Plan A/B/C/D et hypothèses Undercover non validées
  TEST-IPHONE.md          Lancement et checklists de validation humaine
AGENTS.md                Instructions de développement fournies
```

## Limites actuelles

Le salon réel permet d’inscrire jusqu’à 32 joueurs (limite technique, pas une règle Undercover), changer leur état prêt, observer leur présence, renommer la session, fermer/rouvrir les invitations, retirer un joueur ou réinitialiser le salon. Les liens privés de récupération doivent être conservés : sans compte, il n’existe pas encore de récupération par e-mail. Les jetons n’expirent pas automatiquement à ce jalon ; un retrait ou une réinitialisation révoque ceux des joueurs. L’accès GM se conserve tant que la base existe.

Un seul processus Node est supporté pour la diffusion. Les reconnexions récupèrent un instantané récent, sans rejouer des commandes. Aucun rôle secret, mot, vote, budget, minuteur ou victoire n’est implémenté. Pas encore de comptes, laboratoire connecté, import d’images, PWA installable ou extension Twitch officielle. Les contrats Bits ne vérifient et n’exécutent aucune transaction. Les anciennes maquettes restent locales et fictives.

Avant toute évolution, lire [le produit](docs/PRODUCT.md), [les consignes](AGENTS.md), [l’architecture](docs/ARCHITECTURE.md) et [le plan de l’étape 3](docs/STAGE-3.md). Les jalons B, C et D nécessitent une nouvelle validation après essai humain de A.
