# Étape 3 — jalon A et évolution configurable

Les sections A ci-dessous conservent le bilan historique. La décision « Évolution
validée après A » et la livraison du socle générique en fin de document décrivent
le lot actuel et remplacent les anciens blocages de progression de B.

## Base vérifiée et périmètre

La branche `feat/stage-3-sessions` part du commit `46d3ba0`, vérifié localement et sur `origin/feat/technical-foundation`. À l’inspection initiale, le dépôt était propre, `main` était toujours au commit initial, et les 20 tests du socle passaient. Les anciennes interfaces ne contenaient que des fixtures et une sonde SSE : aucune session ni règle jouable n’existait.

Cette livraison implémente uniquement le jalon A. La priorité donnée à Undercover pour la première verticale ne retire aucun jeu du périmètre V1. Les règles restent ouvertes, conformément à PRODUCT.md. Le changement de priorité vers l’iPhone approfondit la régie unique responsive déjà validée ; il n’introduit pas une application distincte.

## Architecture des trois expériences

```text
Régie GM ─────────┐
Compagnon joueur ─┼── commandes HTTP + vues SSE autorisées ── serveur Node
Plateau public ──┘                                            │
                                                   moteur de salon pur
                                                            │
                                                transaction SQLite + journal
```

Les composants React n’écrivent pas l’état officiel. Les mutations suivent validation de schéma, identification par jeton, contrôle des permissions, vérification de version, décision du moteur, écriture atomique de l’état/événement/reçu, puis diffusion. La présence est calculée à partir des connexions actives et n’est pas un état persistant de partie.

Les vues sont construites explicitement : public, joueur identifié ou GM. Les identités sont attribuées par le serveur, jamais prises dans un champ `role` du navigateur. Les trois modules de jeu restent indépendants ; aucun n’exécute encore de règles.

## Jalons et validation humaine

| Jalon           | Livraison démontrable                                                                                                                              | Validation humaine avant la suite                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| A — livré       | Création, invitation, inscription, état prêt, présence, titre synchronisé, fermeture des invitations, retrait et réinitialisation du salon, SQLite | Reproduire le guide iPhone, juger les libellés, tailles tactiles et compréhension des liens |
| B — à autoriser | Navigation et régie mobile approfondies, laboratoire de développement avec identités simulées isolées                                              | Tester les contrôles pendant une émission et les outils de simulation                       |
| C — à autoriser | Une partie Undercover complète utilisant les accès et projections de A                                                                             | Valider les règles de démonstration puis une partie avec de vrais joueurs                   |
| D — à autoriser | Essais prolongés, scénarios d’incident, tests Safari/WebKit et corrections ergonomiques                                                            | Validation sur iPhone réel et dans OBS                                                      |

Les garanties nécessaires à A — permissions, idempotence, atomicité, reconnexion et restauration — ne sont pas reportées à D. En revanche, leurs tests prolongés et les garanties propres aux règles de jeu viendront avec les jalons concernés.

## Fonctionnement prévu du laboratoire B

Une page réservée au développement ouvrira les accès GM, joueurs et spectateurs d’une session. Elle créera des identités nommées « simulées » via les véritables inscriptions et commandera les mêmes API que les interfaces normales. Chaque identité aura sa propre clé de stockage et son propre jeton ; aucun cookie de rôle commun ne servira à permuter les joueurs.

Les commandes de simulation devront être absentes ou rejetées côté serveur en production, et non simplement cachées dans l’interface. Le laboratoire ne devra pas fabriquer de résultats dans React ni donner des permissions de simulation à une session de production.

**Ce laboratoire n’est pas implémenté dans A.** L’accueil réel et les liens de la régie fournissent déjà le parcours manuel à plusieurs navigateurs. `/demo` conserve la maquette historique, clairement fictive ; elle n’est pas un laboratoire connecté au moteur.

## Choix mobile-first pour A

- Une colonne sur téléphone, champs à 16 px pour éviter le zoom automatique iOS, boutons d’au moins 48 px.
- Navigation session/joueurs/plateau accessible en haut et commande GM principale dans une barre inférieure fixe.
- `viewport-fit=cover`, unités de hauteur dynamiques et marges `safe-area-inset-*`.
- Chargement, synchronisation, reconnexion, erreur et commande en attente explicitement affichés ; actions suspendues pendant la déconnexion.
- Confirmation avant retrait ou réinitialisation. Un résultat réseau incertain est repris avec le même identifiant de commande.
- Copie des liens avec sélection manuelle de secours sur HTTP local, sans dépendre de `crypto.randomUUID` ni d’`AbortSignal.timeout` sur l’iPhone.
- Même code pour ordinateur et tablette, focus clavier visible, libellés associés aux champs et retours accessibles.

Ces choix ne constituent pas une validation Safari iOS. Les tests Chromium avec formats de téléphone ne remplacent pas l’essai sur un appareil réel.

## Undercover : proposition à discuter pour C

Aucune règle Undercover n’est implémentée dans A. Pour rendre C testable sans imposer une règle définitive, la variante de démonstration proposée serait :

1. Deux groupes, civils et Undercover, sans rôle blanc. Le GM configure les deux mots et le nombre de rôles, selon des limites à valider.
2. Attribution aléatoire côté serveur ; chaque joueur reçoit uniquement son mot. Le moment où le joueur apprend son rôle exact reste à décider.
3. Discussion puis vote des joueurs actifs. À décider : abstention, vote pour soi, vote modifiable, quorum, clôture manuelle ou automatique et comportement des joueurs déconnectés.
4. Proposition pour une égalité : aucune élimination, nouvelle discussion. À confirmer, notamment pour éviter une suite d’égalités infinie.
5. Sinon, élimination du joueur ayant le plus de voix. Révélation de son rôle immédiate ou différée : décision ouverte.
6. Proposition de victoire : civils si aucun Undercover ne reste ; Undercover s’ils atteignent la parité avec les civils. Puis révélation finale autorisée. Conditions et ordre d’évaluation à confirmer.
7. Rejouer redistribue les informations. Les conditions d’annulation et les actions GM pour des joueurs non connectés restent à définir.

Les définitions officielles décriront leurs paramètres et règles en utilisant prioritairement les primitives du moteur configurable partagé. Les propositions ci-dessus restent non validées. La règle déjà validée des enchères demeure : aucun débit au dépôt d’une offre, débit à l’attribution confirmée uniquement.

## Parcours humains disponibles

Voir [le guide de test iPhone](TEST-IPHONE.md) : création et inscription multi-appareils, préparation synchronisée, refus d’accès, récupération, retrait, réinitialisation et redémarrage. Les votes, rôles, mots, éliminations, chronomètres et victoires ne font pas partie des scénarios A.

Les hypothèses de la variante C, le laboratoire B et les futures décisions produit attendent le retour de l’utilisateur. Aucun jalon suivant ne doit commencer automatiquement.

## Évolution validée après A

Validation technique terminée — Validation humaine iPhone en attente.
L’utilisateur autorise la poursuite sans attendre le test physique iPhone.
La nouvelle priorité est le socle générique et un laboratoire compact : voir
[architecture configurable](CONFIGURABLE-ENGINE.md). Les anciens passages demandant
d’attendre la validation humaine avant toute progression de B sont remplacés par
cette décision. C (Undercover complet) et D complet ne sont pas entrepris ici.

## Livraison du socle générique et laboratoire

Base vérifiée : `5957b1f`, dépôt propre, 46 tests existants passants. Branche dédiée
`feat/configurable-game-foundation`. Les identifiants de jeu s’ouvrent aux créations ;
la sélection des anciennes maquettes conserve ses trois choix et son secours.
Le service de sessions n’est pas remplacé : même stockage, capacités, reçus et SSE.

Le périmètre B autorisé comprend un petit laboratoire réel et le panneau générique
mobile. L’éditeur visuel, la distribution et Undercover complet restent hors lot.
Les exemples et les limites livrées sont décrits dans [le guide](TEST-CONFIGURABLE.md).
Les schémas scènes/assets sont validés, mais aucun moteur de composition ou rendu
de médias n’est encore actif. La validation physique iPhone reste en attente.

### Vérification de la livraison configurable

- `npm test` : 60 tests passants, dont les 46 précédents. Le scénario de
  redémarrage réel du serveur restaure également une définition figée et une
  réponse privée, sans publication de celle-ci.
- `npm run typecheck`, `npm run format:check`, `npm run build` : réussis.
- Chromium système : `npm run test:e2e` avec
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` : 33 parcours passants,
  formats 390×844, 768×1024 et 1440×1000.
- Même variable pour `npm run test:lab` : 1 parcours réel en développement,
  identités isolées, refus 403, action, relance et réinitialisation.
- Captures inspectées : régie mobile et aperçu public tablette ; correction
  d’une découpe des valeurs sur tablette. Aucun iPhone, Safari iOS ou OBS physique
  testé. Statut : Validation technique terminée — Validation humaine iPhone en attente.

Aucune dépendance, clé ou prestation externe payante ajoutée. Aucun fichier média
transféré. Le cloud ne fournit toujours pas de prévisualisation accessible à
l’iPhone ; suivre le lancement Wi-Fi du guide ou provisionner ultérieurement
un hébergement HTTPS protégé. Les suites fonctionnelles restent à décider avec
l’utilisateur ; aucun développement d’Undercover complet ou d’éditeur graphique
n’est lancé automatiquement.
