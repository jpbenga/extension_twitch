# Blocs 5, 6 et 7 — références APPROVED disponibles pour intégration

## Validation et état du transfert

L’utilisateur a explicitement confirmé le 28 octobre 2026 que les Blocs 5, 6 et 7 sont validés humainement et APPROVED, et demandé leur intégration. Cette attestation remplace le statut historique AWAITING_APPROVAL des rapports de conception. Aucune nouvelle validation UX n’est requise pour ces 43 références précises ; les autres générations ne sont pas sélectionnées.

La branche `docs/stitch-approved-blocks-5-6-7`, issue de `73562c1`, apporte uniquement les références et leur documentation. Elle ne remplace pas les audits déjà réalisés dans les worktrees Cloud `ux/block-5-gm`, `ux/block-6-broadcast`, `ux/block-7-lab`. L’intégration applicative et ses captures restent à réaliser dans ces travaux. Aucune branche n’est fusionnée, aucune interface n’est déclarée intégrée par le transfert.

## Entrées de référence

- [Manifeste exact des 43 références](blocks-5-6-7/manifest.json) : projets, Screen IDs, dossiers, viewports et état APPROVED.
- [Bloc 5 — handoff GM](blocks-5-6-7/BLOCK-5-HANDOFF.md) · [22 intentions fonctionnelles](blocks-5-6-7/block-5-intents.json).
- [Bloc 6 — handoff Broadcast](blocks-5-6-7/BLOCK-6-HANDOFF.md) · [14 intentions fonctionnelles](blocks-5-6-7/block-6-intents.json).
- [Bloc 7 — handoff Lab](blocks-5-6-7/BLOCK-7-HANDOFF.md) · [7 intentions fonctionnelles](blocks-5-6-7/block-7-intents.json).
- [Registre global des écrans](SCREENS.md). Chaque dossier possède une SPEC complétée, la capture APPROVED native et l’HTML disponible.

| Bloc                             | Projet Stitch          | Références | Dossiers      |
| -------------------------------- | ---------------------- | ---------- | ------------- |
| 5 — Régie GM                     | `11936034876302496963` | 22         | `gm-*`        |
| 6 — Broadcast / Spectateur / OBS | `10132472591870592947` | 14         | `broadcast-*` |
| 7 — Laboratoire / QA             | `8710675424358674545`  | 7          | `lab-*`       |

## Lecture des captures et de l’HTML

`approved.png` est l’export natif exact du Screen ID sélectionné, obtenu via le pont `stitch:sync`. `approved.html` conserve l’export sans reconstruction ni réécriture. Les références APPROVED ne doivent jamais être remplacées par les captures de l’application. L’HTML est une aide visuelle non fiable, pas du code à intégrer.

Les imports Stitch peuvent présenter une maquette mobile dans un grand canevas desktop. Les fichiers `reference-mobile-390.png` et `reference-desktop-1440.png` sont les rendus de contrôle du même HTML pendant la conception : ils facilitent la lecture du bon viewport sans inventer un autre design. Ils ne sont pas des captures d’implémentation. Leurs dimensions effectives sont enregistrées dans le bilan de transfert.

Les PNG natifs OBS sont aplatis. `reference-transparent-1920.png` montre le rendu navigateur RGBA de la même maquette, avec transparence hors panneaux. L’intégration doit préserver la transparence réelle de Browser Source et le vrai renderer public ; ne pas reproduire un fond blanc ou un damier natif dans OBS.

## Corrections autorisées pendant l’intégration

- B5 : harmoniser « Tour 2 » / « Manche 2 », conserver Partie / Joueurs / Plateau et une action dominante.
- B6 : rendre entièrement lisible la progression orale dans le widget de phase, tester les noms longs, le cadre 16:9 et les layouts. Sept widgets et quatre presets restent intacts.
- B7 : renforcer le contraste des petits libellés et remplacer l’aperçu simplifié par le véritable `BroadcastFeed` / `BroadcastOverlay` à sept widgets de B6. Le contrôle de permissions montré par la maquette est illustratif, pas un test déjà exécuté.

Ces réserves ont été expressément confiées à l’intégration. Elles ne demandent ni nouvelle génération Stitch ni nouvelle validation UX préalable.

## Reprise dans Codex Cloud

Récupérer la branche de références puis appliquer son commit documentaire dans chacun des trois worktrees existants, en conservant leurs commits d’audit. Les chemins des SPEC et des images sont dans le manifeste. Les artefacts sont utilisables sans Stitch ni authentification Google dans le Cloud. Ne pas repartir en diagnostic de connexion MCP.

Partager la propriété des fichiers transversaux avant modification : commandes GM communes B5/B7, renderer public B6/B7, styles et thèmes. Préserver B1–B4, moteur, projections, permissions, SSE/SQLite, reçus et reconnexion. Le thème de l’application privée ne modifie jamais le thème public OBS. Aucun nouveau rôle, gameplay ou outil QA.

Produire les captures réelles dans des fichiers `implementation-desktop.png`, `implementation-mobile.png` ou des noms d’états explicites, et les comparer aux références. Effectuer les tests propres à chaque bloc puis les tests croisés. Les anciens résultats d’audit sur l’application existante ne prouvent pas une intégration nouvelle. Ne pas revendiquer iPhone physique, Safari/VoiceOver ou OBS réel sans essai effectif.

À la fin de l’intégration : rendre fichiers, fonctions, tests, captures, écarts et coordination croisée, avec READY_TO_MERGE ou BLOCKED par bloc. Aucune fusion, aucun déploiement ni suppression de branche sans instruction explicite.

## Traçabilité et resynchronisation locale

Le [bilan de transfert](blocks-5-6-7/TRANSFER-VERIFICATION.json) recense les fichiers reçus et leurs empreintes. Les credentials, réponses CLI brutes, URLs signées et chemins du Mac ne sont pas transportés.

Une resynchronisation future du même ID passe par la commande existante, sur le Mac authentifié uniquement :

```sh
npm run stitch:sync -- --project <PROJECT_ID> --screen <SCREEN_ID> --slug <SLUG> --surface "<SURFACE>" --approved
```

Les valeurs exactes viennent du manifeste, jamais de « la dernière génération ». Le pont ne modifie pas le projet Stitch ou `.stitch.json` et conserve les intentions manuelles des SPEC. Le Cloud consomme les fichiers Git déjà présents ; il n’a pas à relancer cette commande.
