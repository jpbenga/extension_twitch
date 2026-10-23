# Extension Twitch

Socle d’une plateforme de jeux interactifs pour les émissions Twitch : régie Game Master, overlays OBS, interfaces joueurs et, à terme, extension spectateur.

**État : étapes 1 et 2 uniquement.** La démonstration est visuelle, avec six participants fictifs. Les trois jeux sont structurés mais ne sont pas encore jouables. Aucun compte Twitch, secret, paiement ou service payant n’est requis. Le moteur de sessions et l’adaptateur SQLite attendent la validation de l’étape 3.

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

Le processus de développement compile les packages partagés puis lance leur surveillance, le serveur Node.js et Next.js. `Ctrl+C` arrête l’ensemble. Les compilations partagées sont régénérées depuis les sources ; ne pas modifier les dossiers `dist`.

| Adresse locale                                    | Usage                                                  |
| ------------------------------------------------- | ------------------------------------------------------ |
| Port 3000, `/`                                    | Régie responsive : ordinateur, tablette et téléphone   |
| Port 3000, `/overlay?game=undercover`             | Overlay public 16:9 de démonstration                   |
| Port 3000, `/overlay?game=auctions&transparent=1` | Variante à fond transparent pour source navigateur OBS |
| Port 3000, `/overlay?game=spy`                    | Aperçu du troisième jeu                                |
| Port 3000, `/player`                              | Maquette mobile d’interface individuelle               |
| Port 4000, `/health`                              | Contrôle de disponibilité du serveur                   |
| Port 4000, `/events`                              | Sonde SSE de transport, sans état de jeu               |

Le serveur Node écoute par défaut sur `127.0.0.1:4000`. Next.js écoute sur `0.0.0.0:3000` et relaie `/api/server/*` vers le serveur : seul le port web doit être exposé par l’environnement cloud. Ne pas exposer cette maquette comme un service de production authentifié.

Les variables facultatives sont décrites dans `.env.example`. Aucune copie de fichier n’est nécessaire. Exporter les variables dans le shell avant le lancement ; le serveur Node ne charge pas automatiquement de fichier `.env`. Pour déplacer le serveur :

```sh
SERVER_PORT=4010 SERVER_ORIGIN=http://127.0.0.1:4010 npm run dev
```

`PORT` change le port web. `SERVER_HOST` change l’interface d’écoute du serveur. En mode compilé, `SERVER_ORIGIN` est pris en compte lors de `npm run build` : reconstruire si cette destination change.

Pour un accès de développement par un domaine cloud, exporter `DEV_ALLOWED_ORIGINS` avec le nom d’hôte fourni par l’environnement (sans protocole, port ni chemin). Plusieurs hôtes peuvent être séparés par des virgules. `localhost` et `127.0.0.1` sont déjà pris en charge ; aucun domaine externe n’est autorisé par défaut.

## Vérifier

```sh
npm test                # contrats et intégration HTTP/SSE sur ports éphémères
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

Playwright démarre et arrête les deux services compilés. Les parcours sont exécutés en formats téléphone, tablette et ordinateur, avec reconnexion au serveur et vérification des overlays. Pour lancer manuellement la version compilée : `npm run build`, puis `npm start`.

## Structure

```text
apps/
  web/                   Next.js / React, régie et aperçus publics
  server/                Node.js HTTP et sonde SSE, processus distinct
packages/
  contracts/             Schémas Zod et types partagés
  engine/                Interfaces serveur du futur moteur et de sa persistance
  games/
    undercover/          Descripteur ; règles à définir
    auctions/            Descripteur ; règles à définir
    spy/                 Descripteur ; règles à définir
tests/
  contracts.test.ts      Frontières des données et validation des entrées
  server.test.ts         Intégration HTTP/SSE et configuration
  e2e/                   Parcours navigateur multi-écrans
docs/
  PRODUCT.md             Cahier des charges fourni, version 0.1
  ARCHITECTURE.md         Décisions techniques et limites du socle
AGENTS.md                Instructions de développement fournies
```

## Limites actuelles

La sélection du jeu et du mode ne modifie qu’un aperçu local. Les différentes fenêtres ne partagent pas de session. La sonde SSE vérifie le transport et sa reconnexion, sans synchroniser de jeu. Aucun rôle secret n’est généré ou distribué.

Pas encore d’authentification, de stockage SQLite effectif, de commandes de partie, de vote, de budget, d’import d’images, de PWA installable ni d’extension Twitch officielle. Les interfaces de persistance et d’intégration Bits constituent des contrats préparatoires ; elles ne vérifient et n’exécutent aucune transaction.

Avant toute évolution, lire [le produit](docs/PRODUCT.md), [les consignes](AGENTS.md) et [les décisions d’architecture](docs/ARCHITECTURE.md). L’étape 3 nécessite une nouvelle validation.
