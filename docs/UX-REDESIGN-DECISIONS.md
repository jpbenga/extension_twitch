# Jalon 8 — décisions UX, avant implémentation

Base vérifiée : `5d167d0`, branche `feat/undercover-overlay-layout`, propre et identique
à GitHub. Elle conserve le jeu complet, le layout Undercover et le rendu partagé OBS.
Travail : `feat/ux-six-experiences-themes`. Les captures `screenshots/ux8/before`
proviennent de la version compilée de cette base, avec données fictives et liens masqués.

## Diagnostic et arbitrages

| Écran / intention                             | Forces constatées                                                  | Problèmes constatés                                                                  | Piste du wireframe                        | Décision retenue                                                                                                                 | Pourquoi / risque à vérifier                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Accueil : lancer ou reprendre                 | Reprise avec véritable vérification GM ; jeux incomplets honnêtes  | Un clic supplémentaire pour découvrir Undercover ; accueil sans jeu visible          | Jeu prioritaire dans l’accueil            | Présenter Undercover directement ; reprise prioritaire si disponible ; futurs jeux compacts                                      | Le catalogue reste accessible et partagé ; ne pas inventer d’historique de compte                                        |
| Configuration : choisir les règles autorisées | Réglages stricts, résumé effectif, sauvegarde et layout existants  | Mots et détails trop tôt ; formulaire homogène long                                  | Essentiel puis options repliables         | Effectif, mode de participation et tours visibles ; mots/répartition/limite repliables ; résumé court ; overlay séparé repliable | Ne pas ajouter un menu de variante à un seul choix ; ne pas limiter les tours à 1–3 alors que 1–5 sont exécutés          |
| Salon : réunir les invités                    | Liens publics/privés séparés, retrait révoquant réellement l’accès | Nombre d’inscrits confondu avec présence ; disponibilité pas expliquée               | Invitation + participants + démarrage     | Liste compacte, inscrits/connexion/Prêt distingués, invitation et partage natif si supporté, gestion secondaire                  | « Prêt » n’est pas une condition moteur : ne pas l’imposer ; l’effectif exact est validé à la préparation                |
| GM : prochaine action                         | Actions filtrées par le serveur, confirmation, tours/votes réels   | Titre/phase/effectif répétés ; cartes lourdes ; gestion sur desktop toujours visible | Focus joueur actif + progression + action | Enveloppe opérationnelle Partie/Joueurs/Plateau ; une section visible ; focus indices/vote/résultat ; gestion repliée            | Réutiliser les actions existantes, pas inventer une commande commencer combinant deux mutations non atomiques            |
| Joueur : mon information / mon geste          | Projection propre et vote tactile réels                            | Navigation de gestion partagée ; roster/journal et badges trop présents              | Carte privée puis action de vote          | Enveloppe compagnon sans onglets GM ; nom et état ; mot masquable ; action prioritaire ; détails secondaires repliés             | Masquer le mot visuellement n’est pas une frontière serveur ; les permissions et projections restent la vraie protection |
| Public / OBS : regarder l’émission            | Rendu unique transparent, SSE, layout personnalisable              | Informations continues et journal longs ; aperçu entouré de panneaux                 | Phase / joueur courant / vote / résultat  | Conserver les sept widgets et leurs positions ; résumer la phase, séparer progression et résultat ; aides de diffusion repliées  | Aucun déplacement de layout déjà enregistré ; aucune projection GM utilisée pour construire le public                    |
| Laboratoire : essayer les rôles               | Identités distinctes, ouverture sur iPhone et comparaison publique | Long préambule, nombreux liens concurrents, outils avancés ouverts au même niveau    | Sélecteur + rôle + aperçu                 | Sélecteur près du contenu, identité persistante, liens/essai/diagnostic regroupés, comparaison facultative                       | Ne pas monter tous les rôles privés simultanément ; garder les anciens accès et les outils de reprise                    |

## Navigation cible et décisions non littérales

`/` et `/play` → `/play/undercover` → salon privé `/sessions/:id/gm` → régie en place.
Les joueurs gardent `/sessions/:id/player/:participantId`, les invitations `/join`.
Le laboratoire reste `/play/lab/:id`, séparé des interfaces normales. `/stream`, `/obs`
et `/overlay` (layout Undercover) conservent leurs liens et le même renderer.
Les fragments existants restent reconnus. Revenir à l’accueil n’arrête jamais la partie.

Le salon installe la définition, puis la régie distribue les mots : ces deux gestes
ont des conséquences différentes. Nous les clarifions plutôt que de fabriquer une
transition ou de prétendre vérifier que tous sont prêts. Aucun menu de mode/rôle
spécial non livré, aucune case « connecté » déduite d’une simple inscription.

Le jalon 7 a déjà livré le déplacement/redimensionnement des widgets : l’intention
« préparer le futur positionnement » du wireframe 8 ne justifie pas son retrait.
Les layouts et leurs sauvegardes restent actifs, sans éditeur universel nouveau.

## Trois thèmes, deux portées explicites

- Application : choix dans l’en-tête, localStorage de ce navigateur, sans compte ni
  synchronisation interappareils promise. Broadcast Studio par défaut sans préférence.
- Émission : choix officiel à la préparation, conservé dans la session et publié avec
  la projection publique ; stable pendant la partie et après rejeu. Aucun changement
  de préférence privée ne le remplace. Anciennes sessions sans choix : Neon Show,
  continuité de leur identité sombre/violette.
- Les mêmes composants/layouts/actions utilisent les tokens sémantiques : aucune règle
  de jeu, permission ou commande dépend d’un thème. Pas d’injection de CSS ou de couleur
  arbitraire ; seules les trois valeurs officielles sont acceptées côté serveur.
- Le cadre de diffusion applique son propre thème, y compris dans l’éditeur et le
  comparatif ; il ne dépend pas des tokens hérités de l’interface privée du GM.

## Validation

La validation humaine du workflow OBS précédent est acquise. La nouvelle ergonomie,
les trois thèmes, le clavier Safari et les layouts restent soumis au prochain essai.
Tests moteur/API, navigateur multi-contextes, 320/390/768/1440 pixels et captures
permettront une livraison technique ; ils ne valent pas une validation humaine.

## Réalisation et limites

L’API et les mécanismes de jeu restent en place. Le seul ajout de présentation
serveur est un identifiant de thème d’émission strict, facultatif et conservé avec
la session ; les anciennes sessions n’ont pas à être migrées. Le descripteur GM de
préparation expose aussi des bornes d’effectif issues de la définition et des réglages
figés, sans mot ni attribution publique. Ces bornes guident le bouton du salon ;
le moteur reste l’autorité de validation complète, y compris pour les anciennes parties.

`UndercoverRoom` fournit les enveloppes salon, GM et compagnon ; les commandes
réutilisent useSession, GamePanel, PlayPanel, ActionForm et les confirmations existantes.
Les routes génériques et de maintenance gardent leurs contrats. Le salon n’invente
pas un effectif cible inscrit en base : il affiche les inscrits et la présence réelle.
Les anciens fragments Session/Jeu sont reconnus et mappés vers Partie dans la régie.

L’accueil et le catalogue partagent OfficialCatalog. Le laboratoire conserve une
seule projection privée montée, un bandeau d’identité et le comparatif public séparé.
Le lien GM à copier et l’aperçu sont directs ; les autres accès sont regroupés après
le contenu de rôle. Le journal et les outils exceptionnels ne sont plus montrés
au joueur ordinaire. Sa carte peut être masquée visuellement ; aucune permission
ne dépend de ce bouton. Au vote, les actions passent avant la carte dans l’ordre du DOM comme dans la lecture
visuelle, pour conserver une navigation clavier cohérente ; le format de données reste identique.

Le plateau `/public` reste le lecteur classique compatible, avec son thème public
et sans légende technique de version. `/stream`, `/obs`, le comparatif et l’éditeur
réutilisent BroadcastOverlay, dont la phase des indices privilégie l’orateur courant.
Les sept blocs, rectangles et presets du jalon 7 restent enregistrés inchangés.
Les outils OBS et l’explication des interactions spectateurs sont repliés dans
l’aperçu, afin de laisser le cadre de diffusion au premier plan.

Les trois thèmes n’ajoutent ni police externe, ni bibliothèque UI, ni image protégée.
La préférence d’application utilise localStorage (même navigateur/origine), avec
événement Storage pour les autres onglets. Un appareil sans préférence ou avec une
valeur inconnue utilise Broadcast Studio. L’application démarre avec ce défaut avant
lecture du stockage ; un bref changement de palette au chargement reste possible.
Aucun avertissement de développement n’est masqué pour supprimer cet effet.

Le thème d’émission n’a pas de commande de modification pendant la partie : choisir
une nouvelle préparation est volontaire. Une extension future pourra le faire avec
une permission GM explicite, sans coupler l’état à la préférence locale. Pas de compte,
réglage global SaaS, abonnement, nouveau jeu ni éditeur universel introduit ici.

L’éditeur de layout reste plus confortable sur ordinateur. Les thèmes ne rendent pas
magiquement lisible un bloc réduit à sa taille minimale ou un texte très long : les
bornes, avertissements et le contrôle OBS restent nécessaires.

## Captures avant / après

Les vues Avant ont été capturées depuis la version compilée `5d167d0`, avec une base
SQLite temporaire, avant modification. Les vues Après viennent des véritables parcours
Chromium de cette livraison. Ce sont des scénarios fictifs : invitations masquées,
aucun accès privé en clair. Les mots visibles dans le compagnon sont ceux de son propre
joueur fictif ; ceux du résultat public ont déjà été révélés par les règles.

| Expérience                        | Avant, mobile                                           | Après, mobile                                                     |
| --------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| Accueil                           | [Voir](screenshots/ux8/before/accueil-mobile.png)       | [Voir](screenshots/ux8/after/accueil-broadcast-studio-mobile.png) |
| Configuration                     | [Voir](screenshots/ux8/before/configuration-mobile.png) | [Voir](screenshots/ux8/after/configuration-mobile.png)            |
| Salon                             | [Voir](screenshots/ux8/before/salon-mobile.png)         | [Voir](screenshots/ux8/after/salon-mobile.png)                    |
| Régie en préparation              | [Voir](screenshots/ux8/before/regie-mobile.png)         | [Voir](screenshots/ux8/after/regie-preparation-mobile.png)        |
| Compagnon en préparation          | [Voir](screenshots/ux8/before/joueur-mobile.png)        | [Voir](screenshots/ux8/after/joueur-preparation-mobile.png)       |
| Laboratoire                       | [Voir](screenshots/ux8/before/laboratoire-mobile.png)   | [Voir](screenshots/ux8/after/laboratoire-mobile.png)              |
| Source OBS, préparation 1920×1080 | [Voir](screenshots/ux8/before/obs-1920.png)             | [Voir](screenshots/ux8/after/obs-preparation-1920.png)            |

Ces comparaisons présentent la même intention et, pour la régie/le compagnon/l’overlay,
la préparation. Les noms et effectifs fictifs peuvent différer ; pas de comparaison
pixel à pixel ou de gain ergonomique chiffré revendiqué. Captures supplémentaires :

- [Régie pendant les indices](screenshots/ux8/after/regie-mobile.png) et [petit format 320 px](screenshots/ux8/after/regie-320.png).
- [Compagnon avec son mot](screenshots/ux8/after/joueur-mobile.png).
- [Laboratoire ordinateur](screenshots/ux8/after/laboratoire-desktop.png) et [aperçu d’émission](screenshots/ux8/after/apercu-desktop.png).
- [Broadcast Studio](screenshots/ux8/after/accueil-broadcast-studio-desktop.png), [Neon Show](screenshots/ux8/after/accueil-neon-show-desktop.png), [On Air Premium](screenshots/ux8/after/accueil-on-air-premium-desktop.png).
- [Résultat public autorisé](screenshots/ux8/after/obs-resultat-1920.png).

Le PNG de source est RGBA, 1920×1080, avec un alpha nul au coin hors panneaux.
Cela vérifie un navigateur, pas une nouvelle validation dans OBS physique.

## Vérifications exécutées

Environnement : Node 24.19.0, npm 11.9.0, Chromium système. Bases et processus isolés,
authentification et limites réelles conservées. Aucune assertion moteur supprimée.

| Commande              | Résultat                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run check`       | Format, **153 tests** unitaires/intégration (20 fichiers), TypeScript strict et compilation réussis |
| `npm run test:ux`     | **12 réussis**, 3 parcours × desktop, tablette, mobile et petit mobile                              |
| `npm run test:e2e`    | **42 réussis**, catalogue, sessions, accès, reprise, reconnexion et maquettes historiques           |
| `npm run test:games`  | **12 réussis**, parties Undercover complètes, égalités, éliminations, délégation et rejeu           |
| `npm run test:stream` | **9 réussis**, source publique partagée, confidentialité, reconnexion et transparence               |
| `npm run test:layout` | **6 réussis**, presets, déplacement, sauvegarde, conflits et partie réelle                          |
| `npm run test:design` | **12 réussis**, dialogues, focus, erreurs, navigation mobile et copie privée                        |
| `npm run test:legacy` | **60 réussis**, ancien Studio en maintenance locale explicite, données et règles préservées         |
| `npm run test:lab`    | **6 réussis**, développement, vraies commandes, dialogues et absence d’erreurs Next/hydratation     |

Total : **159 cas navigateur**, dont 93 produit compilé et 66 compatibilité/développement.
Les passages ciblés de diagnostic ne sont pas comptés plusieurs fois. Les contrôles
unitaires couvrent les trois palettes et le thème serveur persisté indépendamment
des modifications de layout/rejeu, plus les contrôles métier et privés antérieurs.

Le nouveau scénario avec invités utilise GM, trois joueurs et OBS dans des contextes
séparés, exécute deux tours d’indices, les votes, la victoire, la révélation et le
rejeu. Les trois thèmes sont changés sur l’accueil, la régie et le compagnon, sans
modifier le thème de l’émission ni la version autoritaire par un simple choix privé.
Stockage absent/invalide, rechargement, accès au clavier, carte masquée et ordre DOM
prioritaire du vote sont vérifiés. Les tests de source existants vérifient aussi une
ouverture tardive et une vraie interruption/reprise SSE sans événements rejoués.

Les anciens tests UI ont été adaptés aux disclosures, au titre d’identité du compagnon
et aux couleurs sémantiques, au lieu d’exiger un ancien emplacement ou un violet
littéral. Les contrôles de droits, mots privés, refus, synchronisation, événements
uniques et restauration sont maintenus. Les variantes de couleur sont comparées au
token effectif, avec focus visible de 3 pixels vérifié. Aucun test n’est désactivé.

Le workflow CI inclut test:ux ; son exécution distante n’est pas revendiquée. Aucun
iPhone physique, Safari/VoiceOver réel ou nouvel essai OBS n’est réalisé par l’agent.
Le workflow OBS précédent est validé par l’utilisateur ; la nouvelle UX et les thèmes
restent à valider humainement via [TEST-UX-THEMES.md](TEST-UX-THEMES.md).
