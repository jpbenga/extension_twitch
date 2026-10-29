> Statut courant : **APPROVED** pour les seuls 28 IDs du registre [APPROVAL.json](APPROVAL.json). Les mentions AWAITING_APPROVAL dans le corps décrivent l’état historique avant l’accord humain. Cet export documentaire ne lance aucune intégration.

# Contrôle documentaire — Undercover A / B

29 octobre 2026 · **AWAITING_APPROVAL** · Maquettes uniquement. Aucun nouvel écran APPROVED, aucune intégration autorisée par ce bilan.

## Cohérence avec le canon

Le canon consulté est `../../../../docs/ux/redesign/DESIGN.md`. Il reste la référence existante ; aucun fichier de ce dépôt, DESIGN canonique ou sidecar `design.json` de production n'a été modifié par ce contrôle.

**A — Stream Set** conserve le langage approuvé de préparation : indigo `#0C0C1F`, surfaces `#1A1A2D` / `#28283C`, texte `#E2E0FB`, secondaire `#B7A8D4`, lilas `#CEBDFF`, action citron `#C8F323` / `#171E00`, Space Grotesk et DM Sans locales, cartes de préparation 16 px et contrôles 8 px. Les six intentions desktop/mobile gardent une action dominante, les options secondaires repliées, les paramètres 3–12 participants prévus / 1–5 tours / 2 par défaut / Classique. Le mobile conserve une colonne, les champs à 16 px, des commandes de 48 px et l'espace de sécurité sous la commande fixe.

Les séries ordonnées, la réutilisation par copie modifiable et les images facultatives sur le même appareil sont de **nouvelles propositions produit**. Elles ne décrivent pas des capacités existantes. Le texte reste suffisant ; une image absente ne bloque pas le salon. Ouvrir le salon ne distribue aucun secret. Les raccordements Partie suivante / Rejouer / Retour à la série restent à concevoir dans le parcours B5 existant.

**B — TV Broadcast** reprend les polices et la continuité lilas/surfaces sombres, mais remplace volontairement la hiérarchie lourde du plateau B6 par une vidéo dominante, un centre dégagé et des informations publiques ponctuelles. Cette proposition locale répond au brief TV ; elle n'approuve ni une nouvelle charte globale ni l'application des variables `--home-*` aux thèmes OBS. Le canon précise toujours que l'émission dépend de son propre thème serveur.

Le duo anonyme et les affectations visibles restent deux projections publiques distinctes proposées. B3/B14 n'embarquent pas de relation joueur → contenu dans le DOM/données examinés ; les affectations exigent le choix explicite du GM. Vote, camp révélé et révélation finale restent séparés. Les sept blocs sémantiques, quatre dispositions, déplacements/redimensionnements et renderer commun aperçu/OBS sont des capacités futures à préserver ; les anciens minima géométriques devront être adaptés lors de l'intégration.

## Provenance et références livrées

- A : projet Stitch `6522040318627629456`, douze références finales A1–A6 recensées dans `../undercover-stream-set/DELIVERY.md` et `manifest.json`. Les versions remplacées restent des sources, sans autorité pour la validation.
- B : projet Stitch `17376000961075708568`, quatorze états B1–B14 gelés en HTML contexte/alpha et preuves locales ; publication des quatorze vues de contexte et de deux sources overlay seul encore en cours lors de ce contrôle. Le manifest B est l'index à consulter après finalisation, sans déduire son exhaustivité de cette lecture intermédiaire.
- Studio fictif et illustrations Sasuke/Itachi générés par Stitch. A documente les sources partagées `c68763979d884461b38e13ab1f52fa36` et `c1a184a8cde8498d96d87935d6cd6256` du projet B. Les médias et polices sont embarqués dans les maquettes, hors code applicatif.
- Les six ressources mobiles A dans Stitch sont des PNG de lecture complète à 390 px. Les HTML responsive locaux et `viewport.png` / `viewport-bottom.png` apportent séparément la preuve de la commande fixe ; l'habillage HTML d'une référence image ne remplace pas ces sources responsive.
- Les PNG Stitch B sont des références aplaties. Les quatorze preuves navigateur `proofs/*-alpha.png` sont documentées RGBA 1920 × 1080 avec alpha central nul ; le décor appartient aux vues de contexte. Les réductions Twitch à 390 px sont des preuves de lisibilité de maquette.

## Clarifications documentaires confirmées

1. Le point 11–12 de `../undercover-tv-broadcast/BRIEF.md` mentionnait des groupes de quatre joueurs alors que les rendus gelés B12/B13 montrent **trois joueurs par page sur quatre pages** (`1–3 / 12 · 1/4`, puis `10–12 / 12 · 4/4`). Root a aligné la phrase du brief sur cette proposition ; la clarification a été relue.
2. `../undercover-tv-broadcast/DESIGN.md` reprend le canon historique, son titre « accueil Extension Twitch », ses mentions APPROVED et son lien relatif `LOBBY-PLAYER-IMPLEMENTATION.md`. Root a ajouté une note explicite : copie de continuité, APPROVED limité aux anciens écrans, propositions TV actuelles AWAITING_APPROVAL, liens relatifs rattachés au contexte du dépôt d'origine. La note a été relue. Ce fichier n'est pas une nouvelle charte globale approuvée.

Aucune dérive documentaire ouverte dans ces deux points après clarification. Le manifest B partiel observé correspondait à une publication en cours ; son exhaustivité doit être vérifiée une fois celle-ci terminée. Aucune nouvelle dérive matérielle de rendu n'est déclarée ici : la relecture indépendante a confirmé les corrections A3 (bornes), B1 (attente légère), B8 (camps lisibles) et B11 (copie/masque). Ces clarifications n'ont modifié aucun rendu, import ou upload de design, ni le canon source. Ce contrôle documentaire ne relance pas de tour visuel et écrit uniquement le présent fichier.

## Références consultées et limites

Sources : canon ci-dessus ; `COORDINATION.md`, `RACCORDEMENTS.md`, `REVIEW.md` ; A `DESIGN.md`, `DECISIONS.md`, `DELIVERY.md`, `manifest.json` et HTML responsive A1/A4 mobile ; B `DESIGN.md`, `BRIEF.md`, `manifest.json`, HTML B3/B12/B13 et `proofs/checks.json`, `alpha-checks.json`, `privacy-checks.json`. La référence Impeccable `reference/document.md` a été consultée pour séparer système existant et proposition ; aucun nouveau DESIGN canonique n'est généré.

Ce sont des prototypes statiques : aucune persistance, commande de jeu, autorité serveur, synchronisation de médias, transition temporelle, accessibilité clavier complète ou interaction exécutable n'est prouvée. Aucun essai OBS réel, téléphone physique ou accord UX humain n'est revendiqué. La présence d'un état et sa bonne lisibilité ne prouvent pas sa disponibilité fonctionnelle. Le présent contrôle crée uniquement ce document ; la décision humaine reste **AWAITING_APPROVAL**.

## Clôture de publication — contrôle root

Publication B terminée après ce contrôle documentaire intermédiaire : seize références finales présentes sur le Canvas, seize HTML récupérés identiques aux sources et seize captures natives reçues. Les deux manifestes finaux comportent 28 IDs uniques au total ; leurs liens et statuts AWAITING_APPROVAL ont été vérifiés. La livraison groupée est DELIVERY.md. Le dépôt applicatif demeure propre et inchangé.
