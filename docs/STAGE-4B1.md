# Studio Créateur 4B.1 — décisions UX et suivi de vérification

Base réelle : `f36e913`, branche `feat/creator-studio-ux-4b1`.
Le document `UX-CREATOR-WIREFRAMES.md`, déjà présent localement, est conservé comme
état observé de 4B.

## Retour humain et audit

Premier test humain iPhone effectué — refonte ergonomique nécessaire.
L’affichage est accessible mais l’UX n’est pas validée. Les parcours complets,
les autres appareils Safari et OBS restent à vérifier. Le nouveau lot ne peut pas
être déclaré ergonomiquement validé par ses seuls tests Chromium.

L’audit relève : page unique avec empilement de blocs, cartes trop hautes,
paramètres répétés dans Général et Actions, Actions/Conditions et effets en double,
publication privée difficile à distinguer d’un partage, deux sens d’installer,
exposition du JSON, des révisions et du langage d’expressions avant leur utilité.
Le laboratoire exige plusieurs opérations intermédiaires et changements d’onglet.
Les contrats, permissions, SQLite, SSE et définitions sont fonctionnels et conservés.

## Architecture d’interface retenue

- `/creator` : « Que souhaitez-vous faire ? », trois intentions et accès bibliothèque.
- `/creator/library` : catalogue de démonstration, ajouts et créations privées ;
  intention lancer/personnaliser explicite, pas de promesse de jeux officiels terminés.
- `/creator/new` : guide question par question ou démarrage avancé.
- `/creator/games/[id]` : espace d’édition dédié, avec sauvegarde locale conservée.
- `/creator/lab/[id]` : essai isolé ; sélecteur GM/joueurs/spectateur, projections et
  accès propres à chaque vue ; accès séparés disponibles pour plusieurs appareils.

Le layout du créateur garde l’accès propriétaire et les commandes en cours lors des
navigations internes. Les copies locales sont indexées par bibliothèque et jeu.
Les anciens liens `/creator#workspace=…&access=…` restent utilisables.
Aucun changement de schéma de base pour changer les textes.

## Simplicité sans perte

Personnaliser le compteur propose titre, description, objectif, contribution maximale
et participation répétée. Un compilateur d’édition commun génère la définition
exécutable ; il ne décide pas de l’état d’une partie. Une reconnaissance structurelle
conservatrice empêche de remplacer des règles avancées par un modèle simplifié.

Dans le Studio avancé, les questions expliquent rôles, données, actions et étapes.
Conditions, saisies, conséquences et étape suivante appartiennent à l’action.
Les références, versions du langage, documents JSON et manifests restent dans les
outils techniques. Ressources, partage et versions ont chacun leur emplacement.
Les versions figées restent privées, avec attribution et immutabilité.

## Test rapide et identités

Valider, enregistrer, préparer une session, inscrire deux joueurs de démonstration
et installer emploie exclusivement les API normales. Chaque commande critique garde
son identifiant de reprise. Le mode invitation est distinct et inscrit les vrais
joueurs avant préparation. Le compteur reconnu ouvre automatiquement sa collecte
avec la vraie commande GM `open`. Les jeux qui possèdent d’autres règles ou des
rôles personnalisés conservent leur étape initiale et leurs vraies commandes GM.
Aucune transition arbitraire n’est inventée pour ces définitions.

Le laboratoire appartient au GM qui contrôle les identités de démonstration. Un
joueur invité reçoit seulement son lien. Chaque vue lit le flux serveur avec son
propre accès ; la vue publique ne reçoit jamais la projection GM. Le changement de
vue détruit le contexte précédent et sa connexion. Aucun état complet secret n’est
transmis aux composants d’affichage public ou aux autres vues joueur.

## Indicateur Next.js

Une navigation réelle entre routes a reproduit l’avertissement Next.js
`missing-data-scroll-behavior` : la feuille globale déclare `scroll-behavior: smooth`
sur `html`, mais le document ne déclarait pas `data-scroll-behavior="smooth"`.
L’attribut recommandé est ajouté dans le layout racine. Aucun indicateur, contrôle
Next.js ou message d’erreur n’est masqué.

Le texte du badge iPhone initial n’a pas été communiqué : ce défaut vérifié ne
prouve pas qu’il était l’unique cause de « 1 Issue ». Un test navigateur en mode
**développement** contrôle les avertissements console, erreurs et hydratation pendant
un vrai parcours de navigation et de test. Son résultat figure dans le bilan final.

## Contrats et préservation des anciennes créations

- `compileCounterDefinition` est le compilateur d’édition commun au guide serveur
  et aux réglages simples. Il produit le même `GameDefinition` v2 borné, jamais un
  résultat de partie. Le moteur conserve toutes ses validations et projections.
- `counterRecipeFor` reconnaît exactement les règles modifiables sans perte, en
  ignorant uniquement titre, description, identifiant et numéro de version.
  Rôles, gardes, ressources, scènes ou données supplémentaires déclenchent un retour
  explicite au Studio avancé. La personnalisation du compteur historique v1 produit
  une nouvelle copie v2 avec l’objectif affiché ; son original, ses versions
  enregistrées et ses parties actives restent inchangés.
- `gameDefinitionStructureSchema` sert seulement à restaurer des formulaires dont
  les références ou limites sont momentanément incohérentes. L’API et l’exécution
  continuent d’exiger `gameDefinitionSchema`, avec **toutes** ses vérifications
  sémantiques et de sécurité. Aucun endpoint n’accepte le schéma d’édition seul.
- Aucun schéma SQL, mécanisme d’authentification, contrat SSE ou invariant du moteur
  d’exécution n’est remplacé. Les définitions v1 et v2 continuent à fonctionner.
- Les anciens liens privés de bibliothèque restent importables. Les anciennes
  maquettes et `/lab` de développement sont conservés ; ce dernier reste absent
  en production. Le laboratoire du créateur, accessible aussi en mode compilé,
  ne possède aucun privilège serveur de développement.

## Fiabilité de l’édition et des essais

L’éditeur conserve ses saisies dans le cache d’onglet existant, indexé par jeu et
bibliothèque. Le guide conserve aussi ses réponses lors d’un retour ou rechargement.
Les sauvegardes concurrentes sont refusées par le contrôle de version existant.
L’utilisateur compare les titres, descriptions et règles, puis choisit sa copie.
La copie remplacée reste disponible dans une sauvegarde locale secondaire. Un
accusé de réception tardif ne supprime pas une saisie plus récente.

La préparation conserve les identifiants de création, d’inscription et de commande
avant chaque requête. Une réponse perdue reprend le même reçu. Le redémarrage garde
également son étape reset/ouverture pour ne pas réinitialiser deux fois si l’ouverture
réussit mais que sa réponse est perdue. Un refus définitif libère la commande à
corriger ; un résultat réseau incertain conserve son identifiant de reprise.
Le laboratoire propose un contrôle facultatif qui tente une commande de gestion
avec un vrai jeton joueur et vérifie le refus serveur, sans privilège additionnel.

## Parcours effectivement livrés

| Espace                          | Disponible                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Accueil                         | Lancer, personnaliser, créer ; bibliothèque accessible séparément                                                          |
| Bibliothèque                    | Exemples distincts des jeux officiels, ajouts, créations et variantes, accès privé                                         |
| Réglages simples                | Titre, description, objectif, contribution maximale, participation répétée du compteur                                     |
| Guide                           | Deux modèles exécutables ; questions, retour, progression, récapitulatif, reprise locale                                   |
| Studio avancé                   | Rôles, données typées, actions à six questions, conditions ET/OU/NON et comparaisons, conséquences ordonnées, étapes       |
| Ressources / partage / versions | Références et droits conservés, copies privées figées, numéro proposé, filiation, métadonnées d’export secondaires         |
| Laboratoire                     | Test en un parcours, deux identités démo, vues GM/joueurs/public, vues séparées, redémarrage, vérification des permissions |
| Invitations réelles             | Partie distincte, inscriptions depuis d’autres appareils avant préparation, plateau public séparé                          |

L’apparence renvoie au plateau réel et explique les capacités absentes ; aucun
contrôle décoratif ne prétend modifier une scène OBS. Le desktop utilise une
navigation latérale ; le téléphone n’affiche qu’une section, avec Enregistrer et
Tester dans une barre fixe, tailles de champs adaptées et prise en compte des safe areas.
Les règles et déclarations de partage restent dans leurs emplacements respectifs.

## Isolation des tests navigateur

La suite étendue enchaînait assez de commandes depuis une même adresse pour atteindre
la limite réseau réelle de 240 requêtes/minute au cours du deuxième format. Les
refus 429 observés n’ont pas été supprimés du produit. `npm run test:e2e` exécute
chaque format successivement dans des processus neufs avec sa propre base temporaire.
Les trois projets et tous leurs scénarios sont conservés, ainsi que les contrôles
anti-abus. Les captures et traces sont séparées par format. Pour cibler un format :
`npm run test:e2e -- --project=mobile`. Un appel direct à `playwright test` sur les
trois projets partage le même serveur et peut encore atteindre cette limite.

## Limites et prochaine validation

- Les réglages simples reconnaissent le compteur commun ; les autres définitions
  se modifient dans le Studio avancé. Le guide ne couvre pas tous les jeux possibles.
- Deux joueurs de démonstration au test rapide, contrôlés manuellement par le GM.
  Pour un objectif qui exige davantage de contributions, autoriser la répétition ou
  utiliser le parcours avec de vrais invités. Pas d’ajout à un effectif déjà installé.
- Les créations non sauvegardées sont conservées dans l’onglet, pas dans un compte
  synchronisé. Fermer l’onglet ou effacer ses données peut perdre cette copie.
- Les ressources restent référencées avec leur état et un remplacement ; pas de
  transfert, récupération serveur ou nouvelle promesse de rendu de médias.
- Le prochain incrément doit suivre les retours ergonomiques de l’utilisateur sur
  son iPhone, puis une décision explicite sur la suite du moteur ou 4C. Les parcours
  complets, Safari iOS physique, les autres appareils et OBS restent à valider.

## Hors périmètre

Pas de 4C, Store public, Twitch, paiement, média transféré ou moteur de règles
parallèle. Aucun jeu officiel complet n’est ajouté implicitement.

## Bilan de vérification de la livraison

| Vérification exécutée                                                    | Résultat                                                                                                    |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                          | Format, 90 tests unitaires/intégration, TypeScript strict et compilation réussis                            |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 78 parcours réussis : 26 desktop, 26 tablette, 26 téléphone                                                 |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:lab` | 2 parcours développement réussis, dont navigation/création/jeu sans avertissement console ni erreur de page |
| `git diff --check`                                                       | Aucun problème d’espaces ou de patch                                                                        |

Les 87 tests métier de la base restent présents ; trois tests supplémentaires
vérifient le compilateur commun, ses bornes, son exécution réelle et le refus de
simplifier les définitions enrichies. Les huit scénarios créateur précédents sont
adaptés aux nouveaux écrans en conservant leurs assertions d’exécution, confidentialité,
filiation et immutabilité. Sept scénarios supplémentaires couvrent la personnalisation,
les invitations, les erreurs réseau, les reçus perdus, le redémarrage, la reprise des
saisies invalides et la conservation des choix guidés. Les scénarios existants de
sessions, reconnexion, permissions, anciennes maquettes et laboratoire sont conservés.

Un premier lancement groupé avait rencontré des refus anti-abus et un test rechargeait
avant la fin d’une navigation. L’isolation des processus et l’attente explicite de la
route corrigent le banc de test ; aucune protection serveur ni assertion de sécurité
n’a été retirée. Le passage complet final des trois formats réussit sans relance automatique.

### Fichiers principaux par lot

1. Navigation : layout `/creator`, contexte propriétaire, `creator-frame`, accueil,
   bibliothèque, création et routes dédiées d’édition/laboratoire.
2. Parcours : `creator-editor`, `creator-new`, `creator-simple`, éditeurs de rôles,
   données, actions, expressions, ressources et versions ; compilateur commun dans
   les contrats et délégation du guide serveur.
3. Laboratoire : `creator-lab`, `use-creator-launch`, `creator-laboratory` ; API de
   sessions et moteur existants réutilisés, sans nouveau privilège.
4. Fiabilité : `use-creator-draft`, textes d’erreur, CSS responsive, attribut Next.js
   du layout, tests, orchestration isolée et guides.

### Captures

Captures Chromium de données de test uniquement, **pas d’un iPhone physique**.
Les images complètes montrent aussi le contenu situé sous le premier écran ; la
barre d’action fixe peut apparaître au milieu d’une capture de page entière.

| Écran                 | Téléphone 390 × 844                              | Ordinateur 1440 × 1000                            |
| --------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Accueil               | [Voir](screenshots/4b1/accueil-mobile.png)       | [Voir](screenshots/4b1/accueil-desktop.png)       |
| Personnaliser         | [Voir](screenshots/4b1/personnaliser-mobile.png) | [Voir](screenshots/4b1/personnaliser-desktop.png) |
| Studio avancé         | [Voir](screenshots/4b1/studio-avance-mobile.png) | [Voir](screenshots/4b1/studio-avance-desktop.png) |
| Laboratoire / plateau | [Voir](screenshots/4b1/laboratoire-mobile.png)   | [Voir](screenshots/4b1/laboratoire-desktop.png)   |

La tablette est vérifiée à 768 × 1024. Le guide [TEST-STUDIO-4B1.md](TEST-STUDIO-4B1.md)
contient les commandes, liens, résultats attendus et checklist pour votre validation.
Le travail part de `f36e913` sur `feat/creator-studio-ux-4b1` ; le commit final et
l’état de publication sont indiqués dans le compte rendu de livraison Git.
