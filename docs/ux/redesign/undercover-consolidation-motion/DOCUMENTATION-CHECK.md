> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Contrôle documentaire — consolidation et Motion Undercover

**Statut des deux propositions : AWAITING_APPROVAL.** Ce contrôle décrit les artefacts d’étude et leur filiation ; il ne constitue ni une nouvelle approbation humaine, ni un audit du produit, ni une validation backend.

## Périmètre et provenance

Référence applicative déclarée par `BASELINE.json` et les livrables : dépôt `dépôt applicatif`, commit `d27458974b4c763e2911952b5295b4b0deae893d`, branche `feat/undercover-stream-series-tv`. Le dépôt source a été consulté en lecture seule pour ce contrôle. Le canon existant reste `docs/ux/redesign/DESIGN.md`, avec les valeurs réellement définies dans `apps/web/src/app/tokens.css` et les styles du renderer.

Sources documentaires consultées : `USER-BRIEF.txt`, `SHARED-CONTRACT.md`, `BASELINE.json`, `TERMINOLOGY-AND-OPEN-DECISIONS.md` ; pour A, `DELIVERY.md`, `manifest.json`, `DECISIONS.md`, `QA.md` et un échantillon des HTML AC1 desktop, AC3 mobile, AC11 mobile ; pour B, `MOTION-SPECS.md`, `DESIGN.md`, `manifest.json`, `runtime.js`, `prototype.css`, `QA-CORRECTIONS.json`, `KEYFRAMES.json`. Les rapports QA sont des preuves préexistantes rapportées, pas des contrôles rejoués ici.

Le rôle documenter Impeccable est appliqué à une **extension du monde acquis**. L’instruction de génération d’un nouveau `DESIGN.md` ne s’applique pas : aucune nouvelle identité ni modification approuvée du système n’a été demandée. Le présent fichier est l’unique sortie de ce passage ; aucun canon ou sidecar n’a été réécrit. Le documenter est ici un agent dédié ; la consigne de substitution inline de la référence dégradée n’est pas nécessaire dans cette orchestration.

## Système observé — cinq lignes

1. **Palette :** fond indigo `#0C0C1F`, surfaces `#1A1A2D` / `#28283C`, texte `#E2E0FB`, secondaire `#B7A8D4`, lilas `#CEBDFF`, action/résultat citron `#C8F323` ; continuité Neon Show, sans nouvelle préférence ni changement du thème public serveur.
2. **Typographie :** Space Grotesk et DM Sans locales ; A conserve titre desktop 40/48 px et une hiérarchie responsive, B conserve les tailles et rôles du renderer en unités de canevas, sans transposer le titre de préparation dans OBS.
3. **Forme et espace :** cartes de préparation sobres, rayons 12–16 px et commandes 8 px ; B conserve le canevas TV 1920×1080, les capsules hautes, les zones basses et le centre transparent du preset équilibré v2.
4. **Règle de continuité :** une action dominante dans la préparation, détails et outils avancés secondaires ; 7 blocs, 4 dispositions, personnalisation et géométrie du renderer acquis sont préservés, sans refonte de l’accueil, du salon ou du compagnon.
5. **Règle de mouvement proposée :** 140/180 ms et courbe `cubic-bezier(0.2,0.8,0.2,1)` existantes ; 240 ms pour les rares moments TV, opacité/transform, maintien séparé, réduction à un fondu de 100 ms et aucun effet historique à l’ouverture tardive.

Ces lignes décrivent l’existant réutilisé et les propositions locales. Les précisions Motion de B, notamment 240 ms, les maintiens et le fondu réduit, ne deviennent pas des règles globales approuvées par leur présence dans cette documentation.

## Cohérence du chantier A

Le projet Stitch `10111200334509943764` documente **24 références finales** : AC1–AC10 en desktop et mobile, puis AC11–AC14 en confirmation mobile avec patron responsive existant conservé. Le manifeste les marque `AWAITING_APPROVAL`, `humanApproved: false` et `sourceApplicationModified: false`. Les 24 ressources sont déclarées récupérées et indexées ; les liens CLI conservent honnêtement `cliUrlVerified: false`. Aucun clic de vérification dans l’interface Stitch n’est revendiqué.

Le mapping est explicite : A1→AC1, A2→AC3/AC5, A3→AC2, A4→AC4, A5→AC5, A6→AC6. AC7/AC8 exposent et proposent l’adoption du Broadcast existant. AC9/AC10 sont des **études FOCUS** du menu et de la pause sur contexte simplifié, pas un remplacement de la régie B5 et de ses capacités. AC11–AC13 explorent des intentions nouvelles ; AC14 conserve le retrait confirmé.

Nommage, manches multiples, ajout, édition indépendante A/B, réordonnancement, duplication, réutilisation par copie et disponibilité des images restent documentés. Une image absente conserve le texte et la reconnexion ; les boutons média portent une action explicite. Ouvrir le salon ne distribue ni ne démarre la partie. Les dispositions personnalisées ne sont pas écrasées silencieusement.

L’absence de nouveau catalogue `/play` est une décision de périmètre proposée. Les liens entrants réels sont reconnus ; aucune suppression de route ni nouvelle entrée concurrente de préparation n’est déclarée.

## Cohérence du chantier B

Le projet Stitch `14258025772148928156` documente **12 fiches visuelles**, **20 lignes de fiches Motion**, **4 prototypes autonomes** et **7 vidéos annoncées**. Les scènes et délais du `runtime.js` correspondent à la structure des fiches : micro-feedback, transitions d’état et rares moments TV. Le CSS conserve le renderer puis ajoute les comportements de démonstration, sans modifier le produit source.

À l’instant de lecture du manifeste B, les 12 fiches `m01`–`m12` ne portent pas encore de `screenId` final : **import Stitch B encore en cours / inventaire final à clôturer par l’orchestrateur**. Aucun ID n’est inventé ici. La confirmation ultime des frames et vidéos est également en cours selon l’état communiqué ; ce passage documentaire ne la remplace pas.

Les affectations 3/6/12 joueurs utilisent des pages de trois cartes et des numéros stables. Le texte ne se déplace pas pendant sa lecture ; les chiffres tabulaires et emplacements réservés stabilisent les changements. Les animables restent `opacity` et `transform`, la progression emploie `scaleX` et la lueur varie une couche déjà peinte une seule fois. Pas de pulsation permanente imposée.

Le runtime combine le choix système `prefers-reduced-motion` et l’option de démonstration sans permettre à cette dernière de neutraliser la préférence système. Les séquences invalidées abandonnent leurs étapes futures ; les animations sont annulées lors d’un nouveau scénario. L’accès tardif rend directement l’état durable. Cette logique illustre l’intention et ne prouve pas la gestion des événements, reçus, reconnexions ou SSE dans l’application.

Les documents de projection séparent Duo anonyme, affectations visibles, résultat final autorisé et paire suivante autorisée. Les contenus publics n’impliquent aucune relation joueur→contenu dans le Duo ; les votes n’exposent que le nombre reçu. La paire suivante n’est pas tirée du conducteur privé. Cette séparation de fixtures est une preuve locale de conception, pas une permission serveur implémentée.

## Vocabulaire, autorité et limites

Le contrat partagé distingue **Partie** (contenant), **Manche préparée** (paire), **Cycle d’élimination** (indices puis vote avec la même paire) et **Tour d’indices**. « Cycle d’élimination » reste à valider. Le maximum de cycles moteur ne devient pas une limite de paires. Les commandes et identifiants internes ne sont pas renommés par ces études.

Pause/reprise, fin anticipée de manche, clôture de toute la partie et abandon restent des hypothèses UX. Commandes bloquées, votes en cours, temps, droits, secrets, résultat, accès, conservation exacte et reprise nécessitent un arbitrage backend ultérieur. Les confirmations ne promettent ni vainqueur, ni révocation, ni effacement, ni révélation. La pause du lecteur Motion commande la démonstration et ne crée pas de pause de partie.

Les PNG Stitch sont des références de maquettes ; ils ne prouvent aucune interaction métier, gestion complète du focus ou commande serveur. Les HTML et vidéos Motion montrent le mouvement ; les vidéos à fond neutre n’attestent pas l’alpha, documenté séparément par les PNG alpha et `?overlay=1`. Les rapports existants portent sur des rendus locaux Chromium ; aucun test physique OBS, iPhone ou Safari iOS, aucune intégration applicative ou validation humaine nouvelle n’est revendiqué.

## Canon préservé et clôture

Le canon existant conserve son format historique et ses portées : les tokens d’accueil/préparation ne sont pas généralisés à toutes les régies, et OBS reste déterminé par son thème public. Le `DESIGN.md` du dossier B est une note locale de Motion à approuver, pas un remplacement du canon applicatif. Les dispositifs particuliers de ces maquettes, leur outillage de démonstration et leurs fixtures ne sont pas promus en composants produit.

**Non canonisé / non réparé :** format historique du canon conservé ; détails Motion et nouveaux états de cycle de vie encore proposés ; contexte simplifié AC9/AC10 non généralisé à B5 ; inventaire Stitch B et confirmation vidéo finale encore ouverts à cet instant. Aucun nouveau défaut source n’est affirmé ni corrigé dans ce contrôle, qui n’ajoute aucun rendu ou audit.

Le périmètre livré ne comprend aucune modification React/Next.js, backend, application, ancien état APPROVED, Git ou publication. Ce passage a écrit uniquement `design/undercover-consolidation-motion/DOCUMENTATION-CHECK.md`.

`UNDERCOVER_CONSOLIDATION_STATUS: AWAITING_APPROVAL`

`UNDERCOVER_MOTION_STATUS: AWAITING_APPROVAL`

## Addendum ciblé — compteur à douze joueurs

Cet addendum actualise uniquement le delta B communiqué après le contrôle initial. A et les onze autres fiches restent clos dans leur périmètre ; aucun rendu, audit ou contrôle produit supplémentaire n’a été lancé par le documenter.

Le compteur `12 / 12 votes reçus` pouvait passer sur deux lignes et porter le cartouche à 279 px au lieu des 180 px prévus. La source finale consultée ajoute la classe locale `tv-vote` et une règle CSS limitée à `.broadcast-tv[data-people="12"]` : cartouche dans son rectangle, compteur sur une ligne à 64 px pendant toute la progression. Les variantes à 3 et 6 joueurs gardent les 72 px de la source ; les durées, projections et règles Motion ne changent pas. `MOTION-SPECS.md` explicite maintenant cette stabilité sans saut à 12/12.

`QA-VOTE12.json` consigne les états 0, 9, 10, 11 et 12 votes, en mouvement normal et réduit : dix mesures avec cartouche `720×180`, position `(600,856)`, compteur à 64 px et hauteur d’une ligne `70,390625 px`. Les captures existantes `proofs/vote12-complete-normal-alpha.png`, `vote12-complete-normal-390.png` et leurs variantes reduced documentent ce cas ; elles n’ont pas été régénérées ici. Cette correction rétablit le rectangle prévu et n’instaure aucune nouvelle direction visuelle ni règle globale de typographie.

Les sept premières vidéos et les entrées figées à 80 ms ont été déclarées closes par la relecture indépendante ; les clips 01/02 ne sont pas remplacés. Un **huitième clip**, `videos/08-vote12-normal-puis-reduced.webm`, est présent pour le vote à douze en normal puis avec préférence système réduite. Le documenter constate le fichier et la preuve documentaire ; il ne revendique pas une nouvelle lecture vidéo ou inspection visuelle.

À la lecture actualisée du manifeste, onze fiches B possèdent leur ID final. L’ancienne m07 `7059224676118189422` est explicitement `SUPERSEDED`, motif « 12/12 counter stability correction; not a new visual direction. » ; son remplacement est seul encore en cours, sans `screenId` final à cet instant. Cette observation remplace l’état initial « douze imports en cours ». L’orchestrateur pourra ajouter la confirmation d’inventaire lorsque le nouvel ID sera effectivement disponible.

**Limite maintenue :** correction de prototype uniquement ; aucun renderer applicatif, backend, ancien état APPROVED, canon, Git ou publication modifié. Les deux propositions restent **AWAITING_APPROVAL**.

## Clôture de l’inventaire — confirmation de l’orchestrateur

Les réserves d’inventaire décrites plus haut correspondent aux relevés intermédiaires. Elles sont maintenant closes : le manifeste B final contient 12 Screen IDs, tous présents dans l’index Canvas et tous récupérés avec HTML/PNG vérifiés. Le remplacement final de m07 est `15839688811367935863` ; l’ancien `7059224676118189422` reste SUPERSEDED et exclu du lot final.

Le lot commun contient 36 références finales (A24/B12), 4 prototypes Motion et 8 vidéos. Les sept premières vidéos ont été échantillonnées et décodées dans Chromium par le relecteur ; le huitième clip a ses métadonnées WebM VP8 960×540/11,4 s vérifiées par l’orchestrateur. Les sources et preuves du compteur 12/12 ont reçu la confirmation ciblée indépendante dans REVIEW.md. Aucune validation physique OBS/iPhone ni approbation humaine nouvelle n’est ajoutée.

Le registre commun `manifest.json` et `FINAL-VERIFICATION.json` confirment les références finales, les liens locaux, les empreintes des exports B et un dépôt applicatif toujours propre au commit de base. Cette clôture ne modifie aucun artefact visuel ou code produit. La seule correction documentaire B porte sur « huit WebM » dans la livraison.

`UNDERCOVER_CONSOLIDATION_STATUS: AWAITING_APPROVAL`

`UNDERCOVER_MOTION_STATUS: AWAITING_APPROVAL`
