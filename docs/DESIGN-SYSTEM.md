# Broadcast Neon — Design system

Direction validée : **Broadcast Neon, version équilibrée**. Livraison construite
sur `512d936` (Undercover 5A), vérifié sur le dépôt et les branches distantes,
sans changement du moteur, des contrats métier, des permissions ou de SQLite/SSE.
Branche : `feat/broadcast-neon-design-system`.

## Audit et décisions

La base avait trois feuilles de styles avec des couleurs littérales dispersées,
des panneaux presque identiques et 17 confirmations `window.confirm` plus une
alerte `window.alert`. Le GM mobile parcourait toutes les sections sur une longue
page ; sa barre inférieure consacrait une action à un effectif déjà figé. Les titres
étaient répétés avant les commandes. Les exemples de jeu restaient distincts des
règles réellement implémentées : seul Undercover est jouable dans sa variante 5A.

Les captures fournies montrent une première utilisation réelle d’Undercover sur
l’iPhone. Elles identifient un problème de confirmation native et de hiérarchie.
Elles ne constituent pas une validation complète du gameplay ou de cette refonte.

Décisions : surfaces sobres, accents réservés aux actions/états, libellés toujours
visibles, commandes de jeu en premier, détails repliables et navigation mobile par
sections pendant une partie. Aucune scène OBS configurable ou fonctionnalité de
jeu absente n’est simulée pour cette livraison.

## Palette et sémantique

La source de vérité est `apps/web/src/app/tokens.css`. Les autres feuilles CSS
utilisent ses variables. Les anciens alias (`--violet`, `--mint`, etc.) permettent
aux dispositions et illustrations existantes de rester compatibles.

| Token                       | Valeur       | Usage                                           |
| --------------------------- | ------------ | ----------------------------------------------- |
| `--color-background`        | `#101017`    | Fond général                                    |
| `--color-surface`           | `#191722`    | Panneaux                                        |
| `--color-surface-secondary` | `#24202F`    | Sous-panneaux, champs regroupés                 |
| `--color-surface-raised`    | `#2D273A`    | Éléments surélevés                              |
| `--color-input`             | `#14121D`    | Saisie                                          |
| `--color-text-primary`      | `#F6F3FF`    | Texte principal                                 |
| `--color-text-secondary`    | `#B7B0C7`    | Explications                                    |
| `--color-text-muted`        | `#A49BB4`    | Informations secondaires et désactivation       |
| `--color-action-primary`    | `#B396FF`    | Création, navigation et action principale GM    |
| `--color-success`           | `#38DCC8`    | Participation, réussite et synchronisation      |
| `--color-warning`           | `#F4B85D`    | Attention, redémarrage et identité Enchères     |
| `--color-danger`            | `#F179A4`    | Destruction, refus et élimination               |
| `--color-vote`              | alias corail | Vote ordinaire, toujours accompagné du mot Vote |
| `--color-info`              | `#6C9BFF`    | Information publique, test et plateau           |
| `--color-on-accent`         | `#101017`    | Libellés sur boutons colorés                    |
| `--color-border`            | `#494155`    | Séparation décorative                           |
| `--color-border-control`    | `#82758F`    | Limites interactives                            |
| `--color-focus`             | alias violet | Contour de focus                                |

Chaque accent possède une surface sombre dédiée : `primary-subtle`,
`success-subtle`, `warning-subtle`, `danger-subtle`, `info-subtle`. Les couleurs ne
sont pas des permissions : elles ne décident jamais d’une action autorisée.
Undercover garde une identité violette, Enchères ambre et Qui est l’espion menthe.
Les deux derniers restent indiqués non jouables dans le laboratoire.

## Typographie, densité et mouvements

- Police système Arial/Helvetica, sans téléchargement ; police monospace réservée
  aux outils techniques. Texte principal 16 px dans les champs et instructions.
- Espacements `--space-1` à `--space-8` (4 à 32 px), rayons `sm/md/lg/pill`.
- Contrôle normal 48 px ; format compact et bouton d’icône au moins 44 px.
- Ombres de panneau et de dialogue limitées aux plans surélevés ; aucun halo permanent
  ajouté aux commandes. Les anciennes illustrations de maquette restent conservées.
- Transitions brèves de 140/180 ms, sans délai ajouté aux commandes serveur.
  `prefers-reduced-motion` supprime les mouvements et le défilement animé.
- Les layouts existants conservent leurs règles de grille. `design-system.css`,
  importé après eux, définit les contrôles, états et ajustements opérationnels partagés.

## Composants et variantes

Les primitives légères sont dans `components/ui/primitives.tsx`. Les classes
historiques de boutons, formulaires, cartes et alertes utilisent les mêmes tokens :
leur conservation n’impose pas de réécrire tous les composants métier.

| Composant                                     | Usage                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Button`                                      | primary, secondary, neutral, success, warning, danger, vote, info, quiet ; loading et disabled |
| `IconButton`                                  | Action secondaire compacte avec libellé accessible obligatoire                                 |
| `Card`, `Panel`                               | Regroupement de contenu, sans multiplier les accents                                           |
| `Badge`                                       | État textuel avec variante sémantique                                                          |
| `Input`, `Select`, `Checkbox`                 | Éléments HTML natifs, noms accessibles conservés                                               |
| `SegmentedControl`                            | Choix de vue du laboratoire ; flèches, Début/Fin et `aria-pressed`                             |
| Navigation de sections                        | Liens avec `aria-current`, Studio latéral ou sélecteur mobile ; pas de faux onglets ARIA       |
| `Accordion` et `details/summary` existants    | Informations privées ou avancées repliables                                                    |
| `Alert` et classes `lobby-*`                  | Erreur ou attention intégrée, avec consigne de correction                                      |
| Toast de `FeedbackProvider`                   | Succès ordinaire, zone `aria-live`, fermeture manuelle ou après 5,5 s                          |
| `EmptyState`, `LoadingState`                  | État vide et chargement explicitement nommés                                                   |
| Dialogue de `FeedbackProvider` / `useConfirm` | Confirmation neutre, importante, destructive ou vote                                           |

Les composants sont observables dans `/design-system`, **uniquement en développement**.
Ce catalogue ne contrôle aucune partie. Ses requêtes de santé servent aux tests
asynchrones ; il n’ajoute aucun privilège serveur. La route retourne 404 en production.
Il s’agit d’exemples de composants, pas d’un nouveau laboratoire de gameplay.

## Dialogues et feedback

Le dialogue est un élément HTML `<dialog>` stylé, ouvert avec `showModal()`, pas
une boîte `window.confirm`. La primitive du navigateur fournit le plan modal et
l’inertie de l’arrière-plan ; React fournit contenu, états et styles. Aucun paquet
UI supplémentaire n’est nécessaire. La cible est un navigateur moderne supportant
`dialog` (Safari 15.4+ notamment) ; aucun repli vers une confirmation système.

`useConfirm()` reçoit titre, description, conséquences facultatives, libellés,
variante et opération facultative `onConfirm`. Sans opération, il renvoie un choix
pour une édition locale. Avec opération asynchrone :

1. Un verrou immédiat empêche les doubles soumissions et l’ouverture concurrente.
2. Pendant la requête, les boutons sont désactivés, `aria-busy` et un texte de
   chargement sont présents. Échap et le fond ne ferment pas une opération en cours.
3. Un succès ferme le dialogue. Un refus ou une exception le laisse ouvert avec
   une erreur. Un refus de commande conserve aussi le message précis dans la page.
4. Si le résultat réseau est incertain, fermer le dialogue puis utiliser la reprise
   existante de **la même commande** ; ne pas fabriquer un nouvel identifiant pour
   contourner un reçu. Les protections serveur sont inchangées.

Le focus va d’abord sur Annuler/Conserver, reste dans le dialogue et revient à son
élément déclencheur à la fermeture si celui-ci existe encore. Échap annule au repos.
Si l’action a retiré son déclencheur, le focus rejoint la phase ou le titre de
l’espace concerné. Une activation tactile sans focus préalable utilise le bouton
touché comme point de retour.
Le clic sur le fond n’accepte et ne ferme jamais une action critique. Un changement
de route annule une confirmation non exécutée. Sur mobile, le panneau est bas,
défilable et borné par le viewport visible et les safe areas.

### Appels natifs remplacés

| Zone                        | Anciennes interactions remplacées                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `play-panel`                | Vote individuel/délégué ; Rejouer cette partie                                                      |
| `game-action`, `game-panel` | Action configurée avec confirmation ; rejeu v1/v2                                                   |
| `session-room`              | Retrait d’un joueur ; réinitialisation du salon                                                     |
| `creator-actions`           | Suppression de saisie, règle composée, action ; alerte de saisie référencée devenue message intégré |
| `creator-effects`           | Suppression d’une conséquence                                                                       |
| `creator-collections`       | Suppression de rôle, donnée et étape                                                                |
| `creator-assets`            | Retrait de référence sans effacer le fichier source                                                 |
| `creator-versions`          | Enregistrement d’une version privée figée                                                           |
| `use-creator-draft`         | Charger la copie enregistrée en conservant une sauvegarde locale                                    |

Le redémarrage du laboratoire utilise également cette confirmation importante.
Les avertissements **natifs de sortie avec des modifications non enregistrées**
(`beforeunload`) restent contrôlés par le navigateur. Les dialogues de sécurité,
d’autorisations système et le nom d’hôte affiché dans la barre Safari sont également
hors du contrôle de l’application. Aucun indicateur Next.js n’est masqué.

## Régie mobile

Une partie active affiche le jeu, la phase, l’effectif puis les commandes. À moins
ou égal à 999 px, Session/Joueurs/Jeu/Plateau présentent une seule section de contenu
à la fois, sans perdre les champs saisis. Les liens et fragments existants sont
conservés. Le salon avant installation reste accessible avec ses contrôles existants.
Sur ordinateur, les sections restent visibles et les liens permettent de les atteindre.

La préparation est violette, la discussion menthe, le vote corail et le résultat bleu.
Ces états sont dérivés de la projection autorisée, sans changer les règles du moteur.
Les cartes montrent attente, activité, élimination et progression de vote ; la présence
n’est affichée qu’à partir du booléen réel de connexion. Les rôles cachés restent cachés.
La carte de jeu est aussi utilisée dans le laboratoire, avec la même projection.

La barre inférieure conduit aux commandes et au plateau pendant une partie. Elle ne
présente plus un faux bouton principal désactivé « Effectif figé ». Les commandes de
rejeu et de réinitialisation restent distinctes. Safe areas, défilement, focus et
hauteur réduite sont pris en compte. Le viewport visuel permet de relâcher les barres
fixes lorsqu’un clavier réduit la hauteur disponible. Le comportement exact du clavier
Safari doit encore être testé sur l’iPhone réel.

## Contrastes mesurés

Les tests lisent les tokens effectifs et calculent la luminance WCAG, sans arrondir
avant comparaison. Ils exigent 4,5:1 pour les textes courants/secondaires/désactivés
sur les cinq surfaces et 3:1 pour les limites des contrôles.

| Association                             | Ratio   |
| --------------------------------------- | ------- |
| Texte principal / surface               | 16,16:1 |
| Texte secondaire / surface surélevée    | 6,87:1  |
| Texte atténué / surface surélevée       | 5,42:1  |
| Texte sombre / violet                   | 7,87:1  |
| Texte sombre / menthe                   | 11,04:1 |
| Texte sombre / ambre                    | 10,70:1 |
| Texte sombre / corail                   | 7,23:1  |
| Texte sombre / bleu                     | 7,01:1  |
| Bordure de contrôle / surface surélevée | 3,34:1  |

Les bordures décoratives ne servent pas seules à identifier un contrôle. Un style
focus visible, un libellé et un état accessible restent nécessaires. Ces mesures
et tests clavier ne constituent pas un audit WCAG complet ou une certification VoiceOver.

## À éviter

Ne pas ajouter de couleurs dans les composants, de boîte système applicative,
de bouton « OK » ambigu, de succès uniquement coloré, d’action fictive ou de projection
publique dérivée d’un état secret reçu par le spectateur. Ne pas afficher une erreur
comme une simple notification fugitive. Ne pas réutiliser danger pour tout vote :
le contexte et les textes distinguent le vote ordinaire d’une action destructive.
Ne pas publier les accès privés visibles dans une vue GM.

## Vérification et limites de livraison

Le bilan final des commandes et les captures est dans [le guide de validation](TEST-BROADCAST-NEON.md).
Aucun changement du serveur, du moteur ou des règles 5A n’est nécessaire. Les interfaces
de création, de jeu et de laboratoire gardent leurs API réelles. Enchères et Qui est
l’espion restent non jouables. Pas de 4C, Store, paiement ou nouvelle dépendance.
Les tests Chromium sont distingués d’un appareil physique ; VoiceOver, clavier Safari,
OBS réel, ergonomie et plaisir du gameplay demandent encore une validation humaine.
