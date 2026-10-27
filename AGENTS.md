# AGENTS.md — Instructions de développement

## 1. Contexte

Ce dépôt contient le projet extension_twitch, une plateforme SaaS permettant aux streamers Twitch de produire des émissions interactives.

Avant toute modification importante, consulter :

* docs/PRODUCT.md : vision produit et exigences fonctionnelles.
* Le README du dépôt.
* Les fichiers de configuration et conventions déjà présents.

Ne pas considérer les exemples fonctionnels comme des règles définitives lorsque le cahier des charges précise qu’un sujet reste à définir.

## 2. Périmètre de la V1

La cible de catalogue comprend les trois premiers jeux :

* Undercover.
* Enchères de personnages.
* Qui est l’espion ?

Le jalon 6 autorise une première offre commerciale plus étroite, explicitement validée, avant environ dix expériences officielles. Ne pas déclarer un jeu inachevé jouable.

Le développement peut être organisé progressivement, mais l’architecture doit prendre en charge les trois modules.

## 3. Architecture générale

Privilégier une architecture TypeScript modulaire.

Stack initiale envisagée :

* TypeScript.
* React.
* Next.js pour l’application web.
* Un moteur de jeu indépendant des composants visuels.
* Une couche de communication temps réel.
* Une persistance serveur adaptée aux sessions.
* Des tests unitaires et d’intégration.

Ces choix sont des orientations, pas une autorisation à ajouter des dépendances complexes sans justification.

L’architecture doit permettre de faire évoluer séparément :

* La régie Game Master.
* Les overlays OBS.
* L’extension Twitch.
* Les interfaces joueurs.
* Le moteur de jeu.
* Les modules de règles.

## 4. Source de vérité

L’état autoritaire d’une partie doit être géré côté serveur.

Les interfaces clientes ne doivent pas décider seules :

* Des résultats.
* Des budgets.
* Des scores.
* Des éliminations.
* Des rôles secrets.
* Des achats.
* Des transitions critiques.

Utiliser une approche basée sur des commandes validées et des événements de changement d’état.

Les règles doivent être testables indépendamment des interfaces.

## 5. Modules de jeu

Chaque jeu doit posséder ses propres :

* Types et configurations.
* États.
* Commandes.
* Validations.
* Transitions.
* Conditions de victoire.
* Tests.

Le moteur commun doit gérer les mécanismes transversaux.

Éviter les dépendances directes entre les modules des différents jeux.

## 6. Règles fonctionnelles importantes

### Enchères

Une proposition d’enchère ne débite pas immédiatement le budget.

Le débit intervient uniquement lors de la confirmation de l’attribution.

Prévoir une gestion cohérente des corrections et annulations.

### Undercover et espionnage

Les informations secrètes ne doivent jamais être incluses dans les données envoyées aux interfaces publiques.

Chaque joueur connecté doit recevoir uniquement les informations auxquelles il est autorisé à accéder.

### Modes de participation

Prendre en compte :

* Mode animé.
* Mode connecté.
* Mode hybride.

Le Game Master doit pouvoir agir pour les joueurs non connectés lorsque les règles le permettent.

## 7. Intégration Twitch

Prévoir une séparation claire entre :

* Les événements internes du jeu.
* Les événements provenant de Twitch.
* Les interactions gratuites.
* Les interactions monétisées.

Les événements externes doivent être validés avant toute modification de l’état du jeu.

Les interactions Bits doivent être configurables par le Game Master, dans les limites des capacités et règles Twitch.

Ne jamais considérer une déclaration du navigateur comme une preuve de paiement.

Prévoir une protection contre le traitement multiple d’une même transaction.

Ne pas intégrer de paiements réels sans demande explicite et validation de la conception.

## 8. Interfaces

### Régie Game Master

* Responsive.
* Adaptée aux écrans tactiles.
* Utilisable pendant un direct.
* Actions principales clairement identifiables.
* Confirmation des opérations sensibles.
* Retour visuel immédiat après une action.
* Gestion des erreurs et reconnexions.

### Overlay OBS

* Rendu adapté au 16:9.
* Possibilité de fond transparent.
* Animations adaptées à la diffusion.
* Aucune information secrète exposée.
* Pas de dépendance à des contrôles interactifs du spectateur.

### Interfaces joueurs

* Mobile-first.
* Navigation simple.
* Accès aux informations individuelles.
* Gestion des déconnexions.

### Extension Twitch

* Interface spectateur distincte de la régie.
* Compatibilité avec les contraintes techniques Twitch.
* Aucune logique métier critique exécutée uniquement côté client.

## 9. Qualité du code

* Activer les vérifications strictes TypeScript.
* Éviter any sauf justification explicite.
* Préférer des composants et fonctions de taille raisonnable.
* Séparer logique métier et présentation.
* Valider les données entrantes.
* Gérer explicitement les erreurs.
* Éviter la duplication des règles.
* Documenter les décisions d’architecture importantes.

## 10. Tests

Prévoir des tests pour :

* La validation des commandes.
* Les transitions de phases.
* Les budgets et enchères.
* Les rôles et informations secrètes.
* Les permissions.
* Les interactions simultanées.
* La non-duplication des événements.
* Les corrections et annulations.

Ajouter des tests de régression lors de la correction de bugs importants.

Exécuter les vérifications disponibles avant de proposer une modification.

Ne jamais annoncer qu’un test a réussi s’il n’a pas été exécuté.

## 11. Développement initial

Pendant l’initialisation du dépôt :

* Créer une application exécutable.
* Mettre en place la structure des modules.
* Fournir une régie de démonstration.
* Fournir un overlay de démonstration.
* Prévoir des participants simulés.
* Éviter les services externes payants.
* Ne pas demander de secrets Twitch.
* Ne pas implémenter de paiements réels.
* Préparer l’architecture pour les intégrations futures.

Le mode démonstration doit être clairement identifié comme tel.

## 12. Sécurité et confidentialité

* Ne jamais committer de secrets.
* Utiliser des variables d’environnement.
* Vérifier les permissions côté serveur.
* Ne pas exposer les rôles secrets dans les réponses publiques.
* Limiter l’accès aux données des sessions.
* Valider les fichiers importés.
* Prévoir des protections contre les abus et les commandes répétées.

## 13. Contenus et images

Ne pas ajouter au dépôt d’images de personnages de mangas ou d’animés protégées sans autorisation appropriée.

Prévoir un mécanisme permettant aux utilisateurs d’importer leurs propres images.

Utiliser des contenus fictifs ou des placeholders pour les démonstrations techniques.

Ne pas remplacer arbitrairement les noms de personnages connus dans les exigences produit : le système doit permettre l’utilisation de noms saisis par les utilisateurs.

## 14. Méthode de travail Codex

Pour chaque tâche :

1. Lire les documents pertinents.
2. Examiner le code existant.
3. Identifier le périmètre exact.
4. Réaliser des modifications ciblées.
5. Ajouter ou adapter les tests.
6. Exécuter les vérifications possibles.
7. Résumer les modifications.
8. Signaler les limitations et décisions restant à prendre.

Ne pas implémenter de fonctionnalités majeures non demandées.

Ne pas modifier les décisions produit sans validation.

Lorsqu’une règle métier est ambiguë, demander une clarification plutôt que d’inventer un comportement définitif.

## 15. Gestion du dépôt

* Utiliser des branches dédiées pour les travaux importants.
* Produire des modifications faciles à relire.
* Ne pas écraser les changements existants.
* Ne pas supprimer de fonctionnalités sans justification.
* Garder le README à jour.
* Documenter les commandes d’installation, de lancement et de test.

## 16. Priorité générale

L’objectif est de construire une plateforme fiable, extensible et agréable à utiliser en direct.

Privilégier :

1. La cohérence des règles.
2. La sécurité des informations.
3. La fiabilité de la synchronisation.
4. La simplicité d’utilisation.
5. La qualité visuelle.
6. La maintenabilité.

Éviter de sacrifier la fiabilité du moteur de jeu au profit d’effets visuels ou d’intégrations prématurées.

En cas de conflit entre une implémentation existante et une décision produit explicitement validée, signaler le conflit avant de modifier le comportement.


## 17. Décision définitive — recentrage jalon 6

Lire docs/STAGE-6.md, docs/SAAS-ARCHITECTURE.md et docs/ROADMAP-COMMERCIAL.md.
Le produit est un catalogue fermé de jeux prêts à jouer avec paramètres autorisés.
Cette décision remplace les exigences antérieures de création libre, Studio, Store,
reconstruction depuis zéro et variantes utilisateur. Ne plus développer ces fonctions.
Conserver le moteur déclaratif commun et les contrats v1/v2/v3, pas plusieurs moteurs.
Les nouvelles parties utilisent des définitions officielles choisies côté serveur et
un GameSettings strict, jamais une règle ou un rôle arbitraire reçu du navigateur.

L’ancien code Studio et ses tables restent archivables : aucun effacement sans
sauvegarde/restauration vérifiée et décision explicite. Ses routes/API sont fermées
par défaut ; LEGACY_STUDIO_ENABLED=1 ne sert qu’à la maintenance locale explicite,
jamais en production. Conserver les tests métier et de compatibilité, y compris les
anciennes sessions, définitions, reçus, variantes et données privées. Le laboratoire
multirôle des jeux officiels doit fonctionner sans bibliothèque Creator.

## 18. Jeux et validation

Lire docs/OFFICIAL-GAMES-RULES.md. Undercover est jouable dans une variante de
 démonstration : deux tours d’indices par défaut, configurables, vote prématuré refusé
serveur, distribution privée aléatoire et atomique. Aucun branchement sur l’identifiant
Undercover dans l’interpréteur pour décider des règles. Enchères et Qui est l’espion
restent à livrer ; débit uniquement à attribution confirmée pour les enchères.
La reconstruction des jeux depuis une page blanche n’est plus un objectif produit.

## 19. Broadcast Neon et tests humains

Lire docs/DESIGN-SYSTEM.md et docs/TEST-PRODUCT-FOCUS.md. Tokens centralisés,
primitives partagées, confirmations accessibles et aucun confirm/alert/prompt natif
applicatif. Conserver beforeunload quand pertinent. Mobile-first GM iPhone, joueurs
simples, plateau public sans secret et laboratoire à identités distinctes.
Premiers tests humains iPhone du Studio et de la régie effectués, ayant motivé les
refontes. Un premier workflow complet avec OBS réel a depuis été validé par le testeur.
Les nouveaux layouts, autres appareils et cas limites restent à vérifier ; Chromium
ne prouve pas cette validation physique.
Ne pas ajouter de fournisseur payant, facturation réelle, auth simulée, site marketing
complet ou éditeur d’overlays sans demande spécifique.

## 20. Aperçu d’émission et OBS

Lire docs/STREAM-PREVIEW.md et docs/TEST-STREAM-PREVIEW.md. L’aperçu fictif, le
comparatif du laboratoire et la source OBS partagent BroadcastOverlay et des flux
publics indépendants. Aucun filtrage d’un état GM pour fabriquer un plateau. Ne pas
rejouer les anciens effets après reconnexion ou ouverture tardive ; conserver l’état
durable autoritaire. Les spectateurs restent en lecture seule tant qu’une nouvelle
permission moteur n’est pas explicitement implémentée. Ne pas simuler une intégration
Twitch, des enchères ou des jeux absents. Pas de nouvel éditeur de scènes. Distinguer
tests navigateur, véritable OBS, iPhone physique et validation humaine.

## 21. Jalon 7 — Undercover uniquement

Lire docs/UNDERCOVER-VARIANTS.md, docs/UNDERCOVER-LAYOUT.md et le guide associé.
Priorité Undercover ; ne pas commencer Enchères ou espion. L’éditeur de layout
Undercover est explicitement autorisé, sans studio de scènes universel. Géométrie
bornée, sauvegarde GM via commandes/reçus existants, projection publique explicite.
Même BroadcastOverlay pour édition, aperçu et OBS ; jamais de données GM filtrées
pour construire un rendu public. Les positions visuelles ne modifient pas les rôles
ou l’ordre de parole. Ne pas inventer de nouvelles variantes de règles définitives.
Le testeur a confirmé un premier workflow complet avec OBS ; conserver cette
validation humaine du parcours observé, sans la généraliser aux nouveaux layouts.

## 22. Jalon 8 — expériences et thèmes

Lire docs/UX-REDESIGN-DECISIONS.md et docs/TEST-UX-THEMES.md. Six présentations pour
les tâches réelles, sans six moteurs : préserver les routes, capacités, SQLite/SSE,
reçus, commandes et layouts Undercover. Le laboratoire reste distinct des vues normales.
Thèmes officiels dans tokens.css : Broadcast Studio, Neon Show, On Air Premium.
Préférence privée du navigateur et thème public figé de la session sont deux portées
indépendantes. Ne jamais dériver la couleur d’OBS du stockage local du spectateur/GM.
Pas de nouvelle règle ou variante pour remplir un wireframe ; les wireframes guident
la hiérarchie, pas une reproduction littérale. La nouvelle UX attend un nouvel essai
humain, sans remettre en cause le workflow OBS précédent déjà validé.
