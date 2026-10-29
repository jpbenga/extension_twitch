> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Undercover TV — propositions Motion

**UNDERCOVER_MOTION_STATUS: AWAITING_APPROVAL**

Projet Stitch : `14258025772148928156`. Aucune intégration applicative, aucun changement de moteur ou de backend. Les scènes sont des fixtures de démonstration. Le renderer TV léger acquis reste la base : capsules, polices, couleurs, formes et rectangles du preset TV équilibré v2 au commit `d27458974b4c763e2911952b5295b4b0deae893d`. Les deux images proviennent des références déjà approuvées et restent uniquement dans ce dossier de maquettes.

## Langage retenu

Le mouvement sert l’indication d’état, le retour perceptible et la continuité entre informations. Les changements fréquents sont limités à 140–180 ms ; les rares moments TV peuvent entrer en 240 ms. **Durée d’animation et durée de maintien sont distinctes**. Aucun mouvement décoratif perpétuel.

Tokens existants réutilisés : `--duration-fast: 140ms`, `--duration-enter: 180ms`, `--ease-ui: cubic-bezier(0.2,0.8,0.2,1)`. Une durée de 240 ms est réservée aux rares cartes TV, avec la même courbe. Les propriétés animées sont `opacity` et `transform`. La progression utilise `scaleX`, jamais une largeur animée. La lueur est une couche déjà peinte dont seule l’opacité varie.

Le prototype propose une lueur d’activation unique, puis un état stable. La pulsation permanente n’est pas retenue : elle détournerait l’attention de la vidéo. Un texte déjà en lecture ne flotte pas. Les capsules gardent leurs positions et une largeur réservée, avec chiffres tabulaires pour le compteur. À douze joueurs, le compteur garde64px du premier au dernier vote, une ligne fixe et le rectangle180px, sans changement de taille à12/12. Les variantes3/6conservent la taille source72px.

## Fiches Motion

| État / couverture | Élément | Entrée | Durée | Maintien | Sortie | Reduced motion |
|---|---|---|---|---|---|---|
| B1 · micro / joueur actif | Numéro, nom, lueur | Opacité + déplacement vertical 10 px du cartouche ; couche de lueur 0→0,55→0 une seule fois | Cartouche 180 ms ; lueur 240 ms | Nom immobile jusqu’au prochain joueur | Fondu + même déplacement vertical 10 px | Fondu 100 ms ; aucun déplacement, aucune lueur |
| B1 · badge et texte | Libellé de phase, tour | Fondu du libellé avec déplacement vertical de 4 px ; emplacement réservé | 180 ms | Jusqu’au nouvel état | Ancien libellé remplacé à la prochaine projection ; pas de translation du HUD | Fondu 100 ms, emplacement identique |
| B2 · attente→discussion | Badge et cartouche actif | Badge puis cartouche bas | 180 ms | Tant que la discussion est courante | Cartouche sort en 180 ms avant le contenu suivant | Fondu 100 ms |
| B2 · joueur actif suivant | Numéro et nom | Remplacement dans le même rectangle ; accent bref sur le nouveau cartouche | 180 ms | Identité courante stable | Ancien cartouche sort en 180 ms | Fondu 100 ms, pas de glow |
| B2 · discussion→vote | Cartouche actif, badge Vote, vote reçu | Sortie du cartouche, entrée du vote dans son rectangle TV existant | Sortie 180 ms ; entrée 180 ms | Compteur stable tant que le vote reste ouvert | Sortie identique vers le résultat | Fondu 100 ms ; chiffres toujours lisibles |
| B2 · vote→résultat | Bloc vote puis résultat autorisé | Le compteur cesse d’évoluer ; le résultat entre après la résolution | 180 ms | Selon moment ci-dessous | Vers état durable ou nouveau cycle | Fondu 100 ms |
| B2 · résultat→nouveau cycle d’élimination | Note de résultat, badge Discussion, joueur actif | Retour au même HUD minimal ; même paire | 180 ms | Jusqu’au prochain passage | Transition contextuelle suivante | Fondu 100 ms |
| B3/B4 · Duo anonyme | Carte A, carte B, VS | A depuis −18 px, B depuis +18 px ; décalage B 40 ms ; VS en fondu 80 ms après A | Cartes 240 ms ; VS 180 ms | **2 600 ms**, images et noms immobiles | Fondu + déplacement vertical 10 px, puis joueur actif ; aucun nouveau composant compact | Cartes et VS en fondu 100 ms, sans translation ni décalage |
| B5 · affectations, 3 joueurs | Trois cartes publiées | Entrée verticale 10 px, décalages 0/40/80 ms | 240 ms par carte | Stable ; une seule page | Retrait avant un autre état | Fondu groupé 100 ms |
| B5 · affectations, 6 joueurs | Deux pages de trois | Même géométrie ; indicateur 1–3/6 puis 4–6/6 | 180 ms sortie ; 240 ms entrée | 2 600 ms par page dans la démo ; la commande réelle de page reste à raccorder à l’existant | Même zone, aucune réduction de six cartes | Fondu groupé 100 ms, maintien conservé |
| B5 · affectations, 12 joueurs | Quatre pages de trois, numéros stables | Même taille qu’à trois ; pages 1–3, 4–6, 7–9, 10–12 | 180 ms sortie ; 240 ms entrée | 2 600 ms par page de démo ; dernier groupe reste stable | Retrait avant prochain état ; jamais 12 petites cartes | Fondu groupé 100 ms ; pas de séquence latérale |
| B6 · ouverture et votes reçus | Compteur et progression | Cartouche en fondu/translation ; chiffres tabulaires, progression `scaleX` | Ouverture 180 ms ; mise à jour 140 ms | Pas de minimum par vote, la dernière valeur fait foi | À la clôture, compteur figé puis résultat seulement après résolution | Ouverture fondu 100 ms ; progression instantanée, aucune oscillation |
| B6 · clôture | « Vote terminé », compteur complet | Changement du libellé à emplacement fixe | 180 ms | État de démonstration ; la clôture effective vient du moteur | Vers résultat autorisé | Fondu 100 ms |
| B7 · élimination | Cartouche bas « Élodie quitte le jeu » | Fondu/translation 10 px, aucun rôle secret ajouté | 180 ms | **2 400 ms** | Sortie 180 ms vers la note durable existante | Fondu 100 ms ; même information |
| B8 · égalité | « Aucun joueur éliminé » | Cartouche bas, même famille que l’élimination | 180 ms | **2 400 ms** | Sortie vers note durable ; aucune résolution inventée | Fondu 100 ms |
| B9 · révélation finale autorisée | Trois cartes avec camps déjà publics | Entrée verticale 10 px, décalages 0/40/80 ms | 240 ms | **2 800 ms** | Fondu vers résultat final compact | Fondu groupé 100 ms |
| B9 · victoire événementielle | Résultat, accent citron existant | Fondu/translation 10 px | 240 ms | **2 800 ms** | Vers le résultat compact et durable | Fondu 100 ms ; aucun effet festif ajouté |
| B9 · ouverture tardive | Résultat durable | **Aucune entrée historique** | 0 ms | Durable tant que la projection courante le dit | Seule une nouvelle projection peut le remplacer | Même état direct sans animation |
| B10 · manche suivante | Capsule de transition | Fondu/translation 10 px | 180 ms | **2 200 ms** dans la démo | Retour à Préparation, sans paire future | Fondu 100 ms |
| B10 · nouvelle paire autorisée | Messi / Ronaldo | Même séquence Duo, uniquement dans un autre fichier de projection déjà autorisé | Cartes 240 ms ; VS 180 ms | **2 600 ms** | Retour au HUD minimal | Fondu 100 ms |

## Projections séparées

- `duo-anonyme.html` : contenus Sasuke/Itachi et roster public uniquement ; **aucune table d’affectations ni camp**, même cachés. Les votes montrent seulement le nombre reçu.
- `affectations-visibles.html` : contenu de chaque joueur fourni dans une fixture explicitement publique, sans camp privé.
- `resultat-final-autorise.html` : associations et camps déjà autorisés après résultat final. Ce fichier n’est ni préchargé ni embarqué dans le Duo anonyme.
- `manche-suivante-autorisee.html` : nouvelle paire Messi/Ronaldo, sans affectation ; elle n’est pas chargée dans la discussion précédente.

Les liens du panneau de démonstration ouvrent ces fichiers distincts. Cela illustre le contrat de projection ; ce prototype ne prouve aucune permission serveur et n’appelle aucune API.

## Interruption, relecture et état durable

Un nouveau scénario invalide le jeton du précédent, annule ses temporisateurs et animations. Un vote qui interrompt un Duo ne laisse pas ce Duo réapparaître 2,6 s plus tard. Les séquences sont remplaçables, sans file d’événements périmés. Les sorties utilisent le même axe court que les entrées.

Les commandes Lire/Rejouer, Pause/Reprendre et État stable sont exclusivement hors cadre OBS. Pause de démonstration ne signifie pas pause de partie et ne crée aucune capacité backend. L’ouverture tardive affiche directement la note durable ou le résultat final compact : l’événement n’est pas rejoué. `prefers-reduced-motion: reduce` est effectivement écouté ; la case du prototype ajoute une réduction mais ne contourne jamais le choix système.

## Continuité et limites

Partie = contenant complet ; Manche = paire préparée ; Cycle d’élimination = mêmes contenus, nouveaux indices/vote avec les joueurs restants ; Tours d’indices = tours oraux. Le cycle apparaît dans les commandes de démo et la documentation, sans nouveau grand panneau OBS. La transition « Manche suivante » ne révèle pas le conducteur privé.

Les sept blocs, quatre presets, positions personnalisées et renderer commun restent acquis. Seul le preset équilibré v2 sert de cadre aux maquettes Motion ; aucun nouveau preset ni éditeur n’est proposé. La synchronisation exacte des événements, la politique d’autopagination publique et la prévention de replay à la reconnexion devront être raccordées aux événements déjà autorisés lors d’une éventuelle intégration, après validation humaine. Ce dossier ne change pas le renderer existant.

Les vidéos montrent un fond neutre de démonstration car WebM n’atteste pas l’alpha. Les PNG `*-alpha.png` et HTML `?overlay=1` sont les preuves séparées de fond transparent. Aucun test OBS physique ni iPhone/Safari réel n’est revendiqué.
