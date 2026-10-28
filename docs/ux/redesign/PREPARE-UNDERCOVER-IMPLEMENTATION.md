# Bloc 2 — Préparer une partie Undercover

Branche : `ux/block-2-prepare-undercover`.
Base vérifiée : `integration/blocks-5-6-7`, `022b5549187a4195e0947040101830c5006d9795`.
Les trois intégrations B5/B6/B7 sont ancêtres de cette branche. Aucune fusion vers
une autre branche, aucun déploiement, aucune modification de moteur ou d’API.

## Références et rendu réel

Projet Stitch `7117487747163082855`, références humaines acquises, sans appel Stitch :

| Surface | Référence APPROVED                                                         | Capture d’implémentation                                         |
| ------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Desktop | [4143568521582746268](prepare-undercover-desktop/approved.png)             | [1440 px](prepare-undercover-desktop/implementation-desktop.png) |
| Mobile  | [12712e36e77f4c33850ed5b07962942d](prepare-undercover-mobile/approved.png) | [390 px](prepare-undercover-mobile/implementation-mobile.png)    |

Les quatre fichiers approved PNG/HTML sont inchangés, vérifiés par SHA-256.
Les deux SPEC ont été complétées depuis les contrats et le fonctionnement actuel.
Aucun placeholder n’a été traité comme une demande de revalidation humaine.

Le rendu reprend la grille desktop, le résumé à droite, la colonne mobile, les
options fermées et l’action citron. Polices locales Space Grotesk / DM Sans et
tokens `--home-*` existants : aucune police distante ni nouvelle palette dispersée.
Les trois thèmes privés restent disponibles ; Neon Show est utilisé pour comparer
les captures avec Stitch. Le thème privé par défaut existant n’est pas changé.

## Comportements livrés et conservés

- `/play/undercover` : 3–12 participants prévus, saisie ou boutons − / + ; 1–5 tours
  d’indices, **2 par défaut** ; format fixe **Classique**.
- Le résumé suit les choix. Le nombre prévu reste local : il ne limite pas le salon.
- **Préparer la partie** ouvre le salon d’invitation, sans joueurs fictifs et sans
  distribution. Le salon contrôle l’effectif réel et la majorité civile, ferme les
  inscriptions lorsqu’on prépare, puis le GM distribue séparément les mots.
- **Rôles et distribution** conserve le nombre d’Undercover, la limite de manches,
  le récapitulatif de répartition prévue et les règles effectivement implémentées.
- **Mots** conserve les deux mots privés, leur validation et leurs valeurs mémorisées.
- **Plateau de diffusion** réutilise le véritable éditeur B6, ses dispositions, ses
  propriétés et son renderer public. Aucun nouvel éditeur ; aucun participant créé
  à partir de ses noms d’exemple. Thème public figé dans la session, jamais dérivé
  de la préférence privée du navigateur.
- **Tester avec le laboratoire**, fermé et secondaire, conserve le chemin quick,
  les vrais joueurs indépendants et la préparation reprenable de B7. Ce n’est pas
  un mode de règles alternatif à Classique. Un essai précédent ne transforme pas
  le prochain bouton principal en lancement automatique de joueurs fictifs.
- Restauration des préférences de l’onglet, erreurs de stockage explicites, garde
  contre les doubles soumissions et verrouillage pendant la requête.
- Reprise d’une réponse incertaine avec le même requestId, token et payload, même
  après rechargement. Des modifications incompatibles restaurent la tentative
  précédente sans créer une seconde partie. Refus HTTP définitif : correction possible.
- Les valeurs invalides restent éditables ; les détails contenant un champ invalide
  s’ouvrent pour permettre la correction. Le message reçoit le focus.

## Adaptations justifiées aux maquettes

1. Le laboratoire est une ligne secondaire repliée supplémentaire : sa suppression
   aurait fait perdre les capacités de test demandées.
2. Les états réels de chargement, erreur et reprise complètent la référence. Le CTA
   devient **Reprendre la préparation** si une demande attend sa confirmation.
3. L’option de diffusion ouverte occupe toute la largeur disponible sur desktop.
   Sur mobile, le petit aperçu emploie les mêmes champs numériques et dispositions
   B6 plutôt que des poignées miniatures. L’éditeur de session B6 est inchangé.
4. Le canevas vide des exports natifs n’est pas une largeur imposée à l’application.
   Les captures sont prises dans de véritables viewports 1440 et 390 px.
5. Les bordures, focus et couleurs viennent des tokens déjà ajustés pour le contraste,
   plutôt que de recopier les valeurs de l’export HTML. Aucun CDN ou script exporté.

## Fichiers modifiés

- `apps/web/src/components/official-game-setup.tsx` : présentation et orchestration
  des deux parcours existants, conservation du reçu et retour d’erreur.
- `apps/web/src/app/prepare-undercover.css` : styles limités à la préparation ; safe
  areas, barre d’action mobile et réserve de contenu. Aucun style OBS modifié.
- Les deux `SPEC.md`, `DESIGN.md`, ce bilan, README et le guide manuel.
- `tests/e2e/prepare-undercover.spec.ts`, `playwright.prepare.config.ts`, commande
  `test:prepare` et classement des sorties du runner.
- Les tests existants qui entrent dans la préparation : utilisation des disclosures
  et des nouveaux libellés. Les assertions de gameplay, confidentialité et permissions
  sont conservées ; les anciens écrans de maintenance gardent leur parcours propre.

## Vérifications

Le bilan chiffré est consigné après les exécutions dans `../pipeline/block-2.json`.
Les nouveaux scénarios vérifient les options persistées, les thèmes indépendants,
le vrai parcours préparation → salon → régie → distribution, les invitations sans
capacité liée à la prévision, la séparation QA, les refus, le stockage indisponible,
la reprise identique et les doubles soumissions.

Les contrôles de géométrie portent sur les commandes tactiles, les champs à 16 px,
l’absence de débordement, le zoom autorisé et une petite hauteur de viewport. Les
parcours existants conservent de vrais contextes isolés, les vrais flux SSE et les
projections publiques indépendantes.

Reproduire :

```sh
npm run check
npm run test:prepare
npm run test:home
npm run test:players
npm run test:games
npm run test:layout
npm run test:stream
```

Dans le Cloud de vérification, les suites Chromium utilisent
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.
Les suites ont chacune une base SQLite temporaire ; les groupes parallèles utilisent
également des ports et des builds isolés. Aucun assouplissement des autorisations ou
des validations serveur pour faire passer les tests.

## Validation humaine et limites

[Guide simple iPhone et ordinateur](../../TEST-PREPARE-UNDERCOVER.md).

Implémentation et vérification navigateur ne valent pas validation ergonomique
sur votre iPhone. Safari, VoiceOver et les interactions avec le véritable clavier
iOS restent à tester. Le viewport réduit vérifie l’accessibilité du champ au-dessus
du CTA, sans simuler exactement les barres de Safari.

Aucun nouveau test OBS physique n’a été réalisé. Le workflow OBS précédemment
validé par l’utilisateur n’est pas remis en cause ; son rendu partagé est préservé.
Aucun nouveau mode, rôle, moteur, jeu annoncé jouable, écran suivant ou service ajouté.
