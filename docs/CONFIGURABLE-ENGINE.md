# Studio configurable — décision d’architecture

Statut : architecture adoptée pour ce socle, langage expérimental v1.
Validation technique terminée — Validation humaine iPhone en attente (jalon A).
La nouvelle livraison doit être vérifiée séparément ; aucun test physique iOS n’est revendiqué.

## Direction produit

Le produit devient un studio de création sans programmation. Undercover, Enchères et
Qui est l’espion restent dans la V1, comme jeux officiels préinstallés. Les mécanismes
réutilisables appartiennent à un interpréteur commun, et non à trois moteurs distincts.
Cette décision remplace la liste fermée des jeux et l’obligation de dupliquer leurs
validations/transitions. Elle ne valide aucune règle définitive d’Undercover.

## Quatre objets distincts

- **GameDefinition** : document strict, identifié, versionné, compatible avec une
  version précise du langage. Métadonnées, paramètres, rôles, variables, actions,
  phases, scènes et emplacements logiques d’assets.
- **Configuration** : valeurs choisies pour cette émission et références d’assets.
- **GameRun** : copie validée de la définition et de la configuration, identifiant de
  partie, phase, rôles affectés, valeurs et révélations. Le catalogue peut évoluer
  sans modifier cette copie. Une relance garde la même définition et crée un nouvel
  identifiant ; les commandes de l’ancienne partie sont refusées.
- **Événements** : journal de commandes acceptées sans paramètres secrets. Snapshot,
  événement et reçu d’idempotence restent dans la même transaction SQLite de A.
  Le journal public n’est pas une sauvegarde complète permettant l’event sourcing.

Le JSON d’une ancienne session A sans GameRun reste valide et utilisable. Aucune
migration massive ni nouvelle base n’est nécessaire. Les versions inconnues sont
refusées ; aucune migration implicite ou destructive n’est appliquée. Une migration
future sera une fonction serveur explicite, testée, avec version source/cible,
transaction et sauvegarde. Les sessions actives ne suivront jamais automatiquement
une nouvelle version du catalogue.

## Langage déclaratif limité

V1 : entiers bornés, textes bornés, booléens ; rôles GM/joueur/spectateur ; variables
session ou participant ; paramètres d’actions ; comparaison d’égalité ; effets
set/increment/reveal ; transition manuelle vers une phase déclarée. Pas de code,
évaluation de chaîne, expressions récursives, accès réseau, minuteurs, boucles,
transactions monétaires, équipes ou extensions natives exécutables dans ce lot.
Les collections et la taille totale sont bornées. Les références et la compatibilité
des types sont validées avant installation. Les effets s’appliquent atomiquement
sur une copie ; un dépassement de borne annule toute l’action.

Le rôle authentifié vient des capacités individuelles du service A. Un rôle de jeu
personnalisé ne donne jamais l’autorité GM. Seul le GM peut affecter les rôles joueur.
Une action doit autoriser ce rôle et la phase courante. Les cibles participant sont
limitées à « self », jamais à un identifiant soumis par le navigateur. Les comparaisons
ne peuvent pas lire une information cachée à leur auteur. Un joueur ne peut pas
modifier une variable réservée au GM (même un dépassement de borne pourrait révéler
indirectement sa valeur). Une publication d’information
privée demande un effet reveal réservé au GM ; un effet set ne peut pas recopier une
configuration privée dans une variable publique.

## Projections et interfaces

Le serveur ne distribue pas le GameRun ni la définition brute. Il produit les valeurs
publiques, les valeurs du joueur concerné et les actions autorisées avec leurs seuls
paramètres. Le GM voit les données de gestion et les valeurs privées. Les rôles cachés
et conditions ne sont pas envoyés au public. Le plateau intégré à la régie reçoit une
projection publique distincte, pas la projection privée du GM.

La régie conserve ses contrôles de salon, SSE, reçus, gestion des erreurs et boutons
tactiles de A. Un panneau générique affiche les actions et valeurs de la projection.
Il ne contient pas de branchement sur Undercover. Les scènes déclarent un canevas,
des widgets positionnés et des sources de données logiques ; la première interface
affiche des cartes accessibles. Le rendu de scènes complet et l’éditeur visuel sont
ultérieurs. Pas de HTML/CSS/script arbitraire ni de source permettant de contourner
les projections. Les adaptations par résolution seront versionnées avec les scènes.

## Progression

1. Socle présent : deux définitions différentes, commandes réelles, permissions,
   projections, transitions, redémarrage et petit laboratoire de développement.
2. Compléter les primitives nécessaires au vote et à la distribution privée, puis
   convertir Undercover après validation de ses règles. Les trois modules existants
   gardent leurs métadonnées ; ils n’ont pas encore de règles jouables.
3. Équipes, ressources, chronomètres, conditions composées et conditions de victoire
   selon des besoins démontrés, avec quotas et tests. Les jeux officiels utilisent
   les mêmes primitives ; une extension native future sera enregistrée et auditée
   côté serveur, jamais chargée depuis un document utilisateur.
4. Édition sans code, composition des scènes, catalogue et migrations contrôlées.

Le laboratoire ne dispose d’aucun pouvoir serveur supplémentaire : il utilise les
mêmes créations, invitations et commandes. Les identités fictives ont chacune une
capacité distincte. Sa page est absente en production. Un accès GM reste secret ;
les liens publics ne doivent jamais contenir sa capacité.

## Limites vérifiables de cette version

Définition : 6 000 octets UTF-8 maximum ; commandes HTTP : 8 192 octets. Au plus
8 rôles, variables, phases et actions, 4 paramètres par action, 6 effets et
4 conditions d’égalité. Les versions de schéma et d’interpréteur doivent valoir 1.
Le JSON d’import est un outil technique, pas encore une interface de création
sans programmation. La configuration personnalisée et les bindings d’assets sont
acceptés par le contrat game.configure ; le panneau emploie leurs valeurs par défaut.
Les paramètres publics/privés ne sont pas distribués comme une définition brute.

L’installation ferme les inscriptions et fige les participants. Rejouer conserve
leurs accès mais remet les rôles à leurs valeurs par défaut. Réinitialiser retire
la définition, révoque les joueurs et renouvelle l’invitation. Les changements
d’effectif en cours de partie demanderont une primitive d’initialisation explicite.
Le champ phase de l’enveloppe historique reste « lobby » pour compatibilité A ;
la phase de jeu est publicGame.phase et game.phase, affichée par les interfaces.
Le relecteur de l’exemple vérifie les statuts de réception, pas les réponses d’autrui.
Seul le GM les voit toutes avant la révélation. Les comparaisons de phase et de rôle
contrôlent le panneau dynamique ; l’interpréteur contrôle à nouveau chaque commande.

Le plateau public garde le 16:9 à partir de 1 000 px de largeur. Sur les écrans
plus étroits, les cartes de jeu s’empilent sans découpe. Le placement déclaratif
des scènes n’est pas utilisé dans ce rendu initial ; les grandes quantités de
participants/valeurs demanderont des scènes ou une pagination de diffusion.
