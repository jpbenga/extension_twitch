# Roadmap vers une première offre commercialisable

Référence : PRODUCT.md 1.0. Priorité à un périmètre fini, fiable et vérifié humainement.
Pas de no-code, de Store ni d’objectif de reconstruction des jeux par les utilisateurs.

**I** = indispensable à la première offre ; **S** = souhaitable au lancement ;
**F** = amélioration future. Les chiffres ci-dessous sont des critères de travail
proposés, à confirmer avant engagement commercial ; ils ne sont pas des mesures déjà atteintes.

## Phase 1 — Recentrage (jalon 6)

- **I** Accueil, catalogue fermé, configuration officielle, régie et laboratoire séparés.
  Acceptation : un novice lance Undercover sans bibliothèque, JSON ni Studio ; aucun
  appel `/studio` lors du parcours. Les titres inachevés ne proposent pas Jouer.
- **I** Retrait prudent. Acceptation : anciennes sessions/reçus restaurés et jouables,
  bibliothèques non supprimées, API d’injection désactivées par défaut, maintenance
  jamais activable en production. Inventaire STAGE-6.md tenu à jour.
- **I** Parcours multi-appareils documenté et testé automatiquement. Acceptation : GM,
  trois joueurs et spectateur isolés finissent une partie, rejouent et se reconnectent.
  L’appréciation humaine sur iPhone reste une porte distincte.

## Phase 2 — Catalogue réellement jouable

- **I** Undercover stabilisé : règles validées avec pilotes, 2 tours par défaut, limites
  testées 3–12, égalité, progression, victoire et rejeu. Acceptation : trois parties
  complètes observées avec retours corrigés, aucune fuite ni commande doublée.
- **S** Enchères : valider format/incréments/classement, livrer une verticale complète.
  Acceptation : plusieurs offres simultanées, budget inchangé au dépôt, unique débit
  à attribution confirmée, corrections définies, classement et reprise persistante.
- **S** Qui est l’espion : règles distinctes validées, cycle de questions et vote.
  Acceptation : attribution privée, déduction, révélation autorisée et résultat calculé
  vérifiés dans une partie multi-contexte et lors d’un essai humain.
- **F** Environ dix expériences : backlog de variantes officielles après preuve de demande.
  Acceptation de chacune : règles écrites, réglages bornés, interfaces, fin, tests moteur,
  navigateur et manuel. Aucun simple titre ajouté au catalogue comme jeu terminé.

Une première offre étroite peut démarrer avec **un à trois jeux réellement validés**,
si ce périmètre et le prix sont explicitement approuvés. Les trois jeux initiaux restent
la cible de catalogue, sans faire des dix variantes une dépendance au lancement.
Une démo Undercover automatisée réussie ne suffit pas à autoriser la facturation.

## Phase 3 — Expérience de diffusion

- **I** Plateau public fiable, lisible 1920×1080 ; URL OBS publique séparée des liens GM.
  Acceptation : émission complète dans OBS réel sans secrets, coupure/reconnexion testée,
  aucune interaction GM requise dans la source navigateur.
- **I** GM iPhone et joueurs simples : actions tactiles, confirmation, états de chargement,
  portrait, safe areas et accessibilité raisonnable. Acceptation : scénario humain iPhone
  - ordinateur complété sans intervention technique ; liste des problèmes résolue.
- **I** Endurance temps réel : cible proposée deux heures, coupures et redémarrage contrôlé,
  pas de désynchronisation ni double mutation ; seuil de latence à définir/mesurer sur staging.
- **S** Personnalisation limitée (nom, quelques couleurs et visibilité prise en charge),
  thèmes officiels et rendu transparent après test OBS. Aucun éditeur graphique généraliste.
- **F** Extension Twitch et interactions, puis Bits après conception et conformité validées.
  Les comptes Twitch et transactions ne bloquent pas les premiers tests de produit.

## Phase 4 — Plateforme SaaS

- **I** Comptes, récupération, appareils/révocation, propriété des parties et réglages.
  Acceptation : isolation intercomptes testée, récupération ne divulguant pas d’existence,
  retrait d’appareil coupe ses accès, migration d’une capacité ancienne prouvée et atomique.
- **I** Droits serveur et offre commerciale approuvée. Acceptation : contrôle des jeux,
  fonctions et quotas sur les API, tests de refus indépendants du frontend, politique
  claire quand l’abonnement change pendant un live.
- **I** Facturation réelle **dans un jalon autorisé séparément**. Acceptation : sandbox
  complète création/impayé/résiliation/remboursement/rejeu d’événements, signature et
  idempotence, puis activation réelle contrôlée. Prix et fournisseur restent ouverts.
- **I** Exploitation : HTTPS, secrets, logs minimisés, sauvegarde restaurée, alertes,
  procédure d’incident, staging et déploiement réversible. Acceptation : exercice
  documenté de perte de processus et restauration ; objectifs RPO/RTO mesurés.
- **S** Support intégré, espace personnel riche et configurations nommées synchronisées.
- **F** Équipes de régie et plusieurs diffuseurs, après conception des permissions.

## Phase 5 — Site vitrine et lancement

- **I** Présentation fidèle des jeux disponibles, offre/prix, inscription, connexion,
  aide, support et pages légales validées. Aucun faux témoignage ni promesse de jeu absent.
  Acceptation : visiteur → compte → droit vérifié → partie complète → gestion abonnement.
- **I** Bêta privée réelle : pilotes consentants, retours gameplay/ergonomie, politique
  de confidentialité et support ; aucun contact automatique déclenché par cette roadmap.
  Acceptation : incidents bloquants résolus avant ouverture facturée.
- **I** Décision de lancement : revue de sécurité, tests navigateur/serveur, tests iPhone
  et OBS réels, restauration, tarifs et périmètre validés explicitement.
- **S** Démonstrations marketing et liste d’attente ; **F** acquisition et intégrations avancées.

## Prochaine priorité recommandée

Valider le parcours Undercover simplifié sur les appareils du testeur ; corriger les
frictions ; choisir une verticale Enchères avant d’élargir le catalogue. Concevoir ensuite
l’identité et l’exploitation en staging. Ne pas financer dix expériences avant d’avoir
prouvé l’usage et les portes de lancement ci-dessus. Aucun de ces jalons ne démarre
sans une nouvelle demande ; le jalon 6 prépare ces choix, il ne livre pas un SaaS facturable.
