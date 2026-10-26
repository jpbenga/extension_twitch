> Historique technique conservé. Depuis le jalon 6, la vision active est un catalogue fermé de jeux prêts à jouer ; la création libre et le Store sont retirés du produit. Voir [PRODUCT.md](PRODUCT.md) et [STAGE-6.md](STAGE-6.md). Les primitives internes et données restent conservées.

# Refonte globale — bilan et décisions UX

Base vérifiée sur Git et sur les branches distantes : `b277c56` Broadcast Neon,
qui contient `512d936` Undercover et `26b0202` Studio 4B.1. Le dépôt était propre.
Branche de livraison : `feat/play-flows-multidevice`.

## Parcours disponibles

| Contexte    | Entrée                                                             | Action principale                                                |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Accueil     | `/`                                                                | Choisir Jouer ou Créer                                           |
| Jouer       | `/play` puis `/play/undercover`                                    | Préparer une démonstration ou inviter de vrais participants      |
| Créer       | `/creator`                                                         | Bibliothèque, personnalisation, guide ou Studio avancé existants |
| Régie       | `/sessions/<id>/gm` avec accès privé                               | Partie / Joueurs / Plateau ; commandes de la phase courante      |
| Laboratoire | `/play/lab/<id>` ou `/creator/lab/<id>` avec ses capacités locales | Incarner un joueur, copier le lien GM, observer le plateau       |
| Rejoindre   | `/join` ou `/join/<code>`                                          | Utiliser une invitation, sans obtenir de droits GM               |

L’accueil n’exige plus de créer un salon vide avant de jouer. Le Studio n’est plus
le passage obligé d’Undercover. Les anciens liens Créateur sont conservés ; le
formulaire historique de salon est disponible sous `/sessions/new`. Le retour
à l’accueil n’arrête pas une partie. Aucun transfert de brouillon ou migration
SQL pour changer les libellés.

La régie place le jeu et sa phase en premier, puis l’instruction et l’action utile.
Les accès et opérations rares sont repliés. La navigation n’affiche plus Session
et Jeu comme deux espaces concurrents pendant la partie. Les anciens fragments
restent reconnus. La barre d’actions basse redondante est retirée en cours de jeu.
Les contrôles et safe areas restent ceux du design system ; le clavier Safari
physique demande encore un test de l’utilisateur.

## Broadcast Neon et confirmations

Les tokens centralisés, contrastes, composants de formulaire/bouton/badge/alerte,
toasts, focus et mouvement réduit sont conservés. Les repères nouveaux utilisent
ces mêmes tokens : menthe pour participation, ambre pour la parole attendue,
bleu pour le panneau d’accès/plateau, violet pour navigation et création.
Le design system complet est dans [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

L’audit retrouve **zéro appel applicatif natif** à confirm/alert/prompt : les hooks
actuels ouvrent le dialogue personnalisé de Broadcast Neon, y compris vote,
rejeu, retrait, réinitialisation et suppressions Studio. Leur remplacement était
présent dans la base et est conservé, pas revendiqué comme un nouveau remplacement.
La confirmation destructive se distingue d’une transition. Erreurs asynchrones,
verrou d’envoi, focus initial/piégé/restauré et clavier restent testés.
Les avertissements navigateur `beforeunload` ne sont pas remplacés.

## Undercover et moteur

Le modèle courant **0.2.0** demande deux tours d’indices oraux complets avant chaque
scrutin (configurable 1–5). Le GM confirme les passages dans l’ordre public des
actifs. Le joueur attendu et la progression sont affichés. Le vote est refusé côté
serveur avant la fin ; aucun contournement exceptionnel n’est ajouté. Les indices
oraux ne sont ni saisis ni enregistrés. Le serveur prouve les confirmations GM,
pas la réalité du son prononcé.

`mechanics.turns`, `turn.advance` et `ballots.requireTurns` sont génériques, validés
et persistants. Les passages appartiennent à la manche courante ; une ancienne
séquence terminée ne débloque pas une nouvelle manche. La séquence est remise à
zéro pour les survivants à la manche suivante, et entièrement au rejeu. Les autres
règles 5A restent inchangées. Les définitions v1/v2 et Undercover 0.1.0 restent
utilisables ; la version officielle historique est conservée pour résoudre les
installations et variantes existantes. Pas de moteur Undercover parallèle.

L’audit [OFFICIAL-GAMES-CONFIGURABILITY.md](OFFICIAL-GAMES-CONFIGURABILITY.md)
distingue jeu jouable, exprimable, modifiable et reconstructible visuellement.
**La reconstruction entière d’Undercover depuis zéro sans JSON reste absente.**
Enchères et Qui est l’espion ne sont toujours pas livrés comme jeux jouables.
Aucun Store, 4C, Twitch, média serveur ou paiement ajouté.

## Laboratoire et isolation

La démonstration prépare les joueurs et installe la définition via les API normales,
avec reçus de reprise. Chaque joueur possède une capacité et une projection
individuelles. Le changement de perspective remonte un contexte React distinct,
ferme l’ancien flux et conserve le choix après rechargement. Un indicateur nomme
l’identité incarnée, sans supposer que l’acteur courant est celui qui doit parler.

La copie du lien GM permet de garder le laboratoire sur l’ordinateur et d’animer
sur l’iPhone. Les accès individuels et le plateau sont accessibles explicitement.
Les capacités ne sont pas affichées en clair. Le repli de copie sur HTTP local est
exercé dans Chromium ; une ouverture privée avec menu contextuel reste possible.
Les fragments privés sont importés puis retirés de l’adresse, sans référent.

Le comparatif ordinateur ouvre un flux **public indépendant**, pas une projection
fabriquée à partir de secrets GM. La vue mobile montre une seule perspective.
Le sélecteur exige les capacités de l’onglet créateur du test ; son URL seule ne
suffit pas. Il ne s’agit pas d’un droit d’usurpation serveur. Aucun nouvel endpoint
privilégié. Les outils `/lab` et `/design-system` restent absents en production.
Les quotas de connexion/débit sont conservés. Le sélecteur évite de saturer les
connexions HTTP locales avec de nombreux onglets SSE.

Guide humain : [TEST-MULTI-DEVICE-GAMES.md](TEST-MULTI-DEVICE-GAMES.md). La création
de la démonstration sur ordinateur est recommandée ; transférer tout le laboratoire
et ses capacités entre appareils n’est pas implémenté. Seul l’accès GM, ou chaque
accès individuel voulu, est transmis explicitement par le testeur.

## Fichiers principaux

- Routes `app/{page,play,join,sessions/new}` ; composants `official-games-lab`,
  `creator-frame/home/laboratory`, `session-room`, `play-panel`, `copy-link`.
- `contracts/{mechanics,game-definition}` ; `engine/{mechanics,configurable,lobby,creator}` ;
  définition Undercover 0.2.0 et archive 0.1.0.
- Contrats de préparation du laboratoire et retour de route, sans nouvelle API,
  table, technologie de transport ou dépendance.
- Tests moteur, HTTP, redémarrage réel, navigateur multicontextes et responsive.

## Statut de validation

Les commandes réellement exécutées et les captures figurent ci-dessous. Les premières observations humaines sur iPhone
ont motivé cette livraison. Elles ne valident pas les nouveaux parcours.
Aucun iPhone physique, VoiceOver/Safari iOS réel ou OBS réel n’est accessible ici.
Les tests physiques iPhone + ordinateur, le rythme et le plaisir du gameplay
restent à apprécier par l’utilisateur.

Une régression d’évolution du catalogue a été corrigée : les installations officielles
historiques sont résolues séparément du catalogue courant, présentées dans Jeux ajoutés
et lançables avec leur définition d’origine. Le DTO privé ajoute une liste facultative
`archivedInstallations` ; aucun compte ni migration SQL. Un test HTTP et un parcours
navigateur vérifient visibilité et lancement d’Undercover 0.1.0 sans nouveaux tours.

## Vérifications finales exécutées

Environnement : Node 24.19.0, npm 11.9.0, Chromium `/usr/bin/chromium`.
Les bases et serveurs de test sont isolés ; les protections de fréquence, d’origine,
de permission et les reçus restent actifs. Aucune suite existante supprimée.
Les tests qui visaient l’ancien onglet Session utilisent désormais Partie et ses
réglages, avec les mêmes assertions de réinitialisation et révocation.

| Commande              | Résultat                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`       | Réussi : formatage, **118 tests** sur 15 fichiers, TypeScript strict et compilation packages/serveur/Next                                                     |
| `npm run test:e2e`    | **78 réussis**, 26 sur ordinateur, tablette et téléphone                                                                                                      |
| `npm run test:games`  | **18 réussis**, 6 par format, dont partie complète multicontextes et ancienne version installée                                                               |
| `npm run test:design` | **15 réussis**, 5 par format ; dialogues, clavier/focus, erreurs, petit téléphone et copie sans Clipboard API                                                 |
| `npm run test:lab`    | **6 réussis** en développement ; parcours réels, refus de commande, dialogues asynchrones et absence d’erreurs console/hydratation sur les parcours contrôlés |
| `git diff --check`    | Réussi                                                                                                                                                        |

Les tests moteur vérifient tours complets, cibles, permissions, vote prématuré,
égalité, élimination, victoires, manches, rejeu, archive et références. Les tests
HTTP exercent un reçu de passage répété sans double effet. La reprise s’effectue
après un vrai arrêt/redémarrage du processus serveur au milieu des indices, puis
des votes et du résultat sur la même base SQLite.

Le nouveau scénario navigateur possède **un contexte GM, trois contextes joueurs
et un contexte spectateur indépendants**. Il copie le lien GM vers un contexte
390 × 844 tactile, vérifie les corps de réponse privés/publics, tente réellement
le vote prématuré et une usurpation GM refusés, recharge les identités, confirme les
deux tours, vote, termine la partie et rejoue. Un visiteur ouvrant l’URL seule du
laboratoire ne reçoit pas le sélecteur. Les autres parcours continuent de tester
variantes, expressions complexes préservées, conflits, pertes d’acquittement,
reconnexions et publications privées immuables.

Les vérifications visuelles principales portent sur 320 × 568, 390 × 844,
768 × 1024, 1440 × 1000 et le plateau final 1920 × 1080. Les parcours navigateur
utilisent surtout trois ou quatre joueurs ; le moteur vérifie aussi les limites
3–12. Le rendu à douze joueurs et les noms/mots très longs demandent un contrôle
humain particulier. Il ne s’agit pas d’un audit WCAG complet ou d’une certification
Safari, VoiceOver ou OBS.

## Captures Chromium

Données fictives uniquement, aucune capacité privée visible :

- [Accueil téléphone](screenshots/global-refresh/accueil-mobile.png) et
  [ordinateur](screenshots/global-refresh/accueil-desktop.png).
- [Régie en préparation](screenshots/global-refresh/regie-preparation-mobile.png),
  [tours d’indices](screenshots/global-refresh/regie-indices-mobile.png) et
  [confirmation](screenshots/global-refresh/confirmation-mobile.png).
- [Carte joueur](screenshots/global-refresh/joueur-mobile.png).
- [Joueur et plateau comparés](screenshots/global-refresh/comparatif-desktop.png).
- [Plateau final](screenshots/global-refresh/plateau-final.png).

Les captures historiques de comparaison sont conservées dans
[screenshots/5a](screenshots/5a) et [screenshots/broadcast-neon](screenshots/broadcast-neon).
Les nouvelles captures prouvent un rendu navigateur, pas une validation ergonomique
par l’utilisateur sur iPhone physique. Le guide humain reste le point d’entrée des
prochains retours ; aucune étape Store, 4C ou nouvelle verticale n’est commencée.

Le libellé de tour de parole a été vérifié une dernière fois sur les trois formats :
« Au tour de : Joueur démo 1 » n’indique plus à Joueur 2 qu’il doit parler. Après
cette correction textuelle, TypeScript et la compilation ont été relancés, ainsi
que le parcours multi-appareils et celui de régie/dialogue sur chaque format
(6 exécutions ciblées supplémentaires réussies). Les captures correspondantes ont
été renouvelées après acquittement et fermeture de la notification de succès.
