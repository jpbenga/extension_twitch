# Correctif de l’ouverture du salon depuis localhost

Retour humain du 29 octobre 2026 sur la version QA `be64820` : serveur Ready, mais « L’adresse réseau ne correspond pas à PUBLIC_ORIGIN » à l’ouverture du salon.

## Cause vérifiée

`dev:lan` proposait localhost et l’IP privée dans son bandeau et faisait écouter le web sur toutes les interfaces. L’API gardait cependant une seule origine autorisée pour les mutations, l’IP LAN. Un navigateur sur localhost envoyait donc un vrai header Origin différent et recevait `ORIGIN_DENIED` avant la création de session. Le même problème pouvait toucher les commandes et l’envoi d’images, pas seulement le premier salon.

Les contrôles précédents avaient vérifié les pages localhost en GET et créé la session depuis le client Node sans header Origin. Ils ne couvraient pas ce POST provenant d’un navigateur localhost. Le nouveau probe réalise le parcours UI réel, avec ce header et des images.

La capture utilisateur ne montre pas la barre d’adresse : elle ne permet pas d’affirmer quelle URL était ouverte. `0.0.0.0`, un autre port ou une autre adresse LAN sont également refusés par la politique. Le correctif couvre le cas localhost reproduit ; le guide précise les adresses à utiliser.

## Correction ciblée

- `dev:lan` et `twitch:local` optent explicitement pour les alias navigateur locaux.
- Seuls `http://localhost:<port web>` et `http://127.0.0.1:<port web>` sont ajoutés à l’origine LAN canonique.
- Activation uniquement hors production, avec API écoutant sur loopback et origine HTTP locale/privée. Sans cette activation, ou en production même si le drapeau est présent, l’origine canonique reste la seule autorisée.
- Les origines étrangères, ports différents, `null`, HTTPS différent et domaines ressemblant à localhost restent refusés. Aucun CORS permissif ou réécriture du header Origin.
- Les capacités GM/joueurs restent obligatoires ; aucune modification des règles, données, reçus, projections ou permissions de jeu.
- Les liens d’invitation et publics conservent l’IP LAN ; ils restent utilisables sur iPhone. Le message d’erreur indique désormais une action compréhensible.
- Aucun transfert ou effacement du stockage navigateur : les préparations et images existantes restent sur leur origine initiale.

## Validation

`npm run check` réussi : **241 tests unitaires/intégration, 29 fichiers**, format, TypeScript strict, builds serveur/web/packages/Twitch. Les 12 nouveaux tests couvrent les alias exacts, le refus par défaut, la production, les autres ports/domaines/protocoles, les vrais POST et le maintien des contrôles d’accès. Les 225 parcours Chromium de la livraison précédente restent un résultat de `be64820`, pas une nouvelle exécution de cette correction.

Probe réel réussi avec `dev:lan`, navigateur Chromium à 390 px et `twitch:local` : ouverture du salon depuis localhost avec image, contenus conservés, liens LAN, commandes refusées hors accès, SSE LAN, médias autorisés, redémarrage SQLite, mutation localhost après le lancement Twitch, HTTPS public et fermeture des ports. Les preuves sont dans [runtime-verification.json](screenshots/local-qa/runtime-verification.json).

Le probe de lancement conserve les contrôles LAN/SSE/HTTPS et ajoute : parcours UI localhost → noms et image → vérification → salon vide, accès GM valide, invitation LAN, image autorisée puis retour à l’édition sans perte. Il vérifie aussi une mutation localhost après lancement par `twitch:local`.

Pas d’essai physique Mac/iPhone ou OBS dans le Cloud. Le proxy du navigateur Cloud continue de refuser son IP privée ; les échanges LAN restent vérifiés par le client interne, sans contournement du proxy.
