# Undercover — consolidation UX et Motion TV intégrés

**Note du 29 octobre 2026 :** ce bilan décrit sa livraison d’origine. Elle est désormais
réunie à Twitch Local Test sur `qa/undercover-local-validation` ; voir le
[bilan de convergence](../../LOCAL-QA-CONVERGENCE.md) et le
[guide de recette actuel](../../LOCAL-QA-GUIDE.md). Les résultats historiques ci-dessous restent datés.

Branche : `feat/undercover-consolidation-motion`. Base applicative : `d27458974b4c763e2911952b5295b4b0deae893d`, contenant les intégrations précédentes, préparations, médias et TV v2. Le commit documentaire demandé `98f52867bd970e9f1b4b343371926b6883f4e553` a été importé par cherry-pick (`3c9e1af`). Ses références restent inchangées. Aucun accès Stitch ou Mac, aucune génération de maquette.

Le chantier `feat/twitch-local-test` reste séparé. Ni fusion vers main, ni déploiement, ni publication Twitch.

## Références et raccordements

Les [36 références approuvées](undercover-consolidation-motion/APPROVAL.json), leurs HTML, SPEC, quatre prototypes et huit vidéos sont les références visuelles. L’application conserve ses composants et son moteur. Les scripts des démonstrateurs ne sont pas importés.

| Référence              | Intégration réelle                                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1                    | Deux grandes cartes A/B en premier, noms indépendants, boutons image explicites, réglages ensuite. Participants 3–12, tours 1–5, défaut 2, Classique. Options et QA repliés.                                   |
| AC2                    | Partie nommée contenant les manches ordonnées : ajout, édition, duplication, retrait confirmé et annulation, glisser-déposer et boutons Monter/Descendre, autres parties accessibles sous une section repliée. |
| AC3                    | Édition indépendante des deux noms et images, nom facultatif de manche, réglages secondaires conservés. Annuler restitue la préparation originale.                                                             |
| AC4                    | Réutilisation par copie indépendante, jamais réouverture d’une ancienne session.                                                                                                                               |
| AC5                    | Image manquante identifiable et reconnectable ; textes conservés, parcours non bloqué.                                                                                                                         |
| AC6                    | Liste de disponibilité par manche, correction directe, ouverture du salon sans joueurs fictifs ni distribution automatique.                                                                                    |
| AC7                    | Diffusion dédiée, aperçu, préférence de mode public et accès secondaire à l’éditeur existant.                                                                                                                  |
| AC8                    | Ancienne disposition conservée ; aperçu comparatif, choix explicite de TV et copie de sauvegarde restaurable.                                                                                                  |
| AC9, portion supportée | Menu secondaire de la vraie régie B5 : conducteur, accès/réglages, accueil. Le reste de B5 est conservé.                                                                                                       |
| AC10–AC13              | Visuellement approuvés, mais non implémentés : contrats pause/reprise, fin anticipée, clôture et abandon encore ouverts. Pas de faux contrôle actif.                                                           |
| AC14                   | Confirmation personnalisée de retrait local, annulation et focus via le composant commun existant. Aucune révocation ou fin de session.                                                                        |

Vocabulaire : Partie = contenant local ; Manche = paire préparée ; Cycle d’élimination = `play.round` interne avec la même paire ; Tour d’indices = passage oral. `undercover.next` avance vers une autre paire. `game.restart` rejoue la paire courante. Les commandes et définitions historiques gardent leurs identifiants.

## Diffusion et navigation

Le nouveau point d’entrée ne remplace pas l’éditeur de layout. Les sept blocs, quatre dispositions, positions, redimensionnement, thèmes publics et gestion des conflits existants restent disponibles sous Ajustements avancés.

La miniature de préparation est explicitement un **aperçu éditorial privé**, avec les noms saisis, sans attribution fictive à des joueurs. Elle utilise `BroadcastOverlay`. Elle ne provient pas d’une session et ne publie rien. La préférence de mode est mémorisée pour le GM ; seules les commandes serveur de publication effectuent une révélation. Avant distribution, les affectations ne sont pas prévisualisées. Le thème public reste indépendant de l’apparence privée.

Le lien de retour de l’aperçu vérifie réellement l’accès GM sur l’API privée. Un GM revient à la régie ; un accès laboratoire valable et le contexte correspondant permettent le retour au laboratoire. Un lecteur public reste dans le contexte public, même avec `?from=gm` ou `?from=lab`. Aucun token n’est ajouté aux URLs de retour.

Routes historiques : `/sessions/new` redirige vers `/play/undercover` en fonctionnement produit. Le formulaire historique reste accessible uniquement dans le contexte de maintenance déjà protégé. `/player` redirige vers `/join`. `/demo` et `/overlay` sont conservés comme anciennes démonstrations : sans session cible, une redirection ne pourrait pas reconstruire une identité ou une partie légitime. `/play` et ses autres liens entrants sont conservés.

## Motion raccordé aux projections réelles

| Fiches  | Comportement                                                                                                                                                                                   |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01–M02 | Joueur actif et badge de phase : entrées courtes 180 ms, déplacement 10/4 px ; accent unique 240 ms puis nom immobile.                                                                         |
| M03     | Duo anonyme : A gauche, B droite, 18 px, cartes 240 ms, décalage B 40 ms et VS 80 ms ; maintien 2 600 ms puis sortie 180 ms.                                                                   |
| M04–M06 | Affectations autorisées : groupes de trois, entrées 240 ms, décalages 0/40/80 ms, numéros stables et noms longs tronqués avec titre complet. Pagination GM existante, 1/2/4 pages pour 3/6/12. |
| M07     | Compteur tabulaire, une ligne, progression `scaleX` 140 ms ; preset équilibré TV : rectangle 720 × 180 et texte 64 px à douze joueurs, de 0 à 12 votes. Aucun choix individuel public.         |
| M08–M09 | Élimination ou égalité réelles : moment 2 400 ms, sortie 180 ms et note durable sans révélation supplémentaire.                                                                                |
| M10–M11 | Cartes finales uniquement après autorisation serveur, maintien 2 800 ms et résultat compact durable ensuite. L’ouverture tardive ne rejoue pas la révélation.                                  |
| M12     | Manche suivante : capsule 2 200 ms, sortie 180 ms. Aucune paire future affichée automatiquement.                                                                                               |

Les maintiens sont distincts des durées CSS. Un ordonnanceur annulable garde un seul moment, jamais une file. Un changement de projection ou une déconnexion annule ses anciens temporisateurs. Un événement interrompu est retiré immédiatement si le nouvel état ne l’autorise plus : il n’est pas conservé pour terminer un fondu périmé. Les remplacements de HUD ne retardent pas la projection serveur : l’ancienne information est retirée immédiatement et l’entrée du nouvel état est animée. Les sorties temporisées concernent seulement les moments transitoires, sans faire clignoter le joueur actif, les affectations maintenues ou le compteur durable.

`prefers-reduced-motion` : fondu 100 ms, sans décalage, translation ou lueur ; progression instantanée. Aucun mouvement décoratif permanent. Les coordonnées v1/v2 ne changent pas. Le renderer partagé de l’aperçu, du comparatif et d’OBS reste `BroadcastOverlay`/`UndercoverTvOverlay`.

## Fichiers et contrats principaux

| Zone                     | Fichiers                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Préparation / conducteur | `undercover-series-studio.tsx`, `undercover-series.css`, `undercover-series.ts`, `use-undercover-series.ts`, `undercover-series-launch.ts`                                                                   |
| Diffusion / adoption     | Nouveau `undercover-diffusion.tsx`, réutilisant `UndercoverLayoutEditor` et `BroadcastOverlay`                                                                                                               |
| Régie / joueur           | `undercover-room.tsx`, `gm-game-panel.tsx`, `undercover-series-controls.tsx`, `undercover-companion.tsx`, `stitch-gm.css`, nouveau `undercover-presentation.ts`                                              |
| Aperçu / retours         | `stream-preview.tsx`, `creator-laboratory.tsx`, `session-layout-editor.tsx`                                                                                                                                  |
| Motion public            | `broadcast-feed.tsx`, `undercover-tv-overlay.tsx`, `broadcast-tv.css`, `public-cues.ts`, nouveau `broadcast-motion.ts`                                                                                       |
| Contrat                  | `packages/contracts/src/undercover-stream.ts` : seule extension, préférence privée GM optionnelle                                                                                                            |
| Compatibilité            | Routes `player/page.tsx`, `sessions/new/page.tsx` et messages de `session-client.ts`                                                                                                                         |
| Vérification             | Nouvelles suites `undercover-motion.test.ts`, `undercover-consolidation.spec.ts`, `undercover-tv-motion.spec.ts`, fixture HTTP dédiée et adaptations des suites existantes aux libellés / destinations réels |
| Outillage                | Scripts npm des deux nouvelles suites, configs Playwright dédiées, noms des dossiers de résultats séparés ; aucune dépendance ajoutée                                                                        |

Aucun moteur, règle, commande gameplay, transport SSE ou relais média n’est réimplémenté. L’export HTML sert à la comparaison visuelle ; ses scripts ne sont pas exécutés par l’application.

## Données et permissions

Aucune migration SQLite, suppression de donnée ou modification des clés locales. La bibliothèque garde la version 1 et ses IDs. Deux champs optionnels rétrocompatibles sont ajoutés aux préparations locales : `previousOverlayLayout` et `preferredPublication`. Le second peut être transmis comme métadonnée privée GM de préparation. Il n’est ni une règle ni une publication et n’apparaît pas dans les projections publiques.

Les copies possèdent de nouveaux IDs et des objets de configuration indépendants ; les fichiers image locaux immuables peuvent rester référencés sans duplication inutile. Les anciens titres ne sont pas réécrits. La compatibilité vérifiée porte sur la lecture des anciennes données par cette nouvelle application. Le retour à un ancien build aux schémas stricts n’est pas garanti après l’enregistrement de ces champs nouveaux ; aucune purge n’est utilisée pour contourner un refus de lecture. Une ancienne disposition garde ses coordonnées jusqu’à une adoption explicite, et peut être restaurée.

Le relais média temporaire existant n’est pas modifié. Permissions, expiration, HTTP/SSE, votes, distribution et résultats restent autoritaires côté serveur. Le Duo ne reçoit aucun mapping ou rôle ; les affectations exigent la commande GM existante ; la révélation finale relève du résultat moteur.

## Écarts explicites et limites

- Les captures applicatives utilisent des contenus fictifs et images neutres générées pour les tests, pas les portraits des maquettes. Les thèmes privés restent sélectionnables ; les comparaisons AC sont réalisées avec Neon Show.
- La miniature AC7 utilise un état de préparation et des cartes textuelles, sans inventer de distribution. Le mode choisi est une préférence pour la régie, jamais une révélation automatique.
- La pagination publique reste manuelle via les commandes GM existantes ; aucune autopagination nouvelle n’est introduite.
- Il n’existe pas de nouvelle phase serveur « vote fermé » : après tous les votes reçus, le GM dépouille. Le libellé reflète cet état réel.
- Les écrans FOCUS AC9/AC10 ne remplacent pas la régie complète. Les nouvelles opérations de cycle de vie attendent le [contrat proposé](UNDERCOVER-LIFECYCLE-CONTRACT-PROPOSAL.md).
- Aucune nouvelle garantie de synchronisation des préparations locales entre appareils. Préparer et lancer depuis le même navigateur pour conserver ses images ; les accès de jeu et le relais permettent les autres vues sur iPhone/PC.
- Tests Chromium automatisés, pas de nouveau test iPhone/Safari physique, OBS réel ou Twitch authentifié revendiqué.

## Convergence future avec Twitch — non fusionnée

Branche parallèle observée : `feat/twitch-local-test`, `ebc8ea7177c6b8c4d6ec715013aaa3ed904bfcf1`.

Fichiers modifiés des deux côtés :

| Fichier                     | Raccordement à effectuer lors d’une intégration future autorisée                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `broadcast-feed.tsx`        | Conserver le `usePublicSession` et le contexte d’origine média du chantier Twitch, puis raccorder l’ordonnanceur Motion, son annulation et les maintiens. Ne pas réintroduire un client GM dans le viewer. |
| `undercover-tv-overlay.tsx` | Conserver la résolution des URLs média via le contexte public du chantier Twitch ; garder les clés de rendu, compteur stable et attributs Motion de cette branche.                                         |
| `scripts/test-e2e.mjs`      | Réunir les nouveaux noms de suites sans supprimer la suite Twitch.                                                                                                                                         |
| `package.json`              | Réunir les scripts Motion/consolidation et les scripts/workspaces Twitch ; ne pas écraser les dépendances de la branche parallèle.                                                                         |
| `README.md`                 | Conserver les deux guides et leurs limites de validation respectives.                                                                                                                                      |

Les DTO publics restent compatibles : aucune donnée privée nouvelle n’est nécessaire à Motion. Les ajouts de préférence sont GM-only. Les helpers Twitch, proxy, viewer, certificats, configuration et scripts de packaging ne sont pas copiés ici. Les deux chantiers n’ont **pas** été testés ensemble : une fusion ultérieure devra exécuter les suites Twitch, Motion, TV et de confidentialité. Ce rapport n’annonce pas une compatibilité combinée déjà validée.

## Vérification et preuves

Voir [l’index des captures réelles](../implementation/undercover-consolidation-motion/README.md). Les captures APPROVED restent séparées et ne sont jamais remplacées. Les tests utilisent des commandes HTTP réelles et les projections SSE ; aucun résultat de jeu n’est injecté dans React.

Les commandes de vérification et leurs résultats sont consignés dans cet index. Les nouvelles suites se relancent avec `npm run test:consolidation` et `npm run test:motion`.

## Test humain simple — conducteur complet, iPhone et PC

1. Démarrer l’application, ouvrir `/play/undercover` sur l’ordinateur. Les contenus A/B apparaissent avant les réglages. Choisir deux noms et, facultativement, deux images ; prévoir trois participants et conserver deux tours, un Undercover.
2. Ajouter cette manche : le conducteur affiche Ma partie Undercover. Nommer la partie, préparer une autre paire, utiliser Monter/Descendre, dupliquer et retirer avec confirmation. Recharger : les préparations restent présentes.
3. Modifier une manche, ouvrir Options → Diffusion. Choisir le mode souhaité puis enregistrer. Aucun contenu n’est publié. Pour une ancienne disposition, comparer puis adopter TV ou garder l’existante ; la restauration reste possible.
4. Vérifier la partie puis ouvrir le salon. Aucun joueur fictif, rôle ou mot distribué automatiquement. Copier l’invitation affichée. Sur PC, ouvrir **trois nouveaux onglets**, coller l’invitation dans chacun et rejoindre avec trois noms différents (Alex, Camille, Noa). Ne pas dupliquer un onglet joueur déjà connecté : une duplication peut recopier son identité de navigateur.
5. Conserver l’onglet GM du PC. Copier son lien privé GM depuis l’espace d’accès privé, puis ouvrir ce lien complet sur l’iPhone avec l’adresse LAN affichée au démarrage. Ce lien est distinct de l’invitation destinée aux joueurs. Garder le même navigateur PC de préparation pour les images et le conducteur.
6. Dans l’espace Plateau de la régie, ouvrir l’aperçu d’émission sur le PC et/ou copier l’URL publique OBS. Le public voit l’attente, aucun mot. Préparer la partie depuis le salon puis distribuer depuis le GM : les joueurs reçoivent chacun leur carte privée.
7. Sur iPhone, confirmer les passages oraux du premier puis du deuxième tour (trois joueurs × deux tours). Les indices n’ont pas besoin d’être saisis. Le plateau suit le joueur actif et le tour ; le vote n’est pas disponible avant la fin.
8. Facultatif : depuis Contenus sur le plateau, montrer le Duo : deux contenus, aucune association aux joueurs. Les cartes se retirent après un bref moment. Publier des affectations demande une confirmation séparée. Ne choisir cette révélation que si elle est souhaitée pour l’essai.
9. Ouvrir le vote. Pour obtenir une victoire reproductible à trois : consulter séparément les trois cartes privées ; deux mots sont identiques. Depuis les deux joueurs possédant le même mot, voter contre celui ayant le mot différent ; depuis ce dernier, voter contre un des deux autres. Confirmer chaque vote. Le public affiche 1/3, 2/3 puis 3/3 sans révéler les choix. Le GM dépouille : l’Undercover est éliminé et les civils gagnent. La révélation autorisée cède ensuite la place au résultat durable.
10. Sur le PC de préparation, retrouver la régie : **Rejouer cette manche** garde la paire ; **Manche suivante** choisit la prochaine préparation après confirmation. Cette transition ne distribue ni ne révèle la nouvelle paire. La distribution suivante reste une commande GM. **Retour à ma partie** conserve le conducteur et ne suspend pas la session.
11. Ouvrir tardivement ou recharger OBS après un résultat : état durable, aucune ancienne révélation rejouée. Activer Réduire les animations sur l’appareil et refaire l’essai.
12. Revenir depuis l’aperçu : régie pour un vrai GM, laboratoire pour un accès QA correspondant, plateau public pour un spectateur. Vérifier également les champs avec le clavier iPhone ouvert et les boutons du bas pendant le défilement.

Pour une égalité à trois, chacun peut voter contre son voisin dans un cycle : Alex → Camille, Camille → Noa, Noa → Alex. Le dépouillement n’élimine personne ; le nouveau cycle conserve les mêmes contenus.

### Test rapide du laboratoire — distinct du conducteur

Depuis Préparer une manche, ouvrir Options → Laboratoire puis Lancer une partie de démonstration. Le serveur prépare les participants fictifs et les accès séparés ; le laboratoire permet de changer de perspective et de copier le lien privé GM pour l’iPhone. Ce test rapide utilise **le brouillon courant**, sans rattachement au conducteur. Il sert à essayer cette paire et à rejouer ; il ne teste pas le bouton Manche suivante d’une partie préparée. Pour ce dernier, suivre le parcours par invitations ci-dessus. Aucun mécanisme QA n’est ajouté à une session publique.

### Récupération locale

```sh
cd ~/extension-twitch-studio-4b &&
git fetch origin &&
git switch feat/undercover-consolidation-motion &&
git pull --ff-only &&
nvm use 24 &&
npm ci &&
npm run dev:lan
```

Utiliser l’adresse LAN affichée sur les deux appareils, connectés au même réseau de confiance. Ne pas exposer le serveur de développement à Internet.
