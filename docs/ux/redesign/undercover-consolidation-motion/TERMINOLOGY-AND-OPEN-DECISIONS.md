> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Vocabulaire et décisions restant ouvertes

État des nouvelles propositions : **AWAITING_APPROVAL**. Ce document n’implémente ni ne décide de nouvelles conséquences serveur.

## Correspondance avec l’existant

| Niveau produit proposé | Sens | Élément existant observé | Conséquence UX proposée |
|---|---|---|---|
| Jeu | Undercover | Module officiel Undercover | Aucun autre jeu conçu |
| Partie | Ensemble préparé par le GM | Série locale nommée | Ma partie Undercover |
| Manche préparée | Une paire A/B et ses réglages | Préparation locale ; une partie moteur courante | Ajouter / modifier / réutiliser une manche |
| Cycle d’élimination | Indices puis vote, même paire, joueurs encore actifs | `play.round`, aujourd’hui parfois libellé Manche | Nouveau cycle / même paire ; vocabulaire à valider |
| Tour d’indices | Tour oral à l’intérieur du cycle | `play.turns.round` et `play.turns.total` | Tour d’indices 1/2 |

Le maximum de manches existant dans les réglages moteur borne les cycles d’élimination avec la même paire. Il ne doit pas devenir un nombre de paires préparées. Un futur renommage UX doit préserver sa fonction réelle.

La commande existante `undercover.next` sélectionne la préparation suivante : elle correspondrait à **Manche suivante** dans le nouveau vocabulaire. Le rejeu `game.restart` correspondrait à **Rejouer cette manche**, sans avancer le conducteur. La progression interne d’un round conserve la même paire : ne pas la nommer aussi Manche suivante. Aucun de ces identifiants ou comportements n’est modifié ici.

## Capacités conservées

Nommage, préparations multiples, édition A/B indépendante, ajout, ordre, duplication, réutilisation par copie et disponibilité d’image sont intégrés. La nouvelle demande ajoute une confirmation sobre au retrait dans la proposition UX ; elle ne supprime pas les capacités existantes.

Les layouts TV v2 existent et les layouts v1 conservent leur renderer et leurs coordonnées. L’adoption proposée est explicite pour une ancienne disposition ; les nouvelles préparations présentent le TV moderne comme choix normal. Aucun layout enregistré n’est migré dans ce chantier.

## Hypothèses de cycle de vie à arbitrer avant intégration

| Intention UX | Portée à rendre compréhensible | Décisions backend non prises |
|---|---|---|
| Mettre en pause / reprendre | Suspension réversible de l’expérience en cours | Commandes bloquées, votes reçus pendant la pause, chronologie, accès, indications aux joueurs/public et reprise après déconnexion |
| Terminer la manche | Clôture volontaire de la paire active avant le résultat automatique | Résultat ou absence de résultat, révélation des contenus/rôles, reprise possible, passage suivant et conservation des données |
| Terminer la partie | Clôture de l’ensemble préparé, distincte de la manche courante | Sort des manches non jouées, état du salon, accès, historique disponible et réouverture |
| Abandonner / annuler | Sortie exceptionnelle avec confirmation | Portée exacte, données conservées, possibilité de reprise, révocation ou non des accès ; ne pas assimiler au reset |

Les confirmations de maquette expriment une intention et sa portée. Elles ne promettent ni vainqueur, ni révocation d’accès, ni publication de secrets, ni suppression de données. Conserver les préparations et l’historique déjà disponibles est une intention du brief ; les garanties précises doivent être définies dans la future mécanique autoritaire.

## Navigation et catalogue

La route /play existe et possède des liens entrants réels depuis le cadre produit, la reprise et le conducteur. Le choix de ne pas produire une nouvelle maquette de catalogue est une recommandation de périmètre : privilégier le retour contextuel et un seul accès de préparation Undercover. Il ne signifie pas que la route est supprimée ou inutile techniquement. Les liens à raccorder devront être listés avant une intégration future.

## Mouvement et autorité

Les prototypes peuvent démontrer la transition vers une nouvelle manche avec ses deux contenus uniquement lorsque ces contenus sont déjà autorisés dans la projection publique courante. Le conducteur privé ne doit pas devenir une source d’animation publique.

Une transition événementielle et son état durable sont deux choses différentes : l’ouverture tardive montre l’état courant sans forcément rejouer le moment historique. Le démonstrateur illustre cette intention ; il ne valide pas la persistance, les reçus, SSE ou le moteur d’une future implémentation.
