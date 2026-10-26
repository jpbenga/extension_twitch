> Historique technique conservé. Depuis le jalon 6, la vision active est un catalogue fermé de jeux prêts à jouer ; la création libre et le Store sont retirés du produit. Voir [PRODUCT.md](PRODUCT.md) et [STAGE-6.md](STAGE-6.md). Les primitives internes et données restent conservées.

# Studio Créateur visuel — 4B

> Document historique du jalon 4B. Pour l’interface actuelle, consulter
> [le bilan 4B.1](STAGE-4B1.md) et [le guide de test actuel](TEST-STUDIO-4B1.md).

Base vérifiée : `80cc82f`, branche de travail `feat/creator-studio-4b`.

## Architecture retenue

Les trois parcours éditent le même GameDefinition. Les formulaires produisent les
contrats existants ; le serveur conserve validation, permissions, transactions,
versions immuables, filiation et projections. Aucun interpréteur dans le navigateur.
Les descriptions facultatives de rôles, actions et phases enrichissent uniquement
les métadonnées, sans migration des anciennes définitions.

L’édition visuelle conserve l’arbre complet. Une modification cible uniquement le
champ choisi ; les expressions non modifiées et les scènes restent intactes. Le
JSON est un recours secondaire explicite. Les erreurs de type, référence, secret ou
quota bloquent la sauvegarde, tout en conservant le travail local. La suppression
d’un élément référencé est refusée ; aucune cascade implicite. Les identifiants
existants restent stables.

Le constructeur récursif couvre les opérateurs v2 bornés : calcul entier,
comparaisons et logique. Différent, supérieur et inférieur ou égal se composent
avec les opérateurs existants. Les gardes ne lisent pas les paramètres d’entrée,
car les actions disponibles sont projetées avant leur saisie. Les effets les
lisent. Une définition v1 exige une conversion explicite avant ajout d’expressions.

Les transitions sont des actions avec nextPhase, éventuellement gardées. Aucun
workflow parallèle, déclencheur automatique, équipe, minuteur ou événement
personnalisé n’est présenté comme fonctionnel. L’apparence conserve scènes et
assets logiques ; leur éditeur graphique appartient à 4C.

## Incréments vérifiables

1. Éditeurs de rôles, variables, actions, expressions, effets et phases ; mêmes
   sauvegardes, conflits et publications que 4A.
2. Essai réel du brouillon figé : GM, joueurs fictifs à accès distincts, invitation
   pour appareils réels et plateau. Seulement les API normales ; aucun privilège
   de simulation serveur. Les inscriptions précèdent l’installation.
3. Guide progressif limité aux modèles exécutables, puis passage au Studio avancé.
4. Tests de comportements, responsive et guide humain reproductible.

Validation humaine iPhone en attente. Les résultats techniques et limites de la
livraison sont consignés dans le guide de test 4B.

## Livraison effective

- Navigation latérale sur ordinateur, menu compact sur téléphone/tablette ;
  formulaires tactiles et barre de sauvegarde persistante.
- Rôles et descriptions, variables entières/texte/booléennes, portées et visibilité,
  paramètres d’action, permissions, égalités et expressions composées v2, effets
  ordonnés, phases et transitions par actions. Activation v2 explicite depuis un
  modèle v1. Les références empêchent les suppressions involontaires.
- Bibliothèque, variantes depuis le catalogue, une installation ou une version
  personnelle ; sauvegardes et publications privées inchangées.
- Guide en trois étapes, modèles compteur collectif et réponses privées ; retour
  aux étapes sans perte des choix. Une création avancée incompatible avec la recette
  du compteur ne peut pas être écrasée par ce guide.
- Essai isolé depuis un brouillon validé : deux joueurs fictifs à capacités distinctes,
  invitation pour appareils réels, installation, liens GM/joueurs/plateau et sonde
  de refus 403. Les modifications ultérieures ne changent pas cet instantané.
- Brouillons locaux, avertissement de départ, validation lisible, conflits et copie
  de sauvegarde conservés. Les échecs réseau ne suppriment pas la saisie.

## Contrats et composants

GameDefinition conserve ses versions v1/v2. Les seules additions sont les
métadonnées `description` facultatives des rôles/actions/phases. `creatorTestSchema`
accepte `draftRevision` facultative : un conflit est refusé avant création de la
session. Aucun nouvel opérateur, effet, format de sauvegarde ou migration SQLite.

`creator-editor` conserve la sauvegarde 4A ; `creator-visual` organise les sections.
`creator-collections`, `creator-actions`, `expression-editor`, `creator-effects`
et `creator-fields` éditent les primitives. `creator-model` analyse erreurs,
références et chemins de phases. `creator-guide` et `creator-test` orchestrent les
parcours ; `use-creator` reste le seul accès propriétaire à la bibliothèque.

## Vérifications exécutées

- `npm run check` : Prettier, 87 tests unitaires/intégration, TypeScript strict et
  compilation réussis. Les 77 tests de référence sont conservés.
- Chromium : 57 parcours réussis, dont les 45 précédents, en 390×844, 768×1024 et
  1440×1000. Création sans JSON, variantes, effets réellement exécutés, transitions,
  trois projections, refus de permission, conflits, publications et confidentialité.
- `npm run test:lab` avec Chromium système : 1 parcours réussi.
- Les captures des formats mobile et tablette ont été examinées ; aucune validation
  physique iPhone/Safari iOS, Wi-Fi personnel ou OBS n’est revendiquée.

## Limites et suites proposées

[Le guide humain](TEST-STUDIO-4B.md) contient les étapes et résultats attendus.
Pas de Store, assistant universel, équipe, vote à candidats, correction de quiz,
transition automatique, événement personnalisé ou éditeur graphique de scènes.
Les assets restent logiques avec remplacements ; aucun média n’est récupéré.
Les quotas de 4A demeurent, notamment 6 000 octets par définition et profondeur 4.
Un document technique illisible reste intact et doit être corrigé explicitement
avant de reprendre les formulaires. Les liens privés d’essai restent en mémoire
jusqu’au rechargement : les conserver pour reprendre les sessions persistantes.

Prochain incrément recommandé : validation humaine iPhone et corrections ciblées,
puis décision explicite sur 4C et/ou l’extension des primitives du moteur. Aucun de
ces travaux n’est commencé automatiquement. Validation humaine iPhone en attente.
