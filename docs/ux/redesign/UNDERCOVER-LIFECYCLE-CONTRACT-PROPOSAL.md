# Undercover — contrat de cycle de vie proposé, à arbitrer

Statut : **PROPOSAL — NON IMPLÉMENTÉ**. Les références AC9–AC13 sont visuellement approuvées. Elles ne décident pas des conséquences serveur ci-dessous. Ce document ne crée aucune commande, règle ou garantie de conservation nouvelle.

La livraison de consolidation intègre seulement les actions déjà prises en charge, ainsi qu’AC14 pour le retrait local confirmé. Aucun bouton de pause, fin anticipée, clôture ou abandon actif n’est ajouté.

## Modèle existant et périmètre

- Partie : contenant local actuellement stocké comme une série, avec plusieurs préparations.
- Manche : paire préparée ; son exécution actuelle est un `gameRun`.
- Cycle d’élimination : `play.round`, mêmes contenus, nouveaux indices et votes avec les joueurs restants.
- Tour d’indices : `play.turns.round` ; aucune nouvelle paire n’est distribuée par un changement de cycle.
- Salon : session serveur persistante, accès GM/joueurs, état et reçus de commandes.

Aujourd’hui, la partie complète et les manches futures ne sont pas un objet serveur clôturable : elles restent dans le navigateur de préparation. Un contrat de clôture de la partie doit donc préciser s’il faut introduire un objet serveur de partie, ou seulement un marquage local associé au salon. Ce choix précède une promesse d’historique interappareils.

## Invariants à conserver si une proposition est retenue

Toute nouvelle commande sera GM-only, identifiée, idempotente, soumise à la version attendue et transactionnelle en SQLite avant notification SSE. Elle ne sera jamais déclenchée par un simple changement de page. Un résultat, une révélation ou une révocation exige un choix métier explicite, pas un effet implicite d’un dialogue visuel.

Préserver les snapshots et les identifiants historiques. Aucun effacement de préparation locale, fichier, vote ou historique par une nouvelle opération sans décision séparée. Les projections joueur/public doivent rester explicites ; le duo ne reçoit jamais les affectations privées. Aucun statut fourni par le navigateur ne suffit à suspendre le moteur.

## 1. Mettre en pause / reprendre

**Commandes proposées** : `session.pause` et `session.resume`, noms à confirmer. Aucun schéma correspondant n’est ajouté au code.

| Sujet               | Proposition à valider                                                                              | Alternatives / arbitrage requis                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Déclencheur         | GM authentifié seulement.                                                                          | Délégation à un autre animateur non prévue par les accès actuels.                            |
| État serveur        | Marqueur persistant `paused`, date et acteur, en conservant la phase et le run.                    | Portée salon ou manche seulement ; comportement avant distribution/après résultat.           |
| Commandes joueur    | Refuser les nouvelles actions de gameplay pendant la pause.                                        | Autoriser certaines opérations sans effet de jeu ; liste exhaustive nécessaire.              |
| Vote déjà reçu      | Conserver les votes acceptés avant la pause.                                                       | Ne pas annuler un vote reconnu ; préciser le cas d’une commande concurrente.                 |
| Course pause/action | L’ordre de validation transactionnelle fait foi ; une action validée avant pause reste acceptée.   | Message d’erreur dédié et affichage client à définir.                                        |
| Commandes GM        | Autoriser au minimum reprise et lecture.                                                           | Autorisation d’un reset, d’une publication ou d’une autre sortie pendant la pause à décider. |
| Temps               | Ne pas inventer de chronomètre : le jeu actuel n’en a pas.                                         | Si des délais arrivent, définir gel/recalcul et horloge serveur.                             |
| Reconnexion         | Lire le marqueur persistant et la phase conservée ; ne pas reprendre automatiquement.              | Durée maximale d’une pause et reprise après redémarrage à décider.                           |
| Joueur              | État « Partie en pause », informations personnelles autorisées conservées et commandes suspendues. | Terme partie/manche selon la portée retenue.                                                 |
| Public              | Statut public sobre, sans révélation nouvelle.                                                     | Maintien ou retrait des contenus déjà publiés, traitement des animations transitoires.       |
| Reprise             | Reprendre exactement la phase suspendue sans redistribution ni rejeu des anciens effets.           | Qui peut reprendre et dans quels états terminaux.                                            |

Critères de test futurs : concurrence avec un dernier vote, refus des actions pendant pause, conservation des reçus, reconnexion et redémarrage, absence de révélation, reprise sans doubles commandes.

## 2. Terminer la manche avant le résultat automatique

**Commande proposée** : `undercover.finish-preparation`, nom et modèle d’état à confirmer.

| Sujet           | Proposition à valider                                                        | Décision encore ouverte                                                                                                |
| --------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Portée          | Terminer seulement la paire/run courant.                                     | États dans lesquels cette commande est autorisée.                                                                      |
| Résultat        | Marqueur distinct « interrompue » ; ne pas fabriquer un vainqueur.           | Nul, absence de résultat ou autre résultat explicite : décision produit obligatoire.                                   |
| Révélation      | Aucune nouvelle révélation par défaut proposé.                               | Autoriser ou non une révélation séparée après interruption.                                                            |
| Votes en cours  | Conserver les données déjà acceptées sans dépouillement automatique proposé. | Consultation GM et éventuel résultat partiel.                                                                          |
| Accès           | Conserver les participants et leurs accès proposé.                           | Possibilité de rouvrir les inscriptions et effets sur les éliminés.                                                    |
| Passage suivant | Action manuelle distincte du GM.                                             | `undercover.next` exige aujourd’hui un résultat ; il faudrait élargir explicitement son prérequis à l’état interrompu. |
| Historique      | Ajouter une entrée d’interruption, sans supprimer les événements antérieurs. | Contenu exact conservé, durée, confidentialité et possibilité de consultation.                                         |
| Reprise         | Aucun retour implicite au run interrompu.                                    | Autoriser une réouverture, un rejeu ou seulement une nouvelle manche.                                                  |
| Médias          | Ne pas modifier les droits sans règle explicite.                             | Maintien/expiration du relais et visibilité des médias précédemment publiés.                                           |

Critères de test futurs : aucun vainqueur inventé, votes conservés selon décision, public sans secret, accès distincts, progression manuelle et répétition idempotente de l’interruption.

## 3. Terminer toute la partie préparée

**Commande/état proposés** : clôture d’un contenant complet, après définition de son autorité de persistance.

| Sujet                | Proposition à valider                                           | Décision encore ouverte                                                                                           |
| -------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Objet concerné       | Clôturer le contenant et son lien vers le salon courant.        | Objet serveur de partie ou statut local ; propriété et accès interappareils.                                      |
| Manche encore active | Exiger une décision explicite distincte pour son interruption.  | Clôture combinée ou commande impossible tant qu’une manche reste en cours.                                        |
| Manches restantes    | Les conserver comme préparations non jouées proposé.            | Réutilisation dans une nouvelle partie, réouverture du contenant, notion d’archivage.                             |
| Salon                | Ne pas assimiler la clôture à `session.reset`.                  | Mode lecture seule, fermeture des invitations ou statut terminal et réouverture.                                  |
| Accès                | Ne pas révoquer automatiquement dans la proposition.            | Lecture joueur après clôture, durée et récupération des accès GM.                                                 |
| Historique           | Conserver les données existantes et marquer la clôture proposé. | Historique de partie consultable et durable à concevoir ; les fonctions actuelles ne garantissent pas cet espace. |
| Résultat global      | Aucun classement global ajouté.                                 | Le moteur ne définit pas de score transversal à toutes les paires.                                                |
| Reprise              | Aucune reprise automatique après fermeture d’onglet.            | Réouvrir la même partie ou créer une copie indépendante.                                                          |

Critères de test futurs : clôture sans purge, aucune nouvelle manche automatique, accès conformes au choix retenu, reprises explicites, anciennes sessions compatibles.

## 4. Abandonner / annuler

**Commande proposée** : abandon distinct, jamais un alias de reset.

| Sujet                 | Proposition à valider                                                                                           | Décision encore ouverte                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Différence avec reset | Marquer une sortie exceptionnelle ; reset retire les joueurs et révoque leurs accès selon son contrat existant. | Quand proposer annuler (avant démarrage) ou abandonner (après démarrage).                                |
| Préparations          | Les conserver proposées ; aucune suppression locale ou serveur implicite.                                       | Restent-elles dans le même contenant, dans une copie ou dans les éléments réutilisables ?                |
| Historique            | Conserver les événements existants et ajouter un motif d’abandon proposé.                                       | Motif obligatoire/facultatif, durée et consultation.                                                     |
| Accès                 | Aucune révocation arbitraire proposée.                                                                          | Conserver lecture seule, interdire les commandes, révoquer certains accès ou renouveler les invitations. |
| Informations privées  | Pas de révélation automatique proposée.                                                                         | Affichage final pour joueurs, GM et public.                                                              |
| Médias                | Appliquer une politique explicitement décidée.                                                                  | Retrait public immédiat, droits après abandon, expiration existante du relais.                           |
| Reprise               | Sortie distincte du rejeu.                                                                                      | Irréversible, réversible par GM ou nouvelle partie par copie.                                            |
| Répétition            | Même commande reconnue sans nouvel effet destructif.                                                            | Statut d’une reprise concurrente et message client.                                                      |

## 5. AC14 — retrait d’une manche préparée : contrat existant intégré

Le retrait concerne une entrée de la liste locale, après confirmation personnalisée. Il ne termine pas le run courant, n’efface pas le snapshot serveur, ne révoque aucun accès et ne réinitialise pas le salon. La copie réutilisable et les autres préparations restent disponibles selon les mécanismes actuels. L’annulation de retrait locale existante est conservée.

## Arbitrages à rendre avant tout backend de cycle de vie

1. Autorité et persistance du contenant Partie, notamment entre ordinateur et iPhone.
2. Liste précise des commandes suspendues et comportement des votes concurrents.
3. Résultat et révélations d’une manche interrompue.
4. Effets de clôture/abandon sur salon, participants, invitations et reprise.
5. Historique attendu, consultabilité, durée et confidentialité.
6. Droits des médias déjà publiés et indications publiques/joueurs après chaque sortie.

La validation de ce document, ou de décisions explicites remplaçant ses propositions, sera nécessaire avant de créer ces nouvelles commandes. Elle ne bloque pas AC1–AC8, AC14 et le Motion déjà intégré.
