# Extension Twitch Studio

Une plateforme de jeux interactifs prêts à jouer pour les streamers : choisissez
un jeu officiel, configurez quelques paramètres, invitez vos joueurs et animez
la partie depuis votre téléphone. Régie mobile, interfaces privées et plateau
public synchronisés, identité **Broadcast Neon**.

**Jalon 6 — recentrage produit.** Undercover possède un cycle complet de
**démonstration** : deux tours d’indices par défaut, votes, égalités, éliminations,
victoire et rejeu. Enchères et Qui est l’espion sont en préparation, **non jouables**.
L’ancien Studio Créateur libre est retiré de l’expérience. Ses données et les
anciennes parties sont conservées. Les comptes et abonnements ne sont pas encore livrés.

## Lancer et tester

Prérequis : **Node.js 24.x et npm 11.x**, indiqués dans `.nvmrc` et `package.json`.
Dans le dossier du dépôt :

```sh
npm ci
npm run dev:lan
```

Ouvrez l’adresse privée affichée sur l’ordinateur et l’iPhone, connectés au même
Wi-Fi de confiance. Exemple uniquement : `http://192.168.0.46:3000` si cette adresse
est celle affichée chez vous. Gardez le terminal ouvert, `Ctrl+C` pour arrêter.
Aucun compte Twitch, secret, paiement ou service externe nécessaire.

**Parcours rapide :** Choisir un jeu → Undercover → configurer → Lancer une partie
de démonstration. Sur l’ordinateur, conservez le laboratoire et sélectionnez chaque
joueur. Copiez le lien privé GM pour l’iPhone ; ouvrez le plateau public séparément.
[Guide très simple iPhone + ordinateur](docs/TEST-PRODUCT-FOCUS.md), avec résultats attendus,
reconnexion, égalités, victoire, rejeu et vrais invités.

Pour rester sur l’ordinateur : `npm run dev` (interface 127.0.0.1:3000).
Dans le cloud, utilisez `npm ci --cache /workspace/.cache/npm` si le cache du compte
n’est pas accessible. Un cloud distant exige une adresse HTTPS protégée adaptée à
l’hébergement : aucune exposition Internet n’est créée par ce dépôt. Ne redirigez pas
le port du serveur de développement vers Internet.

| URL                                     | Usage                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `/`                                     | Accueil simple, reprise de la dernière partie GM accessible dans cet onglet   |
| `/play`                                 | Fiches des trois jeux officiels et statut réel de disponibilité               |
| `/play/undercover`                      | Mots, répartition, tours d’indices, limite de manches ; démo ou vrais invités |
| `/play/lab/<id>`                        | Laboratoire privé GM / joueurs démo / spectateur, accès iPhone                |
| `/sessions/<id>/gm`                     | Régie, avec lien privé GM requis                                              |
| `/join`, `/join/<code>`                 | Invitation sans compte                                                        |
| `/sessions/<id>/player/<participantId>` | Vue privée individuelle                                                       |
| `/sessions/<id>/stream`                 | Aperçu d’émission : scène fictive et véritable overlay                        |
| `/sessions/<id>/obs`                    | Source navigateur OBS transparente, même rendu public                         |
| `/sessions/<id>/public`                 | Plateau public synchronisé, navigateur ou source OBS 1920×1080                |

L’accueil ne promet pas un historique de compte. La reprise et les réglages locaux
sont propres à l’onglet ; les parties sont persistées en SQLite. Conservez les liens
privés de récupération pour un autre appareil. Les liens d’éditeur historiques
redirigent vers le catalogue ; les anciens liens de laboratoire restent redirigés
vers leur partie. Aucun ancien brouillon n’est effacé.

## Configuration technique

`npm run dev` compile les packages et surveille TypeScript, le serveur Node et Next.js.
Node écoute sur `127.0.0.1:4000`, le web relaie `/api/server/*` : le port Node reste privé.
`dev:lan` choisit une interface réseau privée et configure les liens d’invitation.
Les données `.data/sessions.sqlite` sont ignorées par Git. Ne modifiez pas les `dist`.

Variables facultatives dans `.env.example`. Exportez-les dans le shell : le serveur
Node ne charge pas automatiquement `.env`. `PUBLIC_ORIGIN` est l’origine accessible
aux invités, HTTP réservé au réseau local de confiance ou HTTPS distant. `PORT`,
`WEB_HOST`, `SERVER_PORT`, `SERVER_HOST`, `SERVER_ORIGIN`, `DATABASE_PATH` personnalisent
les processus. `SERVER_ORIGIN` sert à la compilation du relais Next : reconstruisez
si la destination change. `DEV_ALLOWED_ORIGINS` permet des hôtes supplémentaires
explicites de développement. Aucun secret de rôle dans ces variables.

```sh
SERVER_PORT=4010 SERVER_ORIGIN=http://127.0.0.1:4010 npm run dev
```

Version compilée : `npm run build`, puis `npm start`. Ne lancez pas simultanément
Next dev et build/start sur le même dossier `.next`.

## Vérifier

```sh
npm run check          # format, tests métier/API/persistance, TypeScript strict, compilation
npm run test:e2e       # produit, sessions réelles et maquettes historiques, trois formats
npm run test:games     # parties Undercover complètes, identités isolées et rejeu
npm run test:stream    # aperçu/OBS partagés, partie complète, transparence et reconnexion
npm run test:design    # confirmations, focus/clavier, erreurs, responsive et copie privée
npm run test:legacy    # ancien Studio : compatibilité locale explicitement activée
npm run test:lab       # anciens outils de développement et dialogues asynchrones
```

Installez Chromium avec `npx playwright install chromium` si nécessaire. Dans le cloud :
préfixez la commande navigateur par `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.
Les suites démarrent leurs processus et bases temporaires isolés ; ne lancez pas les
suites simultanément sur les mêmes ports. Le wrapper exécute les trois formats
successivement pour conserver les protections anti-abus. Cibler un format :
`npm run test:games -- --project=mobile`. Les tests legacy utilisent le développement,
pas une activation du Studio en production. Leurs assertions métier restent conservées.

## Architecture et limites

- `apps/web` : Next.js / React, catalogue, configuration, régie, joueurs et plateau.
- `apps/server` : API officielle, HTTP/SSE, permissions et transactions SQLite.
- `packages/contracts` : paramètres officiels stricts et contrats versionnés historiques.
- `packages/engine` : moteur autoritaire commun, reçus, projections et règles déclaratives.
- `packages/games/{undercover,auctions,spy}` : modules officiels, seul Undercover jouable.
- `tests` : moteur, API, confidentialité, persistance et Chromium multi-contextes.

Le lancement officiel ne dépend plus d’une bibliothèque de créations. Le serveur choisit
la définition et conserve un instantané des paramètres. Aucun JSON exécutable ne peut
être injecté par la nouvelle API ; l’ancien `game.configure` HTTP et `/studio/*` sont
fermés par défaut. Les sessions v1/v2/v3 restent exécutables.

Un seul processus Node et SQLite sont supportés. Toujours pas de compte vérifié,
récupération par e-mail, expiration automatique des capacités, paywall ou facturation.
Pas de PWA installable, extension Twitch officielle, minuteur, import de médias ou
overlay graphique éditable. Les assets restent des références validées non téléchargées.
Les maquettes `/demo`, `/player`, `/overlay` restent fictives, hors navigation principale.
`/design-system` est réservé au développement. `/lab` et les anciens éditeurs sont
réservés au mode de maintenance local explicite décrit dans [STAGE-6.md](docs/STAGE-6.md).

## Références

- [Produit actuel](docs/PRODUCT.md) et [instructions de développement](AGENTS.md).
- [Bilan et inventaire conservé/déprécié](docs/STAGE-6.md).
- [Architecture technique](docs/ARCHITECTURE.md) et [future identité, droits et exploitation SaaS](docs/SAAS-ARCHITECTURE.md).
- [Roadmap commerciale et critères mesurables](docs/ROADMAP-COMMERCIAL.md).
- [Règles officielles et hypothèses](docs/OFFICIAL-GAMES-RULES.md).
- [Design system Broadcast Neon](docs/DESIGN-SYSTEM.md).
- [Tests humains iPhone + ordinateur](docs/TEST-PRODUCT-FOCUS.md).

Premiers retours humains iPhone reçus sur l’ancien Studio et Undercover. Ils ont motivé
les refontes. Ce nouveau parcours reste à valider par l’utilisateur : tests techniques,
Chromium, iPhone physique/Safari, plaisir de jeu et OBS réel sont des validations distinctes.
Le jalon 6 prépare un produit commercialisable ; il ne constitue pas une autorisation
d’ouverture publique ou de facturation. Aucun fournisseur payant ajouté.

## Aperçu de l’émission et OBS

Depuis le laboratoire, ouvrez **Aperçu de l’émission** ou activez le comparatif sur
ordinateur. Le cadre fictif utilise les données publiques réelles et le même composant
que **Source OBS transparente**, en 1920×1080. Aucun flux Twitch ni paiement nécessaire.
Les spectateurs restent en lecture seule : aucune interaction native Twitch n’est livrée.
[Guide iPhone + PC + OBS](docs/TEST-STREAM-PREVIEW.md) ·
[Architecture et bilan](docs/STREAM-PREVIEW.md). OBS physique et Safari iOS restent
à valider par l’utilisateur ; les ouvertures tardives ne rejouent pas les effets passés.
