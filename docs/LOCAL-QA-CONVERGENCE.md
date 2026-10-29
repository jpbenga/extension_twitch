# Convergence pour la recette humaine locale

État au 29 octobre 2026. Branche unique : `qa/undercover-local-validation`.
[Guide opératoire](LOCAL-QA-GUIDE.md) · [Checklist humaine](LOCAL-QA-CHECKLIST.md) · [Limites](LOCAL-QA-KNOWN-ISSUES.md).

## Audit Git et choix de base

| Élément                       | Commit réellement vérifié                                                             | Décision                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Base Undercover, séries et TV | `d27458974b4c763e2911952b5295b4b0deae893d`                                            | Ancêtre commun, déjà inclus dans les deux chantiers.                             |
| Consolidation UX + Motion     | `57f6f02848724ba0eba5af448af888471713c365` sur `feat/undercover-consolidation-motion` | Base de la branche QA ; livraison propre et poussée.                             |
| Twitch Local Test             | `ebc8ea7177c6b8c4d6ec715013aaa3ed904bfcf1` sur `feat/twitch-local-test`               | Fusion réelle, historique conservé.                                              |
| Références approuvées         | `98f52867bd970e9f1b4b343371926b6883f4e553`                                            | Déjà importées par `3c9e1af` dans la consolidation ; aucune référence remplacée. |
| Commit de fusion QA           | `7838f4cce14691b7ee3681500939bf7593ca565d`                                            | Deux parents : consolidation et Twitch ci-dessus.                                |

Les branches locales et distantes ont été inspectées puis les deux branches applicatives et la branche documentaire ont été récupérées explicitement. Elles divergeaient de deux commits contre un depuis `d274589` : aucune branche commune terminée n’était utilisée comme hypothèse. Un ancien worktree de travail `wip-undercover-consolidation-twitch-base`, non livré, a été laissé intact ; la livraison publiée `57f6f02` constitue la source applicative retenue. Les autres worktrees, leurs modifications et leurs branches restent conservés. Aucune fusion vers `main`, aucun déploiement ou publication Twitch.

Les nombres du précédent rapport de consolidation (224 tests moteur/intégration, 215 parcours Chromium) et du rapport Twitch sont des résultats historiques. Ils ne sont pas présentés comme une validation de la convergence ; la recette ci-dessous est exécutée à nouveau sur la branche QA.

## Conflits réellement rencontrés

Deux fichiers seulement étaient en conflit textuel :

- **`package.json`** : les deux branches ajoutaient leurs scripts à la même position. Conservation de l’union des scripts consolidation/Motion et Twitch, du workspace `apps/twitch` et d’esbuild livré par Twitch. Le lockfile auto-fusionné a été installé avec `npm ci`.
- **`README.md`** : deux sections finales ajoutées au même endroit. Conservation des deux livraisons, avec un point d’entrée vers le guide de recette commun.

Trois auto-fusions ont été relues spécialement : `broadcast-feed.tsx` conserve l’ordonnanceur Motion et le hook de projection publique Twitch ; `undercover-tv-overlay.tsx` conserve le Motion final et la résolution de l’origine des médias ; `scripts/test-e2e.mjs` conserve toutes les suites sans doublons. Aucun choix mécanique « ours/theirs ».

Le test natif Twitch utilisait un ancien libellé GM : il attend désormais **Commencer un nouveau cycle**, sans changer de commande métier. Il vérifie aussi que le renderer natif utilise l’animation finale `tv-duo-a` de 240 ms.

## Ajustements limités au lancement et à la recette

- `dev:lan` et `twitch:local` affichent les URLs dans un format commun, détectées depuis les interfaces privées. Aucun lien privé ou secret dans le bandeau.
- Le web écoute sur `0.0.0.0` pour joindre à la fois localhost et le LAN. L’API reste sur loopback ; les navigateurs utilisent les réécritures de même origine, y compris SSE et médias. Pas de CORS permissif ajouté.
- `localhost` est ajouté aux origines de développement Next autorisées, aux côtés de loopback et de l’IP LAN réellement choisie.
- `dev:lan` refuse un port occupé et termine ses propres sous-processus à Ctrl+C ; il ne tue aucun serveur existant. `twitch:local` garde sa vérification de ports, son HTTPS et sa passerelle publique restreinte.
- Un seul lancement à la fois : `dev:lan` pour la recette ordinaire ; après arrêt, `twitch:local` lance la même application **et** le HTTPS Twitch facultatif. Aucun script `dev:qa` redondant.
- Aucune règle, commande métier, table SQLite, migration, permission ou disposition personnalisée modifiée pour la recette.

## Validation technique réelle

Le probe reproductible `tests/manual-probes/local-qa-runtime.mjs` utilise une base SQLite temporaire et les vrais lanceurs :

1. HTTP localhost et IP privée : accueil, préparation, invitation.
2. Trois participants distincts, distribution serveur, images GM autorisées, média public refusé avant publication.
3. Publication Duo, projection HTTP/SSE anonyme et images via le LAN, sans accès GM dans le payload.
4. Arrêt complet et libération des ports ; redémarrage par `twitch:local` avec la même base et la même capacité privée.
5. HTTPS Viewer/Config/Panel/mobile/video overlay, projection publique et SSE, médias publics, refus des routes privées ; bundle avec le Motion final.

`npm run twitch:cert` a été exécuté avec mkcert réel et une autorité de certification **isolée pour ce contrôle Cloud**. Le client HTTPS a vérifié le certificat avec cette autorité publique ; aucune désactivation de TLS. Les clés générées restent sous `.data`, ignorées par Git. Aucun certificat ni clé privée n’est livré. La confiance système du Mac reste à configurer par le testeur.

**Limite réseau Cloud :** Chromium vers l’IP LAN reçoit un refus « Domain forbidden » du proxy de l’environnement. Il n’a pas été contourné. Les vérifications HTTP/SSE/médias LAN utilisent le client interne ; les parcours Chromium utilisent loopback. Cela ne prouve pas un essai Wi-Fi ou Safari sur un iPhone physique.

**Résultats sur la branche convergée :** `npm run check` réussi, **229 tests unitaires/intégration dans 28 fichiers**, format, TypeScript strict et builds web/serveur/packages/Twitch. **225 tests navigateur réussis, aucun échec** : 215 de non-régression, 9 natifs Twitch et 1 nouveau parcours de convergence multi-manches. Formats 320/390/768/1440 px selon les suites, TV 1920 × 1080 et réduction 390 px. Les tests ne sont ni supprimés ni désactivés.

| Suite navigateur                     | Réussis |
| ------------------------------------ | ------: |
| Sessions / produit / studio existant |      42 |
| Consolidation UX                     |       9 |
| Motion normal/réduit, 3/6/12 joueurs |       6 |
| Préparation B2                       |      20 |
| Séries, médias, copies et parties    |      24 |
| Régie B5                             |       6 |
| Compagnon joueur                     |      16 |
| Layouts                              |       6 |
| Design system / dialogues            |      12 |
| Accueil                              |      16 |
| Laboratoire B7                       |      12 |
| TV                                   |       4 |
| Stream preview                       |       9 |
| UX / thèmes                          |      12 |
| Gameplay officiel Undercover         |      12 |
| Broadcast B6                         |       9 |
| Twitch natif, trois formats          |       9 |
| Nouveau parcours QA complet          |       1 |
| **Total**                            | **225** |

Le nouveau parcours prépare trois paires depuis l’UI, invite cinq contextes joueurs indépendants, joue une élimination intermédiaire puis un nouveau cycle, atteint une victoire civile réelle, passe à la deuxième préparation et rejoue sans avancer la série. Il capture quatorze surfaces ; deux captures Twitch complètent ce jeu de preuves. Les suites existantes couvrent aussi conflits, stockage indisponible, médias manquants/expirés, idempotence, anciennes parties, routes historiques, SSE et confidentialité. Les commandes exactes et résultats par suite figurent dans [verification.json](screenshots/local-qa/verification.json).

`npm run twitch:package` réussi : ZIP intègre, exactement **12 fichiers statiques**, ni secret, certificat, backend ou source map. Archive locale ignorée par Git, aucun upload. `twitch:cert` et les vrais lanceurs `dev:lan`/`twitch:local` réussis ; le probe vérifie également une **mise à jour SSE LAN après commande**, le refus d’un port occupé sans tuer son propriétaire et la libération des ports à l’arrêt.

Les seules corrections de test ont été le libellé GM devenu « nouveau cycle » et des assertions sur le Motion final. Le premier montage du nouveau probe utilisait involontairement le layout v1 par défaut de l’API : la fixture demande maintenant explicitement TV v2, sans changer le défaut de l’API ou migrer les anciennes sessions. La restriction du proxy navigateur LAN a été distinguée d’un défaut applicatif. Aucune correction de gameplay ou refonte visuelle issue des tests.

## Captures de cette version

[Répertoire et provenance](screenshots/local-qa/README.md). Captures de l’application exécutée : accueil, préparation, conducteur, éditeur de contenu, salon, régie et joueur à 390 px, public, Duo/affectations/vote/final OBS RGBA, aperçu et éditeur avancé. Deux captures natives Twitch supplémentaires sont explicitement marquées **Helper contrôlé automatisé** ; elles ne prouvent pas une authentification Twitch.

Les fichiers APPROVED ne sont pas modifiés. Pas de refonte : la revue visuelle vérifie seulement l’absence de régression manifeste après convergence. Les images personnelles de démonstration sont des formes neutres générées par le test.

## Périmètre à valider humainement

Les cases du guide/checklist restent vierges. L’iPhone physique, Safari, OBS réel et Twitch authentifié ne sont pas testés par cette exécution Cloud. La validation OBS humaine passée est conservée sans être généralisée à cette branche.

Pause/reprise réelle, fin anticipée, clôture volontaire et abandon restent **NOT_IMPLEMENTED_PENDING_PRODUCT_DECISION** ; [proposition de contrat conservée](ux/redesign/UNDERCOVER-LIFECYCLE-CONTRACT-PROPOSAL.md). Enchères et Qui est l’espion restent À venir. Le conducteur et les images futures restent locaux au navigateur de préparation ; les prochaines manches se lancent depuis cet appareil.
