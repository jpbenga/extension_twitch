> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Relecture indépendante — consolidation Undercover et Motion TV

Référence : brief utilisateur intégral, DESIGN.md canonique et contrat partagé. Base actuelle : `d27458974b4c763e2911952b5295b4b0deae893d`. Relecture bornée : inspection initiale, retours matériels groupés, puis confirmation ciblée. Aucun rendu ni code applicatif modifié par cette relecture.

## 1. Disposition

| Chantier | Verdict de finition | État produit |
|---|---|---|
| A — Consolidation UX | **SHIP : prêt pour validation humaine** | `AWAITING_APPROVAL` |
| B — Motion TV | **SHIP : prêt pour validation humaine** | `AWAITING_APPROVAL` |

Ici, SHIP signifie que les propositions peuvent être présentées à la personne qui les validera. Il n’accorde aucune approbation et ne déclenche aucune intégration. Aucun rebuild ni nouvelle tournée esthétique demandés. Les corrections et recaptures ciblées identifiées ci-dessous sont closes.

## 2. Preuves examinées

**A.** Lecture des 24 maquettes HTML AC1–AC14, de leur inventaire, de DECISIONS.md et des captures desktop/mobile. Les vues complètes mobiles ont servi à lire le contenu ; les captures de viewport et de bas de page ont servi à vérifier la commande fixe. Le `generated-desktop.png` superseded n’a pas servi de référence finale.

Les contenus A/B dominent la préparation, les actions média ont une affordance de bouton, deux tours d’indices sont sélectionnés par défaut. Le conducteur conserve nommage, ajout, ordre, duplication, retrait confirmé et réutilisation. La vérification permet une image manquante et explique que l’ouverture du salon ne distribue ni ne démarre. Partie, manche et cycle d’élimination restent distincts.

Confirmation ciblée : retour Accueil et poignées d’AC2 desktop/mobile ; copie d’AC5 au bas du mobile ; titre AC12 à 390 et 320 px ; miniatures AC7/AC8. Les quatre miniatures modernes embarquent exactement les octets du PNG du renderer intégré `b3-duo-alpha.png`. `qa.json` couvre 24 surfaces sans débordement horizontal ni bouton mesuré sous 44 px aux viewports capturés. `dialog-confirmation.json` couvre les quatre confirmations à 320 et 390 px, sans chevauchement titre/fermeture. DECISIONS.md délimite explicitement AC9/10 comme études FOCUS et préserve les capacités B5 acquises.

**B.** Lecture des quatre projections autonomes, de runtime.js, des styles et de MOTION-SPECS.md ; inspection des preuves normales/réduites, de `QA.json`, `QA-CORRECTIONS.json`, `KEYFRAMES.json`, des douze fiches HTML et de cinq aperçus de fiches. Lecture échantillonnée des sept vidéos dans Chromium : les clips sont décodables et montrent les scénarios annoncés. Les images d’entrée finales sont arrêtées à 80 ms via WAAPI ; la présence des derniers PNG dans les fiches m01/m03/m04 a été vérifiée par comparaison binaire.

Les groupes de trois conservent leur taille pour 3/6/12 joueurs. Les dernières pages 4–6 et 10–12, le vote, les notes durables, la révélation et la paire suivante autorisée sont visibles dans les preuves. Les cartes et capsules restent en périphérie du cadre. Les entrées/sorties brèves et les maintiens sont séparés ; la réduction système utilise des fondus de 100 ms sans translation. L’interruption Duo→vote a été confirmée indépendamment dans Chromium : aucun Duo périmé ne réapparaît après trois secondes.

## 3. Écarts matériels priorisés

**Aucun écart matériel restant dans le lot confirmé.** Les points suivants avaient motivé une correction, sans élargir le chantier :

| Priorité | Écart initial | Résolution confirmée |
|---|---|---|
| P1 | Pagination finale remplaçant la révélation par des affectations sans camps | La projection finale reste en `reveal` ; trois camps et joueurs #4–6 sont conservés. |
| P1 | Preuves d’entrée capturées après l’achèvement de la Promise du scénario | Déclenchement asynchrone corrigé ; entrées finales arrêtées à 80 ms et consignées. |
| P2 | Titre AC12 mobile coupé face au bouton Fermer | Titre entier à 390 px, repli lisible à 320 px. |
| P2 | Note « images disponibles » contredisant une image manquante | Note neutre sur l’usage du même appareil ; reconnecter reste non bloquant. |
| P2 | Réduction manuelle laissant animer la lueur | Lueur masquée et non animée ; preuve sans translation. |
| P2 | Sorties normales de certaines transitions B2 seulement décrites | Séquences normales ajoutées via sortie puis entrée, distinctes de l’interruption immédiate. |
| P2 | Ambiguïté possible sur le remplacement de la régie acquise | Études AC9/10 préfixées FOCUS et exclusion explicite d’un remplacement de B5. |

Les corrections déjà prévues avant la relecture — retour Accueil, poignée d’ordre et aperçu exact du renderer — sont également confirmées, sans être comptées comme nouvelles incertitudes.

## 4. Corrections concrètes et clôture

Conserver le lot confirmé pour la présentation humaine. Les projets Stitch peuvent recevoir ces maquettes et fiches avec le statut `AWAITING_APPROVAL`. Les imports et leurs identifiants relèvent du manifeste de livraison ; cette relecture ne les transforme pas en écrans approuvés.

Conserver les contrats : les 7 blocs et 4 dispositions restent accessibles en avancé ; l’adoption TV est explicite et non destructive ; `/play` reste une route existante dont l’omission de nouvelle maquette est une proposition de parcours documentée. Une future intégration doit ajouter les intentions FOCUS à B5, en gardant ordre de passage, journal, accès, informations privées autorisées, réglages, erreurs et commandes existants.

Les projections Motion restent séparées : Duo sans affectations ni camps, affectations publiées distinctes, résultat final autorisé distinct, nouvelle paire uniquement dans sa projection autorisée. Les votes individuels ne sont pas exposés. L’ouverture tardive présente l’état durable sans rejouer le moment historique.

## 5. Limites

Cette conclusion porte sur des maquettes et prototypes hors application. Elle ne valide ni moteur, ni synchronisation réseau, ni permissions serveur, ni garanties de persistance. Pause/reprise, fin anticipée de manche, clôture de partie et abandon demeurent des hypothèses distinctes ; leurs conséquences sont à arbitrer avant intégration. Aucune victoire, révélation de secrets, révocation d’accès ou suppression de données n’est déduite de ces confirmations.

Les confirmations statiques ne prouvent pas un focus trap ni le traitement d’Échap : le composant accessible existant doit être repris ultérieurement. Les mesures de viewport et l’émulation reduced-motion ne remplacent pas un test physique iPhone/Safari ou OBS. Les vidéos ont un fond de lecture ; elles n’attestent pas l’alpha, traité séparément par les PNG et le mode overlay. La sensation finale reste soumise à validation humaine.

### Addendum ciblé — compteur complet à 12 joueurs

Une vérification complémentaire de B a trouvé un cas non couvert par le compteur initial : « 12 / 12 votes reçus » passait sur deux lignes et agrandissait le cartouche à environ 279 px au lieu de 180 px. Cet écart P2 est désormais **clos**.

Confirmation limitée à la source et aux preuves corrigées : la règle est scindée pour l’effectif 12, avec compteur de 64 px, ligne non sécable et cartouche conservé à 720 × 180 px. Elle s’applique dès 0 / 12 afin d’éviter un changement de taille au dixième vote. `QA-VOTE12.json` rapporte les valeurs 0, 9, 10, 11 et 12, en normal et réduit : mêmes limites de cartouche et de compteur pour les dix observations. Les captures `vote12-complete-normal-alpha.png` et `vote12-complete-reduced-390.png` ont été examinées : le libellé complet tient sur une ligne et la progression reste dans le cartouche.

Seule la fiche m07 doit être remplacée dans la livraison Stitch si elle utilisait l’ancien compteur. Les autres fiches, les effectifs 3/6 et le chantier A ne sont pas rouverts. Ce contrôle n’inclut pas une nouvelle inspection des imports Stitch. Le verdict de finition B reste **SHIP : prêt pour validation humaine**, avec le statut **AWAITING_APPROVAL**.

`UNDERCOVER_CONSOLIDATION_STATUS: AWAITING_APPROVAL`

`UNDERCOVER_MOTION_STATUS: AWAITING_APPROVAL`
