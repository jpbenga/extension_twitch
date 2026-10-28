# Bloc 6 — Broadcast / Spectateur / OBS — transmission d’intégration

Les quatorze références sélectionnées sont APPROVED par l’utilisateur. La validation UX ne bloque plus l’intégration. Le manifeste et `block-6-intents.json` associent chaque référence à son intention, aux comportements réels et aux critères de réception. Les HTML sont des références de composition ; adapter les composants React existants et leurs styles, sans reconstruire l’application à partir d’un export statique.

## Architecture et fichiers concernés

- `apps/web/src/components/broadcast-overlay.tsx` : renderer unique pour OBS, aperçu, comparatif du laboratoire et canvas de l’éditeur. Il reçoit exclusivement `PublicSessionView`, éventuellement un override de layout pour le brouillon.
- `apps/web/src/components/broadcast-feed.tsx` : flux public autonome, cadrage et décor fictif facultatif ; conserver le curseur de cues et l’époque de connexion.
- `apps/web/src/components/public-session.tsx` : composition publique classique responsive de `/sessions/:id/public`. Elle demeure distincte de l’overlay et garde les anciens liens.
- `apps/web/src/components/stream-preview.tsx` : shell de l’aperçu, scène fictive/overlay seul, outils OBS publics et capacités spectateur réelles.
- `apps/web/src/components/session-layout-editor.tsx` : autorisation GM séparée, brouillon, conflit, enregistrement et reprise du reçu.
- `apps/web/src/components/undercover-layout-editor.tsx` et `apps/web/src/lib/undercover-layout.ts` : sélection, gestes, champs, bornes et cartes individuelles.
- `apps/web/src/app/broadcast.css` et tokens partagés : présentation et cadrage. Examiner les sélecteurs partagés avec B5/B7 avant toute modification globale.
- `packages/contracts/src/undercover-layout.ts` : contrat à préserver ; `packages/engine/src/mechanics.ts` (`projectPlay`) : publication autoritaire des informations. Aucune règle à déplacer dans la présentation.
- `docs/UNDERCOVER-LAYOUT.md`, `docs/STREAM-PREVIEW.md`, `docs/TEST-STREAM-PREVIEW.md` : contraintes et scénarios existants ; leurs anciens résultats de tests ne constituent pas une nouvelle exécution.

## Coordination B5 / B7

B5 expose les liens de régie vers l’aperçu et la personnalisation, et reste seul responsable des commandes de gameplay. Le comparatif B7 doit monter le véritable `BroadcastFeed` / `BroadcastOverlay` et ses sept widgets ; ne pas conserver son panneau d’émission simplifié de maquette comme un second renderer. Le joueur privé sélectionné reste un contexte d’accès distinct. Les styles du shell et les confirmations peuvent être communs : coordonner leur propriété avec les agents B5/B7 pour éviter deux versions divergentes.

## Invariants à préserver

1. Les sorties publiques lisent un flux public indépendant. Aucun état GM ou joueur filtré dans React pour fabriquer une projection publique. Aucune invitation ou capacité privée dans une URL d’observation.
2. Avant la fin : aucun mot ou rôle encore secret, ni décompte des camps cachés. Un rôle d’éliminé est affichable seulement lorsqu’il a été publié. Pendant le vote ouvert : participation seulement, jamais les choix ou totaux par candidat. Après résolution : décomptes publics ; après publication finale : révélations autorisées.
3. Spectateur en lecture seule, aucune fausse intégration Twitch, chat, Bits, micro ou vote externe. Le GM confirme les indices, ouvre/révèle le vote et lance la manche suivante.
4. Sept widgets obligatoires : `header`, `phase`, `round`, `players`, `vote`, `result`, `events`. Aucun ajout, masquage ou suppression. Repère1920×1080, marge24px et minimas contractuels. Quatre presets : `balanced`, `bottom`, `lateral`, `centered`. Quatre modes de cartes : `grid`, `horizontal`, `vertical`, `free` ; les douze places persistent, l’ordre visuel n’altère pas la parole ou les rôles.
5. Le brouillon est privé et propre à l’onglet. `overlay.configure` conserve autorisation, expectedVersion, transaction, reçu d’idempotence et SSE. Sauvegarder ne réinitialise pas le jeu et ne change pas l’URL OBS. Un layout distant différent bloque l’écrasement des modifications locales ; leur remplacement demande confirmation. Un changement de gameplay seul n’est pas ce conflit. Une réponse incertaine se reprend avec la même demande.
6. Préférence d’apparence privée et `broadcastTheme` public figé de session sont indépendants. Conserver Neon Show, Broadcast Studio et On Air Premium avec la même géométrie ; aucune quatrième direction.
7. OBS est transparent,16:9 et sans shell, contrôle ou damier. Les PNG natifs Stitch aplatis ne font pas foi pour l’alpha : contrôler une capture navigateur RGBA du renderer réel avec fond omis. Le damier et la scène fictive sont ajoutés uniquement autour du renderer par les outils d’aperçu/édition.
8. Ouverture tardive/reconnexion : restaurer l’état durable sans rejouer les effets historiques ; présence sans nouvelle version ne doit pas redéclencher un événement. Mouvement réduit conservé. Le rejeu efface les anciennes révélations publiques selon le serveur.

## Corrections explicitement nécessaires pendant l’intégration

- **Progression orale tronquée dans la référence OBS Discussion** : corriger le reflow, le calibrage de typographie et les contraintes de hauteur dans le widget `phase`, sans supprimer l’information ni changer le schéma de layout. Le nombre de passages et le tour d’indices doivent rester entièrement lisibles. C’est une correction d’exécution de la référence approuvée.
- **Noms longs** : vérifier noms32 caractères, titres et valeurs finales longues aux effectifs3,6,12 et aux quatre presets. Éviter le débordement et la disparition des chiffres de progression. Une ellipse de nom maîtrisée dans OBS est compatible avec les contraintes existantes ; le plateau classique garde les données complètes consultables. Ne pas tronquer arbitrairement toutes les lignes.
- **Comparatif B7** : utiliser le renderer public partagé à sept widgets ; aucune copie réduite indépendante du visuel approuvé B6.

## Scénarios et captures attendus après intégration

- Préparation avant distribution, discussion au premier et dernier passage, indices terminés, vote partiel puis complet, élimination non finale, égalité, victoire de chacun des camps, nul puis vrai rejeu. Utiliser des commandes réelles et des fixtures de test autorisées, jamais de résultat inventé dans la page.
- Comparer l’état public durable de l’aperçu et d’OBS, puis ouvrir tardivement et reconnecter : aucun rejeu d’effet historique. Vérifier les réponses publiques brutes et le DOM avant révélation.
- Capturer les sept états OBS en1920×1080 RGBA ; vérifier alpha nul hors panneaux. À1280×800 le renderer doit être1280×720 centré, avec bandes transparentes de40px en haut et en bas.
- Capturer spectateur, aperçu et éditeur à1440×900 et390×844. La miniature conserve16:9 ; aucun scroll horizontal, cibles utiles44px minimum et saisies mobiles16px minimum.
- Vérifier toutes les variantes de données et les trois thèmes publics, indépendamment du thème privé. Faire un contrôle explicite de la progression orale et des noms longs.
- Éditeur : gestes, clavier, champs bornés, cartes individuelles, quatre presets, remise au défaut confirmée, brouillon non enregistré, deux onglets concurrents, annulation/confirmation du chargement distant et reprise après réponse incertaine.
- S’appuyer sur les suites existantes `tests/e2e/stream-preview.spec.ts`, `tests/e2e/undercover-layout.spec.ts`, `tests/undercover-layout.test.ts`, puis les tests métier et de permissions pertinents. Compléter les régressions significatives pour la confidentialité et le clipping corrigé. Exécuter les contrôles du dépôt requis sur la branche d’intégration.

## Limites et réception

Cette transmission prépare des références et des intentions fonctionnelles ; elle ne constitue ni une implémentation ni une nouvelle campagne de tests. Les maquettes ont été contrôlées dans Chromium ; l’approbation visuelle utilisateur des quatorze références est acquise. Les futurs rendus intégrés et leurs captures restent à produire. Distinguer explicitement tests navigateur, OBS réel, Safari/iPhone physique et accessibilité : une capture Chromium ne prouve pas ces dernières validations. Les anciennes réserves de catalogue B6 sont levées pour les quatorze références finales indexées ; conserver les IDs choisis, sans réutiliser une génération superseded.
