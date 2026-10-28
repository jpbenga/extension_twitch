# Bloc 7 — Laboratoire privé et accès multi-rôles : bilan d’intégration

Les 7 références APPROVED sont intégrées sur `ux/block-7-lab`.
L’audit initial et le transfert documentaire sont conservés. Aucune fusion ni aucun déploiement.
Le statut opérationnel est enregistré dans [block-7.json](block-7.json).

## Fonctionnalités effectives

Le laboratoire officiel dispose d’un sélecteur de point de vue, d’une identité
annoncée, d’accès GM/joueurs/public séparés et d’un comparatif public facultatif.
Changer d’identité ferme les outils ouverts et remonte un seul panneau privé avec
son propre accès. La perspective est conservée dans cet onglet après rechargement.
Les liens LAN utilisent l’origine réellement ouverte, sans imposer localhost.

Accès aux vues, Outils de test et contrôle de permissions avancé sont regroupés.
Le contrôle envoie une vraie commande interdite avec un accès joueur ; une panne
réseau n’est pas présentée comme un refus de permission réussi. Le comparatif monte
le véritable BroadcastFeed indépendant. Les vues ordinaires n’offrent aucun sélecteur QA.

La préparation interrompue reprend le même essai. Le rejeu personnalisé conserve les
accès et réutilise le reçu persisté après une réponse perdue, sans nouvelle remise
à zéro. Une ouverture sans état local montre un accès indisponible, sans attribution
automatique de droits. Le Studio historique de maintenance conserve sa présentation.

Fichiers principaux : `official-laboratory.tsx`, `creator-laboratory.tsx` et `stitch-lab.css`.
Aucune modification du serveur ou du modèle de permissions. Les aides de tests communes
sont également synchronisées dans B5 et B6 pour garder les branches séparées testables.

## Vérification et captures

197 tests unitaires/intégration, TypeScript strict et build de production réussis sur
cette branche. La nouvelle suite apporte **12 parcours navigateur**, validés dans
la copie croisée. Les tests existants pertinents et la compatibilité historique sont
également vérifiés ; le [bilan croisé](CROSS-BLOCKS-5-6-7.md) détaille les **218 cas distincts**.
Aucun ancien échec n’est masqué dans ce total : les régressions ont été corrigées puis relancées.

Quatre scénarios sur trois viewports : identités, rechargement et client isolé ;
contraste des trois thèmes et comparatif à sept widgets ; vrais refus 403 contre
panne réseau 503 ; annulation, focus et rejeu après réponse perdue (même commande,
une seule augmentation de version, accès conservés) ; préparation interrompue et
accès local indisponible. Les sept captures montrent les nouveaux panneaux B5/B6
dans la copie croisée ; la branche B7 reste autonome avec les panneaux existants.

Les 7 images `implementation-*` sont séparées des références APPROVED. Les liens,
dimensions et empreintes sont dans [l’index des captures](block-7-captures.json).
Les limites et écarts aux maquettes sont détaillés dans le bilan croisé.

## Test humain

Suivre le [guide commun iPhone, ordinateur et OBS](../../TEST-APPROVED-BLOCKS-5-6-7.md).
Choisir Neon Show pour la comparaison visuelle ; le défaut d’apparence n’est pas changé.
Les trois branches restent séparées, leur validation croisée n’est pas une fusion publiée.
Les nouveaux rendus iPhone physique, Safari/VoiceOver et OBS réel n’ont pas été testés.

## Captures comparables

| État                    | Référence APPROVED                                            | Implémentation réelle                                                     | Dimensions  |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------- |
| lab-main-desktop        | [Référence](../redesign/lab-main-desktop/approved.png)        | [Capture](../redesign/lab-main-desktop/implementation-desktop.png)        | 1440 × 1513 |
| lab-main-mobile         | [Référence](../redesign/lab-main-mobile/approved.png)         | [Capture](../redesign/lab-main-mobile/implementation-mobile.png)          | 390 × 1681  |
| lab-compare-desktop     | [Référence](../redesign/lab-compare-desktop/approved.png)     | [Capture](../redesign/lab-compare-desktop/implementation-desktop.png)     | 1440 × 1345 |
| lab-access-desktop      | [Référence](../redesign/lab-access-desktop/approved.png)      | [Capture](../redesign/lab-access-desktop/implementation-desktop.png)      | 1440 × 2026 |
| lab-restart-desktop     | [Référence](../redesign/lab-restart-desktop/approved.png)     | [Capture](../redesign/lab-restart-desktop/implementation-desktop.png)     | 1440 × 1000 |
| lab-resume-desktop      | [Référence](../redesign/lab-resume-desktop/approved.png)      | [Capture](../redesign/lab-resume-desktop/implementation-desktop.png)      | 1440 × 2017 |
| lab-unavailable-desktop | [Référence](../redesign/lab-unavailable-desktop/approved.png) | [Capture](../redesign/lab-unavailable-desktop/implementation-desktop.png) | 1440 × 1000 |
