# Prompt Codex — intégrer l’accueil approuvé

La validation humaine de la petite refonte de l’accueil est acquise. Ne refais pas le design et ne demande pas une nouvelle validation avant de commencer.

Travaille à partir de la branche documentaire `ux/home-host-access-approved`. Lis d’abord :

- `AGENTS.md`, `docs/PRODUCT.md` et le README du dépôt ;
- `docs/ux/redesign/home-host-access/APPROVAL.json` ;
- `docs/ux/redesign/home-host-access/manifest.json` ;
- `docs/ux/redesign/home-host-access/SPEC.md` ;
- `docs/ux/redesign/home-host-access/HANDOFF.md` ;
- les huit PNG sous `docs/ux/redesign/home-host-access/screens/` ;
- `docs/ux/redesign/home-host-access/approved.html` comme référence interactive, jamais comme code React à copier aveuglément.

## Objectif

Implémente uniquement la refonte approuvée de l’accueil Extension Twitch :

1. ajouter un accès permanent et compact `Espace animateur` ;
2. relier `Mes parties préparées`, la régie autorisée et la diffusion aux routes et données déjà existantes ;
3. rendre le bloc animateur contextuel : première visite, préparation locale réellement identifiable, salon GM autorisé ou partie GM autorisée ;
4. ne montrer qu’une seule action contextuelle dominante ;
5. renommer le contrôle visible `Apparence` en `Thème` ;
6. présenter les trois thèmes existants sous forme de choix nommés ; appliquer immédiatement puis fermer après toute sélection, y compris celle du thème actif ;
7. assurer la fermeture par clic extérieur, Échap et bouton explicite, avec restitution du focus ;
8. reproduire la composition desktop et mobile approuvée sans scroll horizontal.

## Contraintes fonctionnelles non négociables

- Réutilise le stockage local et le conducteur Undercover existants ; n’ajoute aucun compte, cloud, dashboard SaaS ou nouvelle persistance.
- Conserve la validation serveur de l’accès GM. Une référence ou un token local ne suffit jamais à afficher un accès régie.
- Une session périmée/refusée ne doit pas masquer `Mes parties préparées`.
- Si une préparation inachevée ne peut pas être reconnue sans ambiguïté avec le modèle actuel, ne fabrique pas cet état.
- Conserve exactement les trois IDs de thème, leur préférence locale, leur défaut actuel et l’indépendance du thème OBS/public.
- Ne modifie pas le moteur de jeu, les secrets, les projections publiques, les routes serveur ni les futurs jeux.
- Ne copie pas le prototype HTML comme implémentation. Réutilise les composants, tokens, polices, icônes et conventions accessibles du dépôt.

## Fichiers à examiner en priorité

- `apps/web/src/components/welcome.tsx`
- `apps/web/src/components/application-theme.tsx`
- `apps/web/src/components/resume-session.tsx`
- `apps/web/src/app/home.css`
- `apps/web/src/lib/use-undercover-series.ts`
- `apps/web/src/lib/undercover-series.ts`
- `tests/e2e/home.spec.ts`
- les autres tests qui ciblent le nom accessible `Apparence de l’application`

Tu peux extraire un petit composant ou hook dédié si cela clarifie la séparation entre état autorisé, préparation locale et présentation. N’élargis pas le périmètre.

## Vérifications attendues

- ajoute ou adapte les tests des états vide, préparation, salon, partie active, référence GM refusée/terminée et stockage local indisponible ;
- vérifie les trois thèmes et l’indépendance OBS ;
- teste fermeture après sélection, même sélection, clic extérieur, Échap, retour du focus et comportement modal mobile ;
- préserve invitation valide/invalide, permissions GM et jeux à venir non cliquables ;
- exécute TypeScript strict, tests unitaires/intégration pertinents, build et tests Playwright accueil sur desktop/mobile ;
- produis des captures d’implémentation desktop et mobile comparées aux huit références approuvées.

Ne fusionne pas vers `main` et ne déploie rien. À la fin, donne : branche/commit, fichiers modifiés, tests exécutés avec résultats, captures produites, écarts éventuels et confirmation qu’aucune permission GM, donnée secrète ou configuration OBS n’a été affaiblie.
