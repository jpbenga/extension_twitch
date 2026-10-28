# Bloc 7 — Handoff fonctionnel des références APPROVED

Les sept références du projet Stitch `8710675424358674545` sont approuvées par l’utilisateur. Leurs captures restent la référence visuelle ; le code existant reste la référence métier. `block-7-intents.json` précise les sept intentions et critères d’acceptation. Le HTML sert d’aide visuelle et ne doit pas être transplanté comme application.

Les captures, HTML, Project IDs et Screen IDs versionnés suffisent à reprendre l’intégration Cloud. L’index incomplet du catalogue Stitch ne remet pas en cause cette approbation et ne justifie ni recréation des designs ni nouvelle demande de validation UX. Les rendus d’implémentation doivent être enregistrés séparément des captures APPROVED.

## Périmètre et invariants

Le Bloc 7 refond le shell privé QA, les accès et les retours de préparation/rejeu. Les commandes de partie viennent des panneaux B5 ; les fonctions joueur viennent de B4 ; le rendu public vient de B6. Le laboratoire reste distinct des parcours normaux, sans contrôle QA ajouté aux pages GM, joueur ou spectateur.

- Une seule projection privée est montée à la fois, obtenue avec l’accès réel de l’identité sélectionnée. Seuls les joueurs effectivement inscrits figurent dans le sélecteur et les accès.
- Le comparatif monte un `BroadcastFeed` public indépendant. Aucune filtration frontend d’un état GM ou joueur pour fabriquer le public.
- La préférence privée d’apparence ne modifie pas le thème de session/OBS. Conserver les thèmes officiels et leurs géométries communes.
- Les commandes restent validées par le serveur. Le laboratoire n’injecte ni rôle, ni phase, ni résultat.
- Le probe existant tente `session.rename` avec l’accès du premier joueur et attend un refus 403. Un résultat illustré dans une capture n’est pas une preuve d’exécution.
- Recommencer appelle `game.restart`, conserve session, identités et accès, efface votes/résultats. Pour Undercover officiel, la nouvelle distribution appartient au GM après retour en préparation. Le reset salon B5 est une autre opération qui révoque les accès.
- Reprendre la préparation réutilise le même essai, les inscriptions et les reçus existants ; les actions incertaines conservent leur identité et ne sont pas rejouées avec de nouveaux identifiants.
- L’absence de stockage local signifie accès indisponibles dans cet onglet, sans conclusion sur l’existence de la session serveur.
- Ne pas réactiver l’ancien Creator ou le laboratoire générique legacy fermé par défaut. Le laboratoire officiel ne dépend pas de la bibliothèque Creator.

## Sources et coordination transverse

| Fichier existant                                                                | Usage / coordination                                                                                                         |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/components/creator-laboratory.tsx`                                | Shell QA, perspective, accès, comparatif, reprise et confirmation du rejeu. Point principal B7.                              |
| `apps/web/src/lib/creator-lab.ts`                                               | Stockage, inscriptions, commandes, reçus, préparation, restart et probe. Préserver les contrats et la logique d’idempotence. |
| `apps/web/src/components/official-games-lab.tsx`                                | Entrée du laboratoire des jeux officiels ; préserver le parcours de préparation.                                             |
| `apps/web/src/app/play/lab/[id]/page.tsx`                                       | Route officielle du laboratoire.                                                                                             |
| `apps/web/src/components/game-panel.tsx`                                        | Panneaux de partie privés partagés avec B5/B4 ; coordonner tout changement avec B5.                                          |
| `apps/web/src/components/broadcast-feed.tsx`                                    | Projection publique indépendante et choix du thème public ; partagé avec B6.                                                 |
| `apps/web/src/components/broadcast-overlay.tsx`                                 | Unique renderer public : sept widgets et quatre dispositions B6. B6 en est propriétaire ; B7 le consomme.                    |
| `apps/web/src/components/public-session.tsx`, `spectator-test.tsx`              | Perspective spectateur et capacités en lecture seule. Ne pas inventer une connexion Twitch/Bits/récompenses.                 |
| `apps/web/src/lib/use-session.ts`, `session-client.ts`                          | SSE, permissions, reconnexion et commandes incertaines ; invariants transverses, pas de refonte métier.                      |
| `apps/web/src/components/ui/feedback.tsx`, `ui/primitives.tsx`, `copy-link.tsx` | Confirmation accessible, sélecteur et copies privées partagés. Éviter les variantes concurrentes.                            |
| `apps/web/src/app/tokens.css` et styles globaux existants                       | Thèmes et primitives partagés avec B1 à B6. Privilégier des styles B7 ciblés ; documenter tout ajustement commun nécessaire. |

Avant modification, confirmer les chemins et leurs usages dans la branche Cloud courante. Aucun fichier source n’a été modifié par ce handoff.

## Corrections déjà autorisées pour l’intégration

1. **Contraste** : augmenter les petits textes utiles à au moins 4,5:1, y compris les disclosures et états secondaires. Les gris `#7E7199` et `#8479A1` sur `#1A1A2D` présents dans certaines maquettes sont insuffisants pour ces petits textes ; ne pas les traiter comme tokens de texte approuvés. Préserver la direction indigo/lilas/citron et contrôler également les autres thèmes.
2. **Comparatif réel** : remplacer le panneau émission simplifié de la maquette par `BroadcastFeed` / `BroadcastOverlay` B6 et ses sept widgets. Réutiliser les dispositions et le layout autoritaire existants, sans image statique ni deuxième implémentation de renderer.
3. **Confort mobile** : largeur de 390 px sans débordement horizontal, cibles d’au moins 44 px, texte d’input d’au moins 16 px, safe areas, focus et zoom autorisé. Le comparatif côte à côte n’est pas imposé sur téléphone.

Ces ajustements mettent les références en cohérence avec le métier et l’accessibilité ; ils ne nécessitent pas de nouveau design Stitch.

## Scénarios et captures d’implémentation attendus

| Référence                 | État réel à capturer                                                                                | Viewport conseillé |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| `lab-main-desktop`        | Laboratoire officiel actif, GM sélectionné, identité visible, outils repliés, vraie action de phase | 1440 × 1000        |
| `lab-main-mobile`         | Même essai et même intention sur téléphone ; sélecteur, action et accès utilisables                 | 390 × 844          |
| `lab-compare-desktop`     | Joueur privé sélectionné et flux public indépendant de la même session ; sept widgets B6            | 1440 × 1000        |
| `lab-access-desktop`      | Accès regroupés ouverts et contrôle de permission exécuté réellement                                | 1440 × 1000        |
| `lab-restart-desktop`     | Dialogue avant envoi de `game.restart`, puis vérification réelle de conservation des accès          | 1440 × 1000        |
| `lab-resume-desktop`      | Préparation interrompue reproductible avec reçus conservés, puis reprise du même essai              | 1440 × 1000        |
| `lab-unavailable-desktop` | Onglet sans accès locaux, message exact et retour au jeu officiel                                   | 1440 × 1000        |

Les viewports ci-dessus sont des cibles de capture d’implémentation, pas une revendication de hauteur des PNG Stitch. Ajuster la hauteur ou produire une capture complète si nécessaire sans masquer l’action principale. Les données de démonstration doivent être fictives ; ne pas versionner de secrets réels, liens privés signés ou identifiants d’accès dans captures, journaux et rapports.

## Vérifications d’intégration à exécuter dans le worktree B7

- Parcours navigateur : bascule GM / joueur réel / spectateur, une seule projection privée, identité persistée, accès individuel sur un autre contexte navigateur.
- Confidentialité : mot privé absent du DOM, des réponses et du flux public jusqu’à la révélation autorisée ; aucun outil QA sur les pages normales.
- Comparatif : même renderer et layout que preview/OBS, sept widgets, quatre dispositions conservées, thèmes privés/publics indépendants, absence de rejeu d’anciens effets après reconnexion.
- Probe réel : refus serveur 403, état d’erreur si une commande de gestion était acceptée, gestion de la requête échouée distincte du succès attendu.
- Préparation : interruption après inscription partielle ou résultat réseau incertain, reprise du même essai sans joueur ni action dupliqué.
- Restart : annulation sans mutation, double clic verrouillé, réponse perdue puis reprise sans deuxième reset, conservation des liens et nouvelle distribution GM.
- Accessibilité : clavier et focus de confirmation/disclosures/sélecteur, annonces de statut/erreur, contrastes calculés des trois thèmes, contrôle 390 px.
- Regressions ciblées existantes : `tests/e2e/official-games.spec.ts`, `stream-preview.spec.ts`, `ux-experiences.spec.ts` ; les tests historiques `creator-ux.spec.ts` documentent aussi la reprise après reçu perdu sans justifier une réactivation du legacy.
- Exécuter les tests pertinents, TypeScript strict, formatage/lint configurés et build ; coordonner ensuite les vérifications croisées B5/B6/B7. Rapporter séparément les tests navigateur, iPhone physique et OBS réel.

## Limites et état du transfert

L’utilisateur a validé les designs. L’ancien statut AWAITING_APPROVAL des rapports historiques décrit la livraison avant cette validation et n’est pas un blocage actuel. Le catalogue Stitch incomplet est une limite de consultation du Canvas ; l’intégration doit consommer les références exportées dans Git.

Ce document prépare le transfert et ne revendique aucune interface intégrée, aucun nouveau test exécuté, aucune capture du produit ni aucun état READY_TO_MERGE. Les seules captures existantes à ce stade sont des références de design. Les corrections de contraste et le raccordement au renderer réel restent du travail d’intégration autorisé.
