# Jeux officiels — audit de reproductibilité

Audit de la base `b277c56`, complété par la présente refonte. Les sources vérifiées
sont `packages/contracts/src/{game-definition,mechanics,expressions}.ts`,
`packages/engine/src/{configurable,mechanics,creator}.ts`, `packages/games/*`,
les éditeurs `creator-{actions,effects,expressions,play-rules}.tsx` et les tests
`undercover*.test.ts`. Aucun branchement sur l’identifiant Undercover ne décide
d’une règle dans le moteur. Ses composants affichent la projection des capacités.

## Quatre niveaux différents

| Jeu                | Jouable jusqu’à la fin   | Exprimé par le moteur déclaratif actuel            | Modifiable visuellement dans le Studio                                                                                                       | Reconstructible depuis une création vide sans JSON                                                                               |
| ------------------ | ------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Undercover 0.2.0   | Oui, variante documentée | Oui, opérations natives génériques déclarées en v3 | Partiellement : configuration, distribution existante, options de vote, fins, rôles/données/actions usuelles ; opérations natives préservées | **Non** : l’éditeur ne sait pas encore ajouter structurellement une distribution, un scrutin ou un suivi de parole à un jeu vide |
| Enchères           | Non                      | Non, définition exécutable absente                 | Pas ses mécanismes d’enchères                                                                                                                | Non                                                                                                                              |
| Qui est l’espion ? | Non                      | Non, variante définitive et définition absentes    | Pas son cycle spécifique de questions et résolution                                                                                          | Non                                                                                                                              |

« Déclaratif » signifie ici composition de primitives implémentées et bornées dans
le moteur commun, pas exécution de scripts utilisateurs. Une opération native reste
un interpréteur de la plateforme. Le JSON avancé peut décrire ces primitives, mais
cela ne remplit pas le critère de reconstruction visuelle par un débutant.
Les descripteurs Enchères/Espion ne sont ni des définitions exécutables ni des jeux
validés. Le catalogue les identifie explicitement comme non jouables.

## Undercover

| Mécanique              | Fonctionnement livré                                               | Primitive générique                                                        | Accessible dans le Studio                                         | Partie spécifique / manque / travail restant                                            |
| ---------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Effectif               | 3–12 ; minorité strictement inférieure aux civils                  | `mechanics.minPlayers/maxPlayers`, validation réelle à l’installation      | Oui, Distribution et vote                                         | Configuration de la définition officielle ; assistant d’ajout depuis zéro absent        |
| Camps                  | Civil / Undercover, porteur ignorant son camp                      | Rôles base player, `deals.concealRoles`                                    | Rôles oui ; options structurelles de distribution non             | Ajouter un formulaire générique de création de distribution et ses références           |
| Distribution aléatoire | Mélange cryptographique serveur et attribution unique              | `deal`, références de configuration et donnée owner                        | Mots et nombre oui, depuis le modèle                              | Aucun algorithme spécifique Undercover ; distribution binaire seulement                 |
| Informations privées   | Un mot pour soi ; gestion privée GM                                | Variables participant/owner, projections serveur                           | Oui pour les données et leurs droits                              | Le libellé officiel est spécifique, la confidentialité est commune                      |
| Tours d’indices        | 1–5 tours, défaut 2 ; ordre des actifs ; confirmations GM          | `mechanics.turns`, `turn.advance`, suivi persistant                        | Nombre de tours oui ; opération conservée dans l’action existante | Création structurelle et choix de l’étape depuis un jeu vide encore absents             |
| Verrou avant vote      | Tous les passages doivent être confirmés                           | `ballots.requireTurns`, contrôle moteur                                    | Conservé, pas de bouton visuel de désactivation                   | Ajouter éditeur de dépendances entre primitives, avec validation des chemins            |
| Vote nominatif         | Un vote par actif, cible active, sans soi par défaut               | `ballot.open/cast`, UUID réels, reçus                                      | Options vote pour soi/délégation oui ; saisie native conservée    | Création du scrutin et du sélecteur de cibles depuis zéro absente                       |
| Dépouillement          | Tous les votes, majorité relative, égalité sans élimination        | `ballot.resolve`, résolution select/eliminate                              | Type de résolution et révélation du camp oui                      | Quorum, majorité stricte et départages alternatifs non implémentés                      |
| Élimination            | Retrait des actifs ; accès en lecture conservé                     | État actif, autorisations, projections                                     | Choix sélectionner/éliminer oui                                   | Pas de commande de réintégration/annulation après révélation                            |
| Manche suivante        | Réinitialise le vote et les passages des survivants                | `round.next`, entrée dans l’étape déclarée                                 | Action existante et phases éditables ; opération native conservée | Ajouter un constructeur d’opérations pour toute action nouvelle                         |
| Victoire               | Compte des camps ; priorité civile puis parité ; limite de manches | `endings`, comparaison eq/gte/lte, résultat et déclassification explicites | Compteurs, comparaison, résultat et limite oui                    | Arbitrage de victoire sur des variables ou d’autres agrégats absent de ces fins natives |
| Révélation             | Camp éliminé puis mots/camps finaux                                | `revealEliminatedRole`, `revealVariables`, effets reveal ordinaires        | Option du vote oui, reveal ordinaire oui                          | Éditeur complet des listes de révélation native encore technique                        |
| Rejeu                  | Nouvel état et identifiant ; mêmes joueurs et définition           | `game.restart`, snapshot/version et reçu                                   | Commande régie/laboratoire                                        | Pas de règle frontend ; pas de modification d’un jeu publié                             |
| Présentation           | Cartes privées, cibles de vote, progression et résultat            | `GameProjection.play` et composants partagés                               | Libellés oui, structure graphique non                             | Les composants de gameplay ne constituent pas l’éditeur d’overlays 4C                   |

La définition et ses textes sont dans `games/undercover`. L’exécution est dans
`engine/mechanics`, la sécurité dans les projections et validations partagées.
L’interface ne tire pas les rôles, ne dépouille pas et ne décide pas des victoires.
Le journal public emploie des messages d’opérations connus, pas le texte d’une action
réservée à un camp. Les mots et choix individuels n’y sont jamais recopiés.

## Enchères — manques vérifiés

| Mécanique attendue      | Existant réutilisable                                                  | Configuration Studio actuelle                 | Code spécifique livré  | Primitive manquante / travail nécessaire                                                           |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Budget                  | Entier participant, contraintes et effets transactionnels sur l’acteur | Données, conditions et effets oui             | Aucun jeu              | Un budget seul ne réalise pas une enchère                                                          |
| Lot et manche           | Phases, texte de session, références d’assets                          | Oui pour des données simples                  | Descripteur uniquement | Catalogue ordonné de lots et progression                                                           |
| Meilleure offre         | Validation de paramètres et concurrence optimiste                      | Pas de saisie métier d’enchère                | Aucune                 | Offre liée à l’identité serveur, comparaison au meilleur montant, incrément configurable           |
| Clôture / attribution   | Commandes GM et reçus existants                                        | Pas de règle d’attribution multi-participants | Aucune                 | Débit du gagnant et attribution atomiques, uniquement après confirmation ; aucune retenue au dépôt |
| Annulation / classement | Variables et événements simples                                        | Pas d’outil métier                            | Aucune                 | Compensation contrôlée, historique des transactions et agrégats de classement                      |
| Chronomètre             | Transport temps réel disponible                                        | Pas de minuteur réel                          | Aucune                 | Horloge serveur persistante et règles d’expiration, pas un compte à rebours React                  |

Le modèle anglais ascendant est une proposition, pas une décision définitive.
Ne pas rebaptiser une collecte de points en enchère. Livrer une verticale 5B avec
ces primitives communes, son interface tactile, ses erreurs et sa fin de partie.

## Qui est l’espion ? — manques vérifiés

| Mécanique proposée           | Existant réutilisable                                           | Configuration Studio actuelle                                            | Code spécifique livré    | Primitive manquante / travail nécessaire                                                |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------- |
| Rôles secrets et lieu        | Rôles, distribution binaire, informations owner                 | Personnalisation d’un modèle, pas structure depuis zéro                  | Descripteur uniquement   | Adapter la distribution selon la règle retenue ; ne pas copier les deux mots Undercover |
| Questions ciblées / réponses | Texte privé, paramètres et étapes ; suivi oral générique ajouté | Réponses simples possibles, pas de sélecteur auteur/destinataire protégé | Aucune                   | Séquence et destinataire validés, droits de lecture et révélation des réponses          |
| Accusation                   | Vote nominatif, tous les actifs requis                          | Options du modèle existant                                               | Aucune définition Espion | Résolution à majorité stricte et quorum si retenus ; scrutin actuel = majorité relative |
| Devinette finale             | Paramètres texte et gardes simples                              | Formulaire ordinaire possible                                            | Aucune                   | Tentative réservée à l’espion, moment et comparaison normalisée à définir               |
| Résultat                     | Fins par effectifs et effets/reveal                             | Pas de règle propre à l’espion                                           | Aucune                   | Résultat d’accusation/question distinct des éliminations successives Undercover         |

Les hypothèses de règles restent dans OFFICIAL-GAMES-RULES.md. Le jeu doit être
mécaniquement distinct avant d’être annoncé jouable.

## Suite recommandée sans refonte massive

1. Construire dans le Studio des formulaires d’ajout des primitives v3 déjà
   existantes (distribution, scrutin, tours, fins), avec choix de références valides.
2. Ajouter une projection pédagogique des liens étape → action → conséquences,
   puis tester la reconstruction d’Undercover depuis zéro **sans JSON**.
3. Ajouter les primitives de ressources/offres/attribution nécessaires à 5B et
   les rendre éditables dans ces mêmes formulaires, avec les tests transactionnels.
4. Définir les règles distinctives Espion puis livrer questions, accusation et fin.

Cette refonte ajoute le suivi de parole nécessaire au gameplay, pas un assistant
universel ni une migration des anciennes parties. Les critères absents ci-dessus
restent des travaux à faire, sans promesse de livraison du Store ou de 4C.
