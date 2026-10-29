# Chantier B — Undercover TV Broadcast

Statut : **APPROVED**. Validation humaine reçue pour les références finales. Aucun code applicatif, aucune API, aucun fichier Git, aucune intégration ni synchronisation fonctionnelle modifiés.

Project ID : `17376000961075708568` — [Ouvrir le projet](https://stitch.withgoogle.com/projects/17376000961075708568).

## Écrans proposés

| Écran | Screen ID / Stitch                                                                                               | Rôle                                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| B1    | [2926658225915648351](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=2926658225915648351)   | Attente légère avant distribution : capsule seule.                 |
| B2    | [14944524881897440628](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=14944524881897440628) | Joueur courant et tour, sans contenu privé.                        |
| B3    | [15069575678936846215](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=15069575678936846215) | Deux contenus publics, aucune affectation.                         |
| B4    | [6025148913150011551](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=6025148913150011551)   | Projection explicitement publique des affectations.                |
| B5    | [1197725242887580661](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=1197725242887580661)   | Participation, sans choix individuels.                             |
| B6    | [8588339416176039518](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=8588339416176039518)   | Camp révélé à la résolution, aucun mot prématuré.                  |
| B7    | [5416295497078556769](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=5416295497078556769)   | Égalité sans nouvelle règle inventée.                              |
| B8    | [5659817327027131476](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=5659817327027131476)   | Après résultat final autorisant camps et mots.                     |
| B9    | [11072318426252518079](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=11072318426252518079) | Résultat final temporaire et proportionné.                         |
| B10   | [12222903864227055358](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=12222903864227055358) | Transition visuelle après commande GM, pas de lancement implicite. |
| B11   | [821597574017839675](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=821597574017839675)     | Focus actif, nom long avec ellipse et numéro stable.               |
| B12   | [16010188935926390018](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=16010188935926390018) | Affectations par trois, groupe 1 sur 4.                            |
| B13   | [8433765196767106252](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=8433765196767106252)   | Dernier groupe, noms longs et 12e place.                           |
| B14   | [3436903299241750254](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=3436903299241750254)   | Texte valide sans image, aucune erreur technique publique.         |

## Deux ressources overlay seul

- B3 : [3519635256591020907](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=3519635256591020907) — HTML sans fond de contexte.
- B4 : [16665675289758535496](https://stitch.withgoogle.com/projects/17376000961075708568?node-id=16665675289758535496) — HTML sans fond de contexte.

Les 14 maquettes de contexte montrent une scène studio fictive propre, générée par Stitch, sans ancien habillage incrusté. Elles ne réutilisent aucune affectation de la Photo 2 derrière une projection anonyme. Les photos utilisateur restent deux références séparées, sans modification.

Les 14 fichiers `b*-alpha.html` sont les rendus sans contexte. Les preuves `proofs/b*-alpha.png` sont de vrais PNG RGBA 1920×1080 rendus dans Chromium avec `omitBackground`. La capture native Stitch est une référence aplatie, sans revendication d'alpha. Les deux ressources overlay seul ci-dessus permettent d'inspecter les deux projections dans Stitch, leur prévisualisation native pouvant être aplatie.

## Décisions UX

- La vidéo demeure dominante : centre et visages dégagés, bandeau supérieur de 94 px, cartes de discussion de 196 px en bas. Seule la révélation finale temporaire monte à 250 px pour rendre les camps lisibles sur téléphone.
- L'attente conserve seulement les petites capsules supérieures. Aucun panneau permanent, liste de logs, commande GM ou outil QA dans OBS.
- Hiérarchie Space Grotesk / DM Sans, surfaces indigo translucides, lilas, accent citron réservé au résultat positif. Styles des deux contenus égaux, aucune couleur permettant de déduire un camp.
- Les mots à 64 px deviennent environ 13 px à une réduction Twitch de 390 px. Les camps finaux à 56 px deviennent 11,4 px. Les noms longs sont tronqués par ellipse sans réduire la taille ; leur numéro de place reste stable.
- Une image absente ne produit aucune erreur technique publique : B14 conserve Sasuke en texte, et la carte Itachi illustrée.

## Deux projections publiques distinctes

**Duo anonyme (B3/B14)** : seulement les deux noms/images autorisés, jamais de relation joueur → contenu, de rôle secret, de mapping caché ou de JSON privé. Aucun masquage CSS de données sensibles. Les fichiers sont statiques et ne contiennent pas de script.

**Affectations visibles (B4/B12/B13)** : projection dédiée, après choix explicite du GM, comprenant seulement les associations volontairement publiées. Les personnes de la photo fictive ne déterminent pas une identité réelle ; les cartes utilisent des places numérotées et noms d'exemple.

B6 montre le camp du joueur uniquement après résolution publique de l'élimination, sans mot encore privé. B8 ne publie tous les camps/mots qu'après le résultat final autorisé. B5 montre seulement la participation au vote, aucun choix individuel. Ces nouveaux modes de contenus/images sont une proposition, pas une API de production existante.

## De 3 à 12 joueurs

- À 3 : trois cartes compactes de même poids, chacune avec place, nom et contenu.
- De 4 à 12 : conserver une seule ligne de trois cartes, répartie en `ceil(effectif/3)` pages. B12 montre 1–3 / 12, page 1/4 ; B13 montre 10–12 / 12, page 4/4.
- Pendant la discussion, le focus sur le joueur courant (B11) remplace la liste complète ; aucune obligation d'afficher douze visages/cartes simultanément.
- Proposition de présentation : page contenant le joueur actif à chaque changement de parole ; consultation ponctuelle des autres groupes dans le mode affectations, puis retour au focus. Une rotation d'habillage ne change jamais la phase, les rôles ou l'ordre de parole.
- Numéro de place toujours visible en cas de nom long. Les noms complets restent dans les seules données autorisées ; le renderer public anonyme ne contient jamais les affectations.
- Le décor utilisé pour le contrôle reste une scène à trois personnes ; les états 12 joueurs contrôlent la densité et les noms, sans prétendre représenter une captation réelle à douze caméras.

## Temporalité proposée

Bandeau jeu/phase/tour discret et durable. Duo et affectations : apparition ponctuelle au moment pertinent (environ 8 s), puis rétraction ; possibilité future de les rappeler depuis la régie. Le focus actif reste tant que ce joueur parle. Vote : progression seulement pendant le scrutin. Élimination/égalité : moment de 5–6 s. Révélation/victoire : 8–10 s, puis habillage compact. Ces durées sont des intentions à valider, non du gameplay implémenté. Respect de `prefers-reduced-motion`, aucun effet décoratif en boucle ; pas de rejeu d'effets historiques après reconnexion. Les maquettes figent l'instant visible.

B10 est une transition de série après action GM explicite, sans compte à rebours ni lancement automatique de la prochaine partie. A→B : une préparation active fournit seulement ses contenus autorisés, jamais la liste privée de toutes les préparations.

## Personnalisation conservée

Sept blocs sémantiques : header, phase, round, players, vote, result, events. Quatre dispositions : Équilibré, Joueurs en bas, Joueurs à gauche, Centré. Déplacement/redimensionnement et même renderer pour aperçu/OBS à préserver. Les presets par défaut deviennent discrets et contextuels ; les dispositions personnalisées plus riches restent possibles. Les maquettes montrent la direction Neon Show. Les thèmes publics existants Broadcast Studio et On Air Premium, et leur portée indépendante des préférences privées, restent à préserver lors de l’intégration future. Les anciens minima géométriques sont trop massifs pour ces nouvelles capsules : leur calibration/migration devra être traitée lors d'une intégration ultérieure, sans réécrire les dispositions déjà enregistrées à l'insu du GM. Aucune migration n'est exécutée ici.

## Contrôles et limites

Contrôles : 14 contextes, 14 overlays RGBA, 14 réductions Twitch 390×220, noms longs, 12 places, carte sans image, absence de script/ressource distante, confidentialité statique des projections. Voir `proofs/checks.json`, `proofs/alpha-checks.json` et `proofs/gallery.png`. Les corrections matérielles de relecture sont l'attente réduite, les camps finaux agrandis, la copie « Au tour de » et le masque SVG.

Les liens ont été résolus par `stitch url`, puis utilisent le domaine `stitch.withgoogle.com` déjà fonctionnel pour l'utilisateur. La CLI ne prouve pas l'ouverture du Canvas dans son navigateur. Les ressources sont vérifiées par téléchargement authentifié. Aucun test OBS réel ni iPhone physique n'est revendiqué ; la validation visuelle humaine provient de l’accord explicite de l’utilisateur.

Le seed Stitch `aac17937f96845539e4f3f5b4aeeb25a` est une source de travail, supplantée par les 16 références finales ci-dessus. Les trois images générées de scène/contenus sont des assets de maquette uniquement, non ajoutés au dépôt applicatif.

## Approbation humaine

Accord explicite reçu : « J’approuve ». Les seuls IDs finaux listés ci-dessus sont **APPROVED**. Voir [le registre exact](../undercover-next/APPROVAL.md). Aucun changement visuel, remplacement d’ID ou lancement d’intégration.
