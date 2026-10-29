# Undercover — séries préparées et broadcast TV

Cette extension applique les 28 références humaines approuvées, importées au commit
`738fb44`. Le registre complet est
[ALL-APPROVAL.json](ux/redesign/undercover-next/ALL-APPROVAL.json).
Les mentions historiques « proposition » ne remettent pas cette approbation en cause.
Les références sont conservées intactes ; les captures de l’application sont dans
`docs/ux/implementation/`, séparément.

## Préparations sur l’appareil

`/play/undercover` est désormais le conducteur de préparation Undercover :

- préparer les réglages, ajouter à une série nommée, ordonner puis vérifier ;
- modifier les deux noms et les deux images séparément ; nommer une partie ;
- dupliquer, réutiliser une ancienne paire comme copie indépendante, retirer avec
  annulation, déplacer avec les boutons Monter/Descendre ou par glisser-déposer ;
- conserver plusieurs séries et reprendre après fermeture de la page.

IndexedDB conserve un document versionné et les images PNG dans deux magasins.
Chaque sauvegarde compare la révision dans une transaction : un autre onglet ne peut
pas être écrasé silencieusement. Les changements refusés restent affichés et peuvent
être conservés dans une autre série. Les références de blobs sont immuables : retirer
ou remplacer une image d’une copie ne modifie pas l’original. Les images sans référence
ne sont pas encore collectées automatiquement sur l’appareil. Effacer les données du
site les efface ; aucun compte ni sauvegarde cloud ne les récupère.

Plafonds : 50 séries, 100 préparations par série, 500 entrées de réutilisation.
Les réglages existants d’onglet sont repris lorsqu’une première bibliothèque est
ouverte. Les anciennes parties, créations archivées, thèmes et layouts ne sont pas
convertis ou effacés.

Les noms libres restent libres. Aucune image de personnage protégée ni photo du studio
Stitch n’est livrée avec le produit. Les preuves automatisées utilisent des images neutres.

## Un salon, une partie active

L’effectif prévu (3–12) n’impose pas la capacité du salon. Ouvrir le salon ne crée
aucun joueur fictif et ne distribue aucun mot. Préparer l’effectif puis distribuer
restent deux commandes GM distinctes. Le laboratoire reste un parcours séparé.

La requête de création conserve son jeton propriétaire, son identifiant et son
instantané avant le réseau. Une réponse incertaine reprend exactement la même
requête ; les modifications ultérieures doivent d’abord être restaurées explicitement.
Le serveur interdit un second salon pour le même propriétaire et la même série.

La table SQLite additive `undercover_series` (schéma 3) conserve cette association.
Le document de partie contient uniquement la référence et les contenus de la
préparation actuelle. Le conducteur et les paires futures restent sur l’appareil.

Après un véritable résultat moteur :

- **Partie suivante** demande confirmation, installe la prochaine préparation dans
  le même salon, conserve les accès et attend une nouvelle distribution GM ;
- **Rejouer** réinitialise uniquement la préparation actuelle et n’avance pas la série ;
- **Retour à la série** conserve le conducteur et le salon ;
- **Réinitialiser le salon** conserve son ancien sens, retire les joueurs et révoque
  leurs accès. Cette opération n’est jamais un raccourci pour Partie suivante.

Le GM peut piloter les phases et rejouer depuis l’iPhone. La sélection de la
préparation suivante exige l’appareil qui possède la série. La série complète n’est
pas synchronisée entre appareils. La régie distante l’explique ; elle n’affiche pas
un faux bouton de continuation. Une modification locale de la préparation active ne
change pas l’instantané déjà lancé. L’ordre modifié s’applique aux choix suivants.
Les paramètres, thème public et layout de la préparation suivante sont validés puis
appliqués par la commande serveur ; aucun changement de règles Undercover n’est introduit.

## Médias temporaires pendant la partie

La seule règle visible en préparation est :

> Préparez et lancez cette série depuis le même appareil pour conserver vos images.

Le navigateur décode les fichiers PNG/JPEG/WebP choisis, réduit leur taille à 1600 px
maximum et réencode en PNG (2 Mio maximum). Les textes sont indépendants des images.
Le serveur vérifie signature, dimensions, structure, CRC et décompression bornée.
Il ne télécharge aucune URL distante et n’accepte ni SVG ni HTML.

Le relais est exclusivement en mémoire : 1 heure après chaque dépôt, balayage toutes
les 30 secondes, 64 Mio et 128 images au maximum. Rien de binaire n’est écrit sur disque
ou dans SQLite. Passage à la partie suivante, réinitialisation et arrêt nettoient les
images. Une lecture ne prolonge pas l’expiration. L’appareil de préparation peut les
redéposer à l’ouverture, au retour en ligne, à la reprise de focus et périodiquement
lorsque sa régie est ouverte. Si cet appareil est fermé ou indisponible, le texte suffit.

Routes `/sessions/:id/media/:contentId` derrière le relais web `/api/server` :

- POST : capacité GM, contenu de la préparation actuelle, PNG borné ;
- DELETE : capacité GM et même contrôle, retrait du relais uniquement ;
- GET : GM, joueur autorisé à son propre contenu après distribution, ou contenu
  effectivement publié par le serveur. Chaque lecture est autorisée à nouveau.

Les réponses sont `private, no-store`, avec MIME PNG, sans credential dans les URL.
Les médias expirés disparaissent des projections et reviennent au redépôt. Après un
redémarrage serveur, les textes et identités restent persistants ; les images demandent
un redépôt depuis l’appareil. Un contenu déjà vu ou copié par son destinataire ne peut
évidemment pas être rappelé à distance.

## Projections publiques et source OBS

`undercoverBroadcast` est une union stricte, construite indépendamment côté serveur :

| Mode        | Données publiques                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| none        | Aucun contenu, aucune affectation                                                                            |
| duo         | Deux contenus courants, identifiants opaques, ordre sans indication de camp ; aucune relation joueur→contenu |
| assignments | Même paire et associations après confirmation explicite du GM                                                |
| final       | Associations et rôles uniquement après le résultat final autorisé par le moteur                              |

Les votes individuels ne sont jamais ajoutés au rendu public. La progression indique
uniquement la participation. La prochaine paire n’est pas publiée par une transition.
Les tests inspectent les payloads HTTP et SSE, pas seulement les éléments cachés du DOM.
Le joueur reçoit `personalContent` uniquement pour son propre mot.

Le rendu partagé `BroadcastOverlay` utilise `UndercoverTvOverlay` pour les layouts
**version 2**. Les anciens layouts version 1 et leurs coordonnées gardent leur renderer.
Les nouvelles préparations choisissent les presets TV : sept blocs, quatre dispositions,
déplacement/redimensionnement et thèmes publics séparés des préférences privées.

Le centre reste transparent ; les contenus sont des apparitions basses. Les associations
s’affichent par groupes de trois avec numéros stables et pagination GM. Le focus oral
reste lisible avec douze participants et des noms longs. Les animations sont discrètes,
respectent le mouvement réduit et ne rejouent pas l’historique après reconnexion ou
ouverture tardive. Le résultat durable subsiste en format compact.

L’aperçu, le comparatif et OBS utilisent le même composant et des projections publiques.
OBS n’embarque ni décor, ni damier, ni commandes. Les captures RGBA sont des preuves
Chromium ; elles ne constituent pas un nouvel essai physique OBS ou Safari iPhone.
