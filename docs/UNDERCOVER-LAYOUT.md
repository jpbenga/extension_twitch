# Jalon 7 — personnalisation du layout de l’overlay Undercover

## Extension TV approuvée — versions conservées

Les nouvelles préparations utilisent `createUndercoverTvLayout()` et un layout
`schemaVersion: 2`, avec sept blocs et quatre presets adaptés aux capsules et aux
apparitions TV. Les anciens layouts `schemaVersion: 1`, y compris personnalisés,
restent inchangés : `createUndercoverLayout()` conserve ses valeurs historiques.

Le renderer partagé choisit explicitement sa présentation d’après cette version.
Les blocs TV s’affichent selon les événements réellement publics ; leur absence
momentanée du plateau n’enlève pas leurs réglages dans l’éditeur. Les minima de
`constrainWidget` dépendent de la version. Aucun layout enregistré n’est remplacé
sans la confirmation existante de l’utilisateur.

Les données des contenus et leurs associations restent des projections serveur,
pas des paramètres de position. Voir [séries et broadcast](UNDERCOVER-SERIES-BROADCAST.md)
et [guide humain actuel](TEST-UNDERCOVER-SERIES-TV.md). Les sections historiques
ci-dessous restent applicables aux layouts v1.

## Base et périmètre

Base vérifiée : `4183dce`, `feat/stream-preview-obs`, propre et identique à la tête
GitHub. Elle contient le recentrage SaaS et le workflow OBS testé humainement.
Branche de travail : `feat/undercover-overlay-layout`.
Le jalon autorise explicitement cet éditeur ciblé ; les anciennes consignes de
reporter un éditeur d’overlays restent applicables aux outils universels, pas à
cette personnalisation Undercover. Aucun autre jeu, Store, paiement ou scène libre.

## Modèle borné, sans CSS ni script utilisateur

`@extension-twitch/contracts/undercover-layout` définit un schéma strict versionné
v1 pour Undercover. Cadre fixe 1920×1080, marge 24 pixels. Sept blocs obligatoires :
titre, phase/indices, manche/actifs, joueurs, progression du vote, résultat et
journal public. Positions et dimensions numériques bornées, minimum propre à chaque
bloc ; aucun champ de code, URL, ressource, HTML, secret ou visibilité arbitraire.

Quatre presets : Équilibré, Joueurs en bas, Joueurs à gauche, Centré. Ce sont des
copies indépendantes, pas des règles de jeu. Le retour au défaut est confirmé.
L’éditeur utilise Pointer Events et capture de pointeur, sans nouvelle dépendance.
Déplacements et tailles s’alignent par pas de 8 pixels ; champs numériques et
flèches clavier offrent une alternative. Les bornes sont recalculées après chaque
édition. Les superpositions de blocs sont signalées, mais autorisées explicitement.
Aucun bouton ne peut supprimer tous les blocs ou masquer le résultat.

Les joueurs sont des **places d’inscription 1–12**, sans référence à un camp secret.
Ordre visuel indépendant de l’ordre de parole ; grille, horizontal (6 par ligne),
vertical ou libre. En libre, chaque carte possède un rectangle relatif au groupe
joueurs ; la grille est convertie sans déplacement des cartes existantes. Les
cartes et leur groupe sont déplaçables/redimensionnables ; les places absentes restent
conservées. Pas de liaison au nom ou au rôle, ni modification des permissions.

## Sauvegarde et concurrence

Avant création de partie : le formulaire garde la disposition dans **sessionStorage
propre à l’onglet**, comme ses réglages actuels. Le renderer utilise des noms fictifs
explicitement signalés, sans faux événement ou partie démarrée. Ce n’est pas un
rendu de gameplay simulé : mêmes composants, uniquement un état de préparation.
Au lancement, l’API officielle accepte `overlayLayout` facultatif, séparé des
GameSettings et validé strictement. Le reçu de création comprend cette option ;
une réponse perdue se reprend avec la même demande et le même accès.

Dans la partie : `LobbyState.overlayLayout?`, persistant dans le blob SQLite existant.
La commande GM `overlay.configure` utilise le circuit normal : autorisation serveur,
validation stricte, expectedVersion, reçu d’idempotence, transaction et diffusion SSE.
Pas de nouvelle table ni migration destructrice. La disposition est publique et
est copiée explicitement dans la projection ; les mots et préparations ne le sont pas.
Les anciennes parties sans ce champ obtiennent le défaut de rendu, sans mutation de
leur état ni de leur définition. Rejouer conserve le layout ; réinitialiser le salon
le conserve aussi, mais révoque bien les joueurs selon la commande existante.

`/sessions/:id/overlay` exige la capacité GM existante, sans la transmettre aux URLs
publiques. Le canvas lit **un flux public indépendant**, jamais une projection GM
filtrée dans React. Les ajustements non enregistrés et leur base restent dans
sessionStorage, avec avertissement navigateur avant fermeture lorsque possible.
Un changement de gameplay n’est pas un conflit de layout ; un layout distant différent
alors qu’une édition locale est modifiée bloque l’enregistrement. Les ajustements
locaux restent lisibles ; charger l’autre disposition exige confirmation. Une réponse
incertaine conserve le reçu de commande et propose Réessayer sans nouvel écrasement.

## Source unique et diffusion

`BroadcastOverlay` reçoit exclusivement `PublicSessionView`, plus un override de
layout dans l’éditeur. Les coordonnées sont converties proportionnellement dans le
même cadre 16:9. `BroadcastFeed` ne change pas : l’aperçu, le comparatif et OBS lisent
la disposition depuis la même projection. Aucun faux renderer d’édition parallèle.

La source `/sessions/:id/obs` reste transparente, sans contrôles et sans changement
URL après sauvegarde ou rejeu. L’éditeur ajoute uniquement le damier et les poignées.
Les événements temporaires gardent leur curseur d’époque SSE ; ni une ouverture tardive
ni une reconnexion ne rejoue les effets historiques. Le journal reste public et borné
à la partie courante. Les mots apparaissent uniquement après révélation moteur.
Le plateau classique `/public` reste son interface de lecture ; le layout concerne
le rendu de diffusion partagé `/stream`, `/obs` et le comparatif, pas cette page.

## Limites explicites

- Éditeur de layout **Undercover**, pas de scène universelle, couche multimédia,
  rotation, animation utilisateur, import, timeline ou migration de GameDefinition.
- Disposition enregistrée par partie ; modèle local de préparation dans l’onglet,
  pas bibliothèque de layouts synchronisée ou propriété de compte inexistante.
- Le serveur borne la géométrie, mais ne peut garantir l’esthétique de tous les
  chevauchements. Les cartes libres peuvent se superposer ; vérifier le rendu avec
  l’effectif final. Les textes longs et petits blocs peuvent être tronqués ; pas
  de réduction automatique destructrice de contenu ou de réécriture des secrets.
- Le preset vertical à 12 joueurs est dense. Préférer la grille et une grande zone
  joueurs pour une lecture distante. Les tailles de cartes restent relatives au groupe.
- Ordinateur recommandé pour composer ; les champs restent utilisables sur mobile,
  mais les poignées visuelles d’un canvas réduit ne prétendent pas remplacer le confort
  desktop. La régie mobile garde son ergonomie et ses commandes habituelles.
- Pas de sauvegarde serveur à chaque mouvement : Enregistrer applique aux spectateurs
  et à OBS. Les ajustements restent locaux avant cette action.
- Test humain du workflow OBS précédent validé par le testeur. Les nouveaux layouts,
  leur ergonomie iPhone et leur rendu OBS réel restent à vérifier par lui.

Guide : [TEST-UNDERCOVER-OVERLAY.md](TEST-UNDERCOVER-OVERLAY.md).

## Retour de vérification visuelle

Le passage navigateur a permis de corriger une contrainte HTML `step` trop stricte
qui bloquait le lancement depuis le formulaire de préparation. Les coordonnées
entières acceptent désormais chaque pixel ; le glissement garde son pas de 8 pixels.
Le nombre de joueurs et le mode sont aussi restaurés au rechargement de la préparation.
Les noms des joueurs sont prioritaires dans les valeurs révélées du rendu de diffusion
pour éviter de les tronquer derrière un long intitulé technique. Le plateau classique
et les interfaces privées conservent leurs libellés complets.

## Captures navigateur

Données fictives, aucun lien privé ni accès affiché. Le rendu final montre uniquement
les mots dont la révélation est déjà autorisée par le résultat de la partie.

- [Éditeur ordinateur](screenshots/undercover-layout/editeur-desktop.png).
- [Éditeur tablette](screenshots/undercover-layout/editeur-tablet.png).
- [Éditeur téléphone](screenshots/undercover-layout/editeur-mobile.png).
- [Overlay transparent 1920×1080](screenshots/undercover-layout/obs-1920.png).

Ces captures proviennent de Chromium ; ce ne sont ni des captures OBS ni celles
d’un iPhone physique. La capture PNG OBS est RGBA, avec alpha nul au coin du cadre.

## Vérifications exécutées

Node 24.19.0, npm 11.9.0 et Chromium système. Les bases et processus de test sont
isolés ; les protections de permissions, d’origine et de débit restent actives.

| Commande              | Résultat                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run check`       | Format, **148 tests** unitaires/intégration (19 fichiers), TypeScript strict et compilation réussis |
| `npm run test:layout` | **6 réussis**, deux scénarios × ordinateur/tablette/téléphone                                       |
| `npm run test:stream` | **9 réussis**, rendu partagé, ouverture tardive, reconnexion et confidentialité                     |
| `npm run test:games`  | **12 réussis**, parties Undercover, égalités, éliminations et rejeu                                 |
| `npm run test:e2e`    | **42 réussis**, catalogue, préparation, invités, persistance et anciens liens                       |
| `npm run test:design` | **12 réussis**, dialogues personnalisés et responsive                                               |
| `npm run test:legacy` | **60 réussis**, compatibilité locale de l’ancien Studio, pas réouverture produit                    |
| `npm run test:lab`    | **6 réussis**, outils de développement, vrais moteurs et absence d’erreurs Next/hydratation         |

Total : **147 cas navigateur**, dont 81 produit compilé et 66 compatibilité/développement.
Les 138 tests métier précédents sont conservés, avec 10 nouveaux tests. Les reprises
ciblées de diagnostic ne sont pas ajoutées comme cas uniques. Les derniers ajustements
de saisie numérique ont été suivis d’un nouveau check complet et des six parcours layout.
Le CI inclut la nouvelle suite, sans revendiquer son exécution distante.

Le scénario nouveau complet configure trois joueurs, choisit un preset, agrandit un
bloc, recharge la préparation, crée la session, ouvre GM, trois joueurs, aperçu et OBS
dans des contextes distincts. Il réalise les deux tours, les vrais votes, la victoire,
la révélation autorisée et le rejeu. L’autre scénario vérifie douze cartes, déplacement
clavier, redimensionnement par vrai pointeur, limites, saisie chiffre par chiffre,
ordre, cartes libres, sauvegarde/restauration et conflit entre deux onglets avec accès
GM explicitement importé. Le test à douze valide l’éditeur, pas une deuxième partie
complète à douze dans un navigateur. Les tests moteur jouent le format pour chaque
effectif de 3 à 12, avec le maximum d’Undercover autorisé et tous les tours d’indices.

L’aperçu initial est explicitement marqué préparation ; seuls les essais après
création utilisent le flux réel. Dans la partie, l’éditeur et les rendus publics lisent
leur propre projection publique. Le layout ne contient que des coordonnées et un ordre
de places, sans valeurs de mots/camps. Les contrôles HTTP vérifient le refus joueur,
les entrées malformées, le reçu exact, le conflit, la persistance SQLite après arrêt et
réouverture du service, puis le rejeu. La suite de persistance historique continue à
vérifier les redémarrages de processus réels.

Aucun test physique des nouveaux layouts sur iPhone, Safari/VoiceOver ou OBS n’est
revendiqué par l’agent. Le test humain positif du workflow OBS précédent reste acquis ;
la lisibilité de chaque nouvelle disposition dans la scène de diffusion réelle reste
à apprécier par le testeur. Les superpositions libres et les textes longs demandent
un contrôle visuel, malgré les contraintes géométriques.
