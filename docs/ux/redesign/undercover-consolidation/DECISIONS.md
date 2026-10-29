> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Consolidation Undercover — décisions proposées

Statut : **AWAITING_APPROVAL**. Aucun nouvel écran approuvé. Ces propositions n’héritent pas automatiquement de la validation des anciennes références.

## Modèle mental

- Jeu : Undercover.
- Partie : expérience complète nommée, contenant les manches préparées.
- Manche : une paire A/B préparée, par exemple Sasuke / Itachi.
- Cycle d’élimination : séquence indices puis vote utilisant la même paire et les joueurs encore actifs.
- Tour d’indices : passage d’indices dans un cycle, par exemple Tour 1/2.

« Cycle d’élimination » reste une hypothèse de vocabulaire à valider. La régie l’accompagne de « Même paire ». Il ne remplace pas le mot Manche au niveau de la paire. La limite moteur actuelle appelée maximum de manches vise les cycles : ne pas la réinterpréter comme un nombre de paires ; si exposée, proposition de libellé « Maximum de cycles ».

## Capacités existantes conservées

L’application au commit d27458974b4c763e2911952b5295b4b0deae893d possède réellement le conducteur local, plusieurs préparations, les images A/B, la réutilisation indépendante, la persistance locale, les médias temporaires, les publications distinctes et le renderer TV. Il s’agit de consolidation, pas d’une nouvelle promesse de développement.

AC1 place les deux contenus avant les paramètres. AC2 renomme le contenant « Ma partie Undercover », conserve son nom facultatif, l’accès aux autres contenants, l’ajout, la modification, la duplication, le retrait avec confirmation, l’ordre et la réutilisation. Les boutons Monter/Descendre restent disponibles à côté du déplacement direct ; leurs bornes sont désactivées.

AC3 conserve le nom facultatif de la manche, les deux noms indépendants et les commandes image explicites. AC4 crée une copie qui peut être partiellement modifiée ; l’original reste intact. AC5 ne bloque ni les textes ni la préparation. AC6 ouvre uniquement le salon, sans distribuer ni démarrer.

AC7 expose Habillage TV, Aperçu et Mode public. « Ajustements avancés » mène à l’éditeur existant avec 7 blocs, 4 dispositions, déplacement et redimensionnement ; aucun nouvel éditeur ni renderer n’est conçu. La miniature finale réutilise une capture du renderer actuel sur une surface neutre ; ce fond neutre appartient à l’aperçu GM, pas à OBS. La source OBS conserve son alpha réel.

AC8 propose une adoption explicite depuis une ancienne disposition. « Garder ma disposition » demeure disponible. Aucun écrasement automatique. TV est présenté comme choix normal pour une nouvelle préparation. L’écran ne spécifie pas une nouvelle stratégie technique de migration.

## Navigation et route /play

Convention : retour contextuel unique au-dessus du titre. Les écrans profonds reviennent à Ma partie Undercover, Diffusion ou Préparer la manche selon leur provenance. Depuis le conducteur, retour vers l’accueil existant. Depuis la régie, Retour à ma partie signifie navigation vers le conducteur, pas fin de session.

La route /play existe et reçoit réellement des liens de ProductFrame, reprise, game-panel, welcome et du conducteur. Son absence d’utilité distincte est une recommandation UX, pas un fait technique. Aucun écran A11 n’est généré : dans ce chantier ciblé, le retour du conducteur est proposé vers l’accueil existant pour éviter un détour par le catalogue ancien. La route n’est ni supprimée ni modifiée. Ses autres liens entrants devront être arbitrés ultérieurement sans créer un second parcours de préparation ni refaire l’accueil.

## Cycle de vie : hypothèses, pas comportement serveur acquis

L’inspection de packages/contracts/src/sessions.ts, undercover-room.tsx et undercover-series-controls.tsx ne trouve pas de commandes dédiées pause/reprise, fin volontaire ou abandon. AC9–AC13 sont des intentions nouvelles à valider avant intégration.

- Pause : proposition réversible, avec Reprendre et libellé « Partie en pause ». À arbitrer : commandes bloquées, temps, votes déjà reçus, propagation aux joueurs/public, droits et courses entre commandes.
- Fin anticipée de manche : portée de la paire en cours. À arbitrer : état terminal sans résultat automatique, historique, accès et passage manuel à la prochaine manche. Aucune victoire ni révélation de secret n’est inventée.
- Fin de partie : clôture volontaire du contenant complet et conservation de l’historique disponible selon la demande utilisateur. À arbitrer : définition de cet historique, persistance, consultabilité et règles concernant les manches restantes.
- Abandon : sortie exceptionnelle distincte de Réinitialiser le salon. À arbitrer : effets exacts sur sessions, accès, médias, préparation locale et historique. Aucun effacement ou révocation n’est affirmé dans les maquettes.
- Retour à ma partie : navigation seulement ; ne vaut ni pause, ni fin, ni abandon.

Les confirmations AC11–AC14 déclinent le patron accessible existant. Leur géométrie mobile illustre la portée et le libellé ; elles ne constituent pas une implémentation de focus trap ni de commande métier. Annuler et fermeture sont toujours disponibles. L’implémentation future devra reprendre focus initial prudent, focus restitué, Échap, inert et sémantique aria du composant existant.

## Confidentialité et diffusion

Duo anonyme : le public connaît les contenus autorisés sans relation joueur→contenu. Affectations visibles : publication volontaire explicite, projection différente. Sélectionner le mode dans la préparation ne distribue pas les contenus et ne publie pas automatiquement les secrets. La préparation locale, le renderer public et les commandes GM restent séparés.

## Périmètre

Aucun code applicatif, backend, intégration, Git ou publication modifié. Accueil, salon, compagnon joueur, renderer TV et anciens états APPROVED conservés. Exemples d’illustrations issus des références design existantes, uniquement dans les maquettes locales/Stitch ; aucun asset embarqué dans l’application.

## Études FOCUS de régie, pas remplacement de B5

AC9 et AC10 sont explicitement des FOCUS sur le menu secondaire et l’état de pause. Le contexte de régie y est simplifié pour lire ces seules intentions ; il ne constitue pas un nouveau plein écran B5 à intégrer tel quel. Sont conservés dans la véritable régie : ordre de passage complet, journal, informations privées autorisées au GM, gestion des joueurs, invitations et accès, onglets existants, réglages, commandes métier, erreurs et états de reçus. Les nouvelles intentions doivent s’ajouter à ces capacités, sans les supprimer ni refaire B5.
