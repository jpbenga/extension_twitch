# Studio configurable — décision d’architecture

Statut : architecture adoptée. Historique v1/v2 ci-dessous ; évolution v3 au jalon 5A en fin de document.
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

## Évolution 4A — format v2 et bibliothèque

V1 reste inchangé pour ses définitions et sessions. V2 ajoute des arbres bornés
d’expressions et gardes ; sa version de schéma et de moteur valent 2. Voir
[la décision du Studio](STAGE-4A.md) et [les tests humains](TEST-CREATOR.md).
La propriété d’un brouillon appartient à une bibliothèque privée protégée par
capacité. Les versions publiées restent privées, séparées d’un futur listing Store.
Les parties de test utilisent le même moteur, API, SQLite et projections que les
autres sessions ; leur définition est figée avant inscription des joueurs.
Les cartes d’exemples restent pédagogiques ; les règles officielles ne sont pas
validées par ces modèles. Aucun second moteur n’est créé pour le guide.

## Évolution 5A — primitives de gameplay v3

Le format v3 garde les expressions v2 et ajoute `mechanics` et les `operations`
des actions. Les définitions v1/v2 ne changent pas. Voir [le bilan 5A](STAGE-5.md)
et [les règles expérimentales](OFFICIAL-GAMES-RULES.md).

- Distribution binaire : rôles, nombre minoritaire et références de données privées
  déclarés, mélange cryptographique serveur, une seule distribution par partie.
- Vote nominatif : choix d’une identité active, vote unique authentifié, option de
  vote pour soi, progression publique et choix individuel privé. Résolution après
  tous les votes : sélection simple ou élimination ; égalité sans vainqueur.
- Tours et fins : passage de tour explicite, comparaison d’effectifs de rôles,
  premier résultat correspondant prioritaire, limite de tours facultative.

Ces primitives sont indépendantes : un vote de sélection fonctionne sans distribution,
camp minoritaire, élimination ou fin automatique. Les tests l’exécutent sur une autre
définition. Aucun branchement sur `definition.id` ne choisit les règles du moteur.
Le modèle Undercover n’est qu’une composition de ces mêmes opérations. Une variante
du Studio peut en changer les options et les conditions de fin.

Les opérations sont bornées : 12 joueurs, une distribution, deux scrutins, quatre
conditions de fin et une opération par action. Les autres bornes du langage restent
appliquées. Les votes nominaux ont une cible UUID validée contre la liste réelle
des actifs ; ils ne donnent pas un droit générique de modifier les données d’autrui.
La délégation GM passe par une commande normale explicitement autorisée par le
scrutin et applique les mêmes validations de joueur.

Les camps sont révélés à la fin d’une partie utilisant ces conditions de résultat.
Une élimination ne révèle le camp que si le scrutin l’autorise. Les autres données
privées ne sont déclassifiées que par `revealVariables` de la **seule condition de
fin atteinte**, ou par `drawRevealVariables` explicitement déclaré pour une partie
nulle. Une condition non atteinte ne peut autoriser aucune fuite d’information.
Le vote public contient seulement les votants, jamais la table des choix individuels.
Le journal public utilise des messages d’opérations connus, sans recopier le nom
d’une action privée ou ses paramètres. Un libellé réservé à un rôle caché ne peut
ainsi révéler son porteur. Les refus restent dans la réponse privée au demandeur.

`GameRun.play` utilise le même snapshot SQLite et la même transaction avec reçu ;
aucune nouvelle table ni migration SQL. La version et les références sont validées
avant installation. Une ancienne partie reste figée sur sa définition v1/v2. Le
rejeu repart d’un nouvel identifiant avec la même définition/configuration et les
mêmes capacités d’accès, sans conserver votes, secrets distribués ou éliminations.

## Refonte globale — suivi générique de tours de parole

Extension additive du schéma v3 :

```text
mechanics.turns = { phase, roundsConfiguration }
action.operations = [{ type: "turn.advance" }]
ballot.requireTurns = true  (facultatif)
```

La configuration du nombre de répétitions doit être un entier **public**, borné
entre 1 et 5. Le validateur contrôle les références et exige une action de passage
dans la bonne étape. Cette action est réservée aux rôles base GM et ne peut avoir
une transition concurrente. À l’entrée dans l’étape (ou à une nouvelle manche), le
moteur capture l’ordre des actifs. Chaque confirmation avance une position ; le
passage du dernier joueur incrémente le tour jusqu’au total configuré. Aucun texte
oral n’est stocké et aucune interface ne confirme automatiquement un joueur absent.

La projection contient ordre, tour/total, passages confirmés et prochain participant,
jamais les mots. Le scrutin marqué `requireTurns` n’est ni proposé au GM ni accepté
par l’interpréteur avant la fin de la séquence. Les passages validés sont liés à la manche courante : une transition vers une autre
étape ne peut réutiliser les indices d’une manche précédente. Le suivi est optionnel, sans mutation
rétroactive des définitions. Rejeu et reprise utilisent les mêmes reçus et snapshots.
Les tests couvrent aussi reprise après un vrai redémarrage au milieu des passages.

Le modèle Undercover 0.2.0 configure deux tours ; une autre définition peut employer
la même primitive pour un tour de table oral. L’éditeur existant permet de changer
le nombre du modèle et conserve les opérations ; il ne sait pas encore créer ces
structures depuis zéro sans JSON. Voir l’audit de reproductibilité.
