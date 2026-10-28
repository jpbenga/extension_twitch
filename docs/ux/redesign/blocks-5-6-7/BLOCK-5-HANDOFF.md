# Bloc 5 — Régie GM — référence APPROVED et reprise Cloud

Les 22 références du projet Stitch `11936034876302496963` sont **APPROVED par validation humaine explicite**. La mention historique `AWAITING_APPROVAL` des rapports de conception décrit l’état avant cette décision ; elle n’ajoute aucune nouvelle validation à obtenir. Les captures restent les références visuelles approuvées et les HTML des aides visuelles statiques. Ce transfert ne constitue pas une intégration et ne revendique aucun nouveau test de l’application.

L’environnement Cloud dispose déjà de l’audit `docs/ux/pipeline/BLOCK-5-INTEGRATION.md`, du registre `block-5.json` et de la branche locale `ux/block-5-gm`, commit d’audit `26aa6b1`. Reprendre ce travail après récupération des artefacts versionnés ; ne pas dupliquer l’audit ni créer une nouvelle interface à partir d’une description seule.

## Contrat fonctionnel

- Le Bloc 3 termine sur `game.use-prepared` : l’effectif est figé mais les mots ne sont pas distribués. B5 démarre sur `deal`, action aléatoire et atomique serveur, puis Discussion.
- Shell stable **Partie / Joueurs / Plateau** sur desktop et mobile. Une seule action domine selon l’état autoritaire. Conserver routes, hash, identité des participants, SSE, SQLite, permissions, commandes et reçus.
- La confirmation de l’indice est une action GM `confirm-clue`. Les indices sont oraux ; aucun microphone, texte saisi, compte à rebours ni automatisme de présence n’est ajouté.
- `open-vote` ne peut suivre que l’achèvement de tous les tours d’indices configurés, deux par défaut et 1 à 5 disponibles. L’état serveur et les actions projetées déterminent la disponibilité réelle.
- Chaque actif vote une fois pour un autre actif, sans auto-vote, abstention ni changement. Préserver la délégation GM existante `game.player-action` pour un éligible n’ayant pas encore voté, avec confirmation et validations identiques.
- `resolve` demande une confirmation et tous les votes. Avant résolution, seul le suivi de participation est affiché. Après résolution, le décompte agrégé et le camp de l’éliminé sont publics. En cas d’égalité, personne n’est éliminé. Aucun mot n’est rendu public avant fin.
- `next` commence la manche suivante uniquement si le serveur n’a pas terminé la partie. Victoire Civils, victoire Undercover et nul à la limite de manches restent calculés par le serveur ; le GM n’appartient à aucun camp.
- `game.restart` efface votes, éliminations et résultats et revient avant distribution en conservant joueurs et accès. `session.reset` retire les joueurs et révoque leurs accès. Les deux confirmations doivent rester distinctes.
- Conserver les informations privées GM autorisées et le journal dans des disclosures fermées par défaut. Le vote délégué réel est une fonction du produit, pas un outil QA. Aucun contrôle Lab dans cette interface.
- Accès privé GM masqué/copiable, renommage requis limité à 32 caractères, liens de diffusion conservés. Les trois apparences privées existantes restent disponibles et ne pilotent jamais le thème public OBS.
- Pendant une commande, une reconnexion ou un reçu incertain, verrouiller les actions. Réessayer conserve l’identité de commande existante et ne crée pas de double envoi.

## Références et états

`block-5-intents.json` contient exactement les 22 slugs destination `gm-*`, leur intention fonctionnelle, comportement réel, notes d’implémentation, viewport et critères d’acceptation.

Les 11 patrons desktop/mobile sont Distribution, Discussion, Ouverture vote, Suivi vote, Résultat intermédiaire, Fin, Joueurs, Accès/réglages, Confirmation révélation, Confirmation rejeu et Confirmation reset. Tour d’indices suivant, vote partiel/complet, égalité et différentes fins sont des variations d’état de ces patrons, pas de nouveaux modes de jeu.

Les captures responsive de référence font 1440 px de large sur desktop et 390 px sur mobile ; certaines sont des captures de page entière dépassant la hauteur du viewport. Capturer l’implémentation avec les mêmes largeurs, une fenêtre desktop 1440 × 1000 ou mobile 390 × 844 et une capture fullPage. Ne pas fixer la hauteur de l’interface à celle d’un PNG Stitch.

## Fichiers cibles et coordination

Les fichiers existants à examiner avant implémentation sont :

- `apps/web/src/components/undercover-room.tsx` : shell, onglets, états réseau, accès/réglages, effectif et onglet Plateau.
- `apps/web/src/components/play-panel.tsx` : commandes de jeu, progression, vote délégué, informations privées, journal, rejeu ; partagé avec d’autres perspectives, dont le laboratoire.
- `apps/web/src/components/game-action.tsx` : formulaires et confirmations des actions projetées ; composant partagé, sans changement de contrat.
- `apps/web/src/components/game-panel.tsx` et `apps/web/src/components/ui/feedback.tsx` : intégration des panneaux et confirmations accessibles ; coordonner toute modification partagée avec B7.
- `apps/web/src/components/application-theme.tsx`, `apps/web/src/app/tokens.css`, `brand-fonts.css`, `stitch-surfaces.css`, `experience.css` et `sessions.css` : privilégier le réemploi et une portée GM explicite. Ne pas modifier la géométrie ou la portée des Blocs 1 à 4 par effet de cascade.
- `apps/web/src/components/broadcast-feed.tsx` et le renderer `BroadcastOverlay` : dépendances de l’onglet Plateau, dont les changements visuels appartiennent à B6. Conserver le vrai flux public indépendant ; ne pas filtrer un état GM pour fabriquer le plateau.

Les définitions `packages/games/undercover/src/definition.ts`, le moteur et les contrats restent des références fonctionnelles. Aucune réécriture du métier n’est nécessaire à cette refonte. Déclarer et coordonner toute modification transverse avant de l’appliquer : une seule implémentation des commandes GM partagées et du renderer broadcast, compatible avec les autres blocs.

## Scénarios et captures à exécuter dans Cloud

1. Effectif préparé, puis distribution : ordre et projection serveur, absence de secret public, passage à Discussion.
2. Chaque indice et tour requis : confirmer les passages, vérifier le refus d’un vote prématuré, puis ouvrir le scrutin au bon moment.
3. Vote partiel puis complet : suivi reçu/éligible, impossibilité de révéler prématurément, délégation pour un joueur sans interface, restrictions de cible, confirmation et immutabilité du vote.
4. Confirmation de résolution : annuler sans effet, confirmer une fois ; tester élimination et égalité, puis manche suivante seulement si autorisée.
5. Fins Civils / Undercover / nul : résultat autoritaire, révélations bornées, aucun état de victoire personnel GM.
6. Rejouer puis réinitialiser sur des fixtures distincts : le premier conserve les accès ; le second les révoque. Annuler chaque confirmation doit être sans effet.
7. Joueurs, renommage, lien privé masqué, journal, secrets GM et apparences privées : tout reste accessible, sans changement du thème OBS.
8. Reconnexion, commande en cours et reçu incertain : pas de double action, même identité au réessai, état durable conservé.
9. Captures des 22 états importants, à 1440 et 390 px, comparaison APPROVED / IMPLEMENTATION, noms longs et disclosures ouverts en plus. Navigation clavier, focus du dialogue, Escape, retour de focus, cibles tactiles, contraste, zoom autorisé et safe-area iPhone.
10. Régression B1–4 et cohérence B5/B6/B7, notamment l’onglet Plateau et les commandes partagées du Lab. Exécuter les tests pertinents existants (`tests/undercover.test.ts`, `undercover-sessions.test.ts`, `undercover-persistence.test.ts`, `product-focus.test.ts`, E2E officiels et dialogues), ajouter uniquement les régressions utiles, puis TypeScript strict, build et vérifications de formatage/lint prévues. Ne pas présenter une exécution Chromium comme un test iPhone physique ou OBS réel.

## Réserves acceptées à corriger à l’intégration

La petite incohérence visuelle « Tour 2 » sous « Manche 2 » doit être harmonisée en distinguant clairement **manche** et **tour d’indices**. Cela concerne la copie de production ; pas de nouveau design Stitch ni nouvelle règle.

Les exports HTML peuvent contenir CDN, boutons statiques ou réglages de viewport inadaptés à la production. Réutiliser les composants, polices locales, permissions et styles accessibles de l’application ; conserver le zoom utilisateur. Ne jamais remplacer la référence APPROVED par une capture d’implémentation.

La validation visuelle est acquise. Les contrôles iPhone physique, Safari iOS et usage en direct concernent l’implémentation et doivent être rapportés honnêtement selon ce qui est effectivement exécuté. Aucune fusion ni aucun déploiement automatique.
