# Jalon 5 — audit et architecture de la première verticale

Base vérifiée : `26b0202`, branche propre `feat/creator-studio-ux-4b1`.
Travail dédié : `feat/official-games-playable`.

## Audit et périmètre

À la base vérifiée, les modules de jeux étaient des descripteurs sans moteur de règles. Le moteur commun
v1/v2 traite des valeurs scalaires, actions et expressions, mais pas des cibles
joueurs, votes, distributions, éliminations ou fins de partie. Le laboratoire 4B.1
inscrit deux identités et installe une définition réelle ; sa limite est trop basse
pour Undercover. Les accès, reçus, SQLite, SSE et projections seront réutilisés.

Priorité à une verticale Undercover complète (5A), puis extension du même socle vers
5B/5C. La bibliothèque et ses exemples existants restent fonctionnels. Aucun nom
seul dans le catalogue ne sera présenté comme un jeu jouable. Les propositions des
deux autres jeux sont dans OFFICIAL-GAMES-RULES.md ; elles ne deviennent pas des
implémentations par leur seule présence dans ce document.

## Évolution déclarative v3

Un GameDefinition v3 conserve les champs v1/v2 et ajoute des primitives bornées :
distribution binaire privée, scrutin nominatif, résolution/élimination, tour et
comparaisons des effectifs de rôles pour déterminer une fin. Les actions font
référence à ces opérations déclarées. L’interpréteur n’utilise jamais l’identifiant
Undercover pour choisir les règles ; un futur jeu personnel peut utiliser les mêmes
primitives. Aucune exécution de JavaScript utilisateur.

Les opérations de gestion demandent toujours une autorité GM serveur, même si une
définition malveillante les attribue à un rôle joueur. Le scrutin traite uniquement
les identités authentifiées et les actifs ; la projection fournit les choix valides.
La distribution privée est générée dans la transaction qui conserve le résultat et
le reçu de commande. Rejouer utilise un nouvel identifiant de partie.

La distribution, le scrutin et les conditions de fin sont facultatifs et indépendants.
Un test exécute un autre jeu : désigner un porte-parole sans distribution, camp
minoritaire, élimination ou résultat final obligatoire. Le scrutin peut sélectionner
ou éliminer ; la variante Undercover choisit l’élimination. Pas de minuteur, quorum
partiel, vote pondéré ou calcul d’enchère dans cette livraison.

Une fin révèle les camps ; les données privées demandent une autorisation de la
seule condition atteinte. Une partie nulle possède sa propre liste explicite de
révélation. Un test de régression empêche qu’une autre fin autorise une fuite.
Les effets GM de révélation déjà disponibles restent utilisables pour une information
explicitement autorisée, sans révéler automatiquement les mots distribués.
Le journal public décrit les opérations connues sans recopier les libellés d’actions
privées : un nom d’action disponible pour un seul rôle ne doit pas trahir ce rôle.
Les refus sont renvoyés uniquement à l’auteur de la commande, sans journal public.

L’état des primitives fait partie du GameRun persistant existant ; ce n’est pas un
deuxième moteur ou stockage. Les anciennes sessions n’ont pas ce champ et conservent
leurs contrats. Le langage v3 est explicite et ses références/permissions sont
vérifiées avant installation. Les paramètres privés ne figurent jamais dans les
projections publiques, ni dans les paramètres d’une action joueur ou le journal.

Les composants réutilisables affichent cartes privées, candidats de vote, progression,
résolution et résultat à partir de projections déjà autorisées. Ils ne calculent
ni camp, ni élimination, ni victoire. Le plateau reçoit exclusivement la projection
publique, y compris lorsqu’il est prévisualisé depuis la régie.

## Laboratoire

Entrée dédiée : `/creator/play`, accessible depuis l’accueil du Studio. Configuration
simple puis création et inscription via les mêmes API. Quatre joueurs de démonstration
pour Undercover, un jeton chacun ; invitation réelle comme parcours distinct.
Le laboratoire multi-rôles demeure l’outil du GM, pas un lien à partager aux joueurs.
Les participants réels utilisent uniquement leur invitation et leur accès individuel.
Aucune route de simulation privilégiée n’est ajoutée au serveur de production.

La configuration choisie avant lancement est conservée dans l’accès privé du laboratoire,
puis installée dans le GameRun par les API normales. Les effectifs réels sont contrôlés à l’installation,
notamment dans le parcours d’invitation : deux inscrits ne suffisent pas pour Undercover.
La délégation permet au GM de voter pour un joueur déjà inscrit, sans créer de fausse
identité ou remplacer un vote déjà émis. Une nouvelle partie crée de nouveaux accès ;
recommencer conserve ceux de la partie courante avec un nouvel identifiant de jeu.

Le sélecteur du laboratoire est recommandé en HTTP local. Trop d’onglets SSE dans
le même contexte de navigateur peuvent atteindre son quota de connexions persistantes
et retarder les commandes. Les tests de plusieurs appareils utilisent donc des
contextes de navigateur séparés. Les protections anti-abus restent actives ; chaque
série de formats démarre ses propres services et sa base temporaire.

## Éléments livrés

| Élément                             | Emplacement principal                                       | Comportement effectif                                                                       |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Définition officielle expérimentale | `packages/games/undercover/src/definition.ts`               | Distribution, discussion, vote, élimination, deux victoires, partie nulle et rejeu          |
| Contrats v3                         | `packages/contracts/src/mechanics.ts`, `game-definition.ts` | Opérations bornées, validation des références, projections strictes                         |
| Primitives communes                 | `packages/engine/src/mechanics.ts`, `configurable.ts`       | Exécution atomique, aléatoire serveur, vote unique, confidentialité et résultat             |
| Commandes du salon                  | `packages/engine/src/lobby.ts`                              | Journal humain sans secrets et vote délégué GM ; reçus/SQLite/SSE existants                 |
| Lancement                           | `/creator/play`, `official-games-lab.tsx`, `creator-lab.ts` | Démo avec 3–12 joueurs ou invitation réelle sans compte                                     |
| Interfaces partagées                | `play-panel.tsx`, `public-session.tsx`                      | Carte privée, choix nominatif, votants attendus, décompte, plateau public                   |
| Studio                              | `creator-play-rules.tsx`                                    | Variante indépendante ; modifier mots, effectifs, options du vote et conditions de résultat |

Les noms et descriptions des actions/étapes viennent de la définition. Le serveur
calcule tous les résultats. Les compteurs de disponibilité du salon ne sont plus
présentés comme des contrôles de gameplay pendant cette partie. Les routes et
composants des créations v1/v2 restent disponibles.

## Vérifications exécutées

Dernier passage local sur le code livré, le 23 octobre 2026 (Node.js 24 et Chromium).

| Commande             | Résultat                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `npm run check`      | Réussi : formatage, **107 tests** sur 14 fichiers, TypeScript strict et compilation          |
| `npm run test:games` | **12 réussis** : quatre parcours × trois formats                                             |
| `npm run test:e2e`   | **78 réussis** : 26 parcours existants × trois formats                                       |
| `npm run test:lab`   | **3 réussis** en développement, dont Undercover ; aucune erreur console/hydratation observée |

Les commandes navigateur utilisent ici
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Le workflow CI inclut
désormais les trois suites navigateur ; son exécution distante n’est pas revendiquée
par ces résultats locaux. `git diff --check` et le contrôle final de formatage sont
également réussis. Les 90 tests unitaires/intégration et 78 parcours de référence
sont conservés ; 17 tests unitaires/intégration et 12 parcours de gameplay s’ajoutent.

Les nouveaux tests moteur couvrent bornes, confidentialité, distribution unique,
permissions, phase, cibles invalides, vote unique, égalités, éliminations, victoires,
partie nulle, nouvelle partie, variantes et indépendance des primitives. Les tests
HTTP vérifient reçus, concurrence, usurpation refusée, délégation et SSE. Un test
arrête et redémarre réellement le processus serveur sur le même fichier SQLite,
puis reprend le vote et le résultat avant de rejouer.

Les parcours Chromium terminent une partie avec plusieurs clients authentifiés
isolés, comparent le plateau public, testent une victoire Undercover, une victoire
civile, une égalité et une reconnexion. Ils personnalisent aussi les règles via le
Studio et utilisent de vrais liens d’invitation (3 navigateurs sans compte). Le
parcours de variante enregistre aussi une version figée et vérifie ses métadonnées
d’export v3 sans contenu privé, via les mêmes contrats de bibliothèque. Le
plateau est mesuré en 1920 × 1080 ; les trois formats vérifient le parcours et la
largeur. Les tests de développement capturent les erreurs de console/hydratation.

Captures issues de ces essais (données fictives, Chromium) :
[régie mobile](screenshots/5a/regie-mobile.png),
[carte joueur mobile](screenshots/5a/joueur-mobile.png),
[laboratoire mobile](screenshots/5a/laboratoire-mobile.png),
[régie ordinateur](screenshots/5a/regie-desktop.png) et
[plateau final 1920 × 1080](screenshots/5a/plateau-final-1920.png).

## Limites et validation humaine

- **5A livré ; 5B et 5C non implémentés.** Le laboratoire unifié 5D sera complété
  avec ces deux verticales. Les propositions de règles ne valent pas livraison.
- Les camps de la variante Undercover sont cachés à leur porteur ; le GM voit les
  données de gestion. Les règles sont expérimentales, explicites et configurables.
- Tous les actifs doivent voter. Une déconnexion ne déclenche ni vote ni élimination
  automatique. Pas de minuteur, pause chronométrée, rôle blanc, annulation après
  révélation ou communication vocale intégrée.
- La délégation GM fonctionne pour les inscrits. L’inscription manuelle de personnes
  sans navigateur et la remise confidentielle automatisée hors plateforme restent
  absentes ; ce n’est pas encore tout le mode animé envisagé pour la V1.
- Le Studio peut personnaliser ces primitives à partir du modèle ; leur création
  structurelle complète depuis une page blanche n’est pas encore un assistant visuel.
- Le laboratoire est un outil privé du GM. Un joueur réel reçoit seulement son lien,
  jamais le laboratoire qui permet de sélectionner toutes les identités démo.
- Le journal public contient les vingt événements récents, sans mots ni choix
  individuels ; ce n’est pas un récapitulatif complet de tous les scrutins passés.
- Conserver les capacités d’accès privées : toujours pas de comptes ni récupération
  par e-mail. Les limites de déploiement du README restent applicables.
- Le plateau sombre fonctionne dans le navigateur ; pas de promesse d’overlay
  transparent, de scène éditable ou d’animation avancée. Le rendu à 12 joueurs et
  avec de très longs noms/mots mérite une validation humaine particulière.
- Aucun test physique iPhone, Safari iOS ou OBS, ni validation humaine du gameplay.
  Le premier test humain de l’ancien Studio avait montré des difficultés ; la
  refonte 4B.1 et cette nouvelle verticale attendent vos retours.

Guide reproductible : [TEST-OFFICIAL-GAMES.md](TEST-OFFICIAL-GAMES.md). Aucune
connexion Twitch, transaction payante, image protégée ou dépendance externe ajoutée.

## Suite recommandée

1. Tester le rythme, les mots privés, le vote et les confirmations sur l’iPhone réel.
2. Livrer 5B : ressources, meilleure offre, clôture et attribution confirmée atomique.
3. Livrer 5C : questions ciblées et accusation sur un lieu secret, distinctes d’Undercover.
4. Compléter le sélecteur des trois jeux et leurs tests dans 5D. Garder 4C/Store reportés.
