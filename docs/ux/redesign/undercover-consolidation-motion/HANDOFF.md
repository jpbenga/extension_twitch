# Intégration Undercover — consolidation UX et Motion TV approuvées

Validation humaine visuelle acquise le **29 octobre 2026** sur les 36 références finales : 24 consolidation, 12 Motion, plus les 4 prototypes et 8 vidéos associés. Voir APPROVAL.json et manifest.json. Aucune nouvelle validation UX n’est nécessaire pour ces références. Aucune implémentation n’est effectuée par cette branche documentaire.

Base observée : `d27458974b4c763e2911952b5295b4b0deae893d` (`feat/undercover-stream-series-tv`). L’application inclut déjà séries persistantes, médias A/B et Broadcast TV v2. Ne pas repartir des anciens exports ni réimplémenter ces mécanismes.

## Références et provenance

- [Consolidation : 24 IDs, captures, HTML et SPEC](../undercover-consolidation/README.md), projet `10111200334509943764`.
- [Motion : 12 IDs, captures et HTML](../undercover-tv-motion/README.md), projet `14258025772148928156`.
- [20 fiches Motion](../undercover-tv-motion/MOTION-SPECS.md), [prototypes](../undercover-tv-motion/index.html), [8 vidéos](../undercover-tv-motion/videos.html).
- [Décisions UX](../undercover-consolidation/DECISIONS.md), [vocabulaire et arbitrages](TERMINOLOGY-AND-OPEN-DECISIONS.md).

Les fichiers approved.png/approved.html sont des octets de référence conservés, pas des captures d’une intégration réalisée. Certains titres et rapports historiques conservent PROPOSAL/AWAITING_APPROVAL ; APPROVAL.json établit la validation ultérieure, sur les IDs finaux exacts. Les générations superseded ne sont pas autorisées par cette livraison. A ne provient pas d’un export HTML natif Stitch : son HTML responsive compagnon et son PNG Stitch sont explicitement identifiés. B fournit des storyboards HTML natifs distincts du prototype animé.

## Périmètre intégrable

Undercover uniquement. Conserver accueil, lobby, compagnon, confirmations accessibles, régie B5 et renderer TV acquis hors changements ciblés.

| Référence précédente | Nouvelle référence approuvée | Intégration attendue |
|---|---|---|
| A1 préparation | AC1 | Contenus A/B prioritaires, actions image explicites, réglages secondaires |
| A2 édition | AC3 + AC5 | Édition indépendante, remplacer/retirer/reconnecter, texte toujours disponible |
| A3 série | AC2 | Ma partie Undercover ; nommer, plusieurs contenants, ordre, duplication, retrait confirmé |
| A4 réutiliser | AC4 | Copie indépendante d’une ancienne manche |
| A5 image absente | AC5 | État non bloquant |
| A6 prête | AC6 | Vérification puis salon, sans distribution/démarrage implicite |
| Accès diffusion | AC7 + AC8 | Accès simple et adoption TV explicite/non destructive |
| Menu et pause | AC9 + AC10 | FOCUS à greffer sur B5 ; capacités de cycle de vie sous réserve ci-dessous |
| Confirmations | AC11–AC14 | Patron accessible existant ; AC11–13 dépendent du contrat de cycle de vie |
| TV v2 | m01–m12 | Langage Motion sur le renderer existant, sans nouvelle composition |

Partie = contenant complet, Manche = une paire, Cycle d’élimination = même paire avec nouveaux indices/vote, Tour d’indices = passage oral. La validation visuelle couvre cette proposition de vocabulaire. Ne pas renommer aveuglément commandes ou schémas persistés : `undercover.next` avance une préparation/manche, `game.restart` rejoue la même, le round interne garde la même paire. La limite moteur de cycles ne devient pas une limite de paires préparées.

Préserver tous les contrôles métier, erreurs, journal, ordre, accès, réglages, reçus et informations privées autorisées de B5 : AC9/10 ne sont pas une nouvelle régie complète. /play reste une route réelle ; aucun effacement de route ou de lien entrant n’est autorisé implicitement.

Sept blocs, quatre dispositions, personnalisation et renderer commun aperçu/OBS restent disponibles en avancé. Une ancienne disposition est conservée tant que le GM n’adopte pas explicitement TV. Pas de migration destructrice.

## Motion et confidentialité

140/180 ms et ease-ui existants, 240 ms pour rares moments TV ; maintiens distincts. Pas de pulsation permanente. Réutiliser le moteur/rendu existant, pas les fixtures ni le runtime de démonstration.

Groupes de trois pour 3/6/12 joueurs, numéros et tailles stables. Compteur12 : une ligne et rectangle720×180 sur canevas1920×1080 dès0/12, sans saut à12/12. Respecter prefers-reduced-motion : fondu100ms, sans translation/stagger/glow, progression instantanée. Distinguer événement et état durable ; aucune relecture historique à l’ouverture tardive/reconnexion. Annuler les séquences périmées lors d’une interruption, sans file obsolète.

Le Duo ne reçoit aucun mapping joueur→contenu ni camp, même masqué. Affectations publiées, résultat final autorisé et nouvelle paire autorisée sont des projections séparées. Ne jamais animer le conducteur privé dans OBS. Votes individuels privés. Le serveur reste autoritaire sur permissions, transitions et résultats.

## Décisions backend encore ouvertes

**Approbation visuelle ≠ validation d’un contrat serveur absent.** Pause/reprise, fin anticipée d’une manche, clôture volontaire complète et abandon n’existent pas encore dans le contrat audité. Ne pas inventer : commandes bloquées, délais, votes en cours, résultat/vainqueur, révélation, accès, reprise ou conservation exacte. Ne pas confondre abandon et reset salon.

Intégrer tout le périmètre déjà supporté sans bloquer le chantier entier sur ces sujets. Pour les actions absentes, établir un contrat précis à arbitrer avant implémentation backend ; ne pas présenter un bouton inopérant comme une fonctionnalité réalisée ni fabriquer une pause locale. Conserver préparations et historique disponibles ; aucune nouvelle suppression/révocation n’est autorisée.

## Validation de l’implémentation future

Tests proportionnés : comportement des préparations/images, navigation, confirmations/clavier, données existantes et adoption TV non destructive. Comparaisons desktop/mobile ; 3/6/12 joueurs, noms longs et vote12/12. Tester normal/réduit, interruption, état durable/reconnexion et absence de secrets dans les projections publiques. Préserver tests moteur, permissions, SSE et idempotence. Distinguer navigateur des essais OBS/iPhone physiques.

Rendre compte des références intégrées, captures réelles, vérifications exécutées et arbitrages restants. Aucune fusion vers main ou mise en production automatique n’est demandée par cette transmission.
