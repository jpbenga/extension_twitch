> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Contrôles du prototype Motion

Statut : **AWAITING_APPROVAL**. Ces contrôles portent sur les maquettes/prototypes autonomes, pas sur le renderer applicatif ni ses permissions serveur.

- Chromium headless, véritable média système `prefers-reduced-motion`, normal et réduit.
- 24 captures OBS alpha couvrant micro, Duo, affectations3/6/12, vote12, élimination, égalité, révélation, victoire, durable, suivante dans les deux modes.
- `QA.json` : séparation des clés de fixture anonyme, contrôles hors OBS, centre vide, absence d’animation historique en état stable, animation réelle normale vs opacité seule réduite, interruption Duo→vote sans réapparition, démonstrateur390 sans débordement horizontal.
- `QA-CORRECTIONS.json` : réduction manuelle sans glow/transform, résultat final12 page2 avec3camps conservés, transitions B2 finissant en cycle d’élimination, fin de manche→suivante→Préparation, nouvelle paire dans un fichier anonyme distinct sans mapping.
- `KEYFRAMES.json` : entrées figées à80ms par `pause/currentTime` WAAPI ; états de maintien, de sortie et de pagination chronométrés. Déclenchement des séquences sans attendre leur Promise avant les captures.
- `frames/` : douze keyframes temporelles. Trois images d’entrée refixées après les autres exports pour garantir l’instant80ms.
- `videos/` : huit WebM VP8 960×540 montrant des mouvements réels, normal et réduit. Le FFmpeg livré ne proposait pas VP9 demandé par Playwright récent ; un adaptateur local sélectionne VP8, sans installer de dépendance et sans modifier l’application.
- `proofs/twitch-duo-390.png`, `twitch-12-page4-390.png`, `twitch-vote-390.png` : cadre complet réduit, distinct du démonstrateur responsive avec ses commandes.
- `TRANSPARENCY.json` : dimensions, canal alpha, transparence et centre des PNG OBS/réductions. Les vidéos et fiches ont un fond neutre de lecture et ne prouvent pas l’alpha.

La relecture indépendante a identifié deux défauts de prototype : perte des camps sur pagination finale et lueur encore animée avec réduction manuelle. Ils ont été corrigés dans le même lot et confirmés par navigateur. Les scripts temporels ont été corrigés afin de ne pas attendre la fin de play() avant le délai ciblé.

Les détails secondaires conservent la taille du renderer TV existant : aucune nouvelle composition ne les agrandit sur Twitch390. Les variantes mobiles servent à observer la hiérarchie et la stabilité ; elles ne constituent pas un essai physique ou une garantie de lecture dans tous les lecteurs Twitch. Les noms longs restent tronqués avec numéro stable, et ne sont pas animés en marquee.

Aucun essai OBS physique, iPhone physique, Safari iOS ou réseau serveur n’est revendiqué. Aucun test applicatif n’a été relancé puisque le code applicatif n’est pas modifié.

## Addendum borné — vote complet à douze joueurs

Un dernier contrôle de longueur a identifié le repli de12/12surdeuxlignes. La correction est limitée à l’effectif12 : compteur64px fixé dès0/12, une ligne et cartouche180px constants. Les3/6 et les clips01–07 restent visuellement inchangés. `QA-VOTE12.json` mesure0,9,10,11,12 en normal et réduit ; toutes les hauteurs restent180px. Les captures `vote12-complete-*-alpha.png` et `vote12-complete-*-390.png` montrent le dernier vote. Le huitième clip `videos/08-vote12-normal-puis-reduced.webm` utilise successivement le média normal puis le vrai média réduit. La fiche m07 est la seule remplacée ; son ancien ID est consigné SUPERSEDED et exclu des12références finales.
