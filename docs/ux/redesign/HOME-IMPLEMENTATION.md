# Accueil — première intégration Stitch

Base : `3c02734`, après export des références validées et audit fonctionnel.
Branche : `feat/stitch-homepage`. Cette livraison concerne uniquement `/`.
Les captures, HTML et SPEC APPROVED restent inchangés.

## Choix d’implémentation

- `Welcome` remplace la composition de l’accueil, sans remplacer le catalogue
  `/play` partagé par les autres écrans. La grille desktop 7/5 et la colonne mobile
  reprennent les références ; le catalogue reste discrètement accessible en pied de page.
- `home.css` n’utilise que des sélecteurs de l’accueil. Les tokens `--home-*` sont
  centralisés dans `tokens.css` et scoped à `.home-page` ; aucun token du moteur,
  de la régie ou de l’overlay n’est remplacé. Les polices de référence sont locales.
- L’authentification de reprise est extraite de `ResumeSession` dans
  `useRecentSession`. Même référence d’onglet, même GET privé avec accès GM, même
  validation `gmSessionSchema`, même exclusion des parties terminées, même choix
  laboratoire/régie. Le composant existant garde son interface pour ses autres usages.
- La validation de code/lien est extraite sans changement de règles de `SessionEntry`
  dans `lib/invitation.ts`. `/join` et le nouveau formulaire d’accueil utilisent la
  même fonction. Le nom et l’inscription effective restent sur le parcours existant.
- Le contrôle Apparence est réutilisé avec une icône facultative. Ses autres usages
  restent identiques. Aucune nouvelle dépendance, API, table ou permission.

## États absents des images, maintenant représentés

| Situation                                       | Présentation de l’accueil                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Aucune partie locale récupérable                | Préparer reste dominant. « Retrouver » déplie l’aide au lien privé ; aucune recherche ou session fictive.                               |
| Une référence GM attend la vérification serveur | « Vérification de votre accès… » dans le bloc animateur. Les autres actions restent utilisables.                                        |
| Reprise autorisée                               | Titre serveur, « Reprendre ma partie » dominant, lien de préparation secondaire. La reprise est avant le jeu dans le DOM et sur mobile. |
| Accès refusé ou problème de connexion/stockage  | Message court dans ce même bloc et aide au lien privé. Pas d’identifiant ni diagnostic réseau permanent.                                |
| Partie terminée                                 | Message explicite, pas de lien de reprise automatique ; l’aide rappelle l’usage du lien privé. Aucun effacement ou rejeu implicite.     |
| Invitation mal formée                           | Erreur sous le champ, champ marqué invalide, aucun appel serveur. Une valeur valide ouvre le choix du nom.                              |
| Découvrir / Apparence ouverts                   | Contenus secondaires dans le langage de la page, sans nouvelle route de jeu ou configuration de l’overlay.                              |

## Trois thèmes, un seul accueil

Neon Show est la direction indigo/aubergine, lilas et citron des références Stitch.
Broadcast Studio conserve les accents turquoise/bleu ; On Air Premium le champagne
et le graphite. Seuls les tokens visuels de cette page varient. La structure, les
composants, les labels, les états, les destinations et la priorité sont communs.
La préférence existante et le défaut Broadcast Studio sont conservés, sans migration.
Le thème public de chaque partie et OBS gardent leur propre valeur serveur.

## Comparaison aux références

| Référence                                        | Capture de l’application                                         |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| [Desktop APPROVED](accueil-desktop/approved.png) | [Desktop implémenté](accueil-desktop/implementation-desktop.png) |
| [Mobile APPROVED](accueil-mobile/approved.png)   | [Mobile implémenté](accueil-mobile/implementation-mobile.png)    |

Les captures principales utilisent Neon Show pour comparer à la palette approuvée.
Desktop : viewport CSS 1280 × 1024, échelle 2, pour les dimensions 2560 × 2048 de la
référence. Mobile : viewport CSS 390 × 926, échelle 2, capture pleine page. Le PNG
Stitch mobile contient une colonne de téléphone dans un canevas vide de 2560 px ;
la capture d’application montre directement le téléphone, sans ces marges artificielles.
Sa hauteur pleine page est de 982 px CSS (780 × 1964 pixels à l’échelle 2), contre
926 px CSS pour le canevas de référence, avec les cibles tactiles et l’accès catalogue conservés.
Des captures complémentaires des autres thèmes et des états sont dans `screenshots/home-stitch/`.

Écarts volontaires :

- Le bouton « Retrouver » ouvre une véritable aide en l’absence de reprise. Une
  reprise valide change l’ordre et la hiérarchie ; ce n’est pas l’état statique de Stitch.
- Les disclosures ont des cibles d’au moins 44 px, même quand le lien de l’export
  est plus petit. Le footer conserve le lien réel du catalogue, absent de l’image.
- Les champs mobiles sont à 16 px et le zoom du navigateur reste autorisé. Les
  bordures de contrôle sont légèrement renforcées pour le contraste ; les couleurs
  sémantiques existantes ne sont pas modifiées sur les autres écrans.
- Les icônes sont des SVG intégrés, sans police distante d’icônes. Les deux familles
  typographiques de référence sont servies localement avec leurs licences.
- Le CDN de l’illustration Google refuse le téléchargement depuis ce Cloud. L’URL
  originale de l’export est conservée et peut s’afficher si le navigateur y accède.
  Le repli local cadre la zone illustrée du PNG APPROVED, copié sans modification.
  Son cadrage est plus serré et sa résolution utile inférieure à l’original. Les
  captures Cloud montrent ce repli, pas une illustration inventée. Voir
  [provenance des ressources](../../../apps/web/public/home/ASSETS.md).

## Tests humains simples

Depuis le dossier du projet, arrêtez d’abord l’ancien serveur avec Ctrl+C, puis :

```sh
nvm use 24
npm ci
npm run dev:lan
```

Ouvrez l’adresse affichée sur l’ordinateur et sur l’iPhone du même Wi-Fi. L’URL de
l’accueil est `/`. Le simple passage à l’accueil n’arrête pas une partie existante.

1. Ouvrez Apparence et choisissez Neon Show. Comparez la composition à la référence.
   Essayez ensuite les deux autres thèmes : même page, autres couleurs ; rechargez
   pour vérifier la préférence. Un autre appareil a sa propre préférence.
2. Touchez Découvrir le jeu : le concept et le statut de démonstration apparaissent.
   Refermez-le ; la page retrouve sa densité normale.
3. Sans reprise disponible, touchez Retrouver : seule l’aide au lien privé apparaît.
   Aucun faux historique de compte ne doit être annoncé.
4. Saisissez `invalide` dans l’invitation et touchez Rejoindre : erreur sous le champ,
   sans quitter la page. Un champ vide reste requis.
5. Touchez Préparer une partie : seuls les réglages Undercover s’ouvrent. Lancez
   ensuite volontairement une démonstration, puis revenez à l’accueil. Le titre réel
   et Reprendre ma partie apparaissent après vérification. Touchez ce bouton : le
   laboratoire revient dans son véritable état. Aucun mot n’a été distribué par l’accueil.
6. Pour tester une invitation réelle, créez plutôt une partie « Inviter de vrais
   participants » depuis les réglages. Copiez son invitation, ouvrez l’accueil dans
   un autre navigateur/onglet indépendant et collez le code ou le lien. Rejoindre
   ouvre le choix du nom ; l’inscription met ensuite le salon du GM à jour.
7. Conservez une source OBS ouverte pendant un changement de thème de l’accueil :
   le plateau public doit garder le thème choisi pour sa partie.

Sur iPhone, apprécier la lisibilité, les zones tactiles, le clavier, le zoom et les
safe areas. Ces nouveaux écrans ne sont pas validés sur appareil physique par les
tests Chromium ; le premier workflow OBS déjà validé reste un acquis distinct.

## Vérifications techniques

Résultats exécutés pour cette livraison, avec Chromium dans cet environnement :

| Vérification          | Résultat                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run check`       | Format, 186 tests unitaires/intégration, TypeScript strict et compilation réussis              |
| `npm run test:home`   | 16 parcours, 320/390/768/1440 px                                                               |
| `npm run test:e2e`    | 42 parcours produit et sessions                                                                |
| `npm run test:ux`     | 12 parcours, avec partie réelle multicontexte, accueil après victoire et thème OBS indépendant |
| `npm run test:games`  | 12 parties/parcours Undercover                                                                 |
| `npm run test:stream` | 9 parcours de rendu public, synchronisation et reconnexion                                     |
| `npm run test:design` | 12 parcours de confirmations, focus et responsive                                              |
| `npm run test:layout` | 6 parcours de disposition, sauvegarde, concurrence et partie réelle                            |

Total : **109 parcours navigateur réussis**. Le formatage et l’intégrité des quatre
exports APPROVED ainsi que des deux SPEC ont aussi été vérifiés. Aucune validation
physique iPhone, Safari iOS ou OBS nouveau n’est revendiquée. Les contrastes mesurés
des paires de tokens ne constituent pas une certification d’accessibilité globale.
