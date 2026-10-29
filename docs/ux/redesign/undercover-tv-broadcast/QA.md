> Statut courant : **APPROVED** pour les seuls 28 IDs du registre [APPROVAL.json](../undercover-next/ALL-APPROVAL.json). Les mentions AWAITING_APPROVAL dans le corps décrivent l’état historique avant l’accord humain. Cet export documentaire ne lance aucune intégration.

# Contrôle des maquettes Broadcast

Statut de livraison : AWAITING_APPROVAL. La relecture technique des maquettes ne constitue pas une validation humaine UX.

## Passe groupée

1. Référence Stitch générée `aac17937f96845539e4f3f5b4aeeb25a` contrôlée : contexte studio propre et illustrations de contenus séparées. Les textes de 18–20 px ne survivaient pas à une réduction Twitch ; les états dérivés utilisent des tailles source plus grandes.
2. Première passe complète de 14 états, alpha et contexte, puis réduction à 390×220. Lecture indépendante de tous les états.
3. Corrections matérielles groupées : suppression du lower-third d'attente, camps finaux agrandis à 56 px, copie spectateur « Au tour de », masque SVG cohérent. Aucun rebuild artistique supplémentaire.
4. Confirmation ciblée B1/B8 et contrôle des preuves B11/logo déjà corrigées. Verdict indépendant : références prêtes à soumettre à la validation visuelle humaine.

Le dernier build de B1/B8 a réécrit les fichiers HTML des 14 états, donc l'heure de modification de B11 peut être plus récente que son PNG. Les seuls changements de cette passe sont le contenu B1 et les sélecteurs `.finalcard` / `.camp`, absents du rendu B11. Son HTML et ses preuves présentent bien le même « Au tour de » et masque SVG. Aucun changement visuel de B11 n'a été introduit après sa capture.

## Résultats

- 14 contextes : aucune image manquante, aucun mot de contenu tronqué, aucun débordement horizontal hors 1920 px. Les noms longs disposent d'une ellipse intentionnelle et d'une place numérotée stable.
- 14 PNG overlay : RGBA, 1920×1080, centre alpha nul ; de 75,29 % à 92,67 % des pixels sont strictement transparents selon l'état. Les ombres translucides font partie du reste. Aucun rectangle central opaque.
- Réductions Twitch 390×220 : vidéo et visages lisibles, noms des contenus d'environ 13 px, camps finaux d'environ 11,4 px. Les petites métadonnées de joueur restent secondaires ; les scènes de focus privilégient le nom actif.
- B3/B14 : absence de relation joueur → contenu dans le HTML, pas de script, pas de bloc JSON ni de contrôles. Les cartes de contenus seules ne contiennent aucune identité de joueur.
- B5 : compte de participation seulement. B6 : camp d'une élimination publiquement résolue, aucun mot. B8 : révélation finale explicitement autorisée.
- HTML autonomes : polices et images embarquées, CSP sans réseau ni script. Les assets restent des références de maquette, pas des ajouts applicatifs.

Les preuves sont des captures Chromium isolé, pas OBS réel ou iPhone physique. Le workflow de production antérieur n'est ni modifié ni revalidé par ces maquettes.
