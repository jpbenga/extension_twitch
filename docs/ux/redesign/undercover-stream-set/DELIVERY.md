# Chantier A — Préparation Undercover / série de stream

**APPROVED** · Validation humaine reçue pour les références finales · Aucune intégration.

Projet Stitch : **6522040318627629456** — Extension Twitch UX — Undercover Stream Set.

| Écran                       | Desktop — Screen ID                                                                                             | Mobile — Screen ID                                                                                              | Rôle                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A1 — Préparation Undercover | [15550170936144471061](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=15550170936144471061) | [8698932679578854180](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=8698932679578854180)   | Régler les paramètres essentiels et ajouter une partie à la série.           |
| A2 — Éditeur de partie      | [1841638244159572388](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=1841638244159572388)   | [4339420279877736649](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=4339420279877736649)   | Modifier indépendamment les noms et les images des deux contenus.            |
| A3 — Série préparée         | [14795817732173201235](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=14795817732173201235) | [11696425283968742110](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=11696425283968742110) | Ordonner et gérer le conducteur de parties préparées.                        |
| A4 — Réutiliser une partie  | [11602921577934756531](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=11602921577934756531) | [7441701879859976594](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=7441701879859976594)   | Retrouver une ancienne paire et en créer une copie partiellement modifiable. |
| A5 — Image à reconnecter    | [7360708926785982691](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=7360708926785982691)   | [11696425283968743710](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=11696425283968743710) | Reconnecter une image facultative sans perdre les textes et réglages.        |
| A6 — Série prête            | [17639353948556659950](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=17639353948556659950) | [3387371104757900127](https://stitch.withgoogle.com/projects/6522040318627629456?node-id=3387371104757900127)   | Vérifier la série prête puis ouvrir le salon d’invitation sans distribuer.   |

## Décisions UX

Une série est un conducteur éditorial, avec une seule action citron par écran. Les images restent facultatives ; une image absente ne supprime aucun texte et ne bloque jamais l’ouverture du salon. A3 propose des commandes Monter/Descendre de 48px en plus des poignées ; les commandes aux bornes sont désactivées. A4 réutilise une copie modifiable et conserve l’original. Le mobile garde une colonne et une commande basse.

## Raccordements B2 / B5

B2 fournit les paramètres essentiels et les accès secondaires existants. Ouvrir la série conduit au salon d’invitation sans distribution implicite. Les raccordements futurs B5 sont Partie suivante (confirmation GM), Rejouer (même préparation) et Retour à la série. L’automatisation n’est pas un défaut inventé ; une seule partie reste active. Aucun écran B5 n’est redessiné. Voir [DECISIONS.md](DECISIONS.md).

## Références et contrôles

Les seuls Screen IDs validés sont les douze de ce tableau. Les générations v1 et imports remplacés restent conservés comme sources superseded dans le manifest. Les ressources finales ont été récupérées par la CLI authentifiée.

Les six références mobiles Stitch sont des images complètes de 390px, sans marge desktop. Pour lire toute la maquette, leur CTA est montré en fin de contenu. Les HTML responsive locaux et les captures `viewport.png` / `viewport-bottom.png` prouvent séparément le CTA fixé au bas du viewport réel. Un export HTML de la référence image peut être un simple habillage image ; ce n’est pas le HTML responsive à utiliser pour comprendre la composition.

Contrôle Chromium : 1440px et 390px, aucun débordement horizontal, images chargées, boutons ≥48px, contenu caché inspecté, deux commandes de réordonnancement hors limites désactivées. Palette, polices et rayons reprennent le canon approuvé. Contraste calculé du texte secondaire sur la surface la plus claire : 6,56:1 ; texte du CTA : 13,34:1. Relecture indépendante effectuée ; confirmation ciblée des bornes A3 reçue, corrections résolues. Les douze Screen IDs sont gelés en APPROVED. Voir [le rapport indépendant](../undercover-next/REVIEW.md).

Les propositions de séries, réutilisation et médias locaux préparent un futur travail fonctionnel. Elles ne prétendent pas exister dans l’application actuelle. Aucun React/Next.js, moteur, permission, contrat de production, synchronisation, Git ou déploiement modifié. Aucun test physique OBS/iPhone revendiqué. Validation visuelle humaine explicitement reçue.

**Statut final : APPROVED**.

## Approbation humaine

Accord explicite reçu : « J’approuve ». Les seuls IDs finaux listés ci-dessus sont **APPROVED**. Voir [le registre exact](../undercover-next/APPROVAL.md). Aucun changement visuel, remplacement d’ID ou lancement d’intégration.
