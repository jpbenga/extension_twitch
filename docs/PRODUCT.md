# Extension Twitch Studio — référence produit

Version : 1.2 — décision stratégique définitive, jalon 6.

## Positionnement

Une plateforme SaaS de jeux interactifs prêts à jouer pour les streamers Twitch,
avec des paramètres personnalisables, une régie mobile et des overlays de diffusion.
La simplicité, la fiabilité et la capacité de livraison priment sur la flexibilité.
Le produit ne propose plus de création libre, de Studio avancé, d’assistant universel
ni de Store communautaire. Les variantes sont proposées et maintenues par l’équipe.
Cette décision remplace les addenda de création libre des jalons 3–5 ; leur archive
est conservée dans PRODUCT-BEFORE-6.md, sans valeur de consigne actuelle.

## Utilisateurs et vocabulaire

Le streamer organise la diffusion. Le Game Master anime les parties, principalement
sur iPhone ; ils peuvent être la même personne. Les joueurs rejoignent par lien ou
code, sans compte obligatoire. Les spectateurs consultent un plateau public autorisé.
Un jeu est un ensemble de règles officielles réutilisables ; une partie l’exécute
avec des participants ; une émission peut enchaîner plusieurs parties.

## Catalogue fermé

Cible : environ dix jeux ou variantes officiels, définis progressivement. Les trois
premiers restent Undercover, Enchères et Qui est l’espion. La première offre commerciale
pourra avoir moins de dix expériences, après validation explicite de son périmètre,
de sa fiabilité et de sa valeur auprès des pilotes. Pas de titres fictivement jouables.

| Jeu | État réel | Réglages et règles |
| --- | --- | --- |
| Undercover | Cycle complet de démonstration, validation humaine à poursuivre | 3–12 joueurs ; mots libres privés, 1–5 Undercover moins nombreux que les civils, 1–5 tours d’indices (2 par défaut), limite de 1–30 manches (10 par défaut) |
| Enchères | Non jouable, module préparatoire | Règle ferme : débit uniquement lors de l’attribution confirmée ; format, lots, classement, corrections et durées à finaliser |
| Qui est l’espion ? | Non jouable, module préparatoire | Questions/déduction distinctes d’Undercover ; rôles, votes, révélation et victoire à finaliser |

Undercover 0.2.0 distribue aléatoirement des mots côté serveur. Chaque actif donne
un indice oral à son tour ; le GM confirme chaque passage. Le vote ne s’ouvre qu’après
tous les tours. Vote unique sans vote pour soi, décompte après participation complète,
élimination du seul premier ; égalité sans élimination. Victoire civile sans Undercover
actif, victoire Undercover à la parité, limite de manches pouvant donner un nul.
Seul le mot individuel est connu du joueur ; son camp n’est pas révélé avant la règle
prévue. Rejouer garde les accès et remet l’état à zéro ; distribution au démarrage suivant.
Les anciennes parties 0.1.0 conservent leurs règles. Voir OFFICIAL-GAMES-RULES.md.

## Quatre expériences

1. **Catalogue** : identité, concept, effectif, durée connue ou explicitement indéterminée,
   fonctionnalités, paramètres autorisés, disponibilité et « Jouer » uniquement si jouable.
2. **Configuration** : quelques champs propres au jeu, valeurs par défaut et validation
   serveur. Aucune définition, expression, variable ou règle arbitraire injectable.
3. **Régie** : Partie / Joueurs / Plateau, phase et instruction, prochaine action,
   progression, votes, révélations, résultats et rejeu. Gestion secondaire repliée.
4. **Joueurs / spectateurs** : actions adaptées au jeu et informations autorisées seulement.
   Le plateau navigateur est synchronisé, adapté au 16:9 OBS ; un premier workflow OBS réel a été validé par le testeur.

L’accueil pose « Prêt pour votre prochain live ? ». Il propose la reprise lorsqu’un
accès GM valide est retrouvé dans cet onglet, puis le catalogue et une invitation
secondaire. Pas d’espace personnel fictif ni de configurations cloud présentées comme
sauvegardées. Les réglages Undercover sont retenus dans l’onglet, sans synchronisation
interappareils. La partie et ses paramètres sont persistés sur le serveur.

## Moteur et conservation

GameDefinition officielle + GameSettings validés → instantané de session immuable.
Le moteur commun, TypeScript strict, contrats versionnés v1/v2/v3, SQLite, SSE,
permissions, reçus d’idempotence, projections privées/publiques et primitives de jeu
restent en place. Le catalogue fermé ne crée pas plusieurs moteurs incompatibles.
Les interfaces envoient des commandes ; le serveur valide rôles, phases et invariants.
Pas de JavaScript utilisateur ni de confiance dans un rôle déclaré par le navigateur.

Les anciennes bibliothèques, brouillons, variantes, versions, attributions et références
d’assets sont conservés en base et dans le stockage d’onglet. Aucun effacement ni conversion
silencieuse. L’ancien Studio est déprécié et absent par défaut, y compris ses API de création.
Un mode de maintenance local explicite permet encore ses tests et une récupération accompagnée.
Les parties existantes restent exécutables avec leurs liens privés. Voir STAGE-6.md.

## Laboratoire et identité

Le laboratoire des jeux officiels reste disponible indépendamment du Studio. Une
commande prépare une partie de démonstration et de véritables identités fictives.
Le GM peut passer d’un joueur à l’autre, ouvrir le plateau public ou copier son lien
privé pour l’iPhone. Les commandes passent par les mêmes API et validations que les
participants réels. Les projections ne sont jamais fusionnées ; un lien public ne
donne pas accès au sélecteur. Le laboratoire conserve les accès privés dans l’onglet
du testeur, pas dans un endpoint d’usurpation. Aucun privilège de développement public.

## Direction artistique et accessibilité

Broadcast Neon équilibré : violet actions principales, menthe participation/réussite,
ambre attention/enchères, corail vote/destruction avec textes distincts, bleu plateau.
Surfaces sombres, tokens centralisés, contrastes, focus, cibles tactiles, safe areas
et mouvement réduit. Dialogues personnalisés pour les actions critiques ; notifications
non bloquantes pour les succès. Pas de confirm/alert/prompt applicatif natif.

## Cible SaaS et lancement

À construire : comptes sécurisés, propriété des parties/configurations, récupération,
révocation et appareils ; droits serveur selon jeux, fonctionnalités, quotas et abonnement ;
paywall, facturation vérifiée, site vitrine, support et pages légales. Les invités et
spectateurs n’ont pas à créer de compte. Aucune authentification publique ou facturation
sécurisée n’est simulée au jalon 6. Les accès actuels restent des capacités privées,
sans récupération par e-mail ni expiration automatique.

Prix, plans, essais publics, fournisseur d’identité, facturation, hébergement et
conditions des pilotes restent à décider. La collaboration privée envisagée avec
Diki, Reyes et Nisha ne vaut ni contact effectué ni offre d’essai public. Ne contacter
personne automatiquement. La liste d’attente et les abonnements viendront après les
validations adaptées ; voir ROADMAP-COMMERCIAL.md et SAAS-ARCHITECTURE.md.

Twitch et Bits restent des intégrations futures optionnelles, sans compte obligatoire
pour tester, paiement réel ou effet sur simple déclaration du navigateur. Toute future
transaction sera vérifiée côté serveur et appliquée une seule fois avec son reçu.

## Contenus et frontières

Aucun service payant, secret Twitch, stockage automatique de médias en SQLite ou
transfert implicite. Les noms saisis restent libres ; aucune bibliothèque d’images
protégées n’est fournie. Les références d’assets et leurs protections restent internes.
Pas de résolution d’URL serveur arbitraire ni d’exposition d’URL privée/OAuth. Les droits,
signalements et retraits resteront nécessaires si des médias utilisateurs sont ouverts.

## Validation

Première exploration humaine iPhone du Studio et d’Undercover effectuée ; elle a motivé
la simplification et les deux tours d’indices. Un premier parcours complet avec OBS a depuis reçu une validation humaine positive.
Les nouveaux layouts, les autres appareils, les cas limites et le rythme de jeu restent à valider. Les tests automatisés
ne constituent pas une validation humaine. Guide actuel : TEST-PRODUCT-FOCUS.md.

## Addendum prioritaire — prévisualisation d’émission

Le laboratoire doit rendre visibles les effets des véritables commandes sur un
plateau 16:9. L’aperçu ajoute une scène fictive au même overlay transparent que la
source navigateur OBS, alimenté exclusivement par les projections publiques serveur.
Aucun flux Twitch ni éditeur d’overlays complet requis. Les animations éphémères ne
sont pas rejouées à l’ouverture tardive ou à la reconnexion. Le test seul iPhone GM +
ordinateur multijoueur/public est prioritaire. Les interactions spectateur sont
distinctes de l’affichage public : le moteur actuel reste en lecture seule pour ce
rôle, sans commande fictive ni Bits opérationnel. Voir STREAM-PREVIEW.md et
TEST-STREAM-PREVIEW.md. Enchères et Qui est l’espion restent non jouables.

## Jalon 7 — Undercover et layout ciblé

Undercover devient la priorité exclusive ; Enchères et Qui est l’espion sont reportés.
Un format classique, plusieurs répartitions bornées selon l’effectif, pas de rôle
spécial inventé : voir UNDERCOVER-VARIANTS.md. La définition 0.2.0 et ses règles
restent figées. Les deux tours par défaut et le blocage du vote sont conservés.

Le workflow complet avec OBS a reçu un retour humain positif explicite du testeur
après essai. Cette validation concerne le parcours observé, pas tous les cas limites,
ni les nouveaux layouts. Elle complète les tests automatisés sans les remplacer.

La personnalisation du layout Undercover est désormais autorisée : sept blocs publics,
quatre presets, déplacement/redimensionnement bornés et organisation des cartes joueurs.
Un même rendu public alimente éditeur, aperçu et OBS. Sauvegarde par partie, réglages
locaux de préparation dans l’onglet, aucune création de scène universelle ou média envoyé.
Voir UNDERCOVER-LAYOUT.md et TEST-UNDERCOVER-OVERLAY.md. Les anciens paragraphes de
report d’un éditeur concernent toujours un outil universel, pas ce périmètre ciblé.
